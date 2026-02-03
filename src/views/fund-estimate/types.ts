// 基金数据类型
export interface Fund {
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

// 持仓统计
export interface HoldingSummary {
  totalCost: number
  totalValue: number
  totalProfit: number
  profitRate: number
}

// API 响应
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
