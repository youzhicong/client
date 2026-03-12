<template>
  <div class="douyin-room-shell">
    <div class="room-command-bar">
      <div class="room-switcher">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="room-chip"
          :class="{ active: room.id === selectedRoom.id }"
          @click="emit('select-room', room.id)"
        >
          <span class="room-chip-dot" :class="room.statusTone"></span>
          <div class="room-chip-copy">
            <strong>{{ room.name }}</strong>
            <small>{{ room.host }} · {{ room.slot }}</small>
          </div>
          <span class="room-chip-count">{{ room.audience }}</span>
        </button>
      </div>

      <div class="command-tools">
        <div class="source-input">
          <el-input v-model="externalLink" placeholder="粘贴直播链接或流地址" />
        </div>
        <button type="button" class="command-button ghost" @click="shareRoom">
          分享
        </button>
        <button type="button" class="command-button primary" @click="applyLink">
          切换流
        </button>
      </div>

      <div class="command-note">{{ pinNote }}</div>
    </div>

    <div class="douyin-room-layout">
      <div class="stage-panel">
        <div class="stage-screen">
          <div class="scene-topbar">
            <button type="button" class="scene-icon back" @click="enterRoom">
              返回
            </button>

            <div class="anchor-summary">
              <div class="anchor-avatar">{{ hostInitial }}</div>
              <div class="anchor-copy">
                <div class="anchor-line">
                  <strong>{{ selectedRoom.host }}专区</strong>
                  <span>{{ followerLabel }} 粉丝</span>
                </div>
                <div class="anchor-actions">
                  <button type="button" @click="previewAction('粉丝团')">
                    粉丝团
                  </button>
                  <button type="button" @click="previewAction('会员')">
                    会员
                  </button>
                  <button type="button" @click="shareRoom">···</button>
                </div>
              </div>
            </div>

            <span class="scene-rank-badge">{{ sceneRankBadge }}</span>
          </div>

          <div class="scene-countdown">
            <div class="scene-countdown-track"></div>
            <div class="scene-countdown-badge">
              <span>倒计时</span>
              <strong>{{ countdownLabel }}</strong>
            </div>
          </div>

          <div class="scene-arena">
            <div class="arena-showcase">
              <div class="showcase-glow"></div>
              <div class="showcase-wave wave-a"></div>
              <div class="showcase-wave wave-b"></div>

              <div
                v-for="hero in stageHeroes"
                :key="hero.id"
                class="hero-card"
                :class="hero.tone"
              >
                <span class="hero-rank">{{ hero.rank }}</span>
                <div class="hero-portrait">{{ hero.initial }}</div>
                <strong>{{ hero.title }}</strong>
                <small>{{ hero.subtitle }}</small>
              </div>
            </div>

            <div class="arena-selection">
              <div class="selection-tabs">
                <span>忍者</span>
                <span>通灵兽</span>
                <span>秘卷</span>
              </div>

              <div class="selection-grid">
                <div
                  v-for="item in rosterItems"
                  :key="item.id"
                  class="selection-card"
                  :class="{ active: item.active }"
                >
                  <span class="selection-grade">{{ item.grade }}</span>
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.detail }}</small>
                </div>
              </div>

              <button
                type="button"
                class="selection-lock"
                @click="previewAction('锁定阵容')"
              >
                锁定阵容
              </button>
            </div>
          </div>

          <div class="scene-metrics">
            <div
              v-for="metric in stageMetrics"
              :key="metric.label"
              class="metric-card"
            >
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>

          <div class="floating-camera">
            <span class="camera-tag">主播小窗</span>
            <strong>{{ selectedRoom.host }}</strong>
            <small>{{ selectedRoom.category }}</small>
          </div>

          <div class="scene-caption">
            <span class="caption-live">LIVE</span>
            <p>{{ selectedRoom.name }} · {{ selectedRoom.summary }}</p>
          </div>

          <div class="gift-ribbon">
            <button
              v-for="item in giftRibbon"
              :key="item.gift.id"
              type="button"
              class="gift-pill"
              :class="item.gift.tone"
              @click="previewGift(item.gift)"
            >
              <span class="gift-pill-icon">{{ item.short }}</span>
              <strong>{{ item.gift.name }}</strong>
            </button>
          </div>
        </div>

        <div class="stage-footer">
          <div class="footer-copy">
            <strong>{{ selectedRoom.name }}</strong>
            <span>{{ selectedRoom.tags.join(' · ') }}</span>
          </div>

          <div class="footer-actions">
            <button
              type="button"
              class="footer-button ghost"
              @click="previewAction('点赞')"
            >
              点赞
            </button>
            <button
              type="button"
              class="footer-button ghost"
              @click="previewAction('弹幕')"
            >
              弹幕
            </button>
            <button
              type="button"
              class="footer-button primary"
              @click="enterRoom"
            >
              进入直播间
            </button>
          </div>
        </div>
      </div>

      <div class="interaction-panel">
        <div class="audience-board">
          <div class="board-head">
            <div>
              <span class="board-kicker">在线观众</span>
              <h3>{{ audienceHeadline }}</h3>
            </div>
            <button
              type="button"
              class="board-icon"
              @click="previewAction('侧栏扩展')"
            >
              →
            </button>
          </div>

          <div class="rank-tabs">
            <button
              v-for="tab in viewerTabs"
              :key="tab.id"
              type="button"
              class="rank-tab"
              :class="{ active: viewerTab === tab.id }"
              @click="viewerTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="rank-list">
            <div
              v-for="(viewer, index) in filteredViewerRanking"
              :key="viewer.name"
              class="rank-row"
            >
              <span class="rank-index">{{ index + 1 }}</span>
              <div class="rank-avatar" :class="viewer.accent">
                {{ viewer.name.slice(0, 1) }}
              </div>
              <div class="rank-copy">
                <strong>{{ viewer.name }}</strong>
                <small>{{ viewer.badge }}</small>
              </div>
              <span class="rank-score">{{ viewer.score }}</span>
            </div>
          </div>
        </div>

        <div class="chat-board">
          <div class="chat-head">
            <span>实时弹幕</span>
            <small>{{ pinNote }}</small>
          </div>

          <div class="chat-list">
            <div v-for="item in visibleFeed" :key="item.id" class="chat-item">
              <span class="chat-badge" :class="item.tone">
                {{ feedToneLabel(item.tone) }}
              </span>
              <div class="chat-bubble">
                <div class="chat-meta">
                  <strong>{{ item.user }}</strong>
                  <span>{{ item.time }}</span>
                </div>
                <p>{{ item.action }} {{ item.highlight }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-composer">
          <div class="composer-field">与大家互动一下...</div>
          <button
            type="button"
            class="composer-button ghost"
            @click="previewAction('表情')"
          >
            表情
          </button>
          <button
            type="button"
            class="composer-button primary"
            @click="previewAction('发送')"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { GiftItem, LiveFeedItem, StreamRoom } from '../types'

type ViewerTab = 'all' | 'paying' | 'vip'

interface ViewerRankItem {
  name: string
  badge: string
  score: string
  bucket: Exclude<ViewerTab, 'all'>
  accent: 'rose' | 'amber' | 'aqua'
}

const props = defineProps<{
  giftItems: GiftItem[]
  liveFeed: LiveFeedItem[]
  rooms: StreamRoom[]
  selectedRoom: StreamRoom
}>()

const emit = defineEmits<{ 'select-room': [roomId: string] }>()

const viewerTabs = [
  { id: 'all', label: '全部' },
  { id: 'paying', label: '1000贡献用户' },
  { id: 'vip', label: '高等级用户' }
] as const

const viewerRankingMap: Record<string, ViewerRankItem[]> = {
  'room-main': [
    {
      name: '牡丹反击',
      badge: '荣耀贡献用户',
      score: '27',
      bucket: 'paying',
      accent: 'rose'
    },
    {
      name: '小稚',
      badge: '高等级粉丝',
      score: '40',
      bucket: 'vip',
      accent: 'amber'
    },
    {
      name: '洪琪',
      badge: '连送 44 次',
      score: '44',
      bucket: 'paying',
      accent: 'aqua'
    }
  ],
  'room-new': [
    {
      name: '樱桃可乐',
      badge: '新品预约用户',
      score: '18',
      bucket: 'paying',
      accent: 'rose'
    },
    {
      name: '奶盐桃桃',
      badge: '高等级粉丝',
      score: '32',
      bucket: 'vip',
      accent: 'amber'
    },
    {
      name: '云朵卷',
      badge: '试色团成员',
      score: '21',
      bucket: 'vip',
      accent: 'aqua'
    }
  ],
  'room-member': [
    {
      name: '晚风星河',
      badge: '会员复购用户',
      score: '16',
      bucket: 'paying',
      accent: 'rose'
    },
    {
      name: '青提汽水',
      badge: '高等级会员',
      score: '29',
      bucket: 'vip',
      accent: 'amber'
    },
    {
      name: '南桥',
      badge: '权益达人',
      score: '12',
      bucket: 'paying',
      accent: 'aqua'
    }
  ]
}

const viewerTab = ref<ViewerTab>('all')
const externalLink = ref('')
const appliedLink = ref('')

const audienceValue = computed(() => {
  const matched = props.selectedRoom.audience.match(/\d+(?:,\d+)*/u)
  return matched ? Number(matched[0].replace(/,/gu, '')) : 0
})

const hostInitial = computed(
  () => props.selectedRoom.host.trim().slice(0, 1) || '主'
)

const followerLabel = computed(() => {
  const followers = audienceValue.value * 2.25
  if (followers >= 10000) {
    return `${(followers / 10000).toFixed(1).replace(/\.0$/u, '')}万`
  }
  return `${Math.round(followers)}`
})

const audienceHeadline = computed(() => {
  if (audienceValue.value >= 10000) {
    return `在线观众 · ${(audienceValue.value / 10000).toFixed(1).replace(/\.0$/u, '')}万`
  }
  return `在线观众 · ${props.selectedRoom.audience}`
})

const sceneRankBadge = computed(() =>
  props.selectedRoom.statusTone === 'live'
    ? '小店榜 100+'
    : props.selectedRoom.status
)

const countdownLabel = computed(() => {
  if (props.selectedRoom.statusTone === 'live') return '24'
  if (props.selectedRoom.statusTone === 'next') return '08'
  return '00'
})

const pinNote = computed(
  () =>
    appliedLink.value ||
    `${props.selectedRoom.host} 正在讲解 ${props.selectedRoom.category}，右侧是观众排行和实时弹幕。`
)

const stageHeroes = computed(() =>
  props.rooms.slice(0, 3).map((room, index) => ({
    id: room.id,
    rank: `${index + 1}`,
    initial: room.host.slice(0, 1),
    title: room.host,
    subtitle: room.name,
    tone: ['rose', 'aqua', 'amber'][index] as 'rose' | 'aqua' | 'amber'
  }))
)

const rosterItems = computed(() => {
  const labels = [
    `${props.selectedRoom.host}主控`,
    props.selectedRoom.category,
    props.selectedRoom.tags[0] ?? '主会场',
    props.selectedRoom.tags[1] ?? '互动位',
    props.selectedRoom.tags[2] ?? '福利位',
    props.rooms[0]?.host ?? '安可',
    props.rooms[1]?.host ?? '小桃',
    props.rooms[2]?.host ?? '陆雨',
    props.giftItems[0]?.name ?? '超级火箭',
    props.giftItems[1]?.name ?? '加冕花冠',
    props.giftItems[2]?.name ?? '爱心气泡',
    props.giftItems[3]?.name ?? '应援卡'
  ]

  return labels.map((label, index) => ({
    id: `${label}-${index}`,
    label,
    detail: index % 3 === 0 ? '3 星' : index % 3 === 1 ? '2 星' : '1 星',
    grade: index === 0 ? 'S' : 'A',
    active: index === 0 || index === 5 || index === 8
  }))
})

const stageMetrics = computed(() => [
  { label: '在线', value: props.selectedRoom.audience },
  { label: 'GMV', value: props.selectedRoom.gmv },
  { label: '时段', value: props.selectedRoom.slot }
])

const giftRibbon = computed(() =>
  props.giftItems.slice(0, 4).map((gift) => ({
    gift,
    short: gift.name.slice(0, 2)
  }))
)

const visibleFeed = computed(() => props.liveFeed.slice(0, 10))

const filteredViewerRanking = computed(() => {
  const list =
    viewerRankingMap[props.selectedRoom.id] ??
    viewerRankingMap['room-main'] ??
    []
  if (viewerTab.value === 'all') return list
  return list.filter((item) => item.bucket === viewerTab.value)
})

const feedToneLabel = (tone: LiveFeedItem['tone']) => {
  if (tone === 'gift') return '礼'
  if (tone === 'order') return '购'
  if (tone === 'follow') return '粉'
  return '播'
}

const previewAction = (label: string) => {
  ElMessage.success(`${label} 已接入直播间交互布局`)
}

const previewGift = (gift: GiftItem) => {
  ElMessage.success(`已将 ${gift.name} 放入底部礼物栏`)
}

const enterRoom = () => {
  ElMessage.success(`已打开 ${props.selectedRoom.name}`)
}

const shareRoom = () => {
  ElMessage.success(`已生成 ${props.selectedRoom.name} 的分享预览`)
}

const applyLink = () => {
  const value = externalLink.value.trim()
  if (!value) {
    ElMessage.warning('请先输入直播链接')
    return
  }

  appliedLink.value = `当前接入外部流：${value}`
  ElMessage.success('已切换到新的直播流')
}
</script>

<style scoped lang="scss">
.douyin-room-shell {
  --room-panel: rgba(40, 42, 58, 0.94);
  --room-panel-soft: rgba(61, 62, 81, 0.92);
  --room-border: rgba(255, 255, 255, 0.08);
  --room-text: #f6f7fb;
  --room-muted: rgba(255, 255, 255, 0.62);
  --room-pink: #fe2c55;
  --room-cyan: #25f4ee;
  --room-amber: #ffb94d;
  --room-shadow: 0 24px 60px rgba(0, 0, 0, 0.32);

  position: relative;
  display: grid;
  gap: 18px;
  color: var(--room-text);
}

.douyin-room-shell::before {
  content: '';
  position: absolute;
  inset: -10px 0 auto;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02),
    rgba(143, 160, 255, 0.42),
    rgba(255, 255, 255, 0.02)
  );
  pointer-events: none;
}

.room-command-bar,
.stage-panel,
.interaction-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--room-border);
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(54, 56, 76, 0.96), rgba(36, 37, 52, 0.92)),
    var(--room-panel);
  box-shadow:
    var(--room-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px);
}

.room-command-bar::before,
.stage-panel::before,
.interaction-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(126, 83, 188, 0.08),
    transparent 42%,
    rgba(241, 192, 108, 0.08)
  );
  pointer-events: none;
}

.room-command-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px 18px;
  padding: 18px;
}

.room-switcher {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.room-chip {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--room-text);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.room-chip:hover,
.command-button:hover,
.gift-pill:hover,
.footer-button:hover,
.board-icon:hover,
.composer-button:hover,
.selection-lock:hover,
.anchor-actions button:hover {
  transform: translateY(-1px);
}

.room-chip.active {
  border-color: rgba(254, 44, 85, 0.34);
  background: linear-gradient(
    135deg,
    rgba(136, 74, 182, 0.32),
    rgba(48, 74, 111, 0.24)
  );
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 16px 26px rgba(0, 0, 0, 0.16);
}

.room-chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.room-chip-dot.live {
  background: var(--room-pink);
  box-shadow: 0 0 0 6px rgba(254, 44, 85, 0.14);
}

.room-chip-dot.next {
  background: var(--room-cyan);
  box-shadow: 0 0 0 6px rgba(37, 244, 238, 0.12);
}

.room-chip-dot.done {
  background: var(--room-amber);
  box-shadow: 0 0 0 6px rgba(255, 185, 77, 0.12);
}

.room-chip-copy {
  min-width: 0;
}

.room-chip-copy strong,
.footer-copy strong,
.rank-copy strong,
.chat-meta strong,
.selection-card strong,
.metric-card strong {
  display: block;
}

.room-chip-copy small,
.footer-copy span {
  display: block;
  margin-top: 5px;
  color: var(--room-muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-chip-count {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.76);
}

.command-tools {
  display: grid;
  grid-template-columns: minmax(260px, 360px) auto auto;
  gap: 10px;
  align-items: center;
}

.source-input {
  min-width: 0;
}

.command-button,
.footer-button,
.composer-button,
.board-icon,
.selection-lock,
.scene-icon,
.anchor-actions button {
  border: 0;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.command-button,
.footer-button,
.composer-button {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
}

.command-button.primary,
.footer-button.primary,
.composer-button.primary,
.selection-lock {
  color: #fff;
  background: linear-gradient(135deg, var(--room-pink), #ff7a44);
  box-shadow: 0 14px 28px rgba(254, 44, 85, 0.26);
}

.command-button.ghost,
.footer-button.ghost,
.composer-button.ghost,
.board-icon,
.scene-icon,
.anchor-actions button {
  color: var(--room-text);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--room-border);
}

.command-note {
  grid-column: 1 / -1;
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.6;
}

.douyin-room-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.stage-panel,
.interaction-panel {
  padding: 18px;
}

.stage-screen {
  position: relative;
  min-height: clamp(640px, 78vh, 860px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 28px;
  background:
    radial-gradient(
      circle at 50% 8%,
      rgba(255, 255, 255, 0.16),
      transparent 16%
    ),
    radial-gradient(
      circle at 16% 16%,
      rgba(180, 64, 208, 0.34),
      transparent 28%
    ),
    radial-gradient(
      circle at 78% 14%,
      rgba(236, 174, 77, 0.14),
      transparent 18%
    ),
    linear-gradient(135deg, #3b314d 0%, #2d283e 48%, #2d2a3b 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 28px 46px rgba(0, 0, 0, 0.24);
}

.stage-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 36px 36px;
  pointer-events: none;
}

.stage-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(255, 255, 255, 0.08),
      transparent 22%
    ),
    linear-gradient(180deg, transparent 58%, rgba(15, 11, 23, 0.28) 100%);
  pointer-events: none;
}

.scene-topbar,
.scene-countdown,
.scene-metrics,
.floating-camera,
.scene-caption,
.gift-ribbon {
  position: absolute;
  z-index: 2;
}

.scene-topbar {
  top: 18px;
  left: 18px;
  right: 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.scene-icon.back {
  min-width: 52px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 700;
}

.anchor-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  margin-right: auto;
}

.anchor-avatar {
  width: 48px;
  height: 48px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff, #c2c6ff);
  color: #2a2940;
  font-size: 22px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.anchor-copy {
  min-width: 0;
}

.anchor-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.anchor-line span,
.camera-tag,
.board-kicker,
.chat-head small {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}

.anchor-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.anchor-actions button {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.scene-rank-badge,
.caption-live {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.scene-rank-badge {
  background: rgba(17, 18, 28, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.scene-countdown {
  top: 98px;
  left: 18px;
  right: 18px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 20px;
  border-radius: 999px;
  overflow: visible;
}

.scene-countdown-track {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    rgba(168, 191, 93, 0.92) 0 72%,
    rgba(209, 206, 161, 0.54) 72% 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 4px 16px rgba(0, 0, 0, 0.12);
}

.scene-countdown-badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  min-height: 50px;
  margin-right: 12px;
  padding: 0 18px;
  border-radius: 18px;
  background: rgba(43, 34, 58, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    0 16px 28px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.scene-countdown-badge span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 700;
}

.scene-countdown-badge strong {
  color: #ffd54a;
  font-size: 34px;
  line-height: 1;
}

.scene-arena {
  position: absolute;
  inset: 128px 18px 138px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 20px;
  align-items: stretch;
  z-index: 1;
}

.arena-showcase,
.arena-selection {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px;
}

.arena-showcase {
  padding: 28px 18px 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
  background:
    linear-gradient(180deg, rgba(122, 42, 144, 0.94), rgba(58, 26, 83, 0.9)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent);
  box-shadow: inset 0 -40px 64px rgba(15, 8, 30, 0.38);
}

.showcase-glow,
.showcase-wave {
  position: absolute;
  pointer-events: none;
}

.showcase-glow {
  inset: 22px 10% auto;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.22),
    transparent 72%
  );
}

.showcase-wave {
  left: -4%;
  right: -4%;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(162, 226, 81, 0.72),
    rgba(209, 233, 128, 0.42)
  );
}

.wave-a {
  top: 12%;
}

.wave-b {
  bottom: 11%;
}

.hero-card {
  position: relative;
  z-index: 1;
  min-height: 332px;
  padding: 18px 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: linear-gradient(
    180deg,
    rgba(19, 19, 28, 0.12),
    rgba(16, 14, 24, 0.74)
  );
  box-shadow:
    inset 0 -78px 110px rgba(0, 0, 0, 0.3),
    0 16px 28px rgba(0, 0, 0, 0.16);
}

.hero-card::before {
  content: '';
  position: absolute;
  left: 22px;
  right: 22px;
  top: 18px;
  bottom: 110px;
  border-radius: 48px 48px 0 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.24),
    rgba(21, 20, 33, 0.08)
  );
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.hero-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 46px;
  height: 42px;
  background: linear-gradient(
    90deg,
    rgba(118, 136, 57, 0.22),
    rgba(165, 192, 78, 0.42),
    rgba(118, 136, 57, 0.22)
  );
  opacity: 0.52;
}

.hero-card.rose::before {
  background: linear-gradient(
    180deg,
    rgba(47, 58, 72, 0.96),
    rgba(180, 58, 46, 0.84)
  );
}

.hero-card.aqua::before {
  background: linear-gradient(
    180deg,
    rgba(231, 234, 238, 0.98),
    rgba(62, 95, 128, 0.84)
  );
}

.hero-card.amber::before {
  background: linear-gradient(
    180deg,
    rgba(184, 87, 63, 0.94),
    rgba(96, 38, 43, 0.84)
  );
}

.hero-rank {
  position: absolute;
  left: 16px;
  bottom: 72px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffea68, #ff8a00);
  color: #5b2200;
  font-size: 30px;
  font-weight: 900;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28);
}

.hero-portrait {
  position: absolute;
  top: 22px;
  left: 18px;
  z-index: 1;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 19, 45, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  font-size: 28px;
  font-weight: 800;
}

.hero-card strong,
.hero-card small {
  position: relative;
  z-index: 1;
}

.hero-card strong {
  margin-top: auto;
  font-size: 30px;
  letter-spacing: 0.02em;
}

.hero-card small {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 14px;
}

.arena-selection {
  padding: 20px 18px 18px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  background:
    linear-gradient(
      180deg,
      rgba(229, 218, 184, 0.98),
      rgba(220, 202, 158, 0.98)
    ),
    linear-gradient(180deg, rgba(0, 0, 0, 0.06), transparent);
  color: #3d2f17;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.36);
}

.selection-tabs {
  display: inline-grid;
  justify-content: start;
  gap: 10px;
  font-size: 14px;
  font-weight: 800;
  color: #6a5522;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.selection-card {
  min-height: 98px;
  padding: 10px 12px;
  border-radius: 18px;
  border: 1px solid rgba(96, 67, 12, 0.18);
  background: rgba(255, 250, 235, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.46),
    0 8px 18px rgba(109, 88, 43, 0.08);
}

.selection-card.active {
  border-color: rgba(233, 132, 17, 0.52);
  background: linear-gradient(
    180deg,
    rgba(255, 239, 177, 0.98),
    rgba(255, 228, 122, 0.82)
  );
}

.selection-grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: rgba(85, 32, 110, 0.92);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.selection-card strong {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.3;
}

.selection-card small {
  display: block;
  margin-top: 8px;
  color: rgba(61, 47, 23, 0.72);
  font-size: 12px;
}

.selection-lock {
  justify-self: center;
  min-width: 196px;
  min-height: 54px;
  padding: 0 24px;
  border-radius: 18px;
  font-size: 18px;
  font-weight: 900;
}

.scene-metrics {
  right: 26px;
  bottom: 112px;
  display: grid;
  gap: 10px;
}

.metric-card {
  min-width: 148px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(96, 88, 74, 0.54);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  box-shadow:
    0 14px 26px rgba(0, 0, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.metric-card span {
  display: block;
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
}

.metric-card strong {
  margin-top: 8px;
  font-size: 20px;
}

.floating-camera {
  left: 18px;
  bottom: 112px;
  width: 136px;
  aspect-ratio: 3 / 4;
  padding: 14px;
  border-radius: 22px;
  display: grid;
  align-content: end;
  gap: 6px;
  background:
    linear-gradient(180deg, rgba(102, 46, 48, 0.08), rgba(21, 14, 20, 0.88)),
    radial-gradient(
      circle at 50% 22%,
      rgba(255, 255, 255, 0.18),
      transparent 34%
    );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 18px 30px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.floating-camera strong {
  font-size: 18px;
}

.floating-camera small {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.scene-caption {
  left: 170px;
  bottom: 112px;
  right: 194px;
  display: grid;
  gap: 10px;
}

.caption-live {
  justify-self: start;
  color: #fff;
  background: linear-gradient(135deg, var(--room-pink), #ff8a45);
}

.scene-caption p {
  margin: 0;
  max-width: 540px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 20px;
  line-height: 1.55;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.28);
}

.gift-ribbon {
  left: 14px;
  right: 14px;
  bottom: 14px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.gift-pill {
  flex: 0 0 auto;
  min-width: 116px;
  min-height: 88px;
  padding: 14px 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  display: grid;
  justify-items: center;
  gap: 8px;
  color: #fff;
  background: rgba(46, 47, 66, 0.88);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.gift-pill.rose {
  background: linear-gradient(
    180deg,
    rgba(255, 132, 163, 0.98),
    rgba(118, 56, 98, 0.9)
  );
}

.gift-pill.amber {
  background: linear-gradient(
    180deg,
    rgba(255, 206, 112, 0.98),
    rgba(120, 79, 32, 0.92)
  );
}

.gift-pill.aqua {
  background: linear-gradient(
    180deg,
    rgba(111, 243, 239, 0.98),
    rgba(37, 98, 121, 0.92)
  );
}

.gift-pill.violet {
  background: linear-gradient(
    180deg,
    rgba(206, 155, 255, 0.98),
    rgba(88, 62, 132, 0.92)
  );
}

.gift-pill-icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.22);
  font-size: 14px;
  font-weight: 800;
}

.stage-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 16px;
  padding: 0 4px;
}

.footer-copy strong {
  font-size: 18px;
}

.footer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.interaction-panel {
  position: sticky;
  top: 20px;
  min-height: clamp(640px, 78vh, 860px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 14px;
  background:
    linear-gradient(180deg, rgba(68, 69, 92, 0.96), rgba(43, 44, 63, 0.96)),
    rgba(50, 51, 68, 0.96);
}

.audience-board,
.chat-board,
.chat-composer {
  border: 1px solid var(--room-border);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(78, 79, 104, 0.5), rgba(58, 59, 79, 0.72)),
    var(--room-panel-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.audience-board,
.chat-board {
  padding: 18px 16px;
}

.board-head,
.chat-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.board-head h3 {
  margin: 6px 0 0;
  font-size: 28px;
}

.board-icon {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  font-size: 18px;
  line-height: 1;
}

.rank-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.rank-tab {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--room-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.rank-tab.active {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.14);
}

.rank-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.rank-row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.rank-index {
  width: 18px;
  color: #ff5d5d;
  font-size: 24px;
  font-weight: 800;
  text-align: center;
}

.rank-row:nth-child(2) .rank-index {
  color: #ffb04d;
}

.rank-row:nth-child(3) .rank-index {
  color: #67d7ff;
}

.rank-avatar {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  color: #1f2131;
  background: rgba(255, 255, 255, 0.92);
}

.rank-avatar.rose {
  background: linear-gradient(135deg, #ffe0e8, #ff8eae);
}

.rank-avatar.amber {
  background: linear-gradient(135deg, #fff0cd, #ffc86b);
}

.rank-avatar.aqua {
  background: linear-gradient(135deg, #d9fffd, #6ff3ef);
}

.rank-copy {
  min-width: 0;
}

.rank-copy small,
.rank-score {
  color: rgba(255, 255, 255, 0.68);
  font-size: 13px;
}

.chat-board {
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
}

.chat-head span {
  font-size: 16px;
  font-weight: 800;
}

.chat-head small {
  max-width: 168px;
  text-align: right;
  line-height: 1.5;
}

.chat-list {
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 14px;
  padding-right: 4px;
}

.chat-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
}

.chat-badge {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.chat-badge.gift {
  background: linear-gradient(135deg, #ffb257, #fe2c55);
}

.chat-badge.order {
  background: linear-gradient(135deg, #25f4ee, #4699ff);
}

.chat-badge.follow {
  background: linear-gradient(135deg, #7d9eff, #b371ff);
}

.chat-badge.notice {
  background: linear-gradient(135deg, #fe2c55, #ff8a45);
}

.chat-bubble {
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(255, 255, 255, 0.06);
}

.chat-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.chat-meta span {
  color: rgba(255, 255, 255, 0.56);
  font-size: 11px;
}

.chat-bubble p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  line-height: 1.6;
}

.chat-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  padding: 14px;
}

.composer-field {
  min-height: 50px;
  padding: 0 14px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.54);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--room-border);
}

:deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.42);
}

@media (max-width: 1500px) {
  .douyin-room-layout {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .scene-arena {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-card {
    min-height: 260px;
  }
}

@media (max-width: 1240px) {
  .room-command-bar,
  .douyin-room-layout {
    grid-template-columns: 1fr;
  }

  .command-tools {
    grid-template-columns: 1fr auto auto;
  }

  .interaction-panel {
    position: static;
    min-height: auto;
  }

  .scene-caption {
    right: 24px;
  }

  .stage-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 980px) {
  .room-switcher,
  .command-tools,
  .chat-composer {
    grid-template-columns: 1fr;
  }

  .stage-footer {
    align-items: flex-start;
  }

  .scene-topbar {
    flex-wrap: wrap;
  }

  .scene-rank-badge {
    margin-left: auto;
  }

  .scene-countdown {
    top: 124px;
  }

  .scene-arena {
    inset: 150px 14px 154px;
    gap: 14px;
  }

  .arena-showcase {
    grid-template-columns: 1fr;
  }

  .selection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scene-caption {
    left: 24px;
    right: 24px;
    bottom: 126px;
  }

  .floating-camera,
  .scene-metrics {
    display: none;
  }
}

@media (max-width: 720px) {
  .room-command-bar,
  .stage-panel,
  .interaction-panel {
    padding: 12px;
    border-radius: 20px;
  }

  .stage-screen {
    min-height: 720px;
  }

  .scene-countdown {
    top: 116px;
  }

  .anchor-summary {
    width: 100%;
  }

  .anchor-actions {
    flex-wrap: wrap;
  }

  .selection-grid {
    grid-template-columns: 1fr;
  }

  .scene-caption p {
    font-size: 16px;
  }

  .gift-ribbon {
    gap: 8px;
  }

  .gift-pill {
    min-width: 96px;
  }

  .footer-actions {
    width: 100%;
  }

  .footer-button,
  .composer-button,
  .selection-lock {
    width: 100%;
  }
}
</style>
