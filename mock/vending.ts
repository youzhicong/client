import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

// 商品颜色列表
const productColors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

// 生成商品数据
const generateProducts = () => {
  const products = []
  const names = ['可乐', '雪碧', '绿茶', '红茶', '咖啡', '矿泉水', '果汁', '牛奶']

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const index = row * 4 + col
      if (index >= names.length) break

      products.push({
        id: `P${String(index + 1).padStart(3, '0')}`,
        name: names[index],
        slot: index + 1,
        row,
        col,
        stock: Mock.Random.integer(0, 10),
        maxStock: 10,
        price: Mock.Random.float(3, 8, 0, 0),
        color: productColors[index % productColors.length],
      })
    }
  }
  return products
}

// 生成告警数据
const generateAlerts = () => {
  const alerts = []
  const types = ['warning', 'error', 'info'] as const
  const messages = ['可乐库存不足', '设备温度异常', '支付模块离线', '货道A3卡货', '网络连接不稳定']

  const count = Mock.Random.integer(0, 3)
  for (let i = 0; i < count; i++) {
    alerts.push({
      id: `A${i + 1}`,
      type: Mock.Random.pick(types),
      message: Mock.Random.pick(messages),
      time: `${Mock.Random.integer(0, 23)}:${String(Mock.Random.integer(0, 59)).padStart(2, '0')}`,
    })
  }
  return alerts
}

export default [
  {
    url: '/api/vending/monitor',
    method: 'get',
    response: () => {
      const products = generateProducts()

      return {
        code: 200,
        message: 'success',
        data: {
          machine: {
            id: 'VM_001',
            name: '1号贩卖机',
            location: '办公楼 A 座一层',
            status: Mock.Random.pick(['online', 'online', 'online', 'warning']),
            temperature: Mock.Random.float(4, 8, 1, 1),
            uptime: Mock.Random.integer(100, 500),
          },
          products,
          sales: {
            todaySales: Mock.Random.integer(50, 100),
            todayRevenue: Mock.Random.integer(300, 800),
            weekSales: Array.from({ length: 7 }, () => Mock.Random.integer(40, 120)),
            topProducts: [
              { name: '可乐', count: Mock.Random.integer(20, 40) },
              { name: '矿泉水', count: Mock.Random.integer(15, 30) },
              { name: '咖啡', count: Mock.Random.integer(10, 25) },
            ],
          },
          alerts: generateAlerts(),
        },
      }
    },
  },
] as MockMethod[]
