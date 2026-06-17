<template>
  <div class="login-page">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>
    <div class="ambient ambient-c"></div>

    <div class="login-shell">
      <div class="login-showcase">
        <div class="showcase-grid"></div>
        <div class="showcase-orb orb-a"></div>
        <div class="showcase-orb orb-b"></div>
        <div class="showcase-orb orb-c"></div>

        <div class="showcase-content">
          <div class="brand-line">
            <div class="brand-badge">
              <CpIcon :name="`log-gengduoquanzhong`"></CpIcon>
            </div>
            <div>
              <div class="brand-name">数字化平台</div>
              <div class="brand-version">企业协同工作台</div>
            </div>
          </div>

          <div class="showcase-copy">
            <span class="showcase-kicker">ONE CONSOLE FOR WORK</span>
            <h1>把消息、流程和数据放进一个工作台</h1>
            <p>
              登录后可以直接进入统一后台，集中处理协作消息、审批流、成员管理 和
              AI 工具，不必在不同页面之间来回切换。
            </p>
          </div>

          <div class="dashboard-preview">
            <div class="preview-window preview-primary">
              <div class="window-head">
                <span>运营总览</span>
                <span class="window-mark">LIVE</span>
              </div>
              <div class="window-chart">
                <span class="bar h1"></span>
                <span class="bar h2"></span>
                <span class="bar h3"></span>
                <span class="bar h4"></span>
                <span class="bar h5"></span>
                <span class="bar h6"></span>
              </div>
              <div class="window-metrics">
                <div>
                  <strong>89%</strong>
                  <span>流程准时率</span>
                </div>
                <div>
                  <strong>126</strong>
                  <span>在线任务</span>
                </div>
              </div>
            </div>

            <div class="preview-stack">
              <div class="preview-window preview-secondary">
                <div class="window-head">
                  <span>消息协同</span>
                  <span>08:42</span>
                </div>
                <div class="message-list">
                  <div class="message-row">
                    <span class="message-dot green"></span>
                    <span>审批提醒已同步给财务组</span>
                  </div>
                  <div class="message-row">
                    <span class="message-dot orange"></span>
                    <span>AI 工作流已生成 12 条建议</span>
                  </div>
                  <div class="message-row">
                    <span class="message-dot cyan"></span>
                    <span>新设备登录已触发安全校验</span>
                  </div>
                </div>
              </div>

              <div class="preview-window preview-tertiary">
                <div class="window-head">
                  <span>角色入口</span>
                  <span>3 个</span>
                </div>
                <div class="role-pills">
                  <span>管理员</span>
                  <span>设计</span>
                  <span>运营</span>
                </div>
              </div>
            </div>
          </div>

          <div class="signal-grid">
            <div
              v-for="item in signalCards"
              :key="item.label"
              class="signal-card"
            >
              <span class="signal-value">{{ item.value }}</span>
              <span class="signal-label">{{ item.label }}</span>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="login-panel">
        <div class="panel-card">
          <div class="panel-head">
            <span class="panel-kicker">WELCOME BACK</span>
            <h2>登录平台</h2>
            <p>演示环境支持任意账号登录，也可以直接使用下面的快捷身份。</p>
          </div>

          <div class="demo-list">
            <button
              v-for="item in demoAccounts"
              :key="item.name"
              type="button"
              class="demo-chip"
              @click="applyDemo(item.name)"
            >
              <span class="demo-chip-name">{{ item.name }}</span>
              <span class="demo-chip-role">{{ item.role }}</span>
            </button>
          </div>

          <el-form class="login-form" :model="form" @submit.prevent="onSubmit">
            <el-form-item label="账号">
              <el-input
                v-model="form.name"
                size="large"
                placeholder="请输入账号，例如：admin"
                @keyup.enter="onSubmit"
              />
            </el-form-item>

            <el-form-item label="密码">
              <el-input
                v-model="form.password"
                size="large"
                type="password"
                show-password
                placeholder="请输入密码"
                @keyup.enter="onSubmit"
              />
            </el-form-item>
          </el-form>

          <div class="panel-meta">
            本地演示登录，不依赖服务端；登录后会自动记录当前设备、会话状态和回跳地址。
          </div>

          <div class="panel-actions">
            <el-button class="ghost-btn" size="large" @click="onReset"
              >清空</el-button
            >
            <el-button
              class="submit-btn"
              type="primary"
              size="large"
              :loading="submitting"
              @click="onSubmit"
            >
              登录并进入
            </el-button>
          </div>

          <div class="security-note">
            <span class="security-dot"></span>
            登录状态将保存在本地，退出时会清除当前用户会话。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountStore, useUserStore } from '@/stores'
import { login } from '@/services/auth'
import { getApiErrorMessage } from '@/utils/request'

const demoAccounts = [
  { name: 'admin', role: '管理员' },
  { name: 'design.lead', role: '设计负责人' },
  { name: 'operate.pm', role: '运营协同' }
]

const signalCards = [
  {
    value: '12+',
    label: '可用模块',
    desc: '覆盖消息、审批、AI、地图和可视化等核心能力。'
  },
  {
    value: '3 类',
    label: '常用角色',
    desc: '管理员、设计、运营都可以从这里快速进入。'
  },
  {
    value: '已接入',
    label: '登录能力',
    desc: '支持本地会话持久化、退出清理和登录后回跳。'
  }
]

const form = reactive({
  name: '',
  password: ''
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()
const submitting = ref(false)

const applyDemo = (name: string) => {
  form.name = name
  form.password = '123456'
}

const resolveDeviceName = () => {
  const ua = window.navigator.userAgent
  if (ua.includes('Edg')) return 'Edge 浏览器'
  if (ua.includes('Chrome')) return 'Chrome 浏览器'
  if (ua.includes('Firefox')) return 'Firefox 浏览器'
  if (ua.includes('Safari')) return 'Safari 浏览器'
  return 'Web 浏览器'
}

const onSubmit = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请输入账号')
    return
  }

  if (!form.password.trim()) {
    ElMessage.warning('请输入密码')
    return
  }

  submitting.value = true
  try {
    const accountName = form.name.trim()
    const res = await login({
      account: accountName,
      password: form.password.trim()
    })
    const user = res.data.user

    userStore.setUser(user)
    accountStore.hydrateFromUser(user)
    accountStore.registerLogin({
      device: resolveDeviceName(),
      city: user.city
    })

    ElMessage.success(`欢迎回来，${user.name || accountName}`)

    const returnUrl =
      typeof route.query.returnUrl === 'string'
        ? route.query.returnUrl
        : '/home'

    await router.push(returnUrl || '/home')
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '登录失败'))
  } finally {
    submitting.value = false
  }
}

const onReset = () => {
  form.name = ''
  form.password = ''
}
</script>

<style lang="scss" scoped>
.login-page {
  --login-bg: #08111f;
  --login-card: rgba(9, 17, 32, 0.76);
  --login-card-strong: rgba(8, 15, 28, 0.92);
  --login-border: rgba(148, 163, 184, 0.16);
  --login-text: #f8fafc;
  --login-muted: #9fb0c8;
  --login-accent: #ff6b2c;
  --login-accent-soft: #ffcf8a;
  --login-cyan: #5ce1e6;
  --login-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);

  position: relative;
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  padding: 20px;
  background:
    radial-gradient(
      circle at 12% 18%,
      rgba(255, 107, 44, 0.18) 0%,
      transparent 24%
    ),
    radial-gradient(
      circle at 88% 14%,
      rgba(92, 225, 230, 0.15) 0%,
      transparent 22%
    ),
    radial-gradient(
      circle at 52% 92%,
      rgba(120, 119, 198, 0.18) 0%,
      transparent 26%
    ),
    linear-gradient(135deg, #040915 0%, #091224 42%, #0f1628 100%);
  font-family: 'Outfit', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.ambient {
  position: absolute;
  border-radius: 999px;
  filter: blur(60px);
  opacity: 0.52;
  pointer-events: none;
}

.ambient-a {
  top: -120px;
  left: -80px;
  width: 260px;
  height: 260px;
  background: rgba(255, 107, 44, 0.24);
}

.ambient-b {
  right: -60px;
  top: 120px;
  width: 220px;
  height: 220px;
  background: rgba(92, 225, 230, 0.22);
}

.ambient-c {
  left: 40%;
  bottom: -100px;
  width: 300px;
  height: 300px;
  background: rgba(129, 140, 248, 0.16);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1400px, 100%);
  margin: 0 auto;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
  gap: 18px;
  overflow: hidden;
}

.login-showcase,
.panel-card {
  border: 1px solid var(--login-border);
  box-shadow: var(--login-shadow);
}

.login-showcase {
  position: relative;
  overflow: hidden;
  border-radius: 32px;
  min-height: 0;
  background:
    radial-gradient(
      circle at 0% 0%,
      rgba(255, 107, 44, 0.12) 0%,
      transparent 28%
    ),
    radial-gradient(
      circle at 100% 0%,
      rgba(92, 225, 230, 0.12) 0%,
      transparent 26%
    ),
    linear-gradient(160deg, #0b1324 0%, #0e1b30 48%, #09111f 100%);
}

.showcase-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.72), transparent 88%);
}

.showcase-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(22px);
  opacity: 0.72;
}

.orb-a {
  top: 52px;
  right: 80px;
  width: 220px;
  height: 220px;
  background: rgba(255, 107, 44, 0.18);
}

.orb-b {
  top: 220px;
  left: 54px;
  width: 140px;
  height: 140px;
  background: rgba(92, 225, 230, 0.16);
}

.orb-c {
  right: 220px;
  bottom: 140px;
  width: 180px;
  height: 180px;
  background: rgba(129, 140, 248, 0.14);
}

.showcase-content {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 34px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 20px;
  color: var(--login-text);
}

.brand-line {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-badge {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #ff6b2c 0%, #ff9b54 100%);
  box-shadow: 0 12px 30px rgba(255, 107, 44, 0.26);
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
}

.brand-version {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(248, 250, 252, 0.64);
}

.showcase-copy {
  max-width: 620px;
}

.showcase-kicker,
.panel-kicker {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fdf4e7;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.showcase-copy h1 {
  margin: 14px 0 12px;
  max-width: 700px;
  font-size: clamp(40px, 4.4vw, 62px);
  line-height: 1.02;
  letter-spacing: -0.035em;
}

.showcase-copy p {
  max-width: 580px;
  margin: 0;
  font-size: 15px;
  line-height: 1.9;
  color: rgba(248, 250, 252, 0.76);
}

.dashboard-preview {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(240px, 0.88fr);
  gap: 14px;
  margin: 0;
}

.preview-stack {
  display: grid;
  gap: 14px;
}

.preview-window {
  border-radius: 24px;
  padding: 18px;
  background: rgba(8, 15, 28, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.preview-primary {
  min-height: 196px;
}

.window-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.72);
}

.window-mark {
  padding: 5px 8px;
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 107, 44, 0.24);
}

.window-chart {
  height: 104px;
  margin-top: 16px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.bar {
  flex: 1;
  border-radius: 999px 999px 10px 10px;
  background: linear-gradient(180deg, #5ce1e6 0%, #2a7fff 100%);
  opacity: 0.92;
}

.bar.h1 {
  height: 42%;
}

.bar.h2 {
  height: 68%;
}

.bar.h3 {
  height: 54%;
}

.bar.h4 {
  height: 84%;
}

.bar.h5 {
  height: 64%;
}

.bar.h6 {
  height: 92%;
}

.window-metrics {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.window-metrics strong {
  display: block;
  font-size: 22px;
  color: #fff4e5;
}

.window-metrics span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.66);
}

.message-list {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.message-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.76);
}

.message-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.message-dot.green {
  background: #34d399;
}

.message-dot.orange {
  background: #fb923c;
}

.message-dot.cyan {
  background: #22d3ee;
}

.role-pills {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.role-pills span {
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.82);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.signal-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(8, 15, 28, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.signal-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--login-accent-soft);
}

.signal-label {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
}

.signal-card p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: rgba(248, 250, 252, 0.68);
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.panel-card {
  width: 100%;
  border-radius: 32px;
  padding: 28px 26px;
  background: linear-gradient(
    180deg,
    rgba(10, 18, 34, 0.86) 0%,
    rgba(7, 13, 25, 0.96) 100%
  );
  backdrop-filter: blur(18px);
}

.panel-head h2 {
  margin: 12px 0 8px;
  font-size: 30px;
  line-height: 1.05;
  color: var(--login-text);
}

.panel-head p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--login-muted);
}

.demo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.demo-chip {
  flex: 1 1 120px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--login-text);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.demo-chip:hover {
  transform: translateY(-2px);
  background: rgba(255, 107, 44, 0.12);
  border-color: rgba(255, 107, 44, 0.34);
}

.demo-chip-name {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.demo-chip-role {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--login-muted);
}

.login-form {
  margin-top: 20px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.login-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
  color: var(--login-text);
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.login-form :deep(.el-input__inner) {
  color: var(--login-text);
  height: 48px;
}

.panel-meta {
  margin-top: 4px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  line-height: 1.7;
  color: var(--login-muted);
}

.panel-actions {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  margin-top: 22px;
}

.ghost-btn,
.submit-btn {
  height: 48px;
  border-radius: 16px;
}

.ghost-btn {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: var(--login-text);
}

.submit-btn {
  border: none;
  background: linear-gradient(135deg, #ff6b2c 0%, #ff9d5c 100%);
  box-shadow: 0 14px 32px rgba(255, 107, 44, 0.24);
}

.security-note {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--login-muted);
}

.security-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--login-cyan);
  box-shadow: 0 0 0 6px rgba(92, 225, 230, 0.16);
}

@media (max-width: 1200px) {
  .login-page {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  .login-shell {
    height: auto;
    min-height: calc(100vh - 40px);
    grid-template-columns: 1fr;
  }

  .login-showcase {
    min-height: 0;
  }

  .login-panel {
    justify-content: stretch;
  }

  .dashboard-preview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .login-page {
    padding: 12px;
  }

  .login-shell {
    min-height: calc(100vh - 24px);
    gap: 12px;
  }

  .login-showcase {
    border-radius: 24px;
  }

  .showcase-content,
  .panel-card {
    padding: 22px 18px;
  }

  .showcase-copy h1 {
    font-size: 34px;
  }

  .signal-grid,
  .dashboard-preview,
  .window-metrics,
  .panel-actions {
    grid-template-columns: 1fr;
  }

  .demo-list {
    gap: 8px;
  }
}
</style>
