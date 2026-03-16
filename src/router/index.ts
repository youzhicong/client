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
          path: '/file-upload',
          name: 'file-upload',
          component: () => import('@/views/file-upload/index.vue'),
          meta: { title: '文件上传' }
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
          path: '/users',
          name: 'users',
          component: () => import('@/views/users/index.vue'),
          meta: { title: '用户列表' }
        },
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
        {
          path: '/high-school-schedule',
          name: 'high-school-schedule',
          component: () => import('@/views/high-school-schedule/index.vue'),
          meta: { title: '高中课表' }
        },
        {
          path: '/class-lottery',
          name: 'class-lottery',
          component: () => import('@/views/class-lottery/index.vue'),
          meta: { title: '上课抽奖提问' }
        },
        {
          path: '/frontend-interview',
          name: 'frontend-interview',
          component: () => import('@/views/frontend-interview/index.vue'),
          meta: { title: '前端面试' }
        },
        {
          path: '/games/:gameId?',
          name: 'games',
          component: () => import('@/views/game-center/index.vue'),
          meta: { title: '游戏中心' }
        },
        {
          path: '/live-center',
          name: 'live-center',
          component: () => import('@/views/live-center/index.vue'),
          redirect: '/live-center/overview',
          meta: { title: '直播模块' },
          children: [
            {
              path: 'overview',
              name: 'live-center-overview',
              component: () =>
                import('@/views/live-center/pages/LiveCenterOverviewPage.vue'),
              meta: { title: '直播总览' }
            },
            {
              path: 'data',
              name: 'live-center-data',
              component: () =>
                import('@/views/live-center/pages/LiveCenterDataPage.vue'),
              meta: { title: '直播数据' }
            },
            {
              path: 'rooms',
              name: 'live-center-rooms',
              component: () =>
                import('@/views/live-center/pages/LiveCenterRoomsPage.vue'),
              meta: { title: '直播间' }
            },
            {
              path: 'rooms/:roomId',
              name: 'live-center-room-studio',
              component: () =>
                import('@/views/live-center/pages/LiveCenterRoomStudioPage.vue'),
              meta: { title: '房间预览' }
            },
            {
              path: 'monetization',
              name: 'live-center-monetization',
              component: () =>
                import('@/views/live-center/pages/LiveCenterMonetizationPage.vue'),
              meta: { title: '礼物充值' }
            },
            {
              path: 'operations',
              name: 'live-center-operations',
              component: () =>
                import('@/views/live-center/pages/LiveCenterOperationsPage.vue'),
              meta: { title: '运营协同' }
            }
          ]
        },
        {
          path: '/meal-lottery',
          name: 'meal-lottery',
          component: () => import('@/views/meal-lottery/index.vue'),
          meta: { title: '三餐抽奖' }
        },
        {
          path: '/approval-workflow',
          name: 'approval-workflow',
          component: () => import('@/views/approval-workflow/index.vue'),
          meta: { title: '审批流程可视化' }
        },
        {
          path: '/e-contract',
          name: 'e-contract',
          component: () => import('@/views/e-contract/index.vue'),
          meta: { title: '电子合同签署' }
        },
        {
          path: '/announcement/list',
          name: 'announcement-list',
          component: () => import('@/views/announcement/list.vue'),
          meta: { title: '公告管理' }
        },
        {
          path: '/announcement/publish',
          name: 'announcement-publish',
          component: () => import('@/views/announcement/publish.vue'),
          meta: { title: '发布公告' }
        },
        {
          path: '/announcement/detail/:id',
          name: 'announcement-detail',
          component: () => import('@/views/announcement/detail.vue'),
          meta: { title: '公告详情' }
        },
        {
          path: '/ai',
          redirect: '/ai/workflow'
        },
        {
          path: '/ai/workflow',
          name: 'ai-workflow',
          component: () => import('@/views/ai-workflow/index.vue'),
          meta: { title: 'AI 工作流' }
        },
        {
          path: '/ai/workflow/detail',
          name: 'ai-workflow-detail',
          component: () => import('@/views/ai-workflow/detail.vue'),
          meta: { title: '工作流详情' }
        },
        {
          path: '/ai/chat',
          name: 'ai-chat',
          component: () => import('@/views/ai-chat/index.vue'),
          meta: { title: 'AI 聊天' }
        },
        {
          path: '/ai/settings',
          name: 'ai-settings',
          component: () => import('@/views/ai-workflow/settings.vue'),
          meta: { title: 'AI 设置' }
        },
        {
          path: '/ai-workflow',
          redirect: '/ai/workflow'
        },
        {
          path: '/ai-workflow/detail',
          redirect: (to) => ({
            path: '/ai/workflow/detail',
            query: to.query
          })
        },
        {
          path: '/ai-workflow/settings',
          redirect: '/ai/settings'
        },
        {
          path: '/vending-monitor',
          name: 'vending-monitor',
          component: () => import('@/views/vending-monitor/index.vue'),
          meta: { title: '3D 贩卖机监控' }
        },
        {
          path: '/fund-estimate',
          name: 'fund-estimate',
          component: () => import('@/views/fund-estimate/index.vue'),
          meta: { title: '基金估值' }
        },
        {
          path: '/h5-project-config',
          name: 'h5-project-config',
          component: () => import('@/views/h5-project-config/index.vue'),
          meta: { title: 'H5项目配置' }
        },
        {
          path: '/vending-list',
          name: 'vending-list',
          component: () => import('@/views/vending-list/index.vue'),
          meta: { title: '贩卖机管理' }
        },
        {
          path: '/yuanyuan-diary',
          name: 'yuanyuan-diary',
          component: () => import('@/views/yuanyuan-diary/index.vue'),
          meta: { title: '圆圆舔狗日记' }
        },
        {
          path: '/pc-builder',
          name: 'pc-builder',
          component: () => import('@/views/pc-builder/index.vue'),
          meta: { title: '自选装机' }
        },
        {
          path: '/spline-3d',
          name: 'spline-3d',
          component: () => import('@/views/spline-3d/index.vue'),
          meta: { title: '3D 可视化' }
        },
        {
          path: '/campus-3d',
          name: 'campus-3d',
          component: () => import('@/views/campus-3d/index.vue'),
          meta: { title: '校园全景' }
        }
      ]
    }
  ]
})

export default router
