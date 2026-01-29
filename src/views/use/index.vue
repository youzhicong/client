<template>
  <div class="user-center">
    <section class="hero">
      <div class="hero-card">
        <div class="hero-main">
          <div class="avatar-wrap">
            <img
              class="avatar"
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=yzc-user"
              alt="avatar"
            />
            <span class="badge">PRO</span>
          </div>
          <div class="hero-info">
            <div class="name-row">
              <h1>李文心</h1>
              <span class="status online">在线</span>
            </div>
            <p class="sub">产品设计师 · 数据平台 · 上海</p>
            <div class="tags">
              <span>成长型账号</span>
              <span>最近活跃 2 分钟前</span>
              <span>安全等级 A</span>
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn primary">编辑资料</button>
          <button class="btn ghost">账号设置</button>
        </div>
      </div>

      <div class="hero-metrics">
        <div v-for="item in metrics" :key="item.label" class="metric-card">
          <div class="metric-icon">{{ item.icon }}</div>
          <div class="metric-info">
            <div class="metric-value">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
          <div class="metric-trend" :class="item.trend">
            {{ item.delta }}
          </div>
        </div>
      </div>
    </section>

    <section class="grid">
      <div class="panel profile">
        <div class="panel-header">
          <h2>个人资料</h2>
          <button class="link-btn">管理资料</button>
        </div>
        <div class="profile-list">
          <div class="profile-item">
            <span class="label">手机号</span>
            <span class="value">+86 138 **** 8899</span>
            <span class="status ok">已验证</span>
          </div>
          <div class="profile-item">
            <span class="label">邮箱</span>
            <span class="value">wenxin.li@yzc.com</span>
            <span class="status warn">需验证</span>
          </div>
          <div class="profile-item">
            <span class="label">企业</span>
            <span class="value">Y Z C Studio</span>
            <span class="status ok">已认证</span>
          </div>
          <div class="profile-item">
            <span class="label">账号等级</span>
            <span class="value">高级会员</span>
            <span class="status vip">有效期 2026.01</span>
          </div>
        </div>
      </div>

      <div class="panel security">
        <div class="panel-header">
          <h2>安全中心</h2>
          <button class="link-btn">安全策略</button>
        </div>
        <div class="security-score">
          <div class="score-ring">
            <span>92</span>
          </div>
          <div class="score-desc">
            <div class="score-title">安全评分</div>
            <p>已开启 4/5 项防护，建议完成邮箱验证。</p>
          </div>
        </div>
        <div class="security-list">
          <div
            v-for="item in securityList"
            :key="item.title"
            class="security-item"
          >
            <span class="dot" :class="item.state"></span>
            <div class="security-info">
              <div class="security-title">{{ item.title }}</div>
              <div class="security-desc">{{ item.desc }}</div>
            </div>
            <button class="mini-btn">{{ item.action }}</button>
          </div>
        </div>
      </div>

      <div class="panel assets">
        <div class="panel-header">
          <h2>我的资产</h2>
          <button class="link-btn">全部记录</button>
        </div>
        <div class="asset-grid">
          <div v-for="item in assets" :key="item.title" class="asset-card">
            <div class="asset-icon">{{ item.icon }}</div>
            <div class="asset-info">
              <div class="asset-title">{{ item.title }}</div>
              <div class="asset-value">{{ item.value }}</div>
            </div>
            <div class="asset-foot">{{ item.foot }}</div>
          </div>
        </div>
      </div>

      <div class="panel activity">
        <div class="panel-header">
          <h2>近期动态</h2>
          <button class="link-btn">查看日志</button>
        </div>
        <ul class="activity-list">
          <li v-for="item in activities" :key="item.time" class="activity-item">
            <span class="activity-time">{{ item.time }}</span>
            <div class="activity-content">
              <div class="activity-title">{{ item.title }}</div>
              <div class="activity-desc">{{ item.desc }}</div>
            </div>
            <span class="activity-tag">{{ item.tag }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
const metrics = [
  { label: '本月登录', value: '28 次', delta: '+12%', trend: 'up', icon: '⚡' },
  { label: '工单处理', value: '16 项', delta: '+4%', trend: 'up', icon: '🧩' },
  { label: '消息提醒', value: '5 条', delta: '-2', trend: 'down', icon: '🔔' },
  { label: '项目协作', value: '7 个', delta: '+1', trend: 'up', icon: '🧑‍🤝‍🧑' }
]

const securityList = [
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
  { title: '设备管理', desc: '已绑定 3 台设备', state: 'ok', action: '管理' },
  { title: '风险扫描', desc: '本周未发现异常', state: 'ok', action: '详情' }
]

const assets = [
  { title: '积分', value: '2,480', foot: '近 30 天 +120', icon: '✨' },
  { title: '优惠券', value: '3 张', foot: '本月将过期 1 张', icon: '🎫' },
  { title: '订阅', value: '专业版', foot: '续费日期 2026/01/22', icon: '💎' },
  { title: '云存储', value: '2.4 / 5 GB', foot: '剩余 52%', icon: '☁️' }
]

const activities = [
  {
    time: '2 分钟前',
    title: '完成表单搭建',
    desc: '《用户反馈》项目已发布',
    tag: '项目'
  },
  {
    time: '1 小时前',
    title: '更新头像',
    desc: '新的头像已同步到全平台',
    tag: '账户'
  },
  { time: '昨天', title: '创建团队空间', desc: '新增 4 位协作者', tag: '协作' },
  { time: '2 天前', title: '修改密码', desc: '安全策略已自动更新', tag: '安全' }
]
</script>

<style lang="scss" scoped>
.user-center {
  padding: 24px 32px 40px;
  background: radial-gradient(circle at top right, #eef2ff 0%, #ffffff 55%);
  min-height: calc(100vh - 64px);
  color: #0f172a;
}

.hero {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
  background: linear-gradient(135deg, #111827 0%, #1f2937 40%, #0f172a 100%);
  border-radius: 22px;
  color: #e2e8f0;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
}

.hero-main {
  display: flex;
  gap: 18px;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  width: 86px;
  height: 86px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #22d3ee);
  display: grid;
  place-items: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 2px 8px;
  background: #f59e0b;
  color: #111827;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.hero-info h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 8px 0 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.4);
  color: #cbd5f5;
}

.status.online {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.sub {
  margin: 6px 0 10px;
  color: #94a3b8;
  font-size: 13px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #cbd5f5;
}

.tags span {
  background: rgba(148, 163, 184, 0.15);
  padding: 3px 10px;
  border-radius: 999px;
}

.hero-actions {
  display: flex;
  gap: 10px;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: #6366f1;
  color: #fff;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.35);
}

.btn.ghost {
  background: transparent;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.metric-card {
  background: #ffffff;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #eef2ff;
  font-size: 20px;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
}

.metric-label {
  font-size: 12px;
  color: #94a3b8;
}

.metric-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
}

.metric-trend.up {
  background: #dcfce7;
  color: #16a34a;
}

.metric-trend.down {
  background: #fee2e2;
  color: #ef4444;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.panel {
  background: #fff;
  border-radius: 20px;
  padding: 18px 20px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h2 {
  font-size: 16px;
  margin: 0;
}

.link-btn {
  border: none;
  background: none;
  color: #6366f1;
  font-size: 12px;
  cursor: pointer;
}

.profile-list {
  display: grid;
  gap: 12px;
}

.profile-item {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.label {
  color: #64748b;
  font-size: 12px;
}

.value {
  font-weight: 600;
  font-size: 13px;
}

.status.ok {
  color: #16a34a;
  background: #dcfce7;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.status.warn {
  color: #f59e0b;
  background: #fef3c7;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.status.vip {
  color: #7c3aed;
  background: #ede9fe;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.security-score {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border-radius: 16px;
  background: #f1f5f9;
}

.score-ring {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: conic-gradient(#22c55e 0 82%, #e2e8f0 82% 100%);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #16a34a;
}

.score-ring span {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
}

.score-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.security-list {
  display: grid;
  gap: 12px;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5f5;
}

.dot.ok {
  background: #22c55e;
}

.dot.warn {
  background: #f59e0b;
}

.security-info {
  flex: 1;
}

.security-title {
  font-weight: 600;
  font-size: 13px;
}

.security-desc {
  font-size: 12px;
  color: #94a3b8;
}

.mini-btn {
  border: none;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.asset-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 6px;
}

.asset-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #e0f2fe;
  display: grid;
  place-items: center;
  font-size: 18px;
}

.asset-title {
  font-size: 12px;
  color: #64748b;
}

.asset-value {
  font-weight: 700;
}

.asset-foot {
  font-size: 11px;
  color: #94a3b8;
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.activity-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.activity-time {
  font-size: 11px;
  color: #94a3b8;
}

.activity-title {
  font-weight: 600;
  font-size: 13px;
}

.activity-desc {
  font-size: 12px;
  color: #94a3b8;
}

.activity-tag {
  font-size: 11px;
  color: #4f46e5;
  background: #eef2ff;
  padding: 4px 8px;
  border-radius: 999px;
}

@media (max-width: 960px) {
  .hero-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .hero-actions {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .user-center {
    padding: 18px 16px 32px;
  }

  .profile-item,
  .activity-item {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
}
</style>
