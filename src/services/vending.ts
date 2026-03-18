import { request } from '@/utils/request'

export type VendingMachineStatus = 'online' | 'offline' | 'warning'

export interface VendingMachine {
  id: string
  name: string
  location: string
  status: VendingMachineStatus
  temperature: number
  productCount: number
  todaySales: number
  todayRevenue: number
  lastMaintenance: string
  createTime: string
}

export interface VendingProduct {
  id: string
  name: string
  slot: number
  row: number
  col: number
  stock: number
  maxStock: number
  price: number
  color: string
}

export interface VendingSalesData {
  todaySales: number
  todayRevenue: number
  weekSales: number[]
  topProducts: Array<{
    name: string
    count: number
    revenue: number
  }>
}

export interface VendingAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  time: string
}

export interface VendingMonitorData {
  machine: {
    id: string
    name: string
    location: string
    status: VendingMachineStatus
    temperature: number
    uptime: number
    lastMaintenance: string
  }
  products: VendingProduct[]
  sales: VendingSalesData
  alerts: VendingAlert[]
}

export interface VendingListQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: VendingMachineStatus | ''
}

export interface VendingListResult {
  list: VendingMachine[]
  total: number
  page: number
  pageSize: number
}

export interface VendingUpsertPayload {
  id?: string
  name: string
  location: string
  status?: VendingMachineStatus
}

export const getVendingList = (query: VendingListQuery = {}) => {
  return request<VendingListResult>('/vending/list', 'GET', {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10,
    keyword: query.keyword?.trim(),
    status: query.status || undefined
  })
}

export const createVendingMachine = (payload: VendingUpsertPayload) => {
  return request<VendingMachine>('/vending/add', 'POST', payload)
}

export const updateVendingMachine = (
  payload: VendingUpsertPayload & { id: string }
) => {
  return request<VendingMachine>('/vending/update', 'PUT', payload)
}

export const deleteVendingMachine = (id: string) => {
  return request<null>(`/vending/delete/${id}`, 'DELETE')
}

export const getVendingMonitor = (machineId?: string) => {
  return request<VendingMonitorData>(
    '/vending/monitor',
    'GET',
    machineId ? { id: machineId } : undefined
  )
}
