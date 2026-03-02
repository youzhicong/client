<template>
  <div class="map-page">
    <div class="bg-glow glow-a"></div>
    <div class="bg-glow glow-b"></div>

    <header class="map-hero panel">
      <div class="hero-left">
        <span class="hero-badge">SMART MAP</span>
        <h2>数字地图中控台</h2>
        <p>地点检索、实时定位、路况查看与坐标管理一体化操作。</p>
      </div>

      <div class="hero-right">
        <div class="search-line">
          <el-input
            v-model="keyword"
            size="large"
            clearable
            class="search-input"
            placeholder="输入地点 / 学校 / 商圈"
            @keyup.enter="searchLocation"
          />
          <el-button
            type="primary"
            size="large"
            :loading="searchLoading"
            @click="searchLocation"
          >
            搜索地点
          </el-button>
        </div>
        <div class="status-row">
          <span class="status-chip" :class="{ ready: mapReady }">{{
            statusText
          }}</span>
          <span class="meta-chip">缩放 {{ zoomLabel }}</span>
          <span class="meta-chip">中心 {{ centerLabel }}</span>
        </div>
      </div>
    </header>

    <section class="map-layout">
      <main class="map-stage panel">
        <div class="stage-toolbar">
          <div class="toolbar-label">地图样式</div>
          <el-select
            v-model="mapStyle"
            size="small"
            class="style-select"
            @change="applyMapStyle"
          >
            <el-option
              v-for="option in styleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button size="small" @click="locateMe">定位到我</el-button>
          <el-button size="small" @click="copyCenter">复制坐标</el-button>
          <el-button size="small" @click="resetMap">重置视图</el-button>
          <el-button
            size="small"
            :type="trafficEnabled ? 'success' : 'default'"
            @click="toggleTraffic"
          >
            {{ trafficEnabled ? '关闭路况' : '实时路况' }}
          </el-button>
        </div>

        <div ref="mapRef" class="map-canvas"></div>

        <div class="floating-card">
          <div class="float-title">当前地址</div>
          <div class="float-value">{{ addressLabel }}</div>
          <div class="float-meta">
            <span>缩放：{{ zoomLabel }}</span>
            <span>中心：{{ centerLabel }}</span>
          </div>
        </div>

        <div v-if="!mapReady && !errorText" class="map-loading">
          地图资源加载中...
        </div>

        <div v-if="errorText" class="map-overlay">
          <div class="overlay-card">
            <div class="overlay-title">地图未初始化</div>
            <div class="overlay-text">{{ errorText }}</div>
            <div class="overlay-tip">
              请在 `.env` 或 `.env.local` 配置 `VITE_AMAP_KEY`。
            </div>
          </div>
        </div>
      </main>

      <aside class="side-panel panel">
        <section class="side-block">
          <div class="block-head">
            <h3>快捷地点</h3>
            <span>{{ quickSpots.length }}</span>
          </div>
          <div class="spot-grid">
            <button
              v-for="spot in quickSpots"
              :key="spot.name"
              class="spot-card"
              type="button"
              @click="focusSpot(spot)"
            >
              <span class="spot-name">{{ spot.name }}</span>
              <span class="spot-desc">{{ spot.desc }}</span>
            </button>
          </div>
        </section>

        <section v-if="searchResults.length" class="side-block">
          <div class="block-head">
            <h3>搜索结果</h3>
            <span>{{ searchResults.length }}</span>
          </div>
          <div class="result-list">
            <button
              v-for="item in searchResults"
              :key="item.id"
              class="result-item"
              type="button"
              @click="selectSearchResult(item)"
            >
              <span class="spot-name">{{ item.name }}</span>
              <span class="spot-desc">{{ item.address }}</span>
            </button>
          </div>
        </section>

        <section class="side-block grow">
          <div class="block-head">
            <h3>最近访问</h3>
            <el-button
              link
              size="small"
              :disabled="!recentPoints.length"
              @click="clearRecent"
            >
              清空
            </el-button>
          </div>

          <div v-if="recentPoints.length" class="recent-list">
            <button
              v-for="item in recentPoints"
              :key="item.id"
              class="recent-item"
              type="button"
              @click="focusRecent(item)"
            >
              <span class="spot-name">{{ item.name }}</span>
              <span class="spot-desc">{{ item.address }}</span>
              <span class="recent-time">{{ item.time }}</span>
            </button>
          </div>

          <div v-else class="empty-block">
            点击地图或搜索地点后会自动记录到这里。
          </div>
        </section>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Spot = {
  name: string
  desc: string
  center: [number, number]
  zoom: number
}

type SearchResult = {
  id: string
  name: string
  address: string
  location: [number, number]
}

type RecentPoint = {
  id: string
  name: string
  address: string
  location: [number, number]
  time: string
}

const mapRef = ref<HTMLDivElement | null>(null)
const mapInstance = ref<any>(null)
const markerInstance = ref<any>(null)
const geocoderInstance = ref<any>(null)
const geolocationInstance = ref<any>(null)
const placeSearchInstance = ref<any>(null)
const trafficLayer = ref<any>(null)
const mapReady = ref(false)
const statusText = ref('地图资源准备中')
const errorText = ref('')
const keyword = ref('')
const mapCenter = ref<[number, number] | null>(null)
const mapZoom = ref<number | null>(null)
const addressLabel = ref('暂无')
const trafficEnabled = ref(false)
const searchLoading = ref(false)
const mapStyle = ref('amap://styles/whitesmoke')
const searchResults = ref<SearchResult[]>([])
const recentPoints = ref<RecentPoint[]>([])

const defaultCenter: [number, number] = [116.397428, 39.90923]
const defaultZoom = 11

const quickSpots: Spot[] = [
  {
    name: '鸡西站',
    desc: '鸡西市交通枢纽',
    center: [130.96979, 45.29177],
    zoom: 13
  },
  {
    name: '北京天安门',
    desc: '首都核心地标',
    center: [116.397428, 39.90923],
    zoom: 12
  },
  {
    name: '上海外滩',
    desc: '浦江风景带',
    center: [121.490317, 31.241701],
    zoom: 13
  },
  {
    name: '广州塔',
    desc: '珠江新城地标',
    center: [113.33052, 23.113242],
    zoom: 14
  },
  {
    name: '深圳市民中心',
    desc: '城市行政核心',
    center: [114.0604, 22.54862],
    zoom: 14
  }
]

const styleOptions = [
  { label: '浅色', value: 'amap://styles/whitesmoke' },
  { label: '标准', value: 'amap://styles/normal' },
  { label: '深蓝', value: 'amap://styles/darkblue' }
]

const apiKey = import.meta.env.VITE_AMAP_KEY as string | undefined
const securityCode =
  (import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined) || ''

const centerLabel = computed(() => {
  if (!mapCenter.value) return '暂无'
  return `${mapCenter.value[0].toFixed(5)}, ${mapCenter.value[1].toFixed(5)}`
})

const zoomLabel = computed(() => {
  if (mapZoom.value === null) return '-'
  return mapZoom.value.toString()
})

const loadAmap = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as any).AMap) {
      resolve()
      return
    }
    if (!apiKey) {
      reject(new Error('missing-key'))
      return
    }
    if (securityCode) {
      ;(window as any)._AMapSecurityConfig = { securityJsCode: securityCode }
    }
    const existing = document.getElementById(
      'amap-script'
    ) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('load-failed')))
      return
    }
    const script = document.createElement('script')
    script.id = 'amap-script'
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geocoder,AMap.PlaceSearch,AMap.Geolocation,AMap.ToolBar,AMap.Scale`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('load-failed'))
    document.head.appendChild(script)
  })

const mountMapControls = () => {
  if (!mapInstance.value || !(window as any).AMap) return
  const amap = (window as any).AMap
  amap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
    if (!mapInstance.value) return
    mapInstance.value.addControl(new amap.Scale())
    mapInstance.value.addControl(
      new amap.ToolBar({ position: { right: '14px', top: '72px' } })
    )
  })
}

const initMap = async () => {
  if (!apiKey) {
    statusText.value = '缺少高德 Key'
    errorText.value = '未检测到 VITE_AMAP_KEY'
    return
  }
  try {
    await loadAmap()
    if (!mapRef.value) return
    const amap = (window as any).AMap
    mapInstance.value = new amap.Map(mapRef.value, {
      zoom: defaultZoom,
      center: defaultCenter,
      resizeEnable: true,
      mapStyle: mapStyle.value,
      viewMode: '2D'
    })
    bindMapEvents()
    mountMapControls()
    updateMapState()
    mapReady.value = true
    statusText.value = '地图已加载'
  } catch {
    statusText.value = '地图加载失败'
    errorText.value = '高德地图脚本加载失败'
  }
}

const ensureGeocoder = () =>
  new Promise<void>((resolve) => {
    if (geocoderInstance.value) {
      resolve()
      return
    }
    const amap = (window as any).AMap
    amap.plugin('AMap.Geocoder', () => {
      geocoderInstance.value = new amap.Geocoder({ city: '全国' })
      resolve()
    })
  })

const ensurePlaceSearch = () =>
  new Promise<void>((resolve) => {
    if (placeSearchInstance.value) {
      resolve()
      return
    }
    const amap = (window as any).AMap
    amap.plugin('AMap.PlaceSearch', () => {
      placeSearchInstance.value = new amap.PlaceSearch({
        pageSize: 8,
        extensions: 'all',
        city: '全国',
        citylimit: false
      })
      resolve()
    })
  })

const ensureGeolocation = () =>
  new Promise<void>((resolve) => {
    if (geolocationInstance.value) {
      resolve()
      return
    }
    const amap = (window as any).AMap
    amap.plugin('AMap.Geolocation', () => {
      geolocationInstance.value = new amap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        zoomToAccuracy: true
      })
      resolve()
    })
  })

const updateMapState = () => {
  if (!mapInstance.value) return
  const center = mapInstance.value.getCenter()
  mapCenter.value = [center.lng, center.lat]
  mapZoom.value = mapInstance.value.getZoom()
}

const formatVisitTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

const pushRecentPoint = (
  name: string,
  address: string,
  location: [number, number]
) => {
  const id = `${location[0].toFixed(5)}-${location[1].toFixed(5)}`
  const newItem: RecentPoint = {
    id,
    name,
    address,
    location,
    time: formatVisitTime()
  }
  const deduped = recentPoints.value.filter((item) => item.id !== id)
  recentPoints.value = [newItem, ...deduped].slice(0, 8)
}

const resolveAddress = async (position: [number, number]) => {
  if (!mapInstance.value || !(window as any).AMap) return ''
  await ensureGeocoder()
  return new Promise<string>((resolve) => {
    geocoderInstance.value.getAddress(
      position,
      (status: string, result: any) => {
        if (status === 'complete' && result?.regeocode?.formattedAddress) {
          resolve(result.regeocode.formattedAddress)
        } else {
          resolve('')
        }
      }
    )
  })
}

const focusPosition = (center: [number, number], zoom: number) => {
  if (!mapInstance.value || !(window as any).AMap) return
  mapInstance.value.setZoomAndCenter(zoom, center)
  const amap = (window as any).AMap
  if (!markerInstance.value) {
    markerInstance.value = new amap.Marker({
      position: center,
      map: mapInstance.value,
      offset: new amap.Pixel(-10, -28)
    })
  } else {
    markerInstance.value.setPosition(center)
  }
  updateMapState()
}

const searchLocation = async () => {
  const value = keyword.value.trim()
  if (!value) {
    ElMessage.warning('请输入要搜索的地点')
    return
  }
  if (!mapInstance.value || !(window as any).AMap || searchLoading.value) return
  if (!mapReady.value) {
    statusText.value = '地图未就绪'
    return
  }

  searchLoading.value = true
  searchResults.value = []
  statusText.value = '正在检索地点...'
  await ensurePlaceSearch()

  placeSearchInstance.value.search(
    value,
    async (status: string, result: any) => {
      const list = result?.poiList?.pois ?? []
      const normalized: SearchResult[] = list
        .filter((item: any) => item?.location)
        .map((item: any) => ({
          id:
            item.id ||
            item.uid ||
            `${item.location?.lng}-${item.location?.lat}`,
          name: item.name,
          address: item.address || item.pname || value,
          location: [item.location.lng, item.location.lat]
        }))

      if (status === 'complete' && normalized.length) {
        const first = normalized[0]
        if (!first) {
          searchLoading.value = false
          statusText.value = '未找到匹配地点'
          return
        }
        searchResults.value = normalized
        focusPosition(first.location, 14)
        statusText.value = `已找到：${first.name}`
        addressLabel.value = first.address || first.name
        pushRecentPoint(first.name, first.address || first.name, first.location)
        searchLoading.value = false
        return
      }

      await ensureGeocoder()
      geocoderInstance.value.getLocation(
        value,
        (geoStatus: string, geoResult: any) => {
          searchLoading.value = false
          if (geoStatus === 'complete' && geoResult?.geocodes?.length) {
            const location = geoResult.geocodes[0].location
            const position: [number, number] = [location.lng, location.lat]
            const title = geoResult.geocodes[0].formattedAddress || value
            focusPosition(position, 14)
            statusText.value = `定位：${title}`
            addressLabel.value = title
            pushRecentPoint(value, title, position)
          } else {
            const info = geoResult?.info || result?.info
            statusText.value = info
              ? `未找到匹配地点：${info}`
              : '未找到匹配地点'
          }
        }
      )
    }
  )
}

const focusSpot = (spot: Spot) => {
  focusPosition(spot.center, spot.zoom)
  statusText.value = `已切换到：${spot.name}`
  addressLabel.value = spot.desc
  pushRecentPoint(spot.name, spot.desc, spot.center)
}

const selectSearchResult = (item: SearchResult) => {
  focusPosition(item.location, 15)
  statusText.value = `已切换到：${item.name}`
  addressLabel.value = item.address || item.name
  pushRecentPoint(item.name, item.address || item.name, item.location)
}

const focusRecent = (item: RecentPoint) => {
  focusPosition(item.location, 15)
  statusText.value = `已切换到：${item.name}`
  addressLabel.value = item.address
  pushRecentPoint(item.name, item.address, item.location)
}

const locateMe = async () => {
  if (!mapInstance.value || !(window as any).AMap) return
  await ensureGeolocation()
  geolocationInstance.value.getCurrentPosition(
    (status: string, result: any) => {
      if (status === 'complete' && result?.position) {
        const position: [number, number] = [
          result.position.lng,
          result.position.lat
        ]
        const title = result.formattedAddress || '已定位'
        focusPosition(position, 15)
        addressLabel.value = title
        statusText.value = '已定位到当前位置'
        pushRecentPoint('我的位置', title, position)
      } else {
        const message =
          result?.message || result?.info || '请检查浏览器定位权限'
        statusText.value = `定位失败：${message}`
      }
    }
  )
}

const toggleTraffic = () => {
  if (!mapInstance.value || !(window as any).AMap) return
  const amap = (window as any).AMap
  if (!trafficLayer.value) {
    trafficLayer.value = new amap.TileLayer.Traffic({ zIndex: 10 })
  }
  if (trafficEnabled.value) {
    trafficLayer.value.setMap(null)
    trafficEnabled.value = false
    statusText.value = '已关闭路况图层'
  } else {
    trafficLayer.value.setMap(mapInstance.value)
    trafficEnabled.value = true
    statusText.value = '已开启实时路况'
  }
}

const applyMapStyle = (style: string) => {
  if (!mapInstance.value) return
  mapInstance.value.setMapStyle(style)
  const target = styleOptions.find((item) => item.value === style)
  statusText.value = `地图样式：${target?.label || '已切换'}`
}

const clearRecent = () => {
  recentPoints.value = []
}

const copyCenter = async () => {
  if (!mapCenter.value) {
    ElMessage.warning('暂无可复制坐标')
    return
  }
  const text = `${mapCenter.value[0].toFixed(6)}, ${mapCenter.value[1].toFixed(6)}`
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('坐标已复制')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('坐标已复制')
  }
}

const handleMapClick = async (event: any) => {
  const position: [number, number] = [event.lnglat.lng, event.lnglat.lat]
  focusPosition(position, mapZoom.value ?? defaultZoom)
  const address = await resolveAddress(position)
  const title = address || '地图选点'
  addressLabel.value = address || '未获取到地址'
  statusText.value = address ? '已更新地址' : '已更新坐标'
  pushRecentPoint('地图选点', title, position)
}

const resetMap = () => {
  focusPosition(defaultCenter, defaultZoom)
  mapStyle.value = 'amap://styles/whitesmoke'
  applyMapStyle(mapStyle.value)
  addressLabel.value = '暂无'
  searchResults.value = []
  statusText.value = '已重置视图'
}

const bindMapEvents = () => {
  if (!mapInstance.value) return
  mapInstance.value.on('click', handleMapClick)
  mapInstance.value.on('moveend', updateMapState)
  mapInstance.value.on('zoomend', updateMapState)
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (trafficLayer.value) {
    trafficLayer.value.setMap(null)
    trafficLayer.value = null
  }

  if (markerInstance.value) {
    markerInstance.value.setMap(null)
    markerInstance.value = null
  }

  if (mapInstance.value) {
    mapInstance.value.off('click', handleMapClick)
    mapInstance.value.off('moveend', updateMapState)
    mapInstance.value.off('zoomend', updateMapState)
    mapInstance.value.destroy()
    mapInstance.value = null
  }
})
</script>

<style lang="scss" scoped>
.map-page {
  --map-bg: #edf4f6;
  --panel-bg: rgba(255, 255, 255, 0.84);
  --line: #d6e4e9;
  --text: #17363d;
  --muted: #64808a;
  --brand: #0f8f92;
  --brand-strong: #0d6f74;
  --shadow: 0 20px 42px rgba(23, 53, 62, 0.12);

  position: relative;
  min-height: calc(100vh - 60px);
  padding: 22px;
  overflow: hidden;
  color: var(--text);
  background:
    radial-gradient(circle at 8% 10%, #d8f0ee 0%, transparent 36%),
    radial-gradient(circle at 90% 6%, #ffe7d2 0%, transparent 30%),
    var(--map-bg);
  font-family: 'IBM Plex Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.bg-glow {
  position: absolute;
  z-index: 0;
  border-radius: 999px;
  filter: blur(30px);
  opacity: 0.4;
  pointer-events: none;
}

.glow-a {
  width: 280px;
  height: 280px;
  right: -90px;
  bottom: 120px;
  background: #bde7e6;
}

.glow-b {
  width: 220px;
  height: 220px;
  left: -80px;
  top: 160px;
  background: #e8d8ff;
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.map-hero {
  padding: 20px 24px;
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.hero-badge {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #0f8f92 0%, #2b6ed8 100%);
}

.hero-left h2 {
  margin: 12px 0 8px;
  font-size: 30px;
  line-height: 1.1;
}

.hero-left p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.hero-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.search-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip,
.meta-chip {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--line);
}

.status-chip {
  color: #b45309;
  background: #fff7ed;
  border-color: #fed7aa;
}

.status-chip.ready {
  color: #166534;
  background: #dcfce7;
  border-color: #86efac;
}

.meta-chip {
  color: var(--muted);
  background: #f8fbfb;
}

.map-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
}

.map-stage {
  min-height: 620px;
  overflow: hidden;
}

.stage-toolbar {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.66);
}

.toolbar-label {
  font-size: 12px;
  color: var(--muted);
}

.style-select {
  width: 132px;
}

.map-canvas {
  width: 100%;
  height: 620px;
}

.floating-card {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 3;
  width: 360px;
  max-width: calc(100% - 28px);
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(10, 30, 44, 0.75);
  color: #ecf5f7;
  backdrop-filter: blur(8px);
}

.float-title {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: #9dd4dd;
}

.float-value {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.45;
}

.float-meta {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 11px;
  color: #c5dfe4;
}

.map-loading,
.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
}

.map-loading {
  background: rgba(255, 255, 255, 0.66);
  font-size: 14px;
  color: var(--brand-strong);
}

.map-overlay {
  background: rgba(14, 28, 40, 0.5);
  padding: 16px;
}

.overlay-card {
  max-width: 340px;
  text-align: center;
  border-radius: 16px;
  padding: 18px;
  background: #fff;
}

.overlay-title {
  font-weight: 700;
  margin-bottom: 8px;
}

.overlay-text {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.overlay-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #334155;
}

.side-panel {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 620px;
}

.side-block {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
}

.side-block.grow {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.block-head h3 {
  margin: 0;
  font-size: 14px;
}

.block-head span {
  font-size: 12px;
  color: var(--muted);
}

.spot-grid,
.result-list,
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spot-card,
.result-item,
.recent-item {
  border: 1px solid transparent;
  border-radius: 12px;
  background: #f7fbfc;
  text-align: left;
  cursor: pointer;
  padding: 10px;
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease;
}

.spot-card:hover,
.result-item:hover,
.recent-item:hover {
  border-color: #b9dde1;
  background: #ecf8fa;
  transform: translateY(-1px);
}

.spot-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.spot-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.recent-time {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #7f9aa3;
}

.empty-block {
  margin-top: 8px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 1260px) {
  .map-hero {
    grid-template-columns: 1fr;
  }

  .map-layout {
    grid-template-columns: 1fr;
  }

  .side-panel {
    min-height: auto;
  }
}

@media (max-width: 760px) {
  .map-page {
    padding: 14px;
  }

  .hero-left h2 {
    font-size: 24px;
  }

  .search-line {
    grid-template-columns: 1fr;
  }

  .stage-toolbar {
    position: static;
    margin: 10px;
    margin-bottom: 0;
  }

  .map-canvas {
    height: 520px;
  }

  .floating-card {
    width: calc(100% - 28px);
  }
}
</style>
