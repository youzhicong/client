<template>
  <div class="app-sidebar" :class="{ 'mobile-open': mobileSidebarOpen }">
    <button
      v-if="mobileSidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="关闭导航菜单"
      @click="closeMobileSidebar"
    />
    <div class="sidebar-top">
      <div v-if="isPortfolioMode" class="sidebar-title compact">
        <strong>FlowAgent</strong>
      </div>
      <div v-else class="sidebar-title">
        <strong>项目导航</strong>
        <span>按项目归类菜单，Agent 工作流优先</span>
      </div>

      <el-select
        v-if="projectWorkspaces.length > 1"
        :model-value="currentProject.key"
        class="project-select"
        placeholder="请选择项目"
        @update:model-value="handleProjectSelect"
      >
        <el-option
          v-for="project in projectWorkspaces"
          :key="project.key"
          :label="project.title"
          :value="project.key"
        />
      </el-select>
    </div>

    <div class="sidebar-scroll">
      <div v-if="isPortfolioMode" class="platform-nav">
        <div
          v-for="section in platformSections"
          :key="section.key"
          class="platform-nav-group"
        >
          <div class="platform-nav-head">{{ section.title }}</div>
          <router-link
            v-for="item in section.items"
            :key="item.index"
            :to="item.index"
            class="agent-quick-link"
            :class="{ active: isActiveMenu(item) }"
          >
            <span class="nav-icon-wrap" :class="item.theme">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <span class="agent-quick-copy">
              <strong>{{ item.label }}</strong>
              <span>{{ item.desc }}</span>
            </span>
          </router-link>
        </div>
      </div>

      <div
        v-if="!isPortfolioMode"
        class="project-summary"
        :class="{ compact: isPortfolioMode }"
      >
        <span class="project-summary-icon">
          <el-icon><component :is="currentProject.icon" /></el-icon>
        </span>
        <div class="project-summary-copy">
          <strong>{{ currentProject.title }}</strong>
          <span>{{ currentProject.subtitle }}</span>
        </div>
      </div>

      <div v-if="!isPortfolioMode" class="sidebar-actions">
        <button
          type="button"
          class="action-link action-link-primary"
          @click="goToCurrentProjectHome"
        >
          进入项目
        </button>
        <button type="button" class="action-link" @click="goToHelpCenter">
          帮助中心
        </button>
      </div>

      <div v-if="isExternalRoute" class="sidebar-panel external-notice">
        <span>当前页面不在主导航中，请返回 FlowAgent 工作区。</span>
        <button
          type="button"
          class="action-link"
          @click="goToCurrentProjectHome"
        >
          返回工作流
        </button>
      </div>

      <div v-if="recentItems.length && !isPortfolioMode" class="sidebar-panel">
        <div class="panel-head">
          <span>最近访问</span>
          <button type="button" class="panel-clear" @click="clearRecentItems">
            清空
          </button>
        </div>

        <button
          v-for="item in recentItems"
          :key="item.index"
          type="button"
          class="recent-link"
          :class="{ active: activePath === item.index }"
          @click="goToRecentItem(item.index)"
        >
          <span class="nav-icon-wrap" :class="item.theme">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <span class="recent-copy">
            <span class="recent-label">{{ item.label }}</span>
            <span class="recent-meta">
              {{ item.projectTitle }} / {{ item.sectionTitle }}
            </span>
          </span>
        </button>
      </div>

      <div v-if="!isPortfolioMode" class="nav-group">
        <div class="nav-head">
          <strong>{{ currentProject.title }}</strong>
          <span>{{ currentProject.sections.length }} 个分组</span>
        </div>

        <div
          v-for="(section, sectionIndex) in visibleSections"
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
                class="nav-link"
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
              </router-link>
            </div>
          </transition>
        </div>
      </div>

      <nav v-if="isPortfolioMode" class="sidebar-account-nav">
        <router-link
          v-for="item in accountQuickLinks"
          :key="item.index"
          :to="item.index"
          class="sidebar-account-link"
          :class="{ active: isActiveMenu(item) }"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <div v-if="isPortfolioMode" class="sidebar-footer">
        <router-link to="/ai/workflow?q=咖啡&run=1" class="sidebar-run-btn">
          ☕ 一键跑「咖啡」工作流
        </router-link>
        <router-link to="/ai/dashboard" class="sidebar-foot-link"
          >回到概览</router-link
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import {
  defaultProjectWorkspace,
  isPathVisibleInNavigation,
  projectWorkspaces,
  resolveVisibleProjectByPath,
  type MenuItem,
  type MenuSection,
  type ProjectWorkspace
} from '@/config/navigation'
import { defaultAppHomePath, isPortfolioMode } from '@/config/portfolio'
import { useRecentNavigation } from '@/composables/useRecentNavigation'

const route = useRoute()
const router = useRouter()
const { mobileSidebarOpen, closeMobileSidebar } = useMobileSidebar()
const { recentItems, recordRecentPath, clearRecentItems } =
  useRecentNavigation()

const activePath = computed(() => route.path)
const isExternalRoute = computed(
  () => isPortfolioMode && !isPathVisibleInNavigation(activePath.value)
)

const getMenuDelay = (sectionIndex: number, index: number) =>
  `${(sectionIndex * 0.05 + index * 0.03).toFixed(2)}s`

const isActiveMenu = (item: MenuItem) => {
  const matchPaths = item.matchPaths ?? [item.index]
  return matchPaths.some((path) => {
    if (item.exact) return activePath.value === path
    return activePath.value === path || activePath.value.startsWith(`${path}/`)
  })
}

const currentProjectKey = ref(resolveVisibleProjectByPath(activePath.value).key)

const currentProject = computed<ProjectWorkspace>(() => {
  return (
    projectWorkspaces.find(
      (project) => project.key === currentProjectKey.value
    ) || defaultProjectWorkspace
  )
})

const platformSections = computed(() =>
  currentProject.value.sections.filter((section) => section.key !== 'account')
)

const accountQuickLinks = computed(() => {
  const account = currentProject.value.sections.find(
    (section) => section.key === 'account'
  )
  return account?.items ?? []
})

const visibleSections = computed(() => currentProject.value.sections)

const sectionHasActive = (section: MenuSection) =>
  section.items.some((item) => isActiveMenu(item))

const buildSectionKey = (projectKey: string, sectionKey: string) =>
  `${projectKey}:${sectionKey}`

const openedSections = ref<string[]>([])

const ensureProjectSections = (project: ProjectWorkspace) => {
  const activeSection = project.sections.find((section) =>
    sectionHasActive(section)
  )
  const preferredKeys = [activeSection?.key].filter(Boolean)

  const defaultKeys =
    preferredKeys.length > 0
      ? preferredKeys.map((key) => buildSectionKey(project.key, key as string))
      : project.sections
          .slice(0, 1)
          .map((section) => buildSectionKey(project.key, section.key))

  openedSections.value = Array.from(
    new Set([
      ...openedSections.value.filter(
        (key) => !key.startsWith(`${project.key}:`)
      ),
      ...defaultKeys
    ])
  )
}

const isSectionOpen = (sectionKey: string) =>
  openedSections.value.includes(
    buildSectionKey(currentProject.value.key, sectionKey)
  )

const toggleSection = (sectionKey: string) => {
  const fullKey = buildSectionKey(currentProject.value.key, sectionKey)
  if (openedSections.value.includes(fullKey)) {
    openedSections.value = openedSections.value.filter(
      (item) => item !== fullKey
    )
    return
  }
  openedSections.value = [...openedSections.value, fullKey]
}

const switchProject = (projectKey: string) => {
  const targetProject = projectWorkspaces.find(
    (project) => project.key === projectKey
  )
  if (!targetProject) return
  currentProjectKey.value = targetProject.key
  ensureProjectSections(targetProject)
}

const handleProjectSelect = (projectKey: string) => {
  const targetProject = projectWorkspaces.find(
    (project) => project.key === projectKey
  )
  if (!targetProject) return
  switchProject(projectKey)
  void router.push(targetProject.homePath)
}

const goToCurrentProjectHome = () => {
  void router.push(
    isPortfolioMode ? defaultAppHomePath : currentProject.value.homePath
  )
}

const goToHelpCenter = () => {
  void router.push('/help-center')
}

const goToRecentItem = (path: string) => {
  void router.push(path)
}

watch(
  activePath,
  (path) => {
    closeMobileSidebar()
    const visibleProject = resolveVisibleProjectByPath(path)
    currentProjectKey.value = visibleProject.key
    ensureProjectSections(visibleProject)
    recordRecentPath(path)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.app-sidebar {
  width: var(--app-sidebar-width);
  height: calc(100vh - var(--app-header-height));
  position: fixed;
  left: 0;
  top: var(--app-header-height);
  z-index: 999;
  display: flex;
  flex-direction: column;
  background: var(--app-sidebar-bg);
  border-right: 1px solid var(--app-sidebar-border);
  box-shadow: var(--app-sidebar-shadow);
}

.sidebar-top {
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--app-border);
  background: linear-gradient(
    180deg,
    rgba(37, 99, 235, 0.04) 0%,
    transparent 100%
  );
}

.sidebar-title.compact {
  margin-bottom: 0;

  strong {
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--app-accent);
    font-weight: 800;
  }
}

.sidebar-title {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;

  strong {
    color: var(--app-text-main);
    font-size: 15px;
    line-height: 1.2;
  }

  span {
    color: var(--app-text-sub);
    font-size: 12px;
    line-height: 1.5;
  }
}

.project-select {
  width: 100%;
}

.sidebar-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 14px 12px 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-sidebar-scrollbar);
    border-radius: 999px;
  }
}

.platform-nav {
  display: grid;
  gap: 16px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.platform-nav-group {
  display: grid;
  gap: 4px;
}

.platform-nav-head {
  padding: 0 12px 6px;
  color: var(--app-text-faint);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.agent-quick-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  text-decoration: none;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.15s ease;

  &:hover {
    background: var(--app-sidebar-hover);
    transform: translateX(2px);
  }

  &.active {
    background: var(--app-accent-soft);
    border-color: var(--app-accent-muted);
    box-shadow: var(--app-shadow-sm);

    .agent-quick-copy strong {
      color: var(--app-accent);
    }

    .nav-icon-wrap {
      background: var(--app-accent);
      color: #fff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.22);
    }
  }
}

.agent-quick-copy {
  min-width: 0;
  display: grid;
  gap: 2px;

  strong {
    color: var(--app-sidebar-text);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
  }

  span {
    color: var(--app-sidebar-muted);
    font-size: 11px;
    line-height: 1.4;
  }
}

.project-summary.compact {
  padding: 10px 12px;
  margin-bottom: 10px;

  .project-summary-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .project-summary-copy span {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.project-summary,
.sidebar-panel,
.nav-group {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.project-summary {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  margin-bottom: 12px;
}

.project-summary-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: var(--app-radius-sm);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 16px;
  flex-shrink: 0;
}

.project-summary-copy {
  min-width: 0;
  display: grid;
  gap: 3px;

  strong {
    color: var(--app-text-main);
    font-size: 13px;
    line-height: 1.3;
  }

  span {
    color: var(--app-text-sub);
    font-size: 12px;
    line-height: 1.4;
  }
}

.sidebar-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.action-link {
  height: 34px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  color: var(--app-text-main);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    border-color: #bfdbfe;
    color: var(--app-accent);
  }
}

.action-link-primary {
  background: var(--app-accent);
  border-color: var(--app-accent);
  color: #fff;

  &:hover {
    background: var(--app-accent-strong);
    border-color: var(--app-accent-strong);
    color: #fff;
  }
}

.sidebar-panel {
  padding: 12px;
  margin-bottom: 12px;
}

.external-notice {
  display: grid;
  gap: 8px;
  border: 1px dashed #fbbf24;
  border-radius: 10px;
  background: #fffbeb;

  span {
    color: #92400e;
    font-size: 12px;
    line-height: 1.6;
  }

  .action-link {
    justify-self: start;
  }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  span {
    color: var(--app-text-main);
    font-size: 13px;
    font-weight: 700;
  }
}

.panel-clear {
  border: 0;
  background: transparent;
  color: var(--app-text-sub);
  font-size: 12px;
  cursor: pointer;
}

.recent-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: var(--app-sidebar-hover);
    border-color: var(--app-border);
  }

  &.active {
    background: var(--app-accent-soft);
    border-color: var(--app-accent-muted);
  }
}

.recent-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.recent-label,
.nav-label {
  color: var(--app-sidebar-text);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
}

.recent-meta,
.nav-desc,
.section-count,
.nav-head span {
  color: var(--app-sidebar-muted);
  font-size: 11px;
  line-height: 1.4;
}

.nav-group {
  padding: 12px;
}

.nav-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  strong {
    color: var(--app-sidebar-text);
    font-size: 14px;
    font-weight: 700;
  }
}

.menu-section + .menu-section {
  margin-top: 6px;
}

.section-trigger {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--app-sidebar-text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: var(--app-sidebar-hover);
    border-color: var(--app-border);
  }

  &.active {
    background: var(--app-surface-muted);
    border-color: var(--app-accent-muted);
  }
}

.section-trigger-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.section-icon,
.nav-icon-wrap {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 14px;
  flex-shrink: 0;
}

.section-icon {
  background: var(--app-surface-muted);
  color: var(--app-accent);
}

.section-meta,
.nav-content {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
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
  padding: 4px 0 2px 0;
}

.section-collapse-enter-active,
.section-collapse-leave-active {
  transition: all 0.18s ease;
  overflow: hidden;
}

.section-collapse-enter-from,
.section-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.section-collapse-enter-to,
.section-collapse-leave-from {
  max-height: 520px;
  opacity: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--app-sidebar-text);
  text-decoration: none;
  animation: slideIn 0.28s ease backwards;
  animation-delay: var(--delay);
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: var(--app-sidebar-hover);
    border-color: var(--app-border);
  }

  &.active {
    background: var(--app-accent-soft);
    border-color: var(--app-accent-muted);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nav-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.theme-home,
.theme-users,
.theme-live-ops,
.theme-h5config {
  background: #eff6ff;
  color: #2563eb;
}

.theme-im,
.theme-upload,
.theme-game-snake,
.theme-live-money,
.theme-pc {
  background: #ecfdf5;
  color: #0f766e;
}

.theme-map,
.theme-live-data,
.theme-meal,
.theme-fund,
.theme-econtract {
  background: #fffbeb;
  color: #b45309;
}

.theme-preview,
.theme-ai,
.theme-game-memory,
.theme-vending {
  background: #faf5ff;
  color: #7c3aed;
}

.theme-editor,
.theme-announcement,
.theme-workflow,
.theme-monitor {
  background: #ecfeff;
  color: #0f766e;
}

.theme-drag,
.theme-game-hall,
.theme-schedule {
  background: #f7fee7;
  color: #3f6212;
}

.theme-classlottery,
.theme-interview,
.theme-live-room,
.theme-campus {
  background: #eef2ff;
  color: #4338ca;
}

.theme-ai-chat,
.theme-live,
.theme-diary {
  background: #fff7ed;
  color: #c2410c;
}

.theme-game-merge,
.theme-ai-settings {
  background: #fef3c7;
  color: #92400e;
}

.theme-spline {
  background: #dbeafe;
  color: #1e3a8a;
}

.sidebar-account-nav {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sidebar-footer {
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px dashed var(--app-border);
  display: grid;
  gap: 8px;
}

.sidebar-run-btn {
  display: block;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--app-accent) 0%,
    var(--app-secondary) 100%
  );
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.24);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(37, 99, 235, 0.3);
  }
}

.sidebar-foot-link {
  display: block;
  padding: 6px 8px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--app-text-faint);
  text-decoration: none;

  &:hover {
    color: var(--app-accent);
  }
}

.sidebar-account-link {
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--app-sidebar-muted);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: var(--app-sidebar-hover);
    color: var(--app-sidebar-text);
  }

  &.active {
    background: var(--app-accent-soft);
    color: var(--app-accent);
  }
}

@media (max-width: 1120px) {
  .app-sidebar {
    width: 248px;
  }
}

@media (max-width: 820px) {
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 998;
    border: 0;
    padding: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
    cursor: pointer;
  }

  .app-sidebar {
    display: flex;
    z-index: 999;
    transform: translateX(-105%);
    transition: transform 0.24s ease;
    box-shadow: none;
  }

  .app-sidebar.mobile-open {
    transform: translateX(0);
    box-shadow: 8px 0 32px rgba(15, 23, 42, 0.18);
  }
}

@media (min-width: 821px) {
  .sidebar-backdrop {
    display: none;
  }
}
</style>
