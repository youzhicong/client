import type { PlatformTrace } from '@/services/ai-platform-store'

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
    id: `notify-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
        ? `${trace.title} 已完成`
        : `${trace.title} 失败`,
    body: trace.detail,
    category,
    path:
      trace.status === 'success' && trace.type === 'workflow'
        ? '/ai/workflow/report'
        : tracePath(trace)
  })
}
