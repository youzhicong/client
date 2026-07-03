import {
  generateProductIdeas,
  getWorkflowModelConfig,
  resolveWorkflowAgentSettings,
  type GenerationResult,
  type WorkflowAgentPhase,
  type WorkflowModelConfig
} from '@/services/ai'
import { runBusinessClosureFlow } from '@/services/ai-automation/business-flow'
import type {
  BusinessClosureResult,
  BusinessClosureStep
} from '@/services/ai-automation/business-flow'
import { runAgent } from './engine'
import { workflowAgentTools } from './tools'
import type { AgentDefinition, AgentStep, WorkflowAgentTrace } from './types'

const researchAgent: AgentDefinition = {
  id: 'research',
  name: '市场研究 Agent',
  description: '扫描行业、渠道、机会与风险',
  maxIterations: 4,
  systemPrompt: `你是市场研究 Agent。用户会给一个产品关键词。
你必须至少调用 market_scan 和 web_search，然后输出 final JSON，
content 中总结：品类机会、目标渠道、竞品格局、3 条核心洞察。`,
  tools: workflowAgentTools
}

const ideationAgent: AgentDefinition = {
  id: 'ideation',
  name: '创意生成 Agent',
  description: '基于研究结果生成产品矩阵',
  maxIterations: 3,
  systemPrompt: `你是产品创意 Agent。你会收到关键词与研究摘要。
请输出 final JSON，content 必须是合法 JSON 字符串，结构如下：
{
  "categories": [
    {
      "name": "分类名称",
      "icon": "emoji",
      "products": [
        {
          "name": "产品名称",
          "description": "50字内描述",
          "category": "分类名称",
          "marketPotential": "高/中/低",
          "icon": "emoji"
        }
      ]
    }
  ]
}
至少 3 个分类，每类 2-4 个产品。只输出 final JSON，content 内是上述 JSON。`,
  tools: workflowAgentTools
}

const evaluationAgent: AgentDefinition = {
  id: 'evaluation',
  name: '评估优化 Agent',
  description: '为产品创意打分并给出优化建议',
  maxIterations: 5,
  systemPrompt: `你是产品评估 Agent。你会收到关键词和产品列表 JSON。
对每个产品调用 score_product_idea，然后输出 final JSON：
{
  "summary": "总体评估摘要",
  "topPicks": ["产品名1", "产品名2", "产品名3"]
}
只输出 final JSON。`,
  tools: workflowAgentTools
}

const complianceAgent: AgentDefinition = {
  id: 'compliance',
  name: '商务闭环',
  description: '自动审批、电子合同与双章签署',
  maxIterations: 1,
  systemPrompt: '商务闭环由系统自动执行，无需额外输出。',
  tools: []
}

const parseCategoriesFromAnswer = (answer: string) => {
  const tryParse = (text: string) => {
    const match = text.trim().match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      const parsed = JSON.parse(match[0]) as {
        categories?: GenerationResult['categories']
        type?: string
        content?: string
      }
      if (parsed.categories?.length) return parsed.categories
      if (parsed.type === 'final' && parsed.content) {
        const inner = parsed.content.trim()
        const innerMatch = inner.match(/\{[\s\S]*\}/)
        if (innerMatch) {
          const nested = JSON.parse(innerMatch[0]) as {
            categories?: GenerationResult['categories']
          }
          if (nested.categories?.length) return nested.categories
        }
      }
    } catch {
      return null
    }
    return null
  }

  return tryParse(answer)
}

const buildProductCategories = async (
  keyword: string,
  researchSummary: string,
  ideationAnswer: string,
  resolveSettings: (
    phase: WorkflowAgentPhase
  ) => ReturnType<typeof resolveWorkflowAgentSettings>
) => {
  const parsed = parseCategoriesFromAnswer(ideationAnswer)
  if (parsed?.length) return { categories: parsed, usedFallback: false }

  const generated = await generateProductIdeas(
    `${keyword}\n\n市场研究摘要：\n${researchSummary.slice(0, 600)}`,
    resolveSettings('ideation')
  )
  return { categories: generated.categories, usedFallback: true }
}

const parseEvaluationMeta = (evaluationAnswer: string) => {
  let topPicks: string[] = []
  let summary = ''
  try {
    const match = evaluationAnswer.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        topPicks?: string[]
        summary?: string
      }
      topPicks = parsed.topPicks || []
      summary = parsed.summary || ''
    }
  } catch {
    topPicks = []
  }
  return { topPicks, summary }
}

const businessStepsToAgentSteps = (steps: BusinessClosureStep[]): AgentStep[] =>
  steps.map((step, index) => ({
    id: `closure-${step.key}-${index}`,
    type: step.status === 'error' ? 'error' : 'tool_result',
    agentId: 'compliance',
    agentName: complianceAgent.name,
    content: `${step.label}：${step.detail}`,
    toolName: step.label,
    timestamp: Date.now() + index
  }))

const applyEvaluationBoost = (
  categories: GenerationResult['categories'],
  topPicks: string[]
) => {
  if (topPicks.length === 0) return categories

  return categories.map((category) => ({
    ...category,
    products: [...category.products].sort((a, b) => {
      const aBoost = topPicks.includes(a.name) ? 1 : 0
      const bBoost = topPicks.includes(b.name) ? 1 : 0
      return bBoost - aBoost
    })
  }))
}

export type WorkflowAgentProgress = {
  phase:
    | 'research'
    | 'ideation'
    | 'evaluation'
    | 'compliance'
    | 'done'
    | 'fallback'
  label: string
  trace: WorkflowAgentTrace[]
  currentSteps: AgentStep[]
}

export const runProductWorkflowAgent = async (
  keyword: string,
  handlers: {
    onProgress?: (progress: WorkflowAgentProgress) => void
    onStep?: (step: AgentStep) => void
    onBusinessStep?: (step: BusinessClosureStep) => void
    signal?: AbortSignal
    modelConfig?: WorkflowModelConfig
    enableBusinessClosure?: boolean
  } = {}
): Promise<
  GenerationResult & {
    agentTrace: WorkflowAgentTrace[]
    summary?: string
    topPicks?: string[]
    businessClosure?: BusinessClosureResult
  }
> => {
  return runFullAutoWorkflow(keyword, handlers)
}

/** 输入品类/关键词，自动串联：研究 → 创意 → 评估 →（可选）商务闭环，无需人工逐步操作 */
export const runFullAutoWorkflow = async (
  keyword: string,
  handlers: {
    onProgress?: (progress: WorkflowAgentProgress) => void
    onStep?: (step: AgentStep) => void
    onBusinessStep?: (step: BusinessClosureStep) => void
    signal?: AbortSignal
    modelConfig?: WorkflowModelConfig
    enableBusinessClosure?: boolean
  } = {}
): Promise<
  GenerationResult & {
    agentTrace: WorkflowAgentTrace[]
    summary?: string
    topPicks?: string[]
    businessClosure?: BusinessClosureResult
  }
> => {
  const modelConfig = handlers.modelConfig || getWorkflowModelConfig()
  const resolveSettings = (phase: WorkflowAgentPhase) =>
    resolveWorkflowAgentSettings(phase, modelConfig)
  const trace: WorkflowAgentTrace[] = []
  const pushProgress = (
    phase: WorkflowAgentProgress['phase'],
    label: string,
    currentSteps: AgentStep[] = []
  ) => {
    handlers.onProgress?.({ phase, label, trace: [...trace], currentSteps })
  }

  pushProgress('research', '市场研究 Agent 正在扫描行业与机会…')

  const researchSteps: AgentStep[] = []
  const research = await runAgent(researchAgent, {
    userMessage: `请围绕关键词「${keyword}」完成市场研究。`,
    signal: handlers.signal,
    settings: resolveSettings('research'),
    onStep: (step) => {
      researchSteps.push(step)
      handlers.onStep?.(step)
      pushProgress('research', '市场研究 Agent 正在分析…', [...researchSteps])
    }
  })
  trace.push({
    agentId: researchAgent.id,
    agentName: researchAgent.name,
    steps: research.steps
  })

  pushProgress('ideation', '创意生成 Agent 正在构建产品矩阵…')

  const ideation = await runAgent(ideationAgent, {
    userMessage: `关键词：${keyword}\n研究摘要：\n${research.answer}`,
    signal: handlers.signal,
    settings: resolveSettings('ideation'),
    onStep: handlers.onStep
  })
  trace.push({
    agentId: ideationAgent.id,
    agentName: ideationAgent.name,
    steps: ideation.steps
  })

  const { categories: builtCategories, usedFallback } =
    await buildProductCategories(
      keyword,
      research.answer,
      ideation.answer,
      resolveSettings
    )
  let categories = builtCategories

  if (usedFallback) {
    pushProgress('fallback', '创意 Agent 输出异常，已自动切换直连生成并继续…')
  }

  if (!categories.length) {
    pushProgress('fallback', '正在最后一次重试产品矩阵生成…')
    categories = (
      await generateProductIdeas(keyword, resolveSettings('ideation'))
    ).categories
  }

  pushProgress('evaluation', '评估优化 Agent 正在打分与筛选…')

  const flatProducts = categories.flatMap((cat) => cat.products)
  const evaluation = await runAgent(evaluationAgent, {
    userMessage: `关键词：${keyword}\n产品列表：\n${JSON.stringify(flatProducts.slice(0, 12))}`,
    signal: handlers.signal,
    settings: resolveSettings('evaluation'),
    onStep: handlers.onStep
  })
  trace.push({
    agentId: evaluationAgent.id,
    agentName: evaluationAgent.name,
    steps: evaluation.steps
  })

  const { topPicks, summary: evaluationSummary } = parseEvaluationMeta(
    evaluation.answer
  )
  categories = applyEvaluationBoost(categories, topPicks)

  const summary =
    evaluationSummary ||
    evaluation.answer.slice(0, 320) ||
    research.answer.slice(0, 320)
  let businessClosure: BusinessClosureResult | undefined

  if (handlers.enableBusinessClosure) {
    pushProgress('compliance', '商务闭环正在发起审批与电子签章…')

    const closureSteps: AgentStep[] = []
    try {
      businessClosure = await runBusinessClosureFlow({
        keyword,
        summary,
        onStep: (step) => {
          handlers.onBusinessStep?.(step)
          const agentStep = businessStepsToAgentSteps([step])[0]
          if (agentStep) {
            closureSteps.push(agentStep)
            handlers.onStep?.(agentStep)
            pushProgress('compliance', step.label, [...closureSteps])
          }
        }
      })

      trace.push({
        agentId: complianceAgent.id,
        agentName: complianceAgent.name,
        steps: businessStepsToAgentSteps(businessClosure.steps)
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '商务闭环失败，已跳过'
      pushProgress('compliance', `商务闭环跳过：${message}`)
      handlers.onStep?.({
        id: `closure-error-${Date.now()}`,
        type: 'error',
        agentId: 'compliance',
        agentName: complianceAgent.name,
        content: message,
        timestamp: Date.now()
      })
    }
  }

  pushProgress(
    'done',
    businessClosure
      ? '工作流与商务闭环已完成'
      : handlers.enableBusinessClosure
        ? '产品工作流已完成（商务闭环未执行）'
        : '多 Agent 工作流已完成'
  )

  return {
    keyword,
    categories,
    timestamp: Date.now(),
    summary,
    topPicks,
    agentTrace: trace,
    businessClosure
  }
}

export const WORKFLOW_AGENTS = [
  researchAgent,
  ideationAgent,
  evaluationAgent,
  complianceAgent
]
