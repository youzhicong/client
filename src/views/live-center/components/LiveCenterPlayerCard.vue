<template>
  <div class="player-shell">
    <div class="player-stage">
      <div class="player-glow"></div>
      <div class="player-copy">
        <span class="stage-kicker">{{ room.coverTitle }}</span>
        <h3>{{ room.name }}</h3>
        <p>{{ room.summary }}</p>
      </div>

      <div class="player-overlay">
        <div class="player-overlay-top">
          <span class="status-chip" :class="room.statusTone">{{
            room.status
          }}</span>
          <span class="viewer-chip">在线 {{ room.audience }}</span>
        </div>
        <div class="player-overlay-bottom">
          <span>主播：{{ room.host }}</span>
          <el-button type="primary" plain>进入房间</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { StreamRoom } from '../types'

defineProps<{
  room: StreamRoom
}>()
</script>

<style scoped lang="scss">
.player-shell {
  min-height: 400px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(16, 30, 44, 0.12);
  background: #0f1722;
  box-shadow: 0 18px 40px rgba(14, 30, 44, 0.24);
}

.player-stage {
  position: relative;
  min-height: 400px;
  padding: 28px;
  display: flex;
  align-items: center;
  background:
    radial-gradient(
      circle at 22% 18%,
      rgba(15, 157, 146, 0.28) 0%,
      transparent 24%
    ),
    radial-gradient(
      circle at 82% 18%,
      rgba(47, 125, 225, 0.24) 0%,
      transparent 22%
    ),
    linear-gradient(135deg, #0f1722 0%, #12273a 52%, #173b54 100%);
}

.player-glow {
  position: absolute;
  inset: auto auto -26px -16px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.player-copy {
  position: relative;
  z-index: 1;
  max-width: 520px;
  color: #fff;
}

.stage-kicker {
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.player-copy h3 {
  margin: 18px 0 12px;
  font-size: 42px;
  line-height: 1.08;
}

.player-copy p {
  margin: 0;
  font-size: 16px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.88);
}

.player-overlay {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 16px;
  z-index: 1;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(8, 18, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e9f4ff;
  backdrop-filter: blur(8px);
}

.player-overlay-top,
.player-overlay-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.player-overlay-bottom {
  margin-top: 10px;
  font-size: 13px;
}

.viewer-chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 980px) {
  .player-stage {
    min-height: 340px;
    padding: 24px;
  }

  .player-copy h3 {
    font-size: 34px;
  }

  .player-copy p {
    font-size: 15px;
  }

  .player-overlay-top,
  .player-overlay-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
