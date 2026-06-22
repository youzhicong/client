<template>
  <PageShell class="vending-monitor-page">
    <template #hero>
      <PageHero
        badge="SMART RETAIL"
        title="智能贩卖机监控中心"
        description="实时查看设备状态、库存健康度、销售趋势和告警信息"
      >
        <template #actions>
          <div class="monitor-hero-actions">
            <div class="machine-status" :class="monitorData.machine.status">
              <span class="status-dot"></span>
              <span>{{ machineStatusText }}</span>
            </div>
            <el-button
              type="primary"
              :loading="refreshing"
              @click="refreshData"
            >
              立即刷新
            </el-button>
          </div>
        </template>
      </PageHero>
    </template>

    <template #stats>
      <PageStatGrid :columns="4">
        <PageStatCard
          label="今日销售额"
          :value="formatCurrency(monitorData.sales.todayRevenue)"
        />
        <PageStatCard label="库存健康度" :value="`${stockHealth}%`" />
        <PageStatCard
          label="设备温度"
          :value="`${monitorData.machine.temperature.toFixed(1)}°C`"
        />
        <PageStatCard
          label="当前告警"
          :value="monitorData.alerts.length"
          :tone="severeAlertCount ? 'warning' : undefined"
        />
      </PageStatGrid>
    </template>

    <div class="main-content">
      <PagePanel body-class="monitor-scene-body">
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
      </PagePanel>

      <PagePanel body-class="monitor-panel-body">
        <MonitorPanel :data="monitorData" />
      </PagePanel>
    </div>
  </PageShell>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHero from '@/components/page/PageHero.vue'
import PagePanel from '@/components/page/PagePanel.vue'
import PageShell from '@/components/page/PageShell.vue'
import PageStatCard from '@/components/page/PageStatCard.vue'
import PageStatGrid from '@/components/page/PageStatGrid.vue'
import VendingMachine3D from './components/VendingMachine3D.vue'
import MonitorPanel from './components/MonitorPanel.vue'
import {
  getVendingMonitor,
  type VendingMonitorData as MonitorData
} from '@/services/vending'
import { getApiErrorMessage } from '@/utils/request'

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
  try {
    const response = await getVendingMonitor(machineId || undefined)
    monitorData.value = response.data
    lastUpdated.value = new Date()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '获取监控数据失败'))
  }
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
@use '@/style/page-shell.scss';

.vending-monitor-page {
  --text-sub: #627f85;
  --accent: #ef7f38;
  --danger: #dc2626;
  --ok: #16a34a;
}

.monitor-hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

.main-content {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 16px;
  min-height: calc(100vh - 318px);
}

:deep(.monitor-scene-body) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

:deep(.monitor-panel-body) {
  padding: 12px;
  min-height: 420px;
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

@media (max-width: 1350px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .monitor-hero-actions {
    width: 100%;
    justify-content: space-between;
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
