import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

// 基金数据类型
interface Fund {
  code: string
  name: string
  type: string
  nav: number
  estimateNav: number
  estimateChange: number
  updateTime: string
  holdShares: number
  holdCost: number
}

// 生成估值变化
const generateChange = () => {
  return Mock.Random.float(-3, 3, 2, 2)
}

// 模拟基金数据
const fundList: Fund[] = [
  {
    code: '000001',
    name: '华夏成长混合',
    type: '混合型',
    nav: 1.2345,
    estimateNav: 0,
    estimateChange: 0,
    updateTime: '',
    holdShares: 1000,
    holdCost: 1.15
  },
  {
    code: '110011',
    name: '易方达中小盘混合',
    type: '混合型',
    nav: 5.6789,
    estimateNav: 0,
    estimateChange: 0,
    updateTime: '',
    holdShares: 500,
    holdCost: 5.2
  },
  {
    code: '161725',
    name: '招商中证白酒指数',
    type: '指数型',
    nav: 1.8234,
    estimateNav: 0,
    estimateChange: 0,
    updateTime: '',
    holdShares: 2000,
    holdCost: 1.65
  },
  {
    code: '005827',
    name: '易方达蓝筹精选混合',
    type: '混合型',
    nav: 2.1567,
    estimateNav: 0,
    estimateChange: 0,
    updateTime: '',
    holdShares: 800,
    holdCost: 2.3
  },
  {
    code: '003834',
    name: '华夏能源革新股票',
    type: '股票型',
    nav: 3.4521,
    estimateNav: 0,
    estimateChange: 0,
    updateTime: '',
    holdShares: 600,
    holdCost: 3.1
  },
  {
    code: '519736',
    name: '交银新成长混合',
    type: '混合型',
    nav: 4.2345,
    estimateNav: 0,
    estimateChange: 0,
    updateTime: '',
    holdShares: 400,
    holdCost: 4.0
  }
]

export default [
  {
    url: '/api/fund/list',
    method: 'get',
    response: () => {
      const now = new Date()
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`

      const data = fundList.map((fund) => {
        const change = generateChange()
        const estimateNav = Number((fund.nav * (1 + change / 100)).toFixed(4))
        return {
          ...fund,
          estimateNav,
          estimateChange: change,
          updateTime: timeStr
        }
      })

      return {
        code: 200,
        message: 'success',
        data
      }
    }
  },
  {
    url: '/api/fund/add',
    method: 'post',
    response: ({
      body
    }: {
      body: { code: string; shares: number; cost: number }
    }) => {
      const { code, shares, cost } = body

      // 模拟添加基金
      const newFund: Fund = {
        code,
        name: Mock.Random.ctitle(4, 8) + '基金',
        type: Mock.Random.pick(['混合型', '股票型', '指数型', '债券型']),
        nav: Mock.Random.float(0.5, 5, 4, 4),
        estimateNav: 0,
        estimateChange: 0,
        updateTime: '',
        holdShares: shares,
        holdCost: cost
      }

      return {
        code: 200,
        message: 'success',
        data: newFund
      }
    }
  },
  {
    url: '/api/fund/delete',
    method: 'delete',
    response: () => {
      return {
        code: 200,
        message: 'success'
      }
    }
  }
] as MockMethod[]
