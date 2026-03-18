import { request } from '@/utils/request'

export type HomeTrendTone = 'up' | 'down'

export interface HomeHeroStat {
  label: string
  value: string
  delta: string
  deltaTone: HomeTrendTone
}

export interface HomeKpiCard {
  label: string
  value: string
  trend: string
  trendTone: HomeTrendTone
  tag: string
  tone: 'teal' | 'orange' | 'navy' | 'green'
}

export interface HomeHealthMetric {
  label: string
  value: string
  progress: number
  trend: string
  trendTone: HomeTrendTone
  color: string
}

export interface HomeChannelItem {
  name: string
  value: number
  color: string
}

export interface HomeRegionItem {
  name: string
  value: number
}

export interface HomeDashboardData {
  heroStats: HomeHeroStat[]
  weekDays: string[]
  uvData: number[]
  pvData: number[]
  channelData: HomeChannelItem[]
  regionData: HomeRegionItem[]
  kpiCards: HomeKpiCard[]
  healthMetrics: HomeHealthMetric[]
}

export const getHomeDashboard = () => {
  return request<HomeDashboardData>('/home/dashboard', 'GET')
}
