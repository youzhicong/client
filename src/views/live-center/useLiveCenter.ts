import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getLiveCenterDashboard,
  rechargeLiveCenterWallet,
  sendLiveCenterGift
} from '@/services/liveCenter'
import type {
  AlertItem,
  ConversionRow,
  GiftItem,
  HeroMetric,
  KpiCard,
  LiveCenterDashboardSnapshot,
  LiveCenterMonetizationResult,
  LiveDataCard,
  LiveFeedItem,
  LiveRoomDetail,
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

const emptyRoom: StreamRoom = {
  id: '',
  name: '',
  host: '',
  slot: '',
  category: '',
  summary: '',
  audience: '0',
  gmv: '0',
  status: '',
  statusTone: 'next',
  tags: [],
  coverTitle: '',
  previewStreamUrl: ''
}

const emptyWalletSummary: WalletSummary = {
  balance: 0,
  giftSpendToday: 0,
  rechargeToday: 0
}

const applyMonetizationResult = (
  target: {
    liveFeed: { value: LiveFeedItem[] }
    recentTransactions: { value: WalletTransaction[] }
    walletSummary: { value: WalletSummary }
  },
  result: LiveCenterMonetizationResult
) => {
  target.liveFeed.value = result.liveFeed
  target.recentTransactions.value = result.recentTransactions
  target.walletSummary.value = result.walletSummary
}

export const useLiveCenter = () => {
  const loading = ref(false)

  const heroTags = ref<string[]>([])
  const heroMetrics = ref<HeroMetric[]>([])
  const kpiCards = ref<KpiCard[]>([])
  const roomList = ref<StreamRoom[]>([])
  const liveDataCards = ref<LiveDataCard[]>([])
  const liveFeed = ref<LiveFeedItem[]>([])
  const trafficHighlights = ref<TrafficHighlight[]>([])
  const giftItems = ref<GiftItem[]>([])
  const rechargePackages = ref<RechargePackage[]>([])
  const walletSummary = ref<WalletSummary>(emptyWalletSummary)
  const recentTransactions = ref<WalletTransaction[]>([])
  const scheduleItems = ref<ScheduleItem[]>([])
  const scriptBlocks = ref<ScriptBlock[]>([])
  const conversionRanking = ref<ConversionRow[]>([])
  const productItems = ref<ProductItem[]>([])
  const teamTasks = ref<TeamTask[]>([])
  const alerts = ref<AlertItem[]>([])
  const roomDetails = ref<Record<string, LiveRoomDetail>>({})

  const selectedRoomId = ref('')
  const selectedGiftId = ref('')
  const selectedPackageId = ref('')
  const sendingGift = ref(false)
  const recharging = ref(false)

  const selectedRoom = computed<StreamRoom>(() => {
    return (
      roomList.value.find((item) => item.id === selectedRoomId.value) ??
      roomList.value[0] ??
      emptyRoom
    )
  })

  const selectedRoomDetail = computed<LiveRoomDetail | null>(() => {
    const roomId = selectedRoom.value.id
    return roomId ? roomDetails.value[roomId] || null : null
  })

  const selectRoom = (roomId: string) => {
    selectedRoomId.value = roomId
  }

  const selectGift = (giftId: string) => {
    selectedGiftId.value = giftId
  }

  const selectPackage = (packageId: string) => {
    selectedPackageId.value = packageId
  }

  const loadDashboard = async () => {
    if (loading.value) return
    loading.value = true
    try {
      const response = await getLiveCenterDashboard()
      if (response.code !== 200) {
        ElMessage.error(response.message || '直播中心数据加载失败')
        return
      }

      const data: LiveCenterDashboardSnapshot = response.data
      heroTags.value = data.heroTags
      heroMetrics.value = data.heroMetrics
      kpiCards.value = data.kpiCards
      roomList.value = data.roomList
      liveDataCards.value = data.liveDataCards
      liveFeed.value = data.liveFeed
      trafficHighlights.value = data.trafficHighlights
      giftItems.value = data.giftItems
      rechargePackages.value = data.rechargePackages
      walletSummary.value = data.walletSummary
      recentTransactions.value = data.recentTransactions
      scheduleItems.value = data.scheduleItems
      scriptBlocks.value = data.scriptBlocks
      conversionRanking.value = data.conversionRanking
      productItems.value = data.productItems
      teamTasks.value = data.teamTasks
      alerts.value = data.alerts
      roomDetails.value = data.roomDetails

      if (!selectedRoomId.value && data.roomList[0]) {
        selectedRoomId.value = data.roomList[0].id
      }
      if (!selectedGiftId.value && data.giftItems[0]) {
        selectedGiftId.value = data.giftItems[0].id
      }
      if (!selectedPackageId.value) {
        selectedPackageId.value =
          data.rechargePackages[1]?.id ?? data.rechargePackages[0]?.id ?? ''
      }
    } catch {
      ElMessage.error('直播中心数据加载失败')
    } finally {
      loading.value = false
    }
  }

  const sendGift = async () => {
    if (!selectedRoom.value.id || !selectedGiftId.value) return
    sendingGift.value = true
    try {
      const response = await sendLiveCenterGift({
        roomId: selectedRoom.value.id,
        giftId: selectedGiftId.value
      })
      if (response.code !== 200) {
        ElMessage.error(response.message || '送礼失败')
        return
      }

      applyMonetizationResult(
        { liveFeed, recentTransactions, walletSummary },
        response.data
      )
      ElMessage.success(response.message || '送礼成功')
    } catch {
      ElMessage.error('送礼失败')
    } finally {
      sendingGift.value = false
    }
  }

  const recharge = async () => {
    if (!selectedPackageId.value) return
    recharging.value = true
    try {
      const response = await rechargeLiveCenterWallet({
        roomId: selectedRoom.value.id,
        packageId: selectedPackageId.value
      })
      if (response.code !== 200) {
        ElMessage.error(response.message || '充值失败')
        return
      }

      applyMonetizationResult(
        { liveFeed, recentTransactions, walletSummary },
        response.data
      )
      ElMessage.success(response.message || '充值成功')
    } catch {
      ElMessage.error('充值失败')
    } finally {
      recharging.value = false
    }
  }

  void loadDashboard()

  return {
    alerts,
    conversionRanking,
    giftItems,
    heroMetrics,
    heroTags,
    kpiCards,
    liveDataCards,
    liveFeed,
    loading,
    productItems,
    recharge,
    rechargePackages,
    recentTransactions,
    recharging,
    roomDetails,
    roomList,
    scheduleItems,
    scriptBlocks,
    selectedGiftId,
    selectedPackageId,
    selectedRoom,
    selectedRoomDetail,
    selectGift,
    selectPackage,
    selectRoom,
    sendGift,
    sendingGift,
    teamTasks,
    trafficHighlights,
    walletSummary,
    loadDashboard
  }
}
