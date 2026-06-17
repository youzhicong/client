import type { MockMethod } from 'vite-plugin-mock'

type LoginBody = {
  account?: string
  password?: string
}

const resolveRole = (account: string) => {
  const normalized = account.trim().toLowerCase()
  if (normalized === 'admin' || normalized.includes('manage')) return '管理员'
  if (normalized.includes('design')) return '设计'
  if (normalized.includes('operate')) return '运营'
  return '研发'
}

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: { body: LoginBody }) => {
      const account = String(body.account || '').trim()
      const password = String(body.password || '').trim()

      if (!account || !password) {
        return {
          code: 400,
          message: '请输入账号和密码'
        }
      }

      if (password.length < 6) {
        return {
          code: 400,
          message: '密码长度不能少于 6 位'
        }
      }

      const role = resolveRole(account)

      return {
        code: 200,
        data: {
          user: {
            token: `mock-token-${Date.now()}`,
            name: account,
            username: account,
            nickname: account,
            account,
            email: `${account}@yzcTool.com`,
            role,
            city: '上海',
            avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(account)}`
          }
        }
      }
    }
  }
] as MockMethod[]
