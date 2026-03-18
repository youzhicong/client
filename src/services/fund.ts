import { request } from '@/utils/request'

export interface FundItem {
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

export interface AddFundPayload {
  code: string
  shares: number
  cost: number
}

export interface DeleteFundPayload {
  code: string
}

export const getFundList = () => {
  return request<FundItem[]>('/fund/list', 'GET')
}

export const addFund = (payload: AddFundPayload) => {
  return request<FundItem>('/fund/add', 'POST', payload)
}

export const deleteFund = (payload: DeleteFundPayload) => {
  return request<null>('/fund/delete', 'DELETE', payload)
}
