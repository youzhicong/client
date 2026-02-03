import type { MonitorData, Product, Alert } from './types'

// 商品颜色配置
const productColors = [
  '#ef4444', // 红
  '#f97316', // 橙
  '#eab308', // 黄
  '#22c55e', // 绿
  '#06b6d4', // 青
  '#3b82f6', // 蓝
  '#8b5cf6', // 紫
  '#ec4899' // 粉
]

// 生成商品数据
const generateProducts = (): Product[] => {
  const products: Product[] = []
  const productNames = [
    '可口可乐',
    '雪碧',
    '芬达',
    '矿泉水',
    '红牛',
    '咖啡',
    '绿茶',
    '奶茶',
    '薯片',
    '巧克力',
    '饼干',
    '口香糖'
  ]

  let slot = 1
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const maxStock = 10
      products.push({
        id: `product-${slot}`,
        name: productNames[slot - 1] || `商品${slot}`,
        slot,
        row,
        col,
        stock: Math.floor(Math.random() * maxStock) + 1,
        maxStock,
        price: Math.floor(Math.random() * 10) + 3,
        color: productColors[(row * 4 + col) % productColors.length]
      })
      slot++
    }
  }
  return products
}

// 模拟数据
export const mockMonitorData: MonitorData = {
  machine: {
    id: 'VM-001',
    name: '1号贩卖机',
    location: '办公楼 A 座一层',
    status: 'online',
    temperature: 4.5,
    uptime: 720,
    lastMaintenance: '2026-01-15'
  },
  products: generateProducts(),
  sales: {
    todaySales: 68,
    todayRevenue: 486,
    weekSales: [45, 52, 68, 41, 73, 89, 68],
    topProducts: [
      { name: '可口可乐', count: 23, revenue: 115 },
      { name: '矿泉水', count: 18, revenue: 54 },
      { name: '红牛', count: 12, revenue: 96 }
    ]
  },
  alerts: [
    {
      id: 'alert-1',
      type: 'warning',
      message: '商品「可口可乐」库存不足',
      time: '10:23'
    },
    {
      id: 'alert-2',
      type: 'info',
      message: '设备温度正常',
      time: '09:00'
    }
  ]
}

// 模拟实时数据更新
export const updateMockData = (data: MonitorData): MonitorData => {
  // 随机更新一些数据
  const newProducts = data.products.map((p) => ({
    ...p,
    stock: Math.max(0, p.stock + (Math.random() > 0.7 ? -1 : 0))
  }))

  // 检查低库存告警
  const lowStockAlerts: Alert[] = newProducts
    .filter((p) => p.stock <= 2 && p.stock > 0)
    .map((p) => ({
      id: `alert-stock-${p.id}`,
      type: 'warning' as const,
      message: `商品「${p.name}」库存不足（剩余${p.stock}件）`,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

  return {
    ...data,
    products: newProducts,
    machine: {
      ...data.machine,
      temperature: 4 + Math.random() * 2
    },
    sales: {
      ...data.sales,
      todaySales: data.sales.todaySales + (Math.random() > 0.8 ? 1 : 0)
    },
    alerts: [...lowStockAlerts.slice(0, 3), ...data.alerts.slice(0, 2)]
  }
}
