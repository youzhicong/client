import type {
  AlertItem,
  ConversionRow,
  GiftItem,
  HeroMetric,
  KpiCard,
  LiveDataCard,
  LiveFeedItem,
  ProductItem,
  RechargePackage,
  ScheduleItem,
  ScriptBlock,
  StreamRoom,
  TeamTask,
  TrafficHighlight,
  WalletSummary,
  WalletTransaction
} from './types'

export const heroTags = [
  '直播排班总览',
  '实时互动追踪',
  '礼物与充值转化',
  '运营协同面板'
]

export const heroMetrics: HeroMetric[] = [
  { label: '当前在线', value: '18,640', foot: '主会场峰值较昨日 +12.8%' },
  { label: '互动热度', value: '43,820', foot: '点赞、弹幕、关注实时汇总' },
  { label: '礼物流水', value: '￥98,600', foot: '礼物充值与送礼动作同步提升' }
]

export const kpiCards: KpiCard[] = [
  {
    label: '开播房间',
    value: '03 / 05',
    badge: '直播排班',
    delta: '+1 场',
    note: '20:30 新品加场',
    tone: 'rose',
    deltaTone: 'up'
  },
  {
    label: '峰值在线',
    value: '22,480',
    badge: '观看热度',
    delta: '+9.6%',
    note: '主会场 19:10 达峰',
    tone: 'amber',
    deltaTone: 'up'
  },
  {
    label: '礼物送出',
    value: '6,320',
    badge: '用户互动',
    delta: '+14.2%',
    note: '火箭和应援卡提升明显',
    tone: 'aqua',
    deltaTone: 'up'
  },
  {
    label: '支付转化',
    value: '7.9%',
    badge: '订单转化',
    delta: '+0.8%',
    note: '连麦答疑后提升',
    tone: 'violet',
    deltaTone: 'up'
  }
]

export const roomList: StreamRoom[] = [
  {
    id: 'room-main',
    name: '品牌主会场',
    host: '安可',
    slot: '18:00 - 23:00',
    category: '美妆护肤',
    summary: '主会场负责今晚核心爆品讲解、限时福利和用户互动控场。',
    audience: '18,640',
    gmv: '￥286,000',
    status: '直播中',
    statusTone: 'live',
    tags: ['主会场', '爆品讲解', '限时券'],
    coverTitle: 'LIVE COMMERCE HUB',
    previewStreamUrl: 'mock://room-main'
  },
  {
    id: 'room-new',
    name: '新品试色专场',
    host: '小桃',
    slot: '20:30 - 21:30',
    category: '新品首发',
    summary: '新品试色专场负责承接高意向用户，集中引导加购与收藏。',
    audience: '8,920',
    gmv: '￥112,000',
    status: '待开播',
    statusTone: 'next',
    tags: ['新品专场', '试色互动', '收藏转化'],
    coverTitle: 'NEW ARRIVAL',
    previewStreamUrl: 'mock://room-new'
  },
  {
    id: 'room-member',
    name: '会员返场专区',
    host: '陆雨',
    slot: '14:00 - 16:00',
    category: '会员专享',
    summary: '返场专区负责承接回放用户和会员权益触达，维持复购节奏。',
    audience: '5,860',
    gmv: '￥68,400',
    status: '已结束',
    statusTone: 'done',
    tags: ['会员回访', '复购转化', '售后答疑'],
    coverTitle: 'MEMBER LIVE',
    previewStreamUrl: 'mock://room-member'
  }
]

export const liveDataCards: LiveDataCard[] = [
  { label: '实时在线', value: '18,640', foot: '主会场贡献 72%', tone: 'rose' },
  {
    label: '分钟互动',
    value: '3,280',
    foot: '点赞与弹幕同步增长',
    tone: 'amber'
  },
  { label: '加购用户', value: '1,842', foot: '新品卡位表现最佳', tone: 'aqua' },
  { label: '支付订单', value: '486', foot: '订单转化维持高位', tone: 'violet' }
]

export const liveFeedSeed: LiveFeedItem[] = [
  {
    id: 'feed-1',
    user: '用户 A12',
    action: '送出',
    highlight: '超级火箭 x1',
    time: '刚刚',
    tone: 'gift'
  },
  {
    id: 'feed-2',
    user: '会员 903',
    action: '完成充值',
    highlight: '活动档 3280 金豆',
    time: '1 分钟前',
    tone: 'notice'
  },
  {
    id: 'feed-3',
    user: '路人粉 58',
    action: '新增关注',
    highlight: '已预约下一场新品专场',
    time: '3 分钟前',
    tone: 'follow'
  },
  {
    id: 'feed-4',
    user: '用户 C21',
    action: '下单',
    highlight: '双抗修护精华套组',
    time: '5 分钟前',
    tone: 'order'
  }
]

export const trafficHighlights: TrafficHighlight[] = [
  { label: '平均停留时长', value: '11m 28s', delta: '+1m 12s' },
  { label: '进房转粉率', value: '16.4%', delta: '+2.1%' },
  { label: '互动触发率', value: '38.9%', delta: '+4.3%' }
]

export const giftItems: GiftItem[] = [
  {
    id: 'gift-rocket',
    name: '超级火箭',
    desc: '高价值用户表达支持的强互动礼物。',
    badge: '热门',
    price: 5200,
    tone: 'rose'
  },
  {
    id: 'gift-bloom',
    name: '加冕花冠',
    desc: '适合主会场冲榜和高热时段使用。',
    badge: '冲榜',
    price: 1888,
    tone: 'amber'
  },
  {
    id: 'gift-heart',
    name: '爱心气泡',
    desc: '低门槛礼物，适合弹幕互动引导。',
    badge: '轻互动',
    price: 99,
    tone: 'aqua'
  },
  {
    id: 'gift-coupon',
    name: '应援卡',
    desc: '带动停留与分享行为的日常礼物。',
    badge: '转化',
    price: 299,
    tone: 'violet'
  }
]

export const rechargePackages: RechargePackage[] = [
  {
    id: 'pkg-1',
    coins: 600,
    bonus: 60,
    price: 60,
    badge: '新手',
    desc: '适合首次尝试互动送礼'
  },
  {
    id: 'pkg-2',
    coins: 3280,
    bonus: 320,
    price: 328,
    badge: '推荐',
    desc: '主流用户档位，支持多次送礼'
  },
  {
    id: 'pkg-3',
    coins: 6480,
    bonus: 880,
    price: 648,
    badge: '高阶',
    desc: '适合高频互动和冲榜用户'
  }
]

export const walletSummary: WalletSummary = {
  balance: 8620,
  giftSpendToday: 2860,
  rechargeToday: 6480
}

export const transactionSeed: WalletTransaction[] = [
  {
    id: 'txn-1',
    title: '充值金豆',
    note: '活动档 6480 金豆',
    amount: 6480,
    time: '今天 19:26',
    type: 'recharge'
  },
  {
    id: 'txn-2',
    title: '送出超级火箭',
    note: '品牌主会场',
    amount: -5200,
    time: '今天 19:32',
    type: 'gift'
  },
  {
    id: 'txn-3',
    title: '送出应援卡',
    note: '会员返场专区',
    amount: -299,
    time: '今天 16:05',
    type: 'gift'
  }
]

export const scheduleItems: ScheduleItem[] = [
  {
    time: '18:00',
    title: '品牌主会场开播',
    phase: '开场预热',
    owner: '主播 安可 / 场控 七喜',
    status: '执行中',
    tone: 'live'
  },
  {
    time: '19:30',
    title: '爆品专讲与连麦答疑',
    phase: '转化冲刺',
    owner: '主播 安可 / 运营 Mia',
    status: '待执行',
    tone: 'next'
  },
  {
    time: '20:30',
    title: '新品试色专场接力',
    phase: '新品切换',
    owner: '主播 小桃 / 场控 Kiki',
    status: '待开播',
    tone: 'next'
  },
  {
    time: '21:40',
    title: '会员返场福利推送',
    phase: '会员承接',
    owner: '主播 陆雨 / 客服 Nora',
    status: '已完成',
    tone: 'done'
  }
]

export const scriptBlocks: ScriptBlock[] = [
  {
    stage: '开场破冰',
    duration: '08 min',
    focus: '拉高在线人数与首轮互动率',
    action: '发首轮抽奖口令，引导点赞与关注。',
    tone: 'rose'
  },
  {
    stage: '爆品主推',
    duration: '22 min',
    focus: '围绕双抗精华做核心卖点拆解',
    action: '主推成分、价格锚点、用户反馈和限时券。',
    tone: 'amber'
  },
  {
    stage: '用户答疑',
    duration: '10 min',
    focus: '处理成分、安全性与适用肤质问题',
    action: '精选高频问题直播回答并同步客服话术。',
    tone: 'aqua'
  },
  {
    stage: '加购催付',
    duration: '12 min',
    focus: '加购用户召回与支付引导',
    action: '叠加满减券、赠品和限时倒计时。',
    tone: 'violet'
  }
]

export const conversionRanking: ConversionRow[] = [
  { label: '双抗修护精华套组', value: '12.4%', note: '券后转化最高' },
  { label: '晚安修护面膜礼盒', value: '8.8%', note: '会员用户占比高' },
  { label: '新品试色礼盒', value: '7.2%', note: '收藏率增长明显' }
]

export const productItems: ProductItem[] = [
  {
    name: '双抗修护精华套组',
    badge: '主推爆品',
    price: '￥399',
    sold: '已售 1,286',
    inventory: '库存 218',
    progress: 84
  },
  {
    name: '晚安修护面膜礼盒',
    badge: '会员返场',
    price: '￥259',
    sold: '已售 862',
    inventory: '库存 156',
    progress: 71
  },
  {
    name: '新品试色礼盒',
    badge: '新品首发',
    price: '￥169',
    sold: '已售 438',
    inventory: '库存 320',
    progress: 58
  }
]

export const teamTasks: TeamTask[] = [
  {
    name: '场控脚本校准',
    owner: 'Kiki · 20:10 前',
    deadline: '剩余 18 分钟',
    state: '待处理',
    tone: 'next'
  },
  {
    name: '客服高频问答同步',
    owner: 'Nora · 19:50 前',
    deadline: '已完成同步',
    state: '已完成',
    tone: 'done'
  },
  {
    name: '优惠券库存确认',
    owner: 'Mia · 实时跟进',
    deadline: '正在监控发放',
    state: '执行中',
    tone: 'live'
  }
]

export const alerts: AlertItem[] = [
  {
    title: '主会场优惠券剩余不足',
    detail: '20 元券库存仅剩 12%，建议 15 分钟内补量。',
    level: '高优先',
    tone: 'high'
  },
  {
    title: '新品专场主播妆发未确认',
    detail: '开播前需完成镜头色温测试与妆面校准。',
    level: '中优先',
    tone: 'medium'
  },
  {
    title: '会员返场客服排班已补齐',
    detail: '返场时段客服响应时长预计可控制在 30 秒内。',
    level: '低优先',
    tone: 'low'
  }
]
