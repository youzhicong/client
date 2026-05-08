<template>
  <div class="campus-container" :class="{ 'is-night': isNight }">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <el-icon :size="28"><OfficeBuilding /></el-icon>
          </div>
          <div class="header-text">
            <h1 class="page-title">校园全景</h1>
            <p class="page-subtitle">紫金港数字校园导览</p>
          </div>
        </div>

        <div class="header-actions">
          <div class="header-badge">Cesium 实景引擎</div>
          <el-button :icon="Refresh" circle @click="resetCamera" />
          <el-button :icon="FullScreen" circle @click="toggleFullscreen" />
        </div>
      </div>
    </div>

    <div ref="sceneWrapperRef" class="scene-wrapper">
      <div class="scene-card">
        <div ref="cesiumContainerRef" class="viewer-container"></div>

        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在加载 Cesium 校园场景...</p>
        </div>

        <div v-if="showWeather" class="weather-overlay" aria-hidden="true">
          <span
            v-for="item in weatherClouds"
            :key="item.id"
            class="cloud"
            :style="item.style"
          ></span>
        </div>

        <transition name="fade">
          <div v-if="selectedBuilding" class="building-info-card">
            <div class="info-header">
              <span class="info-icon">{{
                getBuildingEmoji(selectedBuilding.type)
              }}</span>
              <span class="info-name">{{ selectedBuilding.name }}</span>
            </div>

            <div class="info-body">
              <div class="info-row">
                <span class="info-label">类型</span>
                <span class="info-value">{{ selectedBuilding.type }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">楼层</span>
                <span class="info-value">{{ selectedBuilding.floors }} 层</span>
              </div>
              <div class="info-row">
                <span class="info-label">容纳</span>
                <span class="info-value"
                  >{{ selectedBuilding.capacity }} 人</span
                >
              </div>
              <div class="info-row">
                <span class="info-label">状态</span>
                <span class="info-value">{{ selectedBuilding.status }}</span>
              </div>
              <div class="info-desc">{{ selectedBuilding.desc }}</div>
            </div>

            <el-button size="small" type="primary" @click="clearSelection"
              >关闭</el-button
            >
          </div>
        </transition>

        <div class="legend-card">
          <div class="legend-title">场景图层</div>
          <div class="legend-items">
            <span><i class="legend-dot imagery"></i> 实景影像</span>
            <span><i class="legend-dot building"></i> OSM 建筑</span>
            <span><i class="legend-dot route"></i> 导览路线</span>
          </div>
        </div>

        <div class="control-panel">
          <div
            class="control-item"
            :class="{ active: autoRotate }"
            @click="toggleAutoRotate"
          >
            <el-icon><RefreshRight /></el-icon>
            <span>自动旋转</span>
          </div>
          <div
            class="control-item"
            :class="{ active: isNight }"
            @click="toggleNightMode"
          >
            <el-icon><MoonNight /></el-icon>
            <span>{{ isNight ? '日间' : '夜间' }}</span>
          </div>
          <div
            class="control-item"
            :class="{ active: showWeather }"
            @click="toggleWeather"
          >
            <el-icon><Cloudy /></el-icon>
            <span>{{ showWeather ? '关闭天气' : '天气' }}</span>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-item">
            <span class="stat-value">{{ buildings.length }}</span>
            <span class="stat-label">建筑物</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ totalCapacity }}</span>
            <span class="stat-label">总容量</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ routes.length }}</span>
            <span class="stat-label">导览路线</span>
          </div>
        </div>
      </div>

      <div class="building-list">
        <div class="list-header">
          <h3 class="list-title">
            <el-icon><OfficeBuilding /></el-icon>
            校园建筑
          </h3>
          <p class="list-copy">
            用 Cesium 重建成更接近实景三维的校园导览视角。
          </p>
        </div>

        <div class="route-panel">
          <div class="route-title">导览路线</div>
          <div class="route-list">
            <button
              v-for="route in routes"
              :key="route.id"
              type="button"
              class="route-item"
              :class="{ active: activeRouteId === route.id }"
              @click="focusRoute(route.id)"
            >
              <span class="route-name">{{ route.name }}</span>
              <span class="route-copy">{{ route.copy }}</span>
            </button>
          </div>
        </div>

        <div class="list-content">
          <button
            v-for="building in buildings"
            :key="building.id"
            type="button"
            class="building-item"
            :class="{ active: selectedBuilding?.id === building.id }"
            @click="focusBuilding(building)"
          >
            <div
              class="building-icon"
              :style="{ background: building.badgeColor }"
            >
              {{ building.short }}
            </div>
            <div class="building-info">
              <span class="building-name">{{ building.name }}</span>
              <span class="building-type">{{ building.type }}</span>
            </div>
            <div class="building-meta">
              <span>{{ building.floors }}F</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  ArcGisMapServerImageryProvider,
  Cartesian2,
  Cartesian3,
  Cesium3DTileStyle,
  Color,
  Entity,
  ImageryLayer,
  JulianDate,
  Math as CesiumMath,
  PolygonHierarchy,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  ShadowMode,
  Viewer,
  createOsmBuildingsAsync
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {
  Cloudy,
  FullScreen,
  MoonNight,
  OfficeBuilding,
  Refresh,
  RefreshRight
} from '@element-plus/icons-vue'

type OffsetPoint = [number, number]

type CampusBuilding = {
  id: string
  short: string
  name: string
  type: string
  floors: number
  capacity: number
  status: string
  desc: string
  badgeColor: string
  fillColor: string
  footprint: OffsetPoint[]
}

type CampusRoute = {
  id: string
  name: string
  copy: string
  points: OffsetPoint[]
}

const cesiumContainerRef = ref<HTMLElement | null>(null)
const sceneWrapperRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const selectedBuilding = ref<CampusBuilding | null>(null)
const autoRotate = ref(false)
const isNight = ref(false)
const showWeather = ref(false)
const activeRouteId = ref('')

const campusCenter = {
  lon: 120.0825,
  lat: 30.3036
}

const defaultCamera = {
  lon: 120.0825,
  lat: 30.3036,
  height: 720,
  heading: CesiumMath.toRadians(24),
  pitch: CesiumMath.toRadians(-56),
  roll: 0
}

const buildings = ref<CampusBuilding[]>([
  {
    id: 'library',
    short: '图',
    name: '图书馆',
    type: '公共设施',
    floors: 6,
    capacity: 3200,
    status: '运行正常',
    desc: '校园知识中枢，提供阅览、研讨、数字资源检索与跨楼层自助服务。',
    badgeColor: '#f3ead6',
    fillColor: '#f1ead8',
    footprint: [
      [-24, -50],
      [24, -50],
      [24, -34],
      [10, -34],
      [10, -18],
      [-10, -18],
      [-10, -34],
      [-24, -34]
    ]
  },
  {
    id: 'admin',
    short: '行',
    name: '行政楼',
    type: '行政',
    floors: 4,
    capacity: 260,
    status: '运行正常',
    desc: '负责教务、校务协同与公共事务办理，是日常运营调度中心。',
    badgeColor: '#dfd8cb',
    fillColor: '#d8d2c8',
    footprint: [
      [-84, -42],
      [-52, -42],
      [-50, -24],
      [-62, -20],
      [-84, -24]
    ]
  },
  {
    id: 'east-a',
    short: '东一',
    name: '东一教',
    type: '教学楼',
    floors: 5,
    capacity: 2000,
    status: '课程高峰',
    desc: '以大课与智慧教室为主，支持课堂录播和实验投屏。',
    badgeColor: '#ece4d1',
    fillColor: '#e6decb',
    footprint: [
      [70, 8],
      [102, 8],
      [102, 28],
      [88, 28],
      [88, 34],
      [70, 34]
    ]
  },
  {
    id: 'east-b',
    short: '东二',
    name: '东二教',
    type: '教学楼',
    floors: 4,
    capacity: 1500,
    status: '运行正常',
    desc: '包含语音教室与小班讨论区，是教学区高频使用楼栋。',
    badgeColor: '#e6ddcd',
    fillColor: '#dfd6c7',
    footprint: [
      [76, -44],
      [104, -44],
      [104, -28],
      [92, -24],
      [76, -28]
    ]
  },
  {
    id: 'east-c',
    short: '东三',
    name: '东三教',
    type: '教学楼',
    floors: 6,
    capacity: 1200,
    status: '运行正常',
    desc: '高层教学楼，适合学术交流、论坛路演和研讨课程。',
    badgeColor: '#efe5d2',
    fillColor: '#e6dcc8',
    footprint: [
      [120, -16],
      [142, -16],
      [144, 8],
      [134, 14],
      [120, 8]
    ]
  },
  {
    id: 'science',
    short: '理',
    name: '理学院',
    type: '科研楼',
    floors: 5,
    capacity: 980,
    status: '运行正常',
    desc: '集中了实验室、教师办公室与跨学院科研协同空间。',
    badgeColor: '#ddd9cf',
    fillColor: '#d6d2c8',
    footprint: [
      [-130, 12],
      [-94, 12],
      [-94, 26],
      [-108, 34],
      [-130, 28]
    ]
  },
  {
    id: 'lab-center',
    short: '实',
    name: '实验中心',
    type: '科研楼',
    floors: 5,
    capacity: 860,
    status: '设备运行中',
    desc: '承接综合实验、创新工坊与跨学院项目协同，是科研教学混合节点。',
    badgeColor: '#dad7d0',
    fillColor: '#d2cfc9',
    footprint: [
      [-100, 46],
      [-70, 46],
      [-66, 60],
      [-76, 70],
      [-98, 66]
    ]
  },
  {
    id: 'art',
    short: '艺',
    name: '艺术中心',
    type: '公共设施',
    floors: 3,
    capacity: 600,
    status: '活动中',
    desc: '承载展演、社团活动与校园开放日，是场景感最强的展示区。',
    badgeColor: '#e3d8cf',
    fillColor: '#ddd3ca',
    footprint: [
      [36, 76],
      [72, 76],
      [70, 98],
      [48, 104],
      [36, 92]
    ]
  },
  {
    id: 'gym',
    short: '体',
    name: '体育馆',
    type: '公共设施',
    floors: 3,
    capacity: 1800,
    status: '晚间开放',
    desc: '支持球类、活动集会与赛事直播，是大型活动常用节点。',
    badgeColor: '#dad5cf',
    fillColor: '#d4cfc8',
    footprint: [
      [-66, 92],
      [-26, 92],
      [-20, 106],
      [-30, 120],
      [-58, 120]
    ]
  },
  {
    id: 'dorm-a',
    short: '宿A',
    name: '宿舍A',
    type: '宿舍',
    floors: 7,
    capacity: 840,
    status: '入住稳定',
    desc: '靠近体育区的学生宿舍组团，配有洗衣房、自习间和门禁系统。',
    badgeColor: '#e7dece',
    fillColor: '#e0d7c7',
    footprint: [
      [-30, 110],
      [10, 110],
      [10, 126],
      [-30, 126]
    ]
  },
  {
    id: 'dorm-b',
    short: '宿B',
    name: '宿舍B',
    type: '宿舍',
    floors: 7,
    capacity: 780,
    status: '入住稳定',
    desc: '位于北侧生活区，连接食堂与慢行通道，晚间照明覆盖完善。',
    badgeColor: '#e9e0d1',
    fillColor: '#e2d9ca',
    footprint: [
      [20, 114],
      [58, 114],
      [58, 130],
      [20, 130]
    ]
  },
  {
    id: 'canteen',
    short: '食',
    name: '食堂',
    type: '生活设施',
    floors: 3,
    capacity: 1400,
    status: '午高峰',
    desc: '覆盖快餐、自选和轻食档口，是北侧生活区的人流中心。',
    badgeColor: '#e4dbcb',
    fillColor: '#ddd4c5',
    footprint: [
      [66, 106],
      [98, 106],
      [102, 122],
      [90, 130],
      [66, 124]
    ]
  }
])

const routes = ref<CampusRoute[]>([
  {
    id: 'south-library',
    name: '南门到图书馆',
    copy: '访客最常用的主入口路线',
    points: [
      [0, 144],
      [0, 98],
      [0, 48],
      [0, 12],
      [0, -36]
    ]
  },
  {
    id: 'lake-loop',
    name: '启真湖慢行环线',
    copy: '适合展示校园景观与导览动线',
    points: [
      [-24, 10],
      [-6, 42],
      [22, 44],
      [48, 22],
      [36, -8],
      [8, -18],
      [-18, -8],
      [-24, 10]
    ]
  },
  {
    id: 'teaching-tour',
    name: '东区教学楼巡航',
    copy: '围绕东一教、东二教、东三教快速浏览',
    points: [
      [32, 18],
      [86, 18],
      [90, -36],
      [132, -4]
    ]
  }
])

const weatherClouds = [
  { id: 1, style: { left: '10%', top: '16%', animationDelay: '0s' } },
  { id: 2, style: { left: '34%', top: '11%', animationDelay: '2.2s' } },
  { id: 3, style: { left: '68%', top: '18%', animationDelay: '4.3s' } },
  { id: 4, style: { left: '54%', top: '32%', animationDelay: '1.1s' } }
]

const totalCapacity = computed(() =>
  buildings.value.reduce((sum, building) => sum + building.capacity, 0)
)

let viewer: Viewer | null = null
let clickHandler: ScreenSpaceEventHandler | null = null
let rotateFrame = 0
let osmBuildings: Awaited<ReturnType<typeof createOsmBuildingsAsync>> | null =
  null
const buildingEntityMap = new Map<string, Entity>()
const routeEntityMap = new Map<string, Entity>()

const metersToLng = (meters: number) => {
  return meters / (111320 * Math.cos((campusCenter.lat * Math.PI) / 180))
}

const metersToLat = (meters: number) => {
  return meters / 110540
}

const offsetToLonLat = (point: OffsetPoint) => {
  return {
    lon: campusCenter.lon + metersToLng(point[0]),
    lat: campusCenter.lat + metersToLat(point[1])
  }
}

const offsetsToCartesian = (points: OffsetPoint[]) => {
  const degrees: number[] = []
  points.forEach((point) => {
    const { lon, lat } = offsetToLonLat(point)
    degrees.push(lon, lat)
  })
  return Cartesian3.fromDegreesArray(degrees)
}

const getPolygonCenter = (points: OffsetPoint[]) => {
  const sum = points.reduce(
    (acc, point) => {
      acc.x += point[0]
      acc.y += point[1]
      return acc
    },
    { x: 0, y: 0 }
  )

  return offsetToLonLat([sum.x / points.length, sum.y / points.length])
}

const getBuildingHeight = (building: CampusBuilding) => {
  return building.floors * 4.6
}

const getBuildingEmoji = (type: string) => {
  if (type.includes('教学')) return '🏫'
  if (type.includes('科研')) return '🔬'
  if (type.includes('行政')) return '🏢'
  if (type.includes('宿舍')) return '🏠'
  return '🏛️'
}

const setSceneTime = () => {
  if (!viewer) return

  viewer.clock.currentTime = JulianDate.fromDate(
    new Date(
      isNight.value ? '2026-05-07T19:20:00+08:00' : '2026-05-07T16:48:00+08:00'
    )
  )

  const imageryLayer = viewer.imageryLayers.get(0)
  if (imageryLayer) {
    imageryLayer.brightness = isNight.value ? 0.42 : 0.96
    imageryLayer.contrast = isNight.value ? 1.08 : 1.02
    imageryLayer.saturation = isNight.value ? 0.62 : 0.92
    imageryLayer.gamma = isNight.value ? 1.02 : 1
  }

  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.brightnessShift = isNight.value ? -0.22 : -0.02
    viewer.scene.skyAtmosphere.saturationShift = isNight.value ? -0.18 : -0.02
    viewer.scene.skyAtmosphere.hueShift = isNight.value ? 0.02 : -0.01
  }
  viewer.scene.fog.density = isNight.value ? 0.00095 : 0.00035
  viewer.scene.fog.minimumBrightness = isNight.value ? 0.08 : 0.62
}

const getBuildingMaterial = (building: CampusBuilding, active: boolean) => {
  if (active) {
    return Color.fromCssColorString('#69d7ff').withAlpha(
      isNight.value ? 0.18 : 0.12
    )
  }

  return Color.WHITE.withAlpha(0.001)
}

const rebuildBuildingEntities = () => {
  if (!viewer) return

  buildingEntityMap.forEach((entity) => {
    viewer?.entities.remove(entity)
  })
  buildingEntityMap.clear()

  buildings.value.forEach((building) => {
    const center = getPolygonCenter(building.footprint)
    const entity = viewer!.entities.add({
      id: `building-${building.id}`,
      name: building.name,
      position: Cartesian3.fromDegrees(
        center.lon,
        center.lat,
        getBuildingHeight(building) + 16
      ),
      polygon: {
        hierarchy: new PolygonHierarchy(offsetsToCartesian(building.footprint)),
        height: 0,
        extrudedHeight: getBuildingHeight(building),
        material: getBuildingMaterial(
          building,
          selectedBuilding.value?.id === building.id
        ),
        outline: selectedBuilding.value?.id === building.id,
        outlineColor: Color.fromCssColorString('#89e4ff').withAlpha(
          isNight.value ? 0.82 : 0.66
        ),
        shadows: ShadowMode.ENABLED
      }
    })

    buildingEntityMap.set(building.id, entity)
  })
}

const rebuildRouteEntities = () => {
  if (!viewer) return

  routeEntityMap.forEach((entity) => viewer?.entities.remove(entity))
  routeEntityMap.clear()

  routes.value.forEach((route) => {
    const degrees: number[] = []
    route.points.forEach((point) => {
      const { lon, lat } = offsetToLonLat(point)
      degrees.push(lon, lat)
    })

    const active = route.id === activeRouteId.value
    const entity = viewer!.entities.add({
      id: `route-${route.id}`,
      polyline: {
        positions: Cartesian3.fromDegreesArray(degrees),
        width: active ? 2.5 : 1,
        clampToGround: false,
        material: active
          ? Color.fromCssColorString('#5fd7ff').withAlpha(0.72)
          : Color.fromCssColorString('#d8f7ff').withAlpha(0.025),
        shadows: ShadowMode.DISABLED
      }
    })

    routeEntityMap.set(route.id, entity)
  })
}

const buildContextEntities = () => {
  return
}

const flyToDefault = () => {
  if (!viewer) return

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(
      defaultCamera.lon,
      defaultCamera.lat,
      defaultCamera.height
    ),
    orientation: {
      heading: defaultCamera.heading,
      pitch: defaultCamera.pitch,
      roll: defaultCamera.roll
    },
    duration: 1.2
  })
}

const spinCamera = () => {
  cancelAnimationFrame(rotateFrame)
  if (!viewer || !autoRotate.value) return

  viewer.camera.rotateRight(0.0015)
  rotateFrame = requestAnimationFrame(spinCamera)
}

const clearSelection = () => {
  selectedBuilding.value = null
  rebuildBuildingEntities()
}

const focusBuilding = (building: CampusBuilding) => {
  selectedBuilding.value = building
  autoRotate.value = false
  cancelAnimationFrame(rotateFrame)
  rebuildRouteEntities()
  rebuildBuildingEntities()

  const center = getPolygonCenter(building.footprint)
  viewer?.camera.flyTo({
    destination: Cartesian3.fromDegrees(center.lon, center.lat, 150),
    orientation: {
      heading: CesiumMath.toRadians(20),
      pitch: CesiumMath.toRadians(-34),
      roll: 0
    },
    duration: 1.1
  })
}

const focusRoute = (routeId: string) => {
  activeRouteId.value = routeId
  selectedBuilding.value = null
  autoRotate.value = false
  cancelAnimationFrame(rotateFrame)
  rebuildRouteEntities()
  rebuildBuildingEntities()

  const route = routes.value.find((item) => item.id === routeId)
  if (!route || !viewer) return

  const converted = route.points.map(offsetToLonLat)
  const lons = converted.map((item) => item.lon)
  const lats = converted.map((item) => item.lat)
  const rectangle = Rectangle.fromDegrees(
    Math.min(...lons) - 0.00045,
    Math.min(...lats) - 0.00035,
    Math.max(...lons) + 0.00045,
    Math.max(...lats) + 0.00035
  )

  viewer.camera.flyTo({
    destination: rectangle,
    orientation: {
      heading: CesiumMath.toRadians(24),
      pitch: CesiumMath.toRadians(-60),
      roll: 0
    },
    duration: 1.2
  })
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value
  spinCamera()
}

const toggleNightMode = () => {
  isNight.value = !isNight.value
  setSceneTime()
  rebuildBuildingEntities()
  rebuildRouteEntities()
}

const toggleWeather = () => {
  showWeather.value = !showWeather.value
}

const resetCamera = () => {
  clearSelection()
  activeRouteId.value = ''
  autoRotate.value = false
  cancelAnimationFrame(rotateFrame)
  rebuildRouteEntities()
  flyToDefault()
}

const toggleFullscreen = () => {
  const target = sceneWrapperRef.value
  if (!target) return

  if (document.fullscreenElement) {
    void document.exitFullscreen()
    return
  }

  void target.requestFullscreen()
}

const registerClickHandler = () => {
  if (!viewer) return

  clickHandler?.destroy()
  clickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((event: { position: Cartesian2 }) => {
    const picked = viewer?.scene.pick(event.position)
    const entity = picked?.id as Entity | undefined
    const id = typeof entity?.id === 'string' ? entity.id : ''

    if (!id.startsWith('building-')) return

    const building = buildings.value.find(
      (item) => `building-${item.id}` === id
    )
    if (building) {
      focusBuilding(building)
    }
  }, ScreenSpaceEventType.LEFT_CLICK)
}

const initViewer = async () => {
  if (!cesiumContainerRef.value) return

  const imageryProvider = await ArcGisMapServerImageryProvider.fromUrl(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
  )

  viewer = new Viewer(cesiumContainerRef.value, {
    baseLayer: new ImageryLayer(imageryProvider),
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    infoBox: false,
    selectionIndicator: false,
    fullscreenButton: false,
    projectionPicker: false,
    shadows: true,
    terrainShadows: ShadowMode.DISABLED,
    requestRenderMode: false,
    useBrowserRecommendedResolution: true,
    msaaSamples: 4
  })

  viewer.scene.globe.depthTestAgainstTerrain = false
  viewer.scene.globe.enableLighting = true
  viewer.scene.globe.showGroundAtmosphere = true
  viewer.scene.screenSpaceCameraController.maximumTiltAngle =
    CesiumMath.toRadians(88)
  viewer.scene.postProcessStages.fxaa.enabled = true
  viewer.scene.highDynamicRange = true
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = true
  }
  viewer.scene.fog.enabled = true
  ;(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'

  buildContextEntities()
  rebuildBuildingEntities()
  rebuildRouteEntities()
  registerClickHandler()
  setSceneTime()
  flyToDefault()

  try {
    osmBuildings = await createOsmBuildingsAsync({
      defaultColor: Color.fromCssColorString('#d8d4cb').withAlpha(0.68),
      enableShowOutline: false,
      showOutline: false
    })
    osmBuildings.style = new Cesium3DTileStyle({
      color: "color('rgb(214, 208, 198)', 0.72)"
    })
    viewer.scene.primitives.add(osmBuildings)
  } catch (error) {
    console.warn('OSM buildings failed to load', error)
  }

  loading.value = false
}

onMounted(async () => {
  await nextTick()
  await initViewer()
})

onUnmounted(() => {
  cancelAnimationFrame(rotateFrame)
  clickHandler?.destroy()
  clickHandler = null
  viewer?.destroy()
  viewer = null
  osmBuildings = null
})
</script>

<style scoped lang="scss">
.campus-container {
  min-height: 100%;
  padding: 0;
  color: #eef5ff;
  background:
    radial-gradient(
      circle at top left,
      rgba(111, 191, 255, 0.12),
      transparent 24%
    ),
    linear-gradient(180deg, #060914 0%, #090d18 100%);
}

.page-header {
  position: absolute;
  top: 24px;
  left: 24px;
  right: 24px;
  z-index: 14;
  pointer-events: none;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(4, 13, 22, 0.72),
    rgba(9, 18, 31, 0.38)
  );
  backdrop-filter: blur(20px);
  pointer-events: auto;
}

.header-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #dff6ff;
  background: linear-gradient(
    135deg,
    rgba(34, 204, 255, 0.92),
    rgba(17, 114, 175, 0.92)
  );
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
}

.page-title {
  margin: 0;
  font-size: 34px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.1;
  text-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
}

.page-subtitle {
  margin: 6px 0 0;
  max-width: 540px;
  color: rgba(223, 240, 255, 0.78);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(7, 15, 29, 0.44);
  backdrop-filter: blur(18px);
  pointer-events: auto;
}

.header-badge {
  padding: 7px 12px;
  border: 1px solid rgba(75, 204, 255, 0.18);
  border-radius: 999px;
  color: rgba(197, 240, 255, 0.92);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(13, 187, 234, 0.1);
}

.scene-wrapper {
  position: relative;
  display: block;
  min-height: 100vh;
}

.scene-card,
.building-list {
  position: relative;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.scene-card {
  min-height: 100vh;
}

.viewer-container {
  height: 100vh;
  min-height: 760px;
  filter: saturate(0.92) contrast(1.02) brightness(0.98);
}

:deep(.cesium-widget),
:deep(.cesium-widget canvas) {
  border-radius: 0;
}

:deep(.cesium-viewer-toolbar),
:deep(.cesium-viewer-animationContainer),
:deep(.cesium-viewer-timelineContainer),
:deep(.cesium-viewer-bottom) {
  display: none !important;
}

.loading-overlay,
.weather-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.loading-overlay {
  z-index: 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: linear-gradient(
    180deg,
    rgba(11, 19, 35, 0.46),
    rgba(11, 19, 35, 0.78)
  );
  backdrop-filter: blur(6px);
}

.loading-spinner {
  width: 54px;
  height: 54px;
  border: 3px solid rgba(138, 227, 255, 0.2);
  border-top-color: #25d3ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin: 0;
  color: rgba(235, 246, 255, 0.82);
}

.scene-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(
      180deg,
      rgba(3, 8, 15, 0.68) 0%,
      rgba(3, 8, 15, 0.18) 18%,
      rgba(3, 8, 15, 0) 36%
    ),
    linear-gradient(
      0deg,
      rgba(3, 8, 15, 0.78) 0%,
      rgba(3, 8, 15, 0.08) 24%,
      rgba(3, 8, 15, 0) 42%
    );
}

.building-info-card,
.legend-card,
.control-panel,
.stats-panel {
  position: absolute;
  z-index: 10;
}

.building-info-card {
  top: 132px;
  left: 24px;
  width: 320px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: rgba(5, 14, 24, 0.56);
  backdrop-filter: blur(22px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 600;
}

.info-body {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(106, 142, 191, 0.18);
  font-size: 14px;
}

.info-label {
  color: rgba(213, 231, 255, 0.62);
}

.info-value {
  color: #68e7ff;
}

.info-desc {
  color: rgba(236, 244, 255, 0.76);
  line-height: 1.7;
  font-size: 14px;
}

.legend-card {
  top: 124px;
  right: 24px;
  min-width: 208px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(5, 14, 24, 0.42);
  backdrop-filter: blur(18px);
}

.legend-title,
.route-title {
  margin-bottom: 12px;
  color: #eef7ff;
  font-size: 16px;
  font-weight: 600;
}

.legend-items {
  display: grid;
  gap: 10px;
  color: rgba(221, 236, 255, 0.78);
  font-size: 13px;
}

.legend-items span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
}

.legend-dot.imagery {
  background: #d5e4ef;
}

.legend-dot.lake {
  background: #70cceb;
}

.legend-dot.building {
  background: #ece4d4;
}

.legend-dot.route {
  background: #2fd1ff;
}

.control-panel {
  bottom: 24px;
  left: 50%;
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(5, 14, 24, 0.42);
  transform: translateX(-50%);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 35px rgba(0, 0, 0, 0.24);
}

.control-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 16px;
  color: rgba(216, 236, 255, 0.74);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.control-item:hover,
.control-item.active {
  color: #0a1d2d;
  background: linear-gradient(135deg, #0bcaf8, #7cf0ff);
  transform: translateY(-1px);
}

.stats-panel {
  right: 24px;
  bottom: 190px;
  display: flex;
  gap: 12px;
  z-index: 11;
}

.stat-item {
  min-width: 86px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  text-align: center;
  background: rgba(5, 14, 24, 0.34);
  backdrop-filter: blur(18px);
}

.stat-value {
  display: block;
  color: #4fe0ff;
  font-size: 26px;
  font-weight: 700;
}

.stat-label {
  display: block;
  margin-top: 6px;
  color: rgba(216, 233, 255, 0.62);
  font-size: 12px;
}

.building-list {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  z-index: 11;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: linear-gradient(
    180deg,
    rgba(7, 15, 29, 0.48),
    rgba(7, 15, 29, 0.74)
  );
  backdrop-filter: blur(22px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.list-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 18px;
}

.list-copy {
  max-width: 560px;
  margin: 0;
  color: rgba(220, 236, 255, 0.68);
  line-height: 1.5;
  font-size: 12px;
}

.route-panel {
  margin-bottom: 14px;
  padding: 0;
  border: 0;
  background: transparent;
}

.route-list,
.list-content {
  display: grid;
  gap: 10px;
}

.route-list {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.list-content {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.route-item,
.building-item {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  color: inherit;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.route-item {
  display: grid;
  gap: 6px;
  padding: 14px;
  text-align: left;
}

.route-item:hover,
.route-item.active,
.building-item:hover,
.building-item.active {
  border-color: rgba(81, 220, 255, 0.42);
  background: rgba(17, 39, 66, 0.52);
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
}

.route-name {
  color: #eef8ff;
  font-size: 14px;
  font-weight: 600;
}

.route-copy {
  color: rgba(214, 233, 255, 0.62);
  line-height: 1.5;
  font-size: 12px;
}

.building-item {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  text-align: left;
}

.building-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  color: #1f3043;
  font-size: 13px;
  font-weight: 700;
}

.building-info {
  display: grid;
  gap: 4px;
}

.building-name {
  color: #f5f8fe;
  font-size: 15px;
  font-weight: 600;
}

.building-type,
.building-meta {
  color: rgba(212, 231, 255, 0.62);
  font-size: 12px;
}

.weather-overlay {
  z-index: 7;
  overflow: hidden;
}

.cloud {
  position: absolute;
  width: 160px;
  height: 52px;
  border-radius: 999px;
  opacity: 0.42;
  background:
    radial-gradient(
      circle at 28px 30px,
      rgba(255, 255, 255, 0.9) 0 24px,
      transparent 25px
    ),
    radial-gradient(
      circle at 64px 22px,
      rgba(255, 255, 255, 0.86) 0 26px,
      transparent 27px
    ),
    radial-gradient(
      circle at 106px 28px,
      rgba(255, 255, 255, 0.8) 0 23px,
      transparent 24px
    );
  animation: drift 16s linear infinite;
}

.is-night .cloud {
  opacity: 0.24;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes drift {
  0% {
    transform: translateX(-12px);
  }

  50% {
    transform: translateX(26px);
  }

  100% {
    transform: translateX(-12px);
  }
}

@media (max-width: 1280px) {
  .scene-card,
  .viewer-container {
    min-height: 100vh;
    height: 100vh;
  }

  .route-list,
  .list-content {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .campus-container {
    min-height: 100vh;
  }

  .page-header {
    top: 16px;
    left: 16px;
    right: 16px;
  }

  .header-actions {
    display: none;
  }

  .page-title {
    font-size: 24px;
  }

  .scene-card,
  .viewer-container {
    min-height: 100vh;
    height: 100vh;
  }

  .building-info-card,
  .legend-card {
    left: 16px;
    right: 16px;
    width: auto;
  }

  .legend-card {
    top: 102px;
    bottom: auto;
  }

  .control-panel {
    left: 16px;
    right: 16px;
    justify-content: center;
    flex-wrap: wrap;
    transform: none;
  }

  .stats-panel {
    left: 16px;
    right: 16px;
    bottom: 252px;
    justify-content: space-between;
  }

  .building-list {
    left: 16px;
    right: 16px;
    bottom: 88px;
    padding: 14px;
  }

  .list-header {
    display: block;
  }

  .route-list,
  .list-content {
    grid-template-columns: 1fr;
  }
}
</style>
