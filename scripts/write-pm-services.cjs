const fs = require('fs')
const path = require('path')

const files = {
  'src/services/platform-notifications.ts': `import type { PlatformTrace } from '@/services/ai-platform-store'

export type NotificationCategory =
  | 'workflow'
  | 'chat'
  | 'automation'
  | 'system'
  | 'billing'

export type PlatformNotification = {
  id: string
  title: string
  body: string
  category: NotificationCategory
  path?: string
  read: boolean
  createdAt: number
}

const KEY = 'flowagent-notifications'
const MAX = 50

const readAll = (): PlatformNotification[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PlatformNotification[]) : []
  } catch {
    return []
  }
}

const writeAll = (items: PlatformNotification[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
  }
}

export const getNotifications = () =>
  readAll().sort((a, b) => b.createdAt - a.createdAt)

export const getUnreadNotificationCount = () =>
  getNotifications().filter((item) => !item.read).length

export const pushNotification = (
  input: Omit<PlatformNotification, 'id' | 'read' | 'createdAt'>
) => {
  const item: PlatformNotification = {
    ...input,
    id: \`notify-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`,
    read: false,
    createdAt: Date.now()
  }
  writeAll([item, ...readAll()])
  return item
}

export const markNotificationRead = (id: string) => {
  writeAll(
    readAll().map((item) => (item.id === id ? { ...item, read: true } : item))
  )
}

export const markAllNotificationsRead = () => {
  writeAll(readAll().map((item) => ({ ...item, read: true })))
}

export const clearNotifications = () => writeAll([])

const tracePath = (trace: PlatformTrace) => {
  if (trace.sourcePath) return trace.sourcePath.split('?')[0]
  const map: Record<string, string> = {
    workflow: '/ai/workflow',
    chat: '/ai/chat',
    agent: '/ai/chat',
    automation: '/ai/automation',
    playground: '/ai/playground'
  }
  return map[trace.type] || '/ai/observability'
}

export const notifyFromTrace = (trace: PlatformTrace) => {
  if (trace.status === 'running') return

  const category: NotificationCategory =
    trace.type === 'workflow'
      ? 'workflow'
      : trace.type === 'automation'
        ? 'automation'
        : trace.type === 'chat' || trace.type === 'agent'
          ? 'chat'
          : 'system'

  pushNotification({
    title:
      trace.status === 'success'
        ? \`\${trace.title} 已完成\`
        : \`\${trace.title} 失败\`,
    body: trace.detail,
    category,
    path:
      trace.status === 'success' && trace.type === 'workflow'
        ? '/ai/workflow/report'
        : tracePath(trace)
  })
}
`,
  'src/services/platform-usage.ts': `import { getAutomationLogs } from '@/services/ai-automation/scheduler'
import {
  getKnowledgeBases,
  getPlatformTraces,
  getPromptTemplates
} from '@/services/ai-platform-store'
import { getHistory } from '@/services/ai'

const CHAT_SESSIONS_KEY = 'ai-chat-sessions'

export type PlatformUsageSnapshot = {
  workflowRuns: number
  chatTurns: number
  traceCount: number
  automationRuns: number
  kbDocuments: number
  promptTemplates: number
  chatSessions: number
  estimatedStorageKB: number
}

export type PlanQuota = {
  planName: string
  workflowRuns: number
  chatTurns: number
  storageMB: number
  automationTasks: number
}

export const defaultPlanQuota = (): PlanQuota => ({
  planName: '专业版试用',
  workflowRuns: 50,
  chatTurns: 500,
  storageMB: 512,
  automationTasks: 10
})

const countChatTurns = () => {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_KEY)
    if (!raw) return 0
    const sessions = JSON.parse(raw) as Array<{ messages?: Array<{ role?: string }> }>
    return sessions.reduce(
      (sum, session) =>
        sum + (session.messages || []).filter((item) => item.role === 'user').length,
      0
    )
  } catch {
    return 0
  }
}

const countChatSessions = () => {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_KEY)
    return raw ? (JSON.parse(raw) as unknown[]).length : 0
  } catch {
    return 0
  }
}

const estimateStorageKB = () => {
  let total = 0
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('flowagent') && !key.includes('ai-')) continue
    const value = localStorage.getItem(key) || ''
    total += key.length + value.length
  }
  return Math.max(1, Math.round(total / 1024))
}

export const getPlatformUsage = (): PlatformUsageSnapshot => ({
  workflowRuns: getHistory().length,
  chatTurns: countChatTurns(),
  traceCount: getPlatformTraces().length,
  automationRuns: getAutomationLogs().length,
  kbDocuments: getKnowledgeBases().reduce((sum, kb) => sum + kb.docs.length, 0),
  promptTemplates: getPromptTemplates().length,
  chatSessions: countChatSessions(),
  estimatedStorageKB: estimateStorageKB()
})

export const usagePercent = (used: number, limit: number) =>
  limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100))

export const isNearQuota = (used: number, limit: number) => usagePercent(used, limit) >= 85
`,
  'src/services/global-search.ts': `import { getHistory } from '@/services/ai'
import {
  getKnowledgeBases,
  getPlatformTraces,
  getPromptTemplates
} from '@/services/ai-platform-store'

export type GlobalSearchResult = {
  id: string
  title: string
  subtitle: string
  path: string
  query?: Record<string, string>
  category: 'menu' | 'knowledge' | 'prompt' | 'trace' | 'workflow' | 'chat'
  icon: unknown
  sectionTitle: string
}

type MenuSearchItem = {
  index: string
  label: string
  desc: string
  icon: unknown
  projectTitle: string
  sectionTitle: string
  keywords: string
}

export const searchPlatformContent = (
  query: string,
  menus: MenuSearchItem[]
): GlobalSearchResult[] => {
  const text = query.trim().toLowerCase()
  if (!text) return []

  const results: GlobalSearchResult[] = []

  for (const item of menus) {
    if (item.keywords.includes(text) || item.label.toLowerCase().includes(text)) {
      results.push({
        id: \`menu-\${item.index}\`,
        title: item.label,
        subtitle: \`\${item.projectTitle} / \${item.sectionTitle}\`,
        path: item.index,
        category: 'menu',
        icon: item.icon,
        sectionTitle: '导航'
      })
    }
  }

  for (const kb of getKnowledgeBases()) {
    if (kb.name.toLowerCase().includes(text) || kb.desc.toLowerCase().includes(text)) {
      results.push({
        id: \`kb-\${kb.id}\`,
        title: kb.name,
        subtitle: \`\${kb.docs.length} 篇文档 · 知识库\`,
        path: '/ai/knowledge',
        category: 'knowledge',
        icon: null,
        sectionTitle: '知识库'
      })
    }
    for (const doc of kb.docs) {
      if (doc.title.toLowerCase().includes(text) || doc.content.toLowerCase().includes(text)) {
        results.push({
          id: \`doc-\${doc.id}\`,
          title: doc.title,
          subtitle: \`知识库 · \${kb.name}\`,
          path: '/ai/knowledge',
          category: 'knowledge',
          icon: null,
          sectionTitle: '知识库'
        })
      }
    }
  }

  for (const prompt of getPromptTemplates()) {
    if (
      prompt.name.toLowerCase().includes(text) ||
      prompt.content.toLowerCase().includes(text) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(text))
    ) {
      results.push({
        id: \`prompt-\${prompt.id}\`,
        title: prompt.name,
        subtitle: 'Prompt 模板',
        path: '/ai/prompts',
        category: 'prompt',
        icon: null,
        sectionTitle: 'Prompt'
      })
    }
  }

  for (const item of getHistory().slice(0, 20)) {
    const keyword = item.keyword?.trim() || ''
    if (keyword && keyword.toLowerCase().includes(text)) {
      results.push({
        id: \`wf-\${item.timestamp}\`,
        title: keyword,
        subtitle: '工作流历史',
        path: '/ai/workflow/report',
        query: { ts: String(item.timestamp) },
        category: 'workflow',
        icon: null,
        sectionTitle: '工作流'
      })
    }
  }

  for (const trace of getPlatformTraces().slice(0, 15)) {
    if (trace.title.toLowerCase().includes(text) || trace.detail.toLowerCase().includes(text)) {
      results.push({
        id: \`trace-\${trace.id}\`,
        title: trace.title,
        subtitle: \`Trace · \${trace.type}\`,
        path: '/ai/observability',
        query: { id: trace.id },
        category: 'trace',
        icon: null,
        sectionTitle: '观测'
      })
    }
  }

  try {
    const raw = localStorage.getItem('ai-chat-sessions')
    if (raw) {
      const sessions = JSON.parse(raw) as Array<{ id: string; title: string; updatedAt: number }>
      for (const session of sessions) {
        if (session.title.toLowerCase().includes(text)) {
          results.push({
            id: \`chat-\${session.id}\`,
            title: session.title,
            subtitle: 'Agent 聊天会话',
            path: '/ai/chat',
            query: { session: session.id },
            category: 'chat',
            icon: null,
            sectionTitle: '聊天'
          })
        }
      }
    }
  } catch {
    // ignore
  }

  const unique = new Map<string, GlobalSearchResult>()
  for (const item of results) unique.set(item.id, item)
  return [...unique.values()].slice(0, 12)
}
`
}

for (const [rel, content] of Object.entries(files)) {
  const target = path.join(__dirname, '..', rel)
  fs.writeFileSync(target, content, 'utf8')
  console.log('wrote', rel)
}
