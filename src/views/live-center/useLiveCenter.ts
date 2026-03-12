import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  alerts,
  conversionRanking,
  giftItems,
  heroMetrics,
  heroTags,
  kpiCards,
  liveDataCards,
  liveFeedSeed,
  productItems,
  rechargePackages,
  roomList,
  scheduleItems,
  scriptBlocks,
  teamTasks,
  trafficHighlights,
  transactionSeed,
  walletSummary
} from './dashboardData'
import type { LiveFeedItem, StreamRoom, WalletTransaction } from './types'

const nowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

export const useLiveCenter = () => {
  const fallbackRoom = roomList[0] as StreamRoom
  const selectedRoomId = ref(fallbackRoom?.id ?? '')
  const selectedGiftId = ref(giftItems[0]?.id ?? '')
  const selectedPackageId = ref(
    rechargePackages[1]?.id ?? rechargePackages[0]?.id ?? ''
  )
  const sendingGift = ref(false)
  const recharging = ref(false)
  const liveFeed = ref<LiveFeedItem[]>([...liveFeedSeed])
  const recentTransactions = ref<WalletTransaction[]>([...transactionSeed])

  const selectedRoom = computed<StreamRoom>(
    () =>
      roomList.find((item) => item.id === selectedRoomId.value) ?? fallbackRoom
  )

  const selectRoom = (roomId: string) => {
    selectedRoomId.value = roomId
    const room = roomList.find((item) => item.id === roomId)
    if (!room) return

    const roomFeed: LiveFeedItem = {
      id: `feed-room-${Date.now()}`,
      user: '系统',
      action: '切换房间',
      highlight: `当前进入 ${room.name}`,
      time: nowTime(),
      tone: 'notice'
    }

    liveFeed.value = [roomFeed, ...liveFeed.value].slice(0, 8)
  }

  const selectGift = (giftId: string) => {
    selectedGiftId.value = giftId
  }

  const selectPackage = (packageId: string) => {
    selectedPackageId.value = packageId
  }

  const sendGift = () => {
    const gift = giftItems.find((item) => item.id === selectedGiftId.value)
    if (!gift) return

    sendingGift.value = true
    window.setTimeout(() => {
      const room = selectedRoom.value
      const giftTransaction: WalletTransaction = {
        id: `txn-gift-${Date.now()}`,
        title: `送出${gift.name}`,
        note: room.name,
        amount: -gift.price,
        time: `今天 ${nowTime()}`,
        type: 'gift'
      }
      const giftFeed: LiveFeedItem = {
        id: `feed-gift-${Date.now()}`,
        user: '你',
        action: '送出',
        highlight: `${gift.name} x1`,
        time: nowTime(),
        tone: 'gift'
      }

      sendingGift.value = false
      recentTransactions.value = [
        giftTransaction,
        ...recentTransactions.value
      ].slice(0, 6)
      liveFeed.value = [giftFeed, ...liveFeed.value].slice(0, 8)
      ElMessage.success(`已向 ${room.name} 送出 ${gift.name}`)
    }, 700)
  }

  const recharge = () => {
    const pkg = rechargePackages.find(
      (item) => item.id === selectedPackageId.value
    )
    if (!pkg) return

    recharging.value = true
    window.setTimeout(() => {
      const rechargeTransaction: WalletTransaction = {
        id: `txn-recharge-${Date.now()}`,
        title: '充值金豆',
        note: `${pkg.coins} 金豆 + 赠送 ${pkg.bonus}`,
        amount: pkg.price * 10,
        time: `今天 ${nowTime()}`,
        type: 'recharge'
      }
      const rechargeFeed: LiveFeedItem = {
        id: `feed-recharge-${Date.now()}`,
        user: '你',
        action: '完成充值',
        highlight: `${pkg.coins} 金豆档位`,
        time: nowTime(),
        tone: 'notice'
      }

      recharging.value = false
      recentTransactions.value = [
        rechargeTransaction,
        ...recentTransactions.value
      ].slice(0, 6)
      liveFeed.value = [rechargeFeed, ...liveFeed.value].slice(0, 8)
      ElMessage.success('充值记录已更新')
    }, 700)
  }

  return {
    alerts,
    conversionRanking,
    giftItems,
    heroMetrics,
    heroTags,
    kpiCards,
    liveDataCards,
    liveFeed,
    productItems,
    recharge,
    rechargePackages,
    recentTransactions,
    recharging,
    roomList,
    scheduleItems,
    scriptBlocks,
    selectedGiftId,
    selectedPackageId,
    selectedRoom,
    selectGift,
    selectPackage,
    selectRoom,
    sendGift,
    sendingGift,
    teamTasks,
    trafficHighlights,
    walletSummary
  }
}
