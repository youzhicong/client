import {
  runProductWorkflowAgent,
  type WorkflowAgentProgress
} from '@/services/ai-agent'
import { getWorkflowModelConfig } from '@/services/ai'
import {
  runBusinessClosureFlow,
  type BusinessClosureStep
} from './business-flow'
export type AutomationScheduleType = 'daily' | 'weekly' | 'interval'
export type AutomationTaskType =
  | 'product_workflow'
  | 'business_closure'
  | 'full_pipeline'
export type AutomationTask = {
  id: string
  name: string
  enabled: boolean
  taskType: AutomationTaskType
  scheduleType: AutomationScheduleType
  timeOfDay: string
  weekday: number
  intervalMinutes: number
  keyword: string
  enableBusinessClosure: boolean
  lastRunAt?: number
  nextRunAt?: number
  createdAt: number
}
export type AutomationRunLog = {
  id: string
  taskId: string
  taskName: string
  taskType: AutomationTaskType
  keyword: string
  status: 'success' | 'error'
  message: string
  startedAt: number
  finishedAt: number
}
const TASKS_KEY = 'flowagent-automation-tasks'
const LOGS_KEY = 'flowagent-automation-logs'
const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const writeJson = (key: string, value: unknown) => {
  if (typeof window !== 'undefined')
    window.localStorage.setItem(key, JSON.stringify(value))
}
export const computeNextRunAt = (
  task: Pick<
    AutomationTask,
    'scheduleType' | 'timeOfDay' | 'weekday' | 'intervalMinutes'
  >,
  from = Date.now()
) => {
  if (task.scheduleType === 'interval')
    return from + Math.max(5, task.intervalMinutes || 60) * 60 * 1000
  const parts = (task.timeOfDay || '09:00').split(':')
  const h = Number.parseInt(parts[0] || '9', 10) || 9
  const m = Number.parseInt(parts[1] || '0', 10) || 0
  const next = new Date(from)
  next.setSeconds(0, 0)
  next.setHours(h, m, 0, 0)
  if (task.scheduleType === 'daily') {
    if (next.getTime() <= from) next.setDate(next.getDate() + 1)
    return next.getTime()
  }
  let offset = ((task.weekday ?? 1) - next.getDay() + 7) % 7
  if (offset === 0 && next.getTime() <= from) offset = 7
  next.setDate(next.getDate() + offset)
  return next.getTime()
}
export const getAutomationTasks = () =>
  readJson<AutomationTask[]>(TASKS_KEY, [])
export const saveAutomationTasks = (tasks: AutomationTask[]) =>
  writeJson(TASKS_KEY, tasks)
export const getAutomationLogs = () =>
  readJson<AutomationRunLog[]>(LOGS_KEY, [])
export const appendAutomationLog = (log: AutomationRunLog) =>
  writeJson(LOGS_KEY, [log, ...getAutomationLogs()].slice(0, 30))
export const createAutomationTask = (
  payload: Omit<AutomationTask, 'id' | 'createdAt' | 'lastRunAt' | 'nextRunAt'>
) => {
  const task: AutomationTask = {
    ...payload,
    id: `task-${Date.now()}`,
    createdAt: Date.now(),
    nextRunAt: computeNextRunAt(payload)
  }
  saveAutomationTasks([task, ...getAutomationTasks()])
  return task
}
export const updateAutomationTask = (
  id: string,
  patch: Partial<AutomationTask>
) => {
  const tasks = getAutomationTasks().map((task) =>
    task.id === id
      ? {
          ...task,
          ...patch,
          nextRunAt: computeNextRunAt({ ...task, ...patch })
        }
      : task
  )
  saveAutomationTasks(tasks)
  return tasks.find((item) => item.id === id) || null
}
export const deleteAutomationTask = (id: string) =>
  saveAutomationTasks(getAutomationTasks().filter((task) => task.id !== id))
export const getDueAutomationTasks = (now = Date.now()) =>
  getAutomationTasks().filter(
    (task) =>
      task.enabled && task.nextRunAt !== undefined && task.nextRunAt <= now
  )
export type AutomationRunHandlers = {
  onProgress?: (progress: WorkflowAgentProgress) => void
  onBusinessStep?: (step: BusinessClosureStep) => void
}
export const runAutomationTask = async (
  task: AutomationTask,
  handlers: AutomationRunHandlers = {}
) => {
  const startedAt = Date.now()
  try {
    if (task.taskType === 'business_closure') {
      const result = await runBusinessClosureFlow({
        keyword: task.keyword,
        onStep: handlers.onBusinessStep
      })
      return finishRun(
        task,
        startedAt,
        'success',
        `商务闭环完成：${result.contractCode}`
      )
    }
    const workflow = await runProductWorkflowAgent(task.keyword, {
      modelConfig: getWorkflowModelConfig(),
      enableBusinessClosure:
        task.enableBusinessClosure || task.taskType === 'full_pipeline',
      onProgress: handlers.onProgress,
      onBusinessStep: handlers.onBusinessStep
    })
    const suffix = workflow.businessClosure?.contractCode
      ? `，合同 ${workflow.businessClosure.contractCode} 已签章`
      : ''
    return finishRun(
      task,
      startedAt,
      'success',
      `工作流完成：${task.keyword}${suffix}`
    )
  } catch (error) {
    return finishRun(
      task,
      startedAt,
      'error',
      error instanceof Error ? error.message : '自动化任务失败'
    )
  }
}
const finishRun = (
  task: AutomationTask,
  startedAt: number,
  status: AutomationRunLog['status'],
  message: string
) => {
  const finishedAt = Date.now()
  updateAutomationTask(task.id, {
    lastRunAt: finishedAt,
    nextRunAt: computeNextRunAt(task, finishedAt)
  })
  const log: AutomationRunLog = {
    id: `log-${finishedAt}`,
    taskId: task.id,
    taskName: task.name,
    taskType: task.taskType,
    keyword: task.keyword,
    status,
    message,
    startedAt,
    finishedAt
  }
  appendAutomationLog(log)
  return log
}
let schedulerTimer: number | undefined
let runningTaskId: string | undefined
export const startAutomationScheduler = (
  onRun?: (log: AutomationRunLog) => void
) => {
  if (typeof window === 'undefined' || schedulerTimer) return
  const tick = async () => {
    if (runningTaskId) return
    const task = getDueAutomationTasks()[0]
    if (!task) return
    runningTaskId = task.id
    try {
      onRun?.(await runAutomationTask(task))
    } finally {
      runningTaskId = undefined
    }
  }
  void tick()
  schedulerTimer = window.setInterval(() => {
    void tick()
  }, 15000)
}
export const stopAutomationScheduler = () => {
  if (schedulerTimer) {
    window.clearInterval(schedulerTimer)
    schedulerTimer = undefined
  }
}
