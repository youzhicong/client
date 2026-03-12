<template>
  <div class="live-section-stack">
    <LiveCenterOperationsSection
      :conversion-ranking="conversionRanking"
      :schedule-items="scheduleItems"
      :script-blocks="scriptBlocks"
    /><LiveCenterSupportSection
      :alerts="alerts"
      :product-items="productItems"
      :team-tasks="teamTasks"
    />
  </div>
</template>
<script lang="ts" setup>
import LiveCenterOperationsSection from '../components/LiveCenterOperationsSection.vue'
import LiveCenterSupportSection from '../components/LiveCenterSupportSection.vue'
import { useLiveCenterContext } from '../liveCenterContext'
const {
  alerts,
  conversionRanking,
  productItems,
  scheduleItems,
  scriptBlocks,
  teamTasks
} = useLiveCenterContext()
</script>
