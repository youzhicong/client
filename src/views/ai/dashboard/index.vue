<template>
  <AgentPlatformPage title="" description="" active="dashboard">
    <div v-if="!isConfigured" class="banner">
      <div class="banner-icon">⚡</div>
      <div class="banner-copy">
        <strong>尚未配置模型</strong>
        <span>配置 API Key 后即可使用工作流、聊天与 Playground</span>
      </div>
      <router-link to="/ai/settings" class="banner-link">去配置</router-link>
    </div>

    <section class="dash-hero">
      <div class="dash-hero-bg" aria-hidden="true" />
      <div class="dash-hero-inner">
        <div class="dash-hero-copy">
          <span class="dash-kicker">FlowAgent 工作台</span>
          <h2 class="dash-title">{{ greeting }}，开始今天的 Agent 任务</h2>
          <p class="dash-subtitle">
            Multi-Agent 市场研究 → 创意矩阵 → 评估优化 → 电子合同签章，约 2
            分钟出报告
          </p>
        </div>
        <div class="dash-hero-actions">
          <router-link to="/ai/workflow?q=咖啡&run=1" class="dash-cta-primary">
            <span>☕</span>
            一键跑「咖啡」工作流
          </router-link>
          <router-link to="/ai/chat" class="dash-cta-ghost"
            >Agent 聊天</router-link
          >
        </div>
      </div>
    </section>

    <section v-if="onboardingProgress < 100" class="onboarding">
      <div class="onboarding-head">
        <div>
          <strong>快速上手</strong>
          <span>完成引导解锁完整能力</span>
        </div>
        <em>{{ onboardingProgress }}%</em>
      </div>
      <div class="onboarding-bar">
        <div
          class="onboarding-fill"
          :style="{ width: `${onboardingProgress}%` }"
        />
      </div>
      <div class="onboarding-steps">
        <router-link
          v-for="step in onboardingSteps"
          :key="step.id"
          :to="step.path"
          class="onboarding-step"
          :class="{ done: step.done }"
        >
          <span class="onboarding-check">{{
            step.done ? '✓' : step.index
          }}</span>
          <div>
            <strong>{{ step.label }}</strong>
            <p>{{ step.desc }}</p>
          </div>
        </router-link>
      </div>
    </section>

    <div class="stat-grid">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="stat-card"
        :class="`tone-${card.tone}`"
      >
        <div class="stat-icon">{{ card.icon }}</div>
        <div class="stat-body">
          <span class="stat-label">{{ card.label }}</span>
          <strong class="stat-value">{{ card.value }}</strong>
          <p>{{ card.desc }}</p>
        </div>
      </div>
    </div>

    <section class="usage-panel">
      <div class="section-head">
        <div>
          <strong>用量与配额</strong>
          <span>{{ planQuota.planName }} · 本地演示计量</span>
        </div>
        <router-link to="/account-settings?tab=billing" class="section-link"
          >升级套餐</router-link
        >
        <button
          type="button"
          class="section-link section-link-btn"
          @click="handleExportBackup"
        >
          导出备份
        </button>
      </div>
      <div class="usage-grid">
        <div
          v-for="item in usageItems"
          :key="item.label"
          class="usage-card"
          :class="{ warn: item.warn }"
        >
          <div class="usage-card-head">
            <span>{{ item.label }}</span>
            <strong>{{ item.used }} / {{ item.limit }}</strong>
          </div>
          <div class="usage-bar">
            <div class="usage-fill" :style="{ width: `${item.percent}%` }" />
          </div>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <section class="readiness-panel">
      <div class="section-head">
        <div>
          <strong>平台能力成熟度</strong>
          <span>产品化路线图 · 当前为前端演示版</span>
        </div>
      </div>
      <div class="readiness-grid">
        <div
          v-for="item in capabilityMatrix"
          :key="item.name"
          class="readiness-card"
          :class="item.level"
        >
          <span class="readiness-badge">{{ item.badge }}</span>
          <strong>{{ item.name }}</strong>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <div class="section">
      <div class="section-head">
        <div>
          <strong>快捷入口</strong>
          <span>常用能力一键直达</span>
        </div>
      </div>
      <div class="quick-grid">
        <router-link
          v-for="item in quickLinks"
          :key="item.path"
          :to="item.path"
          class="quick-card"
          :class="`tone-${item.tone}`"
        >
          <span class="quick-icon">{{ item.icon }}</span>
          <div class="quick-copy">
            <strong>{{ item.label }}</strong>
            <p>{{ item.desc }}</p>
          </div>
          <span class="quick-arrow">→</span>
        </router-link>
      </div>
    </div>

    <div v-if="recentChatSessions.length" class="section">
      <div class="section-head">
        <div>
          <strong>最近对话</strong>
          <span>Agent 聊天会话快速续聊</span>
        </div>
        <router-link to="/ai/chat" class="section-link">打开聊天</router-link>
      </div>
      <div class="chat-session-row">
        <router-link
          v-for="session in recentChatSessions"
          :key="session.id"
          :to="{ path: '/ai/chat', query: { session: session.id } }"
          class="chat-session-chip"
        >
          <strong>{{ session.title }}</strong>
          <span>{{ formatChatSessionTime(session.updatedAt) }}</span>
        </router-link>
      </div>
    </div>

    <div class="section two-col">
      <div class="panel">
        <div class="section-head">
          <div>
            <strong>最近工作流</strong>
            <span>可视化报告可分享</span>
          </div>
          <router-link
            v-if="recentWorkflows.length"
            to="/ai/workflow"
            class="section-link"
          >
            新建
          </router-link>
        </div>
        <div v-if="recentWorkflows.length" class="list">
          <router-link
            v-for="item in recentWorkflows"
            :key="item.timestamp"
            :to="{
              path: '/ai/workflow/report',
              query: { ts: String(item.timestamp) }
            }"
            class="list-row"
          >
            <span class="row-icon">📊</span>
            <div class="row-copy">
              <strong>{{ formatWorkflowTitle(item) }}</strong>
              <small>{{ countProducts(item) }} 个创意 · 点击查看报告</small>
            </div>
            <span class="row-time">{{ formatTime(item.timestamp) }}</span>
          </router-link>
        </div>
        <div v-else class="empty-block">
          <div class="empty-icon">🚀</div>
          <p>还没有工作流记录</p>
          <router-link to="/ai/workflow?q=咖啡&run=1" class="empty-cta">
            一键体验「咖啡」示例
          </router-link>
        </div>
      </div>

      <div class="panel">
        <div class="section-head">
          <div>
            <strong>最近 Trace</strong>
            <span>调用链路与耗时</span>
          </div>
          <router-link
            v-if="recentTraces.length"
            to="/ai/observability"
            class="section-link"
          >
            查看全部
          </router-link>
        </div>
        <div v-if="recentTraces.length" class="list">
          <router-link
            v-for="trace in recentTraces"
            :key="trace.id"
            :to="{ path: '/ai/observability', query: { id: trace.id } }"
            class="list-row"
          >
            <span class="row-icon">{{ traceIcon(trace.type) }}</span>
            <div class="row-copy">
              <strong>{{ trace.title || '未命名调用' }}</strong>
              <small>
                <span class="status-pill" :class="trace.status">
                  {{ statusLabel(trace.status) }}
                </span>
                {{ traceTypeLabel(trace.type) }}
                <template v-if="trace.durationMs">
                  · {{ trace.durationMs }}ms</template
                >
              </small>
            </div>
            <span class="row-time">{{ formatTime(trace.createdAt) }}</span>
          </router-link>
        </div>
        <div v-else class="empty-block">
          <div class="empty-icon">📈</div>
          <p>暂无调用记录</p>
          <router-link to="/ai/chat" class="empty-cta"
            >去 Agent 聊天产生 Trace</router-link
          >
        </div>
      </div>
    </div>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import { aiPlatformModules } from '@/config/ai-platform'
import {
  getKnowledgeBases,
  getPlatformTraces,
  type PlatformTrace
} from '@/services/ai-platform-store'
import {
  getAutomationLogs,
  getAutomationTasks
} from '@/services/ai-automation/scheduler'
import {
  countWorkflowProducts,
  getAISettings,
  getHistory,
  normalizeAISettings,
  type GenerationResult
} from '@/services/ai'
import {
  defaultPlanQuota,
  exportWorkspaceBackup,
  getPlatformUsage,
  isNearQuota,
  usagePercent
} from '@/services/platform-usage'

const AI_CHAT_STORAGE_KEY = 'ai-chat-conversation'
const AI_CHAT_SESSIONS_KEY = 'ai-chat-sessions'

type ChatSessionPreview = {
  id: string
  title: string
  updatedAt: number
}

const recentChatSessions = ref<ChatSessionPreview[]>([])
const platformUsage = ref(getPlatformUsage())
const planQuota = defaultPlanQuota()

const recentTraces = ref<PlatformTrace[]>(getPlatformTraces().slice(0, 5))

const settings = normalizeAISettings(getAISettings())
const isConfigured = computed(() => Boolean(settings.apiKey && settings.model))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const hasChatActivity = () => {
  try {
    const sessionsRaw = localStorage.getItem(AI_CHAT_SESSIONS_KEY)
    if (sessionsRaw) {
      const sessions = JSON.parse(sessionsRaw) as Array<{
        messages?: Array<{ role?: string }>
      }>
      return sessions.some(
        (session) =>
          (session.messages || []).filter((item) => item.role === 'user')
            .length > 0
      )
    }
    const raw = localStorage.getItem(AI_CHAT_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Array<{ role?: string }>
    return parsed.filter((item) => item.role === 'user').length > 0
  } catch {
    return false
  }
}

const loadRecentChatSessions = () => {
  try {
    const raw = localStorage.getItem(AI_CHAT_SESSIONS_KEY)
    if (!raw) {
      recentChatSessions.value = []
      return
    }
    const sessions = JSON.parse(raw) as ChatSessionPreview[]
    recentChatSessions.value = sessions
      .filter((session) => session.title && session.title !== '新对话')
      .slice(0, 5)
  } catch {
    recentChatSessions.value = []
  }
}

const formatChatSessionTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 3_600_000)
    return `${Math.max(1, Math.floor(diff / 60_000))} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  })
}

const handleExportBackup = () => {
  exportWorkspaceBackup()
  ElMessage.success('工作区备份已下载')
}

const onboardingSteps = computed(() => {
  const workflowDone = getHistory().length > 0
  const chatDone = hasChatActivity()
  const kbDone = getKnowledgeBases().length > 0
  return [
    {
      id: 'settings',
      index: 1,
      label: '配置模型 API',
      desc: '填写 Key 与模型名称',
      done: isConfigured.value,
      path: '/ai/settings'
    },
    {
      id: 'workflow',
      index: 2,
      label: '运行 Multi-Agent 工作流',
      desc: '研究 → 创意 → 评估 → 电子合同',
      done: workflowDone,
      path: '/ai/workflow?q=咖啡&run=1'
    },
    {
      id: 'chat',
      index: 3,
      label: '体验 Agent 聊天',
      desc: 'ReAct 工具调用与流式回复',
      done: chatDone,
      path: '/ai/chat'
    },
    {
      id: 'knowledge',
      index: 4,
      label: '创建知识库（可选）',
      desc: 'Agent 可检索内部文档',
      done: kbDone,
      path: '/ai/knowledge'
    }
  ]
})

const onboardingProgress = computed(() => {
  const done = onboardingSteps.value.filter((step) => step.done).length
  return Math.round((done / onboardingSteps.value.length) * 100)
})

const usageItems = computed(() => {
  const usage = platformUsage.value
  const quota = planQuota
  const storageUsedMb = Math.max(1, Math.round(usage.estimatedStorageKB / 1024))
  return [
    {
      label: '工作流运行',
      used: usage.workflowRuns,
      limit: quota.workflowRuns,
      percent: usagePercent(usage.workflowRuns, quota.workflowRuns),
      warn: isNearQuota(usage.workflowRuns, quota.workflowRuns),
      desc: 'Multi-Agent 流水线执行次数'
    },
    {
      label: '聊天轮次',
      used: usage.chatTurns,
      limit: quota.chatTurns,
      percent: usagePercent(usage.chatTurns, quota.chatTurns),
      warn: isNearQuota(usage.chatTurns, quota.chatTurns),
      desc: 'Agent 聊天用户消息数'
    },
    {
      label: '本地存储 (MB)',
      used: storageUsedMb,
      limit: quota.storageMB,
      percent: usagePercent(storageUsedMb, quota.storageMB),
      warn: isNearQuota(storageUsedMb, quota.storageMB),
      desc: '知识库、会话、Trace 等浏览器存储'
    },
    {
      label: 'Trace 记录',
      used: usage.traceCount,
      limit: 80,
      percent: usagePercent(usage.traceCount, 80),
      warn: isNearQuota(usage.traceCount, 80),
      desc: '观测链路本地缓存上限 80 条'
    }
  ]
})

const capabilityMatrix = [
  {
    name: 'Multi-Agent 工作流',
    badge: '成熟',
    level: 'ready',
    desc: '三阶段 Agent + 报告分享 + 商务闭环演示'
  },
  {
    name: 'Agent 聊天',
    badge: '成熟',
    level: 'ready',
    desc: 'ReAct 工具、多会话、导出、工作流联动'
  },
  {
    name: '知识库 RAG',
    badge: 'MVP',
    level: 'mvp',
    desc: '本地 CRUD + 关键词检索，缺向量与文件解析'
  },
  {
    name: '自动化调度',
    badge: '演示',
    level: 'demo',
    desc: '前台定时器，需服务端 Cron 才能生产可用'
  },
  {
    name: '团队协作',
    badge: '缺失',
    level: 'gap',
    desc: '无组织、成员、权限与共享空间'
  },
  {
    name: '计费与配额',
    badge: 'UI',
    level: 'demo',
    desc: '账单页为演示，需接入真实计量与支付'
  }
]

const statCards = computed(() => [
  {
    label: '平台模块',
    value: String(aiPlatformModules.length),
    desc: '工作台 / 构建 / 运维',
    icon: '🧩',
    tone: 'blue'
  },
  {
    label: '工作流记录',
    value: String(getHistory().length),
    desc: 'Multi-Agent 历史任务',
    icon: '⚡',
    tone: 'violet'
  },
  {
    label: '自动化任务',
    value: String(getAutomationTasks().filter((t) => t.enabled).length),
    desc: '已启用的定时任务',
    icon: '🕐',
    tone: 'amber'
  },
  {
    label: '模型状态',
    value: isConfigured.value ? '已就绪' : '未配置',
    desc: isConfigured.value ? settings.model : '请先填写 Key 与模型',
    icon: isConfigured.value ? '✅' : '⚠️',
    tone: isConfigured.value ? 'green' : 'rose'
  }
])

const quickLinks = [
  {
    path: '/ai/workflow?q=咖啡&run=1',
    label: 'Multi-Agent 工作流',
    desc: '研究 → 创意 → 评估 → 签章',
    icon: '🔬',
    tone: 'blue'
  },
  {
    path: '/ai/chat',
    label: 'Agent 聊天',
    desc: 'ReAct 工具调用与流式对话',
    icon: '💬',
    tone: 'violet'
  },
  {
    path: '/ai/automation',
    label: '自动化中心',
    desc: '定时任务与商务闭环',
    icon: '🤖',
    tone: 'cyan'
  },
  {
    path: '/ai/knowledge',
    label: '知识库',
    desc: '文档切片 · Agent 可检索',
    icon: '📚',
    tone: 'green'
  }
]

const recentWorkflows = computed(() => getHistory().slice(0, 5))

const formatWorkflowTitle = (item: GenerationResult) => {
  const keyword = item.keyword?.trim()
  if (!keyword || keyword === '1') return '工作流任务'
  return keyword
}

const countProducts = (item: GenerationResult) => countWorkflowProducts(item)

const traceIcon = (type: PlatformTrace['type']) =>
  ({
    workflow: '⚡',
    chat: '💬',
    agent: '🤖',
    automation: '🕐',
    playground: '🧪'
  })[type] || '📌'

const traceTypeLabel = (type: PlatformTrace['type']) =>
  ({
    workflow: '工作流',
    chat: '聊天',
    agent: 'Agent',
    automation: '自动化',
    playground: 'Playground'
  })[type] || type

const statusLabel = (status: PlatformTrace['status']) =>
  ({ success: '成功', error: '失败', running: '进行中' })[status]

const formatTime = (value: number) =>
  new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

onMounted(() => {
  loadRecentChatSessions()
  platformUsage.value = getPlatformUsage()
  recentTraces.value = getPlatformTraces().slice(0, 5)
  if (recentTraces.value.length) return

  const logs = getAutomationLogs()
  if (!logs.length) return

  recentTraces.value = logs.slice(0, 5).map((log) => ({
    id: log.id,
    type: 'automation' as const,
    title: log.taskName,
    detail: log.message,
    status: log.status,
    sourcePath: '/ai/automation',
    createdAt: log.finishedAt
  }))
})
</script>

<style scoped lang="scss">
.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: 14px;
  border: 1px solid rgba(217, 119, 6, 0.2);
  background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
  .banner-icon {
    font-size: 22px;
  }
  .banner-copy {
    flex: 1;
    min-width: 200px;
    strong {
      display: block;
      color: var(--app-text-main);
      margin-bottom: 2px;
    }
    span {
      color: var(--app-text-sub);
      font-size: 13px;
    }
  }
}
.banner-link {
  padding: 8px 16px;
  border-radius: 10px;
  background: var(--app-accent);
  color: #fff;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition:
    background 0.15s,
    transform 0.15s;
  &:hover {
    background: var(--app-accent-strong);
    transform: translateY(-1px);
  }
}

.dash-hero {
  position: relative;
  margin-bottom: 20px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.dash-hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 85% 15%,
      rgba(8, 145, 178, 0.14),
      transparent 45%
    ),
    radial-gradient(
      circle at 10% 80%,
      rgba(37, 99, 235, 0.16),
      transparent 50%
    ),
    linear-gradient(135deg, #eff6ff 0%, #ffffff 48%, #ecfdf5 100%);
}

.dash-hero-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding: 24px 26px;
}

.dash-kicker {
  display: inline-block;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: var(--app-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.dash-title {
  margin: 0 0 8px;
  font-size: clamp(20px, 2.5vw, 26px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--app-text-main);
}

.dash-subtitle {
  margin: 0;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--app-text-sub);
}

.dash-hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dash-cta-primary,
.dash-cta-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.18s ease;
}

.dash-cta-primary {
  background: var(--app-accent);
  color: #fff;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.28);
  &:hover {
    background: var(--app-accent-strong);
    transform: translateY(-1px);
  }
}

.dash-cta-ghost {
  border: 1px solid var(--app-border-strong);
  background: rgba(255, 255, 255, 0.72);
  color: var(--app-text-main);
  &:hover {
    border-color: var(--app-accent-muted);
    color: var(--app-accent);
  }
}

.onboarding {
  margin-bottom: 20px;
  padding: 18px 20px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.onboarding-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  strong {
    display: block;
    color: var(--app-text-main);
    font-size: 15px;
  }
  span {
    font-size: 12px;
    color: var(--app-text-faint);
  }
  em {
    font-style: normal;
    font-size: 20px;
    font-weight: 800;
    color: var(--app-accent);
  }
}

.onboarding-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--app-surface-muted);
  overflow: hidden;
  margin-bottom: 14px;
}

.onboarding-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--app-accent), var(--app-secondary));
  transition: width 0.35s ease;
}

.onboarding-steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.onboarding-step {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  text-decoration: none;
  background: var(--app-surface-muted);
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
  &:hover {
    border-color: var(--app-accent-muted);
    box-shadow: var(--app-shadow-sm);
    transform: translateY(-1px);
  }
  &.done {
    opacity: 0.78;
  }
  strong {
    display: block;
    font-size: 13px;
    color: var(--app-text-main);
  }
  p {
    margin: 4px 0 0;
    font-size: 11px;
    color: var(--app-text-sub);
  }
}

.onboarding-check {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  background: var(--app-surface);
  color: var(--app-text-sub);
  border: 1px solid var(--app-border);
}

.onboarding-step.done .onboarding-check {
  background: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

.stat-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 20px;
}

.stat-body {
  min-width: 0;
  .stat-label {
    font-size: 12px;
    color: var(--app-text-faint);
    font-weight: 600;
  }
  .stat-value {
    display: block;
    margin: 4px 0 2px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--app-text-main);
    line-height: 1.1;
  }
  p {
    margin: 0;
    font-size: 11px;
    color: var(--app-text-sub);
    line-height: 1.4;
  }
}

.tone-blue .stat-icon {
  background: #eff6ff;
}
.tone-violet .stat-icon {
  background: #f5f3ff;
}
.tone-amber .stat-icon {
  background: #fffbeb;
}
.tone-green .stat-icon {
  background: #ecfdf5;
}
.tone-rose .stat-icon {
  background: #fff1f2;
}

.section {
  margin-top: 4px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  strong {
    display: block;
    color: var(--app-text-main);
    font-size: 15px;
  }
  span {
    font-size: 12px;
    color: var(--app-text-faint);
  }
}

.section-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-accent);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.section-link-btn {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  text-decoration: none;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  transition: all 0.18s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow);
    border-color: var(--app-accent-muted);
    .quick-arrow {
      opacity: 1;
      transform: translateX(2px);
      color: var(--app-accent);
    }
  }
  strong {
    display: block;
    color: var(--app-text-main);
    font-size: 14px;
    margin-bottom: 4px;
  }
  p {
    margin: 0;
    font-size: 12px;
    color: var(--app-text-sub);
    line-height: 1.45;
  }
}

.quick-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 20px;
}

.quick-copy {
  flex: 1;
  min-width: 0;
}

.quick-arrow {
  font-size: 16px;
  color: var(--app-text-faint);
  opacity: 0.4;
  transition: all 0.18s ease;
}

.tone-blue .quick-icon {
  background: #eff6ff;
}
.tone-violet .quick-icon {
  background: #f5f3ff;
}
.tone-cyan .quick-icon {
  background: #ecfeff;
}
.tone-green .quick-icon {
  background: #ecfdf5;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 22px;
}

.panel {
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.list {
  display: grid;
  gap: 8px;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  text-decoration: none;
  background: var(--app-surface-muted);
  transition: all 0.15s ease;
  &:hover {
    background: var(--app-surface);
    border-color: var(--app-accent-muted);
    box-shadow: var(--app-shadow-sm);
    .row-copy strong {
      color: var(--app-accent);
    }
  }
}

.row-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--app-surface);
  font-size: 16px;
}

.row-copy {
  flex: 1;
  min-width: 0;
  strong {
    display: block;
    color: var(--app-text-main);
    font-size: 14px;
    font-weight: 600;
    transition: color 0.15s;
  }
  small {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 3px;
    font-size: 11px;
    color: var(--app-text-faint);
  }
}

.row-time {
  font-size: 11px;
  color: var(--app-text-faint);
  white-space: nowrap;
}

.status-pill {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  &.success {
    background: #ecfdf5;
    color: #059669;
  }
  &.error {
    background: #fef2f2;
    color: #dc2626;
  }
  &.running {
    background: #eff6ff;
    color: #2563eb;
  }
}

.empty-block {
  padding: 28px 16px;
  border: 1px dashed var(--app-border-strong);
  border-radius: 14px;
  text-align: center;
  background: var(--app-surface-muted);
  .empty-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }
  p {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--app-text-sub);
  }
}

.empty-cta {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 10px;
  background: var(--app-accent);
  color: #fff;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  &:hover {
    background: var(--app-accent-strong);
  }
}

.chat-session-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chat-session-chip {
  display: grid;
  gap: 4px;
  min-width: 160px;
  max-width: 240px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-muted);
  text-decoration: none;
  transition: all 0.15s ease;

  strong {
    font-size: 13px;
    color: var(--app-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 11px;
    color: var(--app-text-faint);
  }

  &:hover {
    border-color: var(--app-accent-muted);
    background: var(--app-accent-soft);
    transform: translateY(-1px);
  }
}

.usage-panel,
.readiness-panel {
  margin-top: 4px;
  margin-bottom: 16px;
  padding: 18px 20px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.usage-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);

  &.warn {
    border-color: rgba(217, 119, 6, 0.35);
    background: rgba(217, 119, 6, 0.06);
  }

  p {
    margin: 8px 0 0;
    font-size: 11px;
    color: var(--app-text-sub);
    line-height: 1.5;
  }
}

.usage-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;

  span {
    font-size: 11px;
    font-weight: 700;
    color: var(--app-text-faint);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  strong {
    font-size: 12px;
    color: var(--app-text-main);
  }
}

.usage-bar {
  height: 6px;
  border-radius: 999px;
  background: var(--app-border);
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--app-accent), var(--app-secondary));
}

.usage-card.warn .usage-fill {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.readiness-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.readiness-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);

  strong {
    display: block;
    margin: 8px 0 4px;
    font-size: 13px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    font-size: 11px;
    line-height: 1.55;
    color: var(--app-text-sub);
  }

  &.ready {
    border-color: rgba(22, 163, 74, 0.25);
    background: rgba(22, 163, 74, 0.06);
  }

  &.mvp {
    border-color: rgba(37, 99, 235, 0.2);
  }

  &.demo {
    border-color: rgba(217, 119, 6, 0.25);
    background: rgba(217, 119, 6, 0.05);
  }

  &.gap {
    border-color: rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.04);
  }
}

.readiness-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  color: var(--app-text-sub);
}

@media (max-width: 960px) {
  .stat-grid,
  .quick-grid,
  .onboarding-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .usage-grid,
  .readiness-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .two-col {
    grid-template-columns: 1fr;
  }
  .dash-hero-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 560px) {
  .stat-grid,
  .quick-grid,
  .onboarding-steps {
    grid-template-columns: 1fr;
  }
}
</style>
