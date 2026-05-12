import { ref } from 'vue'
import { resolveMenuItemByPath } from '@/config/navigation'

const STORAGE_KEY = 'pcdemo_recent_navigation'
const MAX_RECENT_ITEMS = 6

export type RecentNavigationItem = {
  index: string
  label: string
  desc: string
  icon: unknown
  theme: string
  projectTitle: string
  sectionTitle: string
  visitedAt: number
}

const readRecentItems = (): RecentNavigationItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const recentItems = ref<RecentNavigationItem[]>(readRecentItems())

const persistRecentItems = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentItems.value))
}

export const useRecentNavigation = () => {
  const recordRecentPath = (path: string) => {
    const matched = resolveMenuItemByPath(path)
    if (!matched) return

    const nextItem: RecentNavigationItem = {
      index: matched.item.index,
      label: matched.item.label,
      desc: matched.item.desc,
      icon: matched.item.icon,
      theme: matched.item.theme,
      projectTitle: matched.project.title,
      sectionTitle: matched.section.title,
      visitedAt: Date.now()
    }

    recentItems.value = [
      nextItem,
      ...recentItems.value.filter((item) => item.index !== nextItem.index)
    ].slice(0, MAX_RECENT_ITEMS)

    persistRecentItems()
  }

  const clearRecentItems = () => {
    recentItems.value = []
    persistRecentItems()
  }

  return {
    recentItems,
    recordRecentPath,
    clearRecentItems
  }
}
