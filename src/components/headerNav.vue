<template>
  <div class="app-header">
    <div class="header-left">
      <div class="logo" @click="goHome">
        <div class="logo-icon">
          <span class="logo-spark">⚡</span>
        </div>
        <div class="logo-text">
          <span class="logo-name">数字化平台</span>
          <span class="logo-version">v1.0</span>
        </div>
      </div>
    </div>

    <div class="header-center">
      <div class="search-box" :class="{ focused: searchFocused }">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索功能、页面..."
          class="search-input"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keyup.enter="handleSearch"
        />
        <div class="search-shortcut"><span>⌘</span><span>K</span></div>
      </div>
    </div>

    <div class="header-right">
      <div class="header-actions">
        <button
          class="action-btn"
          :class="{ active: isDark }"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="handleToggleTheme"
        >
          <el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
        </button>
        <button class="action-btn has-badge" title="通知">
          <el-icon><Bell /></el-icon>
          <span class="action-badge pulse">3</span>
        </button>
        <button class="action-btn" title="消息" @click="goToIM">
          <el-icon><ChatDotRound /></el-icon>
        </button>
        <button
          class="action-btn"
          title="设置"
          @click="router.push('/account-settings')"
        >
          <el-icon><Setting /></el-icon>
        </button>
      </div>

      <div class="header-divider"></div>

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-profile">
          <div class="user-avatar">
            <img :src="displayAvatar" alt="avatar" />
          </div>
          <div class="user-info">
            <span class="user-name">{{ displayName }}</span>
            <span class="user-status">
              <span class="status-dot online"></span>
              在线
            </span>
          </div>
          <el-icon class="user-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <div class="dropdown-header">
              <div class="dropdown-avatar">
                <img :src="displayAvatar" alt="avatar" />
              </div>
              <div class="dropdown-info">
                <div class="dropdown-name">{{ displayName }}</div>
                <div class="dropdown-email">{{ displayEmail }}</div>
              </div>
            </div>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              账号设置
            </el-dropdown-item>
            <el-dropdown-item command="help">
              <el-icon><QuestionFilled /></el-icon>
              帮助中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountStore, useUserStore } from '@/stores'
import {
  ArrowDown,
  Bell,
  ChatDotRound,
  Moon,
  QuestionFilled,
  Search,
  Setting,
  Sunny,
  SwitchButton,
  User
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()
const searchQuery = ref('')
const searchFocused = ref(false)
const { isDark, toggleTheme } = useTheme()

const displayName = computed(
  () => userStore.user?.name || accountStore.profile.name || '管理员'
)
const displayEmail = computed(
  () =>
    userStore.user?.email || accountStore.profile.email || 'admin@yzcTool.com'
)
const displayAvatar = computed(
  () =>
    userStore.user?.avatar ||
    accountStore.profile.avatar ||
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
)

const goHome = () => router.push('/home')
const goToIM = () => router.push('/im')

const handleToggleTheme = () => {
  const theme = toggleTheme()
  ElMessage.info(theme === 'dark' ? '已切换到深色模式' : '已切换到浅色模式')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    ElMessage.info(`搜索: ${searchQuery.value}`)
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/account-settings')
      break
    case 'help':
      router.push('/help-center')
      break
    case 'logout':
      accountStore.recordActivity(
        '退出登录',
        '已安全退出当前账号会话。',
        '账号'
      )
      userStore.delUser()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  width: 100%;
  height: 64px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--app-header-bg);
  border-bottom: 1px solid var(--app-header-border);
  box-shadow: var(--app-header-shadow);
  backdrop-filter: blur(12px);
}

.header-left {
  display: flex;
  align-items: center;
  width: 260px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);

    .logo-icon {
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
    }
  }
}

.logo-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  transition: all 0.3s ease;
}

.logo-spark {
  font-size: 22px;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(10deg);
  }
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-header-text);
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.logo-version {
  font-size: 10px;
  color: var(--app-header-muted);
  font-weight: 500;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 520px;
  margin: 0 32px;
}

.search-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;

  &.focused {
    .search-input {
      background: var(--app-search-bg-focus);
      border-color: var(--app-search-focus-border);
      box-shadow: var(--app-search-focus-shadow);
    }

    .search-icon {
      color: var(--app-search-focus-color);
    }
  }
}

.search-icon {
  position: absolute;
  left: 16px;
  color: var(--app-header-muted);
  font-size: 16px;
  transition: color 0.2s ease;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 90px 0 46px;
  border: 1px solid var(--app-search-border);
  border-radius: 14px;
  background: var(--app-search-bg);
  color: var(--app-header-text);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: var(--app-header-muted);
  }
}

.search-shortcut {
  position: absolute;
  right: 14px;
  display: flex;
  gap: 4px;

  span {
    padding: 3px 7px;
    background: var(--app-search-shortcut-bg);
    border: 1px solid var(--app-search-shortcut-border);
    border-radius: 6px;
    color: var(--app-header-muted);
    font-size: 11px;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--app-header-subtle);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-header-hover);
    color: var(--app-header-text);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: var(--app-header-active-bg);
    color: var(--app-header-text);
    box-shadow: inset 0 0 0 1px var(--app-header-active-border);
  }

  .el-icon {
    font-size: 18px;
  }
}

.action-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: linear-gradient(135deg, #ef4444, #f87171);
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);

  &.pulse {
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 2px 16px rgba(239, 68, 68, 0.6);
  }
}

.header-divider {
  width: 1px;
  height: 28px;
  background: var(--app-header-border);
  margin: 0 8px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 6px;
  border-radius: 14px;
  background: var(--app-header-surface);
  border: 1px solid var(--app-header-surface-border);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-header-hover-surface);
    border-color: var(--app-header-hover-border);
    transform: translateY(-1px);
  }
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-header-text);
  line-height: 1;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--app-header-muted);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--app-header-subtle);

  &.online {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }
}

.user-arrow {
  color: var(--app-header-muted);
  font-size: 12px;
  transition: transform 0.2s ease;
}

:deep(.user-dropdown) {
  min-width: 220px;
  padding: 8px;
  border-radius: 16px;
  background: var(--app-dropdown-bg);
  border: 1px solid var(--app-dropdown-border);
  box-shadow: var(--app-dropdown-shadow);
}

.dropdown-header {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: var(--app-dropdown-header-bg);
  border-radius: 12px;
}

.dropdown-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.dropdown-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-dropdown-text);
}

.dropdown-email {
  font-size: 12px;
  color: var(--app-dropdown-muted);
}

:deep(.el-dropdown-menu__item) {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  gap: 10px;
  margin: 2px 0;
  transition: all 0.2s ease;

  &:hover {
    background: var(--app-dropdown-hover);
    color: var(--app-accent);
    transform: translateX(4px);
  }

  .el-icon {
    font-size: 16px;
  }
}
</style>
