<template>
  <div class="live-center-page">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <template v-if="!isRoomsPage">
      <LiveCenterHeroSection
        :hero-tags="heroTags"
        :hero-metrics="heroMetrics"
      />
      <LiveCenterKpiGrid :kpi-cards="kpiCards" />
      <LiveCenterSubnav />
    </template>

    <div class="live-center-content" :class="{ compact: isRoomsPage }">
      <RouterView />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import LiveCenterHeroSection from './components/LiveCenterHeroSection.vue'
import LiveCenterKpiGrid from './components/LiveCenterKpiGrid.vue'
import LiveCenterSubnav from './components/LiveCenterSubnav.vue'
import { liveCenterKey } from './liveCenterContext'
import { useLiveCenter } from './useLiveCenter'

const route = useRoute()
const store = useLiveCenter()
const isRoomsPage = computed(() => route.name === 'live-center-rooms')

provide(liveCenterKey, store)

const { heroMetrics, heroTags, kpiCards } = store
</script>

<style lang="scss" src="./liveCenterStyles.scss"></style>

<style scoped lang="scss">
.live-center-content {
  position: relative;
  z-index: 1;
  margin-top: 16px;
}

.live-center-content.compact {
  margin-top: 0;
}
</style>
