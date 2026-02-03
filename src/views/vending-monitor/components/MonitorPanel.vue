<template>
  <div class="monitor-panel">
    <!-- 设备状态 -->
    <div class="panel-card">
      <div class="card-header">
        <h3>设备状态</h3>
        <span :class="['status-badge', data.machine.status]">
          {{ statusText }}
        </span>
      </div>
      <div class="card-body">
        <div class="stat-row">
          <span class="label">设备编号</span>
          <span class="value">{{ data.machine.id }}</span>
        </div>
        <div class="stat-row">
          <span class="label">位置</span>
          <span class="value">{{ data.machine.location }}</span>
        </div>
        <div class="stat-row">
          <span class="label">温度</span>
          <span class="value">{{ data.machine.temperature.toFixed(1) }}°C</span>
        </div>
        <div class="stat-row">
          <span class="label">运行时长</span>
          <span class="value">{{ Math.floor(data.machine.uptime / 24) }} 天</span>
        </div>
      </div>
    </div>

    <!-- 销售统计 -->
    <div class="panel-card">
      <div class="card-header">
        <h3>今日销售</h3>
      </div>
      <div class="card-body">
        <div class="sales-grid">
          <div class="sales-item">
            <span class="sales-value">{{ data.sales.todaySales }}</span>
            <span class="sales-label">销售笔数</span>
          </div>
          <div class="sales-item">
            <span class="sales-value">¥{{ data.sales.todayRevenue }}</span>
            <span class="sales-label">销售金额</span>
          </div>
        </div>
        <div class="top-products">
          <h4>热销商品</h4>
          <div v-for="item in data.sales.topProducts" :key="item.name" class="top-item">
            <span class="name">{{ item.name }}</span>
            <span class="count">{{ item.count }} 件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 库存状态 -->
    <div class="panel-card">
      <div class="card-header">
        <h3>库存状态</h3>
      </div>
      <div class="card-body stock-list">
        <div v-for="product in sortedProducts" :key="product.id" class="stock-item">
          <div class="stock-info">
            <span class="name">{{ product.name }}</span>
            <span class="count">{{ product.stock }}/{{ product.maxStock }}</span>
          </div>
          <div class="stock-bar">
            <div
              class="stock-fill"
              :style="{
                width: `${(product.stock / product.maxStock) * 100}%`,
                backgroundColor: getStockColor(product.stock, product.maxStock),
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 告警信息 -->
    <div class="panel-card">
      <div class="card-header">
        <h3>告警信息</h3>
        <span class="alert-count" v-if="warningCount > 0">{{ warningCount }}</span>
      </div>
      <div class="card-body">
        <div v-if="data.alerts.length === 0" class="no-alerts">暂无告警</div>
        <div v-for="alert in data.alerts" :key="alert.id" :class="['alert-item', alert.type]">
          <span class="alert-icon">
            {{ alert.type === 'error' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵' }}
          </span>
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
  const map = { online: '在线', offline: '离线', warning: '告警' }
  return map[props.data.machine.status]
})

const sortedProducts = computed(() => {
  return [...props.data.products].sort((a, b) => a.stock / a.maxStock - b.stock / b.maxStock)
})

const warningCount = computed(() => {
  return props.data.alerts.filter((a) => a.type === 'warning' || a.type === 'error').length
})

const getStockColor = (stock: number, max: number) => {
  const ratio = stock / max
  if (ratio <= 0.2) return '#ef4444'
  if (ratio <= 0.5) return '#f97316'
  return '#22c55e'
}
</script>

<style lang="scss" scoped>
.monitor-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
}

.panel-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }
}

.card-body {
  padding: 12px 16px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.online {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }
  &.offline {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  &.warning {
    background: rgba(249, 115, 22, 0.2);
    color: #f97316;
  }
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 32px;

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
    flex-shrink: 0;
  }
  .value {
    color: #fff;
    font-weight: 500;
    text-align: right;
    word-break: keep-all;
    white-space: nowrap;
  }
}

.sales-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.sales-item {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  padding: 12px;
  text-align: center;

  .sales-value {
    display: block;
    font-size: 22px;
    font-weight: 700;
    color: #3b82f6;
  }
  .sales-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.top-products {
  h4 {
    margin: 0 0 8px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.top-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;

  .name {
    color: #fff;
  }
  .count {
    color: rgba(255, 255, 255, 0.6);
  }
}

.stock-list {
  max-height: 200px;
  overflow-y: auto;
}

.stock-item {
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.stock-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;

  .name {
    color: #fff;
  }
  .count {
    color: rgba(255, 255, 255, 0.6);
  }
}

.stock-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.stock-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.alert-count {
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.no-alerts {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  text-align: center;
  padding: 12px 0;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  .alert-icon {
    font-size: 10px;
  }
  .alert-msg {
    flex: 1;
    color: #fff;
  }
  .alert-time {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
  }
}
</style>
