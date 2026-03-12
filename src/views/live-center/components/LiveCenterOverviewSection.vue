<template>
  <section class="overview-grid">
    <article class="traffic-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">实时热度</span>
          <h3>直播大盘趋势</h3>
        </div>
        <span class="pill">主会场：{{ streamRooms[0]?.name ?? '待配置' }}</span>
      </div>

      <div class="traffic-grid">
        <article
          v-for="item in trafficHighlights"
          :key="item.label"
          class="traffic-item"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <p>{{ item.delta }}</p>
        </article>
      </div>
    </article>

    <article class="rooms-card card">
      <div class="card-head">
        <div>
          <span class="section-kicker">直播间分布</span>
          <h3>当前场次</h3>
        </div>
        <span class="pill subtle">共 {{ streamRooms.length }} 个直播间</span>
      </div>

      <div class="room-list">
        <article v-for="room in streamRooms" :key="room.id" class="room-item">
          <div class="room-top">
            <div>
              <span class="status-chip" :class="room.statusTone">{{
                room.status
              }}</span>
              <h4>{{ room.name }}</h4>
            </div>
            <span class="room-slot">{{ room.slot }}</span>
          </div>
          <p class="room-meta">{{ room.host }} · {{ room.category }}</p>
          <div class="room-stats">
            <div class="room-stat">
              <span>在线人数</span><strong>{{ room.audience }}</strong>
            </div>
            <div class="room-stat">
              <span>场次 GMV</span><strong>{{ room.gmv }}</strong>
            </div>
          </div>
        </article>
      </div>
    </article>
  </section>
</template>

<script lang="ts" setup>
import type { StreamRoom, TrafficHighlight } from '../types'
defineProps<{
  streamRooms: StreamRoom[]
  trafficHighlights: TrafficHighlight[]
}>()
</script>

<style scoped lang="scss">
.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(360px, 0.9fr);
  gap: 14px;
}
.traffic-card,
.rooms-card {
  padding: 18px;
}
.traffic-grid,
.room-list {
  display: grid;
  gap: 12px;
}
.traffic-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.traffic-item,
.room-item {
  border-radius: 16px;
  border: 1px solid var(--lc-border);
  background: var(--lc-panel-strong);
}
.traffic-item {
  padding: 16px;
}
.traffic-item span {
  font-size: 12px;
  color: var(--lc-muted);
}
.traffic-item strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}
.traffic-item p {
  margin: 10px 0 0;
  color: var(--lc-secondary);
  font-size: 12px;
  font-weight: 700;
}
.room-item {
  padding: 16px;
}
.room-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.room-top h4 {
  margin: 8px 0 0;
  font-size: 16px;
}
.room-slot,
.room-meta {
  color: var(--lc-muted);
  font-size: 12px;
}
.room-meta {
  margin: 8px 0 0;
}
.room-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.room-stat {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
}
.room-stat span {
  display: block;
  font-size: 11px;
  color: var(--lc-muted);
}
.room-stat strong {
  display: block;
  margin-top: 4px;
  font-size: 16px;
}
@media (max-width: 1480px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 980px) {
  .traffic-grid,
  .room-stats {
    grid-template-columns: 1fr;
  }
  .room-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
