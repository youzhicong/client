<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo" @click="goHome">
        <div class="logo-icon">
          <span class="logo-spark">⚡</span>
        </div>
        <div class="logo-text">
          <span class="logo-name">YZC Tool</span>
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
        <button class="action-btn" title="主题" @click="toggleTheme">
          <el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
        </button>
        <button class="action-btn has-badge" title="通知">
          <el-icon><Bell /></el-icon>
          <span class="action-badge pulse">3</span>
        </button>
        <button class="action-btn" title="消息" @click="goToIM">
          <el-icon><ChatDotRound /></el-icon>
        </button>
        <button class="action-btn" title="设置">
          <el-icon><Setting /></el-icon>
        </button>
      </div>

      <div class="header-divider"></div>

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-profile">
          <div class="user-avatar">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
              alt="avatar"
            />
          </div>
          <div class="user-info">
            <span class="user-name">管理员</span>
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
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                  alt="avatar"
                />
              </div>
              <div class="dropdown-info">
                <div class="dropdown-name">管理员</div>
                <div class="dropdown-email">admin@yzcTool.com</div>
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
  </header>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
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

const router = useRouter()
const searchQuery = ref('')
const searchFocused = ref(false)
const isDark = ref(false)

const goHome = () => router.push('/home')
const goToIM = () => router.push('/im')

const toggleTheme = () => {
  isDark.value = !isDark.value
  ElMessage.info(isDark.value ? '已切换到深色模式' : '已切换到浅色模式')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    ElMessage.info(`搜索: ${searchQuery.value}`)
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中...')
      break
    case 'settings':
      ElMessage.info('账号设置功能开发中...')
      break
    case 'help':
      ElMessage.info('帮助中心功能开发中...')
      break
    case 'logout':
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
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.2);
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
  color: #fff;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.logo-version {
  font-size: 10px;
  color: #64748b;
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
      background: rgba(255, 255, 255, 0.12);
      border-color: #6366f1;
      box-shadow:
        0 0 0 4px rgba(99, 102, 241, 0.15),
        0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .search-icon {
      color: #a5b4fc;
    }
  }
}

.search-icon {
  position: absolute;
  left: 16px;
  color: #64748b;
  font-size: 16px;
  transition: color 0.2s ease;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 90px 0 46px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: #64748b;
  }
}

.search-shortcut {
  position: absolute;
  right: 14px;
  display: flex;
  gap: 4px;

  span {
    padding: 3px 7px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #64748b;
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
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
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
  background: rgba(255, 255, 255, 0.1);
  margin: 0 8px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
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
  color: #fff;
  line-height: 1;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #64748b;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;

  &.online {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }
}

.user-arrow {
  color: #64748b;
  font-size: 12px;
  transition: transform 0.2s ease;
}

/* Dropdown styles */
:deep(.user-dropdown) {
  padding: 8px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  min-width: 220px;
}

.dropdown-header {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
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
  color: #1e293b;
}

.dropdown-email {
  font-size: 12px;
  color: #64748b;
}

:deep(.el-dropdown-menu__item) {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  gap: 10px;
  margin: 2px 0;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #6366f1;
    transform: translateX(4px);
  }

  .el-icon {
    font-size: 16px;
  }
}
</style>
