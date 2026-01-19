import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue')
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
          component: () => import('@/views/home/index.vue')
        },
        {
          path: '/preview',
          name: 'preview',
          component: () => import('@/views/preview/index.vue')
        },
        {
          path: '/drag',
          name: 'drag',
          component: () => import('@/views/drag/index.vue')
        },
        {
          path: '/im',
          name: 'im',
          component: () => import('@/views/im/index.vue')
        },
        {
          path: '/map',
          name: 'map',
          component: () => import('@/views/map/index.vue')
        }
      ]
    }
  ]
})

export default router
