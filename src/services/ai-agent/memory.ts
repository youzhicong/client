import type { AgentMemoryItem, AgentMemoryStore } from './types'

const AGENT_MEMORY_KEY = 'ai-agent-memory'
const MAX_ITEMS = 80

const readItems = (): AgentMemoryItem[] => {
  const raw = localStorage.getItem(AGENT_MEMORY_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as AgentMemoryItem[]
  } catch {
    return []
  }
}

const writeItems = (items: AgentMemoryItem[]) => {
  localStorage.setItem(
    AGENT_MEMORY_KEY,
    JSON.stringify(items.slice(0, MAX_ITEMS))
  )
}

export const createAgentMemoryStore = (): AgentMemoryStore => ({
  list: () => readItems(),
  search: (query: string) => {
    const text = query.trim().toLowerCase()
    if (!text) return readItems().slice(0, 10)
    return readItems().filter(
      (item) =>
        item.key.toLowerCase().includes(text) ||
        item.value.toLowerCase().includes(text)
    )
  },
  save: (key: string, value: string) => {
    const items = readItems()
    const existing = items.find((item) => item.key === key)
    if (existing) {
      existing.value = value
      existing.createdAt = Date.now()
      writeItems(items)
      return existing
    }
    const item: AgentMemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      key,
      value,
      createdAt: Date.now()
    }
    writeItems([item, ...items])
    return item
  },
  remove: (id: string) => {
    writeItems(readItems().filter((item) => item.id !== id))
  }
})

export const clearAgentMemory = () => {
  localStorage.removeItem(AGENT_MEMORY_KEY)
}
