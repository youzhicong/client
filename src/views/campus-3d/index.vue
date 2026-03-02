<!-- prettier-ignore -->
<template>
  <div class="campus-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <el-icon :size="28"><OfficeBuilding /></el-icon>
          </div>
          <div class="header-text">
            <h1 class="page-title">校园全景</h1>
            <p class="page-subtitle">3D 数字校园可视化</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button :icon="Refresh" circle @click="resetCamera" />
          <el-button :icon="FullScreen" circle @click="toggleFullscreen" />
        </div>
      </div>
    </div>

    <div class="scene-wrapper" ref="sceneWrapperRef">
      <div class="scene-card">
        <div ref="canvasContainer" class="canvas-container"></div>

        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在构建校园模型...</p>
        </div>

        <transition name="fade">
          <div v-if="selectedBuilding" class="building-info-card">
            <div class="info-header">
              <span class="info-icon">{{ getBuildingEmoji(selectedBuilding.type) }}</span>
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
              <div class="info-row" v-if="selectedBuilding.capacity">
                <span class="info-label">容纳</span>
                <span class="info-value">{{ selectedBuilding.capacity }} 人</span>
              </div>
              <div class="info-desc" v-if="selectedBuilding.desc">
                {{ selectedBuilding.desc }}
              </div>
            </div>
            <el-button size="small" type="primary" @click="selectedBuilding = null">关闭</el-button>
          </div>
        </transition>

        <div class="control-panel">
          <div class="control-item" :class="{ active: autoRotate }" @click="toggleAutoRotate">
            <el-icon><RefreshRight /></el-icon>
            <span>自动旋转</span>
          </div>
          <div class="control-item" @click="toggleNightMode">
            <el-icon><MoonNight /></el-icon>
            <span>{{ isNight ? '日间' : '夜间' }}</span>
          </div>
          <div class="control-item" :class="{ active: showWeather }" @click="toggleWeather">
            <el-icon><Cloudy /></el-icon>
            <span>{{ showWeather ? '关闭' : '天气' }}</span>
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
            <span class="stat-value">4</span>
            <span class="stat-label">校门</span>
          </div>
        </div>
      </div>

      <div class="building-list">
        <h3 class="list-title">
          <el-icon><OfficeBuilding /></el-icon>
          校园建筑
        </h3>
        <div class="list-content">
          <div
            v-for="building in buildings"
            :key="building.id"
            class="building-item"
            :class="{ active: selectedBuilding?.id === building.id }"
            @click="focusBuilding(building)"
          >
            <div class="building-icon" :style="{ background: building.color }">
              {{ building.name.charAt(0) }}
            </div>
            <div class="building-info">
              <span class="building-name">{{ building.name }}</span>
              <span class="building-type">{{ building.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/* eslint-disable */
// @ts-nocheck
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {
  Refresh,
  FullScreen,
  RefreshRight,
  MoonNight,
  OfficeBuilding,
  Cloudy,
} from '@element-plus/icons-vue'

const canvasContainer = ref(null)
const sceneWrapperRef = ref(null)
const loading = ref(true)
const selectedBuilding = ref(null)
const autoRotate = ref(true)
const isNight = ref(false)
const showWeather = ref(false)

let scene, camera, renderer, controls, animationId
let composer
let weatherParticles = null
let birds = []
let waterMeshes = []
let cloudMeshes = []
let walkers = []
let lampHalos = []
const buildingMeshes = new Map()
const worldClock = new THREE.Clock()
let adaptivePixelRatio = 1.5
let fpsFrameCount = 0
let fpsElapsed = 0
const targetFps = 52
const minPixelRatio = 0.9

// 校园布局规划：
// 南面：校门、广场
// 中轴线：主楼(穹顶)、图书馆、行政楼
// 东侧：教学区（教学楼A/B/C、计算机学院）
// 西侧：科研区（实验楼、科研楼、媒体实验室）
// 东北：生活区A（宿舍1/2、食堂）
// 西北：生活区B（宿舍3/4、餐厅）
// 西南：运动区（体育馆、操场）
// 东南：艺术/文化区

// ===============================================
// 浙江大学紫金港校区风格布局
// 特色：启真湖、求是大讲堂、月牙楼、图书信息大楼
// ===============================================

// ===============================================
// 浙江大学紫金港校区布局（按实际位置）
// 启真湖在东区中心，四周分布教学楼
// ===============================================

const buildings = ref([
  // === 核心教学区 ===
  {
    id: '1',
    name: '图书馆',
    type: '公共设施',
    floors: 6,
    color: '#e8e4dc',
    position: { x: 0, z: -30 },
    size: { width: 35, height: 26, depth: 22 },
    capacity: 3000,
    desc: '校园核心建筑，藏书120万册，配备电子阅览室和学术报告厅',
  },
  {
    id: '2',
    name: '行政楼',
    type: '行政',
    floors: 4,
    color: '#d8d4cc',
    position: { x: -70, z: -40 },
    size: { width: 25, height: 16, depth: 16 },
    capacity: 200,
    desc: '学校行政办公中心，包含教务处、学工处等部门',
  },

  // === 东区教学楼 ===
  {
    id: '3',
    name: '东一教',
    type: '教学楼',
    floors: 5,
    color: '#f0ece4',
    position: { x: 80, z: 20 },
    size: { width: 30, height: 18, depth: 14 },
    capacity: 2000,
    desc: '东区主教学楼，拥有多媒体教室和计算机实验室',
  },
  {
    id: '4',
    name: '东二教',
    type: '教学楼',
    floors: 4,
    color: '#e8e4dc',
    position: { x: 85, z: -40 },
    size: { width: 26, height: 14, depth: 14 },
    capacity: 1500,
    desc: '东区辅助教学楼，设有语音实验室和自习室',
  },
  {
    id: '5',
    name: '东三教',
    type: '教学楼',
    floors: 6,
    color: '#f0ece4',
    position: { x: 130, z: -10 },
    size: { width: 22, height: 22, depth: 16 },
    capacity: 1200,
    desc: '东区高层教学楼，设有学术交流中心',
  },

  // === 西区教学楼 ===
  {
    id: '6',
    name: '西一教',
    type: '教学楼',
    floors: 5,
    color: '#e8e4dc',
    position: { x: -85, z: 25 },
    size: { width: 28, height: 18, depth: 14 },
    capacity: 1800,
    desc: '西区主教学楼，人文学科教学主阵地',
  },
  {
    id: '7',
    name: '西二教',
    type: '教学楼',
    floors: 4,
    color: '#f0ece4',
    position: { x: -125, z: -15 },
    size: { width: 24, height: 14, depth: 14 },
    capacity: 1000,
    desc: '西区辅助教学楼，设有艺术教室和音乐室',
  },

  // === 科研楼群（东北）===
  {
    id: '8',
    name: '理学院',
    type: '科研',
    floors: 7,
    color: '#dce4e8',
    position: { x: 115, z: 85 },
    size: { width: 26, height: 26, depth: 20 },
    capacity: 500,
    desc: '理学院科研楼，配备先进实验设备和研究中心',
  },
  {
    id: '9',
    name: '工学院',
    type: '科研',
    floors: 6,
    color: '#e4e8dc',
    position: { x: 70, z: 100 },
    size: { width: 22, height: 22, depth: 18 },
    capacity: 400,
    desc: '工学院科研楼，拥有工程实训中心和创新工场',
  },

  // === 生活区（北部）===
  {
    id: '10',
    name: '学生宿舍A',
    type: '宿舍',
    floors: 6,
    color: '#f5f0e8',
    position: { x: -50, z: 120 },
    size: { width: 40, height: 20, depth: 14 },
    capacity: 800,
    desc: '南区学生宿舍，四人间配置，设有公共洗衣房和自习室',
  },
  {
    id: '11',
    name: '学生宿舍B',
    type: '宿舍',
    floors: 6,
    color: '#f0ebe4',
    position: { x: 20, z: 130 },
    size: { width: 36, height: 20, depth: 14 },
    capacity: 720,
    desc: '北区学生宿舍，四人间配置，每层配备公共活动室',
  },
  {
    id: '12',
    name: '食堂',
    type: '生活设施',
    floors: 2,
    color: '#e8e0d4',
    position: { x: -15, z: 80 },
    size: { width: 32, height: 10, depth: 20 },
    capacity: 1500,
    desc: '主食堂，提供中餐、西餐、小吃等多种餐饮服务',
  },

  // === 体育区（西南）===
  {
    id: '13',
    name: '体育馆',
    type: '体育设施',
    floors: 2,
    color: '#d4dce4',
    position: { x: -110, z: -100 },
    size: { width: 45, height: 18, depth: 35 },
    capacity: 5000,
    desc: '综合性体育场馆，可举办运动会、比赛及大型活动',
  },

  // === 特色建筑 ===
  {
    id: '14',
    name: '报告厅',
    type: '公共设施',
    floors: 2,
    color: '#c4a080',
    position: { x: 20, z: -120 },
    size: { width: 28, height: 12, depth: 20 },
    capacity: 800,
    desc: '学术报告厅，配备专业音响和投影系统',
  },
  {
    id: '15',
    name: '艺术中心',
    type: '公共设施',
    floors: 3,
    color: '#e0d8d0',
    position: { x: -130, z: 75 },
    size: { width: 24, height: 14, depth: 18 },
    capacity: 600,
    desc: '校园艺术活动中心，包含展览厅、演出厅和排练室',
  },
])

const totalCapacity = computed(() => {
  return buildings.value.reduce((sum, b) => sum + (b.capacity || 0), 0)
})

function getBuildingEmoji(type) {
  var map = {
    公共设施: '🏛️',
    行政: '🏢',
    教学楼: '🏫',
    科研: '🔬',
    宿舍: '🏠',
    生活设施: '🍽️',
    体育设施: '🏟️',
  }
  return map[type] || '🏛️'
}

function resetDynamicCollections() {
  weatherParticles = null
  birds = []
  waterMeshes = []
  cloudMeshes = []
  walkers = []
  lampHalos = []
}

function getDevicePixelRatio() {
  if (typeof window === 'undefined') return 1
  return window.devicePixelRatio || 1
}

function disposeMaterial(material) {
  if (!material) return
  var textureKeys = [
    'map',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
    'specularMap',
  ]
  textureKeys.forEach(function (key) {
    if (material[key] && material[key].dispose) {
      material[key].dispose()
    }
  })
  if (material.dispose) material.dispose()
}

function disposeObject3D(object) {
  if (!object || !object.traverse) return
  object.traverse(function (child) {
    if (child.geometry && child.geometry.dispose) {
      child.geometry.dispose()
    }
    if (Array.isArray(child.material)) {
      child.material.forEach(function (material) {
        disposeMaterial(material)
      })
    } else if (child.material) {
      disposeMaterial(child.material)
    }
  })
}

function clearSceneResources() {
  if (!scene) return
  for (var i = scene.children.length - 1; i >= 0; i--) {
    var child = scene.children[i]
    scene.remove(child)
    disposeObject3D(child)
  }
}

function updateRendererPixelRatio() {
  if (!renderer || !canvasContainer.value) return
  var limit = Math.min(getDevicePixelRatio(), adaptivePixelRatio)
  renderer.setPixelRatio(limit)
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight, false)
  if (composer) {
    composer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
  }
}

function getShadowMapSize() {
  if (adaptivePixelRatio >= 1.5) return 3072
  if (adaptivePixelRatio >= 1.15) return 2048
  return 1024
}

function tuneAdaptiveQuality(delta) {
  fpsFrameCount += 1
  fpsElapsed += delta
  if (fpsElapsed < 1.5) return

  var fps = fpsFrameCount / fpsElapsed
  fpsFrameCount = 0
  fpsElapsed = 0

  var prev = adaptivePixelRatio
  var deviceMax = Math.min(getDevicePixelRatio(), 2)
  if (fps < targetFps - 10) {
    adaptivePixelRatio = Math.max(minPixelRatio, adaptivePixelRatio - 0.1)
  } else if (fps > targetFps + 8) {
    adaptivePixelRatio = Math.min(deviceMax, adaptivePixelRatio + 0.05)
  }

  if (adaptivePixelRatio !== prev) {
    updateRendererPixelRatio()
  }
}

function initPostProcessing() {
  if (!renderer || !scene || !camera || !canvasContainer.value) return

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  var bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight),
    isNight.value ? 0.62 : 0.28,
    0.75,
    isNight.value ? 0.42 : 0.82,
  )
  bloomPass.threshold = isNight.value ? 0.44 : 0.76
  bloomPass.radius = isNight.value ? 0.82 : 0.36
  composer.addPass(bloomPass)
  composer.bloomPass = bloomPass
}

function updatePostProcessing() {
  if (!composer || !composer.bloomPass) return
  composer.bloomPass.strength = isNight.value ? 0.62 : 0.28
  composer.bloomPass.threshold = isNight.value ? 0.44 : 0.76
  composer.bloomPass.radius = isNight.value ? 0.82 : 0.36
}

function createProceduralTexture(colorA, colorB, options) {
  var size = options?.size || 256
  var canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  var ctx = canvas.getContext('2d')
  if (!ctx) return null

  var gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, colorA)
  gradient.addColorStop(1, colorB)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  var grain = options?.grain || 1000
  for (var i = 0; i < grain; i++) {
    var x = Math.random() * size
    var y = Math.random() * size
    var alpha = 0.02 + Math.random() * 0.08
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')'
    ctx.fillRect(x, y, 1, 1)
  }

  var stripeEvery = options?.stripeEvery || 0
  if (stripeEvery > 0) {
    ctx.fillStyle = options?.stripeColor || 'rgba(255,255,255,0.06)'
    for (var sy = 0; sy < size; sy += stripeEvery) {
      ctx.fillRect(0, sy, size, 1)
    }
  }

  var texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(options?.repeatX || 1, options?.repeatY || 1)
  texture.colorSpace = THREE.SRGBColorSpace
  if (renderer) {
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  }
  return texture
}

function createFacadeTexture(baseColor) {
  var base = new THREE.Color(baseColor)
  var lighter = '#' + base.clone().offsetHSL(0, 0.04, 0.1).getHexString()
  var darker = '#' + base.clone().offsetHSL(0, -0.04, -0.08).getHexString()
  return createProceduralTexture(lighter, darker, {
    repeatX: 2 + Math.random() * 2,
    repeatY: 1.5 + Math.random() * 2,
    grain: 1300,
    stripeEvery: 16,
    stripeColor: 'rgba(255,255,255,0.05)',
  })
}

function registerWaterSurface(mesh) {
  if (!mesh?.geometry?.attributes?.position) return
  mesh.userData.isWater = true
  mesh.userData.basePositions = new Float32Array(mesh.geometry.attributes.position.array)
  mesh.userData.wavePhase = Math.random() * Math.PI * 2
  waterMeshes.push(mesh)
}

function registerCloud(cloud) {
  cloud.userData.isCloud = true
  cloud.userData.baseY = cloud.position.y
  cloud.userData.drift = 0.02 + Math.random() * 0.05
  cloud.userData.phase = Math.random() * Math.PI * 2
  cloudMeshes.push(cloud)
}

function createAtmosphere() {
  var skyGeometry = new THREE.SphereGeometry(900, 40, 20)
  var skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(isNight.value ? 0x0a1330 : 0x63a4ff) },
      bottomColor: { value: new THREE.Color(isNight.value ? 0x04070f : 0xdff4ff) },
      offset: { value: 65 },
      exponent: { value: isNight.value ? 0.9 : 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float f = max(pow(max(h, 0.0), exponent), 0.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, f), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  })
  var sky = new THREE.Mesh(skyGeometry, skyMaterial)
  scene.add(sky)

  if (isNight.value) {
    var starCount = 1800
    var starGeo = new THREE.BufferGeometry()
    var starPos = new Float32Array(starCount * 3)
    for (var i = 0; i < starCount; i++) {
      var r = 450 + Math.random() * 320
      var theta = Math.random() * Math.PI * 2
      var phi = Math.random() * Math.PI * 0.5
      starPos[i * 3] = Math.cos(theta) * Math.sin(phi) * r
      starPos[i * 3 + 1] = Math.cos(phi) * r + 120
      starPos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    var stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xdbe8ff,
        size: 1.15,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      }),
    )
    stars.userData.isStarField = true
    scene.add(stars)
  } else {
    var sun = new THREE.Mesh(
      new THREE.SphereGeometry(9, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff4c9 }),
    )
    sun.position.set(-220, 220, -320)
    scene.add(sun)
  }
}

function initScene() {
  if (!canvasContainer.value) return

  resetDynamicCollections()
  worldClock.start()
  adaptivePixelRatio = Math.min(getDevicePixelRatio(), 1.5)
  fpsFrameCount = 0
  fpsElapsed = 0

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    45,
    canvasContainer.value.clientWidth / canvasContainer.value.clientHeight,
    0.1,
    1000,
  )
  camera.position.set(180, 120, 180)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.physicallyCorrectLights = true
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = isNight.value ? 0.84 : 1.06
  updateRendererPixelRatio()
  canvasContainer.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.maxPolarAngle = Math.PI / 2.2
  controls.minDistance = 50
  controls.maxDistance = 600
  controls.autoRotate = autoRotate.value
  controls.autoRotateSpeed = 0.5
  controls.target.set(0, 0, 0)

  updateSceneMode()
  createAtmosphere()
  addLights()
  createGround()
  createBuildings()
  createDecorations()
  initPostProcessing()
  updatePostProcessing()

  renderer.domElement.addEventListener('click', onCanvasClick)
  window.addEventListener('resize', onWindowResize)
  animate()

  setTimeout(function () {
    loading.value = false
  }, 1500)
}

function addLights() {
  var ambientLight = new THREE.AmbientLight(isNight.value ? 0x2a3550 : 0xffffff, isNight.value ? 0.24 : 0.42)
  scene.add(ambientLight)

  var sunLight = new THREE.DirectionalLight(isNight.value ? 0x6688ff : 0xfffacd, isNight.value ? 0.58 : 1.45)
  sunLight.position.set(120, 180, 90)
  sunLight.castShadow = true
  var shadowMapSize = getShadowMapSize()
  sunLight.shadow.mapSize.width = shadowMapSize
  sunLight.shadow.mapSize.height = shadowMapSize
  sunLight.shadow.bias = -0.00008
  sunLight.shadow.normalBias = 0.02
  sunLight.shadow.radius = 4
  sunLight.shadow.camera.near = 10
  sunLight.shadow.camera.far = 500
  sunLight.shadow.camera.left = -200
  sunLight.shadow.camera.right = 200
  sunLight.shadow.camera.top = 200
  sunLight.shadow.camera.bottom = -200
  scene.add(sunLight)

  var fillLight = new THREE.DirectionalLight(isNight.value ? 0x334466 : 0xb0c4de, isNight.value ? 0.26 : 0.58)
  fillLight.position.set(-80, 60, -50)
  scene.add(fillLight)

  var hemiLight = new THREE.HemisphereLight(
    isNight.value ? 0x0f1e36 : 0xddeeff,
    isNight.value ? 0x080820 : 0x3a4a2a,
    isNight.value ? 0.45 : 0.62,
  )
  scene.add(hemiLight)

  var rimLight = new THREE.DirectionalLight(isNight.value ? 0x9bb6ff : 0xb8dfff, isNight.value ? 0.3 : 0.2)
  rimLight.position.set(-140, 55, 130)
  scene.add(rimLight)
}

function updateSceneMode() {
  var fogColor = isNight.value ? 0x080b18 : 0x9ecdf4
  scene.background = new THREE.Color(fogColor)
  scene.fog = new THREE.FogExp2(fogColor, isNight.value ? 0.0029 : 0.0019)
  if (renderer) {
    renderer.toneMappingExposure = isNight.value ? 0.84 : 1.06
  }
}

function createGround() {
  // 扩大地面到500x500
  var groundGeo = new THREE.PlaneGeometry(500, 500)
  var grassTexture = createProceduralTexture(
    isNight.value ? '#223a23' : '#4f7c4f',
    isNight.value ? '#172717' : '#355e35',
    { repeatX: 16, repeatY: 16, grain: 2400 },
  )
  var groundMat = new THREE.MeshStandardMaterial({
    color: isNight.value ? 0x1a2a1a : 0x3a5a3a,
    map: grassTexture,
    roughness: 0.98,
    metalness: 0.02,
  })
  var ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // 草皮色块变化 - 增加地面真实感
  var patchColors = [0x2e6b2e, 0x3a6b3a, 0x4a7a4a, 0x3d6d3d, 0x356535]
  for (var gp = 0; gp < 30; gp++) {
    var patchSize = 15 + Math.random() * 25
    var patchGeo = new THREE.CircleGeometry(patchSize, 16)
    var patchColor = patchColors[Math.floor(Math.random() * patchColors.length)]
    var patchMat = new THREE.MeshStandardMaterial({
      color: isNight.value ? patchColor & 0x7f7f7f : patchColor,
      roughness: 1,
    })
    var patch = new THREE.Mesh(patchGeo, patchMat)
    patch.rotation.x = -Math.PI / 2
    patch.position.set((Math.random() - 0.5) * 400, 0.01, (Math.random() - 0.5) * 400)
    patch.receiveShadow = true
    scene.add(patch)
  }

  // ========== 启真湖（西南方向）==========
  // 使用更逼真的水面材质
  var lakeMat = new THREE.MeshPhysicalMaterial({
    color: isNight.value ? 0x0a1a3a : 0x4fc3f7,
    transparent: true,
    opacity: isNight.value ? 0.72 : 0.84,
    roughness: 0.2,
    metalness: 0.15,
    transmission: 0.32,
    envMapIntensity: isNight.value ? 1.2 : 1.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  })

  // 湖体主体 - 增加顶点细分以支持波动动画
  var lakeGeo = new THREE.CircleGeometry(35, 64)
  var lake = new THREE.Mesh(lakeGeo, lakeMat)
  lake.rotation.x = -Math.PI / 2
  lake.position.set(-100, 0.1, -80)
  registerWaterSurface(lake)
  scene.add(lake)

  // 湖体延伸
  var lakeExt = new THREE.Mesh(new THREE.CircleGeometry(22, 48), lakeMat)
  lakeExt.rotation.x = -Math.PI / 2
  lakeExt.position.set(-65, 0.1, -90)
  registerWaterSurface(lakeExt)
  scene.add(lakeExt)

  var lakeExt2 = new THREE.Mesh(new THREE.CircleGeometry(18, 48), lakeMat)
  lakeExt2.rotation.x = -Math.PI / 2
  lakeExt2.position.set(-130, 0.1, -65)
  registerWaterSurface(lakeExt2)
  scene.add(lakeExt2)
  // 湖岸步道
  var shoreRing = new THREE.Mesh(
    new THREE.RingGeometry(35, 37, 48),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 }),
  )
  shoreRing.rotation.x = -Math.PI / 2
  shoreRing.position.set(-100, 0.04, -80)
  scene.add(shoreRing)
  // 湖心小岛
  var islandMat = new THREE.MeshStandardMaterial({ color: isNight.value ? 0x1a3a1a : 0x4caf50 })
  var island = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 0.5, 16), islandMat)
  island.position.set(-100, 0.3, -80)
  scene.add(island)
  // 小岛上的亭子
  var pavilionBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 3, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x795548 }),
  )
  pavilionBase.position.set(-100, 0.7, -80)
  scene.add(pavilionBase)
  var pavilionPillarMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 })
  for (var pp = 0; pp < 6; pp++) {
    var ppAngle = (pp / 6) * Math.PI * 2
    var pPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 8), pavilionPillarMat)
    pPillar.position.set(-100 + Math.cos(ppAngle) * 2, 2.2, -80 + Math.sin(ppAngle) * 2)
    scene.add(pPillar)
  }
  var pavilionRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 2, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a0000 }),
  )
  pavilionRoof.position.set(-100, 4.8, -80)
  scene.add(pavilionRoof)
  // 湖上小桥
  var bridgeMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
  var bridge = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 2.5), bridgeMat)
  bridge.position.set(-82, 0.5, -80)
  scene.add(bridge)
  // 桥栏杆
  var railMat = new THREE.MeshStandardMaterial({ color: 0xa1887f })
  var railL = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 0.15), railMat)
  railL.position.set(-82, 1, -78.8)
  scene.add(railL)
  var railR = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 0.15), railMat)
  railR.position.set(-82, 1, -81.2)
  scene.add(railR)

  // ========== 中央广场（图书馆周围）==========
  // 广场铺装
  var plazaMat = new THREE.MeshStandardMaterial({ color: 0xb0a090 })
  var plaza = new THREE.Mesh(new THREE.CircleGeometry(28, 48), plazaMat)
  plaza.rotation.x = -Math.PI / 2
  plaza.position.set(0, 0.03, 0)
  scene.add(plaza)

  // 广场装饰花坛
  var flowerBedMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 })
  for (var fb = 0; fb < 4; fb++) {
    var fbAngle = (fb / 4) * Math.PI * 2
    var flowerBed = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 0.5, 16), flowerBedMat)
    flowerBed.position.set(Math.cos(fbAngle) * 20, 0.25, Math.sin(fbAngle) * 20)
    scene.add(flowerBed)
    // 花坛中的灌木
    var shrub = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x388e3c }),
    )
    shrub.position.set(Math.cos(fbAngle) * 20, 1.5, Math.sin(fbAngle) * 20)
    scene.add(shrub)
  }

  // 广场座椅
  var benchMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 })
  for (var bench = 0; bench < 8; bench++) {
    var benchAngle = (bench / 8) * Math.PI * 2
    var benchSeat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 1), benchMat)
    benchSeat.position.set(Math.cos(benchAngle) * 25, 0.5, Math.sin(benchAngle) * 25)
    benchSeat.rotation.y = benchAngle
    scene.add(benchSeat)
  }

  // 湖边柳树（情人坡）
  var willowPositions = [
    [38, 20],
    [-38, 20],
    [35, -25],
    [-35, -25],
    [20, 38],
    [-20, 38],
  ]
  willowPositions.forEach(function (pos) {
    // 柳树树干
    var willowTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5d4037 }),
    )
    willowTrunk.position.set(pos[0], 2, pos[1])
    scene.add(willowTrunk)
    // 柳树树冠（球形）
    var willowTop = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x7cb342, transparent: true, opacity: 0.85 }),
    )
    willowTop.position.set(pos[0], 5, pos[1])
    scene.add(willowTop)
  })

  // 湖上天鹅
  var swanPositions = [
    [-90, -85],
    [-110, -75],
    [-105, -95],
  ]
  swanPositions.forEach(function (pos) {
    var swanMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    // 身体
    var swanBody = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), swanMat)
    swanBody.scale.set(1.5, 0.8, 1)
    swanBody.position.set(pos[0], 0.4, pos[1])
    scene.add(swanBody)
    // 脖子
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.2, 8), swanMat)
    neck.position.set(pos[0] + 0.5, 1, pos[1])
    neck.rotation.z = -0.5
    scene.add(neck)
    // 头
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), swanMat)
    head.position.set(pos[0] + 0.9, 1.5, pos[1])
    scene.add(head)
  })

  // ========== 山丘 ==========
  var hillMat = new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.8 })
  // 大山
  var bigHill = new THREE.Mesh(new THREE.ConeGeometry(40, 35, 32), hillMat)
  bigHill.position.set(-180, 17, -150)
  scene.add(bigHill)
  // 雪顶
  var snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
  var snowCap = new THREE.Mesh(new THREE.ConeGeometry(12, 10, 32), snowMat)
  snowCap.position.set(-180, 40, -150)
  scene.add(snowCap)
  // 中山
  var midHill = new THREE.Mesh(new THREE.ConeGeometry(30, 25, 24), hillMat)
  midHill.position.set(-150, 12, -180)
  scene.add(midHill)
  // 小山
  var smallHill1 = new THREE.Mesh(
    new THREE.SphereGeometry(20, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    hillMat,
  )
  smallHill1.position.set(180, 0, -120)
  scene.add(smallHill1)
  var smallHill2 = new THREE.Mesh(
    new THREE.SphereGeometry(15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    hillMat,
  )
  smallHill2.position.set(160, 0, -150)
  scene.add(smallHill2)

  // ========== 道路网络（连接四大门）==========
  var roadTexture = createProceduralTexture('#565656', '#3f3f3f', {
    repeatX: 10,
    repeatY: 2,
    grain: 1900,
    stripeEvery: 20,
    stripeColor: 'rgba(255,255,255,0.04)',
  })
  var roadMat = new THREE.MeshStandardMaterial({ color: 0x555555, map: roadTexture, roughness: 0.92 })

  // 中心广场（围绕图书馆）
  var plazaPath = new THREE.Mesh(new THREE.RingGeometry(20, 26, 32), roadMat)
  plazaPath.rotation.x = -Math.PI / 2
  plazaPath.position.set(0, 0.02, -30)
  scene.add(plazaPath)

  // 南北主干道（连接南门-北门，310m长）
  var mainRoadNS = new THREE.Mesh(new THREE.PlaneGeometry(10, 310), roadMat)
  mainRoadNS.rotation.x = -Math.PI / 2
  mainRoadNS.position.set(0, 0.02, 5)
  scene.add(mainRoadNS)

  // 东西主干道（连接东门-西门，330m宽）
  var mainRoadEW = new THREE.Mesh(new THREE.PlaneGeometry(330, 10), roadMat)
  mainRoadEW.rotation.x = -Math.PI / 2
  mainRoadEW.position.set(0, 0.02, 0)
  scene.add(mainRoadEW)

  // 北部环道（生活区，扩大）
  var northRing = new THREE.Mesh(new THREE.PlaneGeometry(180, 8), roadMat)
  northRing.rotation.x = -Math.PI / 2
  northRing.position.set(-20, 0.02, 95)
  scene.add(northRing)

  // 东侧纵道
  var eastSide = new THREE.Mesh(new THREE.PlaneGeometry(8, 120), roadMat)
  eastSide.rotation.x = -Math.PI / 2
  eastSide.position.set(100, 0.02, 35)
  scene.add(eastSide)

  // 西侧纵道
  var westSide = new THREE.Mesh(new THREE.PlaneGeometry(8, 100), roadMat)
  westSide.rotation.x = -Math.PI / 2
  westSide.position.set(-100, 0.02, -25)
  scene.add(westSide)

  // ========== 绿化广场 ==========
  var greenBeltMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 })

  // ========== 路灯（沿新道路布置）==========
  var lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x424242 })
  var lampLightMat = new THREE.MeshStandardMaterial({ color: 0x37474f })
  var lampPositionsExt = [
    // 图书馆周围
    [15, -5],
    [-15, -5],
    [15, -35],
    [-15, -35],
    // 东区
    [35, 30],
    [60, 0],
    [75, 45],
    // 西区
    [-40, 5],
    [-65, -20],
    // 北部生活区
    [-20, 70],
    [10, 75],
    [-70, 60],
    // 南部
    [10, -55],
    [-50, -50],
  ]
  lampPositionsExt.forEach(function (pos) {
    // 灯杆
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 6, 8), lampPoleMat)
    pole.position.set(pos[0], 3, pos[1])
    scene.add(pole)
    // 灯臂
    var arm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 0.15), lampLightMat)
    arm.position.set(pos[0] + 1, 6, pos[1])
    scene.add(arm)
    // 灯头
    var lampHead = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.4, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x263238 }),
    )
    lampHead.position.set(pos[0] + 1.5, 5.8, pos[1])
    scene.add(lampHead)
    // 夜间发光
    if (isNight.value) {
      var light = new THREE.PointLight(0xffd980, 22, 24, 2)
      light.position.set(pos[0] + 1.5, 5.5, pos[1])
      scene.add(light)

      var halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: 0xfff1bd,
          transparent: true,
          opacity: 0.26,
          depthWrite: false,
        }),
      )
      halo.position.set(pos[0] + 1.5, 5.5, pos[1])
      halo.scale.set(4.2, 4.2, 1)
      halo.userData.phase = Math.random() * Math.PI * 2
      scene.add(halo)
      lampHalos.push(halo)
    }
  })

  // ========== 校园大门（东南西北4个）==========
  var gatePillarMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.4 })
  var gateBeamMat = new THREE.MeshStandardMaterial({ color: 0xa52a2a, roughness: 0.5 })
  var gateSignMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6 })

  // 大门数据: [x, z, rotationY, name] - 扩大后的位置
  var gates = [
    { x: 0, z: -150, rot: 0, name: '南门' },
    { x: 0, z: 165, rot: Math.PI, name: '北门' },
    { x: 165, z: 0, rot: -Math.PI / 2, name: '东门' },
    { x: -165, z: 0, rot: Math.PI / 2, name: '西门' },
  ]

  gates.forEach(function (gate) {
    var gateGroup = new THREE.Group()

    // 左柱
    var pillarL = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 2), gatePillarMat)
    pillarL.position.set(-8, 6, 0)
    gateGroup.add(pillarL)

    // 右柱
    var pillarR = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 2), gatePillarMat)
    pillarR.position.set(8, 6, 0)
    gateGroup.add(pillarR)

    // 横梁
    var beam = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 2), gateBeamMat)
    beam.position.set(0, 11, 0)
    gateGroup.add(beam)

    // 顶部装饰（中式屋檐）
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x4a0000 })
    var roof = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 3.5), roofMat)
    roof.position.set(0, 12.5, 0)
    gateGroup.add(roof)

    // 校名牌匾
    var sign = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 0.3), gateSignMat)
    sign.position.set(0, 9, 1.2)
    gateGroup.add(sign)

    // 入口地面铺装
    var entranceMat = new THREE.MeshStandardMaterial({ color: 0x757575 })
    var entranceFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 15), entranceMat)
    entranceFloor.rotation.x = -Math.PI / 2
    entranceFloor.position.set(0, 0.03, 8)
    gateGroup.add(entranceFloor)

    // 入口道路
    var entranceRoad = new THREE.Mesh(new THREE.PlaneGeometry(8, 25), roadMat)
    entranceRoad.rotation.x = -Math.PI / 2
    entranceRoad.position.set(0, 0.02, -15)
    gateGroup.add(entranceRoad)

    gateGroup.position.set(gate.x, 0, gate.z)
    gateGroup.rotation.y = gate.rot
    scene.add(gateGroup)
  })

  // ========== 校园围墙 ==========
  var wallMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.7 })
  var wallTopMat = new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.6 })

  // 南围墙（分两段，中间留门）
  var wallSW = new THREE.Mesh(new THREE.BoxGeometry(155, 3, 0.5), wallMat)
  wallSW.position.set(-82, 1.5, -150)
  scene.add(wallSW)
  var wallSE = new THREE.Mesh(new THREE.BoxGeometry(155, 3, 0.5), wallMat)
  wallSE.position.set(82, 1.5, -150)
  scene.add(wallSE)

  // 北围墙（分两段，中间留门）
  var wallNW = new THREE.Mesh(new THREE.BoxGeometry(155, 3, 0.5), wallMat)
  wallNW.position.set(-82, 1.5, 165)
  scene.add(wallNW)
  var wallNE = new THREE.Mesh(new THREE.BoxGeometry(155, 3, 0.5), wallMat)
  wallNE.position.set(82, 1.5, 165)
  scene.add(wallNE)

  // 东围墙（分两段，中间留门）
  var wallEN = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 155), wallMat)
  wallEN.position.set(165, 1.5, 82)
  scene.add(wallEN)
  var wallES = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 140), wallMat)
  wallES.position.set(165, 1.5, -80)
  scene.add(wallES)

  // 西围墙（分两段，中间留门）
  var wallWN = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 155), wallMat)
  wallWN.position.set(-165, 1.5, 82)
  scene.add(wallWN)
  var wallWS = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 140), wallMat)
  wallWS.position.set(-165, 1.5, -80)
  scene.add(wallWS)

  // 围墙顶部装饰
  var wallTops = [
    [-82, -150, 155],
    [82, -150, 155],
    [-82, 165, 155],
    [82, 165, 155],
  ]
  wallTops.forEach(function (pos) {
    var top = new THREE.Mesh(new THREE.BoxGeometry(pos[2], 0.3, 1), wallTopMat)
    top.position.set(pos[0], 3.15, pos[1])
    scene.add(top)
  })

  // ========== 斑马线 ==========
  var zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  // 主干道与支路交叉口
  var crosswalkPositions = [
    [-50, 0],
    [50, 0],
    [0, -80],
  ]
  crosswalkPositions.forEach(function (pos) {
    for (var z = 0; z < 8; z++) {
      var stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 6), zebraMat)
      stripe.rotation.x = -Math.PI / 2
      stripe.position.set(pos[0] - 3.5 + z, 0.04, pos[1])
      scene.add(stripe)
    }
  })

  // ========== 人行道 ==========
  var sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
  // 主干道人行道
  var sidewalkN = new THREE.Mesh(new THREE.PlaneGeometry(400, 3), sidewalkMat)
  sidewalkN.rotation.x = -Math.PI / 2
  sidewalkN.position.set(0, 0.03, 10)
  scene.add(sidewalkN)
  var sidewalkS = new THREE.Mesh(new THREE.PlaneGeometry(400, 3), sidewalkMat)
  sidewalkS.rotation.x = -Math.PI / 2
  sidewalkS.position.set(0, 0.03, -10)
  scene.add(sidewalkS)

  // ========== 长椅 ==========
  var benchSeat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  var benchLeg = new THREE.MeshStandardMaterial({ color: 0x424242 })
  var benchPositions = [
    [25, -15],
    [-25, -15],
    [40, 30],
    [-40, 30],
    [20, 50],
    [-20, 50],
    [60, 10],
    [-60, 10],
  ]
  benchPositions.forEach(function (pos) {
    var seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.8), benchSeat)
    seat.position.set(pos[0], 0.6, pos[1])
    scene.add(seat)
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), benchLeg)
    leg1.position.set(pos[0] - 1, 0.25, pos[1])
    scene.add(leg1)
    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), benchLeg)
    leg2.position.set(pos[0] + 1, 0.25, pos[1])
    scene.add(leg2)
    var back = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 0.1), benchSeat)
    back.position.set(pos[0], 0.9, pos[1] - 0.35)
    scene.add(back)
  })

  // ========== 垃圾桶 ==========
  var binMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
  var binPositions = [
    [15, -30],
    [-15, -30],
    [30, 20],
    [-30, 20],
    [50, 50],
    [-50, 50],
    [0, 70],
    [80, 0],
    [-80, 0],
  ]
  binPositions.forEach(function (pos) {
    var bin = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 1, 8), binMat)
    bin.position.set(pos[0], 0.5, pos[1])
    scene.add(bin)
    var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.1, 8), binMat)
    lid.position.set(pos[0], 1, pos[1])
    scene.add(lid)
  })

  // ========== 路牌/指示牌 ==========
  var signPoleMat = new THREE.MeshStandardMaterial({ color: 0x616161 })
  var signBoardMat = new THREE.MeshStandardMaterial({ color: 0x1565c0 })
  var signPositions = [
    [0, -85, '图书馆 →'],
    [0, 95, '← 宿舍区'],
    [95, 0, '教学楼 ↑'],
    [-95, 0, '体育馆 ↓'],
    [30, 40, '食堂 →'],
    [-30, -50, '行政楼 ↑'],
  ]
  signPositions.forEach(function (s) {
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 8), signPoleMat)
    pole.position.set(s[0], 1.5, s[1])
    scene.add(pole)
    var board = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.1), signBoardMat)
    board.position.set(s[0], 2.8, s[1])
    scene.add(board)
  })

  // ========== 花坛 ==========
  var flowerBedMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 })
  var flowerMat1 = new THREE.MeshStandardMaterial({ color: 0xff4081 })
  var flowerMat2 = new THREE.MeshStandardMaterial({ color: 0xffeb3b })
  var flowerMat3 = new THREE.MeshStandardMaterial({ color: 0x9c27b0 })
  var flowerBedPositions = [
    [12, -8],
    [-12, -8],
    [12, -32],
    [-12, -32],
  ]
  flowerBedPositions.forEach(function (pos, idx) {
    var bed = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 4), flowerBedMat)
    bed.position.set(pos[0], 0.2, pos[1])
    scene.add(bed)
    for (var f = 0; f < 6; f++) {
      var fx = pos[0] - 1.5 + Math.random() * 3
      var fz = pos[1] - 1.5 + Math.random() * 3
      var flowerMats = [flowerMat1, flowerMat2, flowerMat3]
      var flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 8, 6),
        flowerMats[f % 3],
      )
      flower.position.set(fx, 0.5 + Math.random() * 0.2, fz)
      scene.add(flower)
    }
  })

  // ========== 自行车停放区 ==========
  var bikeMat = new THREE.MeshStandardMaterial({ color: 0x37474f })
  var bikePositions = [
    [45, 25],
    [-45, 25],
    [60, 70],
    [-60, 70],
  ]
  bikePositions.forEach(function (pos) {
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), sidewalkMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(pos[0], 0.025, pos[1])
    scene.add(ground)
    for (var b = 0; b < 4; b++) {
      var rack = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI), bikeMat)
      rack.rotation.x = Math.PI / 2
      rack.position.set(pos[0] - 3 + b * 2, 0.3, pos[1])
      scene.add(rack)
    }
  })

  // ========== 旗杆 ==========
  var flagPoleMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 })
  var flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 18, 16), flagPoleMat)
  flagPole.position.set(0, 9, -50)
  scene.add(flagPole)
  var flagMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, side: THREE.DoubleSide })
  var flag = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), flagMat)
  flag.position.set(2.2, 16, -50)
  scene.add(flag)

  // ========== 宣传栏 ==========
  var bulletinMat = new THREE.MeshStandardMaterial({ color: 0x795548 })
  var bulletinGlass = new THREE.MeshStandardMaterial({
    color: 0x90caf9,
    transparent: true,
    opacity: 0.5,
  })
  var bulletinPositions = [
    [35, -20],
    [-35, -20],
    [25, 55],
  ]
  bulletinPositions.forEach(function (pos) {
    var frame = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.2), bulletinMat)
    frame.position.set(pos[0], 1.5, pos[1])
    scene.add(frame)
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), bulletinGlass)
    glass.position.set(pos[0], 1.5, pos[1] + 0.12)
    scene.add(glass)
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), bulletinMat)
    leg1.position.set(pos[0] - 1.8, 0.6, pos[1])
    scene.add(leg1)
    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), bulletinMat)
    leg2.position.set(pos[0] + 1.8, 0.6, pos[1])
    scene.add(leg2)
  })
}

function createBuildings() {
  buildings.value.forEach(function (building) {
    var width = building.size.width
    var height = building.size.height
    var depth = building.size.depth
    var x = building.position.x
    var z = building.position.z
    var floors = building.floors
    var floorH = height / floors

    // 建筑主体
    var facadeTex = createFacadeTexture(building.color)
    var bodyMat = new THREE.MeshStandardMaterial({
      color: building.color,
      map: facadeTex,
      roughness: 0.72,
      metalness: 0.06,
    })
    var body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat)
    body.position.set(x, height / 2, z)
    body.castShadow = true
    body.receiveShadow = true
    body.userData = { buildingId: building.id }
    scene.add(body)
    buildingMeshes.set(building.id, body)

    // 屋顶 - 根据建筑类型不同设计
    if (building.type === '体育设施') {
      // 体育馆 - 简单平顶 + 小弧形装饰
      var roofMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, roughness: 0.5 })
      var roofTop = new THREE.Mesh(new THREE.BoxGeometry(width, 1, depth), roofMat)
      roofTop.position.set(x, height + 0.5, z)
      roofTop.castShadow = true
      scene.add(roofTop)
    } else if (floors <= 2) {
      // 矮建筑 - 简单平顶
      var roofMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 })
      var roofTop = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.8, depth + 0.5), roofMat)
      roofTop.position.set(x, height + 0.4, z)
      roofTop.castShadow = true
      scene.add(roofTop)
    } else {
      // 高楼 - 平顶 + 装饰
      var roofMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.5 })
      var roofTop = new THREE.Mesh(new THREE.BoxGeometry(width + 1, 0.5, depth + 1), roofMat)
      roofTop.position.set(x, height + 0.25, z)
      roofTop.castShadow = true
      scene.add(roofTop)

      // 顶部装饰围栏
      var railMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae })
      var rail1 = new THREE.Mesh(new THREE.BoxGeometry(width + 1, 0.8, 0.2), railMat)
      rail1.position.set(x, height + 0.9, z + depth / 2 + 0.4)
      scene.add(rail1)
      var rail2 = new THREE.Mesh(new THREE.BoxGeometry(width + 1, 0.8, 0.2), railMat)
      rail2.position.set(x, height + 0.9, z - depth / 2 - 0.4)
      scene.add(rail2)
    }

    // 窗户 - 前后两面
    var winDayMat = new THREE.MeshStandardMaterial({
      color: 0x88bbdd,
      transparent: true,
      opacity: 0.62,
      roughness: 0.28,
      metalness: 0.3,
    })
    var winNightLitMat = new THREE.MeshStandardMaterial({
      color: 0xfff5c4,
      transparent: true,
      opacity: 0.92,
      emissive: 0xffe8a1,
      emissiveIntensity: 0.55,
    })
    var winNightDimMat = new THREE.MeshStandardMaterial({
      color: 0x394a61,
      transparent: true,
      opacity: 0.78,
      emissive: 0x0c1a2d,
      emissiveIntensity: 0.08,
    })
    function getWindowMaterial() {
      if (!isNight.value) return winDayMat
      return Math.random() > 0.32 ? winNightLitMat : winNightDimMat
    }

    var winWidth = 1.8
    var winHeight = 1.4
    var wCount = Math.floor((width - 2) / 3)
    var wSpacing = (width - 2) / wCount

    for (var f = 0; f < floors; f++) {
      var yPos = f * floorH + floorH / 2 + 0.5
      for (var w = 0; w < wCount; w++) {
        var xOffset = -width / 2 + 1.5 + w * wSpacing
        // 前面窗户
        var winFront = new THREE.Mesh(new THREE.PlaneGeometry(winWidth, winHeight), getWindowMaterial())
        winFront.position.set(x + xOffset, yPos, z + depth / 2 + 0.05)
        scene.add(winFront)
        // 窗框
        var frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
        var frameTop = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.2, 0.1, 0.1), frameMat)
        frameTop.position.set(x + xOffset, yPos + winHeight / 2, z + depth / 2 + 0.08)
        scene.add(frameTop)

        // 后面窗户
        var winBack = new THREE.Mesh(new THREE.PlaneGeometry(winWidth, winHeight), getWindowMaterial())
        winBack.position.set(x + xOffset, yPos, z - depth / 2 - 0.05)
        winBack.rotation.y = Math.PI
        scene.add(winBack)
      }
    }

    // 入口大门
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.7 })
    var doorWidth = Math.min(4, width / 3)
    var doorHeight = Math.min(floorH * 0.8, 4)
    var door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.2), doorMat)
    door.position.set(x, doorHeight / 2, z + depth / 2 + 0.1)
    scene.add(door)

    // 门框
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
    var frameL = new THREE.Mesh(new THREE.BoxGeometry(0.3, doorHeight + 0.5, 0.3), frameMat)
    frameL.position.set(x - doorWidth / 2 - 0.15, doorHeight / 2, z + depth / 2 + 0.15)
    scene.add(frameL)
    var frameR = new THREE.Mesh(new THREE.BoxGeometry(0.3, doorHeight + 0.5, 0.3), frameMat)
    frameR.position.set(x + doorWidth / 2 + 0.15, doorHeight / 2, z + depth / 2 + 0.15)
    scene.add(frameR)
    var frameTop = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 0.6, 0.4, 0.3), frameMat)
    frameTop.position.set(x, doorHeight + 0.2, z + depth / 2 + 0.15)
    scene.add(frameTop)

    // 楼层分隔线
    var lineMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e })
    for (var f = 1; f < floors; f++) {
      var lineY = f * floorH
      var lineFront = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.15, 0.1), lineMat)
      lineFront.position.set(x, lineY, z + depth / 2 + 0.05)
      scene.add(lineFront)
    }

    // 底部装饰基座
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x757575 })
    var base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.5, depth + 0.5), baseMat)
    base.position.set(x, 0.25, z)
    scene.add(base)

    // 侧面窗户
    var sideWCount = Math.floor((depth - 2) / 3)
    var sideSpacing = (depth - 2) / Math.max(sideWCount, 1)
    for (var f = 0; f < floors; f++) {
      var yPos = f * floorH + floorH / 2 + 0.5
      for (var w = 0; w < sideWCount; w++) {
        var zOffset = -depth / 2 + 1.5 + w * sideSpacing
        // 左侧窗户
        var winL = new THREE.Mesh(new THREE.PlaneGeometry(winWidth, winHeight), getWindowMaterial())
        winL.rotation.y = -Math.PI / 2
        winL.position.set(x - width / 2 - 0.05, yPos, z + zOffset)
        scene.add(winL)
        // 右侧窗户
        var winR = new THREE.Mesh(new THREE.PlaneGeometry(winWidth, winHeight), getWindowMaterial())
        winR.rotation.y = Math.PI / 2
        winR.position.set(x + width / 2 + 0.05, yPos, z + zOffset)
        scene.add(winR)
      }
    }

    // 空调外机 (宿舍和办公楼)
    if (building.type === '宿舍' || building.type === '行政' || building.type === '科研') {
      var acMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 })
      for (var f = 0; f < floors; f++) {
        var acY = f * floorH + floorH / 2
        for (var a = 0; a < 2; a++) {
          var acX = x + (a === 0 ? -width / 4 : width / 4)
          var ac = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.4), acMat)
          ac.position.set(acX, acY, z - depth / 2 - 0.2)
          scene.add(ac)
        }
      }
    }

    // 阳台 (宿舍楼)
    if (building.type === '宿舍') {
      var balconyMat = new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
      var railMat = new THREE.MeshStandardMaterial({ color: 0x757575 })
      for (var f = 1; f < floors; f++) {
        var balconyY = f * floorH
        var balcony = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.15, 1.2), balconyMat)
        balcony.position.set(x, balconyY, z + depth / 2 + 0.6)
        scene.add(balcony)
        // 阳台栏杆
        var railFront = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.8, 0.08), railMat)
        railFront.position.set(x, balconyY + 0.4, z + depth / 2 + 1.1)
        scene.add(railFront)
      }
    }

    // 楼顶设备 (高楼)
    if (floors >= 6) {
      // 电梯机房
      var elevMat = new THREE.MeshStandardMaterial({ color: 0x78909c })
      var elevRoom = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), elevMat)
      elevRoom.position.set(x, height + 1.5, z)
      scene.add(elevRoom)

      // 天线/避雷针
      var antennaMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.6 })
      var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 8), antennaMat)
      antenna.position.set(x, height + 5.5, z)
      scene.add(antenna)

      // 水箱
      var tankMat = new THREE.MeshStandardMaterial({ color: 0x42a5f5 })
      var tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2, 16), tankMat)
      tank.position.set(x - 3, height + 1, z - 2)
      scene.add(tank)
    }

    // 入口台阶
    var stepMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e })
    for (var s = 0; s < 3; s++) {
      var step = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 2, 0.2, 0.8 - s * 0.2), stepMat)
      step.position.set(x, 0.1 + s * 0.2, z + depth / 2 + 1.5 + s * 0.4)
      scene.add(step)
    }

    // 入口雨棚
    var canopyMat = new THREE.MeshStandardMaterial({
      color: 0x607d8b,
      transparent: true,
      opacity: 0.8,
    })
    var canopy = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 3, 0.15, 2), canopyMat)
    canopy.position.set(x, doorHeight + 0.8, z + depth / 2 + 1)
    scene.add(canopy)
  })
}

function createDecorations() {
  // 中心广场 - 更大更精细
  var plazaMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e })
  var plaza = new THREE.Mesh(new THREE.CircleGeometry(25, 48), plazaMat)
  plaza.rotation.x = -Math.PI / 2
  plaza.position.set(0, 0.03, -60)
  scene.add(plaza)
  // 广场装饰圆环
  var ringMat = new THREE.MeshStandardMaterial({ color: 0x757575 })
  var ring1 = new THREE.Mesh(new THREE.RingGeometry(20, 22, 48), ringMat)
  ring1.rotation.x = -Math.PI / 2
  ring1.position.set(0, 0.04, -60)
  scene.add(ring1)
  var ring2 = new THREE.Mesh(new THREE.RingGeometry(12, 13, 48), ringMat)
  ring2.rotation.x = -Math.PI / 2
  ring2.position.set(0, 0.04, -60)
  scene.add(ring2)

  // 中央雕塑/校标
  var sculptBaseMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 })
  var sculptBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 1.5, 32), sculptBaseMat)
  sculptBase.position.set(0, 0.75, -60)
  scene.add(sculptBase)
  var sculptPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 2, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63 }),
  )
  sculptPillar.position.set(0, 4.5, -60)
  scene.add(sculptPillar)
  var sculptTop = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.6 }),
  )
  sculptTop.position.set(0, 9, -60)
  scene.add(sculptTop)

  // 广场周围长椅
  var benchPositions = [
    [18, -60],
    [-18, -60],
    [12, -50],
    [-12, -50],
    [12, -70],
    [-12, -70],
  ]
  benchPositions.forEach(function (pos) {
    var benchGroup = new THREE.Group()
    var seatMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 })
    var seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.8), seatMat)
    seat.position.y = 0.5
    benchGroup.add(seat)
    var back = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 0.1), seatMat)
    back.position.set(0, 0.9, -0.35)
    benchGroup.add(back)
    var legMat = new THREE.MeshStandardMaterial({ color: 0x424242 })
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), legMat)
    leg1.position.set(-1.2, 0.25, 0)
    benchGroup.add(leg1)
    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), legMat)
    leg2.position.set(1.2, 0.25, 0)
    benchGroup.add(leg2)
    benchGroup.position.set(pos[0], 0, pos[1])
    benchGroup.lookAt(0, 0, -60)
    scene.add(benchGroup)
  })

  // 林荫道 - 通往各个区域
  var pathMat = new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
  // 从广场到图书馆
  var pathToLib = new THREE.Mesh(new THREE.PlaneGeometry(8, 55), pathMat)
  pathToLib.rotation.x = -Math.PI / 2
  pathToLib.position.set(0, 0.025, -5)
  scene.add(pathToLib)
  // 从广场到东侧教学区
  var pathToEast = new THREE.Mesh(new THREE.PlaneGeometry(50, 6), pathMat)
  pathToEast.rotation.x = -Math.PI / 2
  pathToEast.position.set(35, 0.025, -60)
  scene.add(pathToEast)
  // 从广场到西侧科研区
  var pathToWest = new THREE.Mesh(new THREE.PlaneGeometry(50, 6), pathMat)
  pathToWest.rotation.x = -Math.PI / 2
  pathToWest.position.set(-35, 0.025, -60)
  scene.add(pathToWest)

  // 林荫道两侧的树
  for (var t = -35; t <= 35; t += 10) {
    if (Math.abs(t) > 5) {
      // 东西向林荫道的树 - 圆形树冠
      createTree(t, -55, 1, 'round')
      createTree(t, -65, 1, 'round')
    }
  }
  for (var t = -30; t <= 15; t += 8) {
    // 南北向林荫道的树 - 松树
    createTree(-6, t, 0.9, 'pine')
    createTree(6, t, 0.9, 'pine')
  }

  function createTree(x, z, scale = 1, type = 'round') {
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 })
    var trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 2.5 * scale, 8)
    var trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.set(x, 1.25 * scale, z)
    trunk.castShadow = true
    scene.add(trunk)

    // 随机叶子颜色
    var colors = [0x2e7d32, 0x388e3c, 0x43a047, 0x4caf50, 0x66bb6a]
    var color = colors[Math.floor(Math.random() * colors.length)]
    var foliageMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 })

    var foliage
    if (type === 'round') {
      foliage = new THREE.Mesh(new THREE.SphereGeometry(1.5 * scale, 12, 10), foliageMat)
      foliage.position.set(x, 3.5 * scale, z)
    } else if (type === 'pine') {
      foliage = new THREE.Group()
      var cones = 3
      for (var i = 0; i < cones; i++) {
        var s = scale * (1 - i * 0.2)
        var cone = new THREE.Mesh(new THREE.ConeGeometry(1.5 * s, 3 * s, 8), foliageMat)
        cone.position.set(0, (2.5 + i * 1.5) * scale, 0)
        cone.castShadow = true
        foliage.add(cone)
      }
      foliage.position.set(x, 0, z)
    } else {
      // cone
      foliage = new THREE.Mesh(new THREE.ConeGeometry(1.5 * scale, 4 * scale, 8), foliageMat)
      foliage.position.set(x, 3 * scale, z)
    }

    foliage.castShadow = true
    scene.add(foliage)
  }

  createClouds()
  createBirds()

  function createClouds() {
    if (isNight.value) return

    var cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
    })

    for (var i = 0; i < 15; i++) {
      var cloudGroup = new THREE.Group()
      var chunks = 3 + Math.floor(Math.random() * 4)
      for (var j = 0; j < chunks; j++) {
        var size = 4 + Math.random() * 6
        var sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), cloudMat)
        sphere.position.set(
          (Math.random() - 0.5) * size * 1.5,
          (Math.random() - 0.5) * size * 0.5,
          (Math.random() - 0.5) * size * 1.2,
        )
        cloudGroup.add(sphere)
      }
      cloudGroup.position.set(
        (Math.random() - 0.5) * 400,
        60 + Math.random() * 40,
        (Math.random() - 0.5) * 400,
      )
      cloudGroup.rotation.y = Math.random() * Math.PI * 2
      scene.add(cloudGroup)
      registerCloud(cloudGroup)
    }
  }

  function createBirds() {
    var birdMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    var birdGeo = new THREE.BufferGeometry()
    // V形
    var vertices = new Float32Array([
      0.5,
      0,
      0.2, // 右翼尖
      0,
      0,
      -0.3, // 头/中心
      -0.5,
      0,
      0.2, // 左翼尖
      0,
      -0.1,
      0, // 腹部
    ])
    var indices = [0, 1, 3, 1, 2, 3, 0, 3, 2, 0, 2, 1]
    birdGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    birdGeo.setIndex(indices)

    for (var i = 0; i < 20; i++) {
      var bird = new THREE.Mesh(birdGeo, birdMat)
      bird.position.set(
        (Math.random() - 0.5) * 300,
        40 + Math.random() * 30,
        (Math.random() - 0.5) * 300,
      )
      bird.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.5,
        )
          .normalize()
          .multiplyScalar(0.2 + Math.random() * 0.3),
        phase: Math.random() * Math.PI * 2,
      }
      scene.add(bird)
      birds.push(bird)
    }
  }

  // 图书馆前广场

  var fountain = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 4, 2, 16),
    new THREE.MeshStandardMaterial({ color: 0x666666 }),
  )
  fountain.position.y = 1
  scene.add(fountain)

  var track = new THREE.Mesh(
    new THREE.RingGeometry(18, 25, 48),
    new THREE.MeshStandardMaterial({ color: 0xcc4444 }),
  )
  track.rotation.x = -Math.PI / 2
  track.position.set(55, 0.02, -50)
  scene.add(track)

  var field = new THREE.Mesh(
    new THREE.CircleGeometry(17, 48),
    new THREE.MeshStandardMaterial({ color: isNight.value ? 0x1a4a1a : 0x2d8a27 }),
  )
  field.rotation.x = -Math.PI / 2
  field.position.set(55, 0.025, -50)
  scene.add(field)

  // 操场中圈线
  var centerCircle = new THREE.Mesh(
    new THREE.RingGeometry(4, 4.3, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  )
  centerCircle.rotation.x = -Math.PI / 2
  centerCircle.position.set(55, 0.03, -50)
  scene.add(centerCircle)
  // 中线
  var midLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 34),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  )
  midLine.rotation.x = -Math.PI / 2
  midLine.position.set(55, 0.03, -50)
  scene.add(midLine)

  // 球门（两个）
  var goalMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.5 })
  for (var gi = 0; gi < 2; gi++) {
    var gz = -50 + (gi === 0 ? -16.5 : 16.5)
    // 门框两侧立柱
    var gPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 8), goalMat)
    gPost1.position.set(55 - 3, 1.5, gz)
    scene.add(gPost1)
    var gPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 8), goalMat)
    gPost2.position.set(55 + 3, 1.5, gz)
    scene.add(gPost2)
    // 横梁
    var gBar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.3, 8), goalMat)
    gBar.rotation.z = Math.PI / 2
    gBar.position.set(55, 3, gz)
    scene.add(gBar)
  }

  // 跑道分道线
  var laneMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
  for (var lane = 0; lane < 5; lane++) {
    var laneR = 19 + lane * 1.4
    var laneLine = new THREE.Mesh(new THREE.RingGeometry(laneR, laneR + 0.1, 48), laneMat)
    laneLine.rotation.x = -Math.PI / 2
    laneLine.position.set(55, 0.025, -50)
    scene.add(laneLine)
  }

  // 大量树木覆盖整个校园
  var treePositions = [
    // 校园中心区域
    [-20, 15],
    [-25, -15],
    [20, 15],
    [25, -15],
    [-40, 25],
    [-40, -25],
    [40, 25],
    [40, -15],
    [-15, 40],
    [15, 40],
    [-60, 0],
    [60, 0],
    // 湖边
    [-140, -50],
    [-145, -60],
    [-150, -45],
    [-60, -70],
    [-55, -85],
    [-65, -95],
    [-130, -100],
    [-135, -110],
    [-125, -115],
    [-70, -110],
    [-75, -100],
    // 山脚下
    [-160, -120],
    [-170, -115],
    [-145, -130],
    [-140, -140],
    [150, -100],
    [140, -110],
    [165, -130],
    // 道路两侧
    [-100, 5],
    [-100, -5],
    [-70, 5],
    [-70, -5],
    [70, 5],
    [70, -5],
    [100, 5],
    [100, -5],
    [-140, 5],
    [-140, -5],
    [140, 5],
    [140, -5],
    // 建筑周围
    [-90, 50],
    [-95, 45],
    [90, 50],
    [95, 45],
    [-90, -10],
    [90, -10],
    [120, 15],
    [120, -15],
    [-120, 15],
    [-120, -15],
    // 远处边缘
    [-180, 0],
    [-180, 30],
    [-180, -30],
    [180, 0],
    [180, 30],
    [180, -30],
    [-150, 80],
    [-140, 75],
    [150, 80],
    [140, 75],
    [0, -100],
    [15, -105],
    [-15, -105],
    [30, -100],
    [-30, -100],
  ]
  treePositions.forEach(function (pos) {
    var x = pos[0]
    var z = pos[1]
    var scale = 0.7 + Math.random() * 0.6
    // 树干
    var trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a3728 }),
    )
    trunk.position.set(x, 1.5 * scale, z)
    trunk.castShadow = true
    scene.add(trunk)
    // 多层树冠
    for (var layer = 0; layer < 3; layer++) {
      var leafSize = (2.5 - layer * 0.5) * scale
      var leafHeight = (5 - layer * 1.5) * scale
      var foliage = new THREE.Mesh(
        new THREE.ConeGeometry(leafSize, leafHeight, 8),
        new THREE.MeshStandardMaterial({ color: isNight.value ? 0x1a3a1a : 0x228b22 }),
      )
      foliage.position.set(x, (4 + layer * 1.8) * scale, z)
      foliage.castShadow = true
      scene.add(foliage)
    }
  })

  var lampPositions = [
    [-20, 8],
    [20, 8],
    [-20, -8],
    [20, -8],
    [-40, 0],
    [40, 0],
  ]
  lampPositions.forEach(function (pos) {
    var x = pos[0]
    var z = pos[1]
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 5, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444 }),
    )
    pole.position.set(x, 2.5, z)
    scene.add(pole)

    if (isNight.value) {
      var light = new THREE.PointLight(0xffdd88, 15, 14, 2)
      light.position.set(x, 5, z)
      scene.add(light)

      var glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: 0xffffcc,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        }),
      )
      glow.position.set(x, 5, z)
      glow.scale.set(3.4, 3.4, 1)
      glow.userData.phase = Math.random() * Math.PI * 2
      scene.add(glow)
      lampHalos.push(glow)
    }
  })

  // 云彩 (日间模式)
  if (!isNight.value) {
    var cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    })
    var cloudPositions = [
      [-30, 60, -40],
      [40, 55, 20],
      [-50, 70, 30],
      [60, 65, -30],
      [0, 58, 50],
      [20, 72, -50],
    ]
    cloudPositions.forEach(function (pos) {
      var cloudGroup = new THREE.Group()
      // 云朵由多个球体组成
      for (var i = 0; i < 5; i++) {
        var size = 3 + Math.random() * 4
        var sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), cloudMat)
        sphere.position.set(i * 3 - 6, Math.random() * 2, Math.random() * 3 - 1.5)
        cloudGroup.add(sphere)
      }
      cloudGroup.position.set(pos[0], pos[1], pos[2])
      scene.add(cloudGroup)
      registerCloud(cloudGroup)
    })
  }

  // 旗杆
  var poleMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 })
  var flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 15, 12), poleMat)
  flagPole.position.set(0, 7.5, 25)
  scene.add(flagPole)
  // 旗帜
  var flagMat = new THREE.MeshBasicMaterial({ color: 0xcc0000, side: THREE.DoubleSide })
  var flag = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), flagMat)
  flag.position.set(2.5, 13, 25)
  scene.add(flag)
  // 旗杆底座
  var baseMat = new THREE.MeshStandardMaterial({ color: 0x8b8b8b })
  var flagBase = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 0.5, 16), baseMat)
  flagBase.position.set(0, 0.25, 25)
  scene.add(flagBase)

  // 花坛
  var flowerBedPositions = [
    [-15, 8],
    [15, 8],
    [-15, -8],
    [15, -8],
  ]
  flowerBedPositions.forEach(function (pos) {
    // 花坛边框
    var borderMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    var border = new THREE.Mesh(new THREE.TorusGeometry(2, 0.3, 8, 16), borderMat)
    border.rotation.x = Math.PI / 2
    border.position.set(pos[0], 0.3, pos[1])
    scene.add(border)
    // 土壤
    var soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 })
    var soil = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16), soilMat)
    soil.position.set(pos[0], 0.15, pos[1])
    scene.add(soil)
    // 花朵
    var flowerColors = [0xff69b4, 0xffeb3b, 0xff5722, 0x9c27b0, 0x4caf50]
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2
      var r = 0.8 + Math.random() * 0.8
      var flowerMat = new THREE.MeshBasicMaterial({ color: flowerColors[i % 5] })
      var flower = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), flowerMat)
      flower.position.set(pos[0] + Math.cos(angle) * r, 0.5, pos[1] + Math.sin(angle) * r)
      scene.add(flower)
    }
  })

  // 长椅
  var benchPositions = [
    [-8, 12],
    [8, 12],
    [-8, -12],
    [8, -12],
  ]
  benchPositions.forEach(function (pos) {
    var benchGroup = new THREE.Group()
    // 座面
    var seatMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 })
    var seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.8), seatMat)
    seat.position.y = 0.5
    benchGroup.add(seat)
    // 靠背
    var back = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 0.1), seatMat)
    back.position.set(0, 0.9, -0.35)
    benchGroup.add(back)
    // 腿
    var legMat = new THREE.MeshStandardMaterial({ color: 0x424242 })
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), legMat)
    leg1.position.set(-1.2, 0.25, 0)
    benchGroup.add(leg1)
    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.6), legMat)
    leg2.position.set(1.2, 0.25, 0)
    benchGroup.add(leg2)
    benchGroup.position.set(pos[0], 0, pos[1])
    scene.add(benchGroup)
  })

  // 垃圾桶
  var binPositions = [
    [-12, 5],
    [12, 5],
    [-12, -5],
    [12, -5],
  ]
  binPositions.forEach(function (pos) {
    var binMat = new THREE.MeshStandardMaterial({ color: 0x388e3c })
    var bin = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 1, 12), binMat)
    bin.position.set(pos[0], 0.5, pos[1])
    scene.add(bin)
    // 盖子
    var lidMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
    var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12), lidMat)
    lid.position.set(pos[0], 1.05, pos[1])
    scene.add(lid)
  })

  // 停车场
  var parkingX = -70
  var parkingZ = -35
  // 停车场地面
  var parkingGround = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 20),
    new THREE.MeshStandardMaterial({ color: 0x424242 }),
  )
  parkingGround.rotation.x = -Math.PI / 2
  parkingGround.position.set(parkingX, 0.02, parkingZ)
  scene.add(parkingGround)
  // 停车位线
  var lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  for (var i = 0; i < 5; i++) {
    var lineV = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 5), lineMat)
    lineV.rotation.x = -Math.PI / 2
    lineV.position.set(parkingX - 10 + i * 5, 0.03, parkingZ)
    scene.add(lineV)
  }
  // 汽车
  var carColors = [0x1565c0, 0xc62828, 0xffffff, 0x212121, 0x2e7d32]
  for (var c = 0; c < 4; c++) {
    var carX = parkingX - 7.5 + c * 5
    var carZ = parkingZ
    var carGroup = new THREE.Group()
    // 车身
    var bodyMat = new THREE.MeshStandardMaterial({
      color: carColors[c],
      metalness: 0.6,
      roughness: 0.3,
    })
    var carBody = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 1.8), bodyMat)
    carBody.position.y = 0.7
    carGroup.add(carBody)
    // 车顶
    var carTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.6), bodyMat)
    carTop.position.set(-0.3, 1.5, 0)
    carGroup.add(carTop)
    // 车窗
    var winMat = new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.7,
    })
    var carWin = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.6), winMat)
    carWin.position.set(0.8, 1.5, 0)
    carWin.rotation.y = Math.PI / 2
    carGroup.add(carWin)
    // 车轮
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x212121 })
    var wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16)
    var positions = [
      [1.2, 0.35, 0.9],
      [1.2, 0.35, -0.9],
      [-1.2, 0.35, 0.9],
      [-1.2, 0.35, -0.9],
    ]
    positions.forEach(function (p) {
      var wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.rotation.x = Math.PI / 2
      wheel.position.set(p[0], p[1], p[2])
      carGroup.add(wheel)
    })
    carGroup.position.set(carX, 0, carZ)
    carGroup.rotation.y = Math.PI / 2
    scene.add(carGroup)
  }

  // 自行车棚
  var bikeX = -65
  var bikeZ = 25
  // 棚顶
  var shedMat = new THREE.MeshStandardMaterial({ color: 0x78909c, transparent: true, opacity: 0.8 })
  var shedRoof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.15, 5), shedMat)
  shedRoof.position.set(bikeX, 2.5, bikeZ)
  scene.add(shedRoof)
  // 支柱
  var pillarMat = new THREE.MeshStandardMaterial({ color: 0x607d8b })
  var pillarPositions = [
    [-5, 0, -2],
    [-5, 0, 2],
    [5, 0, -2],
    [5, 0, 2],
  ]
  pillarPositions.forEach(function (p) {
    var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8), pillarMat)
    pillar.position.set(bikeX + p[0], 1.25, bikeZ + p[2])
    scene.add(pillar)
  })
  // 自行车
  var bikeMat = new THREE.MeshStandardMaterial({ color: 0x1976d2 })
  for (var b = 0; b < 6; b++) {
    var bikeGroup = new THREE.Group()
    // 车架
    var frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), bikeMat)
    frame.position.y = 0.5
    frame.rotation.z = 0.3
    bikeGroup.add(frame)
    // 车轮
    var bikeWheelMat = new THREE.MeshStandardMaterial({ color: 0x424242 })
    var wheel1 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 16), bikeWheelMat)
    wheel1.position.set(-0.5, 0.35, 0)
    bikeGroup.add(wheel1)
    var wheel2 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 16), bikeWheelMat)
    wheel2.position.set(0.5, 0.35, 0)
    bikeGroup.add(wheel2)
    bikeGroup.position.set(bikeX - 4 + b * 1.5, 0, bikeZ)
    scene.add(bikeGroup)
  }

  // 公告栏
  var boardX = 20
  var boardZ = 30
  // 支架
  var boardFrameMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 })
  var boardLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), boardFrameMat)
  boardLeg1.position.set(boardX - 1.5, 1.25, boardZ)
  scene.add(boardLeg1)
  var boardLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), boardFrameMat)
  boardLeg2.position.set(boardX + 1.5, 1.25, boardZ)
  scene.add(boardLeg2)
  // 板面
  var boardMat = new THREE.MeshStandardMaterial({ color: 0xefebe9 })
  var boardPanel = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2, 0.1), boardMat)
  boardPanel.position.set(boardX, 2, boardZ)
  scene.add(boardPanel)
  // 顶部标题
  var titleMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c })
  var boardTitle = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 0.12), titleMat)
  boardTitle.position.set(boardX, 2.8, boardZ)
  scene.add(boardTitle)

  // 校园标识牌
  var signX = -20
  var signZ = 45
  // 立柱
  var signPoleMat = new THREE.MeshStandardMaterial({ color: 0x37474f })
  var signPole = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), signPoleMat)
  signPole.position.set(signX, 1.5, signZ)
  scene.add(signPole)
  // 指示牌
  var signColors = [0x1976d2, 0x388e3c, 0xf57c00]
  var signTexts = ['教学楼 →', '← 图书馆', '食堂 ↑']
  for (var s = 0; s < 3; s++) {
    var signMat = new THREE.MeshStandardMaterial({ color: signColors[s] })
    var signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.1), signMat)
    signBoard.position.set(signX + 1.25, 2.5 - s * 0.6, signZ)
    scene.add(signBoard)
  }

  // 篮球场
  var courtX = 60
  var courtZ = 40
  // 场地
  var courtMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1 })
  var court = new THREE.Mesh(new THREE.PlaneGeometry(15, 10), courtMat)
  court.rotation.x = -Math.PI / 2
  court.position.set(courtX, 0.02, courtZ)
  scene.add(court)
  // 边线
  var courtLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  var courtBorder = new THREE.Mesh(new THREE.RingGeometry(7.4, 7.5, 4), courtLineMat)
  courtBorder.rotation.x = -Math.PI / 2
  courtBorder.rotation.z = Math.PI / 4
  courtBorder.position.set(courtX, 0.03, courtZ)
  scene.add(courtBorder)
  // 中圈
  var centerCircle = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.6, 32), courtLineMat)
  centerCircle.rotation.x = -Math.PI / 2
  centerCircle.position.set(courtX, 0.03, courtZ)
  scene.add(centerCircle)
  // 篮球架
  for (var h = 0; h < 2; h++) {
    var hoopX = courtX + (h === 0 ? -7 : 7)
    // 支柱
    var hoopPoleMat = new THREE.MeshStandardMaterial({ color: 0x757575, metalness: 0.5 })
    var hoopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 4, 8), hoopPoleMat)
    hoopPole.position.set(hoopX, 2, courtZ)
    scene.add(hoopPole)
    // 篮板
    var backboardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    })
    var backboard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.08), backboardMat)
    backboard.position.set(hoopX + (h === 0 ? 0.5 : -0.5), 3.5, courtZ)
    scene.add(backboard)
    // 篮筐
    var rimMat = new THREE.MeshStandardMaterial({ color: 0xff5722, metalness: 0.6 })
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 8, 16), rimMat)
    rim.rotation.x = Math.PI / 2
    rim.position.set(hoopX + (h === 0 ? 0.8 : -0.8), 3.1, courtZ)
    scene.add(rim)
  }

  // ========== 校门 ==========
  var gateZ = 65

  // 主门柱（左右各一个）
  var pillarMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 })
  var pillarCapMat = new THREE.MeshStandardMaterial({ color: 0xa1887f })

  // 左门柱
  var leftPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 3), pillarMat)
  leftPillar.position.set(-12, 4, gateZ)
  scene.add(leftPillar)
  var leftCap = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 3.5), pillarCapMat)
  leftCap.position.set(-12, 8.25, gateZ)
  scene.add(leftCap)
  // 左柱顶装饰球
  var sphereMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
  var leftSphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), sphereMat)
  leftSphere.position.set(-12, 9.3, gateZ)
  scene.add(leftSphere)

  // 右门柱
  var rightPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 3), pillarMat)
  rightPillar.position.set(12, 4, gateZ)
  scene.add(rightPillar)
  var rightCap = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 3.5), pillarCapMat)
  rightCap.position.set(12, 8.25, gateZ)
  scene.add(rightCap)
  var rightSphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), sphereMat)
  rightSphere.position.set(12, 9.3, gateZ)
  scene.add(rightSphere)

  // 校名横匾
  var signBaseMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c })
  var schoolSign = new THREE.Mesh(new THREE.BoxGeometry(20, 2.5, 0.5), signBaseMat)
  schoolSign.position.set(0, 9, gateZ)
  scene.add(schoolSign)
  // 校名装饰边框
  var borderMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6 })
  var signBorderTop = new THREE.Mesh(new THREE.BoxGeometry(21, 0.2, 0.6), borderMat)
  signBorderTop.position.set(0, 10.35, gateZ)
  scene.add(signBorderTop)
  var signBorderBottom = new THREE.Mesh(new THREE.BoxGeometry(21, 0.2, 0.6), borderMat)
  signBorderBottom.position.set(0, 7.65, gateZ)
  scene.add(signBorderBottom)

  // 大门铁栅栏（左侧）
  var gateMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.7 })
  for (var g = 0; g < 8; g++) {
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 8), gateMat)
    bar.position.set(-11 + g * 1.3, 2.5, gateZ + 0.5)
    scene.add(bar)
  }
  var gateTop = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 0.3), gateMat)
  gateTop.position.set(-6.5, 5.15, gateZ + 0.5)
  scene.add(gateTop)

  // 大门铁栅栏（右侧）
  for (var g = 0; g < 8; g++) {
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 8), gateMat)
    bar.position.set(2.5 + g * 1.3, 2.5, gateZ + 0.5)
    scene.add(bar)
  }
  var gateTop2 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 0.3), gateMat)
  gateTop2.position.set(6.5, 5.15, gateZ + 0.5)
  scene.add(gateTop2)

  // 门口道路
  var gateRoadMat = new THREE.MeshStandardMaterial({ color: 0x424242 })
  var gateRoad = new THREE.Mesh(new THREE.PlaneGeometry(12, 15), gateRoadMat)
  gateRoad.rotation.x = -Math.PI / 2
  gateRoad.position.set(0, 0.02, gateZ + 7)
  scene.add(gateRoad)

  // 门口人行道
  var sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e })
  var sidewalkL = new THREE.Mesh(new THREE.PlaneGeometry(3, 15), sidewalkMat)
  sidewalkL.rotation.x = -Math.PI / 2
  sidewalkL.position.set(-7.5, 0.025, gateZ + 7)
  scene.add(sidewalkL)
  var sidewalkR = new THREE.Mesh(new THREE.PlaneGeometry(3, 15), sidewalkMat)
  sidewalkR.rotation.x = -Math.PI / 2
  sidewalkR.position.set(7.5, 0.025, gateZ + 7)
  scene.add(sidewalkR)

  // 围墙
  var wallMat = new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
  var wallTopMat = new THREE.MeshStandardMaterial({ color: 0x757575 })
  // 左侧围墙
  var wallL = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 0.5), wallMat)
  wallL.position.set(-38, 1.5, gateZ)
  scene.add(wallL)
  var wallTopL = new THREE.Mesh(new THREE.BoxGeometry(50, 0.3, 0.8), wallTopMat)
  wallTopL.position.set(-38, 3.15, gateZ)
  scene.add(wallTopL)
  // 右侧围墙
  var wallR = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 0.5), wallMat)
  wallR.position.set(38, 1.5, gateZ)
  scene.add(wallR)
  var wallTopR = new THREE.Mesh(new THREE.BoxGeometry(50, 0.3, 0.8), wallTopMat)
  wallTopR.position.set(38, 3.15, gateZ)
  scene.add(wallTopR)

  // ========== 校标/校徽 ==========
  // 位于中心广场
  var emblemX = 0
  var emblemZ = 0
  // 基座
  var emblemBaseMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 })
  var emblemBase1 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4, 1, 32), emblemBaseMat)
  emblemBase1.position.set(emblemX, 0.5, emblemZ)
  scene.add(emblemBase1)
  var emblemBase2 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 1, 32), emblemBaseMat)
  emblemBase2.position.set(emblemX, 1.5, emblemZ)
  scene.add(emblemBase2)
  // 校徽柱
  var emblemPillarMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
  var emblemPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 4, 16), emblemPillarMat)
  emblemPillar.position.set(emblemX, 4, emblemZ)
  scene.add(emblemPillar)
  // 校徽（圆形）
  var emblemMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.5 })
  var emblem = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.3, 32), emblemMat)
  emblem.position.set(emblemX, 6.5, emblemZ)
  scene.add(emblem)
  // 校徽内圈
  var emblemInnerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
  var emblemInner = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.35, 32), emblemInnerMat)
  emblemInner.position.set(emblemX, 6.5, emblemZ)
  scene.add(emblemInner)
  // 校徽顶部装饰
  var starMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
  var star = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), starMat)
  star.position.set(emblemX, 7.5, emblemZ)
  star.rotation.y = Math.PI / 4
  scene.add(star)

  // 喷泉（在校徽周围）
  var fountainRingMat = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    transparent: true,
    opacity: 0.7,
  })
  var fountainRing = new THREE.Mesh(new THREE.TorusGeometry(5, 0.8, 16, 32), fountainRingMat)
  fountainRing.rotation.x = Math.PI / 2
  fountainRing.position.set(emblemX, 0.4, emblemZ)
  scene.add(fountainRing)

  // ========== 行走的人物（火柴人）==========
  var personPaths = [
    { sx: -30, sz: 0, ex: 30, ez: 0 },
    { sx: 0, sz: -40, ex: 0, ez: 40 },
    { sx: 50, sz: 20, ex: 80, ez: 50 },
    { sx: -80, sz: 20, ex: -50, ez: 50 },
    { sx: -20, sz: 60, ex: 20, ez: 80 },
    { sx: 60, sz: -20, ex: 100, ez: 10 },
    { sx: -60, sz: -30, ex: -30, ez: 0 },
    { sx: 10, sz: 90, ex: -30, ez: 110 },
  ]
  var personColors = [
    0x1565c0, 0xc62828, 0x2e7d32, 0xff6f00, 0x6a1b9a, 0x00838f, 0xad1457, 0x4527a0,
  ]
  personPaths.forEach(function (path, idx) {
    var personGroup = new THREE.Group()
    var color = personColors[idx % personColors.length]
    var skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 })
    var clothMat = new THREE.MeshStandardMaterial({ color: color })
    // 头
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), skinMat)
    head.position.y = 1.8
    personGroup.add(head)
    // 身体
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8), clothMat)
    torso.position.y = 1.2
    personGroup.add(torso)
    // 腿
    var legMat = new THREE.MeshStandardMaterial({ color: 0x37474f })
    var legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), legMat)
    legL.position.set(-0.1, 0.45, 0)
    personGroup.add(legL)
    var legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), legMat)
    legR.position.set(0.1, 0.45, 0)
    personGroup.add(legR)
    // 放置在路径起点
    var t = Math.random()
    var px = path.sx + (path.ex - path.sx) * t
    var pz = path.sz + (path.ez - path.sz) * t
    personGroup.position.set(px, 0, pz)
    personGroup.userData.path = path
    personGroup.userData.progress = t
    personGroup.userData.dir = Math.random() > 0.5 ? 1 : -1
    personGroup.userData.speed = 0.12 + Math.random() * 0.1
    personGroup.userData.phase = Math.random() * Math.PI * 2
    personGroup.userData.legL = legL
    personGroup.userData.legR = legR
    // 面朝行走方向
    personGroup.lookAt(path.ex, 0, path.ez)
    scene.add(personGroup)
    walkers.push(personGroup)
  })
}

function onCanvasClick(event) {
  if (!canvasContainer.value) return
  var rect = canvasContainer.value.getBoundingClientRect()
  var mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  )
  var raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  var intersects = raycaster.intersectObjects(Array.from(buildingMeshes.values()))
  if (intersects.length > 0) {
    var bid = intersects[0].object.userData.buildingId
    selectedBuilding.value =
      buildings.value.find(function (b) {
        return b.id === bid
      }) || null
  }
}

function focusBuilding(building) {
  selectedBuilding.value = building
  camera.position.set(building.position.x + 30, building.size.height + 20, building.position.z + 30)
  controls.target.set(building.position.x, building.size.height / 2, building.position.z)
}

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value
  controls.autoRotate = autoRotate.value
}

function toggleNightMode() {
  isNight.value = !isNight.value
  clearSceneResources()
  buildingMeshes.clear()
  resetDynamicCollections()
  updateSceneMode()
  createAtmosphere()
  addLights()
  createGround()
  createBuildings()
  createDecorations()
  if (showWeather.value) {
    createWeatherParticles()
  }
  updateRendererPixelRatio()
  updatePostProcessing()
}

function toggleWeather() {
  showWeather.value = !showWeather.value
  if (showWeather.value) {
    createWeatherParticles()
  } else {
    if (weatherParticles) {
      scene.remove(weatherParticles)
      disposeObject3D(weatherParticles)
      weatherParticles = null
    }
  }
}

function createWeatherParticles() {
  if (weatherParticles) {
    scene.remove(weatherParticles)
    disposeObject3D(weatherParticles)
  }

  var particleCount = adaptivePixelRatio < 1.15 ? 1000 : adaptivePixelRatio < 1.45 ? 1600 : 2200
  var geometry = new THREE.BufferGeometry()
  var positions = new Float32Array(particleCount * 3)
  var velocities = new Float32Array(particleCount)
  var drifts = new Float32Array(particleCount)

  for (var i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 400
    positions[i * 3 + 1] = Math.random() * 100
    positions[i * 3 + 2] = (Math.random() - 0.5) * 400
    velocities[i] = 0.35 + Math.random() * 0.5
    drifts[i] = (Math.random() - 0.5) * 0.08
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.userData.velocities = velocities
  geometry.userData.drifts = drifts

  var material = new THREE.PointsMaterial({
    color: isNight.value ? 0xaaccff : 0xffffff,
    size: isNight.value ? 0.45 : 0.28,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
  })

  weatherParticles = new THREE.Points(geometry, material)
  scene.add(weatherParticles)
}

function resetCamera() {
  camera.position.set(80, 60, 80)
  controls.target.set(0, 0, 0)
  selectedBuilding.value = null
}

function toggleFullscreen() {
  if (!sceneWrapperRef.value) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    sceneWrapperRef.value.requestFullscreen()
  }
}

function onWindowResize() {
  if (!canvasContainer.value || !camera || !renderer) return
  camera.aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight
  camera.updateProjectionMatrix()
  updateRendererPixelRatio()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  var delta = worldClock.getDelta()
  var time = worldClock.elapsedTime
  tuneAdaptiveQuality(delta)
  controls.update()

  // 天气粒子动画
  if (weatherParticles) {
    var positions = weatherParticles.geometry.attributes.position.array
    var velocities = weatherParticles.geometry.userData.velocities
    var drifts = weatherParticles.geometry.userData.drifts
    for (var i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] -= velocities[i]
      positions[i * 3] += drifts[i]
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 80 + Math.random() * 20
        positions[i * 3] = (Math.random() - 0.5) * 400
        positions[i * 3 + 2] = (Math.random() - 0.5) * 400
      }
    }
    weatherParticles.geometry.attributes.position.needsUpdate = true
  }

  // 水面波动动画
  waterMeshes.forEach(function (water) {
    if (water?.geometry?.attributes?.position && water.userData.basePositions) {
      var attr = water.geometry.attributes.position
      var arr = attr.array
      var base = water.userData.basePositions
      for (var p = 0; p < arr.length; p += 3) {
        var bx = base[p]
        var by = base[p + 1]
        arr[p + 2] =
          Math.sin(time * 1.45 + bx * 0.18 + by * 0.21 + water.userData.wavePhase) * 0.09 +
          Math.cos(time * 0.82 + bx * 0.06 - by * 0.15 + water.userData.wavePhase) * 0.04
      }
      attr.needsUpdate = true
    }
  })

  cloudMeshes.forEach(function (cloud) {
    cloud.position.x += cloud.userData.drift * delta * 18
    cloud.position.y = cloud.userData.baseY + Math.sin(time * 0.6 + cloud.userData.phase) * 0.6
    if (cloud.position.x > 260) cloud.position.x = -260
    if (cloud.position.x < -260) cloud.position.x = 260
  })

  birds.forEach(function (bird) {
    var v = bird.userData.velocity
    bird.position.x += v.x
    bird.position.y += v.y
    bird.position.z += v.z

    if (Math.abs(bird.position.x) > 220) v.x *= -1
    if (bird.position.y > 95 || bird.position.y < 30) v.y *= -1
    if (Math.abs(bird.position.z) > 220) v.z *= -1

    bird.rotation.y = Math.atan2(v.x, v.z)
    bird.rotation.z = Math.sin(time * 8 + bird.userData.phase) * 0.18
  })

  walkers.forEach(function (person) {
    var path = person.userData.path
    person.userData.progress += person.userData.dir * person.userData.speed * delta * 0.25
    if (person.userData.progress > 1) {
      person.userData.progress = 1
      person.userData.dir = -1
    } else if (person.userData.progress < 0) {
      person.userData.progress = 0
      person.userData.dir = 1
    }

    var t = person.userData.progress
    var px = path.sx + (path.ex - path.sx) * t
    var pz = path.sz + (path.ez - path.sz) * t
    person.position.set(px, 0, pz)

    var lookT = Math.min(1, Math.max(0, t + person.userData.dir * 0.02))
    var lookX = path.sx + (path.ex - path.sx) * lookT
    var lookZ = path.sz + (path.ez - path.sz) * lookT
    person.lookAt(lookX, 0, lookZ)

    var legSwing = Math.sin(time * 7 + person.userData.phase) * 0.35
    person.userData.legL.rotation.x = legSwing
    person.userData.legR.rotation.x = -legSwing
    person.position.y = Math.abs(legSwing) * 0.03
  })

  lampHalos.forEach(function (halo) {
    var pulse = 0.2 + (Math.sin(time * 3.2 + halo.userData.phase) + 1) * 0.06
    halo.material.opacity = pulse
    var scale = 3.2 + Math.sin(time * 2.4 + halo.userData.phase) * 0.4
    halo.scale.set(scale, scale, 1)
  })

  if (composer) {
    composer.render()
  } else {
    renderer.render(scene, camera)
  }
}

onMounted(function () {
  initScene()
})
onUnmounted(function () {
  cancelAnimationFrame(animationId)
  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('click', onCanvasClick)
  }
  window.removeEventListener('resize', onWindowResize)
  if (weatherParticles) {
    scene?.remove(weatherParticles)
    disposeObject3D(weatherParticles)
    weatherParticles = null
  }
  clearSceneResources()
  buildingMeshes.clear()
  if (composer?.dispose) {
    composer.dispose()
  }
  composer = null
  resetDynamicCollections()
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
  if (renderer?.forceContextLoss) {
    renderer.forceContextLoss()
  }
  renderer?.dispose()
})
</script>

<style lang="scss" scoped>
.campus-container {
  min-height: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
}
.page-header {
  margin-bottom: 24px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);
  border-radius: 16px;
  color: #fff;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 4px 0 0;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.header-actions :deep(.el-button) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}
.header-actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}
.scene-wrapper {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
}
.scene-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  min-height: 600px;
}
.canvas-container {
  width: 100%;
  height: 600px;
}
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 26, 0.95);
  z-index: 10;
}
.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 188, 212, 0.3);
  border-top-color: #00bcd4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.loading-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 16px;
}
.building-info-card {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 188, 212, 0.5);
  min-width: 220px;
  max-width: 280px;
}
.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.info-icon {
  font-size: 20px;
}
.info-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}
.info-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}
.info-value {
  color: #00bcd4;
  font-size: 13px;
  font-weight: 500;
}
.info-desc {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}
.control-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
}
.control-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}
.control-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.control-item.active {
  background: rgba(0, 188, 212, 0.3);
  color: #00bcd4;
}
.stats-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #00bcd4;
}
.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}
.building-list {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}
.building-list::-webkit-scrollbar {
  width: 4px;
}
.building-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  margin: 0 0 16px;
}
.building-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
}
.building-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.building-item.active {
  background: rgba(0, 188, 212, 0.15);
  border: 1px solid rgba(0, 188, 212, 0.3);
}
.building-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}
.building-info {
  display: flex;
  flex-direction: column;
}
.building-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}
.building-type {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 1200px) {
  .scene-wrapper {
    grid-template-columns: 1fr;
  }
  .building-list {
    max-height: 320px;
  }
}

@media (max-width: 768px) {
  .campus-container {
    padding: 16px;
  }
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
  }
  .scene-card {
    min-height: 500px;
  }
  .canvas-container {
    height: 500px;
  }
  .stats-panel {
    top: 12px;
    right: 12px;
    gap: 10px;
    padding: 8px 10px;
  }
  .control-panel {
    left: 12px;
    right: 12px;
    transform: none;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>
