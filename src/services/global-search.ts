import { getHistory } from '@/services/ai'
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
    if (
      item.keywords.includes(text) ||
      item.label.toLowerCase().includes(text)
    ) {
      results.push({
        id: `menu-${item.index}`,
        title: item.label,
        subtitle: `${item.projectTitle} / ${item.sectionTitle}`,
        path: item.index,
        category: 'menu',
        icon: item.icon,
        sectionTitle: '导航'
      })
    }
  }

  for (const kb of getKnowledgeBases()) {
    if (
      kb.name.toLowerCase().includes(text) ||
      kb.desc.toLowerCase().includes(text)
    ) {
      results.push({
        id: `kb-${kb.id}`,
        title: kb.name,
        subtitle: `${kb.docs.length} 篇文档 · 知识库`,
        path: '/ai/knowledge',
        category: 'knowledge',
        icon: null,
        sectionTitle: '知识库'
      })
    }
    for (const doc of kb.docs) {
      if (
        doc.title.toLowerCase().includes(text) ||
        doc.content.toLowerCase().includes(text)
      ) {
        results.push({
          id: `doc-${doc.id}`,
          title: doc.title,
          subtitle: `知识库 · ${kb.name}`,
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
        id: `prompt-${prompt.id}`,
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
        id: `wf-${item.timestamp}`,
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
    if (
      trace.title.toLowerCase().includes(text) ||
      trace.detail.toLowerCase().includes(text)
    ) {
      results.push({
        id: `trace-${trace.id}`,
        title: trace.title,
        subtitle: `Trace · ${trace.type}`,
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
      const sessions = JSON.parse(raw) as Array<{
        id: string
        title: string
        updatedAt: number
      }>
      for (const session of sessions) {
        if (session.title.toLowerCase().includes(text)) {
          results.push({
            id: `chat-${session.id}`,
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
