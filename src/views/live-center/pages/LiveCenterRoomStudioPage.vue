<template>
  <div class="studio-page">
    <header class="studio-topbar">
      <div class="studio-title">
        <button type="button" class="ghost-button" @click="goBack">
          返回直播间列表
        </button>
        <div>
          <span class="section-kicker">沉浸式房间</span>
          <h2>{{ selectedRoom.name }}</h2>
          <p>
            {{ selectedRoom.host }} · {{ selectedRoom.category }} ·
            {{ selectedRoom.slot }}
          </p>
        </div>
      </div>

      <div class="studio-topbar-actions">
        <span class="status-pill" :class="selectedRoom.statusTone">
          {{ selectedRoom.status }}
        </span>
        <button type="button" class="ghost-button" @click="shareRoom">
          复制分享
        </button>
        <button
          type="button"
          class="primary-button"
          @click="openStreamInNewTab"
        >
          新窗口打开
        </button>
      </div>
    </header>

    <div class="studio-shell">
      <section class="studio-stage-board">
        <div class="stage-backdrop">
          <span>{{ selectedRoom.coverTitle }}</span>
        </div>

        <div class="stage-grid">
          <div class="stage-copy">
            <span class="section-kicker">主播态势</span>
            <h3>{{ roomToneText }}</h3>
            <p>{{ selectedRoom.summary }}</p>

            <div class="anchor-card">
              <div class="anchor-avatar">
                {{ selectedRoom.host.slice(0, 1) }}
              </div>
              <div class="anchor-copy">
                <strong>{{ selectedRoom.host }}</strong>
                <p>{{ followerLabel }} 粉丝 · {{ audienceHeadline }}</p>
              </div>
            </div>

            <div class="tag-list">
              <span v-for="tag in stageBadges" :key="tag">{{ tag }}</span>
            </div>
          </div>

          <div class="phone-stage">
            <div class="phone-frame">
              <LiveCenterStreamSurface
                :src="currentStreamUrl"
                :room="selectedRoom"
                fit="cover"
                :show-status-bar="false"
              >
                <LiveCenterPlayerCard
                  :room="selectedRoom"
                  @enter-room="openStreamInNewTab"
                />
              </LiveCenterStreamSurface>

              <div class="phone-head">
                <span class="phone-pill" :class="selectedRoom.statusTone">
                  {{ selectedRoom.status }}
                </span>
                <span class="phone-pill subtle">{{ audienceHeadline }}</span>
              </div>

              <div class="phone-side-actions">
                <button type="button" class="phone-action" @click="shareRoom">
                  分享
                </button>
                <button
                  type="button"
                  class="phone-action"
                  @click="openStreamInNewTab"
                >
                  打开
                </button>
              </div>

              <div class="phone-foot">
                <strong>{{ selectedRoom.host }} 正在讲解</strong>
                <p>{{ streamStatusLine }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="stage-metrics">
          <div
            v-for="item in highlightStats"
            :key="item.label"
            class="metric-card"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.note }}</small>
          </div>
        </div>
      </section>

      <aside class="studio-side">
        <section class="side-card source-card">
          <div class="panel-head">
            <div>
              <span class="section-kicker">房间控制</span>
              <strong>切流与播放链</strong>
            </div>
            <span class="soft-pill">{{
              hasStreamOverride ? '手动切流' : '默认演示流'
            }}</span>
          </div>

          <div class="source-bar">
            <el-input
              v-model="streamInput"
              clearable
              placeholder="支持 mock:// 房间ID 或 m3u8 / flv / mp4"
            />
            <div class="source-actions">
              <button type="button" class="ghost-button" @click="resetStream">
                恢复默认
              </button>
              <button type="button" class="primary-button" @click="applyStream">
                切换预览
              </button>
            </div>
          </div>

          <p
            class="source-tip"
            :class="{ warning: currentStreamSource.kind === 'unsupported' }"
          >
            {{ streamStatusLine }}
          </p>
        </section>

        <section class="side-card summary-card">
          <div class="panel-head">
            <div>
              <span class="section-kicker">房间摘要</span>
              <strong>{{ selectedRoom.name }}</strong>
            </div>
          </div>

          <div class="detail-grid">
            <div
              v-for="item in detailRows"
              :key="item.label"
              class="detail-item"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </div>
          </div>

          <div class="tag-list compact">
            <span v-for="tag in selectedRoom.tags" :key="tag">{{ tag }}</span>
          </div>
        </section>

        <section class="side-card chat-card">
          <div class="panel-head">
            <div>
              <span class="section-kicker">实时互动</span>
              <strong>弹幕与播报</strong>
            </div>
          </div>

          <div class="feed-list">
            <div v-for="item in visibleFeed" :key="item.id" class="feed-item">
              <span class="feed-badge" :class="item.tone">
                {{ feedToneLabel(item.tone) }}
              </span>
              <div class="feed-copy">
                <strong>{{ item.user }}</strong>
                <p>{{ item.action }} {{ item.highlight }}</p>
              </div>
              <small>{{ item.time }}</small>
            </div>
          </div>

          <div class="chat-composer">
            <el-input
              v-model="draftMessage"
              maxlength="60"
              placeholder="发送欢迎词、福利提醒或运营话术"
              show-word-limit
              @keyup.enter="sendStudioMessage"
            />
            <button
              type="button"
              class="primary-button"
              @click="sendStudioMessage"
            >
              发送话术
            </button>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LiveCenterPlayerCard from '../components/LiveCenterPlayerCard.vue'
import LiveCenterStreamSurface from '../components/LiveCenterStreamSurface.vue'
import { useLiveCenterContext } from '../liveCenterContext'
import {
  getStreamKindLabel,
  normalizeStreamUrl,
  resolveStreamSource
} from '../streamUtils'
import type { LiveFeedItem } from '../types'

const route = useRoute()
const router = useRouter()
const { liveFeed, roomList, selectedRoom, selectRoom } = useLiveCenterContext()

const streamInput = ref('')
const streamOverride = ref('')
const draftMessage = ref('')
const localFeed = ref<LiveFeedItem[]>([])

const nowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

watch(
  () => route.params.roomId,
  (roomId) => {
    const id = String(roomId ?? '')
    const matched = roomList.find((item) => item.id === id)
    if (!matched) {
      router.replace('/live-center/rooms')
      return
    }

    selectRoom(matched.id)
    draftMessage.value = ''
    localFeed.value = []
  },
  { immediate: true }
)

watch(
  () => route.query.stream,
  (value) => {
    const nextValue = normalizeStreamUrl(typeof value === 'string' ? value : '')
    streamOverride.value = nextValue
    streamInput.value =
      nextValue || normalizeStreamUrl(selectedRoom.value.previewStreamUrl)
  },
  { immediate: true }
)

watch(
  () => selectedRoom.value.previewStreamUrl,
  (value) => {
    if (!streamOverride.value) {
      streamInput.value = normalizeStreamUrl(value)
    }
  }
)

const currentStreamUrl = computed(
  () =>
    normalizeStreamUrl(streamOverride.value) ||
    normalizeStreamUrl(selectedRoom.value.previewStreamUrl)
)

const currentStreamSource = computed(() =>
  resolveStreamSource(currentStreamUrl.value)
)

const hasStreamOverride = computed(() =>
  Boolean(normalizeStreamUrl(streamOverride.value))
)

const visibleFeed = computed(() =>
  [...localFeed.value, ...liveFeed.value].slice(0, 10)
)

const audienceValue = computed(() => {
  const matched = selectedRoom.value.audience.match(/\d+(?:,\d+)*/u)
  return matched ? Number(matched[0].replace(/,/gu, '')) : 0
})

const audienceHeadline = computed(() => {
  if (audienceValue.value >= 10000) {
    return `${(audienceValue.value / 10000).toFixed(1).replace(/\.0$/u, '')}万在线`
  }
  return `${selectedRoom.value.audience} 在线`
})

const followerLabel = computed(() => {
  const followers = audienceValue.value * 2.4
  if (followers >= 10000) {
    return `${(followers / 10000).toFixed(1).replace(/\.0$/u, '')}万`
  }
  return `${Math.round(followers)}`
})

const roomToneText = computed(() => {
  if (selectedRoom.value.statusTone === 'live') {
    return '当前房间处于强转化时段，主画面已经切成沉浸式主舞台。'
  }
  if (selectedRoom.value.statusTone === 'next') {
    return '当前房间处于预热期，适合提前挂载试播流和收藏引导。'
  }
  return '当前房间处于回放承接期，适合复购和售后答疑场景。'
})

const streamStatusLine = computed(() => {
  if (currentStreamSource.value.kind === 'empty') {
    return '当前没有可播放流地址，页面会保留默认房间视图。'
  }

  if (currentStreamSource.value.kind === 'unsupported') {
    return '当前是网页地址，不是 m3u8、flv、mp4 直链，视频区不会直接播放。'
  }

  return `${getStreamKindLabel(currentStreamSource.value.kind)}已接入${
    hasStreamOverride.value ? '，当前为手动切流' : '，当前为默认演示流'
  }。`
})

const stageBadges = computed(() => {
  const modeTag = hasStreamOverride.value ? '手动切流' : '默认演示流'
  return [...selectedRoom.value.tags, modeTag].slice(0, 4)
})

const highlightStats = computed(() => [
  {
    label: '在线观众',
    value: selectedRoom.value.audience,
    note: '当前房间实时在线'
  },
  {
    label: '房间 GMV',
    value: selectedRoom.value.gmv,
    note: '当前场次成交规模'
  },
  {
    label: '粉丝体量',
    value: `${followerLabel.value}`,
    note: '按当前在线估算'
  },
  {
    label: '当前流类型',
    value:
      currentStreamSource.value.kind === 'unsupported'
        ? '待修正'
        : getStreamKindLabel(currentStreamSource.value.kind),
    note: hasStreamOverride.value ? '来自手动切换' : '来自房间默认流'
  }
])

const detailRows = computed(() => [
  {
    label: '直播时段',
    value: selectedRoom.value.slot,
    note: '当前排班窗口'
  },
  {
    label: '主讲类目',
    value: selectedRoom.value.category,
    note: roomToneText.value
  },
  {
    label: '播放链路',
    value:
      currentStreamSource.value.kind === 'unsupported'
        ? '链接待修正'
        : getStreamKindLabel(currentStreamSource.value.kind),
    note: hasStreamOverride.value ? '当前为外部接入' : '当前为房间默认流'
  }
])

const feedToneLabel = (tone: LiveFeedItem['tone']) => {
  if (tone === 'gift') return '礼物'
  if (tone === 'order') return '成交'
  if (tone === 'follow') return '关注'
  return '播报'
}

const pushLocalFeed = (item: Omit<LiveFeedItem, 'id' | 'time'>) => {
  localFeed.value = [
    {
      id: `studio-${Date.now()}`,
      time: nowTime(),
      ...item
    },
    ...localFeed.value
  ].slice(0, 4)
}

const goBack = () => {
  router.push('/live-center/rooms')
}

const shareRoom = async () => {
  const shareText = `${selectedRoom.value.name}｜${selectedRoom.value.host}｜${selectedRoom.value.slot}`
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText)
      ElMessage.success('分享文案已复制到剪贴板')
      return
    }
  } catch {
    // Clipboard may be unavailable in some environments.
  }

  ElMessage.success('已生成分享预览')
}

const openStreamInNewTab = () => {
  if (!currentStreamUrl.value) {
    ElMessage.info('当前没有可打开的流地址')
    return
  }

  if (currentStreamSource.value.kind === 'mock') {
    const target = router.resolve({
      name: 'live-center-room-studio',
      params: { roomId: selectedRoom.value.id },
      query: {
        ...route.query,
        stream: currentStreamUrl.value
      }
    })
    window.open(target.href, '_blank', 'noopener,noreferrer')
    ElMessage.success('已在新窗口打开模拟直播房间')
    return
  }

  window.open(currentStreamUrl.value, '_blank', 'noopener,noreferrer')
  ElMessage.success('已在新窗口打开当前流地址')
}

const applyStream = () => {
  const value = normalizeStreamUrl(streamInput.value)
  if (!value) {
    ElMessage.warning('请先输入 mock:// 房间ID 或 m3u8 / flv / mp4')
    return
  }

  streamOverride.value = value
  router.replace({
    query: {
      ...route.query,
      stream: value
    }
  })

  if (resolveStreamSource(value).kind === 'unsupported') {
    ElMessage.warning('地址已更新，但它不是 m3u8、flv、mp4 直链')
    return
  }

  ElMessage.success('已切换房间预览流')
}

const resetStream = () => {
  streamOverride.value = ''
  streamInput.value = normalizeStreamUrl(selectedRoom.value.previewStreamUrl)
  const nextQuery = { ...route.query }
  delete nextQuery.stream
  router.replace({ query: nextQuery })
  ElMessage.success('已恢复房间默认演示流')
}

const sendStudioMessage = () => {
  const value = draftMessage.value.trim()
  if (!value) {
    ElMessage.warning('请输入要发送的话术')
    return
  }

  pushLocalFeed({
    user: '运营台',
    action: '发送话术',
    highlight: value,
    tone: 'notice'
  })
  draftMessage.value = ''
  ElMessage.success('话术已写入互动流')
}
</script>

<style scoped lang="scss">
.studio-page {
  display: grid;
  gap: 18px;
  color: #f6f8ff;
}

.studio-topbar,
.studio-stage-board,
.side-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: linear-gradient(
    180deg,
    rgba(22, 26, 40, 0.96),
    rgba(10, 13, 23, 0.96)
  );
  box-shadow:
    0 28px 70px rgba(4, 9, 20, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.studio-topbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  padding: 20px;
}

.studio-title {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.studio-title h2 {
  margin: 10px 0 0;
  font-size: 30px;
  line-height: 1.06;
}

.studio-title p,
.stage-copy p,
.anchor-copy p,
.source-tip,
.feed-item p,
.feed-item small {
  margin: 8px 0 0;
  color: rgba(235, 239, 255, 0.68);
  line-height: 1.7;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.studio-topbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.status-pill,
.ghost-button,
.primary-button,
.soft-pill,
.phone-pill,
.phone-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
}

.status-pill.live,
.phone-pill.live {
  color: #fff;
  background: linear-gradient(135deg, #ff5b7a, #ff8a5b);
}

.status-pill.next,
.phone-pill.next {
  color: #062326;
  background: linear-gradient(135deg, #66e3db, #9cf7f0);
}

.status-pill.done,
.phone-pill.done {
  color: #442f05;
  background: linear-gradient(135deg, #ffca65, #ffe3aa);
}

.ghost-button,
.primary-button,
.phone-action {
  border: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.ghost-button:hover,
.primary-button:hover,
.phone-action:hover {
  transform: translateY(-2px);
}

.ghost-button {
  color: inherit;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.primary-button {
  color: #fff;
  background: linear-gradient(135deg, #ff5b7a, #ff8a5b);
  box-shadow: 0 14px 28px rgba(255, 91, 122, 0.28);
}

.soft-pill,
.phone-pill.subtle {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(246, 248, 255, 0.84);
}

.studio-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 18px;
  align-items: start;
}

.studio-stage-board {
  padding: 24px;
  min-height: 920px;
  background:
    radial-gradient(
      circle at 18% 12%,
      rgba(255, 91, 122, 0.18),
      transparent 22%
    ),
    radial-gradient(
      circle at 82% 14%,
      rgba(102, 227, 219, 0.16),
      transparent 22%
    ),
    linear-gradient(145deg, rgba(16, 20, 33, 0.98), rgba(7, 9, 17, 0.98));
}

.stage-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 24px;
  pointer-events: none;
}

.stage-backdrop span {
  font-size: clamp(44px, 8vw, 96px);
  font-weight: 900;
  line-height: 0.86;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.04);
  text-align: right;
}

.stage-grid,
.stage-metrics {
  position: relative;
  z-index: 1;
}

.stage-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.7fr) minmax(320px, 520px);
  gap: 28px;
  align-items: center;
}

.stage-copy {
  display: grid;
  gap: 18px;
}

.stage-copy h3 {
  margin: 0;
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.06;
}

.anchor-card {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.anchor-avatar {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff, #9be8df);
  color: #112033;
  font-size: 24px;
  font-weight: 900;
}

.anchor-copy strong {
  font-size: 18px;
}

.phone-stage {
  display: flex;
  justify-content: center;
}

.phone-frame {
  position: relative;
  width: min(100%, 430px);
  aspect-ratio: 9 / 16;
  padding: 12px;
  border-radius: 34px;
  background: linear-gradient(
    180deg,
    rgba(22, 27, 42, 0.98),
    rgba(6, 8, 14, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 36px 80px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.phone-frame :deep(.stream-surface),
.phone-frame :deep(.stream-video),
.phone-frame :deep(.stream-placeholder),
.phone-frame :deep(.stream-state) {
  width: 100%;
  height: 100%;
  min-height: 100%;
  border-radius: 24px;
}

.phone-head,
.phone-foot,
.phone-side-actions {
  position: absolute;
  z-index: 2;
}

.phone-head {
  top: 26px;
  left: 26px;
  right: 26px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.phone-side-actions {
  right: 22px;
  top: 50%;
  display: grid;
  gap: 10px;
  transform: translateY(-50%);
}

.phone-action {
  min-width: 60px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 999px;
  color: #fff;
  background: rgba(10, 14, 22, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.phone-foot {
  left: 26px;
  right: 26px;
  bottom: 24px;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(6, 10, 18, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.phone-foot strong {
  display: block;
  font-size: 18px;
}

.phone-foot p {
  margin: 8px 0 0;
  color: rgba(239, 242, 255, 0.74);
  line-height: 1.6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-list span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
}

.stage-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}

.metric-card,
.detail-item,
.feed-item,
.chat-composer {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.metric-card {
  padding: 16px;
}

.metric-card span,
.metric-card strong,
.metric-card small,
.detail-item span,
.detail-item strong,
.detail-item small {
  display: block;
}

.metric-card span,
.detail-item span {
  color: rgba(235, 239, 255, 0.68);
  font-size: 12px;
}

.metric-card strong,
.detail-item strong {
  margin-top: 10px;
  font-size: 22px;
}

.metric-card small,
.detail-item small {
  margin-top: 8px;
  color: rgba(235, 239, 255, 0.6);
  line-height: 1.6;
}

.studio-side {
  display: grid;
  gap: 16px;
}

.side-card {
  padding: 18px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.panel-head strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
}

.source-bar,
.source-actions,
.detail-grid,
.feed-list {
  display: grid;
}

.source-bar {
  gap: 12px;
  margin-top: 16px;
}

.source-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.source-bar :deep(.el-input__wrapper),
.chat-composer :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.07);
  box-shadow: none;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.source-bar :deep(.el-input__inner),
.chat-composer :deep(.el-input__inner),
.chat-composer :deep(.el-input__count) {
  color: #f6f8ff;
}

.source-bar :deep(.el-input__inner::placeholder),
.chat-composer :deep(.el-input__inner::placeholder) {
  color: rgba(235, 239, 255, 0.56);
}

.source-tip.warning {
  color: #ffb8c5;
}

.detail-grid {
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;
}

.detail-item {
  padding: 14px 16px;
}

.tag-list.compact {
  margin-top: 14px;
}

.chat-card {
  display: grid;
  gap: 16px;
}

.feed-list {
  gap: 12px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}

.feed-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 12px 14px;
}

.feed-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.feed-badge.gift {
  background: rgba(255, 91, 122, 0.18);
  color: #ffd7df;
}

.feed-badge.order {
  background: rgba(255, 202, 101, 0.18);
  color: #ffe8b0;
}

.feed-badge.follow {
  background: rgba(102, 227, 219, 0.18);
  color: #d4fffa;
}

.feed-badge.notice {
  background: rgba(141, 125, 255, 0.18);
  color: #e2dcff;
}

.feed-copy strong {
  display: block;
}

.chat-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
}

@media (max-width: 1400px) {
  .studio-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .stage-grid,
  .stage-metrics {
    grid-template-columns: 1fr;
  }

  .phone-stage {
    justify-content: flex-start;
  }
}

@media (max-width: 820px) {
  .studio-topbar,
  .studio-title,
  .source-actions,
  .chat-composer {
    display: grid;
  }

  .phone-head,
  .phone-side-actions {
    position: static;
    transform: none;
  }

  .phone-head {
    margin: 14px 14px 0;
  }

  .phone-side-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 12px 14px 0;
  }

  .phone-foot {
    left: 18px;
    right: 18px;
    bottom: 18px;
  }

  .chat-composer {
    grid-template-columns: 1fr;
  }
}
</style>
