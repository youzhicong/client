<template>
  <div class="ai-workflow-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="hero-pattern"></div>
        <div class="hero-glow"></div>
      </div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            AI 产品创意生成器
          </div>
          <h1 class="hero-title">
            输入关键词，生成产品创意 <span class="sparkle">✨</span>
          </h1>
          <p class="hero-desc">
            基于 GPT 智能分析，为您生成全系列产品创意和商业建议
          </p>
        </div>
        <button class="settings-btn" @click="goToSettings">⚙️ API 设置</button>
      </div>
    </section>

    <!-- Input Section -->
    <section class="input-section">
      <div class="input-card">
        <div class="input-wrapper">
          <el-icon class="input-prefix"><MagicStick /></el-icon>
          <input
            v-model="keyword"
            type="text"
            class="keyword-input"
            placeholder="输入关键词，如：养鸡、咖啡、蜂蜜..."
            @keyup.enter="handleGenerate"
          />
          <button
            class="generate-btn"
            :class="{ loading: isLoading }"
            :disabled="isLoading || !keyword.trim()"
            @click="handleGenerate"
          >
            <span v-if="!isLoading">
              <el-icon><Promotion /></el-icon>
              生成创意
            </span>
            <span v-else class="loading-text">
              <el-icon class="spin"><Loading /></el-icon>
              生成中...
            </span>
          </button>
        </div>
        <div v-if="errorMsg" class="error-msg">
          <el-icon><Warning /></el-icon>
          {{ errorMsg }}
        </div>
      </div>
    </section>

    <!-- Loading Skeleton -->
    <section v-if="isLoading" class="skeleton-section">
      <div class="skeleton-header">
        <div class="skeleton-line w-40"></div>
      </div>
      <div class="skeleton-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-icon"></div>
          <div class="skeleton-content">
            <div class="skeleton-line w-60"></div>
            <div class="skeleton-line w-full"></div>
            <div class="skeleton-line w-80"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Results Section -->
    <section v-else-if="result" class="results-section">
      <div class="results-header">
        <h2>
          <span class="keyword-tag">{{ result.keyword }}</span>
          产品创意方案
        </h2>
        <span class="result-time"
          >生成于 {{ formatTime(result.timestamp) }}</span
        >
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
              <h3 class="product-name">{{ product.name }}</h3>
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
    </section>

    <!-- History Section -->
    <section v-if="history.length > 0" class="history-section">
      <div class="section-header">
        <h3>历史记录</h3>
        <button class="clear-btn" @click="handleClearHistory">清空历史</button>
      </div>
      <div class="history-list">
        <div
          v-for="(item, idx) in history"
          :key="item.timestamp"
          class="history-item"
          :style="{ '--delay': idx * 0.05 + 's' }"
          @click="handleLoadHistory(item)"
        >
          <span class="history-keyword">{{ item.keyword }}</span>
          <span class="history-count">{{ getTotalProducts(item) }} 个产品</span>
          <span class="history-time">{{ formatTime(item.timestamp) }}</span>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <section
      v-if="!isLoading && !result && history.length === 0"
      class="empty-section"
    >
      <div class="empty-icon">🚀</div>
      <h3>开始您的产品创意之旅</h3>
      <p>输入任意关键词，AI 将为您生成全方位的产品创意建议</p>
      <div class="example-tags">
        <span
          v-for="example in examples"
          :key="example"
          class="example-tag"
          @click="keyword = example"
        >
          {{ example }}
        </span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick,
  Promotion,
  Loading,
  Warning
} from '@element-plus/icons-vue'
import {
  generateProductIdeas,
  getHistory,
  saveToHistory,
  clearHistory,
  type GenerationResult,
  type ProductIdea
} from '@/services/ai'

const router = useRouter()

const keyword = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const result = ref<GenerationResult | null>(null)
const history = ref<GenerationResult[]>([])

const examples = ['养鸡', '咖啡', '蜂蜜', '竹子', '牛奶', '玉米']

onMounted(() => {
  history.value = getHistory()
})

const handleGenerate = async () => {
  if (!keyword.value.trim()) {
    errorMsg.value = '请输入关键词'
    return
  }

  errorMsg.value = ''
  isLoading.value = true
  result.value = null

  try {
    const data = await generateProductIdeas(keyword.value.trim())
    result.value = data
    saveToHistory(data)
    history.value = getHistory()
    ElMessage.success(`成功生成 ${getTotalProducts(data)} 个产品创意！`)
  } catch (error) {
    errorMsg.value = error instanceof Error ? error.message : '生成失败，请重试'
    ElMessage.error(errorMsg.value)
  } finally {
    isLoading.value = false
  }
}

const handleLoadHistory = (item: GenerationResult) => {
  result.value = item
  keyword.value = item.keyword
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
    path: '/ai-workflow/detail',
    query: {
      product: encodeURIComponent(JSON.stringify(product)),
      keyword: keyword.value
    }
  })
}

const goToSettings = () => {
  router.push('/ai-workflow/settings')
}
</script>

<style lang="scss" scoped>
.ai-workflow-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 32px 36px;
  border-radius: 24px;
  margin-bottom: 24px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1e0a38 0%, #0f172a 50%, #1e3a5f 100%);
  z-index: 0;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(139, 92, 246, 0.1) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
}

.hero-glow {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 80%;
  height: 200%;
  background: radial-gradient(
    ellipse,
    rgba(139, 92, 246, 0.25) 0%,
    rgba(236, 72, 153, 0.1) 40%,
    transparent 70%
  );
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.1) rotate(10deg);
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 999px;
  color: #c4b5fd;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  animation: dotPulse 2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
  }
}

.hero-title {
  margin: 0 0 12px;
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #f9a8d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sparkle {
  display: inline-block;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.2) rotate(15deg);
  }
}

.hero-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(139, 92, 246, 0.6);
    transform: translateY(-2px);
  }
}

/* Input Section */
.input-section {
  margin-bottom: 32px;
}

.input-card {
  background: #fff;
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}

.input-prefix {
  font-size: 24px;
  color: #8b5cf6;
}

.keyword-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 500;
  color: #1e293b;
  background: transparent;

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }
}

.generate-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.loading {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  }

  .el-icon {
    font-size: 18px;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #ef4444;
  font-size: 14px;

  .el-icon {
    font-size: 16px;
  }
}

/* Skeleton Loading */
.skeleton-section {
  margin-bottom: 32px;
}

.skeleton-header {
  margin-bottom: 20px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.skeleton-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
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

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  height: 14px;
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
  &.w-full {
    width: 100%;
  }
}

/* Results Section */
.results-section {
  margin-bottom: 32px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
  }
}

.keyword-tag {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
  border-radius: 999px;
  margin-right: 8px;
  font-size: 18px;
}

.result-time {
  font-size: 13px;
  color: #94a3b8;
}

.category-block {
  margin-bottom: 32px;
  animation: fadeUp 0.5s ease backwards;
  animation-delay: var(--cat-delay);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.category-icon {
  font-size: 28px;
}

.category-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.category-count {
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 999px;
  font-size: 12px;
  color: #64748b;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.product-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  animation: fadeUp 0.5s ease backwards;
  animation-delay: var(--delay);
  cursor: pointer;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
    border-color: #e2e8f0;
  }
}

.product-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  font-size: 28px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 14px;
  flex-shrink: 0;
}

.product-body {
  flex: 1;
  min-width: 0;
}

.product-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.product-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  gap: 8px;
}

.potential-tag {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;

  &.high {
    background: #ecfdf5;
    color: #16a34a;
  }
  &.medium {
    background: #fffbeb;
    color: #d97706;
  }
  &.low {
    background: #f1f5f9;
    color: #64748b;
  }
}

/* History Section */
.history-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }
}

.clear-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fee2e2;
    color: #ef4444;
  }
}

.history-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: fadeUp 0.3s ease backwards;
  animation-delay: var(--delay);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    border-color: #8b5cf6;
  }
}

.history-keyword {
  font-weight: 600;
  color: #1e293b;
}

.history-count {
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 999px;
  font-size: 11px;
  color: #64748b;
}

.history-time {
  font-size: 12px;
  color: #94a3b8;
}

/* Empty State */
.empty-section {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-section h3 {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.empty-section p {
  margin: 0 0 24px;
  color: #64748b;
  font-size: 15px;
}

.example-tags {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.example-tag {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    border-color: transparent;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
  .input-wrapper {
    flex-wrap: wrap;
  }
  .generate-btn {
    width: 100%;
    justify-content: center;
  }
  .hero-content {
    flex-direction: column;
    gap: 16px;
  }
  .settings-btn {
    align-self: flex-start;
  }
}
</style>
