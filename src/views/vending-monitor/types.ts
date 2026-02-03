// 贩卖机设备信息
export interface VendingMachine {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'warning'
  temperature: number
  uptime: number // 运行时长（小时）
  lastMaintenance: string
}

// 商品信息
export interface Product {
  id: string
  name: string
  slot: number // 货道编号
  row: number // 行
  col: number // 列
  stock: number
  maxStock: number
  price: number
  color: string // 用于 3D 显示
}

// 销售数据
export interface SalesData {
  todaySales: number
  todayRevenue: number
  weekSales: number[]
  topProducts: Array<{
    name: string
    count: number
    revenue: number
  }>
}

// 告警信息
export interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  time: string
}

// 监控数据汇总
export interface MonitorData {
  machine: VendingMachine
  products: Product[]
  sales: SalesData
  alerts: Alert[]
}
