import { projectWorkspaces } from '@/config/navigation'
import { isPortfolioMode } from '@/config/portfolio'
import { searchKnowledge } from '@/services/ai-platform-store'
import { runBusinessClosureFlow } from '@/services/ai-automation/business-flow'
import { buildCustomPluginTools } from './custom-plugins'
import type { AgentToolDefinition } from './types'

const formatJson = (value: unknown) => JSON.stringify(value, null, 2)

export const chatAgentTools: AgentToolDefinition[] = [
  {
    name: 'get_current_time',
    description: '获取当前本地时间，用于回答与时间相关的问题。',
    parameters: {},
    execute: () => {
      const now = new Date()
      return formatJson({
        iso: now.toISOString(),
        local: now.toLocaleString('zh-CN'),
        weekday: now.toLocaleDateString('zh-CN', { weekday: 'long' })
      })
    }
  },
  {
    name: 'search_memory',
    description: '检索 Agent 长期记忆中与关键词相关的条目。',
    parameters: {
      query: { type: 'string', description: '搜索关键词', required: true }
    },
    execute: (args, context) => {
      const query = String(args.query || '')
      const items = context.memory.search(query)
      return formatJson({
        count: items.length,
        items: items.map((item) => ({
          key: item.key,
          value: item.value,
          createdAt: item.createdAt
        }))
      })
    }
  },
  {
    name: 'save_memory',
    description: '将用户偏好、项目背景或重要结论写入 Agent 长期记忆。',
    parameters: {
      key: { type: 'string', description: '记忆标题/键', required: true },
      value: { type: 'string', description: '要记住的内容', required: true }
    },
    execute: (args, context) => {
      const key = String(args.key || '').trim()
      const value = String(args.value || '').trim()
      if (!key || !value) return '参数 key 和 value 不能为空'
      const item = context.memory.save(key, value)
      return formatJson({ saved: true, id: item.id, key: item.key })
    }
  },
  {
    name: 'search_knowledge_base',
    description:
      '检索 FlowAgent 知识库中的文档片段，用于回答需要内部资料的问题。',
    parameters: {
      query: { type: 'string', description: '检索关键词', required: true },
      limit: {
        type: 'number',
        description: '返回条数，默认 5',
        required: false
      }
    },
    execute: (args) => {
      const query = String(args.query || '').trim()
      const limit = Number(args.limit) || 5
      const hits = searchKnowledge(query, limit)
      if (!hits.length) {
        return formatJson({
          query,
          count: 0,
          hint: '知识库暂无匹配，可在「知识库」模块添加文档'
        })
      }
      return formatJson({
        query,
        count: hits.length,
        results: hits.map((hit) => ({
          knowledgeBase: hit.kb,
          title: hit.doc.title,
          excerpt: hit.doc.content.slice(0, 320),
          score: hit.score
        }))
      })
    }
  },
  {
    name: 'web_search',
    description:
      '检索与关键词相关的市场/行业公开信息摘要（演示环境为结构化模拟结果）。',
    parameters: {
      query: { type: 'string', description: '搜索关键词', required: true }
    },
    execute: (args) => {
      const query = String(args.query || '').trim()
      return formatJson({
        query,
        results: [
          {
            title: `${query} 行业趋势 2025`,
            snippet: `${query} 相关消费场景持续扩展，线上渠道占比提升，细分品类机会增加。`
          },
          {
            title: `${query} 竞品与定价`,
            snippet: `头部品牌以礼盒和订阅模式为主，中端价位 59-199 元区间竞争最激烈。`
          },
          {
            title: `${query} 用户画像`,
            snippet: `核心用户为 25-40 岁城市白领与家庭用户，关注品质、便捷与品牌信任。`
          }
        ]
      })
    }
  },
  {
    name: 'read_project_modules',
    description: '读取当前工作台可见的项目模块与入口，便于给出导航或功能建议。',
    parameters: {},
    execute: () => {
      const modules = projectWorkspaces.flatMap((project) =>
        project.sections.flatMap((section) =>
          section.items.map((item) => ({
            project: project.title,
            section: section.title,
            title: item.label,
            path: item.index
          }))
        )
      )
      return formatJson({
        portfolioMode: isPortfolioMode,
        moduleCount: modules.length,
        modules: modules.slice(0, 24)
      })
    }
  },
  {
    name: 'analyze_requirement',
    description: '将用户需求拆解为可执行步骤，适合方案设计、排期、实施类问题。',
    parameters: {
      requirement: {
        type: 'string',
        description: '用户需求描述',
        required: true
      }
    },
    execute: (args) => {
      const requirement = String(args.requirement || '').trim()
      return formatJson({
        requirement,
        steps: [
          '澄清目标、约束与验收标准',
          '梳理现有模块/接口与依赖',
          '拆分 MVP 与后续迭代',
          '给出实现顺序与风险点'
        ]
      })
    }
  }
]

/** 内置工具 + 已注册 HTTP 插件（Agent 运行时合并） */
export const getChatAgentTools = (): AgentToolDefinition[] => [
  ...chatAgentTools,
  ...buildCustomPluginTools()
]

export const workflowAgentTools: AgentToolDefinition[] = [
  ...chatAgentTools.filter((tool) =>
    ['web_search', 'get_current_time', 'search_knowledge_base'].includes(
      tool.name
    )
  ),
  {
    name: 'market_scan',
    description: '对关键词进行市场扫描，输出品类、渠道、竞品与机会点。',
    parameters: {
      keyword: { type: 'string', description: '产品关键词', required: true }
    },
    execute: (args) => {
      const keyword = String(args.keyword || '').trim()
      return formatJson({
        keyword,
        categories: ['主力产品', '衍生产品', '礼盒场景', '订阅复购'],
        channels: ['电商', '社群团购', '线下商超', '内容带货'],
        opportunities: [
          `${keyword} 高端礼盒`,
          `${keyword} 轻加工即食`,
          `${keyword} 企业定制`
        ],
        risks: ['原料波动', '同质化', '季节性']
      })
    }
  },
  {
    name: 'score_product_idea',
    description: '为单个产品创意打分并给出改进建议。',
    parameters: {
      name: { type: 'string', description: '产品名称', required: true },
      description: { type: 'string', description: '产品描述', required: true },
      keyword: { type: 'string', description: '原始关键词', required: true }
    },
    execute: (args) => {
      const name = String(args.name || '')
      const description = String(args.description || '')
      const keyword = String(args.keyword || '')
      const score = Math.min(
        95,
        60 +
          Math.min(name.length, 12) +
          Math.min(description.length, 40) / 4 +
          keyword.length
      )
      return formatJson({
        name,
        score,
        verdict: score >= 80 ? '优先推进' : score >= 70 ? '可试点' : '需优化',
        suggestions: ['明确目标人群', '补充差异化卖点', '设计小包装试销']
      })
    }
  }
]

export const businessAutomationTools: AgentToolDefinition[] = [
  {
    name: 'execute_business_closure',
    description:
      '一键完成立项审批、自动通过、电子合同创建、提交与甲乙双方电子签章。',
    parameters: {
      keyword: { type: 'string', description: '产品关键词', required: true },
      summary: {
        type: 'string',
        description: '评估或方案摘要',
        required: false
      },
      amount: { type: 'number', description: '合同/审批金额', required: false }
    },
    execute: async (args) => {
      const keyword = String(args.keyword || '').trim()
      if (!keyword) return 'keyword 不能为空'
      const result = await runBusinessClosureFlow({
        keyword,
        summary: String(args.summary || ''),
        amount: Number(args.amount) || undefined
      })
      return formatJson({
        approvalCode: result.approvalCode,
        contractCode: result.contractCode,
        approvalStatus: result.approvalStatus,
        contractStatus: result.contractStatus,
        sealsApplied: result.sealsApplied,
        steps: result.steps.map((step) => step.label)
      })
    }
  },
  {
    name: 'start_approval_flow',
    description: '发起一条 AI 立项审批流程。',
    parameters: {
      title: { type: 'string', description: '审批标题', required: true },
      amount: { type: 'number', description: '金额', required: true },
      reason: { type: 'string', description: '申请原因', required: true }
    },
    execute: async (args) => {
      const result = await runBusinessClosureFlow({
        keyword: String(args.title || '立项'),
        title: String(args.title || ''),
        amount: Number(args.amount) || 0,
        summary: String(args.reason || '')
      })
      return formatJson({
        approvalCode: result.approvalCode,
        status: result.approvalStatus
      })
    }
  }
]

export const getToolByName = (
  tools: AgentToolDefinition[],
  name: string
): AgentToolDefinition | undefined => tools.find((tool) => tool.name === name)
