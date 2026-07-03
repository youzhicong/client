<template>
  <div class="product-detail-page ai-agent-shell">
    <AgentStudioHeader
      title="产品详情"
      description="Agent 生成的完整产品方案与评估报告"
      active="workflow"
      compact
    >
      <template #actions>
        <button
          v-if="detail"
          class="ai-agent-btn-primary"
          type="button"
          @click="continueInChat"
        >
          在 Agent 聊天中继续
        </button>
        <button class="ai-agent-btn-ghost" type="button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回工作流
        </button>
      </template>
    </AgentStudioHeader>

    <div class="detail-workspace">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-section">
        <div class="loading-card">
          <div class="loading-header">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-line w-60"></div>
              <div class="skeleton-line w-40"></div>
            </div>
          </div>
          <div class="skeleton-body">
            <div class="skeleton-line w-full"></div>
            <div class="skeleton-line w-90"></div>
            <div class="skeleton-line w-80"></div>
          </div>
        </div>
      </div>

      <!-- Detail Content -->
      <div v-else-if="detail" class="detail-content">
        <!-- Hero Section -->
        <div class="detail-hero">
          <div class="hero-icon">{{ detail.icon }}</div>
          <div class="hero-info">
            <span class="hero-kicker">产品简报</span>
            <h1>{{ detail.name }}</h1>
            <p class="hero-desc">{{ detail.description }}</p>
            <div class="hero-tags">
              <span class="tag category">{{ detail.category }}</span>
              <span
                class="tag potential"
                :class="{
                  high: detail.marketPotential === '高',
                  medium: detail.marketPotential === '中',
                  low: detail.marketPotential === '低'
                }"
              >
                市场潜力: {{ detail.marketPotential }}
              </span>
            </div>
          </div>
        </div>

        <!-- Overview Section -->
        <div class="info-section">
          <div class="section-header">
            <span class="section-icon">📋</span>
            <h2>产品概述</h2>
          </div>
          <p class="overview-text">{{ detail.overview }}</p>
        </div>

        <!-- Grid Sections -->
        <div class="info-grid">
          <!-- Target Audience -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">👥</span>
              <h3>目标客户</h3>
            </div>
            <ul class="tag-list">
              <li v-for="(item, i) in detail.targetAudience" :key="i">
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Key Features -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">✨</span>
              <h3>核心卖点</h3>
            </div>
            <ul class="tag-list highlight">
              <li v-for="(item, i) in detail.keyFeatures" :key="i">
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Competitive Advantage -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">🏆</span>
              <h3>竞争优势</h3>
            </div>
            <ul class="tag-list success">
              <li v-for="(item, i) in detail.competitiveAdvantage" :key="i">
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Risks -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-icon">⚠️</span>
              <h3>潜在风险</h3>
            </div>
            <ul class="tag-list warning">
              <li v-for="(item, i) in detail.risks" :key="i">
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Production Process -->
        <div class="info-section">
          <div class="section-header">
            <span class="section-icon">🏭</span>
            <h2>生产流程</h2>
          </div>
          <p class="process-text">{{ detail.productionProcess }}</p>
        </div>

        <!-- Cost & Pricing -->
        <div class="cost-grid">
          <div class="cost-card">
            <div class="cost-header">
              <span class="cost-icon">💰</span>
              <h3>预估成本</h3>
            </div>
            <p class="cost-value">{{ detail.estimatedCost }}</p>
          </div>

          <div class="cost-card">
            <div class="cost-header">
              <span class="cost-icon">📊</span>
              <h3>定价策略</h3>
            </div>
            <p class="cost-value">{{ detail.pricingStrategy }}</p>
          </div>
        </div>

        <!-- Market Analysis -->
        <div class="info-section">
          <div class="section-header">
            <span class="section-icon">📈</span>
            <h2>市场分析</h2>
          </div>
          <p class="analysis-text">{{ detail.marketAnalysis }}</p>
        </div>

        <!-- Recommendations -->
        <div class="info-section recommendations">
          <div class="section-header">
            <span class="section-icon">💡</span>
            <h2>发展建议</h2>
          </div>
          <ul class="recommendation-list">
            <li v-for="(item, i) in detail.recommendations" :key="i">
              <span class="rec-num">{{ i + 1 }}</span>
              <span class="rec-text">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="error-section">
        <div class="error-icon">😕</div>
        <h3>无法加载产品详情</h3>
        <p>{{ errorMsg || '请返回列表重试' }}</p>
        <button class="ai-agent-btn-primary" type="button" @click="goBack">
          返回工作流
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import AgentStudioHeader from '@/components/agent/AgentStudioHeader.vue'
import {
  generateProductDetail,
  type ProductIdea,
  type ProductDetail
} from '@/services/ai'

defineOptions({
  name: 'AiWorkflowDetailPage'
})

const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const errorMsg = ref('')
const detail = ref<ProductDetail | null>(null)

onMounted(async () => {
  const productData = route.query.product as string
  const keyword = route.query.keyword as string

  if (!productData || !keyword) {
    errorMsg.value = '缺少产品信息'
    isLoading.value = false
    return
  }

  try {
    const product: ProductIdea = JSON.parse(decodeURIComponent(productData))
    detail.value = await generateProductDetail(product, keyword)
  } catch (error) {
    errorMsg.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    isLoading.value = false
  }
})

const goBack = () => {
  router.push('/ai/workflow')
}

const continueInChat = () => {
  if (!detail.value) return
  void router.push({
    path: '/ai/chat',
    query: {
      q: `请基于产品「${detail.value.name}」继续完善 MVP 与落地路径。概述：${detail.value.description}`
    }
  })
}
</script>

<style lang="scss" scoped>
@use '@/style/ai-agent-page.scss';

.product-detail-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: none;
  margin: 0;

  :deep(.ai-agent-studio-head) {
    flex-shrink: 0;
  }
}

.detail-workspace {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface);
  padding: 16px 18px 20px;
}

.loading-section {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  padding: 32px;
  box-shadow: var(--app-shadow-sm);
}

.loading-header {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.skeleton-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--app-radius-lg);
  background: var(--app-surface-muted);
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  border-radius: 4px;
  background: var(--app-surface-muted);

  &.w-40 {
    width: 40%;
  }
  &.w-60 {
    width: 60%;
  }
  &.w-80 {
    width: 80%;
  }
  &.w-90 {
    width: 90%;
  }
  &.w-full {
    width: 100%;
  }
}

.detail-content {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-hero {
  display: flex;
  gap: 24px;
  padding: 24px 28px;
  background:
    radial-gradient(circle at 92% 8%, rgba(37, 99, 235, 0.1), transparent 40%),
    linear-gradient(
      135deg,
      var(--app-accent-soft) 0%,
      var(--app-surface) 58%,
      var(--app-surface-muted) 100%
    );
  border: 1px solid var(--app-accent-muted);
  border-radius: var(--app-radius-xl);
  margin-bottom: 16px;
  box-shadow: var(--app-shadow-sm);
}

.hero-icon {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  font-size: 44px;
  background: var(--app-accent-soft);
  border: 1px solid var(--app-accent-muted);
  border-radius: var(--app-radius-lg);
  flex-shrink: 0;
}

.hero-info {
  flex: 1;

  .hero-kicker {
    display: inline-block;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--app-accent);
  }

  h1 {
    margin: 0 0 10px;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--app-text-main);
  }
}

.hero-desc {
  margin: 0 0 16px;
  font-size: 15px;
  color: var(--app-text-sub);
  line-height: 1.6;
}

.hero-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tag {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.category {
    background: var(--app-accent-soft);
    border: 1px solid var(--app-accent-muted);
    color: var(--app-accent);
  }

  &.potential {
    &.high {
      background: rgba(22, 163, 74, 0.08);
      border: 1px solid rgba(22, 163, 74, 0.14);
      color: var(--app-success);
    }
    &.medium {
      background: rgba(217, 119, 6, 0.08);
      border: 1px solid rgba(217, 119, 6, 0.14);
      color: var(--app-warning);
    }
    &.low {
      background: var(--app-surface-muted);
      border: 1px solid var(--app-border);
      color: var(--app-text-sub);
    }
  }
}

.info-section {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  padding: 24px;
  margin-bottom: 12px;
  box-shadow: var(--app-shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--app-text-main);
  }
}

.section-icon {
  font-size: 20px;
}

.overview-text,
.process-text,
.analysis-text {
  margin: 0;
  font-size: 15px;
  color: var(--app-text-sub);
  line-height: 1.8;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.info-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  padding: 20px;
  box-shadow: var(--app-shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--app-text-main);
  }
}

.card-icon {
  font-size: 18px;
}

.tag-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  li {
    padding: 6px 12px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-sm);
    font-size: 13px;
    color: var(--app-text-sub);
  }

  &.highlight li {
    background: var(--app-accent-soft);
    border-color: var(--app-accent-muted);
    color: var(--app-accent);
  }

  &.success li {
    background: rgba(22, 163, 74, 0.08);
    border-color: rgba(22, 163, 74, 0.14);
    color: var(--app-success);
  }

  &.warning li {
    background: rgba(217, 119, 6, 0.08);
    border-color: rgba(217, 119, 6, 0.14);
    color: var(--app-warning);
  }
}

.cost-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.cost-card {
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  padding: 24px;
}

.cost-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--app-text-sub);
  }
}

.cost-icon {
  font-size: 20px;
}

.cost-value {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--app-text-main);
  line-height: 1.6;
}

.recommendations {
  background: rgba(22, 163, 74, 0.06);
  border-color: rgba(22, 163, 74, 0.14);
}

.recommendation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
}

.rec-num {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: var(--app-success);
  color: #fff;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.rec-text {
  font-size: 14px;
  color: var(--app-text-sub);
  line-height: 1.6;
  padding-top: 4px;
}

.error-section {
  text-align: center;
  padding: 80px 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-section h3 {
  margin: 0 0 12px;
  font-size: 20px;
  color: var(--app-text-main);
}

.error-section p {
  margin: 0 0 24px;
  color: var(--app-text-sub);
}

@media (max-width: 768px) {
  .detail-hero {
    flex-direction: column;
    text-align: center;
  }

  .hero-icon {
    margin: 0 auto;
  }

  .hero-tags {
    justify-content: center;
  }

  .info-grid,
  .cost-grid {
    grid-template-columns: 1fr;
  }
}
</style>
