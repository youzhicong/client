<template>
  <div class="ai-automation-page ai-agent-shell">
    <AgentStudioHeader title="" description="" active="automation" compact />

    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">Automation</span>
          <h2>自动化中心</h2>
          <p>
            定时任务：自动工作流、审批、电子合同与双章签署（前台运行时触发）
          </p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ tasks.length }}</strong>
            <span>任务</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ enabledCount }}</strong>
            <span>已启用</span>
          </div>
        </div>
      </div>
    </header>

    <section class="automation-workspace studio-workspace">
      <div class="automation-grid">
        <div class="automation-panel platform-panel">
          <div class="studio-side-head">
            <strong>新建定时任务</strong>
            <span>保存后立即生效</span>
          </div>
          <label class="field">
            <span>任务名称</span>
            <input v-model="form.name" />
          </label>
          <label class="field">
            <span>关键词</span>
            <input v-model="form.keyword" />
          </label>
          <label class="field">
            <span>任务类型</span>
            <select v-model="form.taskType" class="field-select">
              <option value="full_pipeline">完整流水线</option>
              <option value="product_workflow">仅工作流</option>
              <option value="business_closure">仅商务闭环</option>
            </select>
          </label>
          <label class="field">
            <span>调度</span>
            <select v-model="form.scheduleType" class="field-select">
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="interval">间隔分钟</option>
            </select>
          </label>
          <label v-if="form.scheduleType !== 'interval'" class="field">
            <span>时间</span>
            <input v-model="form.timeOfDay" type="time" />
          </label>
          <label v-if="form.scheduleType === 'interval'" class="field">
            <span>间隔（分钟）</span>
            <input
              v-model.number="form.intervalMinutes"
              type="number"
              min="5"
            />
          </label>
          <label class="field-toggle">
            <input v-model="form.enableBusinessClosure" type="checkbox" />
            启用商务闭环（审批 + 电子合同 + 双章）
          </label>
          <div class="panel-actions">
            <button
              type="button"
              class="platform-btn-primary"
              @click="handleCreateTask"
            >
              保存任务
            </button>
            <button
              type="button"
              class="platform-btn-ghost"
              :disabled="runningManual"
              @click="handleRunClosureNow"
            >
              立即商务闭环
            </button>
          </div>
        </div>

        <div class="automation-panel platform-panel">
          <div class="studio-side-head">
            <strong>任务列表</strong>
            <span>{{ tasks.length }} 个</span>
          </div>
          <div v-if="!tasks.length" class="platform-empty compact">
            <div class="empty-icon">⏱</div>
            <p>暂无定时任务，在左侧创建</p>
          </div>
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-card platform-card"
            :class="{ paused: !task.enabled }"
          >
            <div class="task-head">
              <strong>{{ task.name }}</strong>
              <span
                class="platform-pill"
                :class="task.enabled ? 'success' : 'running'"
              >
                {{ task.enabled ? '已启用' : '已暂停' }}
              </span>
            </div>
            <p>{{ task.keyword }} · 下次 {{ formatTime(task.nextRunAt) }}</p>
            <div class="task-actions">
              <button
                type="button"
                class="platform-btn-ghost"
                @click="toggleTask(task)"
              >
                {{ task.enabled ? '暂停' : '启用' }}
              </button>
              <button
                type="button"
                class="platform-btn-primary"
                @click="runTaskNow(task)"
              >
                执行
              </button>
              <button
                type="button"
                class="btn-danger"
                @click="removeTask(task.id)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="automation-panel platform-panel logs-panel">
        <div class="studio-side-head">
          <strong>执行日志</strong>
          <span>最近 {{ logs.length }} 条</span>
        </div>
        <div v-if="closureSteps.length" class="closure-steps">
          <div
            v-for="step in closureSteps"
            :key="step.key"
            class="closure-step platform-pill type"
          >
            {{ step.label }} · {{ step.detail }}
          </div>
        </div>
        <div
          v-if="!logs.length && !closureSteps.length"
          class="platform-empty compact"
        >
          <div class="empty-icon">📋</div>
          <p>暂无执行记录</p>
        </div>
        <div v-for="log in logs.slice(0, 12)" :key="log.id" class="log-row">
          <span
            class="platform-pill"
            :class="log.status === 'success' ? 'success' : 'error'"
          >
            {{ log.status === 'success' ? '成功' : '失败' }}
          </span>
          <strong>{{ log.taskName }}</strong>
          <span class="log-message">{{ log.message }}</span>
          <time class="log-time">{{
            formatTime(log.finishedAt || log.startedAt)
          }}</time>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AgentStudioHeader from '@/components/agent/AgentStudioHeader.vue'
import {
  runBusinessClosureFlow,
  type BusinessClosureStep
} from '@/services/ai-automation/business-flow'
import {
  createAutomationTask,
  deleteAutomationTask,
  getAutomationLogs,
  getAutomationTasks,
  runAutomationTask,
  updateAutomationTask,
  type AutomationRunLog,
  type AutomationTask,
  type AutomationTaskType
} from '@/services/ai-automation/scheduler'

const tasks = ref<AutomationTask[]>([])
const logs = ref<AutomationRunLog[]>([])
const runningManual = ref(false)
const closureSteps = ref<BusinessClosureStep[]>([])

const form = ref({
  name: '每日产品创意',
  keyword: '咖啡',
  taskType: 'full_pipeline' as AutomationTaskType,
  scheduleType: 'daily' as 'daily' | 'weekly' | 'interval',
  timeOfDay: '09:00',
  weekday: 1,
  intervalMinutes: 60,
  enableBusinessClosure: true
})

const enabledCount = computed(() => tasks.value.filter((t) => t.enabled).length)

const refresh = () => {
  tasks.value = getAutomationTasks()
  logs.value = getAutomationLogs()
}

const formatTime = (value?: number) =>
  value ? new Date(value).toLocaleString('zh-CN') : '未执行'

const handleCreateTask = () => {
  if (!form.value.name.trim() || !form.value.keyword.trim()) {
    ElMessage.warning('请填写名称和关键词')
    return
  }
  createAutomationTask({
    ...form.value,
    name: form.value.name.trim(),
    keyword: form.value.keyword.trim(),
    enabled: true
  })
  refresh()
  ElMessage.success('已保存')
}

const toggleTask = (task: AutomationTask) => {
  updateAutomationTask(task.id, { enabled: !task.enabled })
  refresh()
}

const removeTask = (id: string) => {
  deleteAutomationTask(id)
  refresh()
}

const runTaskNow = async (task: AutomationTask) => {
  runningManual.value = true
  closureSteps.value = []
  try {
    const log = await runAutomationTask(task, {
      onBusinessStep: (step) => {
        closureSteps.value = [...closureSteps.value, step]
      }
    })
    refresh()
    ElMessage[log.status === 'success' ? 'success' : 'error'](log.message)
  } finally {
    runningManual.value = false
  }
}

const handleRunClosureNow = async () => {
  runningManual.value = true
  closureSteps.value = []
  try {
    const result = await runBusinessClosureFlow({
      keyword: form.value.keyword.trim(),
      onStep: (step) => {
        closureSteps.value = [...closureSteps.value, step]
      }
    })
    ElMessage.success(`完成：${result.contractCode}`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '失败')
  } finally {
    runningManual.value = false
  }
}

onMounted(refresh)
</script>

<style scoped lang="scss">
@use '@/style/ai-agent-page.scss';
@use '@/style/studio-workspace.scss';
@use '@/style/platform-page.scss';

.ai-automation-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 16px;
  box-sizing: border-box;

  :deep(.ai-agent-studio-head) {
    flex-shrink: 0;
    margin-bottom: 0;
  }

  .platform-hero {
    flex-shrink: 0;
    margin-bottom: 0;
  }
}

.automation-workspace {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  gap: 14px;
  align-content: start;
  grid-template-columns: 1fr;
}

.automation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.automation-panel {
  display: grid;
  gap: 10px;
  align-content: start;
}

.field {
  display: grid;
  gap: 6px;

  span {
    font-size: 11px;
    font-weight: 600;
    color: var(--app-text-faint);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  input,
  .field-select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--app-border);
    background: var(--app-surface-muted);
    font-size: 13px;
    color: var(--app-text-main);
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;

    &:focus {
      outline: none;
      border-color: var(--app-accent-muted);
      box-shadow: var(--app-search-focus-shadow);
      background: var(--app-surface);
    }
  }
}

.field-toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: var(--app-text-sub);
  cursor: pointer;

  input {
    accent-color: var(--app-accent);
  }
}

.panel-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.task-card {
  &.paused {
    opacity: 0.82;
    border-style: dashed;
  }

  .task-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  p {
    margin: 6px 0 10px;
    font-size: 12px;
    color: var(--app-text-sub);
  }

  strong {
    font-size: 14px;
    color: var(--app-text-main);
  }
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-danger {
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #b91c1c;
  }
}

.logs-panel {
  grid-column: 1 / -1;
}

.closure-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.log-row {
  display: grid;
  grid-template-columns: auto minmax(80px, 120px) 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--app-surface-muted);
  font-size: 12px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover {
    border-color: var(--app-border);
    background: var(--app-surface);
  }

  strong {
    color: var(--app-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .log-message {
    color: var(--app-text-sub);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .log-time {
    color: var(--app-text-faint);
    font-size: 11px;
    white-space: nowrap;
  }
}

.platform-empty.compact {
  padding: 20px 16px;
}

@media (max-width: 960px) {
  .automation-grid {
    grid-template-columns: 1fr;
  }

  .log-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

:global(html.dark) {
  .btn-danger {
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;

    &:hover {
      background: rgba(239, 68, 68, 0.18);
      color: #fca5a5;
    }
  }
}
</style>
