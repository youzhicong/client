<template>
  <div class="ai-workflow-page ai-agent-shell">
    <AgentStudioHeader title="" description="" active="workflow" compact />

    <section class="workflow-workspace studio-workspace">
      <div v-if="!isConfigured" class="ai-agent-config-banner">
        <div class="ai-agent-config-banner-copy">
          <strong>尚未配置模型</strong>
          <span>配置 API Key 与模型后，三阶段 Agent 流水线即可运行</span>
        </div>
        <button
          class="ai-agent-btn-primary"
          type="button"
          @click="router.push('/ai/settings')"
        >
          去配置
        </button>
      </div>

      <div class="workflow-workspace-main studio-workspace-main">
        <div class="studio-page-bar">
          <div class="studio-page-bar-copy">
            <h2>Multi-Agent 产品工作流</h2>
            <p>输入品类关键词，自动完成研究 → 创意 → 评估 → 电子合同签章</p>
          </div>
          <div class="studio-page-bar-actions">
            <button
              v-if="result"
              type="button"
              class="ai-agent-btn-ghost"
              @click="openReportPage"
            >
              可视化报告
            </button>
            <button
              type="button"
              class="ai-agent-btn-ghost"
              @click="router.push('/ai/settings')"
            >
              模型配置
            </button>
          </div>
        </div>
        <div v-if="!isLoading" class="ai-agent-pipeline-row">
          <div
            v-for="(agent, index) in visibleWorkflowAgents"
            :key="agent.id"
            class="ai-agent-pipeline-card"
            :class="{
              active: isPhaseActive(agent.id),
              done: isPhaseDone(agent.id)
            }"
          >
            <span class="ai-agent-pipeline-step">{{ index + 1 }}</span>
            <div>
              <strong>{{ agent.name }}</strong>
              <span>{{ agent.description }}</span>
              <span
                v-if="getAgentModelName(agent.id)"
                class="ai-agent-pipeline-model"
              >
                {{ getAgentModelName(agent.id) }}
              </span>
            </div>
          </div>
        </div>

        <section class="ai-agent-command">
          <div class="ai-agent-command-inner">
            <div class="ai-agent-command-icon">
              <el-icon><MagicStick /></el-icon>
            </div>
            <input
              v-model="keyword"
              type="text"
              class="ai-agent-command-input"
              placeholder="输入品类，如：咖啡、蜂蜜、宠物用品…"
              @keyup.enter="handleGenerate"
            />
            <button
              class="ai-agent-command-submit"
              :class="{ 'is-stop': isLoading }"
              :disabled="!isLoading && !keyword.trim()"
              @click="isLoading ? stopWorkflow() : handleGenerate()"
            >
              <el-icon v-if="!isLoading"><Promotion /></el-icon>
              <el-icon v-else class="spin"><Loading /></el-icon>
              {{ isLoading ? `全自动执行中…${autoStepLabel}` : '一键全自动' }}
            </button>
          </div>
          <p v-if="isLoading" class="auto-run-hint">
            AI 正在自动执行全流程，请勿关闭页面；当前：{{
              workflowProgress.label
            }}
          </p>
          <div class="ai-agent-tags">
            <label class="workflow-closure-toggle">
              <input
                v-model="enableBusinessClosure"
                type="checkbox"
                :disabled="isLoading"
              />
              全自动包含：审批 + 电子合同 + 双章签署
            </label>
            <button
              v-for="example in examples"
              :key="example"
              type="button"
              class="ai-agent-tag"
              :disabled="isLoading"
              @click="startWithExample(example)"
            >
              {{ example }}
            </button>
          </div>
          <div v-if="errorMsg" class="ai-agent-alert">
            <el-icon><Warning /></el-icon>
            {{ errorMsg }}
          </div>
        </section>

        <div v-if="isLoading" class="skeleton-section">
          <div class="ai-agent-progress">
            <div class="ai-agent-progress-head">
              <strong>Multi-Agent 流水线</strong>
              <span>{{ workflowProgress.label }}</span>
            </div>
            <div class="ai-agent-progress-bar" aria-hidden="true">
              <div
                class="ai-agent-progress-fill"
                :style="{ width: `${workflowProgressPercent}%` }"
              />
            </div>
            <div class="ai-agent-pipeline-row">
              <div
                v-for="(agent, index) in visibleWorkflowAgents"
                :key="agent.id"
                class="ai-agent-pipeline-card"
                :class="{
                  active: isPhaseActive(agent.id),
                  done: isPhaseDone(agent.id)
                }"
              >
                <span class="ai-agent-pipeline-step">{{ index + 1 }}</span>
                <div>
                  <strong>{{ agent.name }}</strong>
                  <p>{{ agent.description }}</p>
                  <span
                    v-if="getAgentModelName(agent.id)"
                    class="ai-agent-pipeline-model"
                  >
                    {{ getAgentModelName(agent.id) }}
                  </span>
                </div>
              </div>
            </div>
            <BusinessClosureTrace
              v-if="displayClosureSteps.length"
              :steps="displayClosureSteps"
              :closure="businessClosure"
            />
            <AgentTracePanel
              v-if="agentSteps.length"
              :steps="agentSteps"
              title="执行轨迹"
              :exclude-agent-ids="['compliance']"
              group-by-agent
            />
          </div>
        </div>

        <!-- Results Section -->
        <div v-else-if="result" class="results-section">
          <div class="ai-agent-results-head">
            <div class="results-head-copy">
              <h2>
                <span class="ai-agent-keyword">{{ result.keyword }}</span>
                产品创意方案
              </h2>
              <span class="result-time"
                >生成于 {{ formatTime(result.timestamp) }}</span
              >
            </div>
            <div class="results-actions">
              <button
                class="ai-agent-btn-primary"
                type="button"
                @click="openReportPage"
              >
                可视化报告
              </button>
              <button
                class="ai-agent-btn-ghost"
                type="button"
                @click="copyWorkflowSummary"
              >
                复制摘要
              </button>
              <button
                class="ai-agent-btn-ghost"
                type="button"
                @click="exportWorkflowJson"
              >
                导出 JSON
              </button>
              <button
                class="ai-agent-btn-ghost"
                type="button"
                @click="exportWorkflowMarkdown"
              >
                导出 Markdown
              </button>
              <button
                class="ai-agent-btn-primary"
                type="button"
                @click="continueWorkflowInChat"
              >
                Agent 聊天继续
              </button>
            </div>
          </div>

          <div
            v-if="enableBusinessClosure && !businessClosure && result"
            class="closure-missing-banner"
          >
            <strong>商务闭环未生成</strong>
            <span>可手动补跑：自动生成电子合同并盖双章</span>
            <button
              type="button"
              class="ai-agent-btn-primary"
              @click="runClosureManually()"
            >
              补签电子合同
            </button>
          </div>

          <div v-if="businessClosure" class="e-contract-panel">
            <div class="e-contract-head">
              <strong>电子合同 · {{ businessClosure.contractCode }}</strong>
              <span>{{
                businessClosure.contractStatus === 'completed'
                  ? '已生效'
                  : businessClosure.contractStatus
              }}</span>
            </div>

            <div class="e-contract-meta">
              <span>审批 {{ businessClosure.approvalCode }}</span>
              <span
                >金额 ¥{{
                  businessClosure.amount.toLocaleString('zh-CN')
                }}</span
              >
              <span>甲方 {{ businessClosure.partyA }}</span>
              <span>乙方 {{ businessClosure.partyB }}</span>
            </div>

            <article class="e-contract-body">
              <h3>{{ businessClosure.contractTitle }}</h3>
              <p>{{ businessClosure.contractContent }}</p>
              <div class="e-contract-signatures">
                <div class="seal-block">
                  <span>甲方（盖章）</span>
                  <img
                    :src="businessClosure.sealImages.partyA"
                    alt="甲方电子章"
                  />
                  <small>{{ businessClosure.partyA }}</small>
                </div>
                <div class="seal-block">
                  <span>乙方（盖章）</span>
                  <img
                    :src="businessClosure.sealImages.partyB"
                    alt="乙方电子章"
                  />
                  <small>{{ businessClosure.partyB }}</small>
                </div>
              </div>
            </article>

            <div class="e-contract-actions">
              <button
                type="button"
                class="ai-agent-btn-ghost"
                @click="downloadContractPdf"
              >
                下载合同 HTML
              </button>
              <button
                type="button"
                class="ai-agent-btn-ghost"
                @click="downloadSeal('partyA')"
              >
                下载甲方章
              </button>
              <button
                type="button"
                class="ai-agent-btn-ghost"
                @click="downloadSeal('partyB')"
              >
                下载乙方章
              </button>
            </div>
          </div>

          <div v-if="topPicks.length" class="top-picks-row">
            <strong>Agent 推荐 TOP</strong>
            <span v-for="name in topPicks" :key="name" class="top-pick-chip">{{
              name
            }}</span>
          </div>

          <div v-if="workflowSummary" class="ai-agent-summary">
            <strong>Agent 评估摘要</strong>
            <p>{{ workflowSummary }}</p>
          </div>

          <div
            v-for="(category, catIdx) in result.categories"
            :key="category.name"
            class="category-block"
            :style="{ '--cat-delay': catIdx * 0.1 + 's' }"
          >
            <div class="category-header">
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count"
                >{{ category.products.length }} 个产品</span
              >
            </div>
            <div class="products-grid">
              <div
                v-for="(product, pIdx) in category.products"
                :key="product.name"
                class="product-card clickable"
                :style="{ '--delay': catIdx * 0.1 + pIdx * 0.05 + 's' }"
                @click="goToDetail(product)"
              >
                <div class="product-icon">{{ product.icon }}</div>
                <div class="product-body">
                  <h3 class="product-name">
                    {{ product.name }}
                    <span v-if="isTopPick(product.name)" class="top-pick-badge"
                      >推荐</span
                    >
                  </h3>
                  <p class="product-desc">{{ product.description }}</p>
                  <div class="product-meta">
                    <span
                      class="potential-tag"
                      :class="{
                        high: product.marketPotential === '高',
                        medium: product.marketPotential === '中',
                        low: product.marketPotential === '低'
                      }"
                    >
                      市场潜力: {{ product.marketPotential }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="displayClosureSteps.length || agentSteps.length"
            class="workflow-trace-stack"
          >
            <BusinessClosureTrace
              v-if="displayClosureSteps.length"
              :steps="displayClosureSteps"
              :closure="businessClosure"
            />
            <AgentTracePanel
              v-if="agentSteps.length"
              :steps="agentSteps"
              title="完整执行轨迹"
              class="workflow-result-trace"
              :exclude-agent-ids="['compliance']"
              group-by-agent
            />
          </div>
        </div>

        <!-- History Section (mobile fallback) -->
        <div
          v-if="history.length > 0"
          class="ai-agent-history workflow-history-mobile"
        >
          <div class="ai-agent-history-head">
            <h3>历史记录</h3>
            <button
              class="ai-agent-history-clear"
              type="button"
              @click="handleClearHistory"
            >
              清空
            </button>
          </div>
          <div class="ai-agent-history-table">
            <button
              v-for="item in history"
              :key="item.timestamp"
              type="button"
              class="ai-agent-history-row"
              @click="handleLoadHistory(item)"
            >
              <span class="ai-agent-history-keyword">{{ item.keyword }}</span>
              <span class="ai-agent-history-meta"
                >{{ getTotalProducts(item) }} 个产品</span
              >
              <span class="ai-agent-history-time">{{
                formatTime(item.timestamp)
              }}</span>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="!isLoading && !result && history.length === 0"
          class="empty-section"
        >
          <div class="empty-icon">
            <el-icon :size="48"><MagicStick /></el-icon>
          </div>
          <h3>开始您的产品创意之旅</h3>
          <p>输入关键词，三阶段 Agent 将自动完成研究、创意与评估</p>
        </div>
      </div>

      <aside class="workflow-workspace-side studio-workspace-side">
        <div class="studio-stat-grid">
          <div class="studio-stat">
            <span>历史任务</span>
            <strong>{{ history.length }}</strong>
          </div>
          <div class="studio-stat">
            <span>当前模型</span>
            <strong :class="{ ready: isConfigured }">{{
              workflowModelSummary
            }}</strong>
          </div>
        </div>

        <div class="studio-side-card workflow-side-panel workflow-model-panel">
          <div class="workflow-side-head">
            <strong>工作流模型</strong>
            <button type="button" @click="syncFromGlobalSettings">
              同步全局
            </button>
          </div>

          <label class="workflow-model-field">
            <span>Provider</span>
            <select
              v-model="modelConfig.provider"
              class="workflow-model-select"
              @change="handleProviderChange"
            >
              <option
                v-for="provider in providers"
                :key="provider.id"
                :value="provider.id"
              >
                {{ provider.name }}
              </option>
            </select>
          </label>

          <label v-if="!modelConfig.perAgent" class="workflow-model-field">
            <span>统一模型</span>
            <select v-model="modelConfig.model" class="workflow-model-select">
              <option
                v-for="model in unifiedModelOptions"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }}
              </option>
            </select>
          </label>

          <label class="workflow-model-toggle">
            <input v-model="modelConfig.perAgent" type="checkbox" />
            分 Agent 指定模型
          </label>

          <div v-if="modelConfig.perAgent" class="workflow-agent-models">
            <label
              v-for="agent in workflowAgents"
              :key="agent.id"
              class="workflow-model-field"
            >
              <span>{{ agent.name }}</span>
              <select
                v-model="modelConfig.agents[agent.id as WorkflowAgentPhase]"
                class="workflow-model-select"
              >
                <option
                  v-for="model in getAgentModelOptions(
                    agent.id as WorkflowAgentPhase
                  )"
                  :key="model.id"
                  :value="model.id"
                >
                  {{ model.name }}
                </option>
              </select>
            </label>
          </div>

          <button
            type="button"
            class="workflow-side-link workflow-model-settings"
            @click="router.push('/ai/settings')"
          >
            管理 API Key 与接口地址
          </button>
        </div>

        <div v-if="history.length" class="workflow-side-panel">
          <div class="workflow-side-head">
            <strong>最近工作流</strong>
            <button type="button" @click="handleClearHistory">清空</button>
          </div>
          <button
            v-for="item in history.slice(0, 8)"
            :key="item.timestamp"
            type="button"
            class="workflow-history-item"
            @click="handleLoadHistory(item)"
          >
            <span class="workflow-history-keyword">{{ item.keyword }}</span>
            <span class="workflow-history-meta">
              {{ getTotalProducts(item) }} 个创意 ·
              {{ formatTime(item.timestamp) }}
            </span>
          </button>
        </div>

        <div class="workflow-side-panel">
          <div class="workflow-side-head">
            <strong>场景模板</strong>
            <span>一键填入</span>
          </div>
          <div class="workflow-side-tags workflow-presets">
            <button
              v-for="preset in workflowPresets"
              :key="preset.name"
              type="button"
              @click="applyPreset(preset)"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <div class="workflow-side-panel">
          <div class="workflow-side-head">
            <strong>热门关键词</strong>
            <span>点击填入</span>
          </div>
          <div class="workflow-side-tags">
            <button
              v-for="example in examples"
              :key="example"
              type="button"
              @click="keyword = example"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="workflow-side-link"
          @click="router.push('/ai/chat')"
        >
          去 Agent 聊天继续细化方案
        </button>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick,
  Promotion,
  Loading,
  Warning
} from '@element-plus/icons-vue'
import AgentTracePanel from '@/components/agent/AgentTracePanel.vue'
import BusinessClosureTrace from '@/components/agent/BusinessClosureTrace.vue'
import AgentStudioHeader from '@/components/agent/AgentStudioHeader.vue'
import { appendPlatformTrace } from '@/services/ai-platform-store'
import type {
  BusinessClosureResult,
  BusinessClosureStep
} from '@/services/ai-automation/business-flow'
import { runBusinessClosureFlow } from '@/services/ai-automation/business-flow'
import {
  WORKFLOW_AGENTS,
  runProductWorkflowAgent,
  type AgentStep,
  type WorkflowAgentProgress
} from '@/services/ai-agent'
import {
  AI_PROVIDERS,
  getAIProviderById,
  getAISettings,
  getHistory,
  getWorkflowModelConfig,
  getWorkflowModelLabel,
  normalizeAISettings,
  saveToHistory,
  saveWorkflowModelConfig,
  shouldAutoSyncWorkflowModel,
  syncWorkflowModelFromGlobalSettings,
  clearHistory,
  type GenerationResult,
  type ProductIdea,
  type WorkflowAgentPhase,
  type WorkflowModelConfig
} from '@/services/ai'

const router = useRouter()
const route = useRoute()

const WORKFLOW_PREFS_KEY = 'ai-workflow-prefs'

const keyword = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const result = ref<GenerationResult | null>(null)
const history = ref<GenerationResult[]>([])
const workflowSummary = ref('')
const topPicks = ref<string[]>([])
const agentSteps = ref<AgentStep[]>([])
const workflowAgents = WORKFLOW_AGENTS
const enableBusinessClosure = ref(true)
const businessClosure = ref<BusinessClosureResult | null>(null)
const businessClosureSteps = ref<BusinessClosureStep[]>([])
const abortController = ref<AbortController | null>(null)
const workflowRunStartedAt = ref(0)
const visibleWorkflowAgents = computed(() =>
  enableBusinessClosure.value
    ? workflowAgents
    : workflowAgents.filter((agent) => agent.id !== 'compliance')
)
const providers = AI_PROVIDERS
const settings = ref(normalizeAISettings(getAISettings()))
const modelConfig = ref<WorkflowModelConfig>(getWorkflowModelConfig())

const appendCustomModel = (
  models: Array<{ id: string; name: string }>,
  modelId?: string
) => {
  if (!modelId || models.some((item) => item.id === modelId)) return models
  return [...models, { id: modelId, name: modelId }]
}

const currentProvider = computed(() =>
  getAIProviderById(modelConfig.value.provider)
)

const unifiedModelOptions = computed(() =>
  appendCustomModel(
    currentProvider.value?.models || [],
    modelConfig.value.model
  )
)

const workflowModelSummary = computed(() => {
  if (!isConfigured.value) return '未配置'
  if (modelConfig.value.perAgent) return '分 Agent 模式'
  return modelConfig.value.model || '未设置'
})

const isConfigured = computed(() => {
  const base = settings.value
  if (!base.apiKey || !base.baseUrl) return false
  if (modelConfig.value.perAgent) {
    return visibleWorkflowAgents.value.every((agent) =>
      Boolean(modelConfig.value.agents[agent.id as WorkflowAgentPhase])
    )
  }
  return Boolean(modelConfig.value.model)
})
const workflowProgress = ref<WorkflowAgentProgress>({
  phase: 'research',
  label: '准备启动…',
  trace: [],
  currentSteps: []
})

const phaseOrder = [
  'research',
  'ideation',
  'evaluation',
  'compliance',
  'done',
  'fallback'
]

const isPipelineComplete = computed(
  () => Boolean(result.value) && !isLoading.value
)

const isPhaseDone = (phaseId: string) => {
  if (isPipelineComplete.value) {
    if (phaseId === 'compliance') {
      return !enableBusinessClosure.value || Boolean(businessClosure.value)
    }
    return true
  }
  const currentIndex = phaseOrder.indexOf(workflowProgress.value.phase)
  const targetIndex = phaseOrder.indexOf(phaseId)
  return currentIndex > targetIndex
}

const isPhaseActive = (phaseId: string) => {
  if (!isLoading.value || isPipelineComplete.value) return false
  return workflowProgress.value.phase === phaseId
}

const examples = [
  '咖啡',
  '蜂蜜',
  '宠物用品',
  '露营装备',
  '轻食沙拉',
  '智能家居'
]

const workflowPresets = [
  { name: '消费品', keyword: '新中式茶饮', enableClosure: false },
  { name: '农产品', keyword: '有机蜂蜜', enableClosure: true },
  { name: '宠物经济', keyword: '宠物智能用品', enableClosure: false },
  { name: '企业 SaaS', keyword: 'AI 客服系统', enableClosure: true }
]

const autoStepLabel = computed(() => {
  const map: Record<string, string> = {
    research: '① 市场研究',
    ideation: '② 创意生成',
    evaluation: '③ 评估优化',
    compliance: '④ 商务闭环',
    fallback: '兼容生成',
    done: '完成'
  }
  return map[workflowProgress.value.phase]
    ? `（${map[workflowProgress.value.phase]}）`
    : ''
})

const workflowProgressPercent = computed(() => {
  const idx = phaseOrder.indexOf(workflowProgress.value.phase)
  if (workflowProgress.value.phase === 'done') return 100
  if (idx <= 0) return 12
  const steps =
    visibleWorkflowAgents.value.length + (enableBusinessClosure.value ? 1 : 0)
  return Math.min(96, Math.round((idx / Math.max(steps, 1)) * 100))
})

const startWithExample = (example: string) => {
  keyword.value = example
  void handleGenerate()
}

const applyPreset = (preset: (typeof workflowPresets)[number]) => {
  keyword.value = preset.keyword
  enableBusinessClosure.value = preset.enableClosure
  persistWorkflowPrefs()
  void handleGenerate()
}

const isTopPick = (name: string) => topPicks.value.includes(name)

const persistWorkflowPrefs = () => {
  localStorage.setItem(
    WORKFLOW_PREFS_KEY,
    JSON.stringify({ enableBusinessClosure: enableBusinessClosure.value })
  )
}

const loadWorkflowPrefs = () => {
  enableBusinessClosure.value = true
  try {
    const raw = localStorage.getItem(WORKFLOW_PREFS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { enableBusinessClosure?: boolean }
    if (parsed.enableBusinessClosure === true) {
      enableBusinessClosure.value = true
    }
  } catch {
    // ignore
  }
}

const stopWorkflow = () => {
  abortController.value?.abort()
  isLoading.value = false
  errorMsg.value = '工作流已停止'
  ElMessage.info('已停止工作流')
}

const getAgentModelOptions = (agentId: WorkflowAgentPhase) =>
  appendCustomModel(
    currentProvider.value?.models || [],
    modelConfig.value.agents[agentId] || modelConfig.value.model
  )

const getAgentModelName = (agentId: string) =>
  getWorkflowModelLabel(modelConfig.value, agentId as WorkflowAgentPhase)

const displayClosureSteps = computed(() => {
  if (businessClosureSteps.value.length) return businessClosureSteps.value
  return businessClosure.value?.steps || []
})

const ensureAgentModels = () => {
  if (!modelConfig.value.perAgent) return
  for (const agent of visibleWorkflowAgents.value) {
    const phase = agent.id as WorkflowAgentPhase
    if (!modelConfig.value.agents[phase]) {
      modelConfig.value.agents[phase] = modelConfig.value.model
    }
  }
}

const handleProviderChange = () => {
  const provider = getAIProviderById(modelConfig.value.provider)
  const [firstModel] = provider?.models || []
  if (firstModel) {
    modelConfig.value.model = firstModel.id
  }
  ensureAgentModels()
}

const syncFromGlobalSettings = () => {
  settings.value = normalizeAISettings(getAISettings())
  modelConfig.value = syncWorkflowModelFromGlobalSettings()
  ElMessage.success('已同步全局模型配置')
}

watch(
  modelConfig,
  (value) => {
    saveWorkflowModelConfig(value)
  },
  { deep: true }
)

watch(
  () => modelConfig.value.perAgent,
  (enabled) => {
    if (enabled) ensureAgentModels()
  }
)

watch(enableBusinessClosure, persistWorkflowPrefs)

onMounted(() => {
  settings.value = normalizeAISettings(getAISettings())
  modelConfig.value = getWorkflowModelConfig()
  if (shouldAutoSyncWorkflowModel()) {
    modelConfig.value = syncWorkflowModelFromGlobalSettings()
  } else {
    ensureAgentModels()
  }
  loadWorkflowPrefs()
  history.value = getHistory()
  const queryKeyword = route.query.q
  if (typeof queryKeyword === 'string' && queryKeyword.trim()) {
    keyword.value = queryKeyword.trim()
  }
  if (route.query.run === '1' && keyword.value.trim()) {
    void handleGenerate()
  }
})

const handleGenerate = async () => {
  if (!keyword.value.trim()) {
    errorMsg.value = '请输入关键词'
    return
  }

  if (!isConfigured.value) {
    errorMsg.value = '请先完成模型配置'
    ElMessage.warning('请先在「模型配置」中填写 API Key 与模型')
    return
  }

  errorMsg.value = ''
  isLoading.value = true
  result.value = null
  businessClosure.value = null
  businessClosureSteps.value = []
  workflowSummary.value = ''
  topPicks.value = []
  agentSteps.value = []
  workflowRunStartedAt.value = Date.now()
  const workflowSessionId = `wf-${workflowRunStartedAt.value}`
  const controller = new AbortController()
  abortController.value = controller
  workflowProgress.value = {
    phase: 'research',
    label: '市场研究 Agent 正在启动…',
    trace: [],
    currentSteps: []
  }

  try {
    let data = await runProductWorkflowAgent(keyword.value.trim(), {
      modelConfig: modelConfig.value,
      enableBusinessClosure: enableBusinessClosure.value,
      signal: controller.signal,
      onProgress: (progress) => {
        workflowProgress.value = progress
        agentSteps.value = progress.trace.flatMap((item) => item.steps)
      },
      onStep: (step) => {
        agentSteps.value = [...agentSteps.value, step]
      },
      onBusinessStep: (step) => {
        businessClosureSteps.value = [...businessClosureSteps.value, step]
      }
    })
    if (controller.signal.aborted) return

    result.value = data
    workflowSummary.value = data.summary || ''
    topPicks.value = data.topPicks || []
    businessClosure.value = data.businessClosure || null

    if (enableBusinessClosure.value && !businessClosure.value) {
      await runClosureManually(true)
    }

    if (businessClosure.value) {
      data = {
        ...data,
        businessClosure: businessClosure.value
      }
      result.value = {
        ...data,
        businessSnapshot: {
          approvalCode: businessClosure.value.approvalCode,
          contractCode: businessClosure.value.contractCode,
          approvalStatus: businessClosure.value.approvalStatus,
          contractStatus: businessClosure.value.contractStatus,
          contractTitle: businessClosure.value.contractTitle,
          contractContent: businessClosure.value.contractContent,
          amount: businessClosure.value.amount,
          partyA: businessClosure.value.partyA,
          partyB: businessClosure.value.partyB,
          sealImages: businessClosure.value.sealImages,
          sealsApplied: businessClosure.value.sealsApplied,
          closureSteps: businessClosure.value.steps
        }
      }
    }

    const historyItem: GenerationResult = {
      keyword: data.keyword,
      categories: data.categories,
      timestamp: data.timestamp,
      summary: data.summary,
      topPicks: data.topPicks,
      businessSnapshot: businessClosure.value
        ? {
            approvalCode: businessClosure.value.approvalCode,
            contractCode: businessClosure.value.contractCode,
            approvalStatus: businessClosure.value.approvalStatus,
            contractStatus: businessClosure.value.contractStatus,
            contractTitle: businessClosure.value.contractTitle,
            contractContent: businessClosure.value.contractContent,
            amount: businessClosure.value.amount,
            partyA: businessClosure.value.partyA,
            partyB: businessClosure.value.partyB,
            sealImages: businessClosure.value.sealImages,
            sealsApplied: businessClosure.value.sealsApplied,
            closureSteps: businessClosure.value.steps
          }
        : undefined
    }
    saveToHistory(historyItem)
    history.value = getHistory()
    appendPlatformTrace({
      type: 'workflow',
      title: data.keyword,
      detail: `生成 ${getTotalProducts(data)} 个产品创意${data.businessClosure?.contractCode ? `，合同 ${data.businessClosure.contractCode}` : ''}`,
      status: 'success',
      durationMs: Date.now() - workflowRunStartedAt.value,
      sourcePath: `/ai/workflow/report?ts=${historyItem.timestamp}`,
      sessionId: workflowSessionId
    })
    ElMessage.success(
      `Multi-Agent 已生成 ${getTotalProducts(data)} 个产品创意${businessClosure.value ? `，电子合同 ${businessClosure.value.contractCode} 已签章` : ''}`
    )
    void router.push({
      path: '/ai/workflow/report',
      query: { ts: String(historyItem.timestamp) }
    })
  } catch (error) {
    if (controller.signal.aborted) return
    errorMsg.value = error instanceof Error ? error.message : '生成失败，请重试'
    appendPlatformTrace({
      type: 'workflow',
      title: keyword.value.trim(),
      detail: errorMsg.value,
      status: 'error',
      durationMs: Date.now() - workflowRunStartedAt.value,
      sourcePath: '/ai/workflow',
      sessionId: workflowSessionId
    })
    ElMessage.error(errorMsg.value)
  } finally {
    isLoading.value = false
    abortController.value = null
  }
}

const handleLoadHistory = (item: GenerationResult) => {
  void router.push({
    path: '/ai/workflow/report',
    query: { ts: String(item.timestamp) }
  })
}

const openReportPage = () => {
  if (!result.value) return
  void router.push({
    path: '/ai/workflow/report',
    query: { ts: String(result.value.timestamp) }
  })
}

const runClosureManually = async (silent = false) => {
  if (!keyword.value.trim()) return
  try {
    businessClosureSteps.value = []
    businessClosure.value = await runBusinessClosureFlow({
      keyword: keyword.value.trim(),
      summary: workflowSummary.value,
      onStep: (step) => {
        businessClosureSteps.value = [...businessClosureSteps.value, step]
      }
    })
    if (!silent) {
      ElMessage.success(
        `电子合同 ${businessClosure.value.contractCode} 已生成并签章`
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '商务闭环失败'
    if (!silent) ElMessage.error(message)
  }
}

const downloadContractPdf = () => {
  if (!businessClosure.value) return
  const c = businessClosure.value
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${c.contractTitle}</title></head><body style="font-family:sans-serif;padding:40px;max-width:720px;margin:0 auto"><h1>${c.contractTitle}</h1><p><strong>合同编号：</strong>${c.contractCode}</p><p><strong>审批编号：</strong>${c.approvalCode}</p><p><strong>金额：</strong>¥${c.amount}</p><p>${c.contractContent}</p><div style="display:flex;justify-content:space-between;margin-top:60px"><div style="text-align:center"><p>甲方：${c.partyA}</p><img src="${c.sealImages.partyA}" width="120" alt="甲方章"/></div><div style="text-align:center"><p>乙方：${c.partyB}</p><img src="${c.sealImages.partyB}" width="120" alt="乙方章"/></div></div></body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${c.contractCode}-电子合同.html`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('合同已下载')
}

const downloadSeal = (party: 'partyA' | 'partyB') => {
  if (!businessClosure.value) return
  const src = businessClosure.value.sealImages[party]
  const link = document.createElement('a')
  link.href = src
  link.download = `${businessClosure.value.contractCode}-${party}-seal.svg`
  link.click()
}

const handleClearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有历史记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    clearHistory()
    history.value = []
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消
  }
}

const getTotalProducts = (item: GenerationResult): number => {
  return item.categories.reduce((sum, cat) => sum + cat.products.length, 0)
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goToDetail = (product: ProductIdea) => {
  router.push({
    path: '/ai/workflow/detail',
    query: {
      product: encodeURIComponent(JSON.stringify(product)),
      keyword: keyword.value
    }
  })
}

const buildWorkflowExportText = (
  item: GenerationResult,
  summary: string,
  picks: string[] = []
) => {
  let text = `# ${item.keyword} 产品创意方案\n\n`
  if (summary) {
    text += `## Agent 评估摘要\n${summary}\n\n`
  }
  if (picks.length) {
    text += `## 推荐 TOP\n${picks.map((name) => `- ${name}`).join('\n')}\n\n`
  }
  if (item.businessSnapshot) {
    text += `## 电子合同\n`
    text += `- 审批：${item.businessSnapshot.approvalCode}（${item.businessSnapshot.approvalStatus}）\n`
    text += `- 合同：${item.businessSnapshot.contractCode}（${item.businessSnapshot.contractStatus}）\n`
    if (item.businessSnapshot.contractTitle) {
      text += `- 标题：${item.businessSnapshot.contractTitle}\n`
    }
    if (item.businessSnapshot.amount != null) {
      text += `- 金额：¥${item.businessSnapshot.amount}\n`
    }
    if (item.businessSnapshot.contractContent) {
      text += `\n${item.businessSnapshot.contractContent}\n`
    }
    if (item.businessSnapshot.sealsApplied?.length) {
      text += `\n电子章：${item.businessSnapshot.sealsApplied.join(' / ')}\n`
    }
    text += '\n'
  }

  for (const category of item.categories) {
    text += `## ${category.name}\n`
    for (const product of category.products) {
      text += `- ${product.name}（市场潜力：${product.marketPotential}）：${product.description}\n`
    }
    text += '\n'
  }

  return text.trim()
}

const copyWorkflowSummary = async () => {
  if (!result.value) return

  try {
    await navigator.clipboard.writeText(
      buildWorkflowExportText(
        result.value,
        workflowSummary.value,
        topPicks.value
      )
    )
    ElMessage.success('方案摘要已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择文本')
  }
}

const exportWorkflowMarkdown = () => {
  if (!result.value) return

  const blob = new Blob(
    [
      buildWorkflowExportText(
        result.value,
        workflowSummary.value,
        topPicks.value
      )
    ],
    { type: 'text/markdown;charset=utf-8' }
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flowagent-${result.value.keyword}-${result.value.timestamp}.md`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('Markdown 已导出')
}

const exportWorkflowJson = () => {
  if (!result.value) return

  const blob = new Blob([JSON.stringify(result.value, null, 2)], {
    type: 'application/json;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flowagent-${result.value.keyword}-${result.value.timestamp}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('JSON 已导出')
}

const continueWorkflowInChat = () => {
  if (!result.value) return
  void router.push({
    path: '/ai/chat',
    query: {
      send: '1',
      q: `请基于「${result.value.keyword}」工作流结果继续细化 MVP。${workflowSummary.value ? `摘要：${workflowSummary.value.slice(0, 120)}` : ''}`
    }
  })
}
</script>

<style lang="scss" scoped>
@use '@/style/ai-agent-page.scss';
@use '@/style/studio-workspace.scss';

.ai-workflow-page {
  background: transparent;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  :deep(.ai-agent-studio-head) {
    flex-shrink: 0;
  }
}

.workflow-workspace {
  align-content: start;
}

.ai-agent-config-banner {
  grid-column: 1 / -1;
  margin: 0;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid rgba(217, 119, 6, 0.2);
}

.workflow-model-panel {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.workflow-model-field {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;

  span {
    color: var(--app-text-faint);
    font-size: 11px;
    font-weight: 600;
  }
}

.workflow-model-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-muted);
  color: var(--app-text-main);
  font-size: 12px;
}

.workflow-model-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--app-text-sub);
  font-size: 12px;
  cursor: pointer;

  input {
    accent-color: var(--app-accent);
  }
}

.workflow-agent-models {
  display: grid;
  gap: 2px;
  margin-bottom: 8px;
}

.workflow-model-settings {
  margin-top: 0;
  width: 100%;
}

.ai-agent-pipeline-model {
  display: block;
  margin-top: 4px;
  color: var(--app-accent);
  font-size: 10px;
  font-weight: 600;
}

.side-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.side-stat {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);

  span {
    display: block;
    margin-bottom: 4px;
    color: var(--app-text-faint);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  strong {
    color: var(--app-text-main);
    font-size: 14px;

    &.ready {
      color: var(--app-success);
    }
  }
}

.workflow-side-panel {
  display: grid;
  gap: 8px;
}

.workflow-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  strong {
    font-size: 13px;
    color: var(--app-text-main);
  }

  span {
    font-size: 11px;
    color: var(--app-text-faint);
  }

  button {
    border: none;
    background: transparent;
    color: var(--app-text-faint);
    font-size: 11px;
    cursor: pointer;

    &:hover {
      color: var(--app-danger);
    }
  }
}

.workflow-history-item {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--app-accent-muted);
    background: var(--app-accent-soft);
  }
}

.workflow-history-keyword {
  display: block;
  margin-bottom: 4px;
  color: var(--app-text-main);
  font-size: 13px;
  font-weight: 600;
}

.workflow-history-meta {
  color: var(--app-text-faint);
  font-size: 11px;
}

.workflow-side-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 6px 10px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    background: var(--app-surface);
    color: var(--app-text-sub);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      border-color: var(--app-accent-muted);
      background: var(--app-accent-soft);
      color: var(--app-accent);
    }
  }
}

.workflow-side-link {
  margin-top: auto;
  padding: 10px 12px;
  border: 1px dashed var(--app-border-strong);
  border-radius: 10px;
  background: transparent;
  color: var(--app-text-sub);
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: var(--app-accent-muted);
    background: var(--app-accent-soft);
    color: var(--app-accent);
  }
}

.workflow-history-mobile {
  display: none;
}

@media (min-width: 961px) {
  .workflow-workspace-main .workflow-closure-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--app-border);
    background: var(--app-surface);
    color: var(--app-text-sub);
    font-size: 12px;
    cursor: pointer;

    input {
      accent-color: var(--app-accent);
    }
  }

  .ai-agent-tags {
    display: none;
  }
}

.business-closure-summary p {
  color: var(--app-success);
}

.closure-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.closure-step {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);

  &.error {
    border-color: #fecaca;
    color: #dc2626;
  }
}

.top-picks-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);

  strong {
    font-size: 13px;
    color: var(--app-text-main);
  }
}

.top-pick-chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  border: 1px solid var(--app-accent-muted);
}

.top-pick-badge {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  vertical-align: middle;
}

.workflow-trace-stack {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.workflow-result-trace {
  margin-top: 0;
}

.ai-agent-command-submit.is-stop {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.auto-run-hint {
  margin: 8px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid var(--app-accent-muted);
}

.closure-missing-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px dashed #f59e0b;
  background: #fffbeb;

  strong {
    color: #92400e;
  }

  span {
    font-size: 13px;
    color: #b45309;
    flex: 1;
  }
}

.product-card.clickable {
  border-radius: 16px;
  box-shadow: var(--app-shadow-sm);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--app-shadow);
    border-color: var(--app-accent-muted);
  }
}

.e-contract-panel {
  margin-bottom: 16px;
  padding: 18px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 16px;
  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(37, 99, 235, 0.06),
      transparent 45%
    ),
    linear-gradient(180deg, #f8fafc 0%, var(--app-surface) 100%);
  box-shadow: var(--app-shadow-sm);
}

.e-contract-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  strong {
    font-size: 16px;
    color: var(--app-text-main);
  }

  span {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
}

.e-contract-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;

  span {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);
    color: var(--app-text-sub);
  }
}

.e-contract-body {
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: #fff;

  h3 {
    margin: 0 0 10px;
    font-size: 18px;
    color: var(--app-text-main);
  }

  p {
    margin: 0;
    line-height: 1.7;
    font-size: 14px;
    color: var(--app-text-sub);
    white-space: pre-wrap;
  }
}

.e-contract-signatures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed var(--app-border);
}

.seal-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  span {
    font-size: 13px;
    color: var(--app-text-main);
    font-weight: 600;
  }

  img {
    width: 110px;
    height: 110px;
    object-fit: contain;
  }

  small {
    font-size: 11px;
    color: var(--app-text-faint);
  }
}

.e-contract-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.skeleton-section {
  margin-bottom: 24px;
}

.results-section,
.history-section,
.empty-section {
  margin-bottom: 28px;
}

.results-head-copy {
  min-width: 0;

  h2 {
    margin: 0 0 6px;
  }
}

.results-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.ai-agent-results-head {
  align-items: flex-start;
}

.category-block {
  margin-bottom: 28px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.category-icon {
  font-size: 24px;
}

.category-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--app-text-main);
}

.category-count {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  font-size: 11px;
  color: var(--app-text-sub);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.product-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: var(--app-accent-muted);
    background: var(--app-surface);
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-sm);
  }
}

.product-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  font-size: 26px;
  border-radius: 12px;
  background: var(--app-accent-soft);
  flex-shrink: 0;
}

.product-name {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text-main);
}

.product-desc {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--app-text-sub);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.potential-tag {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;

  &.high {
    background: rgba(22, 163, 74, 0.1);
    color: var(--app-success);
  }

  &.medium {
    background: rgba(217, 119, 6, 0.1);
    color: var(--app-warning);
  }

  &.low {
    background: var(--app-surface-muted);
    color: var(--app-text-sub);
  }
}

.section-header,
.clear-btn,
.history-list,
.history-item {
  display: none;
}

.ai-agent-keyword {
  padding: 2px 10px;
  font-size: 14px;
  font-weight: 700;
  background: var(--app-surface-muted);
  color: var(--app-text-main);
  border: 1px solid var(--app-border);
}

.empty-section {
  text-align: center;
  padding: 56px 20px;
  border-radius: var(--app-radius-xl);
  border: 1px dashed var(--app-border);
  background: linear-gradient(
    180deg,
    var(--app-surface) 0%,
    var(--app-surface-muted) 100%
  );

  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 700;
    color: var(--app-text-main);
  }

  p {
    margin: 0 0 20px;
    color: var(--app-text-sub);
    font-size: 14px;
  }
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.example-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.example-tag {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-sub);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: var(--app-accent);
    background: var(--app-accent);
    color: #fff;
  }
}

@media (max-width: 1100px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .ai-workflow-page .workflow-workspace {
    grid-template-columns: 1fr;
  }

  .ai-workflow-page .workflow-workspace-side {
    display: none;
  }

  .ai-workflow-page .workflow-history-mobile {
    display: block;
  }
}
</style>
