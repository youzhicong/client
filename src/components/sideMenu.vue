<template>
  <div class="app-sidebar">
    <div class="sidebar-top">
      <div class="sidebar-title">
        <strong>项目导航</strong>
        <span>按项目归类菜单，减少主导航堆叠</span>
      </div>

      <el-select
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
      <div class="project-summary">
        <span class="project-summary-icon">
          <el-icon><component :is="currentProject.icon" /></el-icon>
        </span>
        <div class="project-summary-copy">
          <strong>{{ currentProject.title }}</strong>
          <span>{{ currentProject.subtitle }}</span>
        </div>
      </div>

      <div class="sidebar-actions">
        <button
          type="button"
          class="action-link action-link-primary"
          @click="goToCurrentProjectHome"
        >
          进入项目
        </button>
        <button type="button" class="action-link" @click="goToBusinessHub">
          查看总览
        </button>
      </div>

      <div v-if="recentItems.length" class="sidebar-panel">
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

      <div class="nav-group">
        <div class="nav-head">
          <strong>{{ currentProject.title }}</strong>
          <span>{{ currentProject.sections.length }} 个分组</span>
        </div>

        <div
          v-for="(section, sectionIndex) in currentProject.sections"
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  defaultProjectWorkspace,
  projectWorkspaces,
  resolveProjectByPath,
  type MenuItem,
  type MenuSection,
  type ProjectWorkspace
} from '@/config/navigation'
import { useRecentNavigation } from '@/composables/useRecentNavigation'

const route = useRoute()
const router = useRouter()
const { recentItems, recordRecentPath, clearRecentItems } =
  useRecentNavigation()

const activePath = computed(() => route.path)

const getMenuDelay = (sectionIndex: number, index: number) =>
  `${(sectionIndex * 0.05 + index * 0.03).toFixed(2)}s`

const isActiveMenu = (item: MenuItem) => {
  const matchPaths = item.matchPaths ?? [item.index]
  return matchPaths.some((path) => {
    if (item.exact) return activePath.value === path
    return activePath.value === path || activePath.value.startsWith(`${path}/`)
  })
}

const currentProjectKey = ref(
  (resolveProjectByPath(activePath.value) || defaultProjectWorkspace).key
)

const currentProject = computed<ProjectWorkspace>(() => {
  return (
    projectWorkspaces.find(
      (project) => project.key === currentProjectKey.value
    ) || defaultProjectWorkspace
  )
})

const sectionHasActive = (section: MenuSection) =>
  section.items.some((item) => isActiveMenu(item))

const buildSectionKey = (projectKey: string, sectionKey: string) =>
  `${projectKey}:${sectionKey}`

const openedSections = ref<string[]>([])

const ensureProjectSections = (project: ProjectWorkspace) => {
  const activeSection = project.sections.find((section) =>
    sectionHasActive(section)
  )
  const defaultKeys = activeSection
    ? [buildSectionKey(project.key, activeSection.key)]
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
  void router.push(currentProject.value.homePath)
}

const goToBusinessHub = () => {
  void router.push('/business-hub')
}

const goToRecentItem = (path: string) => {
  void router.push(path)
}

watch(
  activePath,
  (path) => {
    const matchedProject = resolveProjectByPath(path) || defaultProjectWorkspace
    currentProjectKey.value = matchedProject.key
    ensureProjectSections(matchedProject)
    recordRecentPath(path)
  },
  { immediate: true }
)
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
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--app-border);
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
  overflow-y: auto;
  padding: 14px 12px 18px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-sidebar-scrollbar);
    border-radius: 999px;
  }
}

.project-summary,
.sidebar-panel,
.nav-group {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface);
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
  border-radius: 10px;
  background: #eff6ff;
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
  background: #fff;
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
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #fff;

  &:hover {
    background: #1e40af;
    border-color: #1e40af;
    color: #fff;
  }
}

.sidebar-panel {
  padding: 12px;
  margin-bottom: 12px;
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
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  &.active {
    background: #eff6ff;
    border-color: #bfdbfe;
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
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  &.active {
    background: #f8fafc;
    border-color: #dbeafe;
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
  background: #f1f5f9;
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
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  &.active {
    background: #eff6ff;
    border-color: #bfdbfe;
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
