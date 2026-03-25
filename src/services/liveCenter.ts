import { request } from '@/utils/request'
import type {
  LiveCenterDashboardSnapshot,
  LiveCenterMonetizationPayload,
  LiveCenterMonetizationResult
} from '@/views/live-center/types'

export const getLiveCenterDashboard = () => {
  return request<LiveCenterDashboardSnapshot>('/live-center/dashboard', 'GET')
}

export const sendLiveCenterGift = (payload: LiveCenterMonetizationPayload) => {
  return request<LiveCenterMonetizationResult>(
    '/live-center/send-gift',
    'POST',
    payload
  )
}

export const rechargeLiveCenterWallet = (
  payload: LiveCenterMonetizationPayload
) => {
  return request<LiveCenterMonetizationResult>(
    '/live-center/recharge',
    'POST',
    payload
  )
}
