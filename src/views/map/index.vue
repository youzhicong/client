<template>
  <div class="map-page">
    <header class="map-header">
      <div class="title">
        <span class="title-mark">MAP</span>
        <div class="title-text">
          <h2>地图菜单</h2>
          <p>高德地图接入与定位展示</p>
        </div>
      </div>
      <div class="header-actions">
        <el-input
          v-model="keyword"
          size="small"
          placeholder="输入地点名称"
          class="search-input"
          clearable
          @keyup.enter="searchLocation"
        />
        <el-button
          size="small"
          type="primary"
          :loading="searchLoading"
          @click="searchLocation"
        >
          搜索
        </el-button>
        <span class="status" :class="{ ready: mapReady }">
          {{ statusText }}
        </span>
      </div>
    </header>

    <section class="map-body">
      <div class="map-wrapper">
        <div ref="mapRef" class="map-canvas"></div>
        <div v-if="errorText" class="map-overlay">
          <div class="overlay-card">
            <div class="overlay-title">地图未初始化</div>
            <div class="overlay-text">{{ errorText }}</div>
            <div class="overlay-tip">
              请在项目根目录的 `.env` 或 `.env.local` 配置 `VITE_AMAP_KEY`。
            </div>
          </div>
        </div>
      </div>

      <aside class="map-panel">
        <div class="panel-title">快捷地点</div>
        <div class="panel-list">
          <button
            v-for="spot in quickSpots"
            :key="spot.name"
            class="panel-item"
            type="button"
            @click="focusSpot(spot)"
          >
            <span class="spot-name">{{ spot.name }}</span>
            <span class="spot-desc">{{ spot.desc }}</span>
          </button>
        </div>
        <div class="panel-actions">
          <el-button size="small" @click="locateMe">定位到我</el-button>
          <el-button size="small" @click="resetMap">重置视图</el-button>
          <el-button
            size="small"
            :type="trafficEnabled ? 'success' : 'default'"
            @click="toggleTraffic"
          >
            实时路况
          </el-button>
        </div>
        <div v-if="searchResults.length" class="panel-results">
          <div class="panel-subtitle">搜索结果</div>
          <button
            v-for="item in searchResults"
            :key="item.id"
            class="panel-item panel-result"
            type="button"
            @click="selectSearchResult(item)"
          >
            <span class="spot-name">{{ item.name }}</span>
            <span class="spot-desc">{{ item.address }}</span>
          </button>
        </div>
        <div class="panel-footer">
          <div class="panel-label">当前地址</div>
          <div class="panel-value">{{ addressLabel }}</div>
          <div class="panel-meta">
            <span>缩放：{{ zoomLabel }}</span>
            <span>中心：{{ centerLabel }}</span>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Spot = {
  name: string
  desc: string
  center: [number, number]
  zoom: number
}

const mapRef = ref<HTMLDivElement | null>(null)
const mapInstance = ref<any>(null)
const markerInstance = ref<any>(null)
const geocoderInstance = ref<any>(null)
const geolocationInstance = ref<any>(null)
const placeSearchInstance = ref<any>(null)
const trafficLayer = ref<any>(null)
const mapReady = ref(false)
const statusText = ref('地图加载中')
const errorText = ref('')
const keyword = ref('')
const mapCenter = ref<[number, number] | null>(null)
const mapZoom = ref<number | null>(null)
const addressLabel = ref('暂无')
const trafficEnabled = ref(false)
const searchLoading = ref(false)
const searchResults = ref<
  { id: string; name: string; address: string; location: [number, number] }[]
>([])

const defaultCenter: [number, number] = [116.397428, 39.90923]
const defaultZoom = 11

const quickSpots: Spot[] = [
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
    desc: '珠江新城',
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

const apiKey = import.meta.env.VITE_AMAP_KEY as string | undefined
const securityCode =
  (import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined) || ''

const centerLabel = computed(() => {
  if (!mapCenter.value) return '暂无'
  return `${mapCenter.value[0].toFixed(4)}, ${mapCenter.value[1].toFixed(4)}`
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
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geocoder,AMap.PlaceSearch,AMap.Geolocation`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('load-failed'))
    document.head.appendChild(script)
  })

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
      viewMode: '2D'
    })
    bindMapEvents()
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
        pageSize: 6,
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

const searchLocation = async () => {
  const value = keyword.value.trim()
  if (!value || !mapInstance.value || !(window as any).AMap) return
  if (!mapReady.value) {
    statusText.value = '地图未就绪'
    return
  }
  searchLoading.value = true
  searchResults.value = []
  await ensurePlaceSearch()
  placeSearchInstance.value.search(
    value,
    async (status: string, result: any) => {
      const list = result?.poiList?.pois ?? []
      const normalized = list
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
        searchResults.value = normalized
        const first = normalized[0]
        focusPosition(first.location, 14)
        statusText.value = `已找到：${first.name}`
        addressLabel.value = first.address || first.name
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
            focusPosition(position, 14)
            statusText.value = `定位：${geoResult.geocodes[0].formattedAddress || value}`
            addressLabel.value = geoResult.geocodes[0].formattedAddress || value
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

const focusPosition = (center: [number, number], zoom: number) => {
  if (!mapInstance.value || !(window as any).AMap) return
  mapInstance.value.setZoomAndCenter(zoom, center)
  const amap = (window as any).AMap
  if (!markerInstance.value) {
    markerInstance.value = new amap.Marker({
      position: center,
      map: mapInstance.value
    })
  } else {
    markerInstance.value.setPosition(center)
  }
  updateMapState()
}

const handleMapClick = async (event: any) => {
  const position: [number, number] = [event.lnglat.lng, event.lnglat.lat]
  focusPosition(position, mapZoom.value ?? defaultZoom)
  const address = await resolveAddress(position)
  addressLabel.value = address || '未获取到地址'
  statusText.value = address ? '已更新地址' : '已更新坐标'
}

const focusSpot = (spot: Spot) => {
  focusPosition(spot.center, spot.zoom)
  statusText.value = `已切换到：${spot.name}`
}

const selectSearchResult = (item: {
  name: string
  address: string
  location: [number, number]
}) => {
  focusPosition(item.location, 15)
  statusText.value = `已切换到：${item.name}`
  addressLabel.value = item.address || item.name
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
        focusPosition(position, 15)
        addressLabel.value = result.formattedAddress || '已定位'
        statusText.value = '已定位到当前位置'
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
  } else {
    trafficLayer.value.setMap(mapInstance.value)
    trafficEnabled.value = true
  }
}

const resetMap = () => {
  focusPosition(defaultCenter, defaultZoom)
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
:root {
  --map-bg: #f5f7fb;
  --map-panel: #ffffff;
  --map-text: #0f172a;
  --map-muted: #64748b;
  --map-accent: #2563eb;
  --map-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  --map-border: #e2e8f0;
}

.map-page {
  min-height: calc(100vh - 60px);
  padding: 24px;
  background: radial-gradient(
    circle at top,
    #eef2ff 0%,
    #f8fafc 55%,
    #eef2ff 100%
  );
  font-family: 'IBM Plex Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--map-text);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  background: var(--map-panel);
  border-radius: 18px;
  box-shadow: var(--map-shadow);
  margin-bottom: 18px;
  gap: 20px;
}

.title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.title-mark {
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--map-accent);
}

.title-text h2 {
  margin: 0;
  font-size: 18px;
}

.title-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--map-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.search-input {
  width: 200px;
}

.status {
  font-size: 12px;
  color: var(--map-muted);
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
}

.status.ready {
  color: #16a34a;
  background: #dcfce7;
}

.map-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
}

.map-wrapper {
  position: relative;
  background: var(--map-panel);
  border-radius: 20px;
  border: 1px solid var(--map-border);
  overflow: hidden;
  box-shadow: var(--map-shadow);
  min-height: 560px;
}

.map-canvas {
  width: 100%;
  height: 100%;
  min-height: 560px;
}

.map-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
}

.overlay-card {
  background: #fff;
  padding: 18px 20px;
  border-radius: 16px;
  text-align: center;
  max-width: 320px;
  box-shadow: var(--map-shadow);
}

.overlay-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.overlay-text {
  font-size: 13px;
  color: var(--map-muted);
  margin-bottom: 6px;
}

.overlay-tip {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

.map-panel {
  background: var(--map-panel);
  border-radius: 20px;
  border: 1px solid var(--map-border);
  box-shadow: var(--map-shadow);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-subtitle {
  font-weight: 600;
  font-size: 13px;
  color: var(--map-text);
}

.panel-result {
  padding: 8px 10px;
}

.panel-item {
  text-align: left;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid transparent;
  background: #f8fafc;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease;
}

.panel-item:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  transform: translateY(-1px);
}

.spot-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.spot-desc {
  display: block;
  font-size: 12px;
  color: var(--map-muted);
  margin-top: 4px;
}

.panel-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--map-border);
  font-size: 12px;
  color: var(--map-muted);
}

.panel-label {
  font-weight: 600;
  color: var(--map-text);
  margin-bottom: 6px;
}

.panel-value {
  word-break: break-all;
}

.panel-meta {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 1024px) {
  .map-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .map-page {
    padding: 16px;
  }

  .map-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .search-input {
    width: 100%;
  }
}
</style>
