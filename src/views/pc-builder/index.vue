<template>
  <div class="pc-builder-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <div class="hero panel">
      <div class="hero-main">
        <span class="hero-badge">DIY PC</span>
        <h1>自选装机中心</h1>
        <p>
          按需选择每个硬件，自动汇总京东 / 天猫 / 拼多多价格并计算整机预算。
        </p>
      </div>

      <div class="hero-actions">
        <el-select v-model="usageMode" class="usage-select">
          <el-option label="游戏优先" value="gaming" />
          <el-option label="生产力优先" value="productivity" />
          <el-option label="均衡搭配" value="balanced" />
        </el-select>

        <el-input-number
          v-model="budget"
          :min="1000"
          :step="500"
          class="budget-input"
        />

        <el-button @click="applyCheapestPreset">一键最低价</el-button>
        <el-button @click="applyBalancedPreset">一键均衡</el-button>
        <el-button type="primary" :loading="loading" @click="fetchParts"
          >刷新报价</el-button
        >
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card panel">
        <span class="label">已选配件</span>
        <strong class="value"
          >{{ selectedParts.length }} / {{ categories.length }}</strong
        >
      </div>

      <div class="summary-card panel">
        <span class="label">预算</span>
        <strong class="value">{{ formatPrice(budget) }}</strong>
      </div>

      <div class="summary-card panel" :class="budgetStatusClass">
        <span class="label">最低整机价</span>
        <strong class="value">{{
          minimumPlan ? formatPrice(minimumPlan.total) : '-'
        }}</strong>
      </div>

      <div class="summary-card panel">
        <span class="label">更新于</span>
        <strong class="value small">{{ updatedAtLabel }}</strong>
      </div>
    </div>

    <div class="work-grid">
      <main class="parts-list panel">
        <div class="panel-head">
          <h3>分部件选配</h3>
          <span>按分类选择后，右侧会自动汇总总价</span>
        </div>

        <div class="category-list" v-if="categories.length">
          <div
            class="category-card"
            v-for="category in categories"
            :key="category.key"
          >
            <div class="category-head">
              <strong>{{ category.label }}</strong>
              <span>{{ category.options.length }} 款</span>
            </div>

            <el-select
              :model-value="selectedMap[category.key]"
              @change="(val) => updateSelection(category.key, String(val))"
              filterable
              class="option-select"
            >
              <el-option
                v-for="item in category.options"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              >
                <div class="option-row">
                  <div>
                    <div class="option-title">{{ item.name }}</div>
                    <div class="option-sub">{{ item.specs }}</div>
                  </div>
                  <span class="option-price">{{
                    formatPrice(minPrice(item))
                  }}</span>
                </div>
              </el-option>
            </el-select>

            <div
              class="platform-prices"
              v-if="currentSelectedPart(category.key)"
            >
              <div
                class="platform-item"
                v-for="price in currentSelectedPart(category.key)!.prices"
                :key="`${category.key}-${price.platform}`"
              >
                <span>{{ platformLabel(price.platform) }}</span>
                <a
                  :href="price.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ formatPrice(price.price) }}</a
                >
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无配件数据" />
      </main>

      <div class="quote-panel panel">
        <div class="panel-head">
          <h3>平台总价对比</h3>
          <span>总价仅用于比价参考</span>
        </div>

        <div class="quote-list">
          <div
            class="quote-item"
            v-for="item in platformTotals"
            :key="item.platform"
          >
            <span class="name">{{ platformLabel(item.platform) }}</span>
            <strong class="price">{{ formatPrice(item.total) }}</strong>
            <el-tag
              v-if="minimumPlan && item.platform === minimumPlan.platform"
              size="small"
              type="success"
              >最低</el-tag
            >
          </div>
        </div>

        <div class="budget-tip" :class="budgetStatusClass">
          <strong>{{ budgetStatusText }}</strong>
          <p>当前模式：{{ usageModeLabel }}</p>
        </div>

        <AppDataTable
          :data="selectedParts"
          size="small"
          border
          class="mini-table"
          empty-text="请先选择配件"
        >
          <el-table-column prop="categoryLabel" label="配件" width="90" />
          <el-table-column prop="name" label="型号" min-width="120" />
          <el-table-column label="最低价" width="100" align="right">
            <template #default="{ row }">
              {{ formatPrice(minPrice(row)) }}
            </template>
          </el-table-column>
        </AppDataTable>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

type Platform = 'jd' | 'tmall' | 'pdd'

type PartPrice = {
  platform: Platform
  price: number
  url: string
}

type PartOption = {
  id: string
  name: string
  specs: string
  score: number
  prices: PartPrice[]
}

type PartCategory = {
  key: string
  label: string
  options: PartOption[]
}

type PcBuilderResponse = {
  code: number
  message: string
  data: {
    updatedAt: string
    categories: PartCategory[]
  }
}

type SelectedPart = PartOption & {
  categoryKey: string
  categoryLabel: string
}

const loading = ref(false)
const categories = ref<PartCategory[]>([])
const selectedMap = ref<Record<string, string>>({})
const updatedAt = ref('')
const budget = ref(8000)
const usageMode = ref<'gaming' | 'productivity' | 'balanced'>('balanced')

const updatedAtLabel = computed(() => {
  if (!updatedAt.value) return '暂无'
  const date = new Date(updatedAt.value)
  return Number.isNaN(date.getTime())
    ? updatedAt.value
    : date.toLocaleString('zh-CN')
})

const usageModeLabel = computed(() => {
  if (usageMode.value === 'gaming') return '游戏优先'
  if (usageMode.value === 'productivity') return '生产力优先'
  return '均衡搭配'
})

const platformTotals = computed(() => {
  const platforms: Platform[] = ['jd', 'tmall', 'pdd']
  return platforms.map((platform) => {
    const total = selectedParts.value.reduce((sum, item) => {
      const hit = item.prices.find((p) => p.platform === platform)
      return sum + (hit ? hit.price : minPrice(item))
    }, 0)
    return { platform, total }
  })
})

const minimumPlan = computed(() => {
  if (!selectedParts.value.length) return null
  const sorted = [...platformTotals.value].sort((a, b) => a.total - b.total)
  return sorted[0] || null
})

const budgetStatusClass = computed(() => {
  if (!minimumPlan.value) return 'pending'
  if (minimumPlan.value.total <= budget.value) return 'ok'
  return 'warn'
})

const budgetStatusText = computed(() => {
  if (!minimumPlan.value) return '请先完成选配'
  if (minimumPlan.value.total <= budget.value) {
    return `预算充足，预计可节省 ${formatPrice(budget.value - minimumPlan.value.total)}`
  }
  return `超预算 ${formatPrice(minimumPlan.value.total - budget.value)}`
})

const selectedParts = computed<SelectedPart[]>(() => {
  return categories.value
    .map((category) => {
      const id = selectedMap.value[category.key]
      const option = category.options.find((item) => item.id === id)
      if (!option) return null
      return {
        ...option,
        categoryKey: category.key,
        categoryLabel: category.label
      }
    })
    .filter((item): item is SelectedPart => Boolean(item))
})

const platformLabel = (platform: Platform) => {
  if (platform === 'jd') return '京东'
  if (platform === 'tmall') return '天猫'
  return '拼多多'
}

const formatPrice = (price: number) => `¥${price.toFixed(0)}`

const minPrice = (item: PartOption) => {
  if (!item.prices.length) return 0
  return Math.min(...item.prices.map((p) => p.price))
}

const currentSelectedPart = (categoryKey: string) => {
  const category = categories.value.find((c) => c.key === categoryKey)
  if (!category) return null
  const id = selectedMap.value[categoryKey]
  return category.options.find((item) => item.id === id) || null
}

const updateSelection = (categoryKey: string, optionId: string) => {
  selectedMap.value = {
    ...selectedMap.value,
    [categoryKey]: optionId
  }
}

const applyCheapestPreset = () => {
  const next: Record<string, string> = {}

  categories.value.forEach((category) => {
    const sorted = [...category.options].sort(
      (a, b) => minPrice(a) - minPrice(b)
    )
    if (sorted[0]) {
      next[category.key] = sorted[0].id
    }
  })

  selectedMap.value = next
  ElMessage.success('已应用最低价方案')
}

const applyBalancedPreset = () => {
  const next: Record<string, string> = {}

  categories.value.forEach((category) => {
    const sorted = [...category.options].sort((a, b) => a.score - b.score)
    if (!sorted.length) return

    if (usageMode.value === 'gaming') {
      const pick =
        sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.7))]
      if (pick) {
        next[category.key] = pick.id
      }
      return
    }

    if (usageMode.value === 'productivity') {
      const pick =
        sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.65))]
      if (pick) {
        next[category.key] = pick.id
      }
      return
    }

    const pick = sorted[Math.floor((sorted.length - 1) / 2)]
    if (pick) {
      next[category.key] = pick.id
    }
  })

  selectedMap.value = next
  ElMessage.success('已应用均衡方案')
}

const fetchParts = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/pc-builder/prices')
    const data: PcBuilderResponse = await res.json()

    if (data.code !== 200) {
      ElMessage.error(data.message || '加载失败')
      return
    }

    categories.value = data.data.categories
    updatedAt.value = data.data.updatedAt

    const next: Record<string, string> = {}
    categories.value.forEach((category) => {
      const current = selectedMap.value[category.key]
      if (current && category.options.some((x) => x.id === current)) {
        next[category.key] = current
      } else if (category.options[0]) {
        next[category.key] = category.options[0].id
      }
    })
    selectedMap.value = next
  } catch {
    ElMessage.error('加载配件数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchParts()
})
</script>

<style lang="scss" scoped>
.pc-builder-page {
  --bg-main: #f4f7f3;
  --panel-bg: rgba(255, 255, 255, 0.86);
  --line: #d8e4d8;
  --text-main: #243522;
  --text-sub: #6e8169;
  --brand: #2f7d32;
  --warn: #b45309;
  --shadow: 0 20px 44px rgba(26, 55, 30, 0.12);

  min-height: calc(100vh - 60px);
  position: relative;
  padding: 22px;
  overflow: hidden;
  color: var(--text-main);
  background:
    radial-gradient(circle at 8% 8%, #e2f0de 0%, transparent 35%),
    radial-gradient(circle at 92% 9%, #ffe9d6 0%, transparent 30%),
    var(--bg-main);
  font-family: 'Sora', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  filter: blur(32px);
  opacity: 0.36;
  pointer-events: none;
}

.shape-a {
  width: 260px;
  height: 260px;
  right: -90px;
  top: -60px;
  background: #cde8cc;
}

.shape-b {
  width: 220px;
  height: 220px;
  left: -60px;
  bottom: 120px;
  background: #cae2ff;
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 20px 22px;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #2f7d32 0%, #2f6fd8 100%);
}

.hero-main h1 {
  margin: 12px 0 8px;
  font-size: 34px;
  line-height: 1.1;
}

.hero-main p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.usage-select {
  width: 160px;
}

.budget-input {
  width: 160px;
}

.summary-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card .label {
  color: var(--text-sub);
  font-size: 12px;
}

.summary-card .value {
  font-size: 28px;
  line-height: 1.05;
}

.summary-card .value.small {
  font-size: 16px;
}

.summary-card.ok .value {
  color: #166534;
}

.summary-card.warn .value {
  color: #9a3412;
}

.work-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 370px;
  gap: 12px;
}

.parts-list,
.quote-panel {
  padding: 14px;
}

.panel-head {
  margin-bottom: 12px;
}

.panel-head h3 {
  margin: 0;
  font-size: 18px;
}

.panel-head span {
  margin-top: 5px;
  display: block;
  font-size: 12px;
  color: var(--text-sub);
}

.category-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.category-card {
  border: 1px solid #dce7db;
  border-radius: 14px;
  padding: 10px;
  background: #f8fcf7;
}

.category-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-head strong {
  font-size: 13px;
}

.category-head span {
  font-size: 11px;
  color: var(--text-sub);
}

.option-select {
  width: 100%;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.option-title {
  font-size: 13px;
}

.option-sub {
  margin-top: 2px;
  font-size: 11px;
  color: #748673;
}

.option-price {
  color: #166534;
  font-size: 12px;
  font-weight: 700;
}

.platform-prices {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.platform-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #425640;
}

.platform-item a {
  color: #1d4ed8;
  text-decoration: none;
  font-weight: 600;
}

.quote-list {
  display: grid;
  gap: 8px;
}

.quote-item {
  border: 1px solid #dce7db;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quote-item .name {
  flex: 1;
  font-size: 13px;
}

.quote-item .price {
  font-size: 18px;
  line-height: 1;
}

.budget-tip {
  margin-top: 10px;
  border-radius: 12px;
  padding: 10px;
  background: #f4faf3;
}

.budget-tip strong {
  font-size: 13px;
}

.budget-tip p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.budget-tip.ok {
  border: 1px solid #bbf7d0;
}

.budget-tip.warn {
  border: 1px solid #fed7aa;
  background: #fff7ed;
}

.mini-table {
  margin-top: 12px;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: rgba(225, 240, 223, 0.5);
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.66);
  --el-table-row-hover-bg-color: rgba(219, 240, 219, 0.4);
  --el-table-border-color: #d8e4d8;
  --el-table-text-color: #254025;
  --el-table-header-text-color: #2e5230;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .work-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .pc-builder-page {
    padding: 14px;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-main h1 {
    font-size: 27px;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .category-list {
    grid-template-columns: 1fr;
  }
}
</style>
