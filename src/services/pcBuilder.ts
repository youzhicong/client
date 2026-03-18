import { request } from '@/utils/request'

export type PartPlatform = 'jd' | 'tmall' | 'pdd'

export interface PartPrice {
  platform: PartPlatform
  price: number
  url: string
}

export interface PartOption {
  id: string
  name: string
  specs: string
  score: number
  prices: PartPrice[]
}

export interface PartCategory {
  key: string
  label: string
  options: PartOption[]
}

export interface PcBuilderResult {
  updatedAt: string
  categories: PartCategory[]
}

export const getPcBuilderParts = () => {
  return request<PcBuilderResult>('/pc-builder/prices', 'GET')
}
