export type BusinessPriority = 'high' | 'medium' | 'low'

export type BusinessModule = {
  id: string
  title: string
  owner: string
  status: string
  summary: string
  priority: BusinessPriority
  progress: number
  entry: string
}

export type BusinessTask = {
  id: string
  title: string
  module: string
  assignee: string
  due: string
  state: string
}

export type BusinessBacklog = {
  title: string
  reason: string
  value: string
  priority: BusinessPriority
}

export const businessModules: BusinessModule[] = [
  {
    id: 'customer-service',
    title: '客户沟通闭环',
    owner: '客服运营',
    status: '待接入真实会话质检',
    summary:
      '串联即时通信、AI 接待、人工转接和跟进记录，避免消息只停留在聊天窗口里。',
    priority: 'high',
    progress: 68,
    entry: '/im'
  },
  {
    id: 'approval-contract',
    title: '审批合同链路',
    owner: '行政法务',
    status: '可继续补归档台账',
    summary: '把审批流程、电子合同签署和公告通知放进同一条业务履约链路。',
    priority: 'medium',
    progress: 74,
    entry: '/approval-workflow'
  },
  {
    id: 'retail-device',
    title: '零售设备运营',
    owner: '设备运营',
    status: '建议补库存预警',
    summary:
      '覆盖贩卖机管理、3D 监控、点位健康和异常处理，形成可回溯的运营视图。',
    priority: 'high',
    progress: 61,
    entry: '/vending-list'
  },
  {
    id: 'live-commerce',
    title: '直播转化运营',
    owner: '直播运营',
    status: '建议补售后回流',
    summary: '把直播数据、直播间、礼物充值和运营协同继续沉淀成转化漏斗。',
    priority: 'medium',
    progress: 82,
    entry: '/live-center/overview'
  }
]

export const businessTasks: BusinessTask[] = [
  {
    id: 'task-1',
    title: '补齐 AI 接待转人工记录',
    module: '客户沟通闭环',
    assignee: '客服运营',
    due: '本周',
    state: '进行中'
  },
  {
    id: 'task-2',
    title: '增加设备库存低水位预警',
    module: '零售设备运营',
    assignee: '设备运营',
    due: '下周',
    state: '待排期'
  },
  {
    id: 'task-3',
    title: '把合同签署结果同步到公告通知',
    module: '审批合同链路',
    assignee: '行政法务',
    due: '本月',
    state: '待确认'
  },
  {
    id: 'task-4',
    title: '直播订单售后原因归因',
    module: '直播转化运营',
    assignee: '直播运营',
    due: '本月',
    state: '规划中'
  }
]

export const businessBacklog: BusinessBacklog[] = [
  {
    title: '客户档案',
    reason:
      '当前有用户列表和 IM，但缺少按客户维度沉淀沟通、订单、合同和服务记录。',
    value: '后续能支撑 CRM、客户分层和客服回访。',
    priority: 'high'
  },
  {
    title: '工单中心',
    reason: 'IM 和设备异常都需要可追踪的处理单，避免问题只停留在聊天记录里。',
    value: '可以形成受理、分派、处理、验收的闭环。',
    priority: 'high'
  },
  {
    title: '订单履约',
    reason: '直播转化、贩卖机销售和合同签署都缺少统一订单履约视图。',
    value: '能补齐支付、发货、售后和退款这些业务状态。',
    priority: 'medium'
  },
  {
    title: '经营报表',
    reason: '首页已有驾驶舱，但还缺少可筛选、可导出的部门级经营报表。',
    value: '适合沉淀日报、周报、月报和异常复盘。',
    priority: 'medium'
  }
]
