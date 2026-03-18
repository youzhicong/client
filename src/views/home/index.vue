<template>
  <div class="home-dashboard">
    <div class="bg-grid"></div>
    <div class="bg-glow glow-a"></div>
    <div class="bg-glow glow-b"></div>

    <div class="hero-panel panel">
      <div class="hero-left">
        <span class="hero-kicker">DIGITAL OPS</span>
        <h1 class="hero-title">数字化运营驾驶舱</h1>
        <p class="hero-desc">
          聚合访问、转化、区域和服务稳定性，帮助你在一个页面完成全局判断。
        </p>
      </div>

      <div class="hero-right">
        <div v-for="item in heroStats" :key="item.label" class="hero-stat">
          <span class="stat-label">{{ item.label }}</span>
          <strong class="stat-value">{{ item.value }}</strong>
          <span class="stat-delta" :class="item.deltaTone">{{ item.delta }}</span>
        </div>
      </div>
    </div>

    <div class="kpi-strip">
      <div
        v-for="item in kpiCards"
        :key="item.label"
        class="kpi-card panel"
        :class="item.tone"
      >
        <div class="kpi-head">
          <span class="kpi-label">{{ item.label }}</span>
          <span class="kpi-tag">{{ item.tag }}</span>
        </div>
        <strong class="kpi-value">{{ item.value }}</strong>
        <span class="kpi-trend" :class="item.trendTone">{{ item.trend }}</span>
      </div>
    </div>

    <div class="charts-grid">
      <div class="panel chart-panel">
        <div class="card-header">
          <h3>近七日访问趋势</h3>
          <span class="card-subtitle">UV / PV 双轴对比</span>
        </div>
        <div ref="lineChartRef" class="chart-box"></div>
      </div>

      <div class="panel chart-panel">
        <div class="card-header">
          <h3>流量来源结构</h3>
          <span class="card-subtitle">渠道贡献占比</span>
        </div>
        <div class="source-body">
          <div ref="pieChartRef" class="chart-box pie-box"></div>
          <div class="source-list">
            <div v-for="item in channelData" :key="item.name" class="source-item">
              <span class="dot" :style="{ background: item.color }"></span>
              <span class="name">{{ item.name }}</span>
              <span class="value">{{ item.value }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel chart-panel">
        <div class="card-header">
          <h3>区域活跃分布</h3>
          <span class="card-subtitle">Top 5 城市</span>
        </div>
        <div ref="barChartRef" class="chart-box"></div>
      </div>

      <div class="panel chart-panel">
        <div class="card-header">
          <h3>业务健康度</h3>
          <span class="card-subtitle">关键指标监测</span>
        </div>

        <div class="health-list">
          <div
            v-for="metric in healthMetrics"
            :key="metric.label"
            class="health-item"
          >
            <div class="health-meta">
              <span class="label">{{ metric.label }}</span>
              <span class="value">{{ metric.value }}</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{
                  width: `${metric.progress}%`,
                  background: metric.color
                }"
              ></div>
            </div>
            <span class="health-trend" :class="metric.trendTone">{{
              metric.trend
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import {
  getHomeDashboard,
  type HomeChannelItem,
  type HomeHealthMetric,
  type HomeHeroStat,
  type HomeKpiCard,
  type HomeRegionItem
} from '@/services/homeDashboard'

const lineChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
const barChartRef = ref<HTMLDivElement | null>(null)

const heroStats = ref<HomeHeroStat[]>([])
const weekDays = ref<string[]>([])
const uvData = ref<number[]>([])
const pvData = ref<number[]>([])
const channelData = ref<HomeChannelItem[]>([])
const regionData = ref<HomeRegionItem[]>([])
const kpiCards = ref<HomeKpiCard[]>([])
const healthMetrics = ref<HomeHealthMetric[]>([])

let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

const renderCharts = () => {
  lineChart?.setOption({
    xAxis: { data: weekDays.value },
    series: [
      { name: 'UV', data: uvData.value },
      { name: 'PV', data: pvData.value }
    ]
  })

  pieChart?.setOption({
    series: [
      {
        data: channelData.value.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        }))
      }
    ]
  })

  barChart?.setOption({
    yAxis: { data: regionData.value.map((item) => item.name) },
    series: [{ data: regionData.value.map((item) => item.value) }]
  })
}

const loadDashboard = async () => {
  const response = await getHomeDashboard()
  if (response.code !== 10000) return

  heroStats.value = response.data.heroStats
  weekDays.value = response.data.weekDays
  uvData.value = response.data.uvData
  pvData.value = response.data.pvData
  channelData.value = response.data.channelData
  regionData.value = response.data.regionData
  kpiCards.value = response.data.kpiCards
  healthMetrics.value = response.data.healthMetrics
  renderCharts()
}

const initLineChart = () => {
  if (!lineChartRef.value) return

  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    grid: { left: 36, right: 16, top: 42, bottom: 26 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 40, 60, 0.92)',
      borderColor: 'rgba(140, 180, 200, 0.35)',
      textStyle: { color: '#e6f2ff' }
    },
    legend: {
      top: 4,
      right: 6,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#5d7a83' }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: weekDays.value,
      axisLine: { lineStyle: { color: '#cfe0e0' } },
      axisLabel: { color: '#5f7880' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#7b949b' },
      splitLine: { lineStyle: { color: '#e4f0ef' } },
      axisLine: { show: false }
    },
    series: [
      {
        name: 'UV',
        type: 'line',
        smooth: true,
        data: uvData.value,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 3, color: '#0f9d92' },
        itemStyle: { color: '#0f9d92' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(15, 157, 146, 0.32)' },
            { offset: 1, color: 'rgba(15, 157, 146, 0.03)' }
          ])
        }
      },
      {
        name: 'PV',
        type: 'line',
        smooth: true,
        data: pvData.value,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 3, color: '#ef7f38' },
        itemStyle: { color: '#ef7f38' }
      }
    ]
  })
}

const initPieChart = () => {
  if (!pieChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
      backgroundColor: 'rgba(20, 40, 60, 0.92)',
      borderColor: 'rgba(140, 180, 200, 0.35)',
      textStyle: { color: '#e6f2ff' }
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['44%', '48%'],
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderWidth: 3,
          borderColor: '#ffffff'
        },
        data: channelData.value.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        }))
      }
    ],
    graphic: [
      {
        type: 'text',
        left: '44%',
        top: '42%',
        style: {
          text: '渠道\n分布',
          textAlign: 'center',
          fill: '#355b62',
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 20
        }
      }
    ]
  })
}

const initBarChart = () => {
  if (!barChartRef.value) return

  barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    grid: { left: 52, right: 20, top: 22, bottom: 20 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(20, 40, 60, 0.92)',
      borderColor: 'rgba(140, 180, 200, 0.35)',
      textStyle: { color: '#e6f2ff' }
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#6b868c' },
      splitLine: { lineStyle: { color: '#e5f0ef' } },
      axisLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: regionData.value.map((item) => item.name),
      axisLabel: { color: '#49656b' },
      axisTick: { show: false },
      axisLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: regionData.value.map((item) => item.value),
        barWidth: 16,
        itemStyle: {
          borderRadius: 12,
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#2f7de1' },
            { offset: 1, color: '#54b5ff' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          color: '#607b81',
          fontSize: 11
        }
      }
    ]
  })
}

const handleResize = () => {
  lineChart?.resize()
  pieChart?.resize()
  barChart?.resize()
}

onMounted(() => {
  initLineChart()
  initPieChart()
  initBarChart()
  void loadDashboard()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pieChart?.dispose()
  barChart?.dispose()
  lineChart = null
  pieChart = null
  barChart = null
})
</script>

<style lang="scss" scoped>
.home-dashboard {
  --bg: #eff7f5;
  --panel: rgba(255, 255, 255, 0.82);
  --line: #d7e9e6;
  --text-main: #173941;
  --text-sub: #6b868c;
  --brand: #0f9d92;
  --brand-2: #ef7f38;
  --shadow: 0 20px 44px rgba(23, 57, 65, 0.12);

  position: relative;
  min-height: calc(100vh - 64px);
  overflow: hidden;
  padding: 24px;
  background:
    radial-gradient(circle at 100% 6%, #ffe8d9 0%, transparent 36%),
    radial-gradient(circle at 4% 0%, #d8f3f0 0%, transparent 40%), var(--bg);
  color: var(--text-main);
  font-family: 'Space Grotesk', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.bg-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;
  background-image:
    linear-gradient(rgba(22, 73, 85, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(22, 73, 85, 0.05) 1px, transparent 1px);
  background-size: 26px 26px;
}

.bg-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(3px);
  pointer-events: none;
}

.glow-a {
  width: 300px;
  height: 300px;
  right: -120px;
  top: -120px;
  opacity: 0.42;
  background: linear-gradient(135deg, #b4f2ec, #ffd9bf);
}

.glow-b {
  width: 320px;
  height: 320px;
  left: -140px;
  bottom: -190px;
  opacity: 0.38;
  background: linear-gradient(135deg, #bce8ff, #aef4d3);
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 24px;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #bae0dc;
  background: #e9f9f7;
  color: #0c7f75;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.hero-title {
  margin: 12px 0 8px;
  font-size: 32px;
  line-height: 1.08;
}

.hero-desc {
  margin: 0;
  max-width: 640px;
  color: var(--text-sub);
  font-size: 14px;
}

.hero-right {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 310px;
}

.hero-stat {
  border: 1px solid #d8e9e7;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6d878d;
}

.stat-value {
  font-size: 24px;
  line-height: 1;
}

.stat-delta {
  font-size: 12px;
  font-weight: 600;
}

.stat-delta.up {
  color: #15803d;
}

.stat-delta.down {
  color: #b91c1c;
}

.kpi-strip {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  padding: 14px 16px;
}

.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-label {
  font-size: 12px;
  color: #6a858b;
}

.kpi-tag {
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.kpi-card.teal .kpi-tag {
  color: #0e756d;
  background: #dcf8f4;
}

.kpi-card.orange .kpi-tag {
  color: #b45309;
  background: #ffedd5;
}

.kpi-card.navy .kpi-tag {
  color: #1d4ed8;
  background: #dbeafe;
}

.kpi-card.green .kpi-tag {
  color: #166534;
  background: #dcfce7;
}

.kpi-value {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
}

.kpi-trend {
  display: inline-flex;
  margin-top: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.kpi-trend.up {
  background: #dcfce7;
  color: #15803d;
}

.kpi-trend.down {
  background: #fee2e2;
  color: #b91c1c;
}

.charts-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 14px;
}

.chart-panel {
  min-height: 320px;
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 17px;
}

.card-subtitle {
  font-size: 12px;
  color: #6f8a90;
}

.chart-box {
  flex: 1;
  min-height: 220px;
}

.source-body {
  display: grid;
  grid-template-columns: 1fr 130px;
  gap: 10px;
  flex: 1;
}

.pie-box {
  min-height: 230px;
}

.source-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.source-item {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.source-item .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.source-item .name {
  color: #4a686f;
}

.source-item .value {
  color: #1f444c;
  font-weight: 700;
}

.health-list {
  margin-top: 4px;
  display: grid;
  gap: 12px;
}

.health-item {
  border: 1px solid #dbeaea;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  padding: 10px;
}

.health-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.health-meta .label {
  font-size: 12px;
  color: #69858b;
}

.health-meta .value {
  font-size: 13px;
  color: #1d4149;
  font-weight: 700;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: #e5f1f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
}

.health-trend {
  margin-top: 6px;
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
}

.health-trend.up {
  color: #15803d;
}

.health-trend.down {
  color: #b91c1c;
}

@media (max-width: 1320px) {
  .kpi-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .home-dashboard {
    padding: 14px;
  }

  .hero-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-right {
    width: 100%;
    min-width: 0;
    grid-template-columns: 1fr;
  }

  .kpi-strip {
    grid-template-columns: 1fr;
  }

  .source-body {
    grid-template-columns: 1fr;
  }
}
</style>
