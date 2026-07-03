/**
 * FlowAgent - AI + Multi-Agent Workflow Product
 */

export const productName = 'FlowAgent'
export const productShortName = 'FlowAgent'
export const productTagline = 'Multi-Agent 产品工作流平台'
export const productDescription =
  '输入关键词，自动完成市场研究、产品创意与方案评估。配合 ReAct Agent 聊天与统一模型配置。'

export const defaultHomePath = '/ai/dashboard'

export const productModules = [
  {
    key: 'dashboard',
    path: '/ai/dashboard',
    label: '概览',
    desc: '用量与快捷入口'
  },
  {
    key: 'workflow',
    path: '/ai/workflow',
    label: 'Multi-Agent 工作流',
    desc: 'Research -> Ideation -> Evaluation'
  },
  {
    key: 'chat',
    path: '/ai/chat',
    label: 'Agent 聊天',
    desc: 'ReAct / tools / memory / stream'
  },
  {
    key: 'automation',
    path: '/ai/automation',
    label: '自动化中心',
    desc: '定时任务 / 审批 / 合同'
  },
  {
    key: 'settings',
    path: '/ai/settings',
    label: '模型配置',
    desc: 'OpenAI compatible API'
  }
] as const

export const loginCopy = {
  brandName: productShortName,
  brandVersion: productTagline,
  kicker: 'AI Workflow Platform',
  headline: '从关键词到产品方案，一条 Agent 流水线搞定',
  subline:
    '研究、创意、评估三阶段 Multi-Agent 协作，支持流式输出、工具调用与执行轨迹可视化。',
  panelKicker: 'SIGN IN',
  panelTitle: '登录 FlowAgent',
  panelDesc: '演示环境支持任意账号登录，进入后即可启动 Multi-Agent 工作流。',
  previewWorkflow: 'Multi-Agent 流水线',
  previewTrace: 'Agent 执行轨迹',
  previewRoles: '3 个 Agent',
  signals: [
    {
      value: '3 阶段',
      label: 'Agent 流水线',
      desc: '市场研究、创意生成、评估优化自动串联。'
    },
    {
      value: 'ReAct',
      label: '工具调用',
      desc: '聊天 Agent 支持记忆、项目检索与联网搜索。'
    },
    {
      value: '兼容',
      label: '模型接入',
      desc: 'DeepSeek、通义、智谱等 OpenAI 兼容接口。'
    }
  ]
} as const

export const documentTitle = (pageTitle?: string) =>
  pageTitle ? `${pageTitle} · ${productName}` : productName
