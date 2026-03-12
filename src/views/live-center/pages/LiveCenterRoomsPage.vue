<template>
  <div class="live-section-stack">
    <LiveCenterRoomViewer
      :gift-items="giftItems"
      :live-feed="liveFeed"
      :rooms="roomList"
      :selected-room="selectedRoom"
      @select-room="selectRoom"
    />
  </div>
</template>
<script lang="ts" setup>
import LiveCenterRoomViewer from '../components/LiveCenterRoomViewer.vue'
import { useLiveCenterContext } from '../liveCenterContext'
const { giftItems, liveFeed, roomList, selectedRoom, selectRoom } =
  useLiveCenterContext()
</script>
