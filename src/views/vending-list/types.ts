// 贩卖机数据类型
export interface VendingMachine {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'warning'
  temperature: number
  productCount: number
  todaySales: number
  todayRevenue: number
  lastMaintenance: string
  createTime: string
}

// 列表响应
export interface VendingListResponse {
  list: VendingMachine[]
  total: number
  page: number
  pageSize: number
}
