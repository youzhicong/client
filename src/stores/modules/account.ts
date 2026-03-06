/* eslint-disable @typescript-eslint/no-explicit-any */
export type AccountActivityTag = '账号' | '资料' | '安全' | '账单'

export interface AccountProfile {
  name: string
  role: string
  title: string
  company: string
  city: string
  email: string
  phone: string
  avatar: string
  bio: string
  joinedAt: string
  statusLabel: string
  lastActiveAt: number
}

export interface AccountNotifications {
  siteNotice: boolean
  weeklyDigest: boolean
  loginAlert: boolean
  approvalNotice: boolean
}

export interface AccountSecurity {
  emailVerified: boolean
  twoFactorEnabled: boolean
  deviceCount: number
  lastLoginAt: number
  lastLoginCity: string
  lastLoginDevice: string
  passwordUpdatedAt: string
}

export interface AccountAssets {
  points: number
  coupons: number
  plan: string
  renewalDate: string
  storageUsedGB: number
  storageCapacityGB: number
}

export interface AccountMetrics {
  monthlyLogins: number
  completedTasks: number
  messageAlerts: number
  collaborations: number
}

export interface AccountBillingRecord {
  id: string
  title: string
  desc: string
  amount: string
  status: 'paid' | 'processing'
  date: string
}

export interface AccountActivity {
  id: string
  title: string
  desc: string
  tag: AccountActivityTag
  createdAt: number
}

export interface AccountDevice {
  id: string
  name: string
  location: string
  lastSeenAt: number
  trusted: boolean
  current: boolean
}

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const now = Date.now()

const defaultProfile = (): AccountProfile => ({
  name: '李文心',
  role: '管理员',
  title: '产品设计师',
  company: '数字化平台',
  city: '上海',
  email: 'wenxin.li@platform.com',
  phone: '+86 138 **** 8899',
  avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=LiWenxin',
  bio: '负责数字化平台的产品设计、协作规范和体验升级。',
  joinedAt: '2024-12-22',
  statusLabel: '成长型账号',
  lastActiveAt: now - 2 * 60 * 1000
})

const defaultNotifications = (): AccountNotifications => ({
  siteNotice: true,
  weeklyDigest: false,
  loginAlert: true,
  approvalNotice: true
})

const defaultSecurity = (): AccountSecurity => ({
  emailVerified: false,
  twoFactorEnabled: true,
  deviceCount: 3,
  lastLoginAt: now - 2 * 60 * 1000,
  lastLoginCity: '上海',
  lastLoginDevice: 'Chrome 浏览器',
  passwordUpdatedAt: '2026-03-04'
})

const defaultAssets = (): AccountAssets => ({
  points: 2480,
  coupons: 3,
  plan: '专业版',
  renewalDate: '2026-12-22',
  storageUsedGB: 2.4,
  storageCapacityGB: 5
})

const defaultMetrics = (): AccountMetrics => ({
  monthlyLogins: 28,
  completedTasks: 16,
  messageAlerts: 5,
  collaborations: 7
})

const defaultBillingRecords = (): AccountBillingRecord[] => [
  {
    id: 'bill-1',
    title: '专业版续费',
    desc: '数字化平台专业版年度订阅',
    amount: '¥ 899.00',
    status: 'paid',
    date: '2026-02-20'
  },
  {
    id: 'bill-2',
    title: '云存储扩容',
    desc: '增加 10GB 协作存储空间',
    amount: '¥ 59.00',
    status: 'paid',
    date: '2026-01-15'
  },
  {
    id: 'bill-3',
    title: '企业发票处理中',
    desc: '审批流模板增值服务',
    amount: '¥ 199.00',
    status: 'processing',
    date: '2026-03-05'
  }
]

const defaultActivities = (): AccountActivity[] => [
  {
    id: 'act-1',
    createdAt: now - 2 * 60 * 1000,
    title: '完成表单搭建',
    desc: '《用户反馈》项目已发布并通知团队成员。',
    tag: '资料'
  },
  {
    id: 'act-2',
    createdAt: now - 60 * 60 * 1000,
    title: '更新头像',
    desc: '新头像已同步到控制台和协作空间。',
    tag: '资料'
  },
  {
    id: 'act-3',
    createdAt: now - 24 * 60 * 60 * 1000,
    title: '创建团队空间',
    desc: '新增 4 位协作者，已分配初始权限。',
    tag: '账号'
  },
  {
    id: 'act-4',
    createdAt: now - 2 * 24 * 60 * 60 * 1000,
    title: '修改密码',
    desc: '系统已更新安全策略并启用二次校验。',
    tag: '安全'
  }
]

const defaultDevices = (): AccountDevice[] => [
  {
    id: 'dev-1',
    name: 'Chrome 浏览器',
    location: '上海',
    lastSeenAt: now - 2 * 60 * 1000,
    trusted: true,
    current: true
  },
  {
    id: 'dev-2',
    name: 'Windows 客户端',
    location: '上海',
    lastSeenAt: now - 8 * 60 * 60 * 1000,
    trusted: true,
    current: false
  },
  {
    id: 'dev-3',
    name: 'iPhone 16 Pro',
    location: '杭州',
    lastSeenAt: now - 2 * 24 * 60 * 60 * 1000,
    trusted: false,
    current: false
  }
]

export const useAccountStore = defineStore(
  'cp-account',
  () => {
    const profile = ref<AccountProfile>(defaultProfile())
    const notifications = ref<AccountNotifications>(defaultNotifications())
    const security = ref<AccountSecurity>(defaultSecurity())
    const assets = ref<AccountAssets>(defaultAssets())
    const metrics = ref<AccountMetrics>(defaultMetrics())
    const billingRecords = ref<AccountBillingRecord[]>(defaultBillingRecords())
    const activities = ref<AccountActivity[]>(defaultActivities())
    const devices = ref<AccountDevice[]>(defaultDevices())

    const syncDeviceCount = () => {
      security.value.deviceCount = devices.value.length
    }

    const recordActivity = (
      title: string,
      desc: string,
      tag: AccountActivityTag = '账号'
    ) => {
      activities.value.unshift({
        id: createId('act'),
        title,
        desc,
        tag,
        createdAt: Date.now()
      })
      activities.value = activities.value.slice(0, 24)
    }

    const hydrateFromUser = (user?: any) => {
      if (!user) return

      const nextName =
        user.name || user.username || user.nickname || user.account || ''
      if (nextName) profile.value.name = String(nextName)
      if (user.email) profile.value.email = String(user.email)
      if (user.role) profile.value.role = String(user.role)
      if (user.avatar) profile.value.avatar = String(user.avatar)
      if (user.city) profile.value.city = String(user.city)
      profile.value.lastActiveAt = Date.now()
    }

    const updateProfile = (payload: Partial<AccountProfile>) => {
      profile.value = {
        ...profile.value,
        ...payload,
        lastActiveAt: Date.now()
      }
      recordActivity('更新个人资料', '已保存新的个人资料信息。', '资料')
    }

    const updateNotifications = (payload: Partial<AccountNotifications>) => {
      notifications.value = { ...notifications.value, ...payload }
      recordActivity('更新通知偏好', '通知提醒配置已同步更新。', '账号')
    }

    const verifyEmail = () => {
      if (security.value.emailVerified) return
      security.value.emailVerified = true
      recordActivity('完成邮箱验证', '账号邮箱已验证，可用于安全找回。', '安全')
    }

    const setTwoFactor = (enabled: boolean) => {
      security.value.twoFactorEnabled = enabled
      recordActivity(
        enabled ? '开启双重验证' : '关闭双重验证',
        enabled ? '登录时将增加二次校验。' : '登录将不再需要二次校验。',
        '安全'
      )
    }

    const rotatePassword = () => {
      security.value.passwordUpdatedAt = new Date().toISOString().slice(0, 10)
      recordActivity(
        '更新登录密码',
        '密码已更新，旧会话安全策略已刷新。',
        '安全'
      )
    }

    const exportArchive = () => ({
      exportedAt: new Date().toISOString(),
      profile: profile.value,
      notifications: notifications.value,
      security: security.value,
      assets: assets.value,
      metrics: metrics.value,
      billingRecords: billingRecords.value,
      activities: activities.value,
      devices: devices.value
    })

    const upsertCurrentDevice = (name: string, location: string) => {
      const existing = devices.value.find(
        (item) => item.name === name && item.location === location
      )

      devices.value.forEach((item) => {
        item.current = false
      })

      if (existing) {
        existing.current = true
        existing.trusted = true
        existing.lastSeenAt = Date.now()
      } else {
        devices.value.unshift({
          id: createId('dev'),
          name,
          location,
          lastSeenAt: Date.now(),
          trusted: true,
          current: true
        })
      }

      devices.value = devices.value.slice(0, 8)
      syncDeviceCount()
    }

    const registerLogin = (payload?: { device?: string; city?: string }) => {
      const device = payload?.device || 'Web 浏览器'
      const city = payload?.city || '上海'
      const timestamp = Date.now()

      profile.value.lastActiveAt = timestamp
      security.value.lastLoginAt = timestamp
      security.value.lastLoginCity = city
      security.value.lastLoginDevice = device
      metrics.value.monthlyLogins += 1

      upsertCurrentDevice(device, city)
      recordActivity(
        '登录成功',
        `通过 ${device} 登录，当前地点 ${city}。`,
        '账号'
      )
    }

    const removeDevice = (id: string) => {
      const target = devices.value.find((item) => item.id === id)
      if (!target || target.current) return false
      devices.value = devices.value.filter((item) => item.id !== id)
      syncDeviceCount()
      recordActivity('移除设备', `已移除设备 ${target.name}。`, '安全')
      return true
    }

    return {
      profile,
      notifications,
      security,
      assets,
      metrics,
      billingRecords,
      activities,
      devices,
      hydrateFromUser,
      updateProfile,
      updateNotifications,
      verifyEmail,
      setTwoFactor,
      rotatePassword,
      exportArchive,
      registerLogin,
      recordActivity,
      removeDevice
    }
  },
  {
    persist: true
  }
)
