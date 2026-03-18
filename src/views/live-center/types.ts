export interface HeroMetric {
  label: string
  value: string
  foot: string
}

export type AccentTone = 'rose' | 'amber' | 'aqua' | 'violet'

export interface KpiCard {
  label: string
  value: string
  badge: string
  delta: string
  note: string
  tone: AccentTone
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
  previewStreamUrl?: string
}

export interface LiveDataCard {
  label: string
  value: string
  foot: string
  tone: AccentTone
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
  tone: AccentTone
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
  tone: AccentTone | 'navy'
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

export interface LiveRoomViewerRankItem {
  name: string
  badge: string
  score: string
  bucket: 'paying' | 'vip'
  accent: Exclude<AccentTone, 'violet'>
}

export interface LiveRoomProduct {
  name: string
  badge: string
  summary: string
  price: string
  sold: string
  inventory: string
  discount: string
  perks: string[]
}

export interface LiveRoomSceneSegment {
  id: string
  label: string
  window: string
  goal: string
  progress: number
  tone: AccentTone
}

export interface LiveRoomSignalItem {
  label: string
  value: string
  note: string
  tone: AccentTone
}

export interface LiveRoomMetricProfile {
  interactRate: string
  cartRate: string
  stayDuration: string
  latency: string
  hourlyGmv: string
  audienceTrend: string
  payRate: string
}

export interface LiveRoomConversionHint {
  title: string
  detail: string
}

export interface LiveRoomDetail {
  viewerRanking: LiveRoomViewerRankItem[]
  roomProduct: LiveRoomProduct
  metrics: LiveRoomMetricProfile
  sceneSegments: LiveRoomSceneSegment[]
  signals: LiveRoomSignalItem[]
  conversionHint: LiveRoomConversionHint
  quickActions: string[]
  defaultSegmentId?: string
}

export interface LiveCenterDashboardSnapshot {
  heroTags: string[]
  heroMetrics: HeroMetric[]
  kpiCards: KpiCard[]
  roomList: StreamRoom[]
  liveDataCards: LiveDataCard[]
  liveFeed: LiveFeedItem[]
  trafficHighlights: TrafficHighlight[]
  giftItems: GiftItem[]
  rechargePackages: RechargePackage[]
  walletSummary: WalletSummary
  recentTransactions: WalletTransaction[]
  scheduleItems: ScheduleItem[]
  scriptBlocks: ScriptBlock[]
  conversionRanking: ConversionRow[]
  productItems: ProductItem[]
  teamTasks: TeamTask[]
  alerts: AlertItem[]
  roomDetails: Record<string, LiveRoomDetail>
}

export interface LiveCenterMonetizationPayload {
  roomId?: string
  giftId?: string
  packageId?: string
}

export interface LiveCenterMonetizationResult {
  liveFeed: LiveFeedItem[]
  recentTransactions: WalletTransaction[]
  walletSummary: WalletSummary
}
