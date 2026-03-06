<template>
  <nav class="app-sidebar">
    <div class="sidebar-scroll">
      <!-- 主导航 -->
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
              <span class="section-title">{{ section.title }}</span>
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
import { useRoute } from 'vue-router'
import {
  ArrowDown,
  ArrowRight,
  Aim,
  Calendar,
  ChatDotRound,
  Compass,
  Document,
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
        index: '/im',
        label: '即时通信',
        desc: '消息中心',
        icon: ChatDotRound,
        theme: 'theme-im',
        badge: 3
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
    key: 'ai-visual',
    title: 'AI 与可视化',
    icon: MagicStick,
    items: [
      {
        index: '/ai-workflow',
        label: 'AI工作流',
        desc: '产品创意生成',
        icon: MagicStick,
        theme: 'theme-ai',
        matchPaths: ['/ai-workflow']
      },
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
const getMenuDelay = (sectionIndex: number, index: number) =>
  `${(sectionIndex * 0.08 + index * 0.04).toFixed(2)}s`

const isActiveMenu = (item: MenuItem) => {
  const matchPaths = item.matchPaths ?? [item.index]
  return matchPaths.some((path) => {
    if (item.exact) {
      return activePath.value === path
    }
    return activePath.value === path || activePath.value.startsWith(`${path}/`)
  })
}

const sectionHasActive = (section: MenuSection) => {
  return section.items.some((item) => isActiveMenu(item))
}

const openedSections = ref<string[]>(['common', 'upload-doc', 'games'])

const isSectionOpen = (key: string) => {
  return openedSections.value.includes(key)
}

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
  width: 260px;
  height: calc(100vh - 64px);
  position: fixed;
  left: 0;
  top: 64px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  background: var(--app-sidebar-bg);
  border-right: 1px solid var(--app-sidebar-border);
  box-shadow: var(--app-sidebar-shadow);
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 14px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-sidebar-scrollbar);
    border-radius: 4px;
  }
}

.nav-group {
  margin-bottom: 28px;
}

.nav-title {
  padding: 0 12px;
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--app-sidebar-muted);
}

.menu-section {
  margin-bottom: 8px;
}

.section-trigger {
  width: 100%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-radius: 12px;
  padding: 8px 10px;
  color: var(--app-sidebar-text);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-sidebar-hover);
  }

  &.active {
    background: var(--app-sidebar-section-active-bg);
    color: var(--app-sidebar-section-active-text);
  }
}

.section-trigger-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--app-sidebar-icon-bg);
  color: var(--app-sidebar-muted);
  font-size: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
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
  padding-left: 10px;
  padding-top: 6px;
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
  transform: translateY(-2px);
}

.section-collapse-enter-to,
.section-collapse-leave-from {
  max-height: 560px;
  opacity: 1;
  transform: translateY(0);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 14px;
  text-decoration: none;
  color: var(--app-sidebar-text);
  transition: all 0.25s ease;
  animation: slideIn 0.4s ease backwards;
  animation-delay: var(--delay);

  &:hover {
    background: var(--app-sidebar-hover);
    transform: translateX(4px);

    .nav-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &.active {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #fff;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
    transform: scale(1.02);

    .nav-icon-wrap {
      background: rgba(255, 255, 255, 0.2);
      box-shadow: none;
    }

    .nav-desc {
      color: rgba(255, 255, 255, 0.75);
    }

    .nav-badge {
      background: #fff;
      color: #6366f1;
    }

    .nav-arrow {
      color: rgba(255, 255, 255, 0.6);
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.level-2 {
  margin-left: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.nav-icon-wrap {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.2s ease;

  &.theme-home {
    background: #eef2ff;
    color: #6366f1;
  }
  &.theme-preview {
    background: #fdf2f8;
    color: #ec4899;
  }
  &.theme-announcement {
    background: linear-gradient(135deg, #d7f5f7 0%, #dbeafe 100%);
    color: #0f7f93;
  }
  &.theme-upload {
    background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
    color: #059669;
  }
  &.theme-drag {
    background: #f0fdf4;
    color: #22c55e;
  }
  &.theme-im {
    background: #ecfdf5;
    color: #10b981;
  }
  &.theme-map {
    background: #fffbeb;
    color: #f59e0b;
  }
  &.theme-users {
    background: #f0f9ff;
    color: #0ea5e9;
  }
  &.theme-schedule {
    background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
    color: #0f766e;
  }
  &.theme-classlottery {
    background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
    color: #1d4ed8;
  }
  &.theme-interview {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1d4ed8;
  }
  &.theme-game-hall {
    background: linear-gradient(135deg, #dcfce7 0%, #ecfccb 100%);
    color: #15803d;
  }
  &.theme-game-snake {
    background: linear-gradient(135deg, #d1fae5 0%, #bbf7d0 100%);
    color: #047857;
  }
  &.theme-game-merge {
    background: linear-gradient(135deg, #ffedd5 0%, #fde68a 100%);
    color: #c2410c;
  }
  &.theme-game-memory {
    background: linear-gradient(135deg, #ede9fe 0%, #f5d0fe 100%);
    color: #7e22ce;
  }
  &.theme-meal {
    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
    color: #b45309;
  }
  &.theme-workflow {
    background: linear-gradient(135deg, #d8f2f2 0%, #dbeafe 100%);
    color: #0f8f92;
  }
  &.theme-econtract {
    background: linear-gradient(135deg, #ffe8d4 0%, #fde68a 100%);
    color: #9a3412;
  }
  &.theme-ai {
    background: linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%);
    color: #8b5cf6;
  }
  &.theme-monitor {
    background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
    color: #14b8a6;
  }
  &.theme-fund {
    background: linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%);
    color: #d97706;
  }
  &.theme-h5config {
    background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%);
    color: #4338ca;
  }
  &.theme-vending {
    background: linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%);
    color: #7c3aed;
  }
  &.theme-diary {
    background: linear-gradient(135deg, #fef9c3 0%, #ffedd5 100%);
    color: #b45309;
  }
  &.theme-pc {
    background: linear-gradient(135deg, #dcfce7 0%, #dbeafe 100%);
    color: #166534;
  }
  &.theme-spline {
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    color: #fff;
  }
  &.theme-campus {
    background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);
    color: #fff;
  }
}

.nav-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nav-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.nav-desc {
  font-size: 11px;
  color: var(--app-sidebar-muted);
  margin-top: 1px;
}

.nav-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ef4444, #f87171);
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.nav-arrow {
  color: var(--app-sidebar-arrow);
  font-size: 12px;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}
</style>
