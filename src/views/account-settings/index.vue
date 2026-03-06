<template>
  <div class="settings-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-content">
        <div>
          <el-text class="hero-kicker">ACCOUNT SETTINGS</el-text>
          <h1>账号设置</h1>
          <p>统一管理个人资料、通知偏好、安全设置和账单信息。</p>
        </div>
        <div class="hero-actions">
          <el-button @click="exportArchive">导出档案</el-button>
          <el-button type="primary" @click="saveCurrentTab"
            >保存当前页</el-button
          >
        </div>
      </div>
    </el-card>

    <div class="summary-grid">
      <el-card class="summary-card" shadow="never">
        <div class="summary-label">当前套餐</div>
        <div class="summary-value">{{ accountStore.assets.plan }}</div>
        <div class="summary-desc">
          续费日期 {{ accountStore.assets.renewalDate }}
        </div>
      </el-card>
      <el-card class="summary-card" shadow="never">
        <div class="summary-label">设备数量</div>
        <div class="summary-value">{{ accountStore.security.deviceCount }}</div>
        <div class="summary-desc">当前登录设备已自动标记为可信</div>
      </el-card>
      <el-card class="summary-card" shadow="never">
        <div class="summary-label">邮箱状态</div>
        <div class="summary-value">
          {{ accountStore.security.emailVerified ? '已验证' : '待验证' }}
        </div>
        <div class="summary-desc">用于找回账号和接收安全提醒</div>
      </el-card>
      <el-card class="summary-card" shadow="never">
        <div class="summary-label">存储用量</div>
        <div class="summary-value">{{ storagePercent }}%</div>
        <div class="summary-desc">
          {{ accountStore.assets.storageUsedGB }} /
          {{ accountStore.assets.storageCapacityGB }} GB
        </div>
      </el-card>
    </div>

    <el-card shadow="never">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="基本资料" name="profile">
          <div class="tab-layout">
            <section class="form-panel">
              <el-form label-width="88px">
                <el-form-item label="姓名">
                  <el-input v-model="profileForm.name" />
                </el-form-item>
                <el-form-item label="职位">
                  <el-input v-model="profileForm.title" />
                </el-form-item>
                <el-form-item label="公司">
                  <el-input v-model="profileForm.company" />
                </el-form-item>
                <el-form-item label="城市">
                  <el-input v-model="profileForm.city" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="profileForm.email" />
                </el-form-item>
                <el-form-item label="电话">
                  <el-input v-model="profileForm.phone" />
                </el-form-item>
                <el-form-item label="简介">
                  <el-input
                    v-model="profileForm.bio"
                    type="textarea"
                    :rows="4"
                  />
                </el-form-item>
              </el-form>
              <div class="tab-actions">
                <el-button @click="resetForms">重置</el-button>
                <el-button type="primary" @click="saveProfile"
                  >保存资料</el-button
                >
              </div>
            </section>

            <aside class="preview-card">
              <img
                class="preview-avatar"
                :src="accountStore.profile.avatar"
                alt="avatar"
              />
              <h3>{{ profileForm.name }}</h3>
              <p>{{ profileForm.title }} · {{ profileForm.company }}</p>
              <p>{{ profileForm.city }}</p>
              <el-tag type="success" effect="light">{{
                accountStore.profile.statusLabel
              }}</el-tag>
              <div class="preview-bio">{{ profileForm.bio }}</div>
            </aside>
          </div>
        </el-tab-pane>

        <el-tab-pane label="通知偏好" name="notifications">
          <div class="notify-list">
            <div class="notify-item">
              <div>
                <strong>站内消息通知</strong>
                <p>系统更新、项目协作、审批提醒等消息。</p>
              </div>
              <el-switch v-model="notificationForm.siteNotice" />
            </div>
            <div class="notify-item">
              <div>
                <strong>每周摘要邮件</strong>
                <p>每周五发送工作概览和活跃统计。</p>
              </div>
              <el-switch v-model="notificationForm.weeklyDigest" />
            </div>
            <div class="notify-item">
              <div>
                <strong>登录安全提醒</strong>
                <p>新设备登录或异地登录时实时提醒。</p>
              </div>
              <el-switch v-model="notificationForm.loginAlert" />
            </div>
            <div class="notify-item">
              <div>
                <strong>审批与公告提醒</strong>
                <p>审批流变更、公告发布和待办同步。</p>
              </div>
              <el-switch v-model="notificationForm.approvalNotice" />
            </div>
          </div>
          <div class="tab-actions">
            <el-button @click="resetForms">恢复已保存</el-button>
            <el-button type="primary" @click="saveNotifications"
              >保存通知设置</el-button
            >
          </div>
        </el-tab-pane>

        <el-tab-pane label="安全中心" name="security">
          <div class="security-grid">
            <el-card shadow="never">
              <template #header>
                <div class="panel-head">
                  <span>安全概览</span>
                  <el-tag
                    :type="
                      accountStore.security.emailVerified
                        ? 'success'
                        : 'warning'
                    "
                  >
                    {{
                      accountStore.security.emailVerified ? '已验证' : '待验证'
                    }}
                  </el-tag>
                </div>
              </template>
              <div class="security-meta">
                <div>最近登录：{{ lastLoginLabel }}</div>
                <div>登录地点：{{ accountStore.security.lastLoginCity }}</div>
                <div>登录设备：{{ accountStore.security.lastLoginDevice }}</div>
                <div>
                  密码更新时间：{{ accountStore.security.passwordUpdatedAt }}
                </div>
              </div>
              <div class="tab-actions left">
                <el-button
                  type="primary"
                  plain
                  :disabled="accountStore.security.emailVerified"
                  @click="verifyEmail"
                >
                  {{
                    accountStore.security.emailVerified
                      ? '邮箱已验证'
                      : '立即验证邮箱'
                  }}
                </el-button>
                <el-button @click="rotatePassword">刷新密码策略</el-button>
              </div>
            </el-card>

            <el-card shadow="never">
              <template #header>
                <div class="panel-head">
                  <span>双重验证</span>
                  <el-switch
                    :model-value="accountStore.security.twoFactorEnabled"
                    @change="handleTwoFactorChange"
                  />
                </div>
              </template>
              <p class="panel-desc">
                开启后，登录时需要额外输入验证码，适合管理员和高权限账号。
              </p>
            </el-card>

            <el-card shadow="never" class="devices-card">
              <template #header>
                <div class="panel-head">
                  <span>登录设备</span>
                  <el-tag type="info"
                    >{{ accountStore.devices.length }} 台</el-tag
                  >
                </div>
              </template>
              <div class="device-list">
                <div
                  v-for="device in accountStore.devices"
                  :key="device.id"
                  class="device-item"
                >
                  <div>
                    <strong>{{ device.name }}</strong>
                    <p>
                      {{ device.location }} ·
                      {{ formatRelativeTime(device.lastSeenAt) }}
                    </p>
                  </div>
                  <div class="device-actions">
                    <el-tag v-if="device.current" type="success"
                      >当前设备</el-tag
                    >
                    <el-tag v-else :type="device.trusted ? 'info' : 'warning'">
                      {{ device.trusted ? '可信设备' : '待确认' }}
                    </el-tag>
                    <el-button
                      v-if="!device.current"
                      size="small"
                      type="danger"
                      link
                      @click="removeDevice(device.id)"
                    >
                      移除
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="账单与资产" name="billing">
          <div class="billing-grid">
            <el-card shadow="never">
              <template #header>
                <div class="panel-head">
                  <span>资产概览</span>
                  <el-tag type="success">活跃中</el-tag>
                </div>
              </template>
              <div class="asset-grid">
                <div class="asset-box">
                  <span>积分</span>
                  <strong>{{ accountStore.assets.points }}</strong>
                </div>
                <div class="asset-box">
                  <span>优惠券</span>
                  <strong>{{ accountStore.assets.coupons }} 张</strong>
                </div>
                <div class="asset-box">
                  <span>订阅版本</span>
                  <strong>{{ accountStore.assets.plan }}</strong>
                </div>
                <div class="asset-box">
                  <span>存储空间</span>
                  <strong
                    >{{ accountStore.assets.storageUsedGB }} /
                    {{ accountStore.assets.storageCapacityGB }} GB</strong
                  >
                </div>
              </div>
            </el-card>

            <el-card shadow="never">
              <template #header>
                <div class="panel-head">
                  <span>最近账单</span>
                  <el-button type="primary" link @click="exportArchive"
                    >导出档案</el-button
                  >
                </div>
              </template>
              <el-table :data="accountStore.billingRecords" size="small">
                <el-table-column prop="title" label="项目" min-width="140" />
                <el-table-column prop="desc" label="说明" min-width="220" />
                <el-table-column prop="amount" label="金额" width="120" />
                <el-table-column label="状态" width="110">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.status === 'paid' ? 'success' : 'warning'"
                    >
                      {{ row.status === 'paid' ? '已支付' : '处理中' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="date" label="日期" width="120" />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountStore, useUserStore } from '@/stores'

type SettingTab = 'profile' | 'notifications' | 'security' | 'billing'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const userStore = useUserStore()

const resolveTab = (value: unknown): SettingTab => {
  return value === 'notifications' ||
    value === 'security' ||
    value === 'billing'
    ? value
    : 'profile'
}

const activeTab = computed<SettingTab>({
  get: () => resolveTab(route.query.tab),
  set: (value) => {
    void router.replace({
      path: route.path,
      query: {
        ...route.query,
        tab: value
      }
    })
  }
})

const profileForm = reactive({
  name: accountStore.profile.name,
  title: accountStore.profile.title,
  company: accountStore.profile.company,
  city: accountStore.profile.city,
  email: accountStore.profile.email,
  phone: accountStore.profile.phone,
  bio: accountStore.profile.bio
})

const notificationForm = reactive({
  siteNotice: accountStore.notifications.siteNotice,
  weeklyDigest: accountStore.notifications.weeklyDigest,
  loginAlert: accountStore.notifications.loginAlert,
  approvalNotice: accountStore.notifications.approvalNotice
})

const resetForms = () => {
  Object.assign(profileForm, {
    name: accountStore.profile.name,
    title: accountStore.profile.title,
    company: accountStore.profile.company,
    city: accountStore.profile.city,
    email: accountStore.profile.email,
    phone: accountStore.profile.phone,
    bio: accountStore.profile.bio
  })

  Object.assign(notificationForm, {
    siteNotice: accountStore.notifications.siteNotice,
    weeklyDigest: accountStore.notifications.weeklyDigest,
    loginAlert: accountStore.notifications.loginAlert,
    approvalNotice: accountStore.notifications.approvalNotice
  })
}

const storagePercent = computed(() => {
  const { storageUsedGB, storageCapacityGB } = accountStore.assets
  if (!storageCapacityGB) return 0
  return Math.round((storageUsedGB / storageCapacityGB) * 100)
})

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const lastLoginLabel = computed(() =>
  formatRelativeTime(accountStore.security.lastLoginAt)
)

const syncUserStoreProfile = () => {
  userStore.setUser({
    ...(userStore.user || {}),
    name: accountStore.profile.name,
    username: accountStore.profile.name,
    nickname: accountStore.profile.name,
    email: accountStore.profile.email,
    role: accountStore.profile.role,
    avatar: accountStore.profile.avatar,
    city: accountStore.profile.city
  })
}

const saveProfile = () => {
  accountStore.updateProfile({ ...profileForm })
  syncUserStoreProfile()
  ElMessage.success('个人资料已保存')
}

const saveNotifications = () => {
  accountStore.updateNotifications({ ...notificationForm })
  ElMessage.success('通知设置已保存')
}

const verifyEmail = () => {
  accountStore.verifyEmail()
  ElMessage.success('邮箱验证状态已更新')
}

const handleTwoFactorChange = (value: string | number | boolean) => {
  accountStore.setTwoFactor(Boolean(value))
  ElMessage.success(Boolean(value) ? '已开启双重验证' : '已关闭双重验证')
}

const rotatePassword = () => {
  accountStore.rotatePassword()
  ElMessage.success('密码策略已刷新')
}

const removeDevice = (id: string) => {
  const removed = accountStore.removeDevice(id)
  if (!removed) {
    ElMessage.warning('当前设备不能移除')
    return
  }
  ElMessage.success('设备已移除')
}

const exportArchive = () => {
  const content = JSON.stringify(accountStore.exportArchive(), null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `account-archive-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  ElMessage.success('账号档案已导出')
}

const saveCurrentTab = () => {
  switch (activeTab.value) {
    case 'profile':
      saveProfile()
      break
    case 'notifications':
      saveNotifications()
      break
    case 'security':
      ElMessage.info('安全设置已即时生效')
      break
    case 'billing':
      exportArchive()
      break
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.hero-card {
  margin-bottom: 16px;
  border: 1px solid var(--app-border);
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hero-kicker {
  letter-spacing: 0.12em;
}

.hero-content h1 {
  margin: 8px 0;
  font-size: 28px;
}

.hero-content p {
  margin: 0;
  color: var(--app-text-sub);
}

.hero-actions {
  display: flex;
  gap: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  border: 1px solid var(--app-border);
}

.summary-label {
  font-size: 12px;
  color: var(--app-text-sub);
}

.summary-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
}

.summary-desc {
  margin-top: 8px;
  font-size: 12px;
  color: var(--app-text-sub);
}

.tab-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 320px;
  gap: 18px;
}

.form-panel,
.preview-card,
.notify-item,
.security-grid :deep(.el-card),
.billing-grid :deep(.el-card) {
  border: 1px solid var(--app-border);
}

.preview-card {
  border-radius: 18px;
  padding: 20px;
  background: var(--app-surface);
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.preview-avatar {
  width: 88px;
  height: 88px;
  border-radius: 24px;
}

.preview-card h3 {
  margin: 0;
  font-size: 24px;
}

.preview-card p {
  margin: 0;
  color: var(--app-text-sub);
}

.preview-bio {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--app-text-sub);
}

.notify-list {
  display: grid;
  gap: 12px;
}

.notify-item {
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--app-surface);
}

.notify-item strong {
  font-size: 15px;
}

.notify-item p,
.panel-desc {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--app-text-sub);
}

.security-grid,
.billing-grid {
  display: grid;
  gap: 12px;
}

.security-meta {
  display: grid;
  gap: 10px;
  font-size: 13px;
  color: var(--app-text-sub);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.devices-card {
  grid-column: 1 / -1;
}

.device-list {
  display: grid;
  gap: 12px;
}

.device-item {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.device-item p {
  margin: 6px 0 0;
  color: var(--app-text-sub);
  font-size: 12px;
}

.device-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.asset-box {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asset-box span {
  font-size: 12px;
  color: var(--app-text-sub);
}

.asset-box strong {
  font-size: 20px;
}

.tab-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.tab-actions.left {
  justify-content: flex-start;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tab-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }

  .hero-content,
  .notify-item,
  .device-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid,
  .asset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
