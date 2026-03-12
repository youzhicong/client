export interface HeroMetric {
  label: string
  value: string
  foot: string
}

export interface KpiCard {
  label: string
  value: string
  badge: string
  delta: string
  note: string
  tone: 'rose' | 'amber' | 'aqua' | 'violet'
  deltaTone: 'up' | 'down'
}

export interface StreamRoom {
  id: string
  name: string
  host: string
  slot: string
  category: string
  summary: string
  audience: string
  gmv: string
  status: string
  statusTone: 'live' | 'next' | 'done'
  tags: string[]
  coverTitle: string
}

export interface LiveDataCard {
  label: string
  value: string
  foot: string
  tone: 'rose' | 'amber' | 'aqua' | 'violet'
}

export interface LiveFeedItem {
  id: string
  user: string
  action: string
  highlight: string
  time: string
  tone: 'gift' | 'order' | 'follow' | 'notice'
}

export interface TrafficHighlight {
  label: string
  value: string
  delta: string
}

export interface GiftItem {
  id: string
  name: string
  desc: string
  badge: string
  price: number
  tone: 'rose' | 'amber' | 'aqua' | 'violet'
}

export interface RechargePackage {
  id: string
  coins: number
  bonus: number
  price: number
  badge: string
  desc: string
}

export interface WalletSummary {
  balance: number
  giftSpendToday: number
  rechargeToday: number
}

export interface WalletTransaction {
  id: string
  title: string
  note: string
  amount: number
  time: string
  type: 'recharge' | 'gift'
}

export interface ScheduleItem {
  time: string
  title: string
  phase: string
  owner: string
  status: string
  tone: 'live' | 'next' | 'done'
}

export interface ScriptBlock {
  stage: string
  duration: string
  focus: string
  action: string
  tone: 'rose' | 'amber' | 'aqua' | 'violet' | 'navy'
}

export interface ConversionRow {
  label: string
  value: string
  note: string
}

export interface ProductItem {
  name: string
  badge: string
  price: string
  sold: string
  inventory: string
  progress: number
}

export interface TeamTask {
  name: string
  owner: string
  deadline: string
  state: string
  tone: 'done' | 'next' | 'live'
}

export interface AlertItem {
  title: string
  detail: string
  level: string
  tone: 'high' | 'medium' | 'low'
}
