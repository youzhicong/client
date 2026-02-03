<template>
  <div ref="containerRef" class="three-container"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Product } from '../types'

const props = defineProps<{
  products: Product[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number
let productMeshes: THREE.Mesh[] = []

// 创建贩卖机主体
const createVendingMachine = () => {
  const group = new THREE.Group()
  const frameMaterial = new THREE.MeshPhongMaterial({
    color: 0x2d3748,
    specular: 0x111111,
    shininess: 30,
  })
  const darkMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a })

  // 左侧面板
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 2), frameMaterial)
  leftPanel.position.set(-1.425, 2.5, 0)
  group.add(leftPanel)

  // 右侧面板
  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 2), frameMaterial)
  rightPanel.position.set(1.425, 2.5, 0)
  group.add(rightPanel)

  // 顶部面板
  const topPanel = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 2), frameMaterial)
  topPanel.position.set(0, 5.075, 0)
  group.add(topPanel)

  // 底部面板
  const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 2), frameMaterial)
  bottomPanel.position.set(0, 0.075, 0)
  group.add(bottomPanel)

  // 背部面板（实心）
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 4.7, 0.15), frameMaterial)
  backPanel.position.set(0, 2.5, -0.925)
  group.add(backPanel)

  // 货架分隔板
  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 1.5), darkMaterial)
    shelf.position.set(0, 1.5 + i * 1.2, 0.15)
    group.add(shelf)
  }

  // 玻璃门
  const glassGeometry = new THREE.BoxGeometry(2.7, 3.8, 0.08)
  const glassMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.2,
    specular: 0xffffff,
    shininess: 100,
  })
  const glass = new THREE.Mesh(glassGeometry, glassMaterial)
  glass.position.set(0, 3.1, 0.96)
  group.add(glass)

  // 取货口
  const slotGeometry = new THREE.BoxGeometry(2.4, 0.6, 0.3)
  const slot = new THREE.Mesh(slotGeometry, darkMaterial)
  slot.position.set(0, 0.7, 0.85)
  group.add(slot)

  // 内部取货区
  const innerSlotGeometry = new THREE.BoxGeometry(2.2, 0.4, 0.5)
  const innerSlotMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 })
  const innerSlot = new THREE.Mesh(innerSlotGeometry, innerSlotMaterial)
  innerSlot.position.set(0, 0.7, 0.6)
  group.add(innerSlot)

  // 顶部装饰条
  const topDeco = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.2), darkMaterial)
  topDeco.position.set(0, 5.2, 0)
  group.add(topDeco)

  // 底座
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.2), darkMaterial)
  base.position.set(0, -0.05, 0)
  group.add(base)

  return group
}

// 创建商品展示
const createProducts = (products: Product[]) => {
  // 清除旧商品
  productMeshes.forEach((mesh) => {
    scene.remove(mesh)
    mesh.geometry.dispose()
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose()
    }
  })
  productMeshes = []

  const startX = -0.75
  const startY = 4.5
  const startZ = 0.3
  const spacingX = 0.55
  const spacingY = 1.2

  products.forEach((product) => {
    if (product.stock <= 0) return

    // 创建商品（圆柱体表示饮料罐）
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16)
    const color = new THREE.Color(product.color)
    const material = new THREE.MeshPhongMaterial({
      color: color,
      specular: 0x444444,
      shininess: 30,
    })
    const mesh = new THREE.Mesh(geometry, material)

    const x = startX + product.col * spacingX
    const y = startY - product.row * spacingY
    const z = startZ

    mesh.position.set(x, y, z)
    mesh.userData = { product }

    scene.add(mesh)
    productMeshes.push(mesh)

    // 添加库存指示（多个商品堆叠效果）
    const stackCount = Math.min(product.stock, 3)
    for (let i = 1; i < stackCount; i++) {
      const stackMesh = new THREE.Mesh(geometry.clone(), material.clone())
      stackMesh.position.set(x, y, z - i * 0.25)
      scene.add(stackMesh)
      productMeshes.push(stackMesh)
    }
  })
}

// 初始化场景
const initScene = () => {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  // 相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(5, 4, 7)
  camera.lookAt(0, 2.5, 0)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  containerRef.value.appendChild(renderer.domElement)

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 2.5, 0)
  controls.minDistance = 4
  controls.maxDistance = 15
  controls.maxPolarAngle = Math.PI / 2

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 主光源
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 10, 7)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // 补光
  const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.3)
  fillLight.position.set(-5, 5, -5)
  scene.add(fillLight)

  // 地面
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x16213e,
    shininess: 10,
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // 添加贩卖机
  const vendingMachine = createVendingMachine()
  scene.add(vendingMachine)

  // 添加商品
  createProducts(props.products)

  // 动画循环
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
}

// 窗口大小变化处理
const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 监听商品变化
watch(
  () => props.products,
  (newProducts) => {
    if (scene) {
      createProducts(newProducts)
    }
  },
  { deep: true },
)

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)
  controls?.dispose()
  renderer?.dispose()
  scene?.clear()
})
</script>

<style lang="scss" scoped>
.three-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 16px;
  overflow: hidden;
}
</style>
