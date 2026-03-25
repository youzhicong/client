<template>
  <div class="vending-monitor-page">
    <div class="bg-orb orb-a"></div>
    <div class="bg-orb orb-b"></div>

    <div class="page-header panel">
      <div class="header-info">
        <span class="header-badge">SMART RETAIL</span>
        <h1 class="header-title">智能贩卖机监控中心</h1>
        <p class="header-desc">
          实时查看设备状态、库存健康度、销售趋势和告警信息
        </p>
      </div>

      <div class="header-actions">
        <div class="machine-status" :class="monitorData.machine.status">
          <span class="status-dot"></span>
          <span>{{ machineStatusText }}</span>
        </div>

        <button class="action-btn" :disabled="refreshing" @click="refreshData">
          <span class="btn-icon">↻</span>
          {{ refreshing ? '刷新中...' : '立即刷新' }}
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card panel">
        <span class="stat-label">今日销售额</span>
        <strong class="stat-value">{{
          formatCurrency(monitorData.sales.todayRevenue)
        }}</strong>
        <span class="stat-sub">销量 {{ monitorData.sales.todaySales }} 单</span>
      </div>

      <div class="stat-card panel">
        <span class="stat-label">库存健康度</span>
        <strong class="stat-value">{{ stockHealth }}%</strong>
        <span class="stat-sub">低库存 {{ lowStockCount }} 个货道</span>
      </div>

      <div class="stat-card panel">
        <span class="stat-label">设备温度</span>
        <strong class="stat-value"
          >{{ monitorData.machine.temperature.toFixed(1) }}°C</strong
        >
        <span class="stat-sub">运行 {{ uptimeDays }} 天</span>
      </div>

      <div class="stat-card panel">
        <span class="stat-label">当前告警</span>
        <strong class="stat-value">{{ monitorData.alerts.length }}</strong>
        <span class="stat-sub">严重 {{ severeAlertCount }} 条</span>
      </div>
    </div>

    <div class="main-content">
      <div class="scene-card panel">
        <div class="scene-header">
          <div>
            <h2>{{ monitorData.machine.name }}</h2>
            <p class="machine-meta">
              {{ monitorData.machine.id }} · {{ monitorData.machine.location }}
            </p>
          </div>
          <div class="scene-tags">
            <span class="tag"
              >温控 {{ monitorData.machine.temperature.toFixed(1) }}°C</span
            >
            <span class="tag"
              >维护 {{ monitorData.machine.lastMaintenance }}</span
            >
          </div>
        </div>

        <div class="scene-view">
          <VendingMachine3D :products="monitorData.products" />
        </div>

        <div class="scene-footer">
          <div class="scene-tips">
            <span>左键拖拽旋转</span>
            <span>滚轮缩放</span>
            <span>右键平移</span>
          </div>
          <span class="updated-time">更新时间：{{ lastUpdatedText }}</span>
        </div>
      </div>

      <div class="panel-container panel">
        <MonitorPanel :data="monitorData" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import VendingMachine3D from './components/VendingMachine3D.vue'
import MonitorPanel from './components/MonitorPanel.vue'
import {
  getVendingMonitor,
  type VendingMonitorData as MonitorData
} from '@/services/vending'

const route = useRoute()
const monitorData = ref<MonitorData>({
  machine: {
    id: '',
    name: '',
    location: '',
    status: 'offline',
    temperature: 0,
    uptime: 0,
    lastMaintenance: ''
  },
  products: [],
  sales: {
    todaySales: 0,
    todayRevenue: 0,
    weekSales: [],
    topProducts: []
  },
  alerts: []
})
const refreshing = ref(false)
const lastUpdated = ref(new Date())
let updateInterval: ReturnType<typeof setInterval>

const machineStatusText = computed(() => {
  const map = {
    online: '设备在线',
    offline: '设备离线',
    warning: '设备告警'
  }
  return map[monitorData.value.machine.status]
})

const lowStockCount = computed(
  () =>
    monitorData.value.products.filter(
      (item) => item.stock > 0 && item.stock <= 2
    ).length
)

const severeAlertCount = computed(
  () =>
    monitorData.value.alerts.filter(
      (item) => item.type === 'error' || item.type === 'warning'
    ).length
)

const stockHealth = computed(() => {
  const total = monitorData.value.products.reduce(
    (sum, item) => sum + item.stock,
    0
  )
  const max = monitorData.value.products.reduce(
    (sum, item) => sum + item.maxStock,
    0
  )
  if (max === 0) return 0
  return Math.round((total / max) * 100)
})

const uptimeDays = computed(() =>
  Math.floor(monitorData.value.machine.uptime / 24)
)

const lastUpdatedText = computed(() =>
  lastUpdated.value.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
)

const formatCurrency = (value: number) => `￥${value.toLocaleString('zh-CN')}`

const fetchMonitorData = async () => {
  const machineId =
    typeof route.query.id === 'string' ? route.query.id.trim() : ''
  const response = await getVendingMonitor(machineId || undefined)
  if (response.code !== 200) return
  monitorData.value = response.data
  lastUpdated.value = new Date()
}

const refreshData = () => {
  refreshing.value = true
  void fetchMonitorData().finally(() => {
    refreshing.value = false
  })
}

onMounted(() => {
  void fetchMonitorData()
  updateInterval = setInterval(() => {
    void fetchMonitorData()
  }, 30000)
})

onUnmounted(() => {
  clearInterval(updateInterval)
})
</script>

<style lang="scss" scoped>
.vending-monitor-page {
  --bg-main: #f3f8f7;
  --panel: rgba(255, 255, 255, 0.82);
  --panel-solid: #ffffff;
  --line: #d8e8e7;
  --text-main: #17343b;
  --text-sub: #627f85;
  --brand: #0f9d92;
  --accent: #ef7f38;
  --danger: #dc2626;
  --ok: #16a34a;
  --shadow: 0 20px 40px rgba(23, 52, 59, 0.12);

  position: relative;
  min-height: calc(100vh - 64px);
  overflow: hidden;
  padding: 24px;
  color: var(--text-main);
  font-family: 'Space Grotesk', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(circle at 12% -10%, #d9f5f2 0%, transparent 42%),
    radial-gradient(circle at 100% 12%, #ffe8d9 0%, transparent 36%),
    var(--bg-main);
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(2px);
}

.orb-a {
  right: -80px;
  top: -140px;
  width: 280px;
  height: 280px;
  opacity: 0.45;
  background: linear-gradient(135deg, #b5f3ed, #ffd7be);
}

.orb-b {
  left: -120px;
  bottom: -180px;
  width: 340px;
  height: 340px;
  opacity: 0.4;
  background: linear-gradient(135deg, #c0e9ff, #aff4d8);
}

.panel {
  border: 1px solid var(--line);
  border-radius: 20px;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
  background: var(--panel);
}

.page-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
}

.header-info {
  max-width: 620px;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #b9ddd8;
  background: #e8f8f5;
  color: #0f7e75;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.header-title {
  margin: 10px 0 6px;
  font-size: 30px;
  line-height: 1.1;
  color: var(--text-main);
}

.header-desc {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.machine-status {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  border: 1px solid #cde3e1;
  color: var(--text-sub);
  background: #f5fbfa;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.machine-status.online {
  color: #166534;
  border-color: #bbf7d0;
  background: #ecfdf3;
}

.machine-status.online .status-dot {
  background: var(--ok);
  box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.15);
}

.machine-status.warning {
  color: #b45309;
  border-color: #fed7aa;
  background: #fff7ed;
}

.machine-status.warning .status-dot {
  background: var(--accent);
}

.machine-status.offline {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fef2f2;
}

.machine-status.offline .status-dot {
  background: var(--danger);
}

.action-btn {
  height: 36px;
  padding: 0 16px;
  border: 1px solid #9fd3cc;
  border-radius: 12px;
  background: linear-gradient(135deg, #11a69a, #0f8f84);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(15, 143, 132, 0.25);
}

.action-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
  line-height: 1;
}

.stats-grid {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.78);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-sub);
}

.stat-value {
  font-size: 26px;
  line-height: 1.05;
  color: var(--text-main);
}

.stat-sub {
  font-size: 12px;
  color: #7a959a;
}

.main-content {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 16px;
  min-height: calc(100vh - 318px);
}

.scene-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
}

.scene-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid #d6e8e6;
  background: rgba(255, 255, 255, 0.7);
}

.scene-header h2 {
  margin: 0;
  font-size: 18px;
}

.machine-meta {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.scene-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.tag {
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid #d5e6e4;
  background: #f5fbfa;
  color: #3f6267;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
}

.scene-view {
  flex: 1;
  min-height: 480px;
}

.scene-footer {
  padding: 10px 14px;
  border-top: 1px solid #d6e8e6;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.scene-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #607b80;
  font-size: 12px;
}

.updated-time {
  font-size: 12px;
  color: #5d7a7f;
  white-space: nowrap;
}

.panel-container {
  overflow: hidden;
  padding: 12px;
  background: rgba(255, 255, 255, 0.74);
}

@media (max-width: 1350px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-content {
    grid-template-columns: 1fr;
  }

  .panel-container {
    min-height: 420px;
  }
}

@media (max-width: 760px) {
  .vending-monitor-page {
    padding: 14px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .scene-header {
    flex-direction: column;
  }

  .scene-tags {
    justify-content: flex-start;
  }

  .scene-view {
    min-height: 380px;
  }

  .scene-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
