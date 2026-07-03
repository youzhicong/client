import {
  ChatDotRound,
  Connection,
  DataAnalysis,
  Grid,
  MagicStick,
  Monitor,
  Notebook,
  Odometer,
  Operation,
  Reading,
  Setting,
  Timer,
  Tools,
  UserFilled
} from '@element-plus/icons-vue'
import {
  aiModuleIconThemes,
  aiPlatformSections,
  type AiModuleKey
} from './ai-platform'
import { defaultHomePath } from './product'
import { routeNameByPath } from './routes'

export type MenuItem = {
  index: string
  label: string
  desc: string
  icon: unknown
  theme: string
  routeName?: string
  badge?: number
  exact?: boolean
  matchPaths?: string[]
}

export type MenuSection = {
  key: string
  title: string
  icon: unknown
  items: MenuItem[]
}

export type ProjectWorkspace = {
  key: string
  title: string
  subtitle: string
  icon: unknown
  homePath: string
  sections: MenuSection[]
}

const moduleIcons: Record<AiModuleKey, unknown> = {
  dashboard: Odometer,
  apps: Grid,
  workflow: MagicStick,
  chat: ChatDotRound,
  knowledge: Notebook,
  prompts: Reading,
  tools: Tools,
  playground: Operation,
  observability: Monitor,
  settings: Setting,
  api: Connection,
  automation: Timer
}

const buildAiSections = (): MenuSection[] =>
  aiPlatformSections.map((section) => ({
    key: section.key,
    title: section.title,
    icon: MagicStick,
    items: section.modules.map((module) => ({
      index: module.path,
      label: module.label,
      desc: module.desc,
      icon: moduleIcons[module.key],
      theme: aiModuleIconThemes[module.key],
      routeName: module.routeName,
      matchPaths: module.matchPaths ?? [module.path]
    }))
  }))

export const allProjectWorkspaces: ProjectWorkspace[] = [
  {
    key: 'ai-workspace',
    title: 'FlowAgent',
    subtitle: '企业级 AI Agent 平台',
    icon: MagicStick,
    homePath: defaultHomePath,
    sections: [
      ...buildAiSections(),
      {
        key: 'account',
        title: '账号',
        icon: UserFilled,
        items: [
          {
            index: '/profile',
            label: '个人中心',
            desc: '个人资料',
            icon: UserFilled,
            theme: 'theme-users',
            routeName: 'profile'
          },
          {
            index: '/account-settings',
            label: '账号设置',
            desc: '偏好与安全',
            icon: Setting,
            theme: 'theme-ai-settings',
            routeName: 'account-settings'
          },
          {
            index: '/help-center',
            label: '帮助中心',
            desc: '平台使用说明',
            icon: DataAnalysis,
            theme: 'theme-interview',
            routeName: 'help-center'
          }
        ]
      }
    ]
  }
]

export const projectWorkspaces = allProjectWorkspaces
export const defaultProjectWorkspace: ProjectWorkspace = projectWorkspaces[0]!

export const resolveProjectByPath = (path: string) => {
  return (
    allProjectWorkspaces.find((project) =>
      project.sections.some((section) =>
        section.items.some((item) => {
          const matchPaths = item.matchPaths ?? [item.index]
          return matchPaths.some((target) => {
            if (item.exact) return path === target
            return path === target || path.startsWith(`${target}/`)
          })
        })
      )
    ) || null
  )
}

export const resolveMenuItemByPath = (path: string) => {
  for (const project of allProjectWorkspaces) {
    for (const section of project.sections) {
      for (const item of section.items) {
        const matchPaths = item.matchPaths ?? [item.index]
        const matched = matchPaths.some((target) => {
          if (item.exact) return path === target
          return path === target || path.startsWith(`${target}/`)
        })
        if (matched) {
          return { project, section, item }
        }
      }
    }
  }

  return null
}

export const resolveVisibleProjectByPath = (path: string): ProjectWorkspace => {
  return resolveProjectByPath(path) ?? defaultProjectWorkspace
}

export const isPathVisibleInNavigation = (path: string) =>
  resolveMenuItemByPath(path) !== null

export const resolveBreadcrumbProject = (path: string): ProjectWorkspace => {
  const menuContext = resolveMenuItemByPath(path)
  if (!menuContext) return defaultProjectWorkspace
  return menuContext.project
}

export const resolveRouteNameByPath = (path: string) => routeNameByPath[path]

export const resolveMenuRouteName = (path: string) => {
  const matched = resolveMenuItemByPath(path)
  if (!matched) return routeNameByPath[path]

  return matched.item.routeName || routeNameByPath[matched.item.index]
}
