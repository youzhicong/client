import {
  getAISettings,
  getAIChatEndpoint,
  normalizeAISettings,
  type AIMessage,
  type AISettings
} from '@/services/ai'
import { createAgentMemoryStore } from './memory'
import { getToolByName } from './tools'
import type {
  AgentContext,
  AgentDefinition,
  AgentRunOptions,
  AgentRunResult,
  AgentStep,
  AgentToolDefinition
} from './types'

const createStepId = () =>
  `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const buildToolsDescription = (tools: AgentToolDefinition[]) =>
  tools
    .map((tool) => {
      const params = Object.entries(tool.parameters)
        .map(
          ([name, meta]) =>
            `  - ${name} (${meta.type}${meta.required ? ', required' : ''}): ${meta.description}`
        )
        .join('\n')
      return `- ${tool.name}: ${tool.description}\n${params || '  - 无参数'}`
    })
    .join('\n\n')

export const buildAgentSystemPrompt = (
  agent: AgentDefinition
) => `${agent.systemPrompt}

你可以使用以下工具：
${buildToolsDescription(agent.tools)}

## 工具调用协议
当你需要调用工具时，只输出一行 JSON，不要输出其它文字：
{"type":"tool","name":"工具名","input":{...}}

当你已经获得足够信息、可以回答用户时，只输出一行 JSON：
{"type":"final","content":"最终回答，支持 Markdown"}

规则：
1. 每次最多输出一个 JSON 对象
2. 优先使用工具获取事实，不要编造接口、路径、数据
3. 最终回答使用中文，结构清晰，可执行
4. 如果工具结果已经足够，直接输出 final`

type ParsedAgentAction =
  | { type: 'tool'; name: string; input: Record<string, unknown> }
  | { type: 'final'; content: string }
  | null

const extractJsonObject = (text: string) => {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed

  const match = trimmed.match(/\{[\s\S]*\}/)
  return match?.[0] || null
}

export const parseAgentAction = (text: string): ParsedAgentAction => {
  const jsonText = extractJsonObject(text)
  if (!jsonText) return null

  try {
    const parsed = JSON.parse(jsonText) as {
      type?: string
      name?: string
      input?: Record<string, unknown>
      content?: string
    }

    if (parsed.type === 'tool' && parsed.name) {
      return {
        type: 'tool',
        name: parsed.name,
        input: parsed.input || {}
      }
    }

    if (parsed.type === 'final' && parsed.content) {
      return { type: 'final', content: parsed.content.trim() }
    }
  } catch {
    return null
  }

  return null
}

const requestCompletion = async (
  settings: AISettings,
  messages: AIMessage[],
  options: {
    temperature?: number
    maxTokens?: number
    signal?: AbortSignal
  } = {}
) => {
  const normalizedSettings = normalizeAISettings(settings)
  const endpoint = getAIChatEndpoint(normalizedSettings)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${normalizedSettings.apiKey}`
    },
    signal: options.signal,
    body: JSON.stringify({
      model: normalizedSettings.model,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 1200,
      stream: false
    })
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `模型请求失败: ${response.status}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return data.choices?.[0]?.message?.content?.trim() || ''
}

export const streamCompletion = async (
  settings: AISettings,
  messages: AIMessage[],
  options: {
    temperature?: number
    maxTokens?: number
    onDelta?: (chunk: string) => void
    signal?: AbortSignal
  } = {}
) => {
  const normalizedSettings = normalizeAISettings(settings)
  const endpoint = getAIChatEndpoint(normalizedSettings)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${normalizedSettings.apiKey}`
    },
    signal: options.signal,
    body: JSON.stringify({
      model: normalizedSettings.model,
      messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 1600,
      stream: true
    })
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `流式请求失败: ${response.status}`)
  }

  if (!response.body) {
    return requestCompletion(settings, messages, options)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = parsed.choices?.[0]?.delta?.content || ''
        if (!delta) continue
        fullText += delta
        options.onDelta?.(delta)
      } catch {
        // ignore malformed sse chunk
      }
    }
  }

  if (fullText.trim()) return fullText.trim()

  return requestCompletion(settings, messages, {
    ...options,
    signal: options.signal
  })
}

const pushStep = (
  steps: AgentStep[],
  step: Omit<AgentStep, 'id' | 'timestamp'>,
  onStep?: (step: AgentStep) => void
) => {
  const next: AgentStep = {
    ...step,
    id: createStepId(),
    timestamp: Date.now()
  }
  steps.push(next)
  onStep?.(next)
  return next
}

export const runAgent = async (
  agent: AgentDefinition,
  options: AgentRunOptions
): Promise<AgentRunResult> => {
  const settings = options.settings ?? getAISettings()
  const steps: AgentStep[] = []
  const memory = options.context?.memory || createAgentMemoryStore()
  const sessionId =
    options.context?.sessionId ||
    `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const context: AgentContext = {
    sessionId,
    userInput: options.userMessage,
    memory,
    extra: options.context?.extra
  }

  pushStep(
    steps,
    {
      type: 'agent_start',
      agentId: agent.id,
      agentName: agent.name,
      content: `启动 ${agent.name}`
    },
    options.onStep
  )

  const transcript: AIMessage[] = [
    {
      role: 'system',
      content: buildAgentSystemPrompt(agent)
    },
    ...(options.history || []),
    {
      role: 'user',
      content: options.userMessage
    }
  ]

  const maxIterations = agent.maxIterations ?? 6

  for (let index = 0; index < maxIterations; index += 1) {
    const modelReply = await requestCompletion(settings, transcript, {
      temperature: 0.2,
      maxTokens: 900,
      signal: options.signal
    })

    const action = parseAgentAction(modelReply)

    if (!action) {
      pushStep(
        steps,
        {
          type: 'thought',
          agentId: agent.id,
          agentName: agent.name,
          content: modelReply.slice(0, 240)
        },
        options.onStep
      )
      transcript.push({ role: 'assistant', content: modelReply })
      transcript.push({
        role: 'user',
        content:
          '请严格按协议输出 JSON：需要工具时用 {"type":"tool",...}，可以回答时用 {"type":"final",...}'
      })
      continue
    }

    if (action.type === 'final') {
      pushStep(
        steps,
        {
          type: 'answer',
          agentId: agent.id,
          agentName: agent.name,
          content: action.content
        },
        options.onStep
      )
      pushStep(
        steps,
        {
          type: 'agent_end',
          agentId: agent.id,
          agentName: agent.name,
          content: `${agent.name} 已完成`
        },
        options.onStep
      )
      return { answer: action.content, steps }
    }

    const tool = getToolByName(agent.tools, action.name)
    if (!tool) {
      pushStep(
        steps,
        {
          type: 'error',
          agentId: agent.id,
          agentName: agent.name,
          content: `未知工具: ${action.name}`
        },
        options.onStep
      )
      transcript.push({
        role: 'assistant',
        content: modelReply
      })
      transcript.push({
        role: 'user',
        content: `工具 ${action.name} 不存在。请从可用工具列表中重新选择。`
      })
      continue
    }

    pushStep(
      steps,
      {
        type: 'tool_call',
        agentId: agent.id,
        agentName: agent.name,
        content: `调用 ${tool.name}`,
        toolName: tool.name,
        toolArgs: action.input
      },
      options.onStep
    )

    let toolResult = ''
    try {
      toolResult = await tool.execute(action.input, context)
    } catch (error) {
      toolResult = error instanceof Error ? error.message : '工具执行失败'
    }

    pushStep(
      steps,
      {
        type: 'tool_result',
        agentId: agent.id,
        agentName: agent.name,
        content: toolResult.slice(0, 1200),
        toolName: tool.name
      },
      options.onStep
    )

    transcript.push({ role: 'assistant', content: modelReply })
    transcript.push({
      role: 'user',
      content: `工具 ${tool.name} 返回结果：\n${toolResult}\n\n如果信息已足够，请输出 final JSON；否则继续调用工具。`
    })
  }

  const streamed = await streamCompletion(
    settings,
    [
      ...transcript,
      {
        role: 'user',
        content:
          '请基于以上工具结果，直接给出最终中文回答。不要输出 JSON，使用 Markdown。'
      }
    ],
    {
      temperature: options.finalTemperature ?? 0.5,
      maxTokens: 1800,
      onDelta: options.onDelta,
      signal: options.signal
    }
  )

  pushStep(
    steps,
    {
      type: 'answer',
      agentId: agent.id,
      agentName: agent.name,
      content: streamed
    },
    options.onStep
  )

  pushStep(
    steps,
    {
      type: 'agent_end',
      agentId: agent.id,
      agentName: agent.name,
      content: `${agent.name} 已完成`
    },
    options.onStep
  )

  return { answer: streamed, steps }
}
