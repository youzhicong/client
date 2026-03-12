<template>
  <div class="live-section-stack">
    <LiveCenterOverviewSection
      :stream-rooms="roomList"
      :traffic-highlights="trafficHighlights"
    /><LiveCenterOperationsSection
      :conversion-ranking="conversionRanking"
      :schedule-items="scheduleItems"
      :script-blocks="scriptBlocks"
    />
  </div>
</template>
<script lang="ts" setup>
import LiveCenterOperationsSection from '../components/LiveCenterOperationsSection.vue'
import LiveCenterOverviewSection from '../components/LiveCenterOverviewSection.vue'
import { useLiveCenterContext } from '../liveCenterContext'
const {
  conversionRanking,
  roomList,
  scheduleItems,
  scriptBlocks,
  trafficHighlights
} = useLiveCenterContext()
</script>
