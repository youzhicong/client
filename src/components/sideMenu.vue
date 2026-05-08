<template>
  <nav class="app-sidebar">
    <div class="sidebar-top">
      <div class="sidebar-intro">
        <span class="sidebar-kicker">Workspace</span>
        <h3>功能矩阵</h3>
        <p>把常用业务入口整理成清晰的协作导航。</p>
      </div>
    </div>

    <div class="sidebar-scroll">
      <div class="sidebar-quick-actions">
        <button
          type="button"
          class="quick-action primary"
          @click="goToBusinessHub"
        >
          业务中台
        </button>
        <button type="button" class="quick-action" @click="goToHomeDashboard">
          首页看板
        </button>
      </div>

      <div class="nav-group">
        <div class="nav-title">导航菜单</div>
        <div
          v-for="(section, sectionIndex) in menuSections"
          :key="section.key"
          class="menu-section"
        >
          <button
            type="button"
            class="section-trigger"
            :class="{ active: sectionHasActive(section) }"
            @click="toggleSection(section.key)"
          >
            <span class="section-trigger-left">
              <span class="section-icon">
                <el-icon><component :is="section.icon" /></el-icon>
              </span>
              <span class="section-meta">
                <span class="section-title">{{ section.title }}</span>
                <span class="section-count">{{ section.items.length }} 项</span>
              </span>
            </span>
            <el-icon
              class="section-arrow"
              :class="{ opened: isSectionOpen(section.key) }"
            >
              <ArrowDown />
            </el-icon>
          </button>

          <transition name="section-collapse">
            <div v-show="isSectionOpen(section.key)" class="section-items">
              <router-link
                v-for="(item, index) in section.items"
                :key="item.index"
                :to="item.index"
                class="nav-link level-2"
                :class="{ active: isActiveMenu(item) }"
                :style="{ '--delay': getMenuDelay(sectionIndex, index) }"
              >
                <div class="nav-icon-wrap" :class="item.theme">
                  <el-icon><component :is="item.icon" /></el-icon>
                </div>
                <div class="nav-content">
                  <span class="nav-label">{{ item.label }}</span>
                  <span v-if="item.desc" class="nav-desc">{{ item.desc }}</span>
                </div>
                <span v-if="item.badge" class="nav-badge">{{
                  item.badge
                }}</span>
                <el-icon v-else class="nav-arrow"><ArrowRight /></el-icon>
              </router-link>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowDown,
  ArrowRight,
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

const route = useRoute()
const router = useRouter()

type MenuItem = {
  index: string
  label: string
  desc: string
  icon: unknown
  theme: string
  badge?: number
  exact?: boolean
  matchPaths?: string[]
}

type MenuSection = {
  key: string
  title: string
  icon: unknown
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    key: 'smart-communication',
    title: '智能沟通',
    icon: ChatDotRound,
    items: [
      {
        index: '/im',
        label: '即时通信',
        desc: '消息中心 + AI接待',
        icon: ChatDotRound,
        theme: 'theme-im',
        badge: 3
      },
      {
        index: '/ai/chat',
        label: 'AI聊天',
        desc: '模型对话测试',
        icon: ChatDotRound,
        theme: 'theme-ai-chat',
        matchPaths: ['/ai/chat']
      },
      {
        index: '/ai/settings',
        label: 'AI设置',
        desc: '模型与接口配置',
        icon: Setting,
        theme: 'theme-ai-settings',
        matchPaths: ['/ai/settings']
      },
      {
        index: '/ai/workflow',
        label: 'AI工作流',
        desc: '产品创意生成',
        icon: MagicStick,
        theme: 'theme-ai',
        matchPaths: ['/ai/workflow']
      }
    ]
  },
  {
    key: 'common',
    title: '常用功能',
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
        desc: '业务闭环总览',
        icon: Grid,
        theme: 'theme-h5config'
      },
      {
        index: '/users',
        label: '用户列表',
        desc: '成员管理',
        icon: UserFilled,
        theme: 'theme-users'
      },
      {
        index: '/map',
        label: '地图菜单',
        desc: '位置服务',
        icon: MapLocation,
        theme: 'theme-map'
      }
    ]
  },
  {
    key: 'upload-doc',
    title: '上传与文档',
    icon: Upload,
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
    key: 'teaching',
    title: '教学专区',
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
  },
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
  },
  {
    key: 'tools',
    title: '业务工具',
    icon: Setting,
    items: [
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
        index: '/approval-workflow',
        label: '审批流程',
        desc: '发起/驳回/修改',
        icon: Document,
        theme: 'theme-workflow'
      },
      {
        index: '/e-contract',
        label: '电子合同签署',
        desc: '在线签章',
        icon: Document,
        theme: 'theme-econtract'
      },
      {
        index: '/fund-estimate',
        label: '基金估值',
        desc: '实时追踪',
        icon: TrendCharts,
        theme: 'theme-fund'
      },
      {
        index: '/h5-project-config',
        label: 'H5项目配置',
        desc: '后台数据编排',
        icon: Grid,
        theme: 'theme-h5config'
      },
      {
        index: '/vending-list',
        label: '贩卖机管理',
        desc: '设备列表',
        icon: Promotion,
        theme: 'theme-vending'
      },
      {
        index: '/pc-builder',
        label: '自选装机',
        desc: '电商比价',
        icon: Setting,
        theme: 'theme-pc'
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
    key: 'visual-center',
    title: '可视化模块',
    icon: View,
    items: [
      {
        index: '/vending-monitor',
        label: '3D贩卖机',
        desc: '实时监控',
        icon: Monitor,
        theme: 'theme-monitor'
      },
      {
        index: '/spline-3d',
        label: '3D可视化',
        desc: 'Spline场景',
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

const activePath = computed(() => route.path)
const goToBusinessHub = () => {
  router.push('/business-hub')
}

const goToHomeDashboard = () => {
  router.push('/home')
}

const getMenuDelay = (sectionIndex: number, index: number) =>
  `${(sectionIndex * 0.08 + index * 0.04).toFixed(2)}s`

const isActiveMenu = (item: MenuItem) => {
  const matchPaths = item.matchPaths ?? [item.index]
  return matchPaths.some((path) => {
    if (item.exact) return activePath.value === path
    return activePath.value === path || activePath.value.startsWith(`${path}/`)
  })
}

const sectionHasActive = (section: MenuSection) =>
  section.items.some((item) => isActiveMenu(item))

const openedSections = ref<string[]>([
  'smart-communication',
  'common',
  'upload-doc',
  'games',
  'live-center'
])

const isSectionOpen = (key: string) => openedSections.value.includes(key)

const toggleSection = (key: string) => {
  if (isSectionOpen(key)) {
    openedSections.value = openedSections.value.filter((item) => item !== key)
    return
  }
  openedSections.value = [...openedSections.value, key]
}

const ensureActiveSectionOpened = () => {
  const currentSection = menuSections.find((section) =>
    sectionHasActive(section)
  )
  if (!currentSection) return
  if (!isSectionOpen(currentSection.key)) {
    openedSections.value = [...openedSections.value, currentSection.key]
  }
}

watch(activePath, ensureActiveSectionOpened, { immediate: true })
</script>

<style lang="scss" scoped>
.app-sidebar {
  width: 280px;
  height: calc(100vh - 72px);
  position: fixed;
  left: 0;
  top: 72px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  background: var(--app-sidebar-bg);
  border-right: 1px solid var(--app-sidebar-border);
  box-shadow: var(--app-sidebar-shadow);
}

.sidebar-top {
  padding: 18px 18px 8px;
}

.sidebar-intro {
  padding: 16px;
  border-radius: 22px;
  background: var(--app-gradient-soft);
  border: 1px solid rgba(29, 78, 216, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);

  h3 {
    margin: 8px 0 6px;
    color: var(--app-text-main);
    font-size: 20px;
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: var(--app-text-sub);
    font-size: 12px;
    line-height: 1.6;
  }
}

.sidebar-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--app-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 14px 20px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-sidebar-scrollbar);
    border-radius: 999px;
  }
}

.sidebar-quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 4px 18px;
}

.quick-action {
  height: 38px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.64);
  color: var(--app-text-main);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &.primary {
    background: var(--app-gradient-brand);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 14px 28px rgba(29, 78, 216, 0.2);
  }
}

.nav-title {
  padding: 0 12px;
  margin-bottom: 12px;
  color: var(--app-sidebar-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.menu-section {
  margin-bottom: 10px;
}

.section-trigger {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  color: var(--app-sidebar-text);
  cursor: pointer;

  &:hover {
    background: var(--app-sidebar-hover);
    border-color: var(--app-border);
  }

  &.active {
    background: var(--app-sidebar-section-active-bg);
    color: var(--app-sidebar-section-active-text);
    border-color: rgba(29, 78, 216, 0.12);
  }
}

.section-trigger-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--app-sidebar-icon-bg);
  color: var(--app-accent);
  font-size: 15px;
}

.section-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
}

.section-count {
  margin-top: 2px;
  font-size: 11px;
  color: var(--app-sidebar-muted);
}

.section-arrow {
  font-size: 12px;
  color: var(--app-sidebar-muted);
  transition: transform 0.2s ease;

  &.opened {
    transform: rotate(180deg);
  }
}

.section-items {
  padding: 8px 0 2px 6px;
}

.section-collapse-enter-active,
.section-collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.section-collapse-enter-from,
.section-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.section-collapse-enter-to,
.section-collapse-leave-from {
  max-height: 560px;
  opacity: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  padding: 11px 12px;
  border: 1px solid transparent;
  border-radius: 18px;
  color: var(--app-sidebar-text);
  text-decoration: none;
  animation: slideIn 0.4s ease backwards;
  animation-delay: var(--delay);
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.62);
    border-color: var(--app-border);
    transform: translateX(3px);

    .nav-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &.active {
    background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
    border-color: rgba(255, 255, 255, 0.18);
    color: #fff;
    box-shadow: 0 18px 28px rgba(29, 78, 216, 0.26);

    .nav-icon-wrap {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
    }

    .nav-desc,
    .nav-arrow {
      color: rgba(255, 255, 255, 0.72);
      opacity: 1;
      transform: translateX(0);
    }

    .nav-badge {
      background: #fff;
      color: #0f172a;
    }
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.nav-icon-wrap {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 16px;
}

.theme-home,
.theme-users,
.theme-live-ops,
.theme-h5config {
  background: linear-gradient(135deg, #dbeafe, #e0f2fe);
  color: #1d4ed8;
}
.theme-im,
.theme-upload,
.theme-game-snake,
.theme-live-money,
.theme-pc {
  background: linear-gradient(135deg, #dcfce7, #ccfbf1);
  color: #0f766e;
}
.theme-map,
.theme-live-data,
.theme-meal,
.theme-fund,
.theme-econtract {
  background: linear-gradient(135deg, #fef3c7, #ffedd5);
  color: #b45309;
}
.theme-preview,
.theme-ai,
.theme-game-memory,
.theme-vending {
  background: linear-gradient(135deg, #f5f3ff, #fce7f3);
  color: #7c3aed;
}
.theme-editor,
.theme-announcement,
.theme-workflow,
.theme-monitor {
  background: linear-gradient(135deg, #cffafe, #dbeafe);
  color: #0f766e;
}
.theme-drag,
.theme-game-hall,
.theme-schedule {
  background: linear-gradient(135deg, #ecfccb, #dcfce7);
  color: #3f6212;
}
.theme-classlottery,
.theme-interview,
.theme-live-room,
.theme-campus {
  background: linear-gradient(135deg, #dbeafe, #ddd6fe);
  color: #4338ca;
}
.theme-ai-chat,
.theme-live,
.theme-diary {
  background: linear-gradient(135deg, #ffe4e6, #ffedd5);
  color: #c2410c;
}
.theme-game-merge,
.theme-ai-settings {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}
.theme-spline {
  background: linear-gradient(135deg, #0f172a, #1d4ed8);
  color: #fff;
}

.nav-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.nav-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.nav-desc {
  margin-top: 2px;
  color: var(--app-sidebar-muted);
  font-size: 11px;
}

.nav-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #dc2626, #fb7185);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.nav-arrow {
  color: var(--app-sidebar-arrow);
  font-size: 12px;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}

@media (max-width: 1120px) {
  .app-sidebar {
    width: 248px;
  }
}

@media (max-width: 820px) {
  .app-sidebar {
    display: none;
  }
}
</style>
