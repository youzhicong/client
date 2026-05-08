<template>
  <div class="home-dashboard">
    <section class="top-overview">
      <article class="overview-card spotlight-card">
        <div class="overview-copy">
          <span class="overview-kicker">Daily Focus</span>
          <h2>今天的增长势能保持在稳定区间</h2>
          <p>
            推荐优先关注流量结构和业务健康度，两项指标已经具备联动分析价值。
          </p>
        </div>
        <div class="overview-metrics">
          <div class="overview-metric">
            <span>核心转化</span>
            <strong>28.4%</strong>
          </div>
          <div class="overview-metric">
            <span>服务可用性</span>
            <strong>99.92%</strong>
          </div>
        </div>
      </article>

      <article class="overview-card activity-card">
        <div class="activity-head">
          <span class="overview-kicker muted">Live Feed</span>
          <strong>协作动态</strong>
        </div>
        <ul class="activity-list">
          <li>数据面板已完成今日第 3 次同步</li>
          <li>直播模块转化率较昨日提升 6.8%</li>
          <li>用户中心页面在移动端表现稳定</li>
        </ul>
      </article>
    </section>

    <section class="hero-panel panel">
      <div class="hero-main">
        <span class="hero-kicker">Control Center</span>
        <h1 class="hero-title">数字运营驾驶舱</h1>
        <p class="hero-desc">
          聚合访问、转化、区域和服务健康度，让常用业务数据在一个首页里快速形成判断。
        </p>
        <div class="hero-actions">
          <button
            class="hero-btn primary"
            type="button"
            @click="openBusinessHub"
          >
            进入业务中台
          </button>
          <button
            class="hero-btn secondary"
            type="button"
            @click="viewBusinessSuggestions"
          >
            查看业务建议
          </button>
        </div>
      </div>

      <div class="hero-stats">
        <div v-for="item in heroStats" :key="item.label" class="hero-stat-card">
          <span class="stat-label">{{ item.label }}</span>
          <strong class="stat-value">{{ item.value }}</strong>
          <span class="stat-delta" :class="item.deltaTone">{{
            item.delta
          }}</span>
        </div>
      </div>
    </section>

    <section class="insight-strip">
      <article
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
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel chart-panel chart-panel-wide">
        <div class="card-header">
          <div>
            <p class="eyebrow">Traffic trend</p>
            <h3>近七日访问趋势</h3>
          </div>
          <span class="card-subtitle">UV / PV 双轴对比</span>
        </div>
        <div ref="lineChartRef" class="chart-box"></div>
      </article>

      <article class="panel chart-panel">
        <div class="card-header">
          <div>
            <p class="eyebrow">Channels</p>
            <h3>流量来源结构</h3>
          </div>
          <span class="card-subtitle">渠道贡献占比</span>
        </div>
        <div class="source-body">
          <div ref="pieChartRef" class="chart-box pie-box"></div>
          <div class="source-list">
            <div
              v-for="item in channelData"
              :key="item.name"
              class="source-item"
            >
              <span class="dot" :style="{ background: item.color }"></span>
              <span class="name">{{ item.name }}</span>
              <span class="value">{{ item.value }}%</span>
            </div>
          </div>
        </div>
      </article>

      <article class="panel chart-panel">
        <div class="card-header">
          <div>
            <p class="eyebrow">Cities</p>
            <h3>区域活跃分布</h3>
          </div>
          <span class="card-subtitle">Top 5 城市</span>
        </div>
        <div ref="barChartRef" class="chart-box"></div>
      </article>

      <article class="panel chart-panel">
        <div class="card-header">
          <div>
            <p class="eyebrow">Health</p>
            <h3>业务健康度</h3>
          </div>
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
      </article>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  getHomeDashboard,
  type HomeChannelItem,
  type HomeHealthMetric,
  type HomeHeroStat,
  type HomeKpiCard,
  type HomeRegionItem
} from '@/services/homeDashboard'

const router = useRouter()
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

const openBusinessHub = () => {
  router.push('/business-hub')
}

const viewBusinessSuggestions = () => {
  router.push({ path: '/business-hub', hash: '#business-backlog' })
}

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
  if (response.code !== 200) return

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

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.94)',
  borderColor: 'rgba(148, 163, 184, 0.22)',
  textStyle: { color: '#e2e8f0' }
}

const initLineChart = () => {
  if (!lineChartRef.value) return

  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    grid: { left: 24, right: 20, top: 40, bottom: 26 },
    tooltip: { trigger: 'axis', ...tooltipStyle },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#64748b' }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: weekDays.value,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#64748b' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.14)' } },
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
        lineStyle: { width: 3, color: '#1d4ed8' },
        itemStyle: { color: '#1d4ed8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(29, 78, 216, 0.28)' },
            { offset: 1, color: 'rgba(29, 78, 216, 0.02)' }
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
        lineStyle: { width: 3, color: '#0f766e' },
        itemStyle: { color: '#0f766e' }
      }
    ]
  })
}

const initPieChart = () => {
  if (!pieChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%', ...tooltipStyle },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['45%', '50%'],
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
        left: '45%',
        top: '42%',
        style: {
          text: '渠道\n分布',
          textAlign: 'center',
          fill: '#334155',
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 22
        }
      }
    ]
  })
}

const initBarChart = () => {
  if (!barChartRef.value) return

  barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    grid: { left: 52, right: 20, top: 20, bottom: 20 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.14)' } },
      axisLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: regionData.value.map((item) => item.name),
      axisLabel: { color: '#475569' },
      axisTick: { show: false },
      axisLine: { show: false }
    },
    series: [
      {
        type: 'bar',
        data: regionData.value.map((item) => item.value),
        barWidth: 16,
        itemStyle: {
          borderRadius: 999,
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#38bdf8' },
            { offset: 1, color: '#1d4ed8' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          color: '#64748b',
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
  min-height: calc(100vh - 72px);
  padding: 28px;
  color: var(--app-text-main);
}

.top-overview {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 16px;
  margin-bottom: 18px;
}

.overview-card {
  border: 1px solid var(--app-border);
  border-radius: 24px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
  backdrop-filter: blur(18px);
}

.spotlight-card {
  padding: 22px 24px;
  display: grid;
  grid-template-columns: 1.2fr auto;
  gap: 18px;
  background:
    radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.16), transparent 26%),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.86),
      rgba(255, 255, 255, 0.62)
    );
}

.overview-copy h2 {
  margin: 12px 0 10px;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.overview-copy p {
  margin: 0;
  max-width: 640px;
  color: var(--app-text-sub);
  line-height: 1.75;
  font-size: 14px;
}

.overview-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.overview-kicker.muted {
  background: rgba(15, 23, 42, 0.06);
}

.overview-metrics {
  display: grid;
  gap: 12px;
  min-width: 180px;
}

.overview-metric {
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  gap: 6px;

  span {
    color: var(--app-text-sub);
    font-size: 12px;
  }

  strong {
    font-size: 28px;
    line-height: 1;
  }
}

.activity-card {
  padding: 22px;
}

.activity-head {
  display: flex;
  flex-direction: column;
  gap: 10px;

  strong {
    font-size: 22px;
    line-height: 1.1;
  }
}

.activity-list {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;

  li {
    position: relative;
    padding: 12px 14px 12px 34px;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.04);
    color: var(--app-text-sub);
    line-height: 1.6;

    &::before {
      content: '';
      position: absolute;
      left: 14px;
      top: 18px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--app-accent);
      box-shadow: 0 0 0 6px rgba(29, 78, 216, 0.08);
    }
  }
}

.panel {
  border: 1px solid var(--app-border);
  border-radius: 28px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
  backdrop-filter: blur(18px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 18px;
  padding: 24px;
  background:
    radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.12), transparent 28%),
    radial-gradient(
      circle at 100% 20%,
      rgba(29, 78, 216, 0.14),
      transparent 30%
    ),
    var(--app-surface);
}

.hero-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-kicker,
.eyebrow {
  margin: 0;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 26px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 16px 0 10px;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.hero-desc {
  max-width: 720px;
  margin: 0;
  color: var(--app-text-sub);
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
}

.hero-btn {
  min-width: 124px;
  height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.hero-btn.primary {
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 16px 26px rgba(29, 78, 216, 0.2);
}

.hero-btn.secondary {
  background: rgba(255, 255, 255, 0.68);
  border-color: var(--app-border);
  color: var(--app-text-main);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hero-stat-card {
  padding: 18px;
  border-radius: 22px;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label,
.kpi-label,
.card-subtitle,
.health-meta .label,
.source-item .name {
  color: var(--app-text-sub);
}

.stat-value {
  font-size: 28px;
  line-height: 1;
}

.stat-delta,
.kpi-trend,
.health-trend {
  width: fit-content;
  min-height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.up {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.down {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.insight-strip {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  padding: 18px;
  position: relative;
  overflow: hidden;
}

.kpi-card::after {
  content: '';
  position: absolute;
  inset: auto -20% -42px auto;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  opacity: 0.16;
}

.kpi-card.teal::after {
  background: #14b8a6;
}
.kpi-card.orange::after {
  background: #f59e0b;
}
.kpi-card.navy::after {
  background: #2563eb;
}
.kpi-card.green::after {
  background: #22c55e;
}

.kpi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.kpi-tag {
  min-height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: var(--app-text-main);
  font-size: 11px;
  font-weight: 700;
}

.kpi-value {
  display: block;
  margin-top: 18px;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.03em;
}

.kpi-trend {
  margin-top: 16px;
}

.dashboard-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

.chart-panel {
  min-height: 320px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chart-panel-wide {
  min-height: 360px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 8px 0 0;
  font-size: 22px;
  line-height: 1.15;
}

.card-subtitle {
  font-size: 12px;
}

.chart-box {
  flex: 1;
  min-height: 230px;
}

.source-body {
  display: grid;
  grid-template-columns: 1fr 136px;
  gap: 10px;
  flex: 1;
}

.source-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.source-item {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.source-item .value,
.health-meta .value {
  color: var(--app-text-main);
  font-weight: 700;
}

.health-list {
  display: grid;
  gap: 12px;
}

.health-item {
  padding: 14px;
  border-radius: 18px;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
}

.health-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.16);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
}

.health-trend {
  margin-top: 8px;
}

@media (max-width: 1380px) {
  .top-overview {
    grid-template-columns: 1fr;
  }

  .insight-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .home-dashboard {
    padding: 16px;
  }

  .spotlight-card {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .insight-strip {
    grid-template-columns: 1fr;
  }

  .source-body {
    grid-template-columns: 1fr;
  }
}
</style>
