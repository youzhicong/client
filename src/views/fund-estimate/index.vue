<template>
  <div class="fund-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <div class="hero panel">
      <div class="hero-main">
        <span class="hero-badge">FUND TRACKER</span>
        <h1>基金估值驾驶舱</h1>
        <p>实时查看持仓估值、收益变化和风险分布，支持自动刷新与快速加仓。</p>
      </div>

      <div class="hero-controls">
        <div class="meta-row">
          <span>上次更新：{{ lastUpdatedLabel }}</span>
          <span
            >自动刷新：{{
              autoRefresh ? refreshCountdownLabel : '已暂停'
            }}</span
          >
        </div>
        <div class="action-row">
          <el-switch
            v-model="autoRefresh"
            size="large"
            active-text="自动刷新"
            inactive-text="手动刷新"
          />
          <el-button
            type="primary"
            :icon="Refresh"
            :loading="loading"
            @click="fetchFundList"
          >
            刷新估值
          </el-button>
        </div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card panel">
        <span class="label">持仓成本</span>
        <strong class="value">{{ formatCurrency(summary.totalCost) }}</strong>
        <span class="hint">累计投入</span>
      </div>

      <div class="summary-card panel">
        <span class="label">估算市值</span>
        <strong class="value">{{ formatCurrency(summary.totalValue) }}</strong>
        <span class="hint">实时净值估算</span>
      </div>

      <div
        class="summary-card panel"
        :class="summary.totalProfit >= 0 ? 'profit' : 'loss'"
      >
        <span class="label">估算盈亏</span>
        <strong class="value">{{
          formatSignedCurrency(summary.totalProfit)
        }}</strong>
        <span class="hint">总浮动收益</span>
      </div>

      <div
        class="summary-card panel"
        :class="summary.profitRate >= 0 ? 'profit' : 'loss'"
      >
        <span class="label">收益率</span>
        <strong class="value">{{
          formatSignedPercent(summary.profitRate)
        }}</strong>
        <span class="hint">收益 / 成本</span>
      </div>
    </div>

    <div class="workspace-grid">
      <div class="panel add-panel">
        <div class="panel-head">
          <h3>新增持仓</h3>
          <span>输入基金代码后可直接加入组合</span>
        </div>

        <el-form
          :inline="true"
          :model="newFund"
          class="add-form"
          @submit.prevent
        >
          <el-form-item label="基金代码">
            <el-input
              v-model="newFund.code"
              placeholder="例如 161725"
              maxlength="6"
              clearable
            />
          </el-form-item>
          <el-form-item label="持有份额">
            <el-input-number
              v-model="newFund.shares"
              :min="0.01"
              :precision="2"
            />
          </el-form-item>
          <el-form-item label="持仓成本">
            <el-input-number
              v-model="newFund.cost"
              :min="0.0001"
              :precision="4"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Plus" @click="handleAddFund"
              >添加基金</el-button
            >
          </el-form-item>
        </el-form>
      </div>

      <div class="panel filter-panel">
        <div class="panel-head">
          <h3>筛选与排序</h3>
          <span>快速定位重点持仓</span>
        </div>

        <div class="filter-controls">
          <el-input
            v-model="keywordFilter"
            placeholder="按名称或代码搜索"
            clearable
            class="filter-item"
          />

          <el-select v-model="typeFilter" class="filter-item">
            <el-option label="全部类型" value="all" />
            <el-option
              v-for="item in typeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>

          <el-select v-model="sortMode" class="filter-item">
            <el-option label="按盈亏降序" value="profit-desc" />
            <el-option label="按盈亏升序" value="profit-asc" />
            <el-option label="按涨跌幅降序" value="change-desc" />
            <el-option label="按涨跌幅升序" value="change-asc" />
          </el-select>

          <el-button @click="resetFilters">重置筛选</el-button>
        </div>
      </div>
    </div>

    <div class="table-panel panel">
      <div class="table-header">
        <div>
          <h3>持仓列表</h3>
          <p>
            当前共 {{ displayList.length }} 支基金，盈利
            {{ profitCount }} 支，亏损 {{ lossCount }} 支
          </p>
        </div>
      </div>

      <AppDataTable :data="displayList" v-loading="loading" border height="520">
        <el-table-column
          prop="code"
          label="基金代码"
          width="110"
          fixed="left"
        />
        <el-table-column prop="name" label="基金名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small" effect="light">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最新净值" width="100" align="right">
          <template #default="{ row }">{{ row.nav.toFixed(4) }}</template>
        </el-table-column>

        <el-table-column label="估算净值" width="100" align="right">
          <template #default="{ row }">
            <span
              :class="row.estimateChange >= 0 ? 'text-profit' : 'text-loss'"
            >
              {{ row.estimateNav.toFixed(4) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="估算涨跌" width="110" align="right">
          <template #default="{ row }">
            <span
              :class="row.estimateChange >= 0 ? 'text-profit' : 'text-loss'"
            >
              {{ formatSignedPercent(row.estimateChange) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="持有份额" width="100" align="right">
          <template #default="{ row }">{{
            row.holdShares.toFixed(2)
          }}</template>
        </el-table-column>

        <el-table-column label="持仓成本" width="110" align="right">
          <template #default="{ row }">{{ row.holdCost.toFixed(4) }}</template>
        </el-table-column>

        <el-table-column label="持仓市值" width="130" align="right">
          <template #default="{ row }">{{
            formatCurrency(row.estimateNav * row.holdShares)
          }}</template>
        </el-table-column>

        <el-table-column label="估算盈亏" width="130" align="right">
          <template #default="{ row }">
            <span :class="getProfit(row) >= 0 ? 'text-profit' : 'text-loss'">
              {{ formatSignedCurrency(getProfit(row)) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="updateTime"
          label="更新时间"
          width="100"
          align="center"
        />

        <el-table-column label="操作" width="84" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              circle
              plain
              @click="handleDelete(row)"
            />
          </template>
        </el-table-column>
      </AppDataTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addFund, deleteFund, getFundList, type FundItem as Fund } from '@/services/fund'

const loading = ref(false)
const fundList = ref<Fund[]>([])

const newFund = ref({
  code: '',
  shares: 1000,
  cost: 1
})

const keywordFilter = ref('')
const typeFilter = ref('all')
const sortMode = ref<
  'profit-desc' | 'profit-asc' | 'change-desc' | 'change-asc'
>('profit-desc')
const autoRefresh = ref(true)
const refreshSeconds = ref(60)
const lastUpdatedAt = ref<Date | null>(null)

let autoRefreshTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

const summary = computed(() => {
  const totalCost = fundList.value.reduce(
    (sum, item) => sum + item.holdCost * item.holdShares,
    0
  )
  const totalValue = fundList.value.reduce(
    (sum, item) => sum + item.estimateNav * item.holdShares,
    0
  )
  const totalProfit = totalValue - totalCost
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  return { totalCost, totalValue, totalProfit, profitRate }
})

const typeOptions = computed(() => {
  const set = new Set(fundList.value.map((item) => item.type))
  return Array.from(set)
})

const displayList = computed(() => {
  const keyword = keywordFilter.value.trim().toLowerCase()

  let list = [...fundList.value]

  if (keyword) {
    list = list.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.code.toLowerCase().includes(keyword)
      )
    })
  }

  if (typeFilter.value !== 'all') {
    list = list.filter((item) => item.type === typeFilter.value)
  }

  list.sort((a, b) => {
    const profitA = getProfit(a)
    const profitB = getProfit(b)

    if (sortMode.value === 'profit-desc') return profitB - profitA
    if (sortMode.value === 'profit-asc') return profitA - profitB
    if (sortMode.value === 'change-desc')
      return b.estimateChange - a.estimateChange
    return a.estimateChange - b.estimateChange
  })

  return list
})

const profitCount = computed(
  () => displayList.value.filter((item) => getProfit(item) >= 0).length
)
const lossCount = computed(
  () => displayList.value.filter((item) => getProfit(item) < 0).length
)

const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value) return '暂无'
  return lastUpdatedAt.value.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

const refreshCountdownLabel = computed(
  () => `${refreshSeconds.value}s 后自动刷新`
)

const formatCurrency = (value: number) => `¥${value.toFixed(2)}`
const formatSignedCurrency = (value: number) =>
  `${value >= 0 ? '+' : ''}${formatCurrency(value)}`
const formatSignedPercent = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const getProfit = (fund: Fund) =>
  (fund.estimateNav - fund.holdCost) * fund.holdShares

const getTypeTag = (type: string) => {
  if (type.includes('股票')) return 'danger'
  if (type.includes('指数')) return 'warning'
  if (type.includes('债')) return 'success'
  if (type.includes('混合')) return 'primary'
  return 'info'
}

const fetchFundList = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const response = await getFundList()
    const data = response
    if (response.code === 10000 && Array.isArray(response.data)) {
      fundList.value = response.data
      lastUpdatedAt.value = new Date()
      refreshSeconds.value = 60
    } else {
      ElMessage.error(data.message || '获取基金数据失败')
    }
  } catch {
    ElMessage.error('获取基金数据失败')
  } finally {
    loading.value = false
  }
}

const handleAddFund = async () => {
  const code = newFund.value.code.trim()

  if (!/^\d{6}$/.test(code)) {
    ElMessage.warning('请输入 6 位基金代码')
    return
  }
  if (newFund.value.shares <= 0 || newFund.value.cost <= 0) {
    ElMessage.warning('份额和成本必须大于 0')
    return
  }

  try {
    const response = await addFund({
      code,
      shares: newFund.value.shares,
      cost: newFund.value.cost
    })
    const data = response
    if (data.code === 10000) {
      ElMessage.success('基金已加入持仓')
      newFund.value.code = ''
      await fetchFundList()
    } else {
      ElMessage.error(data.message || '添加失败')
    }
  } catch {
    ElMessage.error('添加失败')
  }
}

const handleDelete = (fund: Fund) => {
  ElMessageBox.confirm(
    `确定删除 ${fund.name}（${fund.code}）吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const response = await deleteFund({ code: fund.code })
        const data = response
        if (data.code === 10000) {
          fundList.value = fundList.value.filter(
            (item) => item.code !== fund.code
          )
          ElMessage.success('删除成功')
        } else {
          ElMessage.error(data.message || '删除失败')
        }
      } catch {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const resetFilters = () => {
  keywordFilter.value = ''
  typeFilter.value = 'all'
  sortMode.value = 'profit-desc'
}

const stopTimers = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const startTimers = () => {
  stopTimers()

  autoRefreshTimer = setInterval(() => {
    void fetchFundList()
  }, 60000)

  countdownTimer = setInterval(() => {
    if (!autoRefresh.value) return
    if (refreshSeconds.value <= 1) {
      refreshSeconds.value = 60
      return
    }
    refreshSeconds.value -= 1
  }, 1000)
}

watch(autoRefresh, (enabled) => {
  if (enabled) {
    refreshSeconds.value = 60
    startTimers()
  } else {
    stopTimers()
  }
})

onMounted(async () => {
  await fetchFundList()
  if (autoRefresh.value) {
    startTimers()
  }
})

onUnmounted(() => {
  stopTimers()
})
</script>

<style lang="scss" scoped>
.fund-page {
  --bg-main: #f2f6f8;
  --panel-bg: rgba(255, 255, 255, 0.86);
  --line: #d7e2e7;
  --text-main: #173742;
  --text-sub: #67828d;
  --brand: #0f8f92;
  --brand-strong: #0d6f74;
  --profit: #16a34a;
  --loss: #dc2626;
  --shadow: 0 20px 44px rgba(22, 53, 66, 0.12);

  min-height: calc(100vh - 60px);
  position: relative;
  padding: 22px;
  overflow: hidden;
  color: var(--text-main);
  background:
    radial-gradient(circle at 8% 8%, #d5efed 0%, transparent 35%),
    radial-gradient(circle at 90% 12%, #ffe6d1 0%, transparent 30%),
    var(--bg-main);
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  filter: blur(32px);
  opacity: 0.4;
  pointer-events: none;
}

.shape-a {
  width: 260px;
  height: 260px;
  top: -80px;
  right: -60px;
  background: #bde4f8;
}

.shape-b {
  width: 220px;
  height: 220px;
  left: -70px;
  bottom: 120px;
  background: #d2f5e1;
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 360px);
  gap: 20px;
  padding: 22px 24px;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #0f8f92 0%, #2f6dd8 100%);
}

.hero-main h1 {
  margin: 12px 0 8px;
  font-size: 32px;
  line-height: 1.1;
}

.hero-main p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.hero-controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-sub);
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.summary-grid {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card .label {
  font-size: 12px;
  color: var(--text-sub);
}

.summary-card .value {
  font-size: 28px;
  line-height: 1.05;
}

.summary-card .hint {
  font-size: 12px;
  color: #90a5ad;
}

.summary-card.profit .value {
  color: var(--profit);
}

.summary-card.loss .value {
  color: var(--loss);
}

.workspace-grid {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 12px;
}

.add-panel,
.filter-panel {
  padding: 16px;
}

.panel-head {
  margin-bottom: 14px;
}

.panel-head h3 {
  margin: 0;
  font-size: 16px;
}

.panel-head span {
  margin-top: 4px;
  display: block;
  font-size: 12px;
  color: var(--text-sub);
}

.add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.filter-item {
  width: 100%;
}

.table-panel {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  padding: 14px;
}

.table-header {
  margin-bottom: 12px;
}

.table-header h3 {
  margin: 0;
  font-size: 18px;
}

.table-header p {
  margin: 6px 0 0;
  color: var(--text-sub);
  font-size: 13px;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: rgba(214, 239, 240, 0.45);
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.66);
  --el-table-row-hover-bg-color: rgba(214, 239, 240, 0.5);
  --el-table-border-color: #d6e3e8;
  --el-table-text-color: #18404c;
  --el-table-header-text-color: #1f4c59;
}

.text-profit {
  color: var(--profit);
  font-weight: 700;
}

.text-loss {
  color: var(--loss);
  font-weight: 700;
}

@media (max-width: 1320px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .fund-page {
    padding: 14px;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-main h1 {
    font-size: 26px;
  }

  .action-row {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .filter-controls {
    grid-template-columns: 1fr;
  }
}
</style>
