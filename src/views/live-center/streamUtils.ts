export type StreamKind =
  | 'empty'
  | 'mock'
  | 'hls'
  | 'flv'
  | 'native'
  | 'unsupported'

export interface ResolvedStreamSource {
  raw: string
  url: string
  kind: StreamKind
  reason: string
}

const HTTP_URL_RE = /^https?:\/\//iu
const MOCK_URL_RE = /^mock:\/\/[\w-]+$/iu

export const normalizeStreamUrl = (value: string | null | undefined) => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (MOCK_URL_RE.test(trimmed)) return trimmed
  return HTTP_URL_RE.test(trimmed) ? trimmed : ''
}

export const getStreamKindLabel = (kind: StreamKind) => {
  if (kind === 'mock') return '模拟直播流'
  if (kind === 'hls') return 'HLS 直播流'
  if (kind === 'flv') return 'FLV 直播流'
  if (kind === 'native') return '视频直链'
  if (kind === 'unsupported') return '非直链地址'
  return '待接入'
}

export const getUnsupportedStreamMessage = () =>
  '当前地址不是可直接播放的 m3u8、flv、mp4 直链，网页链接无法直接嵌入视频区。'

export const resolveStreamSource = (
  value: string | null | undefined
): ResolvedStreamSource => {
  const url = normalizeStreamUrl(value)
  if (!url) {
    return {
      raw: '',
      url: '',
      kind: 'empty',
      reason: '尚未接入直播流'
    }
  }

  if (MOCK_URL_RE.test(url)) {
    return {
      raw: url,
      url,
      kind: 'mock',
      reason: '已切换到本地模拟直播流'
    }
  }

  if (/(?:\.|\/)m3u8(?:$|[?#])/iu.test(url) || /m3u8(?:$|[?#])/iu.test(url)) {
    return {
      raw: url,
      url,
      kind: 'hls',
      reason: '已识别为 HLS 直播流'
    }
  }

  if (/(?:\.|\/)flv(?:$|[?#])/iu.test(url) || /flv(?:$|[?#])/iu.test(url)) {
    return {
      raw: url,
      url,
      kind: 'flv',
      reason: '已识别为 FLV 直播流'
    }
  }

  if (/\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/iu.test(url)) {
    return {
      raw: url,
      url,
      kind: 'native',
      reason: '已识别为视频直链'
    }
  }

  return {
    raw: url,
    url,
    kind: 'unsupported',
    reason: getUnsupportedStreamMessage()
  }
}
