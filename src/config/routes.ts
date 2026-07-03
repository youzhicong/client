import type { RouteRecordRaw } from 'vue-router'
import { defaultHomePath } from './product'

export const loginRoute: RouteRecordRaw = {
  path: '/login',
  name: 'login',
  component: () => import('@/views/login/index.vue'),
  meta: { title: '登录' }
}

const coreLayoutRoutes: RouteRecordRaw[] = [
  { path: '/home', name: 'home', redirect: defaultHomePath },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/use/index.vue'),
    meta: { title: '用户中心' }
  },
  {
    path: '/account-settings',
    name: 'account-settings',
    component: () => import('@/views/account-settings/index.vue'),
    meta: { title: '账号设置' }
  },
  {
    path: '/help-center',
    name: 'help-center',
    component: () => import('@/views/help-center/index.vue'),
    meta: { title: '帮助中心' }
  },
  { path: '/ai', redirect: defaultHomePath },
  {
    path: '/ai/dashboard',
    name: 'ai-dashboard',
    component: () => import('@/views/ai/dashboard/index.vue'),
    meta: { title: '概览', moduleKey: 'dashboard' }
  },
  {
    path: '/ai/apps',
    name: 'ai-apps',
    component: () => import('@/views/ai/apps/index.vue'),
    meta: { title: '应用广场', moduleKey: 'apps' }
  },
  {
    path: '/ai/automation',
    name: 'ai-automation',
    component: () => import('@/views/ai-automation/index.vue'),
    meta: { title: '自动化中心' }
  },
  {
    path: '/ai/workflow',
    name: 'ai-workflow',
    component: () => import('@/views/ai-workflow/index.vue'),
    meta: { title: 'Multi-Agent 工作流' }
  },
  {
    path: '/ai/workflow/detail',
    name: 'ai-workflow-detail',
    component: () => import('@/views/ai-workflow/detail.vue'),
    meta: { title: '工作流详情' }
  },
  {
    path: '/ai/workflow/report',
    name: 'ai-workflow-report',
    component: () => import('@/views/ai-workflow/report.vue'),
    meta: { title: '工作流可视化报告' }
  },
  {
    path: '/ai/chat',
    name: 'ai-chat',
    component: () => import('@/views/ai-chat/index.vue'),
    meta: { title: 'Agent 聊天' }
  },
  {
    path: '/ai/knowledge',
    name: 'ai-knowledge',
    component: () => import('@/views/ai/knowledge/index.vue'),
    meta: { title: '知识库', moduleKey: 'knowledge' }
  },
  {
    path: '/ai/prompts',
    name: 'ai-prompts',
    component: () => import('@/views/ai/prompts/index.vue'),
    meta: { title: 'Prompt 工程', moduleKey: 'prompts' }
  },
  {
    path: '/ai/tools',
    name: 'ai-tools',
    component: () => import('@/views/ai/tools/index.vue'),
    meta: { title: '工具插件', moduleKey: 'tools' }
  },
  {
    path: '/ai/playground',
    name: 'ai-playground',
    component: () => import('@/views/ai/playground/index.vue'),
    meta: { title: '模型 Playground', moduleKey: 'playground' }
  },
  {
    path: '/ai/observability',
    name: 'ai-observability',
    component: () => import('@/views/ai/observability/index.vue'),
    meta: { title: '观测 Trace', moduleKey: 'observability' }
  },
  {
    path: '/ai/settings',
    name: 'ai-settings',
    component: () => import('@/views/ai-workflow/settings.vue'),
    meta: { title: '模型配置' }
  },
  {
    path: '/ai/api',
    name: 'ai-api',
    component: () => import('@/views/ai/api/index.vue'),
    meta: { title: 'API 接入', moduleKey: 'api' }
  },
  { path: '/ai-workflow', redirect: '/ai/workflow' },
  {
    path: '/ai-workflow/detail',
    redirect: (to) => ({ path: '/ai/workflow/detail', query: to.query })
  },
  { path: '/ai-workflow/settings', redirect: '/ai/settings' },
  { path: '/:pathMatch(.*)*', redirect: '/ai/dashboard' }
]

export const layoutChildren: RouteRecordRaw[] = coreLayoutRoutes

export const appRoutes: RouteRecordRaw[] = [
  loginRoute,
  {
    path: '/',
    name: 'layout',
    redirect: defaultHomePath,
    component: () => import('@/layout/index.vue'),
    children: layoutChildren
  }
]

const collectRouteEntries = (
  routes: RouteRecordRaw[],
  parentPath = ''
): Array<{ path: string; name?: RouteRecordRaw['name'] }> => {
  const entries: Array<{ path: string; name?: RouteRecordRaw['name'] }> = []

  for (const route of routes) {
    const fullPath = route.path.startsWith('/')
      ? route.path
      : `${parentPath}/${route.path}`.replace(/\/+/g, '/')

    entries.push({ path: fullPath, name: route.name })

    if (route.children?.length) {
      const childBase = fullPath.replace(/\/:[^/]*(\?)?$/g, '')
      entries.push(...collectRouteEntries(route.children, childBase))
    }
  }

  return entries
}

export const registeredRouteEntries = collectRouteEntries(layoutChildren)

export const routeNameByPath = registeredRouteEntries.reduce<
  Record<string, string>
>((map, entry) => {
  if (typeof entry.name === 'string') {
    map[entry.path] = entry.name

    if (entry.path.includes('/:')) {
      const basePath = entry.path.split('/:')[0]
      if (basePath && !map[basePath]) {
        map[basePath] = entry.name
      }
    }
  }
  return map
}, {})
