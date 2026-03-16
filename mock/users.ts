import type { MockMethod, RespThisType } from 'vite-plugin-mock'

const useBackend = process.env.VITE_USE_BACKEND_FOR_CORE_APIS === 'true'

type UserStatus = 'active' | 'invited' | 'disabled'

interface UserItem {
  id: number
  code: string
  name: string
  email: string
  department: string
  location: string
  role: string
  status: UserStatus
  lastActive: string
  joinedAt: string
  avatar: string
  online: boolean
}

interface VisitLogItem {
  id: number
  visitorName: string
  ip: string
  userAgent: string
  path: string
  visitedAt: string
}

type QueryRecord = Record<string, string>

const seedUsers: UserItem[] = [
  {
    id: 1,
    code: 'U-1001',
    name: '李文心',
    email: 'wenxin.li@yzc.com',
    department: '产品设计',
    location: '上海',
    role: '管理员',
    status: 'active',
    lastActive: '10 分钟前',
    joinedAt: '2023-08-12',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wenxin',
    online: true
  },
  {
    id: 2,
    code: 'U-1002',
    name: '陈默',
    email: 'chen.mo@yzc.com',
    department: '前端研发',
    location: '杭州',
    role: '研发',
    status: 'active',
    lastActive: '1 小时前',
    joinedAt: '2022-11-03',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenmo',
    online: true
  },
  {
    id: 3,
    code: 'U-1003',
    name: '周楠',
    email: 'zhou.nan@yzc.com',
    department: '运营',
    location: '深圳',
    role: '运营',
    status: 'invited',
    lastActive: '2 天前',
    joinedAt: '2024-06-29',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhounan',
    online: false
  },
  {
    id: 4,
    code: 'U-1004',
    name: '任泽',
    email: 'ren.ze@yzc.com',
    department: '数据平台',
    location: '北京',
    role: '研发',
    status: 'active',
    lastActive: '30 分钟前',
    joinedAt: '2021-04-18',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=renze',
    online: true
  },
  {
    id: 5,
    code: 'U-1005',
    name: '安晴',
    email: 'an.qing@yzc.com',
    department: '人力资源',
    location: '上海',
    role: '运营',
    status: 'disabled',
    lastActive: '1 个月前',
    joinedAt: '2020-09-01',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anqing',
    online: false
  },
  {
    id: 6,
    code: 'U-1006',
    name: '高宇',
    email: 'gao.yu@yzc.com',
    department: '视觉设计',
    location: '成都',
    role: '设计',
    status: 'active',
    lastActive: '3 小时前',
    joinedAt: '2022-01-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gaoyu',
    online: false
  },
  {
    id: 7,
    code: 'U-1007',
    name: '宋淼',
    email: 'song.miao@yzc.com',
    department: '产品策略',
    location: '南京',
    role: '管理员',
    status: 'active',
    lastActive: '刚刚',
    joinedAt: '2023-03-08',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=songmiao',
    online: true
  },
  {
    id: 8,
    code: 'U-1008',
    name: '丁贺',
    email: 'ding.he@yzc.com',
    department: '客户成功',
    location: '广州',
    role: '运营',
    status: 'invited',
    lastActive: '未激活',
    joinedAt: '2024-12-21',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dinghe',
    online: false
  },
  {
    id: 9,
    code: 'U-1009',
    name: '陆雯',
    email: 'lu.wen@yzc.com',
    department: '市场',
    location: '上海',
    role: '运营',
    status: 'active',
    lastActive: '昨天',
    joinedAt: '2021-12-09',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luwen',
    online: true
  },
  {
    id: 10,
    code: 'U-1010',
    name: '彭煜',
    email: 'peng.yu@yzc.com',
    department: '后端研发',
    location: '杭州',
    role: '研发',
    status: 'active',
    lastActive: '20 分钟前',
    joinedAt: '2022-05-27',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pengyu',
    online: true
  },
  {
    id: 11,
    code: 'U-1011',
    name: '顾乔',
    email: 'gu.qiao@yzc.com',
    department: '品牌设计',
    location: '上海',
    role: '设计',
    status: 'active',
    lastActive: '4 小时前',
    joinedAt: '2021-07-19',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guqiao',
    online: false
  },
  {
    id: 12,
    code: 'U-1012',
    name: '张致',
    email: 'zhang.zhi@yzc.com',
    department: '风控合规',
    location: '北京',
    role: '管理员',
    status: 'disabled',
    lastActive: '2 个月前',
    joinedAt: '2019-02-14',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangzhi',
    online: false
  }
]

const userStore = [...seedUsers]
let visitLogs: VisitLogItem[] = []
let nextUserId = Math.max(...seedUsers.map((item) => item.id)) + 1
let nextVisitId = 1

const today = () => new Date().toISOString().slice(0, 10)

const createUserCode = (id: number) => `U-${String(1000 + id)}`

const normalizeIp = (value: string) => {
  const input = value.trim()
  if (!input) return 'unknown'
  const first = input.split(',')[0].trim()
  if (first === '::1') return '127.0.0.1'
  if (first.startsWith('::ffff:')) return first.slice(7)
  return first
}

const getIpFromContext = (
  ctx: RespThisType,
  headers: Record<string, unknown>
) => {
  const headerIp = headers['x-forwarded-for']
  if (typeof headerIp === 'string' && headerIp.trim()) {
    return normalizeIp(headerIp)
  }
  if (
    Array.isArray(headerIp) &&
    headerIp.length &&
    typeof headerIp[0] === 'string'
  ) {
    return normalizeIp(headerIp[0])
  }
  const reqIp = ctx.req.socket?.remoteAddress || ''
  return normalizeIp(reqIp)
}

const getSummary = (list: UserItem[]) => {
  const active = list.filter((item) => item.status === 'active').length
  const invited = list.filter((item) => item.status === 'invited').length
  const disabled = list.filter((item) => item.status === 'disabled').length
  return {
    total: list.length,
    active,
    invited,
    disabled
  }
}

const getRoleOptions = () =>
  Array.from(new Set(userStore.map((item) => item.role)))

export default (useBackend
  ? []
  : [
      {
        url: '/api/users/list',
        method: 'get',
        response: ({ query }: { query: QueryRecord }) => {
          const {
            keyword = '',
            role = '',
            status = '',
            page = '1',
            pageSize = '8'
          } = query
          const keywordValue = keyword.trim().toLowerCase()

          const filtered = userStore.filter((item) => {
            const hitKeyword =
              !keywordValue ||
              [item.name, item.email, item.department].some((field) =>
                field.toLowerCase().includes(keywordValue)
              )
            const hitRole = !role || item.role === role
            const hitStatus = !status || item.status === status
            return hitKeyword && hitRole && hitStatus
          })

          const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)
          const size = Math.max(1, Number.parseInt(pageSize, 10) || 8)
          const start = (currentPage - 1) * size
          const end = start + size

          return {
            code: 200,
            message: 'success',
            data: {
              list: filtered.slice(start, end),
              total: filtered.length,
              page: currentPage,
              pageSize: size,
              roleOptions: getRoleOptions(),
              summary: getSummary(filtered)
            }
          }
        }
      },
      {
        url: '/api/users/add',
        method: 'post',
        response: ({ body }: { body: Partial<UserItem> }) => {
          if (!body?.name || !body?.email || !body?.department || !body?.role) {
            return { code: 422, message: '请填写完整用户信息' }
          }

          if (userStore.some((item) => item.email === body.email)) {
            return { code: 409, message: '邮箱已存在' }
          }

          const id = nextUserId++
          const user: UserItem = {
            id,
            code: createUserCode(id),
            name: body.name.trim(),
            email: body.email.trim(),
            department: body.department.trim(),
            location: (body.location || '未设置').trim(),
            role: body.role.trim(),
            status: (body.status || 'invited') as UserStatus,
            lastActive: '刚刚',
            joinedAt: today(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user-${id}`,
            online: false
          }

          userStore.unshift(user)
          return { code: 200, message: '添加成功', data: user }
        }
      },
      {
        url: '/api/users/update',
        method: 'put',
        response: ({ body }: { body: Partial<UserItem> & { id?: number } }) => {
          if (!body?.id) return { code: 400, message: '缺少用户 ID' }

          const index = userStore.findIndex(
            (item) => item.id === Number(body.id)
          )
          if (index < 0) return { code: 404, message: '用户不存在' }

          if (
            body.email &&
            userStore.some(
              (item) => item.id !== body.id && item.email === body.email
            )
          ) {
            return { code: 409, message: '邮箱已存在' }
          }

          userStore[index] = {
            ...userStore[index],
            ...body,
            id: Number(body.id)
          }

          return { code: 200, message: '修改成功', data: userStore[index] }
        }
      },
      {
        url: '/api/users/delete/:id',
        method: 'delete',
        response: ({ query }: { query: QueryRecord }) => {
          const id = Number(query.id)
          const index = userStore.findIndex((item) => item.id === id)
          if (index < 0) return { code: 404, message: '用户不存在' }
          userStore.splice(index, 1)
          return { code: 200, message: '删除成功', data: null }
        }
      },
      {
        url: '/api/users/visit/register',
        method: 'post',
        response: function (this: RespThisType, { body, headers }) {
          const ip = getIpFromContext(this, headers)
          const userAgent = String(
            this.req.headers['user-agent'] || headers['user-agent'] || 'unknown'
          )
          const payload = (body || {}) as {
            visitorName?: string
            path?: string
          }
          const visitorName = payload.visitorName?.trim() || '匿名访问'
          const path = payload.path?.trim() || '/'

          const now = new Date().toISOString()
          const log: VisitLogItem = {
            id: nextVisitId++,
            visitorName,
            ip,
            userAgent,
            path,
            visitedAt: now
          }
          visitLogs.unshift(log)
          visitLogs = visitLogs.slice(0, 200)

          const user = userStore.find((item) => item.name === visitorName)
          if (user) {
            user.online = true
            user.lastActive = '刚刚'
          }

          return {
            code: 200,
            message: '记录成功',
            data: log
          }
        }
      },
      {
        url: '/api/users/visit/logs',
        method: 'get',
        response: ({ query }: { query: QueryRecord }) => {
          const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1)
          const pageSize = Math.max(
            1,
            Number.parseInt(query.pageSize || '20', 10) || 20
          )
          const start = (page - 1) * pageSize
          const end = start + pageSize
          return {
            code: 200,
            message: 'success',
            data: {
              list: visitLogs.slice(start, end),
              total: visitLogs.length
            }
          }
        }
      }
    ]) as MockMethod[]
