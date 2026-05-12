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

      <div v-if="currentProject" class="project-pill">
        <span class="project-pill-label">当前项目</span>
        <span class="project-pill-title">{{ currentProject.title }}</span>
      </div>
    </div>

    <div class="header-center">
      <div class="search-box" :class="{ focused: searchFocused }">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索页面、功能或项目"
          class="search-input"
          @focus="searchFocused = true"
          @blur="handleSearchBlur"
          @keyup.enter="handleSearch"
        />
        <div class="search-shortcut"><span>Ctrl</span><span>K</span></div>

        <div v-if="showSearchPanel" class="search-panel">
          <button
            v-for="result in searchResults"
            :key="result.index"
            type="button"
            class="search-result"
            @mousedown.prevent="goToSearchResult(result.index)"
          >
            <span class="search-result-icon">
              <el-icon><component :is="result.icon" /></el-icon>
            </span>
            <span class="search-result-copy">
              <span class="search-result-title">{{ result.label }}</span>
              <span class="search-result-meta">
                {{ result.projectTitle }} / {{ result.sectionTitle }}
              </span>
            </span>
          </button>

          <div v-if="!searchResults.length" class="search-empty">
            没有找到匹配的菜单
          </div>
        </div>
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
          <span class="action-badge">3</span>
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
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { projectWorkspaces, resolveProjectByPath } from '@/config/navigation'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()
const searchQuery = ref('')
const searchFocused = ref(false)
const { isDark, toggleTheme } = useTheme()

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
const currentProject = computed(() => resolveProjectByPath(route.path))
const searchResults = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return searchableMenus.slice(0, 6)

  return searchableMenus
    .filter((item) => item.keywords.includes(keyword))
    .slice(0, 6)
})
const showSearchPanel = computed(() => searchFocused.value)

const goHome = () => router.push('/home')
const goToIM = () => router.push('/im')

const goToSearchResult = (path: string) => {
  searchQuery.value = ''
  searchFocused.value = false
  void router.push(path)
}

const handleToggleTheme = () => {
  const theme = toggleTheme()
  ElMessage.info(theme === 'dark' ? '已切换到深色模式' : '已切换到浅色模式')
}

const handleSearch = () => {
  const firstResult = searchResults.value[0]
  if (firstResult) {
    goToSearchResult(firstResult.index)
    return
  }
  ElMessage.info('没有找到匹配的项目菜单')
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
      router.push('/account-settings')
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
  grid-template-columns: 280px minmax(320px, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
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

.logo-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #1d4ed8;
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
  padding: 6px 10px;
  border-left: 1px solid var(--app-header-border);
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
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
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
    background: #f8fafc;
  }
}

.search-result-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
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

.header-right {
  justify-content: flex-end;
  gap: 10px;
}

.header-status {
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid var(--app-header-surface-border);
  border-radius: 10px;
  background: var(--app-header-surface);
  display: grid;
  gap: 2px;

  strong {
    color: var(--app-header-text);
    font-size: 13px;
    line-height: 1.2;
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
  .project-pill {
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
