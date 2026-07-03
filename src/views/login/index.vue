<template>
  <div class="login-page">
    <div class="login-shell">
      <div class="login-showcase">
        <div class="showcase-grid"></div>

        <div class="showcase-content">
          <div class="brand-line">
            <div class="brand-badge">
              <span class="brand-spark">FA</span>
            </div>
            <div>
              <div class="brand-name">{{ loginCopy.brandName }}</div>
              <div class="brand-version">{{ loginCopy.brandVersion }}</div>
            </div>
          </div>

          <div class="showcase-copy">
            <span class="showcase-kicker">{{ loginCopy.kicker }}</span>
            <h1>{{ loginCopy.headline }}</h1>
            <p>{{ loginCopy.subline }}</p>
          </div>

          <div class="dashboard-preview">
            <div class="preview-window preview-primary">
              <div class="window-head">
                <span>{{ loginCopy.previewWorkflow }}</span>
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
                  <strong>3</strong>
                  <span>Agent 阶段</span>
                </div>
                <div>
                  <strong>12</strong>
                  <span>产品创意</span>
                </div>
              </div>
            </div>

            <div class="preview-stack">
              <div class="preview-window preview-secondary">
                <div class="window-head">
                  <span>{{ loginCopy.previewTrace }}</span>
                  <span>08:42</span>
                </div>
                <div class="message-list">
                  <div class="message-row">
                    <span class="message-dot green"></span>
                    <span>市场研究 Agent 已完成扫描</span>
                  </div>
                  <div class="message-row">
                    <span class="message-dot orange"></span>
                    <span>创意生成 Agent 输出 9 个方案</span>
                  </div>
                  <div class="message-row">
                    <span class="message-dot cyan"></span>
                    <span>评估 Agent 生成优先级摘要</span>
                  </div>
                </div>
              </div>

              <div class="preview-window preview-tertiary">
                <div class="window-head">
                  <span>Agent 模块</span>
                  <span>{{ loginCopy.previewRoles }}</span>
                </div>
                <div class="role-pills">
                  <span>工作流</span>
                  <span>聊天</span>
                  <span>配置</span>
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
            <div class="panel-head-copy">
              <span class="panel-kicker">{{ loginCopy.panelKicker }}</span>
              <h2>{{ loginCopy.panelTitle }}</h2>
              <p>{{ loginCopy.panelDesc }}</p>
            </div>
            <button
              type="button"
              class="panel-theme-btn"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
              @click="handleToggleTheme"
            >
              <el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
            </button>
          </div>

          <div class="demo-list">
            <button
              v-for="item in demoAccounts"
              :key="item.name"
              type="button"
              class="demo-chip"
              :class="{ 'is-active': activeDemo === item.name }"
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
              进入工作流
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useAccountStore, useUserStore } from '@/stores'
import { login } from '@/services/auth'
import { getApiErrorMessage } from '@/utils/request'
import { defaultHomePath, loginCopy } from '@/config/product'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

const demoAccounts = [
  { name: 'admin', role: '管理员' },
  { name: 'design.lead', role: '设计负责人' },
  { name: 'operate.pm', role: '运营协同' }
]

const signalCards = loginCopy.signals

const form = reactive({
  name: '',
  password: ''
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()
const submitting = ref(false)
const activeDemo = ref('')

const applyDemo = (name: string) => {
  activeDemo.value = name
  form.name = name
  form.password = '123456'
}

const handleToggleTheme = () => {
  const theme = toggleTheme()
  ElMessage.info(theme === 'dark' ? '已切换到深色模式' : '已切换到浅色模式')
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
        : defaultHomePath

    await router.push(returnUrl || defaultHomePath)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '登录失败'))
  } finally {
    submitting.value = false
  }
}

const onReset = () => {
  form.name = ''
  form.password = ''
  activeDemo.value = ''
}
</script>

<style lang="scss" scoped>
.login-page {
  --login-showcase-bg: #18181b;
  --login-showcase-border: rgba(255, 255, 255, 0.08);
  --login-showcase-text: #fafafa;
  --login-showcase-muted: #a1a1aa;
  --login-panel-bg: var(--app-surface);
  --login-panel-border: var(--app-border);
  --login-panel-text: var(--app-text-main);
  --login-panel-muted: var(--app-text-sub);
  --login-panel-faint: var(--app-text-faint);

  position: relative;
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  padding: 20px;
  background: linear-gradient(
    180deg,
    var(--app-bg-start) 0%,
    var(--app-bg-end) 100%
  );
  font-family: var(--app-font);
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
  border: 1px solid var(--login-panel-border);
  box-shadow: var(--app-shadow-strong);
}

.login-showcase {
  position: relative;
  overflow: hidden;
  border-radius: var(--app-radius-xl);
  min-height: 0;
  border-color: var(--login-showcase-border);
  background:
    radial-gradient(
      circle at 0% 0%,
      rgba(37, 99, 235, 0.16) 0%,
      transparent 32%
    ),
    linear-gradient(
      160deg,
      #27272a 0%,
      var(--login-showcase-bg) 52%,
      #09090b 100%
    );
}

.showcase-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.72), transparent 88%);
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
  overflow-y: auto;
  color: var(--login-showcase-text);
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
  border-radius: var(--app-radius-lg);
  color: #fff;
  background: var(
    --app-gradient-brand,
    linear-gradient(135deg, #18181b 0%, #2563eb 100%)
  );
  box-shadow: 0 12px 28px var(--app-accent-muted);
}

.brand-spark {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
}

.brand-version {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--login-showcase-muted);
}

.showcase-copy {
  max-width: 620px;
}

.showcase-kicker {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #dbeafe;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.panel-kicker {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid var(--app-accent-muted);
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
  color: rgba(250, 250, 250, 0.76);
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
  border-radius: var(--app-radius-lg);
  padding: 18px;
  background: rgba(9, 9, 11, 0.72);
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
  color: rgba(250, 250, 250, 0.72);
}

.window-mark {
  padding: 5px 8px;
  border-radius: 999px;
  color: #fff;
  background: var(--app-accent-muted);
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
  background: linear-gradient(
    180deg,
    rgba(147, 197, 253, 0.95) 0%,
    var(--app-accent) 100%
  );
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
  color: #eff6ff;
}

.window-metrics span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: rgba(250, 250, 250, 0.66);
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
  color: rgba(250, 250, 250, 0.76);
}

.message-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.message-dot.green {
  background: var(--app-success);
}

.message-dot.orange {
  background: var(--app-accent);
}

.message-dot.cyan {
  background: #93c5fd;
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
  color: rgba(250, 250, 250, 0.82);
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
  border-radius: var(--app-radius-md);
  background: rgba(9, 9, 11, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.signal-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #93c5fd;
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
  color: rgba(250, 250, 250, 0.68);
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.panel-card {
  width: 100%;
  border-radius: var(--app-radius-xl);
  padding: 28px 26px;
  background: var(--login-panel-bg);
  border: 1px solid var(--login-panel-border);
  box-shadow: var(--app-shadow);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-head-copy {
  min-width: 0;
}

.panel-theme-btn {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-muted);
  color: var(--login-panel-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s ease;

  &:hover {
    border-color: var(--app-accent-muted);
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }
}

.panel-head h2 {
  margin: 12px 0 8px;
  font-size: 30px;
  line-height: 1.05;
  color: var(--login-panel-text);
}

.panel-head p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--login-panel-muted);
}

.demo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.demo-chip {
  flex: 1 1 120px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  padding: 12px 14px;
  background: var(--app-surface-muted);
  color: var(--login-panel-text);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.demo-chip:hover,
.demo-chip.is-active {
  transform: translateY(-2px);
  background: var(--app-accent-soft);
  border-color: var(--app-accent-muted);
}

.demo-chip.is-active .demo-chip-name {
  color: var(--app-accent);
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
  color: var(--login-panel-muted);
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
  color: var(--login-panel-text);
}

.login-form :deep(.el-input__wrapper) {
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
  box-shadow: inset 0 0 0 1px var(--app-border);
  transition: box-shadow 0.15s ease;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    inset 0 0 0 1px var(--app-accent-muted),
    var(--app-search-focus-shadow);
}

.login-form :deep(.el-input__inner) {
  color: var(--login-panel-text);
  height: 48px;
}

.panel-meta {
  margin-top: 4px;
  padding: 14px 16px;
  border-radius: var(--app-radius-md);
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  font-size: 12px;
  line-height: 1.7;
  color: var(--login-panel-muted);
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
  border-radius: var(--app-radius-md);
}

.ghost-btn {
  border-color: var(--app-border);
  background: var(--app-surface);
  color: var(--login-panel-text);
}

.submit-btn {
  border: none;
  background: var(--app-accent);
  box-shadow: 0 12px 24px var(--app-accent-muted);
}

.submit-btn:hover {
  background: var(--app-accent-strong);
}

.security-note {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--login-panel-muted);
}

.security-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--app-accent);
  box-shadow: 0 0 0 6px var(--app-accent-soft);
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

  .dashboard-preview,
  .signal-grid {
    display: none;
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
    border-radius: var(--app-radius-lg);
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
