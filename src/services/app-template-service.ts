import { APP_TEMPLATES, type AppTemplate } from '@/config/app-templates'
import {
  addKnowledgeDoc,
  createKnowledgeBase,
  getKnowledgeBases,
  savePromptTemplate
} from '@/services/ai-platform-store'

const INSTALLED_KEY = 'flowagent-installed-templates'

export const getInstalledTemplateIds = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(INSTALLED_KEY) || '[]')
  } catch {
    return []
  }
}

export const markTemplateInstalled = (id: string) => {
  const ids = getInstalledTemplateIds()
  if (!ids.includes(id)) {
    window.localStorage.setItem(INSTALLED_KEY, JSON.stringify([id, ...ids]))
  }
}

export const getAppTemplateById = (id: string): AppTemplate | undefined =>
  APP_TEMPLATES.find((item) => item.id === id)

export type InstallTemplateResult = {
  template: AppTemplate
  nextPath: string
  nextQuery?: Record<string, string>
  message: string
}

export const installAppTemplate = (id: string): InstallTemplateResult => {
  const template = getAppTemplateById(id)
  if (!template) {
    throw new Error('模板不存在')
  }

  if (template.prompt) {
    savePromptTemplate(template.prompt)
  }

  if (template.knowledge) {
    let kb = getKnowledgeBases().find(
      (item) => item.name === template.knowledge!.kbName
    )
    if (!kb) {
      kb = createKnowledgeBase(template.knowledge.kbName, '应用模板自动创建')
    }
    addKnowledgeDoc(
      kb.id,
      template.knowledge.docTitle,
      template.knowledge.content
    )
  }

  markTemplateInstalled(id)

  if (template.workflowKeyword) {
    return {
      template,
      nextPath: '/ai/workflow',
      nextQuery: { q: template.workflowKeyword, run: '1' },
      message: `已安装「${template.name}」，正在启动工作流…`
    }
  }

  if (template.chatQuery) {
    return {
      template,
      nextPath: '/ai/chat',
      nextQuery: { q: template.chatQuery, send: '1' },
      message: `已安装「${template.name}」，正在打开 Agent 聊天…`
    }
  }

  return {
    template,
    nextPath: '/ai/apps',
    message: `已安装「${template.name}」`
  }
}
