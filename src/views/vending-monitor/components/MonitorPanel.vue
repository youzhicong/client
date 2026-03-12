<template>
  <div class="monitor-panel">
    <div class="panel-card">
      <div class="card-header">
        <h3>设备状态</h3>
        <span :class="['status-badge', data.machine.status]">{{
          statusText
        }}</span>
      </div>

      <div class="card-body">
        <div class="stat-row">
          <span class="label">设备编号</span>
          <span class="value mono">{{ data.machine.id }}</span>
        </div>
        <div class="stat-row">
          <span class="label">部署位置</span>
          <span class="value">{{ data.machine.location }}</span>
        </div>
        <div class="stat-row">
          <span class="label">设备温度</span>
          <span class="value">{{ data.machine.temperature.toFixed(1) }}°C</span>
        </div>
        <div class="stat-row">
          <span class="label">运行时长</span>
          <span class="value">{{ uptimeDays }} 天</span>
        </div>
        <div class="stat-row">
          <span class="label">最近维护</span>
          <span class="value">{{ data.machine.lastMaintenance }}</span>
        </div>
      </div>
    </div>

    <div class="panel-card">
      <div class="card-header">
        <h3>销售概览</h3>
      </div>

      <div class="card-body">
        <div class="sales-grid">
          <div class="sales-item">
            <span class="sales-value">{{ data.sales.todaySales }}</span>
            <span class="sales-label">今日销量</span>
          </div>
          <div class="sales-item revenue">
            <span class="sales-value">{{
              formatCurrency(data.sales.todayRevenue)
            }}</span>
            <span class="sales-label">今日销售额</span>
          </div>
        </div>

        <div class="week-trend">
          <div
            v-for="(value, idx) in data.sales.weekSales"
            :key="idx"
            class="trend-bar"
            :style="{ height: `${getTrendHeight(value)}%` }"
            :title="`周${idx + 1}: ${value}`"
          ></div>
        </div>

        <div class="top-products">
          <h4>热销商品</h4>
          <div
            v-for="item in data.sales.topProducts"
            :key="item.name"
            class="top-item"
          >
            <div class="top-main">
              <span class="name">{{ item.name }}</span>
              <span class="count">{{ item.count }} 件</span>
            </div>
            <div class="top-bar">
              <div
                class="top-fill"
                :style="{ width: `${(item.count / topCountMax) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-card">
      <div class="card-header">
        <h3>库存健康</h3>
        <span class="stock-health">{{ stockRate }}%</span>
      </div>

      <div class="card-body">
        <div class="stock-summary">
          <div class="summary-item">
            <span class="summary-label">低库存</span>
            <strong class="summary-value warning">{{ lowStockCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">缺货</span>
            <strong class="summary-value danger">{{ emptyCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">货道总数</span>
            <strong class="summary-value">{{ data.products.length }}</strong>
          </div>
        </div>

        <div class="stock-list">
          <div
            v-for="product in sortedProducts"
            :key="product.id"
            class="stock-item"
          >
            <div class="stock-info">
              <div>
                <span class="name">{{ product.name }}</span>
                <span class="price">{{ formatCurrency(product.price) }}</span>
              </div>
              <span
                class="count"
                :class="getStockLevel(product.stock, product.maxStock)"
              >
                {{ product.stock }}/{{ product.maxStock }}
              </span>
            </div>

            <div class="stock-bar">
              <div
                class="stock-fill"
                :style="{
                  width: `${(product.stock / product.maxStock) * 100}%`,
                  backgroundColor: getStockColor(
                    product.stock,
                    product.maxStock
                  )
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-card alerts-card">
      <div class="card-header">
        <h3>告警信息</h3>
        <span class="alert-count" v-if="warningCount > 0">{{
          warningCount
        }}</span>
      </div>

      <div class="card-body">
        <div v-if="data.alerts.length === 0" class="no-alerts">暂无告警</div>

        <div
          v-for="alert in data.alerts"
          :key="alert.id"
          :class="['alert-item', alert.type]"
        >
          <span class="alert-dot"></span>
          <span class="alert-msg">{{ alert.message }}</span>
          <span class="alert-time">{{ alert.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { MonitorData } from '../types'

const props = defineProps<{
  data: MonitorData
}>()

const statusText = computed(() => {
  const map = {
    online: '在线',
    offline: '离线',
    warning: '告警'
  }
  return map[props.data.machine.status]
})

const sortedProducts = computed(() => {
  return [...props.data.products].sort(
    (a, b) => a.stock / a.maxStock - b.stock / b.maxStock
  )
})

const warningCount = computed(
  () =>
    props.data.alerts.filter(
      (item) => item.type === 'warning' || item.type === 'error'
    ).length
)

const uptimeDays = computed(() => Math.floor(props.data.machine.uptime / 24))

const totalStock = computed(() =>
  props.data.products.reduce((sum, item) => sum + item.stock, 0)
)

const totalMaxStock = computed(() =>
  props.data.products.reduce((sum, item) => sum + item.maxStock, 0)
)

const stockRate = computed(() => {
  if (totalMaxStock.value === 0) return 0
  return Math.round((totalStock.value / totalMaxStock.value) * 100)
})

const lowStockCount = computed(
  () =>
    props.data.products.filter((item) => item.stock > 0 && item.stock <= 2)
      .length
)

const emptyCount = computed(
  () => props.data.products.filter((item) => item.stock === 0).length
)

const topCountMax = computed(() => {
  const max = Math.max(
    ...props.data.sales.topProducts.map((item) => item.count),
    1
  )
  return max
})

const weekMax = computed(() => Math.max(...props.data.sales.weekSales, 1))

const getTrendHeight = (value: number) =>
  Math.max(14, Math.round((value / weekMax.value) * 100))

const formatCurrency = (value: number) => `￥${value.toLocaleString('zh-CN')}`

const getStockColor = (stock: number, max: number) => {
  const ratio = stock / max
  if (ratio <= 0.2) return '#ef4444'
  if (ratio <= 0.5) return '#f59e0b'
  return '#16a34a'
}

const getStockLevel = (stock: number, max: number) => {
  const ratio = stock / max
  if (ratio <= 0.2) return 'danger'
  if (ratio <= 0.5) return 'warning'
  return 'ok'
}
</script>

<style lang="scss" scoped>
.monitor-panel {
  height: 100%;
  overflow: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(20, 64, 75, 0.24);
  }
}

.panel-card {
  border: 1px solid #d8e8e7;
  border-radius: 16px;
  background: #ffffff;
  overflow: hidden;
}

.card-header {
  height: 46px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e3f0ef;
  background: #f7fcfb;

  h3 {
    margin: 0;
    font-size: 14px;
    color: #1f3f45;
  }
}

.card-body {
  padding: 12px 14px;
}

.status-badge {
  min-width: 48px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;

  &.online {
    color: #166534;
    background: #dcfce7;
  }

  &.warning {
    color: #b45309;
    background: #ffedd5;
  }

  &.offline {
    color: #b91c1c;
    background: #fee2e2;
  }
}

.stat-row {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px dashed #e3efee;

  &:last-child {
    border-bottom: none;
  }
}

.label {
  font-size: 12px;
  color: #6b868b;
}

.value {
  font-size: 12px;
  color: #1f3f45;
  font-weight: 600;
  text-align: right;
}

.value.mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    monospace;
}

.sales-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.sales-item {
  border: 1px solid #d9ece9;
  border-radius: 12px;
  padding: 10px;
  background: #f3fbf9;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sales-item.revenue {
  background: #fff5ee;
  border-color: #ffe1cc;
}

.sales-value {
  font-size: 20px;
  line-height: 1;
  color: #14414b;
}

.sales-label {
  font-size: 12px;
  color: #6c888d;
}

.week-trend {
  margin-top: 12px;
  height: 62px;
  padding: 0 4px;
  border-radius: 10px;
  background: #f7fbfb;
  border: 1px solid #e6f1f0;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: end;
  gap: 4px;
}

.trend-bar {
  border-radius: 6px 6px 2px 2px;
  background: linear-gradient(180deg, #16a69a, #0f8f84);
  transition: all 0.25s ease;
}

.top-products {
  margin-top: 12px;

  h4 {
    margin: 0 0 8px;
    color: #5e7a80;
    font-size: 12px;
    font-weight: 600;
  }
}

.top-item {
  margin-bottom: 8px;
}

.top-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;

  .name {
    color: #173e46;
  }

  .count {
    color: #607d83;
  }
}

.top-bar {
  height: 6px;
  border-radius: 999px;
  background: #e9f2f1;
  overflow: hidden;
}

.top-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ef7f38, #f5ab57);
}

.stock-health {
  font-size: 12px;
  color: #0f8f84;
  font-weight: 700;
}

.stock-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.summary-item {
  border: 1px solid #e2eeee;
  border-radius: 10px;
  padding: 8px;
  background: #f8fcfc;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 11px;
  color: #6e898f;
}

.summary-value {
  font-size: 18px;
  line-height: 1;
  color: #1b4048;
}

.summary-value.warning {
  color: #b45309;
}

.summary-value.danger {
  color: #b91c1c;
}

.stock-list {
  margin-top: 10px;
  max-height: 190px;
  overflow: auto;
  padding-right: 2px;
}

.stock-item {
  margin-bottom: 10px;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;

  .name {
    font-size: 12px;
    color: #143d45;
    margin-right: 8px;
  }

  .price {
    font-size: 11px;
    color: #7a9499;
  }

  .count {
    font-size: 11px;
    font-weight: 700;

    &.ok {
      color: #166534;
    }

    &.warning {
      color: #b45309;
    }

    &.danger {
      color: #b91c1c;
    }
  }
}

.stock-bar {
  height: 6px;
  border-radius: 999px;
  background: #e8f1f0;
  overflow: hidden;
}

.stock-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.alert-count {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 11px;
  background: #dc2626;
}

.no-alerts {
  padding: 10px 0;
  text-align: center;
  color: #748f94;
  font-size: 12px;
}

.alert-item {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px dashed #e4efee;

  &:last-child {
    border-bottom: none;
  }
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.alert-item.error .alert-dot {
  background: #dc2626;
}

.alert-item.warning .alert-dot {
  background: #f97316;
}

.alert-item.info .alert-dot {
  background: #0ea5e9;
}

.alert-msg {
  font-size: 12px;
  color: #244950;
}

.alert-time {
  font-size: 11px;
  color: #728d93;
}
</style>
