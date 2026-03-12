<template>
  <div class="live-section-stack">
    <LiveCenterMonetizationSection
      :gift-items="giftItems"
      :recent-transactions="recentTransactions"
      :recharge-packages="rechargePackages"
      :recharging="recharging"
      :selected-gift-id="selectedGiftId"
      :selected-package-id="selectedPackageId"
      :selected-room-name="selectedRoom.name"
      :sending-gift="sendingGift"
      :wallet-summary="walletSummary"
      @recharge="recharge"
      @select-gift="selectGift"
      @select-package="selectPackage"
      @send-gift="sendGift"
    />
  </div>
</template>
<script lang="ts" setup>
import LiveCenterMonetizationSection from '../components/LiveCenterMonetizationSection.vue'
import { useLiveCenterContext } from '../liveCenterContext'
const {
  giftItems,
  recentTransactions,
  recharge,
  rechargePackages,
  recharging,
  selectedGiftId,
  selectedPackageId,
  selectedRoom,
  selectGift,
  selectPackage,
  sendGift,
  sendingGift,
  walletSummary
} = useLiveCenterContext()
</script>
