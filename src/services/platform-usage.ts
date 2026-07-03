import { getAutomationLogs } from '@/services/ai-automation/scheduler'
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
    const sessions = JSON.parse(raw) as Array<{
      messages?: Array<{ role?: string }>
    }>
    return sessions.reduce(
      (sum, session) =>
        sum +
        (session.messages || []).filter((item) => item.role === 'user').length,
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
    if (!key || (!key.startsWith('flowagent') && !key.startsWith('ai-')))
      continue
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

export const isNearQuota = (used: number, limit: number) =>
  usagePercent(used, limit) >= 85

export const exportWorkspaceBackup = () => {
  const payload: Record<string, string | null> = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key) continue
    if (
      key.startsWith('flowagent') ||
      key.startsWith('ai-') ||
      key.includes('pcdemo')
    ) {
      payload[key] = localStorage.getItem(key)
    }
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flowagent-workspace-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}
