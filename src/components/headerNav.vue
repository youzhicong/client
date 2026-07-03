<template>
  <div class="app-header" :class="{ 'portfolio-mode': isPortfolioMode }">
    <div class="header-left">
      <button
        type="button"
        class="mobile-menu-btn"
        aria-label="打开导航菜单"
        @click="toggleMobileSidebar"
      >
        <el-icon><Menu /></el-icon>
      </button>
      <button class="logo" type="button" @click="goHome">
        <div class="logo-icon">
          <span class="logo-spark">FA</span>
        </div>
        <div class="logo-text">
          <span class="logo-name">{{ productShortName }}</span>
          <span class="logo-version">{{ productTagline }}</span>
        </div>
      </button>

      <div v-if="currentProject && !isPortfolioMode" class="project-pill">
        <span class="project-pill-label">当前项目</span>
        <span class="project-pill-title">{{ currentProject.title }}</span>
      </div>
    </div>

    <div class="header-center">
      <div class="search-box" :class="{ focused: searchFocused }">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="搜索模块、知识库、Prompt、工作流…"
          class="search-input"
          @focus="searchFocused = true"
          @blur="handleSearchBlur"
          @keyup.enter="handleSearch"
        />
        <div class="search-shortcut"><span>Ctrl</span><span>K</span></div>

        <div v-if="showSearchPanel" class="search-panel">
          <button
            v-for="result in searchResults"
            :key="result.id"
            type="button"
            class="search-result"
            @mousedown.prevent="goToSearchResult(result)"
          >
            <span class="search-result-icon">
              <el-icon v-if="result.icon"
                ><component :is="result.icon"
              /></el-icon>
              <span v-else class="search-result-emoji">{{
                categoryEmoji(result.category)
              }}</span>
            </span>
            <span class="search-result-copy">
              <span class="search-result-title">{{ result.title }}</span>
              <span class="search-result-meta">
                {{ result.sectionTitle }} · {{ result.subtitle }}
              </span>
            </span>
          </button>

          <div
            v-if="!searchResults.length && searchQuery.trim()"
            class="search-empty"
          >
            没有找到匹配内容
          </div>
          <div
            v-else-if="!searchQuery.trim()"
            class="search-empty search-empty-hint"
          >
            输入关键词搜索导航、知识库、Prompt、工作流与 Trace
          </div>
        </div>
      </div>
    </div>

    <div class="header-right">
      <router-link
        v-if="isPortfolioMode"
        to="/ai/workflow?q=咖啡&run=1"
        class="header-quick-cta"
      >
        运行工作流
      </router-link>

      <div
        class="header-status"
        :title="headerStatusTitle"
        @click="handleStatusClick"
      >
        <span
          class="status-dot"
          :class="{ ready: isPortfolioMode ? isModelReady : true }"
        ></span>
        <strong>{{ headerStatusLabel }}</strong>
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
        <div ref="notificationWrapRef" class="notification-wrap">
          <button
            class="action-btn"
            :class="{ 'has-badge': unreadCount > 0, active: showNotifications }"
            title="通知中心"
            @click.stop="toggleNotifications"
          >
            <el-icon><Bell /></el-icon>
            <span v-if="unreadCount" class="action-badge">{{
              unreadCount > 9 ? '9+' : unreadCount
            }}</span>
          </button>

          <div v-if="showNotifications" class="notification-panel" @click.stop>
            <div class="notification-head">
              <strong>通知中心</strong>
              <div class="notification-head-actions">
                <button type="button" @click="markAllRead">全部已读</button>
                <button type="button" @click="clearAllNotifications">
                  清空
                </button>
              </div>
            </div>
            <div v-if="!notifications.length" class="notification-empty">
              暂无通知
            </div>
            <button
              v-for="item in notifications.slice(0, 8)"
              :key="item.id"
              type="button"
              class="notification-item"
              :class="{ unread: !item.read }"
              @click="openNotification(item)"
            >
              <span class="notification-dot" />
              <span class="notification-copy">
                <strong>{{ item.title }}</strong>
                <span>{{ item.body }}</span>
                <em>{{ formatNotifyTime(item.createdAt) }}</em>
              </span>
            </button>
            <router-link
              to="/ai/observability"
              class="notification-foot"
              @click="showNotifications = false"
            >
              查看全部 Trace →
            </router-link>
          </div>
        </div>

        <button class="action-btn" title="设置" @click="goToSettings">
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
              {{ isPortfolioMode ? '就绪' : '在线协作中' }}
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountStore, useUserStore } from '@/stores'
import {
  ArrowDown,
  Bell,
  Menu,
  Moon,
  QuestionFilled,
  Search,
  Setting,
  Sunny,
  SwitchButton,
  User
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { useTheme } from '@/composables/useTheme'
import {
  projectWorkspaces,
  resolveVisibleProjectByPath
} from '@/config/navigation'
import { defaultAppHomePath, isPortfolioMode } from '@/config/portfolio'
import { productShortName, productTagline } from '@/config/product'
import { getAISettings, normalizeAISettings } from '@/services/ai'
import {
  clearNotifications,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type PlatformNotification
} from '@/services/platform-notifications'
import {
  searchPlatformContent,
  type GlobalSearchResult
} from '@/services/global-search'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const notificationWrapRef = ref<HTMLElement | null>(null)
const searchFocused = ref(false)
const showNotifications = ref(false)
const notifications = ref<PlatformNotification[]>(getNotifications())
const { isDark, toggleTheme } = useTheme()
const { toggleMobileSidebar } = useMobileSidebar()

const searchableMenus = projectWorkspaces.flatMap((project) =>
  project.sections.flatMap((section) =>
    section.items.map((item) => ({
      index: item.index,
      label: item.label,
      desc: item.desc,
      icon: item.icon,
      projectTitle: project.title,
      sectionTitle: section.title,
      keywords: [
        item.label,
        item.desc,
        project.title,
        project.subtitle,
        section.title
      ]
        .join(' ')
        .toLowerCase()
    }))
  )
)

const portfolioSearchMenus = searchableMenus.filter(
  (item) =>
    item.index.startsWith('/ai') ||
    item.index.startsWith('/profile') ||
    item.index.startsWith('/help') ||
    item.index.startsWith('/account')
)

const menuSearchPool = isPortfolioMode ? portfolioSearchMenus : searchableMenus

const isModelReady = computed(() => {
  const settings = normalizeAISettings(getAISettings())
  return Boolean(settings.apiKey && settings.model && settings.baseUrl)
})

const headerStatusLabel = computed(() =>
  isPortfolioMode
    ? isModelReady.value
      ? '模型就绪'
      : '待配置模型'
    : '运行正常'
)

const headerStatusTitle = computed(() =>
  isPortfolioMode ? '点击查看模型配置' : '今日同步 12 次'
)

const displayName = computed(
  () => userStore.user?.name || accountStore.profile.name || '管理员'
)
const displayEmail = computed(
  () =>
    userStore.user?.email || accountStore.profile.email || 'demo@flowagent.app'
)
const displayAvatar = computed(
  () =>
    userStore.user?.avatar ||
    accountStore.profile.avatar ||
    'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
)
const currentProject = computed(() => resolveVisibleProjectByPath(route.path))

const unreadCount = computed(() => getUnreadNotificationCount())

const searchResults = computed((): GlobalSearchResult[] => {
  const keyword = searchQuery.value.trim()
  if (!keyword) {
    return menuSearchPool.slice(0, 6).map((item) => ({
      id: `menu-${item.index}`,
      title: item.label,
      subtitle: item.desc,
      path: item.index,
      category: 'menu' as const,
      icon: item.icon,
      sectionTitle: item.sectionTitle
    }))
  }
  return searchPlatformContent(keyword, menuSearchPool)
})

const showSearchPanel = computed(() => searchFocused.value)

const categoryEmoji = (category: GlobalSearchResult['category']) =>
  ({
    menu: '🧭',
    knowledge: '📚',
    prompt: '📝',
    trace: '📈',
    workflow: '⚡',
    chat: '💬'
  })[category] || '📌'

const refreshNotifications = () => {
  notifications.value = getNotifications()
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) refreshNotifications()
}

const markAllRead = () => {
  markAllNotificationsRead()
  refreshNotifications()
}

const clearAllNotifications = () => {
  clearNotifications()
  refreshNotifications()
}

const formatNotifyTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const openNotification = (item: PlatformNotification) => {
  markNotificationRead(item.id)
  refreshNotifications()
  showNotifications.value = false
  if (item.path) void router.push(item.path)
}

const goHome = () => router.push(defaultAppHomePath)
const goToSettings = () => {
  void router.push(isPortfolioMode ? '/ai/settings' : '/account-settings')
}

const handleStatusClick = () => {
  if (isPortfolioMode) {
    goToSettings()
  }
}

const goToSearchResult = (result: GlobalSearchResult) => {
  searchQuery.value = ''
  searchFocused.value = false
  void router.push(
    result.query ? { path: result.path, query: result.query } : result.path
  )
}

const handleToggleTheme = () => {
  const theme = toggleTheme()
  ElMessage.info(theme === 'dark' ? '已切换到深色模式' : '已切换到浅色模式')
}

const handleSearch = () => {
  const firstResult = searchResults.value[0]
  if (firstResult) {
    goToSearchResult(firstResult)
    return
  }
  ElMessage.info('没有找到匹配的内容')
}

const handleSearchBlur = () => {
  window.setTimeout(() => {
    searchFocused.value = false
  }, 120)
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push(isPortfolioMode ? '/ai/settings' : '/account-settings')
      break
    case 'help':
      router.push('/help-center')
      break
    case 'logout':
      accountStore.recordActivity(
        '退出登录',
        '已安全退出当前账户会话。',
        '账号'
      )
      userStore.delUser()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}

const handleGlobalShortcut = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInputRef.value?.focus()
    searchFocused.value = true
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (!showNotifications.value) return
  const target = event.target as Node | null
  if (
    notificationWrapRef.value &&
    target &&
    !notificationWrapRef.value.contains(target)
  ) {
    showNotifications.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
  window.addEventListener('click', handleClickOutside)
  refreshNotifications()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
  window.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.app-header {
  width: 100%;
  height: var(--app-header-height);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: var(--app-sidebar-width) minmax(320px, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 0 20px 0 0;
  background: var(--app-header-bg);
  border-bottom: 1px solid var(--app-header-border);
  box-shadow: var(--app-header-shadow);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  gap: 12px;
  padding-left: 20px;
  height: 100%;
  border-right: 1px solid var(--app-header-border);
}

.mobile-menu-btn {
  display: none;
  width: 38px;
  height: 38px;
  border: 1px solid var(--app-header-surface-border);
  border-radius: 10px;
  background: var(--app-header-surface);
  color: var(--app-header-text);
  cursor: pointer;
  place-items: center;

  &:hover {
    background: var(--app-header-hover);
  }

  .el-icon {
    font-size: 18px;
  }
}

.logo {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  cursor: pointer;
}

.app-header.portfolio-mode {
  backdrop-filter: blur(18px) saturate(1.15);
}

.header-quick-cta {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--app-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
  transition:
    transform 0.15s ease,
    background 0.15s ease;

  &:hover {
    background: var(--app-accent-strong);
    transform: translateY(-1px);
  }
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: var(--app-radius-sm);
  background: var(--app-gradient-brand);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.logo:hover .logo-icon {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.32);
}

.logo-spark {
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.logo-text {
  display: grid;
  gap: 2px;
  align-items: flex-start;
}

.logo-name {
  color: var(--app-header-text);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.1;
}

.logo-version {
  color: var(--app-header-muted);
  font-size: 11px;
}

.project-pill {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 12px;
  margin-left: 4px;
  border-radius: var(--app-radius-sm);
  background: var(--app-header-surface);
  border: 1px solid var(--app-header-surface-border);
}

.project-pill-label {
  color: var(--app-header-muted);
  font-size: 11px;
  line-height: 1.2;
}

.project-pill-title {
  color: var(--app-header-text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
}

.search-input {
  width: 100%;
  height: 42px;
  padding: 0 90px 0 46px;
  border: 1px solid var(--app-search-border);
  border-radius: 10px;
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
  right: 12px;
  display: flex;
  gap: 4px;

  span {
    min-width: 24px;
    height: 22px;
    padding: 0 6px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-search-shortcut-border);
    border-radius: 6px;
    background: var(--app-search-shortcut-bg);
    color: var(--app-header-muted);
    font-size: 11px;
    font-weight: 600;
  }
}

.search-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 8px;
  border: 1px solid var(--app-header-surface-border);
  border-radius: 12px;
  background: var(--app-search-panel-bg);
  box-shadow: var(--app-search-panel-shadow);
  backdrop-filter: blur(16px);
}

.search-result {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--app-search-panel-hover);
  }
}

.search-result-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  flex-shrink: 0;
}

.search-result-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.search-result-title {
  color: var(--app-header-text);
  font-size: 13px;
  font-weight: 600;
}

.search-result-meta,
.search-empty,
.status-label,
.status-meta,
.user-status {
  color: var(--app-header-muted);
  font-size: 11px;
}

.search-empty {
  padding: 12px 10px;
}

.search-empty-hint {
  color: var(--app-text-faint);
  font-size: 11px;
  line-height: 1.6;
}

.search-result-emoji {
  font-size: 16px;
  line-height: 1;
}

.notification-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(360px, calc(100vw - 32px));
  max-height: 420px;
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--app-header-surface-border);
  border-radius: 14px;
  background: var(--app-search-panel-bg);
  box-shadow: var(--app-search-panel-shadow);
  backdrop-filter: blur(16px);
  z-index: 1001;
}

.notification-wrap {
  position: relative;
}

.notification-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px 10px;

  strong {
    font-size: 13px;
    color: var(--app-header-text);
  }
}

.notification-head-actions {
  display: flex;
  gap: 8px;

  button {
    border: 0;
    background: transparent;
    color: var(--app-accent);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
}

.notification-empty {
  padding: 20px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--app-text-faint);
}

.notification-item {
  width: 100%;
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--app-search-panel-hover);
  }

  &.unread .notification-dot {
    background: var(--app-accent);
  }
}

.notification-dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
}

.notification-copy {
  display: grid;
  gap: 3px;
  min-width: 0;

  strong {
    font-size: 12px;
    color: var(--app-header-text);
  }

  span {
    font-size: 11px;
    color: var(--app-text-sub);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  em {
    font-style: normal;
    font-size: 10px;
    color: var(--app-text-faint);
  }
}

.notification-foot {
  display: block;
  margin-top: 6px;
  padding: 10px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--app-accent);
  text-decoration: none;
  border-radius: 8px;

  &:hover {
    background: var(--app-search-panel-hover);
  }
}

.header-right {
  justify-content: flex-end;
  gap: 10px;
}

.header-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--app-header-surface-border);
  border-radius: 999px;
  background: var(--app-header-surface);

  strong {
    color: var(--app-header-text);
    font-size: 12px;
    line-height: 1;
    font-weight: 600;
  }
}

.app-header.portfolio-mode .header-status {
  cursor: pointer;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-warning);
  flex-shrink: 0;

  &.ready {
    background: #16a34a;
    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.16);
  }
}

.header-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  position: relative;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
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
    font-size: 17px;
  }
}

.action-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px 5px 5px;
  border: 1px solid var(--app-header-surface-border);
  border-radius: 10px;
  background: var(--app-header-surface);
  cursor: pointer;

  &:hover {
    background: var(--app-header-hover-surface);
    border-color: var(--app-header-hover-border);
  }
}

.user-avatar,
.dropdown-avatar {
  overflow: hidden;
  background: #dbeafe;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
}

.user-info {
  display: grid;
  gap: 2px;
}

.user-name,
.dropdown-name {
  color: var(--app-header-text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}

.status-dot.online {
  background: #22c55e;
}

.user-arrow {
  color: var(--app-header-muted);
  font-size: 12px;
}

:deep(.user-dropdown) {
  min-width: 240px;
  padding: 8px;
  border: 1px solid var(--app-dropdown-border);
  border-radius: 12px;
  background: var(--app-dropdown-bg);
  box-shadow: var(--app-dropdown-shadow);
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 6px;
  border-radius: 10px;
  background: var(--app-dropdown-header-bg);
}

.dropdown-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
}

.dropdown-info {
  display: grid;
  gap: 4px;
}

.dropdown-email {
  color: var(--app-dropdown-muted);
  font-size: 12px;
}

:deep(.el-dropdown-menu__item) {
  margin: 2px 0;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--app-dropdown-text);
  font-size: 13px;
  gap: 8px;

  &:hover {
    background: var(--app-dropdown-hover);
    color: var(--app-accent);
  }
}

@media (max-width: 1120px) {
  .app-header {
    grid-template-columns: 220px 1fr;
  }

  .header-status,
  .project-pill,
  .header-quick-cta {
    display: none;
  }
}

@media (max-width: 820px) {
  .app-header {
    height: auto;
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 14px;
  }

  .header-left {
    border-right: none;
    padding-left: 0;
  }

  .mobile-menu-btn {
    display: grid;
  }

  .header-left,
  .header-center,
  .header-right {
    width: 100%;
  }

  .search-shortcut {
    display: none;
  }

  .header-right {
    justify-content: space-between;
  }

  .user-info {
    display: none;
  }
}
</style>
