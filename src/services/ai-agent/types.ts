import type { AIMessage, AISettings } from '@/services/ai'

export type AgentStepType =
  | 'thought'
  | 'tool_call'
  | 'tool_result'
  | 'answer'
  | 'error'
  | 'agent_start'
  | 'agent_end'

export type AgentStep = {
  id: string
  type: AgentStepType
  agentId?: string
  agentName?: string
  content: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  timestamp: number
}

export type AgentToolDefinition = {
  name: string
  description: string
  parameters: Record<
    string,
    { type: string; description: string; required?: boolean }
  >
  execute: (
    args: Record<string, unknown>,
    context: AgentContext
  ) => Promise<string> | string
}

export type AgentContext = {
  sessionId: string
  userInput: string
  memory: AgentMemoryStore
  extra?: Record<string, unknown>
}

export type AgentMemoryItem = {
  id: string
  key: string
  value: string
  createdAt: number
}

export type AgentMemoryStore = {
  list: () => AgentMemoryItem[]
  search: (query: string) => AgentMemoryItem[]
  save: (key: string, value: string) => AgentMemoryItem
  remove: (id: string) => void
}

export type AgentDefinition = {
  id: string
  name: string
  description: string
  systemPrompt: string
  tools: AgentToolDefinition[]
  maxIterations?: number
}

export type AgentRunOptions = {
  userMessage: string
  history?: AIMessage[]
  context?: Partial<AgentContext>
  settings?: AISettings
  onStep?: (step: AgentStep) => void
  onDelta?: (chunk: string) => void
  signal?: AbortSignal
  finalTemperature?: number
}

export type AgentRunResult = {
  answer: string
  steps: AgentStep[]
}

export type WorkflowAgentTrace = {
  agentId: string
  agentName: string
  steps: AgentStep[]
}
