export type AiModuleKey =
  | 'dashboard'
  | 'apps'
  | 'workflow'
  | 'chat'
  | 'knowledge'
  | 'prompts'
  | 'tools'
  | 'playground'
  | 'observability'
  | 'settings'
  | 'api'
  | 'automation'

export type AiPlatformModule = {
  key: AiModuleKey
  path: string
  label: string
  desc: string
  routeName: string
  matchPaths?: string[]
}

export type AiPlatformSection = {
  key: string
  title: string
  modules: AiPlatformModule[]
}

export const aiPlatformSections: AiPlatformSection[] = [
  {
    key: 'workspace',
    title: '工作台',
    modules: [
      {
        key: 'dashboard',
        path: '/ai/dashboard',
        label: '概览',
        desc: '用量、任务与快捷入口',
        routeName: 'ai-dashboard'
      },
      {
        key: 'apps',
        path: '/ai/apps',
        label: '应用广场',
        desc: 'Bot / 工作流应用发布',
        routeName: 'ai-apps'
      },
      {
        key: 'automation',
        path: '/ai/automation',
        label: '自动化中心',
        desc: '定时任务 / 审批 / 合同 / 电子签章',
        routeName: 'ai-automation'
      }
    ]
  },
  {
    key: 'build',
    title: '构建',
    modules: [
      {
        key: 'workflow',
        path: '/ai/workflow',
        label: 'Multi-Agent 工作流',
        desc: '研究 / 创意 / 评估流水线',
        routeName: 'ai-workflow',
        matchPaths: ['/ai/workflow', '/ai/workflow/detail']
      },
      {
        key: 'chat',
        path: '/ai/chat',
        label: 'Agent 聊天',
        desc: 'ReAct 工具调用与流式对话',
        routeName: 'ai-chat'
      },
      {
        key: 'knowledge',
        path: '/ai/knowledge',
        label: '知识库',
        desc: 'RAG 文档切片与检索',
        routeName: 'ai-knowledge'
      },
      {
        key: 'prompts',
        path: '/ai/prompts',
        label: 'Prompt 工程',
        desc: '模板、变量与版本',
        routeName: 'ai-prompts'
      },
      {
        key: 'tools',
        path: '/ai/tools',
        label: '工具插件',
        desc: '内置工具与 MCP / HTTP',
        routeName: 'ai-tools'
      }
    ]
  },
  {
    key: 'ops',
    title: '运维',
    modules: [
      {
        key: 'playground',
        path: '/ai/playground',
        label: '模型 Playground',
        desc: '多模型对比调试',
        routeName: 'ai-playground'
      },
      {
        key: 'observability',
        path: '/ai/observability',
        label: '观测 Trace',
        desc: '调用链、日志与统计',
        routeName: 'ai-observability'
      },
      {
        key: 'settings',
        path: '/ai/settings',
        label: '模型配置',
        desc: 'Provider / Key / 模型',
        routeName: 'ai-settings'
      },
      {
        key: 'api',
        path: '/ai/api',
        label: 'API 接入',
        desc: 'OpenAI 兼容接口说明',
        routeName: 'ai-api'
      }
    ]
  }
]

export const aiPlatformModules = aiPlatformSections.flatMap(
  (section) => section.modules
)

export const resolveAiModuleByPath = (path: string) =>
  aiPlatformModules.find((item) => {
    const paths = item.matchPaths ?? [item.path]
    return paths.some(
      (target) => path === target || path.startsWith(`${target}/`)
    )
  })

export const aiModuleIconThemes: Record<AiModuleKey, string> = {
  dashboard: 'theme-ai',
  apps: 'theme-ai-chat',
  workflow: 'theme-ai',
  chat: 'theme-ai-chat',
  knowledge: 'theme-im',
  prompts: 'theme-preview',
  tools: 'theme-pc',
  playground: 'theme-map',
  observability: 'theme-live-data',
  settings: 'theme-ai-settings',
  api: 'theme-upload',
  automation: 'theme-schedule'
}
