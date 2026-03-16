<template>
  <div class="mock-live-shell" :class="currentScene.tone">
    <div class="mock-grid"></div>
    <div class="mock-glow glow-a"></div>
    <div class="mock-glow glow-b"></div>
    <div class="mock-scanline"></div>

    <div class="mock-topbar">
      <span class="sim-badge">SIM LIVE</span>
      <span class="sim-pill">{{ room.status }}</span>
      <span class="sim-pill subtle">{{ room.audience }} 在线</span>
    </div>

    <div class="mock-center">
      <span class="scene-kicker">{{ currentScene.kicker }}</span>
      <h4>{{ currentScene.title }}</h4>
      <p>{{ currentScene.detail }}</p>

      <div class="mock-anchor">
        <div class="anchor-avatar">{{ room.host.slice(0, 1) }}</div>
        <div class="anchor-copy">
          <strong>{{ room.host }}</strong>
          <small>{{ room.category }} · {{ room.slot }}</small>
        </div>
      </div>
    </div>

    <div class="comment-stack">
      <div v-for="item in visibleComments" :key="item.id" class="comment-pill">
        {{ item.text }}
      </div>
    </div>

    <div class="mock-bottom">
      <div class="product-card">
        <span class="product-kicker">本地模拟商品卡</span>
        <strong>{{ room.tags[0] ?? '直播讲解' }}</strong>
        <p>{{ tickerText }}</p>
      </div>

      <div class="progress-card">
        <div class="progress-head">
          <span>模拟场次进度</span>
          <strong>{{ progressLabel }}</strong>
        </div>
        <div class="progress-track">
          <span class="progress-fill" :style="{ width: progressWidth }"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { StreamRoom } from '../types'

type MockTone = 'rose' | 'aqua' | 'amber' | 'violet'

interface MockScene {
  kicker: string
  title: string
  detail: string
  tone: MockTone
}

const props = defineProps<{
  room: StreamRoom
}>()

const sceneIndex = ref(0)
const commentIndex = ref(0)
const tickerIndex = ref(0)

let timer: number | null = null

const scenes = computed<MockScene[]>(() => [
  {
    kicker: '主播开场',
    title: `${props.room.host} 正在为 ${props.room.name} 预热`,
    detail: props.room.summary,
    tone: props.room.statusTone === 'done' ? 'violet' : 'rose'
  },
  {
    kicker: '主推讲解',
    title: `${props.room.category} 卖点正在模拟口播`,
    detail: `当前会依次演示 ${props.room.tags.join('、')} 的直播节奏和镜头切换。`,
    tone: 'aqua'
  },
  {
    kicker: '福利放量',
    title: `模拟 ${props.room.audience} 在线场景的转化峰值`,
    detail: '这里会循环展示商品卡、评论滚动和直播氛围，不依赖真实视频源。',
    tone: 'amber'
  }
])

const commentPool = computed(() => [
  `${props.room.host} 讲得很清楚`,
  `${props.room.tags[0] ?? '主推福利'} 什么时候上链接`,
  `这个 ${props.room.category} 看起来挺适合直播转化`,
  `已加入关注，等下一轮福利`,
  `弹幕氛围和商品卡都会跟着模拟刷新`
])

const currentScene = computed<MockScene>(() => {
  return (
    scenes.value[sceneIndex.value % scenes.value.length] ??
    scenes.value[0] ?? {
      kicker: '模拟直播',
      title: props.room.name,
      detail: props.room.summary,
      tone: 'rose'
    }
  )
})

const visibleComments = computed(() =>
  Array.from({ length: 3 }, (_, offset) => {
    const text =
      commentPool.value[
        (commentIndex.value + offset) % commentPool.value.length
      ] ?? commentPool.value[0]

    return {
      id: `${commentIndex.value}-${offset}`,
      text
    }
  })
)

const tickerText = computed(
  () =>
    [
      `模拟流正在轮播 ${props.room.tags[0] ?? '主推环节'} 的讲解文案`,
      `模拟评论、商品卡和进度条会每 3 秒刷新一次`,
      `如果接入真实 m3u8 / flv / mp4，画面会自动切回真实播放`
    ][tickerIndex.value % 3]
)

const progressWidth = computed(() => `${((sceneIndex.value % 3) + 1) * 28}%`)
const progressLabel = computed(() => `${((sceneIndex.value % 3) + 1) * 28}%`)

const startLoop = () => {
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(() => {
    sceneIndex.value = (sceneIndex.value + 1) % scenes.value.length
    commentIndex.value = (commentIndex.value + 1) % commentPool.value.length
    tickerIndex.value = (tickerIndex.value + 1) % 3
  }, 3000)
}

watch(
  () => props.room.id,
  () => {
    sceneIndex.value = 0
    commentIndex.value = 0
    tickerIndex.value = 0
    startLoop()
  }
)

onMounted(() => {
  startLoop()
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped lang="scss">
.mock-live-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(
    180deg,
    rgba(14, 18, 28, 0.96),
    rgba(5, 8, 14, 1)
  );
}

.mock-grid,
.mock-glow,
.mock-scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.mock-grid {
  background:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.15;
}

.mock-glow {
  filter: blur(20px);
}

.glow-a {
  inset: 8% auto auto 12%;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255, 92, 126, 0.42);
}

.glow-b {
  inset: auto 10% 16% auto;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(70, 224, 218, 0.36);
}

.mock-scanline {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05),
    transparent 12%,
    transparent 88%,
    rgba(255, 255, 255, 0.05)
  );
  animation: scan 4s linear infinite;
  opacity: 0.18;
}

.mock-topbar,
.mock-center,
.mock-bottom,
.comment-stack {
  position: relative;
  z-index: 1;
}

.mock-topbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding: 18px 18px 0;
}

.sim-badge,
.sim-pill,
.scene-kicker,
.product-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sim-badge {
  color: #fff;
  background: linear-gradient(135deg, #ff5c7e, #ff8f61);
}

.sim-pill,
.scene-kicker,
.product-kicker {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.sim-pill.subtle {
  background: rgba(255, 255, 255, 0.08);
}

.mock-center {
  display: grid;
  gap: 14px;
  padding: 20px 18px 0;
}

.mock-center h4 {
  margin: 0;
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.1;
}

.mock-center p,
.product-card p {
  margin: 0;
  color: rgba(242, 244, 255, 0.76);
  line-height: 1.7;
}

.mock-anchor {
  display: flex;
  gap: 12px;
  align-items: center;
  width: fit-content;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(9, 12, 21, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.anchor-avatar {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff, #a8ece6);
  color: #152033;
  font-size: 22px;
  font-weight: 900;
}

.anchor-copy strong,
.anchor-copy small {
  display: block;
}

.anchor-copy small {
  margin-top: 6px;
  color: rgba(242, 244, 255, 0.66);
}

.comment-stack {
  display: grid;
  gap: 10px;
  padding: 20px 18px 0;
}

.comment-pill {
  width: fit-content;
  max-width: 92%;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  color: #fff;
  background: rgba(6, 10, 18, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  animation: floatUp 3s ease both;
}

.mock-bottom {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: grid;
  gap: 12px;
}

.product-card,
.progress-card {
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(7, 10, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.product-card strong,
.progress-head strong,
.progress-head span {
  display: block;
}

.product-card strong {
  margin-top: 8px;
  font-size: 18px;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.progress-track {
  position: relative;
  margin-top: 12px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #66e3db, #ff5c7e);
  box-shadow: 0 0 20px rgba(255, 92, 126, 0.35);
  transition: width 0.6s ease;
}

.mock-live-shell.rose {
  background: linear-gradient(
    180deg,
    rgba(24, 16, 27, 0.98),
    rgba(7, 8, 14, 1)
  );
}

.mock-live-shell.aqua {
  background: linear-gradient(
    180deg,
    rgba(11, 26, 30, 0.98),
    rgba(5, 8, 14, 1)
  );
}

.mock-live-shell.amber {
  background: linear-gradient(
    180deg,
    rgba(30, 23, 11, 0.98),
    rgba(8, 8, 12, 1)
  );
}

.mock-live-shell.violet {
  background: linear-gradient(
    180deg,
    rgba(21, 16, 33, 0.98),
    rgba(7, 8, 14, 1)
  );
}

@keyframes scan {
  0% {
    transform: translateY(-24%);
  }
  100% {
    transform: translateY(24%);
  }
}

@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translateY(18px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
