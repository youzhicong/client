<template>
  <div class="watch-grid">
    <div class="player-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">实时观看</span>
          <h3>直播主画面</h3>
        </div>
        <span class="pill">主播：{{ selectedRoom.host }}</span>
      </div>

      <div class="watch-player-layout">
        <LiveCenterPlayerCard :room="selectedRoom" />

        <div class="watch-side-grid">
          <div class="watch-summary-card">
            <span class="section-kicker">直播简介</span>
            <h4>{{ selectedRoom.category }} · {{ selectedRoom.slot }}</h4>
            <p>{{ selectedRoom.summary }}</p>
            <div class="room-tags">
              <span
                v-for="tag in selectedRoom.tags"
                :key="tag"
                class="mini-tag"
                >{{ tag }}</span
              >
            </div>
          </div>

          <div class="watch-data-grid">
            <div
              v-for="item in liveDataCards"
              :key="item.label"
              class="watch-data-card"
              :class="item.tone"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <p>{{ item.foot }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="watch-hub card">
      <div class="card-head">
        <div>
          <span class="section-kicker">直播房间</span>
          <h3>切换观看与实时动态</h3>
        </div>
        <span class="pill subtle">共 {{ rooms.length }} 个直播间</span>
      </div>

      <div class="watch-room-list">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="watch-room-item"
          :class="{ active: room.id === selectedRoom.id }"
          @click="emit('select-room', room.id)"
        >
          <div class="watch-room-top">
            <div>
              <h4>{{ room.name }}</h4>
              <p>{{ room.host }} · {{ room.slot }}</p>
            </div>
            <span class="status-chip small" :class="room.statusTone">{{
              room.status
            }}</span>
          </div>

          <div class="watch-room-meta">
            <span>在线 {{ room.audience }}</span>
            <span>GMV {{ room.gmv }}</span>
          </div>
        </button>
      </div>

      <div class="feed-block">
        <div class="feed-head">
          <span class="section-kicker">实时动态</span>
          <span class="pill subtle">礼物 / 下单 / 关注 / 充值</span>
        </div>

        <div class="feed-list">
          <div v-for="item in liveFeed" :key="item.id" class="feed-item">
            <span class="feed-tone" :class="item.tone">{{ item.action }}</span>
            <div class="feed-content">
              <strong>{{ item.user }}</strong>
              <p>{{ item.highlight }}</p>
            </div>
            <span class="feed-time">{{ item.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LiveCenterPlayerCard from './LiveCenterPlayerCard.vue'
import type { LiveDataCard, LiveFeedItem, StreamRoom } from '../types'

defineProps<{
  liveDataCards: LiveDataCard[]
  liveFeed: LiveFeedItem[]
  rooms: StreamRoom[]
  selectedRoom: StreamRoom
}>()

const emit = defineEmits<{
  'select-room': [roomId: string]
}>()
</script>

<style scoped lang="scss">
.watch-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(360px, 0.9fr);
  gap: 14px;
}
.player-card,
.watch-hub {
  padding: 18px;
}
.watch-player-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
  gap: 14px;
}
.watch-side-grid,
.watch-room-list,
.feed-list {
  display: grid;
  gap: 10px;
}
.watch-side-grid {
  gap: 14px;
}
.watch-summary-card,
.watch-data-card,
.watch-room-item,
.feed-item {
  border-radius: 16px;
  border: 1px solid var(--lc-border);
  background: var(--lc-panel-strong);
}
.watch-summary-card,
.watch-data-card {
  padding: 16px;
}
.watch-summary-card h4 {
  margin: 12px 0 0;
  font-size: 18px;
}
.watch-summary-card p {
  margin: 10px 0 0;
  color: var(--lc-muted);
  font-size: 13px;
  line-height: 1.7;
}
.room-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.watch-data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.watch-data-card span {
  display: block;
  font-size: 12px;
  color: var(--lc-muted);
}
.watch-data-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}
.watch-data-card p {
  margin: 10px 0 0;
  color: var(--lc-muted);
  font-size: 12px;
  line-height: 1.6;
}
.watch-room-item {
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}
.watch-room-item:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 157, 146, 0.2);
}
.watch-room-item.active {
  border-color: rgba(15, 157, 146, 0.24);
  background: linear-gradient(
    135deg,
    rgba(233, 249, 247, 0.96),
    rgba(241, 249, 255, 0.96)
  );
}
.watch-room-top,
.watch-room-meta,
.feed-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.watch-room-top {
  align-items: flex-start;
}
.watch-room-top h4 {
  margin: 0;
  font-size: 16px;
}
.watch-room-top p {
  margin: 8px 0 0;
  color: var(--lc-muted);
  font-size: 12px;
}
.watch-room-meta {
  margin-top: 10px;
  flex-wrap: wrap;
  color: var(--lc-muted);
  font-size: 12px;
}
.feed-block {
  margin-top: 16px;
}
.feed-head {
  align-items: center;
  margin-bottom: 12px;
}
.feed-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}
.feed-tone {
  min-width: 54px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}
.feed-tone.gift {
  color: #b45309;
  background: rgba(239, 127, 56, 0.14);
}
.feed-tone.order {
  color: #0e756d;
  background: rgba(15, 157, 146, 0.14);
}
.feed-tone.follow {
  color: #1d4ed8;
  background: rgba(47, 125, 225, 0.12);
}
.feed-tone.notice {
  color: #15803d;
  background: rgba(34, 197, 94, 0.12);
}
.feed-content strong {
  display: block;
  font-size: 13px;
}
.feed-content p {
  margin: 6px 0 0;
  color: var(--lc-muted);
  font-size: 12px;
}
.feed-time {
  color: var(--lc-muted);
  font-size: 11px;
}
@media (max-width: 1480px) {
  .watch-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1200px) {
  .watch-player-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 980px) {
  .watch-data-grid {
    grid-template-columns: 1fr;
  }
  .watch-room-top,
  .feed-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .feed-item {
    grid-template-columns: 1fr;
  }
}
</style>
