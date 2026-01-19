<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="hero-pattern"></div>
        <div class="hero-glow"></div>
      </div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            系统运行正常
          </div>
          <h1 class="hero-title">
            {{ greeting }}，欢迎回来 <span class="wave">👋</span>
          </h1>
          <p class="hero-desc">
            今天是 <strong>{{ currentDate }}</strong
            >，您有 <span class="highlight">{{ totalUnread }}</span> 条未读消息
          </p>
        </div>
        <div class="hero-right">
          <div class="time-display">
            <div class="time-value">{{ currentTime }}</div>
            <div class="time-label">当前时间</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Grid -->
    <section class="stats-section">
      <div
        v-for="(stat, index) in statCards"
        :key="stat.key"
        class="stat-card"
        :style="{ '--index': index }"
      >
        <div class="stat-icon" :style="{ background: stat.gradient }">
          <span>{{ stat.icon }}</span>
        </div>
        <div class="stat-body">
          <div class="stat-value">
            <span class="value-num">{{ stat.value }}</span>
            <span class="value-trend" :class="stat.trend > 0 ? 'up' : 'down'">
              {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
            </span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-sub">{{ stat.sub }}</div>
        </div>
        <div class="stat-chart">
          <svg viewBox="0 0 60 30" class="mini-chart">
            <polyline
              :points="stat.chartPoints"
              fill="none"
              :stroke="stat.color"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>

    <!-- Charts Area -->
    <section class="charts-section">
      <div class="chart-card chart-main">
        <div class="chart-header">
          <div class="chart-title">
            <h3>周使用趋势</h3>
            <span class="chart-subtitle">最近7天数据</span>
          </div>
          <div class="chart-actions">
            <button
              v-for="(tab, i) in ['本周', '本月', '本年']"
              :key="i"
              class="chart-tab"
              :class="{ active: activeTab === i }"
              @click="activeTab = i"
            >
              {{ tab }}
            </button>
          </div>
        </div>
        <div class="chart-body">
          <div class="bar-chart">
            <div v-for="(day, idx) in weekData" :key="idx" class="bar-group">
              <div class="bar-stack">
                <div
                  class="bar bar-drag"
                  :style="{
                    height: day.drag + '%',
                    '--delay': idx * 0.08 + 's'
                  }"
                ></div>
                <div
                  class="bar bar-im"
                  :style="{
                    height: day.im + '%',
                    '--delay': idx * 0.08 + 0.1 + 's'
                  }"
                ></div>
                <div
                  class="bar bar-map"
                  :style="{
                    height: day.map + '%',
                    '--delay': idx * 0.08 + 0.2 + 's'
                  }"
                ></div>
                <div
                  class="bar bar-preview"
                  :style="{
                    height: day.preview + '%',
                    '--delay': idx * 0.08 + 0.3 + 's'
                  }"
                ></div>
              </div>
              <div class="bar-label">{{ day.label }}</div>
            </div>
          </div>
          <div class="chart-legend">
            <span class="legend-item"
              ><span class="dot dot-drag"></span>表单</span
            >
            <span class="legend-item"
              ><span class="dot dot-im"></span>通信</span
            >
            <span class="legend-item"
              ><span class="dot dot-map"></span>地图</span
            >
            <span class="legend-item"
              ><span class="dot dot-preview"></span>预览</span
            >
          </div>
        </div>
      </div>

      <div class="chart-card chart-side">
        <div class="chart-header">
          <h3>使用分布</h3>
        </div>
        <div class="donut-container">
          <svg class="donut-svg" viewBox="0 0 140 140">
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              cx="70"
              cy="70"
              r="54"
              fill="none"
              :stroke="seg.color"
              stroke-width="24"
              :stroke-dasharray="seg.dash"
              :stroke-dashoffset="seg.offset"
              class="donut-segment"
              :style="{ '--delay': i * 0.15 + 's' }"
            />
          </svg>
          <div class="donut-center">
            <div class="donut-value">100%</div>
            <div class="donut-label">总使用</div>
          </div>
        </div>
        <div class="donut-legend">
          <div v-for="item in donutData" :key="item.name" class="legend-row">
            <span class="legend-dot" :style="{ background: item.color }"></span>
            <span class="legend-name">{{ item.name }}</span>
            <span class="legend-pct">{{ item.value }}%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Section -->
    <section class="bottom-section">
      <div class="card activity-card">
        <div class="card-header">
          <h3>最近动态</h3>
          <button class="link-btn">查看全部 →</button>
        </div>
        <div class="activity-list">
          <div
            v-for="(act, i) in activities"
            :key="i"
            class="activity-item"
            :style="{ '--delay': i * 0.06 + 's' }"
          >
            <div class="activity-icon" :class="act.type">{{ act.icon }}</div>
            <div class="activity-content">
              <div class="activity-text">{{ act.text }}</div>
              <div class="activity-meta">
                <span class="activity-time">{{ act.time }}</span>
                <span class="activity-tag">{{ act.tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card quick-card">
        <div class="card-header">
          <h3>快捷入口</h3>
        </div>
        <div class="quick-grid">
          <router-link
            v-for="(q, i) in quickLinks"
            :key="q.path"
            :to="q.path"
            class="quick-link"
            :class="q.theme"
            :style="{ '--delay': i * 0.08 + 's' }"
          >
            <span class="quick-icon">{{ q.icon }}</span>
            <span class="quick-name">{{ q.label }}</span>
            <span class="quick-arrow">→</span>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useImStore } from '@/stores'
import { storeToRefs } from 'pinia'

const imStore = useImStore()
const { totalUnread } = storeToRefs(imStore)

const currentDate = ref('')
const currentTime = ref('')
const activeTab = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const updateClock = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const statCards = computed(() => {
  const msgCount = Object.values(imStore.messages).reduce(
    (s, m) => s + m.length,
    0
  )
  return [
    {
      key: 'drag',
      icon: '📋',
      label: '表单构建',
      value: 12,
      sub: '48 个组件',
      trend: 12,
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#6366f1',
      chartPoints: '0,20 10,15 20,18 30,10 40,14 50,8 60,12'
    },
    {
      key: 'im',
      icon: '💬',
      label: '即时通信',
      value: msgCount,
      sub: `${imStore.conversations.length} 个会话`,
      trend: 8,
      gradient: 'linear-gradient(135deg, #22c55e, #4ade80)',
      color: '#22c55e',
      chartPoints: '0,15 10,20 20,12 30,18 40,10 50,16 60,8'
    },
    {
      key: 'map',
      icon: '🗺️',
      label: '地图标记',
      value: 24,
      sub: '156 次搜索',
      trend: 15,
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      color: '#f59e0b',
      chartPoints: '0,18 10,12 20,20 30,8 40,16 50,10 60,14'
    },
    {
      key: 'preview',
      icon: '📄',
      label: '文件预览',
      value: 38,
      sub: '6 种类型',
      trend: -3,
      gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
      color: '#ec4899',
      chartPoints: '0,10 10,16 20,12 30,20 40,14 50,18 60,15'
    }
  ]
})

const weekData = ref([
  { label: '周一', drag: 65, im: 80, map: 45, preview: 30 },
  { label: '周二', drag: 72, im: 68, map: 55, preview: 42 },
  { label: '周三', drag: 58, im: 90, map: 62, preview: 35 },
  { label: '周四', drag: 85, im: 75, map: 48, preview: 58 },
  { label: '周五', drag: 78, im: 85, map: 70, preview: 45 },
  { label: '周六', drag: 45, im: 55, map: 82, preview: 28 },
  { label: '周日', drag: 38, im: 48, map: 75, preview: 22 }
])

const donutData = ref([
  { name: '表单构建', value: 32, color: '#6366f1' },
  { name: '即时通信', value: 28, color: '#22c55e' },
  { name: '地图菜单', value: 24, color: '#f59e0b' },
  { name: '文件预览', value: 16, color: '#ec4899' }
])

const donutSegments = computed(() => {
  const circ = 2 * Math.PI * 54
  let acc = 0
  return donutData.value.map((d) => {
    const len = (d.value / 100) * circ
    const seg = {
      color: d.color,
      dash: `${len} ${circ - len}`,
      offset: -acc + circ / 4
    }
    acc += len
    return seg
  })
})

const activities = ref([
  {
    icon: '📋',
    type: 'drag',
    text: '创建了新表单「用户反馈收集」',
    time: '10 分钟前',
    tag: '表单'
  },
  {
    icon: '💬',
    type: 'im',
    text: '收到来自「产品讨论组」的 3 条新消息',
    time: '25 分钟前',
    tag: '消息'
  },
  {
    icon: '🗺️',
    type: 'map',
    text: '在地图上标记了「北京天安门」',
    time: '1 小时前',
    tag: '地图'
  },
  {
    icon: '📄',
    type: 'preview',
    text: '预览了文件「年度报告.pdf」',
    time: '2 小时前',
    tag: '文件'
  },
  {
    icon: '💬',
    type: 'im',
    text: '与「视觉设计 · Alice」完成了对话',
    time: '3 小时前',
    tag: '消息'
  }
])

const quickLinks = [
  { path: '/drag', icon: '📋', label: '表单构建', theme: 'q-drag' },
  { path: '/im', icon: '💬', label: '即时通信', theme: 'q-im' },
  { path: '/map', icon: '🗺️', label: '地图菜单', theme: 'q-map' },
  { path: '/preview', icon: '📄', label: '文件预览', theme: 'q-preview' }
]
</script>

<style lang="scss" scoped>
.home-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 32px 36px;
  border-radius: 24px;
  margin-bottom: 24px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  z-index: 0;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.05) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
}

.hero-glow {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: radial-gradient(
    ellipse,
    rgba(99, 102, 241, 0.15) 0%,
    transparent 70%
  );
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 999px;
  color: #4ade80;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: dotPulse 2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
}

.hero-title {
  margin: 0 0 10px;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.wave {
  display: inline-block;
  animation: wave 2s ease-in-out infinite;
  transform-origin: 70% 70%;
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(20deg);
  }
  50% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(20deg);
  }
}

.hero-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;

  strong {
    color: #fff;
  }
  .highlight {
    color: #a5b4fc;
    font-weight: 600;
  }
}

.time-display {
  text-align: right;
}

.time-value {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.time-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
  animation: fadeUp 0.5s ease backwards;
  animation-delay: calc(var(--index) * 0.1s);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
    border-color: #e2e8f0;
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 26px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.value-num {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.value-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;

  &.up {
    background: #ecfdf5;
    color: #16a34a;
  }
  &.down {
    background: #fef2f2;
    color: #dc2626;
  }
}

.stat-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-top: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.stat-chart {
  width: 60px;
  height: 30px;
  opacity: 0.8;
}

.mini-chart {
  width: 100%;
  height: 100%;
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }
}

.chart-subtitle {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
  margin-left: 8px;
}

.chart-actions {
  display: flex;
  gap: 6px;
}

.chart-tab {
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
  }
  &.active {
    background: linear-gradient(135deg, #1e293b, #334155);
    color: #fff;
    box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
  }
}

.bar-chart {
  display: flex;
  justify-content: space-between;
  height: 180px;
  margin-bottom: 16px;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.bar-stack {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 150px;
}

.bar {
  width: 12px;
  border-radius: 6px 6px 0 0;
  animation: barGrow 0.6s ease backwards;
  animation-delay: var(--delay);
  transition: height 0.3s ease;
}

@keyframes barGrow {
  from {
    height: 0 !important;
  }
}

.bar-drag {
  background: linear-gradient(180deg, #6366f1, #818cf8);
}
.bar-im {
  background: linear-gradient(180deg, #22c55e, #4ade80);
}
.bar-map {
  background: linear-gradient(180deg, #f59e0b, #fbbf24);
}
.bar-preview {
  background: linear-gradient(180deg, #ec4899, #f472b6);
}

.bar-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 4px;

  &.dot-drag {
    background: #6366f1;
  }
  &.dot-im {
    background: #22c55e;
  }
  &.dot-map {
    background: #f59e0b;
  }
  &.dot-preview {
    background: #ec4899;
  }
}

/* Donut Chart */
.donut-container {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto 20px;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-segment {
  animation: donutDraw 1s ease forwards;
  animation-delay: var(--delay);
  stroke-dashoffset: 339.29 !important;
}

@keyframes donutDraw {
  to {
    stroke-dashoffset: attr(stroke-dashoffset);
  }
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.donut-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
}

.donut-label {
  font-size: 12px;
  color: #94a3b8;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.legend-name {
  flex: 1;
  color: #475569;
}

.legend-pct {
  font-weight: 600;
  color: #1e293b;
}

/* Bottom Section */
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.link-btn {
  border: none;
  background: none;
  color: #6366f1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #4f46e5;
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  transition: all 0.25s ease;
  animation: slideIn 0.4s ease backwards;
  animation-delay: var(--delay);

  &:hover {
    background: #f1f5f9;
    transform: translateX(6px);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.activity-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;

  &.drag {
    background: #eef2ff;
  }
  &.im {
    background: #ecfdf5;
  }
  &.map {
    background: #fffbeb;
  }
  &.preview {
    background: #fdf2f8;
  }
}

.activity-content {
  flex: 1;
  min-width: 0;
}
.activity-text {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}
.activity-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}
.activity-time {
  font-size: 11px;
  color: #94a3b8;
}
.activity-tag {
  font-size: 10px;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #6366f1;
  border-radius: 999px;
  font-weight: 500;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  animation: fadeUp 0.4s ease backwards;
  animation-delay: var(--delay);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);

    .quick-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }
}

.quick-icon {
  font-size: 28px;
}
.quick-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.quick-arrow {
  color: #94a3b8;
  opacity: 0;
  transition: all 0.2s ease;
}

.q-drag {
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
}
.q-im {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
}
.q-map {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}
.q-preview {
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 16px;
  }
  .stats-section {
    grid-template-columns: 1fr;
  }
  .bottom-section {
    grid-template-columns: 1fr;
  }
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  .hero-title {
    font-size: 24px;
  }
}
</style>
