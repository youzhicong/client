<template>
  <div class="fund-estimate-page">
    <div class="page-header">
      <h1>基金实时估值</h1>
      <p class="subtitle">实时追踪持仓基金估值和收益</p>
      <el-button type="primary" :icon="Refresh" @click="fetchFundList"> 刷新估值 </el-button>
    </div>

    <!-- 持仓汇总 -->
    <div class="summary-cards">
      <div class="summary-card">
        <span class="label">持仓成本</span>
        <span class="value">¥{{ summary.totalCost.toFixed(2) }}</span>
      </div>
      <div class="summary-card">
        <span class="label">估算市值</span>
        <span class="value">¥{{ summary.totalValue.toFixed(2) }}</span>
      </div>
      <div class="summary-card" :class="summary.totalProfit >= 0 ? 'profit' : 'loss'">
        <span class="label">估算盈亏</span>
        <span class="value">
          {{ summary.totalProfit >= 0 ? '+' : '' }}¥{{ summary.totalProfit.toFixed(2) }}
        </span>
      </div>
      <div class="summary-card" :class="summary.profitRate >= 0 ? 'profit' : 'loss'">
        <span class="label">收益率</span>
        <span class="value">
          {{ summary.profitRate >= 0 ? '+' : '' }}{{ summary.profitRate.toFixed(2) }}%
        </span>
      </div>
    </div>

    <!-- 添加基金 -->
    <div class="add-fund-section">
      <el-form :inline="true" :model="newFund" class="add-fund-form">
        <el-form-item label="基金代码">
          <el-input v-model="newFund.code" placeholder="请输入基金代码" style="width: 150px" />
        </el-form-item>
        <el-form-item label="持仓份额">
          <el-input-number v-model="newFund.shares" :min="0" :precision="2" style="width: 150px" />
        </el-form-item>
        <el-form-item label="持仓成本">
          <el-input-number v-model="newFund.cost" :min="0" :precision="4" style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAddFund">添加基金</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 基金列表表格 -->
    <div class="fund-table-container">
      <el-table :data="fundList" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="code" label="基金代码" width="100" />
        <el-table-column prop="name" label="基金名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nav" label="最新净值" width="100" align="right">
          <template #default="{ row }">
            {{ row.nav.toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column label="估算净值" width="100" align="right">
          <template #default="{ row }">
            <span :class="row.estimateChange >= 0 ? 'text-profit' : 'text-loss'">
              {{ row.estimateNav.toFixed(4) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="估算涨跌" width="100" align="right">
          <template #default="{ row }">
            <span :class="row.estimateChange >= 0 ? 'text-profit' : 'text-loss'">
              {{ row.estimateChange >= 0 ? '+' : '' }}{{ row.estimateChange.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="holdShares" label="持有份额" width="110" align="right">
          <template #default="{ row }">
            {{ row.holdShares.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="holdCost" label="持仓成本" width="100" align="right">
          <template #default="{ row }">
            {{ row.holdCost.toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column label="持仓市值" width="120" align="right">
          <template #default="{ row }">
            ¥{{ (row.estimateNav * row.holdShares).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="估算盈亏" width="120" align="right">
          <template #default="{ row }">
            <span :class="getProfit(row) >= 0 ? 'text-profit' : 'text-loss'">
              {{ getProfit(row) >= 0 ? '+' : '' }}¥{{ getProfit(row).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="100" align="center" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              circle
              @click="handleDelete(row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Fund } from './types'

const loading = ref(false)
const fundList = ref<Fund[]>([])

const newFund = ref({
  code: '',
  shares: 1000,
  cost: 1.0,
})

// 计算持仓汇总
const summary = computed(() => {
  let totalCost = 0
  let totalValue = 0

  fundList.value.forEach((fund) => {
    totalCost += fund.holdCost * fund.holdShares
    totalValue += fund.estimateNav * fund.holdShares
  })

  const totalProfit = totalValue - totalCost
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  return {
    totalCost,
    totalValue,
    totalProfit,
    profitRate,
  }
})

// 获取收益
const getProfit = (fund: Fund) => {
  return (fund.estimateNav - fund.holdCost) * fund.holdShares
}

// 获取类型标签颜色
const getTypeTag = (type: string) => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    混合型: 'primary',
    股票型: 'danger',
    指数型: 'warning',
    债券型: 'success',
  }
  return map[type] || 'info'
}

// 获取基金列表
const fetchFundList = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/fund/list')
    const data = await res.json()
    if (data.code === 200) {
      fundList.value = data.data
    }
  } catch {
    ElMessage.error('获取基金数据失败')
  } finally {
    loading.value = false
  }
}

// 添加基金
const handleAddFund = async () => {
  if (!newFund.value.code) {
    ElMessage.warning('请输入基金代码')
    return
  }

  try {
    const res = await fetch('/api/fund/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFund.value),
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success('添加成功')
      fundList.value.push(data.data)
      newFund.value.code = ''
    }
  } catch {
    ElMessage.error('添加失败')
  }
}

// 删除基金
const handleDelete = (fund: Fund) => {
  ElMessageBox.confirm(`确定删除 ${fund.name} 吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      const index = fundList.value.findIndex((f) => f.code === fund.code)
      if (index > -1) {
        fundList.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {})
}

// 定时刷新
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  fetchFundList()
  // 每分钟刷新一次
  timer = setInterval(fetchFundList, 60000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.fund-estimate-page {
  padding: 24px;
  background: #0f172a;
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  .subtitle {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    flex: 1;
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .value {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  &.profit .value {
    color: #22c55e;
  }

  &.loss .value {
    color: #ef4444;
  }
}

.add-fund-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.add-fund-form {
  :deep(.el-form-item__label) {
    color: rgba(255, 255, 255, 0.8);
  }
}

.fund-table-container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  overflow: hidden;

  :deep(.el-table) {
    background: transparent;
    --el-table-bg-color: #0f172a;
    --el-table-tr-bg-color: #0f172a;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.08);
    --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.12);
    --el-table-border-color: rgba(255, 255, 255, 0.1);
    --el-table-text-color: #fff;
    --el-table-header-text-color: rgba(255, 255, 255, 0.9);

    .el-table__row {
      background-color: #0f172a !important;
    }

    .el-table__row:nth-child(even) {
      background-color: rgba(255, 255, 255, 0.03) !important;
    }

    .el-table__body tr:hover > td {
      background-color: rgba(255, 255, 255, 0.08) !important;
    }

    th.el-table__cell {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }

    td.el-table__cell {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .el-table__fixed-right::before,
    .el-table__fixed::before {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}

.text-profit {
  color: #22c55e;
  font-weight: 600;
}

.text-loss {
  color: #ef4444;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
