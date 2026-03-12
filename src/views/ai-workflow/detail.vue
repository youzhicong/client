<template>
  <div class="product-detail-page">
    <!-- Back Button -->
    <div class="back-bar">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </button>
    </div>

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
      <button class="retry-btn" @click="goBack">返回列表</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  generateProductDetail,
  type ProductIdea,
  type ProductDetail
} from '@/services/ai'

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
  router.back()
}
</script>

<style lang="scss" scoped>
.product-detail-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
  max-width: 1000px;
  margin: 0 auto;
}

/* Back Bar */
.back-bar {
  margin-bottom: 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    transform: translateX(-4px);
  }
}

/* Loading */
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
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.loading-header {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.skeleton-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #e2e8f0;
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
  background: #e2e8f0;

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

/* Detail Content */
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

/* Hero Section */
.detail-hero {
  display: flex;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #1e0a38 0%, #0f172a 50%, #1e3a5f 100%);
  border-radius: 24px;
  margin-bottom: 24px;
  color: #fff;
}

.hero-icon {
  width: 100px;
  height: 100px;
  display: grid;
  place-items: center;
  font-size: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  flex-shrink: 0;
}

.hero-info {
  flex: 1;

  h1 {
    margin: 0 0 12px;
    font-size: 28px;
    font-weight: 700;
  }
}

.hero-desc {
  margin: 0 0 16px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.hero-tags {
  display: flex;
  gap: 12px;
}

.tag {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.category {
    background: rgba(139, 92, 246, 0.3);
    color: #c4b5fd;
  }

  &.potential {
    &.high {
      background: rgba(34, 197, 94, 0.3);
      color: #86efac;
    }
    &.medium {
      background: rgba(245, 158, 11, 0.3);
      color: #fcd34d;
    }
    &.low {
      background: rgba(100, 116, 139, 0.3);
      color: #cbd5e1;
    }
  }
}

/* Info Sections */
.info-section {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
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
    color: #1e293b;
  }
}

.section-icon {
  font-size: 24px;
}

.overview-text,
.process-text,
.analysis-text {
  margin: 0;
  font-size: 15px;
  color: #475569;
  line-height: 1.8;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.info-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
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
    color: #1e293b;
  }
}

.card-icon {
  font-size: 20px;
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
    background: #f1f5f9;
    border-radius: 8px;
    font-size: 13px;
    color: #475569;
  }

  &.highlight li {
    background: #eef2ff;
    color: #6366f1;
  }

  &.success li {
    background: #ecfdf5;
    color: #16a34a;
  }

  &.warning li {
    background: #fef3c7;
    color: #d97706;
  }
}

/* Cost Grid */
.cost-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.cost-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 18px;
  padding: 24px;
  border: 1px solid #e2e8f0;
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
    color: #64748b;
  }
}

.cost-icon {
  font-size: 20px;
}

.cost-value {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.6;
}

/* Recommendations */
.recommendations {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
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
  background: #16a34a;
  color: #fff;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.rec-text {
  font-size: 14px;
  color: #166534;
  line-height: 1.6;
  padding-top: 4px;
}

/* Error State */
.error-section {
  text-align: center;
  padding: 80px 20px;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-section h3 {
  margin: 0 0 12px;
  font-size: 20px;
  color: #1e293b;
}

.error-section p {
  margin: 0 0 24px;
  color: #64748b;
}

.retry-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
  }
}

/* Responsive */
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
