import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/',
      name: 'layout',
      redirect: '/home',
      component: () => import('@/layout/index.vue'),
      children: [
        {
          path: '/home',
          name: 'home',
          component: () => import('@/views/home/index.vue'),
          meta: { title: '首页' }
        },
        {
          path: '/preview',
          name: 'preview',
          component: () => import('@/views/preview/index.vue'),
          meta: { title: '在线预览' }
        },
        {
          path: '/drag',
          name: 'drag',
          component: () => import('@/views/drag/index.vue'),
          meta: { title: '拖拽功能' }
        },
        {
          path: '/im',
          name: 'im',
          component: () => import('@/views/im/index.vue'),
          meta: { title: '即时通信' }
        },
        {
          path: '/map',
          name: 'map',
          component: () => import('@/views/map/index.vue'),
          meta: { title: '地图菜单' }
        },
        {
          path: '/ai-workflow',
          name: 'ai-workflow',
          component: () => import('@/views/ai-workflow/index.vue'),
          meta: { title: 'AI工作流' }
        },
        {
          path: '/ai-workflow/detail',
          name: 'ai-workflow-detail',
          component: () => import('@/views/ai-workflow/detail.vue'),
          meta: { title: '工作流详情' }
        },
        {
          path: '/ai-workflow/settings',
          name: 'ai-workflow-settings',
          component: () => import('@/views/ai-workflow/settings.vue'),
          meta: { title: '工作流设置' }
        }
      ]
    }
  ]
})

export default router
