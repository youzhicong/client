<template>
  <div class="vending-monitor-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-info">
        <span class="header-badge">3D Monitor</span>
        <h1 class="header-title">自动贩卖机监控</h1>
        <p class="header-desc">实时查看设备状态、库存和销售数据</p>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="refreshData">
          <span class="btn-icon">🔄</span>
          刷新数据
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 3D 场景 -->
      <div class="scene-container">
        <div class="scene-card">
          <div class="scene-header">
            <h2>{{ monitorData.machine.name }}</h2>
            <span class="machine-id">{{ monitorData.machine.id }}</span>
          </div>
          <VendingMachine3D :products="monitorData.products" />
          <div class="scene-tips">
            <span>🖱️ 拖拽旋转</span>
            <span>🔍 滚轮缩放</span>
          </div>
        </div>
      </div>

      <!-- 监控面板 -->
      <div class="panel-container">
        <MonitorPanel :data="monitorData" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import VendingMachine3D from './components/VendingMachine3D.vue'
import MonitorPanel from './components/MonitorPanel.vue'
import { mockMonitorData, updateMockData } from './mockData'
import type { MonitorData } from './types'

const monitorData = ref<MonitorData>({ ...mockMonitorData })
let updateInterval: ReturnType<typeof setInterval>

// 刷新数据
const refreshData = () => {
  monitorData.value = updateMockData(monitorData.value)
}

onMounted(() => {
  // 模拟实时数据更新
  updateInterval = setInterval(() => {
    monitorData.value = updateMockData(monitorData.value)
  }, 5000)
})

onUnmounted(() => {
  clearInterval(updateInterval)
})
</script>

<style lang="scss" scoped>
.vending-monitor-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.15),
    rgba(139, 92, 246, 0.1)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  margin-bottom: 24px;
}

.header-badge {
  display: inline-block;
  padding: 5px 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #60a5fa;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.header-title {
  margin: 12px 0 6px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  color: #60a5fa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
  }

  .btn-icon {
    font-size: 16px;
  }
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  height: calc(100vh - 220px);
}

.scene-container {
  display: flex;
  flex-direction: column;
}

.scene-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
}

.scene-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .machine-id {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-family: monospace;
  }
}

.scene-tips {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.panel-container {
  height: 100%;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    height: auto;
  }

  .scene-card {
    min-height: 500px;
  }

  .panel-container {
    height: auto;
  }
}

@media (max-width: 768px) {
  .vending-monitor-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;

    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
