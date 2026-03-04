<template>
  <nav class="app-sidebar">
    <div class="sidebar-scroll">
      <!-- 主导航 -->
      <div class="nav-group">
        <div class="nav-title">导航菜单</div>
        <router-link
          v-for="(item, index) in menuItems"
          :key="item.index"
          :to="item.index"
          class="nav-link"
          :class="{ active: activePath === item.index }"
          :style="{ '--delay': index * 0.05 + 's' }"
        >
          <div class="nav-icon-wrap" :class="item.theme">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div class="nav-content">
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.desc" class="nav-desc">{{ item.desc }}</span>
          </div>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          <el-icon v-else class="nav-arrow"><ArrowRight /></el-icon>
        </router-link>
      </div>

      <!-- 快捷操作 -->
      <div class="nav-group">
        <div class="nav-title">快捷操作</div>
        <button
          v-for="action in quickActions"
          :key="action.key"
          class="quick-btn"
          :class="action.theme"
          @click="handleAction(action.key)"
        >
          <el-icon><component :is="action.icon" /></el-icon>
          <span>{{ action.label }}</span>
        </button>
      </div>

      <!-- 最近访问 -->
      <div class="nav-group">
        <div class="nav-title">最近访问</div>
        <div class="recent-list">
          <div
            v-for="recent in recentItems"
            :key="recent.name"
            class="recent-item"
          >
            <span class="recent-icon">{{ recent.icon }}</span>
            <span class="recent-name">{{ recent.name }}</span>
            <span class="recent-time">{{ recent.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <div class="sidebar-footer">
      <div class="usage-card">
        <div class="usage-header">
          <span class="usage-title">存储空间</span>
          <span class="usage-percent">48%</span>
        </div>
        <div class="usage-bar">
          <div class="usage-fill" style="width: 48%">
            <div class="usage-glow"></div>
          </div>
        </div>
        <div class="usage-detail">
          <span>已用 2.4 GB</span>
          <span>共 5 GB</span>
        </div>
      </div>

      <button class="upgrade-btn">
        <el-icon><Promotion /></el-icon>
        <span>升级专业版</span>
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowRight,
  Calendar,
  ChatDotRound,
  Document,
  House,
  MagicStick,
  MapLocation,
  Monitor,
  Notebook,
  OfficeBuilding,
  Plus,
  Promotion,
  Reading,
  Rank,
  Setting,
  TrendCharts,
  Upload,
  UserFilled,
  View
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const menuItems = [
  {
    index: '/home',
    label: '首页',
    desc: '数据概览',
    icon: House,
    theme: 'theme-home'
  },
  {
    index: '/preview',
    label: '在线预览',
    desc: '文档预览',
    icon: Document,
    theme: 'theme-preview'
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
    index: '/map',
    label: '地图菜单',
    desc: '位置服务',
    icon: MapLocation,
    theme: 'theme-map'
  },
  {
    index: '/users',
    label: '用户列表',
    desc: '成员管理',
    icon: UserFilled,
    theme: 'theme-users'
  },
  {
    index: '/high-school-schedule',
    label: '高中课表',
    desc: '教师排课',
    icon: Calendar,
    theme: 'theme-schedule'
  },
  {
    index: '/frontend-interview',
    label: '前端面试',
    desc: 'Vue 与 React',
    icon: Reading,
    theme: 'theme-interview'
  },
  {
    index: '/ai-workflow',
    label: 'AI工作流',
    desc: '产品创意生成',
    icon: MagicStick,
    theme: 'theme-ai'
  },
  {
    index: '/vending-monitor',
    label: '3D贩卖机',
    desc: '实时监控',
    icon: Monitor,
    theme: 'theme-monitor'
  },
  {
    index: '/fund-estimate',
    label: '基金估值',
    desc: '实时追踪',
    icon: TrendCharts,
    theme: 'theme-fund'
  },
  {
    index: '/vending-list',
    label: '贩卖机管理',
    desc: '设备列表',
    icon: Promotion,
    theme: 'theme-vending'
  },
  {
    index: '/yuanyuan-diary',
    label: '圆圆舔狗日记',
    desc: '追爱复盘',
    icon: Notebook,
    theme: 'theme-diary'
  },
  {
    index: '/pc-builder',
    label: '自选装机',
    desc: '电商比价',
    icon: Setting,
    theme: 'theme-pc'
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

const quickActions = [
  { key: 'new', label: '新建表单', icon: Plus, theme: 'q-primary' },
  { key: 'import', label: '导入文件', icon: Upload, theme: 'q-secondary' }
]

const recentItems = ref([
  { icon: '📋', name: '用户反馈表单', time: '10分钟前' },
  { icon: '📄', name: '年度报告.pdf', time: '1小时前' },
  { icon: '🗺️', name: '北京天安门', time: '2小时前' }
])

const activePath = computed(() => route.path)

const handleAction = (key: string) => {
  if (key === 'new') {
    router.push('/drag')
    ElMessage.success('开始新建表单')
  } else if (key === 'import') {
    router.push('/file-upload')
    ElMessage.success('打开文件上传')
  }
}
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
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-right: 1px solid #e2e8f0;
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.04);
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 14px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
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
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 14px;
  text-decoration: none;
  color: #475569;
  transition: all 0.25s ease;
  animation: slideIn 0.4s ease backwards;
  animation-delay: var(--delay);

  &:hover {
    background: #f1f5f9;
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
    }
  }
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
  &.theme-interview {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1d4ed8;
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
  color: #94a3b8;
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
  color: #cbd5e1;
  font-size: 12px;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}

/* Quick Actions */
.quick-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 8px;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  background: #fafafa;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &.q-primary {
    border-color: #c7d2fe;
    background: linear-gradient(135deg, #eef2ff, #f5f3ff);
    color: #6366f1;

    &:hover {
      border-color: #6366f1;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
    }
  }

  &.q-secondary {
    border-color: #d1fae5;
    background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
    color: #10b981;

    &:hover {
      border-color: #10b981;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
    }
  }

  .el-icon {
    font-size: 16px;
  }
}

/* Recent Items */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    transform: translateX(4px);
  }
}

.recent-icon {
  font-size: 14px;
}

.recent-name {
  flex: 1;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-time {
  color: #94a3b8;
  font-size: 11px;
}

/* Footer */
.sidebar-footer {
  padding: 16px 14px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}

.usage-card {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  margin-bottom: 12px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.usage-title {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.usage-percent {
  font-size: 12px;
  font-weight: 700;
  color: #6366f1;
}

.usage-bar {
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-bottom: 8px;
}

.usage-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  position: relative;
  transition: width 0.6s ease;
}

.usage-glow {
  position: absolute;
  right: 0;
  top: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6));
  animation: glowMove 2s ease-in-out infinite;
}

@keyframes glowMove {
  0%,
  100% {
    opacity: 0;
    transform: translateX(-10px);
  }
  50% {
    opacity: 1;
    transform: translateX(0);
  }
}

.usage-detail {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
}

.upgrade-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(30, 41, 59, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  .el-icon {
    font-size: 16px;
  }
}
</style>
