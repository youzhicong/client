<template>
  <div class="live-section-stack">
    <LiveCenterWatchSection
      :live-data-cards="liveDataCards"
      :live-feed="liveFeed"
      :rooms="roomList"
      :selected-room="selectedRoom"
      @select-room="selectRoom"
    /><LiveCenterOverviewSection
      :stream-rooms="roomList"
      :traffic-highlights="trafficHighlights"
    />
  </div>
</template>
<script lang="ts" setup>
import LiveCenterOverviewSection from '../components/LiveCenterOverviewSection.vue'
import LiveCenterWatchSection from '../components/LiveCenterWatchSection.vue'
import { useLiveCenterContext } from '../liveCenterContext'
const {
  liveDataCards,
  liveFeed,
  roomList,
  selectedRoom,
  selectRoom,
  trafficHighlights
} = useLiveCenterContext()
</script>
