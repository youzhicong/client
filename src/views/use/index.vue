<template>
  <div class="profile-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <header class="hero panel">
      <div class="identity">
        <div class="avatar-shell">
          <img
            class="avatar"
            src="https://api.dicebear.com/9.x/notionists/svg?seed=LiWenxin"
            alt="avatar"
          />
          <span class="live-dot"></span>
        </div>

        <div class="identity-main">
          <span class="hero-badge">PERSONAL CENTER</span>
          <h1>李文心</h1>
          <p>产品设计师 · 数字化平台 · 上海</p>

          <div class="tags">
            <el-tag type="success" effect="light">成长型账号</el-tag>
            <el-tag type="info" effect="light">最近活跃 2 分钟前</el-tag>
            <el-tag type="warning" effect="light">安全等级 A</el-tag>
          </div>
        </div>
      </div>

      <div class="hero-actions">
        <el-button type="primary" @click="onAction('资料编辑')"
          >编辑资料</el-button
        >
        <el-button @click="onAction('账号设置')">账号设置</el-button>
        <el-button type="success" plain @click="onAction('导出档案')"
          >导出档案</el-button
        >
      </div>
    </header>

    <section class="metric-grid">
      <article
        v-for="(item, index) in metrics"
        :key="item.label"
        class="metric-card panel"
        :style="{ '--delay': `${index * 0.05}s` }"
      >
        <span class="metric-icon">{{ item.icon }}</span>
        <div class="metric-main">
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </div>
        <span class="metric-delta" :class="item.trend">{{ item.delta }}</span>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel profile-card">
        <div class="panel-head">
          <h2>个人资料</h2>
          <el-button link type="primary" @click="onAction('管理资料')"
            >管理资料</el-button
          >
        </div>

        <div class="profile-list">
          <div
            v-for="item in profileItems"
            :key="item.label"
            class="profile-item"
          >
            <span class="label">{{ item.label }}</span>
            <span class="value">{{ item.value }}</span>
            <span class="state" :class="item.stateClass">{{ item.state }}</span>
          </div>
        </div>

        <div class="switch-list">
          <div class="switch-item">
            <div>
              <strong>站内消息通知</strong>
              <p>系统更新、协作提醒和审批消息</p>
            </div>
            <el-switch v-model="notifyEnabled" />
          </div>

          <div class="switch-item">
            <div>
              <strong>每周摘要邮件</strong>
              <p>每周五发送工作数据汇总</p>
            </div>
            <el-switch v-model="digestEnabled" />
          </div>
        </div>
      </article>

      <article class="panel security-card">
        <div class="panel-head">
          <h2>安全中心</h2>
          <el-button link type="primary" @click="onAction('安全策略')"
            >安全策略</el-button
          >
        </div>

        <div class="score-block">
          <div class="score-ring" :style="{ '--score': `${securityScore}%` }">
            <span>{{ securityScore }}</span>
          </div>
          <div>
            <strong class="score-title"
              >账号安全评分 {{ securityLevel }}</strong
            >
            <p>已开启 4/5 项防护，建议尽快完成邮箱验证。</p>
          </div>
        </div>

        <div class="security-list">
          <div
            v-for="item in securityItems"
            :key="item.title"
            class="security-item"
          >
            <span class="dot" :class="item.state"></span>
            <div class="security-main">
              <strong>{{ item.title }}</strong>
              <p>{{ item.desc }}</p>
            </div>
            <el-button size="small" @click="onAction(item.action)">{{
              item.action
            }}</el-button>
          </div>
        </div>
      </article>

      <article class="panel assets-card">
        <div class="panel-head">
          <h2>我的资产</h2>
          <el-button link type="primary" @click="onAction('查看账单')"
            >全部记录</el-button
          >
        </div>

        <div class="asset-grid">
          <div v-for="item in assets" :key="item.title" class="asset-item">
            <span class="asset-icon">{{ item.icon }}</span>
            <div>
              <div class="asset-title">{{ item.title }}</div>
              <div class="asset-value">{{ item.value }}</div>
              <div class="asset-foot">{{ item.foot }}</div>
            </div>
          </div>
        </div>

        <div class="storage-row">
          <div class="storage-head">
            <span>云存储使用率</span>
            <span>{{ storageUsed }}%</span>
          </div>
          <div class="storage-bar">
            <div
              class="storage-fill"
              :style="{ width: `${storageUsed}%` }"
            ></div>
          </div>
        </div>
      </article>

      <article class="panel timeline-card">
        <div class="panel-head">
          <h2>近期动态</h2>
          <el-button link type="primary" @click="onAction('查看日志')"
            >查看日志</el-button
          >
        </div>

        <ul class="timeline-list">
          <li v-for="item in activities" :key="item.id" class="timeline-item">
            <span class="time">{{ item.time }}</span>
            <div class="content">
              <strong>{{ item.title }}</strong>
              <p>{{ item.desc }}</p>
            </div>
            <el-tag size="small" effect="light">{{ item.tag }}</el-tag>
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type Trend = 'up' | 'down' | 'flat'

type MetricItem = {
  label: string
  value: string
  delta: string
  trend: Trend
  icon: string
}

type ProfileItem = {
  label: string
  value: string
  state: string
  stateClass: 'ok' | 'warn' | 'vip'
}

type SecurityItem = {
  title: string
  desc: string
  state: 'ok' | 'warn'
  action: string
}

type AssetItem = {
  title: string
  value: string
  foot: string
  icon: string
}

type ActivityItem = {
  id: string
  time: string
  title: string
  desc: string
  tag: string
}

const notifyEnabled = ref(true)
const digestEnabled = ref(false)
const securityScore = ref(92)
const storageUsed = ref(48)

const metrics: MetricItem[] = [
  { label: '本月登录', value: '28 次', delta: '+12%', trend: 'up', icon: '🛰️' },
  { label: '工单处理', value: '16 项', delta: '+4%', trend: 'up', icon: '🧩' },
  { label: '消息提醒', value: '5 条', delta: '-2', trend: 'down', icon: '🔔' },
  { label: '项目协作', value: '7 个', delta: '+1', trend: 'up', icon: '🧠' }
]

const profileItems: ProfileItem[] = [
  {
    label: '手机号',
    value: '+86 138 **** 8899',
    state: '已验证',
    stateClass: 'ok'
  },
  {
    label: '邮箱',
    value: 'wenxin.li@platform.com',
    state: '待验证',
    stateClass: 'warn'
  },
  {
    label: '企业',
    value: 'Digital Platform Studio',
    state: '已认证',
    stateClass: 'ok'
  },
  {
    label: '会员等级',
    value: '高级会员',
    state: '有效至 2026-12',
    stateClass: 'vip'
  }
]

const securityItems: SecurityItem[] = [
  {
    title: '登录保护',
    desc: '最近一次登录：上海 · Chrome',
    state: 'ok',
    action: '查看'
  },
  {
    title: '邮箱验证',
    desc: '用于找回账号与接收通知',
    state: 'warn',
    action: '去验证'
  },
  {
    title: '设备管理',
    desc: '当前已绑定 3 台设备',
    state: 'ok',
    action: '管理'
  },
  {
    title: '风险扫描',
    desc: '本周未发现异常登录行为',
    state: 'ok',
    action: '详情'
  }
]

const assets: AssetItem[] = [
  { title: '积分', value: '2,480', foot: '近 30 天 +120', icon: '🎯' },
  { title: '优惠券', value: '3 张', foot: '本月将过期 1 张', icon: '🎟️' },
  { title: '订阅', value: '专业版', foot: '续费日期 2026/12/22', icon: '📦' },
  { title: '云存储', value: '2.4 / 5 GB', foot: '剩余 52%', icon: '💾' }
]

const activities: ActivityItem[] = [
  {
    id: 'a1',
    time: '2 分钟前',
    title: '完成表单搭建',
    desc: '《用户反馈》项目已发布并通知团队成员。',
    tag: '项目'
  },
  {
    id: 'a2',
    time: '1 小时前',
    title: '更新头像',
    desc: '新头像已同步到控制台和协作空间。',
    tag: '账号'
  },
  {
    id: 'a3',
    time: '昨天',
    title: '创建团队空间',
    desc: '新增 4 位协作者，已分配初始权限。',
    tag: '协作'
  },
  {
    id: 'a4',
    time: '2 天前',
    title: '修改密码',
    desc: '系统已更新安全策略并启用二次校验。',
    tag: '安全'
  }
]

const securityLevel = computed(() => {
  if (securityScore.value >= 90) return '优秀'
  if (securityScore.value >= 75) return '良好'
  return '一般'
})

const onAction = (name: string) => {
  ElMessage.success(`${name}功能已触发`)
}
</script>

<style lang="scss" scoped>
.profile-page {
  --bg-main: #eef5f4;
  --panel-bg: rgba(255, 255, 255, 0.86);
  --line: #d6e5e3;
  --text-main: #183a40;
  --text-sub: #6d888d;
  --brand: #11838a;
  --brand-deep: #0f6f75;
  --danger: #dc2626;
  --warn: #d97706;
  --success: #16a34a;
  --shadow: 0 20px 40px rgba(20, 58, 66, 0.12);

  min-height: calc(100vh - 60px);
  position: relative;
  overflow: hidden;
  padding: 22px;
  color: var(--text-main);
  background:
    radial-gradient(circle at 8% 8%, #d6efea 0%, transparent 36%),
    radial-gradient(circle at 92% 10%, #ffe8d4 0%, transparent 30%),
    var(--bg-main);
  font-family: 'Space Grotesk', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  filter: blur(30px);
  opacity: 0.4;
  pointer-events: none;
}

.shape-a {
  width: 260px;
  height: 260px;
  right: -90px;
  top: -70px;
  background: #b9e5ef;
}

.shape-b {
  width: 220px;
  height: 220px;
  left: -60px;
  bottom: 100px;
  background: #c9f1df;
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.hero {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

.identity {
  display: flex;
  gap: 16px;
  align-items: center;
}

.avatar-shell {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 24px;
  overflow: hidden;
  border: 2px solid #d0e8e5;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-dot {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #11838a 0%, #2d77cf 100%);
}

.identity-main h1 {
  margin: 10px 0 6px;
  font-size: 30px;
  line-height: 1.1;
}

.identity-main p {
  margin: 0;
  font-size: 13px;
  color: var(--text-sub);
}

.tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.metric-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: rise 0.45s ease both;
  animation-delay: var(--delay);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 20px;
  background: #ebf8f7;
}

.metric-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.metric-main strong {
  font-size: 22px;
  line-height: 1.1;
}

.metric-main span {
  margin-top: 4px;
  color: var(--text-sub);
  font-size: 12px;
}

.metric-delta {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.metric-delta.up {
  color: #166534;
  background: #dcfce7;
}

.metric-delta.down {
  color: #991b1b;
  background: #fee2e2;
}

.metric-delta.flat {
  color: #92400e;
  background: #fef3c7;
}

.content-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.profile-card,
.security-card,
.assets-card,
.timeline-card {
  padding: 16px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-head h2 {
  margin: 0;
  font-size: 18px;
}

.profile-list {
  display: grid;
  gap: 10px;
}

.profile-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f7fbfb;
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 10px;
  align-items: center;
}

.profile-item .label {
  color: var(--text-sub);
  font-size: 12px;
}

.profile-item .value {
  font-size: 13px;
  font-weight: 600;
}

.state {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.state.ok {
  color: #166534;
  background: #dcfce7;
}

.state.warn {
  color: #92400e;
  background: #fef3c7;
}

.state.vip {
  color: #0f766e;
  background: #ccfbf1;
}

.switch-list {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.switch-item {
  border: 1px solid #dce9e8;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.switch-item strong {
  font-size: 13px;
}

.switch-item p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.score-block {
  padding: 12px;
  border-radius: 14px;
  background: #f4fbfa;
  display: flex;
  gap: 14px;
  align-items: center;
}

.score-ring {
  --score: 0%;

  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(#22c55e 0 var(--score), #dbe9e7 var(--score) 100%);
}

.score-ring span {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  color: #166534;
  font-weight: 700;
}

.score-title {
  font-size: 14px;
}

.score-block p {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.security-list {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.security-item {
  border: 1px solid #dce8e7;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.dot.ok {
  background: #16a34a;
}

.dot.warn {
  background: #d97706;
}

.security-main {
  flex: 1;
}

.security-main strong {
  font-size: 13px;
}

.security-main p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.asset-item {
  border: 1px solid #dce9e7;
  border-radius: 12px;
  background: #f8fcfc;
  padding: 10px;
  display: flex;
  gap: 10px;
}

.asset-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: #e6f5f4;
}

.asset-title {
  font-size: 12px;
  color: var(--text-sub);
}

.asset-value {
  margin-top: 3px;
  font-size: 16px;
  font-weight: 700;
}

.asset-foot {
  margin-top: 3px;
  font-size: 11px;
  color: #8ca3a8;
}

.storage-row {
  margin-top: 12px;
}

.storage-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-sub);
}

.storage-bar {
  margin-top: 8px;
  height: 8px;
  background: #dbe8e6;
  border-radius: 999px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #11838a 0%, #2f6ed8 100%);
  transition: width 0.35s ease;
}

.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.timeline-item {
  border: 1px solid #dce8e7;
  border-radius: 12px;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  background: #f9fcfc;
}

.time {
  font-size: 11px;
  color: var(--text-sub);
}

.content strong {
  font-size: 13px;
}

.content p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-sub);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1280px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .profile-page {
    padding: 14px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .identity-main h1 {
    font-size: 24px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .asset-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .profile-item,
  .timeline-item {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .switch-item,
  .security-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
