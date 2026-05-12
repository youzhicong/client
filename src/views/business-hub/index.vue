<template>
  <div class="business-hub-page">
    <section class="hub-summary">
      <div class="summary-copy">
        <h1>项目总览</h1>
        <p>
          现在把原来分散的菜单重新归到项目里，用户可以先进入项目，再查看对应功能，导航会更短，也更容易理解。
        </p>
      </div>

      <div class="summary-metrics">
        <div class="metric-card">
          <span>项目数量</span>
          <strong>{{ projectWorkspaces.length }}</strong>
        </div>
        <div class="metric-card">
          <span>菜单分组</span>
          <strong>{{ sectionCount }}</strong>
        </div>
        <div class="metric-card">
          <span>功能入口</span>
          <strong>{{ menuCount }}</strong>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="section-head">
        <h2>项目列表</h2>
        <span>按项目查看菜单分组与功能入口</span>
      </div>

      <div class="project-table">
        <article
          v-for="project in projectCards"
          :key="project.key"
          class="project-row"
        >
          <div class="project-main">
            <div class="project-badge">
              <el-icon><component :is="project.icon" /></el-icon>
            </div>
            <div class="project-copy">
              <strong>{{ project.title }}</strong>
              <span>{{ project.subtitle }}</span>
            </div>
          </div>

          <div class="project-stats">
            <span>{{ project.sections.length }} 个分组</span>
            <span>{{ project.itemCount }} 个入口</span>
          </div>

          <div class="project-sections">
            <span
              v-for="section in project.sections"
              :key="section.key"
              class="section-tag"
            >
              {{ section.title }} ({{ section.items.length }})
            </span>
          </div>

          <router-link class="project-link" :to="project.homePath">
            进入项目
          </router-link>
        </article>
      </div>
    </section>

    <section class="content-section">
      <div class="section-head">
        <h2>后续优化</h2>
        <span>继续减少重复入口，保持项目边界清晰</span>
      </div>

      <div class="task-list">
        <div v-for="task in businessTasks" :key="task.id" class="task-row">
          <div class="task-copy">
            <strong>{{ task.title }}</strong>
            <span>{{ task.module }} / {{ task.assignee }}</span>
          </div>
          <em>{{ task.due }}</em>
          <span class="task-state">{{ task.state }}</span>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="section-head">
        <h2>整理建议</h2>
        <span>适合继续沉淀成项目能力的方向</span>
      </div>

      <div class="backlog-grid">
        <article
          v-for="item in businessBacklog"
          :key="item.title"
          class="backlog-card"
        >
          <div class="backlog-title">
            <strong>{{ item.title }}</strong>
            <span class="priority" :class="item.priority">
              {{ priorityLabel(item.priority) }}
            </span>
          </div>
          <p>{{ item.reason }}</p>
          <em>{{ item.value }}</em>
        </article>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { projectWorkspaces } from '@/config/navigation'
import { businessBacklog, businessTasks, type BusinessPriority } from './data'

const projectCards = computed(() =>
  projectWorkspaces.map((project) => ({
    ...project,
    itemCount: project.sections.reduce(
      (sum, section) => sum + section.items.length,
      0
    )
  }))
)

const sectionCount = computed(() =>
  projectWorkspaces.reduce((sum, project) => sum + project.sections.length, 0)
)

const menuCount = computed(() =>
  projectWorkspaces.reduce(
    (sum, project) =>
      sum +
      project.sections.reduce(
        (subtotal, section) => subtotal + section.items.length,
        0
      ),
    0
  )
)

const priorityLabel = (priority: BusinessPriority) => {
  if (priority === 'high') return '高优先级'
  if (priority === 'medium') return '中优先级'
  return '低优先级'
}
</script>

<style lang="scss" scoped>
.business-hub-page {
  min-height: calc(100vh - 72px);
  padding: 24px;
  color: var(--app-text-main);
  display: grid;
  gap: 16px;
}

.hub-summary,
.content-section {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.hub-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
}

.summary-copy {
  max-width: 760px;

  h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
  }

  p {
    margin: 10px 0 0;
    color: var(--app-text-sub);
    font-size: 14px;
    line-height: 1.8;
  }
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(3, 120px);
  gap: 12px;
}

.metric-card {
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;

  span {
    color: var(--app-text-sub);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: var(--app-text-main);
    font-size: 24px;
    line-height: 1.1;
  }
}

.content-section {
  padding: 20px 24px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 18px;
    line-height: 1.2;
  }

  span {
    color: var(--app-text-sub);
    font-size: 12px;
  }
}

.project-table {
  display: grid;
  gap: 10px;
}

.project-row,
.task-row {
  display: grid;
  align-items: center;
  gap: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}

.project-row {
  grid-template-columns: minmax(220px, 1.2fr) 160px minmax(260px, 1fr) 100px;
  padding: 14px 16px;
}

.project-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.project-badge {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 18px;
  flex-shrink: 0;
}

.project-copy,
.task-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.project-copy strong,
.task-copy strong,
.backlog-title strong {
  color: var(--app-text-main);
  font-size: 14px;
  line-height: 1.3;
}

.project-copy span,
.project-stats span,
.task-copy span,
.task-row em,
.backlog-card p,
.backlog-card em {
  color: var(--app-text-sub);
  font-size: 12px;
  font-style: normal;
}

.project-stats {
  display: grid;
  gap: 4px;
}

.project-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.section-tag,
.project-link,
.task-state,
.priority {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.section-tag {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
}

.project-link {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  text-decoration: none;
}

.task-list {
  display: grid;
  gap: 10px;
}

.task-row {
  grid-template-columns: minmax(220px, 1fr) 140px 110px;
  padding: 14px 16px;
}

.task-state {
  background: #eff6ff;
  color: #1d4ed8;
}

.backlog-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.backlog-card {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;

  p {
    margin: 10px 0;
    line-height: 1.7;
  }

  em {
    line-height: 1.6;
  }
}

.backlog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.priority {
  color: #0f766e;
  background: #dffaf6;
}

.priority.high {
  color: #b91c1c;
  background: #fee2e2;
}

.priority.medium {
  color: #92400e;
  background: #fef3c7;
}

@media (max-width: 1200px) {
  .project-row {
    grid-template-columns: 1fr;
  }

  .backlog-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .business-hub-page {
    padding: 16px;
  }

  .hub-summary,
  .section-head,
  .task-row {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: flex-start;
  }

  .hub-summary {
    display: grid;
  }

  .summary-metrics,
  .backlog-grid {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .task-row {
    grid-template-columns: 1fr;
  }
}
</style>
