<template>
  <div class="stream-surface">
    <video
      v-if="isVideoSurface"
      ref="videoRef"
      class="stream-video"
      :class="`fit-${fit}`"
      :autoplay="autoplay"
      :controls="controls"
      :muted="muted"
      playsinline
      webkit-playsinline="true"
      x5-video-player-type="h5"
      @canplay="handleCanPlay"
      @error="handleNativeError"
      @loadedmetadata="handleLoadedMetadata"
      @waiting="handleWaiting"
    ></video>

    <LiveCenterMockStream
      v-else-if="source.kind === 'mock' && room"
      :room="room"
    />

    <div
      v-else-if="source.kind === 'unsupported'"
      class="stream-state stream-state-warning"
    >
      <span class="state-kicker">无法直接播放</span>
      <strong>{{ unsupportedMessage }}</strong>
      <p>
        请改用 `m3u8`、`flv`、`mp4` 直链。当前这类页面地址会被浏览器拦截嵌入。
      </p>
      <button type="button" class="state-button" @click="openRawLink">
        新窗口打开原始地址
      </button>
    </div>

    <div v-else class="stream-placeholder">
      <slot />
    </div>

    <div
      v-if="showStatusBar && source.kind !== 'empty'"
      class="stream-status-bar"
    >
      <div class="status-copy">
        <span>{{ streamTypeLabel }}</span>
        <strong>{{ errorMessage || statusMessage }}</strong>
      </div>
      <button type="button" class="status-button" @click="copySource">
        复制流地址
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch
} from 'vue'
import { ElMessage } from 'element-plus'
import Hls from 'hls.js'
import flvjs from 'flv.js'
import LiveCenterMockStream from './LiveCenterMockStream.vue'
import {
  getStreamKindLabel,
  getUnsupportedStreamMessage,
  resolveStreamSource
} from '../streamUtils'
import type { StreamRoom } from '../types'

const props = withDefaults(
  defineProps<{
    src?: string
    room?: StreamRoom
    fit?: 'cover' | 'contain'
    autoplay?: boolean
    muted?: boolean
    controls?: boolean
    showStatusBar?: boolean
  }>(),
  {
    src: '',
    fit: 'cover',
    autoplay: true,
    muted: true,
    controls: true,
    showStatusBar: true
  }
)

const videoRef = ref<HTMLVideoElement | null>(null)
const hlsRef = shallowRef<Hls | null>(null)
const flvPlayerRef = shallowRef<ReturnType<typeof flvjs.createPlayer> | null>(
  null
)
const errorMessage = ref('')
const statusMessage = ref('待接入直播流')

const source = computed(() => resolveStreamSource(props.src))
const isVideoSurface = computed(() =>
  ['hls', 'flv', 'native'].includes(source.value.kind)
)
const streamTypeLabel = computed(() => getStreamKindLabel(source.value.kind))
const unsupportedMessage = computed(() => getUnsupportedStreamMessage())

const clearMediaElement = () => {
  const video = videoRef.value
  if (!video) return

  video.pause()
  video.removeAttribute('src')
  video.load()
}

const cleanupPlayers = () => {
  if (hlsRef.value) {
    hlsRef.value.destroy()
    hlsRef.value = null
  }

  if (flvPlayerRef.value) {
    try {
      flvPlayerRef.value.pause()
      flvPlayerRef.value.unload()
      flvPlayerRef.value.detachMediaElement()
    } catch {
      // Ignore cleanup errors from third-party players.
    }
    flvPlayerRef.value.destroy()
    flvPlayerRef.value = null
  }

  clearMediaElement()
}

const attemptAutoplay = async () => {
  const video = videoRef.value
  if (!video || !props.autoplay) return

  try {
    await video.play()
  } catch {
    statusMessage.value = '已连接，等待手动播放'
  }
}

const mapNativeError = () => {
  const code = videoRef.value?.error?.code
  if (code === MediaError.MEDIA_ERR_ABORTED) return '播放被手动中止'
  if (code === MediaError.MEDIA_ERR_NETWORK) return '网络异常，流地址暂时不可达'
  if (code === MediaError.MEDIA_ERR_DECODE)
    return '视频解码失败，请检查编码格式'
  if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    return '当前浏览器不支持这个视频格式'
  }
  return '媒体加载失败，请检查流地址是否有效'
}

const mapHlsError = (detail: string) => {
  if (detail.includes('manifest')) return 'HLS 清单加载失败，请检查 m3u8 地址'
  if (detail.includes('buffer')) return 'HLS 缓冲异常，请稍后重试'
  if (detail.includes('level')) return 'HLS 码率切换失败，请检查源站'
  return `HLS 播放失败：${detail}`
}

const mapFlvError = (errorType: string, errorDetail: string) => {
  if (errorType === 'NetworkError') return 'FLV 网络连接失败，请检查流地址'
  if (errorType === 'MediaError') return 'FLV 解码失败，请检查编码参数'
  return `FLV 播放失败：${errorDetail || errorType}`
}

const mountStream = async () => {
  cleanupPlayers()
  errorMessage.value = ''

  if (source.value.kind === 'empty') {
    statusMessage.value = '待接入直播流'
    return
  }

  if (source.value.kind === 'mock') {
    statusMessage.value = '本地模拟流运行中'
    return
  }

  if (source.value.kind === 'unsupported') {
    statusMessage.value = '需要直播直链'
    errorMessage.value = unsupportedMessage.value
    return
  }

  statusMessage.value = `正在连接${streamTypeLabel.value}`
  await nextTick()

  const video = videoRef.value
  if (!video) return

  video.muted = props.muted
  video.autoplay = props.autoplay
  video.controls = props.controls

  if (source.value.kind === 'native') {
    video.src = source.value.url
    video.load()
    void attemptAutoplay()
    return
  }

  if (source.value.kind === 'hls') {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.value.url
      video.load()
      void attemptAutoplay()
      return
    }

    if (!Hls.isSupported()) {
      statusMessage.value = '浏览器不支持 HLS'
      errorMessage.value = '当前浏览器不支持 HLS 播放，请改用 mp4 或更换浏览器'
      return
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30
    })

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      errorMessage.value = ''
      statusMessage.value = 'HLS 流已接入'
      void attemptAutoplay()
    })

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return
      statusMessage.value = 'HLS 播放失败'
      errorMessage.value = mapHlsError(String(data.details ?? 'unknown'))
    })

    hlsRef.value = hls
    hls.loadSource(source.value.url)
    hls.attachMedia(video)
    return
  }

  if (!flvjs.isSupported()) {
    statusMessage.value = '浏览器不支持 FLV'
    errorMessage.value = '当前浏览器不支持 FLV 直链，请改用 m3u8 或 mp4'
    return
  }

  const flvPlayer = flvjs.createPlayer(
    {
      type: 'flv',
      url: source.value.url,
      isLive: true,
      cors: true
    },
    {
      enableWorker: false,
      enableStashBuffer: false,
      autoCleanupSourceBuffer: true,
      lazyLoad: false
    }
  )

  flvPlayer.on(flvjs.Events.ERROR, (errorType: string, errorDetail: string) => {
    statusMessage.value = 'FLV 播放失败'
    errorMessage.value = mapFlvError(errorType, errorDetail)
  })

  flvPlayerRef.value = flvPlayer
  flvPlayer.attachMediaElement(video)
  flvPlayer.load()
  void attemptAutoplay()
}

const copySource = async () => {
  if (!source.value.url) return

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(source.value.url)
      ElMessage.success('流地址已复制到剪贴板')
      return
    }
  } catch {
    // Clipboard may be unavailable in some environments.
  }

  ElMessage.success('已生成流地址预览')
}

const openRawLink = () => {
  if (!source.value.url) return
  window.open(source.value.url, '_blank', 'noopener,noreferrer')
}

const handleLoadedMetadata = () => {
  errorMessage.value = ''
  statusMessage.value = `${streamTypeLabel.value}已加载`
}

const handleCanPlay = () => {
  if (!errorMessage.value) {
    statusMessage.value = '直播流已就绪'
  }
}

const handleWaiting = () => {
  if (!errorMessage.value) {
    statusMessage.value = '网络波动，正在缓冲'
  }
}

const handleNativeError = () => {
  statusMessage.value = '视频播放失败'
  errorMessage.value = mapNativeError()
}

watch(
  () =>
    [source.value.kind, source.value.url, props.autoplay, props.muted] as const,
  () => {
    void mountStream()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  cleanupPlayers()
})
</script>

<style scoped lang="scss">
.stream-surface {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(255, 75, 106, 0.14), transparent 28%),
    radial-gradient(
      circle at bottom,
      rgba(35, 225, 202, 0.14),
      transparent 28%
    ),
    #060a12;
}

.stream-video,
.stream-placeholder,
.stream-state {
  width: 100%;
  height: 100%;
  min-height: 320px;
}

.stream-video {
  display: block;
  background: #04070d;
}

.stream-video.fit-cover {
  object-fit: cover;
}

.stream-video.fit-contain {
  object-fit: contain;
}

.stream-placeholder {
  display: block;
}

.stream-state {
  display: grid;
  align-content: center;
  gap: 12px;
  padding: 32px;
  color: #f7f9ff;
}

.stream-state-warning {
  background:
    linear-gradient(180deg, rgba(255, 91, 122, 0.18), rgba(5, 8, 14, 0.92)),
    #060a12;
}

.state-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 700;
}

.stream-state strong {
  font-size: 24px;
  line-height: 1.3;
}

.stream-state p {
  margin: 0;
  max-width: 520px;
  color: rgba(240, 243, 255, 0.72);
  line-height: 1.7;
}

.state-button,
.status-button {
  border: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.state-button {
  width: fit-content;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #ff5b7a, #ff8a5b);
}

.stream-status-bar {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(6, 10, 18, 0.72);
  color: #f6f8ff;
  backdrop-filter: blur(10px);
}

.status-copy {
  min-width: 0;
}

.status-copy span,
.status-copy strong {
  display: block;
}

.status-copy span {
  color: rgba(240, 243, 255, 0.7);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-copy strong {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
}

.status-button {
  flex: none;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 12px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .stream-status-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-button {
    width: 100%;
  }
}
</style>
