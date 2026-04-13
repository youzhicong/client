<template>
  <div class="app-header">
    <div class="header-left">
      <button class="logo" type="button" @click="goHome">
        <div class="logo-icon">
          <span class="logo-spark">DP</span>
        </div>
        <div class="logo-text">
          <span class="logo-name">数字工作台</span>
          <span class="logo-version">Operations cockpit</span>
        </div>
      </button>
    </div>

    <div class="header-center">
      <div class="search-box" :class="{ focused: searchFocused }">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索页面、功能或模块"
          class="search-input"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keyup.enter="handleSearch"
        />
        <div class="search-shortcut"><span>Ctrl</span><span>K</span></div>
      </div>
    </div>

    <div class="header-right">
      <div class="header-status">
        <span class="status-label">系统状态</span>
        <strong>运行正常</strong>
        <span class="status-meta">今日同步 12 次</span>
      </div>

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

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-profile">
          <div class="user-avatar">
            <img :src="displayAvatar" alt="avatar" />
          </div>
          <div class="user-info">
            <span class="user-name">{{ displayName }}</span>
            <span class="user-status">
              <span class="status-dot online"></span>
              在线协作中
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
  height: 72px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: 260px minmax(280px, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 0 22px;
  background: var(--app-header-bg);
  border-bottom: 1px solid var(--app-header-border);
  box-shadow: var(--app-header-shadow);
  isolation: isolate;
}

.app-header::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 12% -20%,
      rgba(56, 189, 248, 0.22),
      transparent 28%
    ),
    radial-gradient(circle at 88% -30%, rgba(29, 78, 216, 0.2), transparent 30%);
  opacity: 0.8;
}

.app-header > * {
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 0;
  cursor: pointer;
  transition: transform 0.24s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.logo-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: var(--app-gradient-brand);
  box-shadow: 0 14px 32px rgba(29, 78, 216, 0.24);
}

.logo-spark {
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.logo-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-name {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--app-header-text);
}

.logo-version {
  margin-top: 3px;
  color: var(--app-header-muted);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.header-center {
  display: flex;
  justify-content: center;
}

.search-box {
  position: relative;
  width: min(100%, 620px);
  display: flex;
  align-items: center;

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
  left: 18px;
  font-size: 16px;
  color: var(--app-header-muted);
}

.search-input {
  width: 100%;
  height: 48px;
  padding: 0 96px 0 50px;
  border-radius: 18px;
  border: 1px solid var(--app-search-border);
  background: var(--app-search-bg);
  color: var(--app-header-text);
  font-size: 14px;
  outline: none;

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
    min-width: 26px;
    height: 24px;
    padding: 0 7px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1px solid var(--app-search-shortcut-border);
    background: var(--app-search-shortcut-bg);
    color: var(--app-header-muted);
    font-size: 11px;
    font-weight: 600;
  }
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.header-status {
  min-width: 120px;
  padding: 9px 12px;
  border-radius: 18px;
  border: 1px solid var(--app-header-surface-border);
  background: var(--app-header-surface);
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  strong {
    color: var(--app-header-text);
    font-size: 13px;
    line-height: 1.2;
  }
}

.status-meta {
  margin-top: 2px;
  color: var(--app-header-muted);
  font-size: 11px;
}

.status-label {
  color: var(--app-header-muted);
  font-size: 11px;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  position: relative;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--app-header-subtle);
  cursor: pointer;

  &:hover {
    background: var(--app-header-hover);
    border-color: var(--app-header-surface-border);
    color: var(--app-header-text);
  }

  &.active {
    background: var(--app-header-active-bg);
    border-color: var(--app-header-active-border);
    color: var(--app-header-text);
  }

  .el-icon {
    font-size: 18px;
  }
}

.action-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #dc2626, #f97316);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.pulse {
  animation: pulse 2.1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 7px rgba(220, 38, 38, 0);
  }
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 12px 7px 7px;
  border-radius: 18px;
  border: 1px solid var(--app-header-surface-border);
  background: var(--app-header-surface);
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);

  &:hover {
    background: var(--app-header-hover-surface);
    border-color: var(--app-header-hover-border);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 16px 32px rgba(15, 23, 42, 0.08);
  }
}

.user-avatar,
.dropdown-avatar {
  overflow: hidden;
  background: linear-gradient(135deg, #1d4ed8, #38bdf8);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  color: var(--app-header-text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.1;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-header-muted);
  font-size: 11px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
}

.user-arrow {
  color: var(--app-header-muted);
  font-size: 12px;
}

:deep(.user-dropdown) {
  min-width: 240px;
  padding: 8px;
  border-radius: 20px;
  background: var(--app-dropdown-bg);
  border: 1px solid var(--app-dropdown-border);
  box-shadow: var(--app-dropdown-shadow);
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 8px;
  border-radius: 16px;
  background: var(--app-dropdown-header-bg);
}

.dropdown-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
}

.dropdown-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-name {
  color: var(--app-dropdown-text);
  font-size: 14px;
  font-weight: 700;
}

.dropdown-email {
  color: var(--app-dropdown-muted);
  font-size: 12px;
}

:deep(.el-dropdown-menu__item) {
  margin: 2px 0;
  padding: 12px 14px;
  border-radius: 12px;
  color: var(--app-dropdown-text);
  font-size: 13px;
  gap: 10px;

  &:hover {
    background: var(--app-dropdown-hover);
    color: var(--app-accent);
  }
}

@media (max-width: 1120px) {
  .app-header {
    grid-template-columns: 220px 1fr;
    gap: 16px;
  }

  .header-status {
    display: none;
  }
}

@media (max-width: 820px) {
  .app-header {
    height: auto;
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .header-left,
  .header-center,
  .header-right {
    width: 100%;
  }

  .header-right {
    justify-content: space-between;
  }

  .user-info {
    display: none;
  }
}
</style>
