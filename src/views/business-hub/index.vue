<template>
  <div class="business-hub-page">
    <section class="hub-hero">
      <div>
        <span class="hub-kicker">Business Hub</span>
        <h1>业务中台</h1>
        <p>
          把已经分散在系统里的沟通、审批、设备和直播业务整理成可跟进的业务闭环。
        </p>
        <div class="hero-actions">
          <a class="hero-action primary" href="#business-follow-up"
            >待跟进事项</a
          >
          <a class="hero-action secondary" href="#business-backlog">业务建议</a>
        </div>
      </div>
      <div class="hero-metrics">
        <div>
          <span>业务模块</span>
          <strong>{{ businessModules.length }}</strong>
        </div>
        <div>
          <span>待跟进事项</span>
          <strong>{{ businessTasks.length }}</strong>
        </div>
      </div>
    </section>

    <section class="module-grid">
      <article
        v-for="module in businessModules"
        :key="module.id"
        class="module-card"
        :class="module.priority"
      >
        <div class="module-head">
          <div>
            <span class="module-owner">{{ module.owner }}</span>
            <h2>{{ module.title }}</h2>
          </div>
          <span class="priority">{{ priorityLabel(module.priority) }}</span>
        </div>
        <p>{{ module.summary }}</p>
        <div class="progress-row">
          <span>{{ module.status }}</span>
          <strong>{{ module.progress }}%</strong>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${module.progress}%` }"
          ></div>
        </div>
        <router-link class="module-link" :to="module.entry">
          进入模块
        </router-link>
      </article>
    </section>

    <section id="business-follow-up" class="task-panel">
      <div class="panel-head">
        <div>
          <span class="hub-kicker muted">Follow Up</span>
          <h2>建议补齐的业务动作</h2>
        </div>
      </div>
      <div class="task-list">
        <div v-for="task in businessTasks" :key="task.id" class="task-row">
          <div>
            <strong>{{ task.title }}</strong>
            <span>{{ task.module }} / {{ task.assignee }}</span>
          </div>
          <em>{{ task.due }}</em>
          <span class="task-state">{{ task.state }}</span>
        </div>
      </div>
    </section>

    <section id="business-backlog" class="backlog-panel">
      <div class="panel-head">
        <div>
          <span class="hub-kicker muted">Next Business</span>
          <h2>下一批建议补齐的业务能力</h2>
        </div>
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
import {
  businessBacklog,
  businessModules,
  businessTasks,
  type BusinessPriority
} from './data'

const priorityLabel = (priority: BusinessPriority) => {
  if (priority === 'high') return '高优先级'
  if (priority === 'medium') return '中优先级'
  return '低优先级'
}
</script>

<style lang="scss" scoped>
.business-hub-page {
  min-height: calc(100vh - 72px);
  padding: 28px;
  color: var(--app-text-main);
  scroll-behavior: smooth;
}

.hub-hero,
.module-card,
.task-panel,
.backlog-panel {
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.hub-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 26px;
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.14), transparent 42%),
    var(--app-surface);
}

.hub-kicker,
.module-owner {
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.hub-kicker.muted {
  color: var(--app-text-sub);
}

.hub-hero h1,
.panel-head h2,
.module-card h2 {
  margin: 8px 0 0;
}

.hub-hero h1 {
  font-size: 34px;
}

.hub-hero p,
.module-card p,
.task-row span {
  color: var(--app-text-sub);
}

.hub-hero p {
  max-width: 660px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.hero-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.hero-action.primary {
  background: #1d4ed8;
  color: #fff;
}

.hero-action.secondary {
  background: rgba(255, 255, 255, 0.76);
  border-color: var(--app-border);
  color: var(--app-text-main);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, 120px);
  gap: 12px;
}

.hero-metrics div {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.hero-metrics span,
.progress-row,
.task-state,
.task-row em {
  color: var(--app-text-sub);
  font-size: 12px;
  font-style: normal;
}

.hero-metrics strong {
  display: block;
  margin-top: 6px;
  font-size: 28px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.module-card {
  padding: 20px;
}

.module-head,
.progress-row,
.task-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.priority,
.task-state,
.module-link {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}

.priority {
  color: #0f766e;
  background: #dffaf6;
}

.module-card.high .priority {
  color: #b91c1c;
  background: #fee2e2;
}

.module-card p {
  min-height: 52px;
  line-height: 1.7;
}

.progress-track {
  height: 8px;
  margin: 10px 0 16px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f766e, #1d4ed8);
}

.module-link {
  display: inline-flex;
  color: #fff;
  background: #1d4ed8;
  text-decoration: none;
}

.task-panel,
.backlog-panel {
  margin-top: 18px;
  padding: 20px;
  scroll-margin-top: 96px;
}

.task-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.task-row {
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.task-row div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.task-state {
  color: #1d4ed8;
  background: #dbeafe;
}

.backlog-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.backlog-card {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.backlog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.backlog-card p {
  min-height: 74px;
  color: var(--app-text-sub);
  font-size: 13px;
  line-height: 1.7;
}

.backlog-card em {
  display: block;
  color: #0f766e;
  font-size: 12px;
  font-style: normal;
  line-height: 1.6;
}

@media (max-width: 920px) {
  .hub-hero,
  .module-head,
  .task-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .module-grid,
  .backlog-grid,
  .hero-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
