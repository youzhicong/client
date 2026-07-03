<template>
  <div class="workflow-report-page ai-agent-shell">
    <AgentStudioHeader title="" description="" active="workflow" compact>
      <template #actions>
        <button
          v-if="report && !isShareMode"
          class="ai-agent-btn-ghost"
          type="button"
          @click="copyShareLink"
        >
          复制分享链接
        </button>
        <button
          v-if="report"
          class="ai-agent-btn-ghost"
          type="button"
          @click="exportHtml"
        >
          导出 HTML 报告
        </button>
        <button
          v-if="report"
          class="ai-agent-btn-ghost"
          type="button"
          @click="exportMarkdown"
        >
          导出 Markdown
        </button>
        <button
          v-if="report && !isShareMode"
          class="ai-agent-btn-primary"
          type="button"
          @click="continueInChat"
        >
          Agent 聊天继续
        </button>
        <button
          v-if="!isShareMode"
          class="ai-agent-btn-ghost"
          type="button"
          @click="goWorkflow"
        >
          返回工作流
        </button>
      </template>
    </AgentStudioHeader>

    <div v-if="!report && !loading" class="report-empty">
      <p>未找到报告，请从工作流页重新运行或从历史记录打开</p>
      <button type="button" class="ai-agent-btn-primary" @click="goWorkflow">
        去运行工作流
      </button>
    </div>

    <div v-else-if="loading" class="report-loading">加载报告中…</div>

    <div v-else-if="report" class="report-body">
      <div v-if="isShareMode" class="share-banner">
        只读分享视图 · 由 FlowAgent 工作流生成
      </div>
      <header class="report-hero">
        <div class="report-hero-main">
          <span class="report-kicker">FlowAgent 工作流产出</span>
          <h1>
            <span class="report-keyword">{{ report.keyword }}</span>
            产品创意矩阵
          </h1>
          <p class="report-subtitle">
            {{ report.summary || 'AI 已完成市场研究、创意生成与评估优化。' }}
          </p>
        </div>
        <div class="report-stats">
          <div class="report-stat">
            <strong>{{ productCount }}</strong>
            <span>产品创意</span>
          </div>
          <div class="report-stat">
            <strong>{{ report.categories.length }}</strong>
            <span>品类分组</span>
          </div>
          <div class="report-stat">
            <strong>{{ report.topPicks?.length || 0 }}</strong>
            <span>推荐 TOP</span>
          </div>
          <div class="report-stat" :class="{ ok: report.businessSnapshot }">
            <strong>{{ report.businessSnapshot ? '已签章' : '—' }}</strong>
            <span>商务闭环</span>
          </div>
        </div>
        <time class="report-time"
          >生成于 {{ formatTime(report.timestamp) }}</time
        >
      </header>

      <section class="report-section">
        <h2>Multi-Agent 流水线</h2>
        <div class="report-pipeline">
          <div
            v-for="(agent, index) in pipelineAgents"
            :key="agent.id"
            class="report-pipeline-node done"
          >
            <div class="node-icon">{{ agent.icon }}</div>
            <div class="node-copy">
              <strong>{{ agent.name }}</strong>
              <span>{{ agent.desc }}</span>
            </div>
            <div
              v-if="index < pipelineAgents.length - 1"
              class="node-connector"
            />
          </div>
        </div>
      </section>

      <section v-if="report.topPicks?.length" class="report-section">
        <h2>Agent 推荐 TOP</h2>
        <div class="report-top-grid">
          <article
            v-for="(name, index) in report.topPicks"
            :key="name"
            class="top-card"
            @click="openProduct(findProduct(name))"
          >
            <span class="top-rank">#{{ index + 1 }}</span>
            <strong>{{ name }}</strong>
            <p>{{ findProduct(name)?.description }}</p>
            <span
              v-if="findProduct(name)"
              class="potential"
              :class="potentialClass(findProduct(name)!.marketPotential)"
            >
              市场潜力 {{ findProduct(name)!.marketPotential }}
            </span>
          </article>
        </div>
      </section>

      <section class="report-section">
        <h2>产品创意矩阵</h2>
        <div
          v-for="category in report.categories"
          :key="category.name"
          class="matrix-category"
        >
          <div class="matrix-category-head">
            <span class="matrix-icon">{{ category.icon }}</span>
            <strong>{{ category.name }}</strong>
            <span>{{ category.products.length }} 个创意</span>
          </div>
          <div class="matrix-grid">
            <article
              v-for="product in category.products"
              :key="product.name"
              class="matrix-card"
              :class="{ featured: isTopPick(product.name) }"
              @click="openProduct(product)"
            >
              <div class="matrix-card-head">
                <span class="product-icon">{{ product.icon }}</span>
                <strong>{{ product.name }}</strong>
                <span v-if="isTopPick(product.name)" class="top-badge"
                  >TOP</span
                >
              </div>
              <p>{{ product.description }}</p>
              <footer>
                <span
                  class="potential"
                  :class="potentialClass(product.marketPotential)"
                >
                  {{ product.marketPotential }}
                </span>
                <span class="view-detail">查看详情 →</span>
              </footer>
            </article>
          </div>
        </div>
      </section>

      <section v-if="closureSteps.length" class="report-section">
        <h2>商务闭环</h2>
        <BusinessClosureTrace :steps="closureSteps" :closure="closureResult" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AgentStudioHeader from '@/components/agent/AgentStudioHeader.vue'
import BusinessClosureTrace from '@/components/agent/BusinessClosureTrace.vue'
import { createElectronicSealData } from '@/services/ai-automation/e-seal'
import type {
  BusinessClosureResult,
  BusinessClosureStep
} from '@/services/ai-automation/business-flow'
import {
  countWorkflowProducts,
  getHistoryItemByTimestamp,
  type GenerationResult,
  type ProductIdea
} from '@/services/ai'

defineOptions({ name: 'AiWorkflowReportPage' })

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const report = ref<GenerationResult | null>(null)

const isShareMode = computed(() => route.query.share === '1')

const pipelineAgents = [
  { id: 'research', icon: '🔍', name: '市场研究', desc: '行业 · 渠道 · 竞品' },
  { id: 'ideation', icon: '💡', name: '创意生成', desc: '产品矩阵 brainstorm' },
  { id: 'evaluation', icon: '📊', name: '评估优化', desc: '打分 · TOP 推荐' },
  { id: 'compliance', icon: '📋', name: '商务闭环', desc: '审批 · 合同 · 签章' }
]

const productCount = computed(() =>
  report.value ? countWorkflowProducts(report.value) : 0
)

const closureSteps = computed(
  () =>
    (report.value?.businessSnapshot?.closureSteps ||
      []) as BusinessClosureStep[]
)

const closureResult = computed<BusinessClosureResult | null>(() => {
  const snap = report.value?.businessSnapshot
  if (!snap || !report.value) return null
  return {
    keyword: report.value.keyword,
    approvalId: 0,
    contractId: 0,
    approvalCode: snap.approvalCode,
    approvalStatus: snap.approvalStatus,
    contractCode: snap.contractCode,
    contractStatus: snap.contractStatus,
    contractTitle: snap.contractTitle || `${report.value.keyword} 合作框架协议`,
    contractContent: snap.contractContent || report.value.summary || '',
    amount: snap.amount ?? 50000,
    partyA: snap.partyA || 'FlowAgent',
    partyB: snap.partyB || '战略合作方',
    sealImages: snap.sealImages || {
      partyA: createElectronicSealData('FlowAgent', 'partyA'),
      partyB: createElectronicSealData('战略合作方', 'partyB')
    },
    sealsApplied: snap.sealsApplied,
    steps: (snap.closureSteps || []) as BusinessClosureStep[],
    completedAt: report.value.timestamp
  }
})

const loadReport = () => {
  loading.value = true
  const ts = Number(route.query.ts)
  if (!Number.isFinite(ts)) {
    report.value = null
    loading.value = false
    return
  }
  report.value = getHistoryItemByTimestamp(ts) || null
  loading.value = false
}

const findProduct = (name: string): ProductIdea | undefined => {
  if (!report.value) return undefined
  for (const category of report.value.categories) {
    const hit = category.products.find((item) => item.name === name)
    if (hit) return hit
  }
  return undefined
}

const isTopPick = (name: string) => report.value?.topPicks?.includes(name)

const potentialClass = (value: string) => {
  if (value === '高') return 'high'
  if (value === '中') return 'medium'
  return 'low'
}

const formatTime = (value: number) =>
  new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

const openProduct = (product?: ProductIdea) => {
  if (!product || !report.value) return
  void router.push({
    path: '/ai/workflow/detail',
    query: {
      keyword: report.value.keyword,
      product: encodeURIComponent(JSON.stringify(product))
    }
  })
}

const goWorkflow = () => {
  void router.push('/ai/workflow')
}

const copyShareLink = async () => {
  const ts = route.query.ts
  if (typeof ts !== 'string' && typeof ts !== 'number') {
    ElMessage.warning('当前报告无法生成分享链接')
    return
  }
  const url = `${window.location.origin}/ai/workflow/report?ts=${ts}&share=1`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('分享链接已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制地址栏链接并追加 &share=1')
  }
}

const continueInChat = () => {
  if (!report.value) return
  void router.push({
    path: '/ai/chat',
    query: {
      send: '1',
      q: `请基于「${report.value.keyword}」工作流可视化报告继续细化 MVP。${report.value.summary ? `摘要：${report.value.summary.slice(0, 120)}` : ''}`
    }
  })
}

const exportMarkdown = async () => {
  if (!report.value) return
  let text = `# ${report.value.keyword} 工作流报告\n\n`
  if (report.value.summary) text += `## 评估摘要\n${report.value.summary}\n\n`
  if (report.value.topPicks?.length) {
    text += `## TOP 推荐\n${report.value.topPicks.map((n) => `- ${n}`).join('\n')}\n\n`
  }
  for (const category of report.value.categories) {
    text += `## ${category.name}\n`
    for (const product of category.products) {
      text += `- **${product.name}**（${product.marketPotential}）：${product.description}\n`
    }
    text += '\n'
  }
  const blob = new Blob([text.trim()], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flowagent-report-${report.value.keyword}-${report.value.timestamp}.md`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报告已导出')
}

const exportHtml = () => {
  if (!report.value) return
  const r = report.value
  let body = ''
  if (r.summary)
    body += `<section><h2>评估摘要</h2><p>${r.summary}</p></section>`
  if (r.topPicks?.length) {
    body += `<section><h2>TOP 推荐</h2><ul>${r.topPicks.map((n) => `<li>${n}</li>`).join('')}</ul></section>`
  }
  for (const category of r.categories) {
    body += `<section><h2>${category.icon} ${category.name}</h2><div class="grid">`
    for (const product of category.products) {
      body += `<article><h3>${product.icon} ${product.name}</h3><p>${product.description}</p><small>市场潜力：${product.marketPotential}</small></article>`
    }
    body += '</div></section>'
  }
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${r.keyword} 工作流报告</title><style>body{font-family:sans-serif;max-width:960px;margin:0 auto;padding:40px;color:#111}h1{color:#2563eb}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}article{border:1px solid #e5e7eb;border-radius:12px;padding:12px}section{margin-bottom:24px}</style></head><body><h1>${r.keyword} 产品创意报告</h1><p>生成于 ${formatTime(r.timestamp)} · ${productCount.value} 个创意</p>${body}</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flowagent-report-${r.keyword}-${r.timestamp}.html`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('HTML 报告已下载')
}

onMounted(loadReport)
</script>

<style lang="scss" scoped>
@use '@/style/ai-agent-page.scss';

.workflow-report-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.report-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 2px 24px;
}

.share-banner {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--app-accent-muted);
  background: var(--app-accent-soft);
  font-size: 13px;
  color: var(--app-accent);
}

.report-empty,
.report-loading {
  padding: 48px 24px;
  text-align: center;
  color: var(--app-text-sub);
}

.report-hero {
  position: relative;
  padding: 26px 28px;
  margin-bottom: 22px;
  border-radius: 18px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(8, 145, 178, 0.12),
      transparent 42%
    ),
    linear-gradient(135deg, #eff6ff 0%, var(--app-surface) 52%, #ecfdf5 100%);
  box-shadow: var(--app-shadow-sm);
}

.report-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-accent);
}

.report-hero h1 {
  margin: 8px 0 10px;
  font-size: clamp(22px, 3vw, 32px);
  color: var(--app-text-main);
}

.report-keyword {
  color: var(--app-accent);
}

.report-subtitle {
  margin: 0;
  max-width: 720px;
  line-height: 1.7;
  font-size: 14px;
  color: var(--app-text-sub);
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.report-stat {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  strong {
    display: block;
    font-size: 20px;
    color: var(--app-text-main);
  }
  span {
    font-size: 11px;
    color: var(--app-text-faint);
  }
  &.ok strong {
    color: #059669;
  }
}

.report-time {
  display: block;
  margin-top: 14px;
  font-size: 12px;
  color: var(--app-text-faint);
}

.report-section {
  margin-bottom: 24px;
  h2 {
    margin: 0 0 14px;
    font-size: 16px;
    color: var(--app-text-main);
  }
}

.report-pipeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.report-pipeline-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 10px;
  border-radius: 14px;
  border: 1px solid rgba(22, 163, 74, 0.18);
  background: rgba(22, 163, 74, 0.06);

  .node-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  strong {
    display: block;
    font-size: 13px;
    color: var(--app-text-main);
  }
  span {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: var(--app-text-sub);
  }
}

.report-top-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.top-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--app-accent-muted);
  background: var(--app-accent-soft);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow);
  }
  .top-rank {
    font-size: 11px;
    font-weight: 800;
    color: var(--app-accent);
  }
  strong {
    display: block;
    margin: 6px 0;
    font-size: 15px;
    color: var(--app-text-main);
  }
  p {
    margin: 0 0 10px;
    font-size: 12px;
    line-height: 1.55;
    color: var(--app-text-sub);
  }
}

.matrix-category {
  margin-bottom: 18px;
}

.matrix-category-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  .matrix-icon {
    font-size: 18px;
  }
  strong {
    font-size: 15px;
    color: var(--app-text-main);
  }
  span:last-child {
    margin-left: auto;
    font-size: 11px;
    color: var(--app-text-faint);
  }
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.matrix-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  &:hover {
    border-color: var(--app-accent-muted);
    box-shadow: var(--app-shadow-sm);
  }
  &.featured {
    border-color: var(--app-accent-muted);
    background: linear-gradient(
      180deg,
      var(--app-accent-soft) 0%,
      var(--app-surface) 100%
    );
  }
  p {
    margin: 8px 0 12px;
    font-size: 12px;
    line-height: 1.55;
    color: var(--app-text-sub);
  }
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .view-detail {
    font-size: 11px;
    color: var(--app-accent);
  }
}

.matrix-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  .product-icon {
    font-size: 18px;
  }
  strong {
    flex: 1;
    font-size: 14px;
    color: var(--app-text-main);
  }
}

.top-badge {
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: var(--app-accent);
  color: #fff;
}

.potential {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  &.high {
    background: #ecfdf5;
    color: #059669;
  }
  &.medium {
    background: #fffbeb;
    color: #d97706;
  }
  &.low {
    background: var(--app-surface-muted);
    color: var(--app-text-faint);
  }
}

@media (max-width: 960px) {
  .report-stats,
  .report-pipeline,
  .report-top-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .report-stats,
  .report-pipeline,
  .report-top-grid {
    grid-template-columns: 1fr;
  }
}

:global(html.dark) {
  .report-hero {
    border-color: var(--app-border);
    background:
      radial-gradient(
        circle at 90% 10%,
        rgba(59, 130, 246, 0.12),
        transparent 42%
      ),
      linear-gradient(
        135deg,
        rgba(37, 99, 235, 0.1) 0%,
        var(--app-surface) 52%,
        rgba(16, 185, 129, 0.08) 100%
      );
  }

  .report-pipeline-node {
    border-color: rgba(16, 185, 129, 0.28);
    background: rgba(16, 185, 129, 0.08);
  }

  .potential.high {
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
  }

  .potential.medium {
    background: rgba(217, 119, 6, 0.12);
    color: #fbbf24;
  }
}
</style>
