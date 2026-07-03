import type { AIMessage } from '@/services/ai'
import { runAgent } from './engine'
import { createAgentMemoryStore } from './memory'
import { chatAgentTools, getChatAgentTools } from './tools'
import type { AgentDefinition, AgentRunOptions, AgentRunResult } from './types'

export const CHAT_AGENT_PRESETS: AgentDefinition[] = [
  {
    id: 'general',
    name: '通用助手',
    description: '适合日常问答、方案梳理与项目导航。',
    maxIterations: 6,
    systemPrompt: `你是 FlowAgent 产品中的通用 Agent 助手。
你的职责是：理解用户目标、必要时调用工具、给出清晰可执行的中文回答。
涉及项目模块、路径、配置时，优先调用 read_project_modules。
涉及内部文档时，优先 search_knowledge_base。
涉及用户偏好或长期上下文时，可使用 save_memory / search_memory。`,
    tools: chatAgentTools
  },
  {
    id: 'product',
    name: '产品策划 Agent',
    description: '擅长需求拆解、市场检索与 MVP 规划。',
    maxIterations: 7,
    systemPrompt: `你是产品策划 Agent，擅长把模糊想法变成可执行方案。
遇到市场、竞品、用户画像问题时，优先 web_search、search_knowledge_base 或 analyze_requirement。
输出应包含：目标用户、核心方案、实施步骤、风险与下一步。`,
    tools: chatAgentTools
  },
  {
    id: 'dev',
    name: '研发协 Agent',
    description: '适合接口排查、模块说明与实施步骤。',
    maxIterations: 6,
    systemPrompt: `你是研发协作 Agent，擅长 Vue 3、Element Plus 与企业后台场景。
遇到项目结构、页面入口、模块路径问题时，调用 read_project_modules。
回答时给出排查步骤、可能原因和验证方式。`,
    tools: chatAgentTools
  }
]

export const DEFAULT_CHAT_AGENT = CHAT_AGENT_PRESETS[0]!

export const getChatAgentPreset = (id: string): AgentDefinition => {
  const base =
    CHAT_AGENT_PRESETS.find((item) => item.id === id) ?? DEFAULT_CHAT_AGENT
  return {
    ...base,
    tools: getChatAgentTools()
  }
}

export const runChatAgent = async (
  presetId: string,
  options: Omit<AgentRunOptions, 'context'> & {
    sessionId?: string
  }
): Promise<AgentRunResult> => {
  const agent = getChatAgentPreset(presetId)
  const memory = createAgentMemoryStore()

  return runAgent(agent, {
    ...options,
    context: {
      sessionId: options.sessionId || `chat-${Date.now()}`,
      userInput: options.userMessage,
      memory
    }
  })
}

export const buildChatAgentHistory = (
  messages: Array<{ role: AIMessage['role']; content: string; error?: boolean }>
): AIMessage[] =>
  messages
    .filter((item) => !item.error && item.content.trim())
    .slice(-12)
    .map((item) => ({
      role: item.role,
      content: item.content
    }))
