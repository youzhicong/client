<template>
  <div class="echarts-page">
    <header class="page-hero">
      <div class="hero-left">
        <span class="hero-kicker">ECharts Dashboard</span>
        <h1 class="hero-title">运营概览</h1>
        <p class="hero-desc">
          示例数据展示趋势、结构与对比，支持响应式自适应。
        </p>
      </div>
      <div class="hero-right">
        <div class="hero-stat">
          <span class="stat-label">今日访问</span>
          <span class="stat-value">28,640</span>
        </div>
        <div class="hero-stat">
          <span class="stat-label">转化率</span>
          <span class="stat-value">4.7%</span>
        </div>
      </div>
    </header>

    <section class="grid grid-top">
      <div class="card card-large">
        <div class="card-header">
          <h3>近七日访问趋势</h3>
          <span class="card-subtitle">UV / PV 双轴对比</span>
        </div>
        <div ref="lineChartRef" class="chart-box"></div>
      </div>
      <div class="card card-small">
        <div class="card-header">
          <h3>渠道占比</h3>
          <span class="card-subtitle">流量来源</span>
        </div>
        <div ref="pieChartRef" class="chart-box"></div>
      </div>
    </section>

    <section class="grid grid-bottom">
      <div class="card card-medium">
        <div class="card-header">
          <h3>区域分布</h3>
          <span class="card-subtitle">Top 5 城市</span>
        </div>
        <div ref="barChartRef" class="chart-box"></div>
      </div>
      <div class="card card-medium">
        <div class="card-header">
          <h3>业务健康度</h3>
          <span class="card-subtitle">关键指标</span>
        </div>
        <div class="metric-grid">
          <div class="metric">
            <span class="metric-label">活跃用户</span>
            <span class="metric-value">12,980</span>
            <span class="metric-trend up">+6.2%</span>
          </div>
          <div class="metric">
            <span class="metric-label">订单完成率</span>
            <span class="metric-value">91.4%</span>
            <span class="metric-trend up">+2.1%</span>
          </div>
          <div class="metric">
            <span class="metric-label">异常告警</span>
            <span class="metric-value">4</span>
            <span class="metric-trend down">-1.3%</span>
          </div>
          <div class="metric">
            <span class="metric-label">平均响应</span>
            <span class="metric-value">238ms</span>
            <span class="metric-trend down">-0.8%</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'

const lineChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
const barChartRef = ref<HTMLDivElement | null>(null)

let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

const initLineChart = () => {
  if (!lineChartRef.value) return
  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['UV', 'PV'], top: 6 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#cbd5f5' } },
      axisLabel: { color: '#475569' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#e2e8f0' } }
    },
    series: [
      {
        name: 'UV',
        type: 'line',
        smooth: true,
        data: [8200, 9320, 9010, 10420, 11920, 12800, 13100],
        symbolSize: 6,
        lineStyle: { width: 3, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37, 99, 235, 0.35)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0.05)' }
          ])
        }
      },
      {
        name: 'PV',
        type: 'line',
        smooth: true,
        data: [15200, 16800, 16000, 17600, 19800, 20600, 21400],
        symbolSize: 6,
        lineStyle: { width: 3, color: '#f97316' },
        itemStyle: { color: '#f97316' }
      }
    ]
  })
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: 42, name: '自然搜索' },
          { value: 24, name: '投放广告' },
          { value: 18, name: '社媒引流' },
          { value: 16, name: '老客回访' }
        ],
        color: ['#22c55e', '#3b82f6', '#f97316', '#a855f7']
      }
    ]
  })
}

const initBarChart = () => {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'category',
      data: ['上海', '北京', '深圳', '杭州', '成都'],
      axisLine: { lineStyle: { color: '#cbd5f5' } },
      axisLabel: { color: '#475569' }
    },
    series: [
      {
        type: 'bar',
        data: [1820, 1760, 1580, 1320, 980],
        barWidth: 16,
        itemStyle: {
          borderRadius: 8,
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#06b6d4' },
            { offset: 1, color: '#3b82f6' }
          ])
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
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pieChart?.dispose()
  barChart?.dispose()
})
</script>

<style lang="scss" scoped>
.echarts-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background:
    radial-gradient(
      circle at 10% 20%,
      rgba(14, 116, 144, 0.12),
      transparent 45%
    ),
    radial-gradient(
      circle at 90% 10%,
      rgba(59, 130, 246, 0.12),
      transparent 40%
    ),
    linear-gradient(135deg, #f8fafc, #eef2ff);
}

.page-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 20px;
  background: linear-gradient(120deg, #0f172a, #1e293b);
  color: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
  margin-bottom: 24px;
}

.hero-kicker {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 14px 0 6px;
  font-size: 30px;
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  color: rgba(226, 232, 240, 0.78);
  font-size: 14px;
}

.hero-right {
  display: grid;
  gap: 14px;
}

.hero-stat {
  background: rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 14px 18px;
  min-width: 160px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  margin-top: 6px;
}

.grid {
  display: grid;
  gap: 20px;
}

.grid-top {
  grid-template-columns: 2fr 1fr;
  margin-bottom: 20px;
}

.grid-bottom {
  grid-template-columns: 1fr 1fr;
}

.card {
  background: #fff;
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.card-large {
  min-height: 340px;
}

.card-small {
  min-height: 340px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #0f172a;
  }
}

.card-subtitle {
  font-size: 12px;
  color: #64748b;
}

.chart-box {
  flex: 1;
  min-height: 240px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 6px;
}

.metric {
  background: #f8fafc;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.metric-value {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.metric-trend {
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.metric-trend.up {
  background: #dcfce7;
  color: #15803d;
}

.metric-trend.down {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 1200px) {
  .grid-top {
    grid-template-columns: 1fr;
  }
  .grid-bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .echarts-page {
    padding: 16px;
  }
  .page-hero {
    flex-direction: column;
  }
  .hero-right {
    grid-template-columns: 1fr 1fr;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
