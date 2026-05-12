import {
  Aim,
  Calendar,
  ChatDotRound,
  Compass,
  Document,
  EditPen,
  Food,
  Grid,
  House,
  MagicStick,
  MapLocation,
  Monitor,
  Notebook,
  OfficeBuilding,
  Promotion,
  Reading,
  Rank,
  School,
  Setting,
  TrendCharts,
  TrophyBase,
  Upload,
  UserFilled,
  View
} from '@element-plus/icons-vue'

export type MenuItem = {
  index: string
  label: string
  desc: string
  icon: unknown
  theme: string
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

export const projectWorkspaces: ProjectWorkspace[] = [
  {
    key: 'collaboration',
    title: '协同工作台',
    subtitle: '消息、公告、审批与账号协同',
    icon: ChatDotRound,
    homePath: '/home',
    sections: [
      {
        key: 'workspace-core',
        title: '工作台',
        icon: House,
        items: [
          {
            index: '/home',
            label: '首页',
            desc: '数据概览',
            icon: House,
            theme: 'theme-home'
          },
          {
            index: '/business-hub',
            label: '业务中台',
            desc: '项目总览',
            icon: Grid,
            theme: 'theme-h5config'
          },
          {
            index: '/im',
            label: '即时通信',
            desc: '消息中心与 AI 接待',
            icon: ChatDotRound,
            theme: 'theme-im',
            badge: 3
          },
          {
            index: '/announcement/list',
            label: '公告管理',
            desc: '发布与统计',
            icon: Document,
            theme: 'theme-announcement',
            matchPaths: [
              '/announcement/list',
              '/announcement/publish',
              '/announcement/detail'
            ]
          }
        ]
      },
      {
        key: 'workspace-members',
        title: '成员与支持',
        icon: UserFilled,
        items: [
          {
            index: '/users',
            label: '用户列表',
            desc: '成员管理',
            icon: UserFilled,
            theme: 'theme-users'
          },
          {
            index: '/profile',
            label: '个人中心',
            desc: '个人资料与资产',
            icon: UserFilled,
            theme: 'theme-users'
          },
          {
            index: '/account-settings',
            label: '账号设置',
            desc: '偏好与安全',
            icon: Setting,
            theme: 'theme-ai-settings'
          },
          {
            index: '/help-center',
            label: '帮助中心',
            desc: '快速指引',
            icon: Reading,
            theme: 'theme-interview'
          }
        ]
      },
      {
        key: 'workspace-process',
        title: '协同流程',
        icon: Document,
        items: [
          {
            index: '/approval-workflow',
            label: '审批流程',
            desc: '发起、驳回与修改',
            icon: Document,
            theme: 'theme-workflow'
          },
          {
            index: '/e-contract',
            label: '电子合同签署',
            desc: '在线签章',
            icon: Document,
            theme: 'theme-econtract'
          }
        ]
      }
    ]
  },
  {
    key: 'ai-workspace',
    title: 'AI 工作台',
    subtitle: '聊天、工作流与模型配置',
    icon: MagicStick,
    homePath: '/ai/workflow',
    sections: [
      {
        key: 'ai-core',
        title: 'AI 能力',
        icon: MagicStick,
        items: [
          {
            index: '/ai/chat',
            label: 'AI 聊天',
            desc: '模型对话测试',
            icon: ChatDotRound,
            theme: 'theme-ai-chat',
            matchPaths: ['/ai/chat']
          },
          {
            index: '/ai/workflow',
            label: 'AI 工作流',
            desc: '产品创意生成',
            icon: MagicStick,
            theme: 'theme-ai',
            matchPaths: ['/ai/workflow']
          },
          {
            index: '/ai/settings',
            label: 'AI 设置',
            desc: '模型与接口配置',
            icon: Setting,
            theme: 'theme-ai-settings',
            matchPaths: ['/ai/settings']
          }
        ]
      }
    ]
  },
  {
    key: 'teaching',
    title: '教学工具',
    subtitle: '排课、抽问与面试训练',
    icon: School,
    homePath: '/high-school-schedule',
    sections: [
      {
        key: 'teaching-tools',
        title: '教学菜单',
        icon: School,
        items: [
          {
            index: '/high-school-schedule',
            label: '高中课表',
            desc: '教师排课',
            icon: Calendar,
            theme: 'theme-schedule'
          },
          {
            index: '/class-lottery',
            label: '课堂抽奖',
            desc: '随机提问',
            icon: School,
            theme: 'theme-classlottery'
          },
          {
            index: '/frontend-interview',
            label: '前端面试',
            desc: 'Vue 与 React',
            icon: Reading,
            theme: 'theme-interview'
          }
        ]
      }
    ]
  },
  {
    key: 'live-operations',
    title: '直播与运营',
    subtitle: '直播中心与业务执行',
    icon: Monitor,
    homePath: '/live-center/overview',
    sections: [
      {
        key: 'live-center',
        title: '直播模块',
        icon: Monitor,
        items: [
          {
            index: '/live-center/overview',
            label: '直播总览',
            desc: '模块总控台',
            icon: Monitor,
            theme: 'theme-live'
          },
          {
            index: '/live-center/data',
            label: '直播数据',
            desc: '趋势与大盘',
            icon: TrendCharts,
            theme: 'theme-live-data'
          },
          {
            index: '/live-center/rooms',
            label: '直播间',
            desc: '观看与切流',
            icon: View,
            theme: 'theme-live-room'
          },
          {
            index: '/live-center/monetization',
            label: '礼物充值',
            desc: '互动与转化',
            icon: Promotion,
            theme: 'theme-live-money'
          },
          {
            index: '/live-center/operations',
            label: '运营协同',
            desc: '排班与执行',
            icon: Setting,
            theme: 'theme-live-ops'
          }
        ]
      }
    ]
  },
  {
    key: 'tools',
    title: '轻工具箱',
    subtitle: '零散能力收进一个项目里',
    icon: Setting,
    homePath: '/fund-estimate',
    sections: [
      {
        key: 'office-tools',
        title: '业务工具',
        icon: Setting,
        items: [
          {
            index: '/fund-estimate',
            label: '基金估算',
            desc: '实时追踪',
            icon: TrendCharts,
            theme: 'theme-fund'
          },
          {
            index: '/h5-project-config',
            label: 'H5 项目配置',
            desc: '后台数据编排',
            icon: Grid,
            theme: 'theme-h5config'
          },
          {
            index: '/pc-builder',
            label: '自选装机',
            desc: '电商比价',
            icon: Setting,
            theme: 'theme-pc'
          },
          {
            index: '/map',
            label: '地图菜单',
            desc: '位置服务',
            icon: MapLocation,
            theme: 'theme-map'
          },
          {
            index: '/meal-lottery',
            label: '三餐抽奖',
            desc: '今天吃什么',
            icon: Food,
            theme: 'theme-meal'
          },
          {
            index: '/company-lottery',
            label: '公司抽奖',
            desc: '年会活动现场',
            icon: TrophyBase,
            theme: 'theme-live-money'
          },
          {
            index: '/yuanyuan-diary',
            label: '圆圆舔狗日记',
            desc: '追爱复盘',
            icon: Notebook,
            theme: 'theme-diary'
          }
        ]
      },
      {
        key: 'editor-tools',
        title: '内容与编辑',
        icon: EditPen,
        items: [
          {
            index: '/preview',
            label: '在线预览',
            desc: '文档预览',
            icon: Document,
            theme: 'theme-preview'
          },
          {
            index: '/rich-text-editor',
            label: '富文本编辑器',
            desc: '内容排版工作台',
            icon: EditPen,
            theme: 'theme-editor'
          },
          {
            index: '/file-upload',
            label: '文件上传',
            desc: '分片续传',
            icon: Upload,
            theme: 'theme-upload'
          },
          {
            index: '/drag',
            label: '拖拽功能',
            desc: '表单构建',
            icon: Rank,
            theme: 'theme-drag'
          }
        ]
      },
      {
        key: 'games',
        title: '游戏中心',
        icon: TrophyBase,
        items: [
          {
            index: '/games',
            label: '游戏大厅',
            desc: '前端小游戏',
            icon: Compass,
            theme: 'theme-game-hall',
            exact: true
          },
          {
            index: '/games/snake',
            label: '贪吃蛇',
            desc: '经典街机',
            icon: Aim,
            theme: 'theme-game-snake'
          },
          {
            index: '/games/2048',
            label: '2048',
            desc: '合并数字',
            icon: Grid,
            theme: 'theme-game-merge'
          },
          {
            index: '/games/memory',
            label: '记忆翻牌',
            desc: '考验记忆',
            icon: MagicStick,
            theme: 'theme-game-memory'
          }
        ]
      }
    ]
  },
  {
    key: 'visualization',
    title: '可视化中心',
    subtitle: '设备、三维与数字场景',
    icon: View,
    homePath: '/vending-monitor',
    sections: [
      {
        key: 'visual-scenes',
        title: '可视化模块',
        icon: View,
        items: [
          {
            index: '/vending-monitor',
            label: '3D 贩卖机',
            desc: '实时监控',
            icon: Monitor,
            theme: 'theme-monitor'
          },
          {
            index: '/vending-list',
            label: '贩卖机管理',
            desc: '设备列表',
            icon: Promotion,
            theme: 'theme-vending'
          },
          {
            index: '/spline-3d',
            label: '3D 可视化',
            desc: 'Spline 场景',
            icon: View,
            theme: 'theme-spline'
          },
          {
            index: '/campus-3d',
            label: '校园全景',
            desc: '数字校园',
            icon: OfficeBuilding,
            theme: 'theme-campus'
          }
        ]
      }
    ]
  }
]

export const resolveProjectByPath = (path: string) => {
  return (
    projectWorkspaces.find((project) =>
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
  for (const project of projectWorkspaces) {
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
