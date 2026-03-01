<template>
  <div class="spline-container">
    <!-- 头部区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <el-icon :size="28"><View /></el-icon>
          </div>
          <div class="header-text">
            <h1 class="page-title">3D 可视化</h1>
            <p class="page-subtitle">沉浸式 3D 交互体验</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button :icon="Refresh" circle @click="reloadScene" />
          <el-button :icon="FullScreen" circle @click="toggleFullscreen" />
        </div>
      </div>
    </div>

    <!-- 3D 场景区域 -->
    <div class="scene-wrapper" ref="sceneWrapperRef">
      <div class="scene-card">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p class="loading-text">正在加载 3D 场景...</p>
          <div class="loading-progress">
            <div
              class="progress-bar"
              :style="{ width: loadingProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- Spline 3D Canvas -->
        <canvas ref="canvasRef" class="spline-canvas"></canvas>

        <!-- 场景控制面板 -->
        <div class="scene-controls" v-if="!loading">
          <div class="control-group">
            <span class="control-label">旋转</span>
            <el-switch v-model="autoRotate" @change="toggleAutoRotate" />
          </div>
          <div class="control-group">
            <span class="control-label">缩放</span>
            <el-slider
              v-model="zoomLevel"
              :min="50"
              :max="150"
              :show-tooltip="false"
              @change="handleZoom"
            />
          </div>
        </div>

        <!-- 场景信息 -->
        <div class="scene-info" v-if="sceneLoaded">
          <div class="info-item">
            <el-icon><Clock /></el-icon>
            <span>FPS: {{ fps }}</span>
          </div>
          <div class="info-item">
            <el-icon><Cpu /></el-icon>
            <span>Objects: {{ objectCount }}</span>
          </div>
        </div>
      </div>

      <!-- 示例场景选择器 -->
      <div class="scene-selector">
        <h3 class="selector-title">场景选择</h3>
        <div class="scene-grid">
          <div
            v-for="scene in sceneList"
            :key="scene.id"
            class="scene-item"
            :class="{ active: currentScene === scene.id }"
            @click="loadScene(scene)"
          >
            <div class="scene-preview" :style="{ background: scene.gradient }">
              <el-icon :size="32">
                <component :is="scene.icon" />
              </el-icon>
            </div>
            <span class="scene-name">{{ scene.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能提示 -->
    <div class="tips-section">
      <div class="tip-card">
        <el-icon :size="20"><Mouse /></el-icon>
        <span>拖拽旋转</span>
      </div>
      <div class="tip-card">
        <el-icon :size="20"><ZoomIn /></el-icon>
        <span>滚轮缩放</span>
      </div>
      <div class="tip-card">
        <el-icon :size="20"><Pointer /></el-icon>
        <span>点击交互</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Application } from '@splinetool/runtime'
import {
  View,
  Refresh,
  FullScreen,
  Clock,
  Mouse,
  ZoomIn,
  Pointer,
  Box,
  MagicStick,
  Sunset
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 定义 Cpu 图标 (element-plus 没有这个图标，用替代)
const Cpu = Box

const canvasRef = ref<HTMLCanvasElement | null>(null)
const sceneWrapperRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const loadingProgress = ref(0)
const sceneLoaded = ref(false)
const autoRotate = ref(true)
const zoomLevel = ref(100)
const fps = ref(60)
const objectCount = ref(0)
const currentScene = ref('demo')

let splineApp: Application | null = null
let fpsInterval: ReturnType<typeof setInterval> | null = null

// 示例场景列表
const sceneList = [
  {
    id: 'demo',
    name: '互动机器人',
    url: 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode',
    icon: MagicStick,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'abstract',
    name: '抽象艺术',
    url: 'https://prod.spline.design/JlCEVHGqX4EtBkWG/scene.splinecode',
    icon: Box,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'nature',
    name: '自然场景',
    url: 'https://prod.spline.design/yEIzCy5c8ZbqXrJM/scene.splinecode',
    icon: Sunset,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
]

// 模拟加载进度
const simulateProgress = () => {
  const interval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += Math.random() * 15
    } else {
      clearInterval(interval)
    }
  }, 200)
  return interval
}

// 加载 Spline 场景
const loadSplineScene = async (url: string) => {
  if (!canvasRef.value) return

  loading.value = true
  loadingProgress.value = 0
  sceneLoaded.value = false

  const progressInterval = simulateProgress()

  try {
    // 如果已有实例，先销毁
    if (splineApp) {
      splineApp.dispose()
    }

    splineApp = new Application(canvasRef.value)
    await splineApp.load(url)

    clearInterval(progressInterval)
    loadingProgress.value = 100

    setTimeout(() => {
      loading.value = false
      sceneLoaded.value = true
      objectCount.value = Math.floor(Math.random() * 50) + 20
      ElMessage.success('3D 场景加载成功！')
    }, 500)
  } catch (error) {
    console.error('Failed to load Spline scene:', error)
    clearInterval(progressInterval)
    loading.value = false
    ElMessage.error('场景加载失败，请稍后重试')
  }
}

// 切换场景
const loadScene = (scene: (typeof sceneList)[0]) => {
  currentScene.value = scene.id
  loadSplineScene(scene.url)
}

// 重新加载场景
const reloadScene = () => {
  const currentSceneData = sceneList.find((s) => s.id === currentScene.value)
  if (currentSceneData) {
    loadSplineScene(currentSceneData.url)
  }
}

// 全屏切换
const toggleFullscreen = () => {
  if (!sceneWrapperRef.value) return

  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    sceneWrapperRef.value.requestFullscreen()
  }
}

// 自动旋转
const toggleAutoRotate = (val: boolean) => {
  // 可以通过 Spline API 控制场景旋转
  console.log('Auto rotate:', val)
}

// 缩放处理
const handleZoom = (val: number) => {
  console.log('Zoom level:', val)
}

// FPS 监控
const startFpsMonitor = () => {
  let lastTime = performance.now()
  let frameCount = 0

  fpsInterval = setInterval(() => {
    const currentTime = performance.now()
    const elapsed = currentTime - lastTime

    if (elapsed >= 1000) {
      fps.value = Math.round((frameCount * 1000) / elapsed)
      frameCount = 0
      lastTime = currentTime
    }
    frameCount++
  }, 100)
}

onMounted(() => {
  // 默认加载第一个场景
  const defaultScene = sceneList[0]
  if (defaultScene) {
    loadSplineScene(defaultScene.url)
  }
  startFpsMonitor()
})

onUnmounted(() => {
  if (splineApp) {
    splineApp.dispose()
  }
  if (fpsInterval) {
    clearInterval(fpsInterval)
  }
})
</script>

<style lang="scss" scoped>
.spline-container {
  min-height: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
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

  :deep(.el-button) {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
}

.scene-wrapper {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  margin-bottom: 24px;
}

.scene-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  min-height: 500px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 12, 41, 0.9);
  z-index: 10;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;

  &:nth-child(1) {
    border-top-color: #667eea;
    animation-delay: 0s;
  }

  &:nth-child(2) {
    inset: 8px;
    border-right-color: #764ba2;
    animation-delay: 0.2s;
    animation-direction: reverse;
  }

  &:nth-child(3) {
    inset: 16px;
    border-bottom-color: #f093fb;
    animation-delay: 0.4s;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 20px;
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 12px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.spline-canvas {
  width: 100%;
  height: 100%;
  min-height: 500px;
  display: block;
}

.scene-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.scene-info {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.scene-selector {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
}

.selector-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

.scene-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scene-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
  }

  &.active {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.5);
  }
}

.scene-preview {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
}

.scene-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}

.tips-section {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.tip-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}
</style>
