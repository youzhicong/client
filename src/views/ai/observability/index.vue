<template>
  <AgentPlatformPage title="" description="" active="observability">
    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">Observability</span>
          <h2>观测 Trace</h2>
          <p>工作流、Agent 聊天、自动化与 Playground 的调用记录与耗时追踪</p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ traces.length }}</strong>
            <span>总 Trace</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ sessionGroups.length }}</strong>
            <span>会话组</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ successCount }}</strong>
            <span>成功</span>
          </div>
        </div>
      </div>
    </header>

    <div class="platform-toolbar">
      <select v-model="filterType">
        <option value="">全部类型</option>
        <option value="workflow">工作流</option>
        <option value="chat">聊天</option>
        <option value="agent">Agent</option>
        <option value="automation">自动化</option>
        <option value="playground">Playground</option>
      </select>
      <div class="platform-view-toggle">
        <button
          type="button"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          列表
        </button>
        <button
          type="button"
          :class="{ active: viewMode === 'session' }"
          @click="viewMode = 'session'"
        >
          会话分组
        </button>
      </div>
      <button type="button" class="btn-ghost" @click="refresh">刷新</button>
      <button type="button" class="btn-danger" @click="handleClear">
        清空
      </button>
    </div>

    <div class="platform-workbench">
      <div class="platform-panel">
        <div class="platform-list">
          <template v-if="viewMode === 'list'">
            <article
              v-for="trace in filteredTraces"
              :key="trace.id"
              class="platform-list-item"
              :class="[
                trace.status,
                { active: selectedTrace?.id === trace.id }
              ]"
              @click="selectTrace(trace)"
            >
              <span class="platform-list-icon">{{
                traceIcon(trace.type)
              }}</span>
              <div class="platform-list-copy">
                <strong>{{ trace.title || '未命名调用' }}</strong>
                <p>{{ trace.detail }}</p>
                <div class="platform-list-meta">
                  <span class="platform-pill type">{{
                    traceTypeLabel(trace.type)
                  }}</span>
                  <span class="platform-pill" :class="trace.status">{{
                    statusLabel(trace.status)
                  }}</span>
                  <span>{{ formatTime(trace.createdAt) }}</span>
                  <span v-if="trace.durationMs">{{ trace.durationMs }} ms</span>
                </div>
              </div>
            </article>
            <div v-if="!filteredTraces.length" class="platform-empty">
              <div class="empty-icon">📈</div>
              <p>暂无 Trace，运行工作流或聊天后会自动记录</p>
            </div>
          </template>

          <template v-else>
            <article
              v-for="group in filteredSessionGroups"
              :key="group.sessionId"
              class="platform-list-item"
              :class="[
                group.status,
                { active: selectedSessionId === group.sessionId }
              ]"
              @click="selectSession(group)"
            >
              <span class="platform-list-icon">🧵</span>
              <div class="platform-list-copy">
                <strong>{{ group.label }}</strong>
                <p>{{ group.traces[0]?.detail }}</p>
                <div class="platform-list-meta">
                  <span class="platform-pill type"
                    >{{ group.traces.length }} 条</span
                  >
                  <span
                    v-for="type in group.types"
                    :key="type"
                    class="platform-pill type"
                  >
                    {{ traceTypeLabel(type) }}
                  </span>
                  <span class="platform-pill" :class="group.status">{{
                    statusLabel(group.status)
                  }}</span>
                  <span>{{ formatTime(group.latestAt) }}</span>
                </div>
              </div>
            </article>
            <div v-if="!filteredSessionGroups.length" class="platform-empty">
              <div class="empty-icon">🧵</div>
              <p>暂无会话 Trace</p>
            </div>
          </template>
        </div>
      </div>

      <aside v-if="selectedTrace" class="platform-panel trace-detail">
        <div class="detail-head">
          <strong>Trace 详情</strong>
          <button type="button" class="btn-ghost" @click="clearSelection">
            关闭
          </button>
        </div>
        <dl class="detail-meta">
          <div>
            <dt>标题</dt>
            <dd>{{ selectedTrace.title }}</dd>
          </div>
          <div>
            <dt>类型</dt>
            <dd>{{ traceTypeLabel(selectedTrace.type) }}</dd>
          </div>
          <div v-if="selectedTrace.sessionId">
            <dt>会话</dt>
            <dd>{{ selectedTrace.sessionId }}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>
              <span class="platform-pill" :class="selectedTrace.status">{{
                statusLabel(selectedTrace.status)
              }}</span>
            </dd>
          </div>
          <div>
            <dt>时间</dt>
            <dd>{{ formatTime(selectedTrace.createdAt) }}</dd>
          </div>
          <div v-if="selectedTrace.durationMs">
            <dt>耗时</dt>
            <dd>{{ selectedTrace.durationMs }} ms</dd>
          </div>
        </dl>
        <div class="detail-body">
          <strong>详情</strong>
          <p>{{ selectedTrace.detail }}</p>
        </div>
        <router-link :to="traceSourceTo(selectedTrace)" class="detail-link">
          前往来源模块 →
        </router-link>
      </aside>

      <aside v-else class="platform-panel trace-placeholder">
        <div class="empty-icon">👈</div>
        <strong>选择一条 Trace</strong>
        <p>点击左侧记录查看详情，或从 Dashboard 最近 Trace 跳转而来</p>
      </aside>
    </div>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import { getAutomationLogs } from '@/services/ai-automation/scheduler'
import {
  appendPlatformTrace,
  clearPlatformTraces,
  getPlatformTraces,
  groupPlatformTraces,
  resolveTraceSourcePath,
  type PlatformTrace,
  type PlatformTraceType,
  type TraceSessionGroup
} from '@/services/ai-platform-store'
import { getHistory } from '@/services/ai'

const route = useRoute()
const traces = ref<PlatformTrace[]>([])
const filterType = ref<PlatformTraceType | ''>('')
const viewMode = ref<'list' | 'session'>('list')
const selectedTrace = ref<PlatformTrace | null>(null)
const selectedSessionId = ref<string | null>(null)

const filteredTraces = computed(() =>
  filterType.value
    ? traces.value.filter((item) => item.type === filterType.value)
    : traces.value
)

const sessionGroups = computed(() => groupPlatformTraces(traces.value))

const successCount = computed(
  () => traces.value.filter((item) => item.status === 'success').length
)

const filteredSessionGroups = computed(() =>
  filterType.value
    ? sessionGroups.value
        .map((group) => ({
          ...group,
          traces: group.traces.filter((item) => item.type === filterType.value)
        }))
        .filter((group) => group.traces.length)
    : sessionGroups.value
)

const traceIcon = (type: PlatformTraceType) =>
  ({
    workflow: '⚡',
    chat: '💬',
    agent: '🤖',
    automation: '🕐',
    playground: '🧪'
  })[type] || '📌'

const traceSourceTo = (trace: PlatformTrace) => {
  const resolved = resolveTraceSourcePath(trace)
  if (typeof resolved === 'string') return resolved
  return { path: resolved.path, query: resolved.query }
}

const syncLegacy = () => {
  const existing = getPlatformTraces()
  if (existing.length) {
    traces.value = existing
    return
  }

  getHistory()
    .slice(0, 10)
    .forEach((item) => {
      appendPlatformTrace({
        type: 'workflow',
        title: item.keyword,
        detail: `生成 ${item.categories.length} 个品类方案`,
        status: 'success',
        sourcePath: '/ai/workflow'
      })
    })

  getAutomationLogs()
    .slice(0, 10)
    .forEach((log) => {
      appendPlatformTrace({
        type: 'automation',
        title: log.taskName,
        detail: log.message,
        status: log.status,
        durationMs: log.finishedAt - log.startedAt,
        sourcePath: '/ai/automation'
      })
    })

  traces.value = getPlatformTraces()
}

const refresh = () => {
  traces.value = getPlatformTraces()
  if (selectedTrace.value) {
    selectedTrace.value =
      traces.value.find((item) => item.id === selectedTrace.value?.id) || null
  }
}

const selectTrace = (trace: PlatformTrace) => {
  selectedTrace.value = trace
  selectedSessionId.value = trace.sessionId || null
}

const selectSession = (group: TraceSessionGroup) => {
  selectedSessionId.value = group.sessionId
  selectedTrace.value = group.traces[0] || null
}

const clearSelection = () => {
  selectedTrace.value = null
  selectedSessionId.value = null
}

const handleClear = () => {
  clearPlatformTraces()
  clearSelection()
  refresh()
  ElMessage.success('已清空')
}

const traceTypeLabel = (type: PlatformTraceType) =>
  ({
    workflow: '工作流',
    chat: '聊天',
    agent: 'Agent',
    automation: '自动化',
    playground: 'Playground'
  })[type] || type

const formatTime = (value: number) => new Date(value).toLocaleString('zh-CN')
const statusLabel = (status: PlatformTrace['status']) =>
  ({ success: '成功', error: '失败', running: '进行中' })[status]

const pickTraceFromQuery = () => {
  const id = route.query.id
  if (typeof id !== 'string') return
  const target = traces.value.find((item) => item.id === id)
  if (target) selectTrace(target)
}

onMounted(() => {
  syncLegacy()
  pickTraceFromQuery()
})

watch(
  () => route.query.id,
  () => pickTraceFromQuery()
)
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.trace-detail {
  position: sticky;
  top: 12px;
}

.trace-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  text-align: center;
  background: var(--app-surface-muted);

  .empty-icon {
    font-size: 36px;
    margin-bottom: 10px;
  }

  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 15px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    max-width: 220px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--app-text-sub);
  }
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  strong {
    font-size: 15px;
    color: var(--app-text-main);
  }
}

.detail-meta {
  display: grid;
  gap: 10px;
  margin: 0 0 14px;

  div {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 8px;
    align-items: start;
  }

  dt {
    margin: 0;
    font-size: 11px;
    color: var(--app-text-faint);
    font-weight: 600;
  }

  dd {
    margin: 0;
    font-size: 12px;
    color: var(--app-text-main);
    word-break: break-word;
  }
}

.detail-body {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-surface-muted);
  margin-bottom: 14px;

  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--app-text-sub);
    white-space: pre-wrap;
  }
}

.detail-link {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--app-accent);
  color: #fff;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;

  &:hover {
    background: var(--app-accent-strong);
  }
}

.platform-list-item.error {
  background: #fef2f2;
}
</style>
