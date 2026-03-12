<template>
  <section class="room-viewer">
    <div class="toolbar card">
      <div class="toolbar-rooms">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="room-chip"
          :class="{ active: room.id === selectedRoom.id }"
          @click="emit('select-room', room.id)"
        >
          {{ room.name }}
        </button>
      </div>
      <div class="toolbar-input">
        <el-input v-model="externalLink" placeholder="粘贴直播链接或流地址" />
        <el-button type="primary" @click="applyLink">切换</el-button>
      </div>
    </div>
    <div class="viewer-grid">
      <article class="stage-card card">
        <div class="stage-head">
          <div>
            <span class="section-kicker">直播观看</span>
            <h3>{{ selectedRoom.name }}</h3>
          </div>
          <span class="status-chip" :class="selectedRoom.statusTone">{{
            selectedRoom.status
          }}</span>
        </div>
        <LiveCenterPlayerCard :room="selectedRoom" />
        <div v-if="appliedLink" class="link-tip">
          当前外部链接：{{ appliedLink }}
        </div>
      </article>
      <article class="chat-card card">
        <div class="card-head">
          <div>
            <span class="section-kicker">直播动态</span>
            <h3>切换直播流</h3>
          </div>
          <span class="pill subtle">{{ rooms.length }} 路流</span>
        </div>
        <div class="switch-list">
          <button
            v-for="room in rooms"
            :key="room.id"
            type="button"
            class="switch-item"
            :class="{ active: room.id === selectedRoom.id }"
            @click="emit('select-room', room.id)"
          >
            <div>
              <strong>{{ room.name }}</strong>
              <p>{{ room.host }} · {{ room.slot }}</p>
            </div>
            <span class="status-chip small" :class="room.statusTone">{{
              room.status
            }}</span>
          </button>
        </div>
        <div class="feed-list">
          <article v-for="item in liveFeed" :key="item.id" class="feed-item">
            <span class="feed-user">{{ item.user }}</span>
            <p>{{ item.action }} {{ item.highlight }}</p>
          </article>
        </div>
      </article>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import LiveCenterPlayerCard from './LiveCenterPlayerCard.vue'
import type { GiftItem, LiveFeedItem, StreamRoom } from '../types'

defineProps<{
  giftItems: GiftItem[]
  liveFeed: LiveFeedItem[]
  rooms: StreamRoom[]
  selectedRoom: StreamRoom
}>()
const emit = defineEmits<{ 'select-room': [roomId: string] }>()
const externalLink = ref('')
const appliedLink = ref('')
const applyLink = () => {
  if (!externalLink.value.trim()) {
    ElMessage.warning('请先输入直播链接')
    return
  }
  appliedLink.value = externalLink.value.trim()
  ElMessage.success('已切换到外部直播链接')
}
</script>

<style scoped lang="scss">
.room-viewer {
  display: grid;
  gap: 14px;
}
.toolbar {
  padding: 12px 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 12px;
}
.toolbar-rooms {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.room-chip {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--lc-border);
  background: rgba(255, 255, 255, 0.82);
  color: var(--lc-text);
  cursor: pointer;
  transition: all 0.2s ease;
}
.room-chip:hover {
  border-color: rgba(15, 157, 146, 0.18);
  background: #fff;
}
.room-chip.active {
  color: var(--lc-accent);
  background: #e9f9f7;
  border-color: #bae0dc;
}
.toolbar-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}
.viewer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 340px;
  gap: 14px;
}
.stage-card,
.chat-card {
  padding: 18px;
}
.stage-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}
.stage-head h3 {
  margin: 8px 0 0;
  font-size: 24px;
}
.link-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--lc-muted);
}
.switch-list,
.feed-list {
  display: grid;
  gap: 10px;
}
.switch-item,
.feed-item {
  border-radius: 16px;
  border: 1px solid var(--lc-border);
  background: var(--lc-panel-strong);
}
.switch-item {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
}
.switch-item.active {
  border-color: rgba(15, 157, 146, 0.24);
  background: linear-gradient(
    135deg,
    rgba(233, 249, 247, 0.96),
    rgba(241, 249, 255, 0.96)
  );
}
.switch-item strong {
  font-size: 16px;
}
.switch-item p {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--lc-muted);
}
.feed-item {
  padding: 12px 14px;
}
.feed-user {
  font-size: 12px;
  font-weight: 700;
  color: #1d4ed8;
}
.feed-item p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--lc-text);
}
@media (max-width: 1280px) {
  .toolbar,
  .viewer-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 980px) {
  .stage-head,
  .switch-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
