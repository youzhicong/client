<template>
  <div ref="containerRef" class="three-container"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
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
let animationId = 0
let machineGroup: THREE.Group | null = null
let productMeshes: THREE.Object3D[] = []

const getPixelRatio = () => Math.min(window.devicePixelRatio || 1, 2)

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.geometry) {
      mesh.geometry.dispose()
    }
    const material = (mesh as { material?: THREE.Material | THREE.Material[] })
      .material
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose())
    } else {
      material?.dispose()
    }
  })
}

const createVendingMachine = () => {
  const group = new THREE.Group()

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x1f2a37,
    metalness: 0.55,
    roughness: 0.32
  })

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.7,
    roughness: 0.28
  })

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0f9d92,
    emissive: 0x053f3a,
    emissiveIntensity: 0.7,
    metalness: 0.4,
    roughness: 0.3
  })

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xb6edf2,
    transparent: true,
    opacity: 0.18,
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    transmission: 0.48
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.1, 5.4, 2.2), shellMat)
  body.position.y = 2.7
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const cavity = new THREE.Mesh(new THREE.BoxGeometry(2.56, 4.2, 1.6), frameMat)
  cavity.position.set(0, 2.95, 0.37)
  group.add(cavity)

  const glassDoor = new THREE.Mesh(
    new THREE.BoxGeometry(2.64, 4.32, 0.08),
    glassMat
  )
  glassDoor.position.set(0, 2.95, 1.08)
  glassDoor.castShadow = true
  group.add(glassDoor)

  const sideLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 5.2, 2.08),
    frameMat
  )
  sideLeft.position.set(-1.45, 2.7, 0)
  const sideRight = sideLeft.clone()
  sideRight.position.x = 1.45
  group.add(sideLeft)
  group.add(sideRight)

  const topCap = new THREE.Mesh(
    new THREE.BoxGeometry(3.26, 0.22, 2.3),
    frameMat
  )
  topCap.position.set(0, 5.52, 0)
  group.add(topCap)

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.3, 2.35), frameMat)
  base.position.set(0, 0.05, 0)
  base.receiveShadow = true
  group.add(base)

  const topLight = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.24, 0.14),
    accentMat
  )
  topLight.position.set(0, 4.98, 1.08)
  group.add(topLight)

  const controlPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 2.36, 0.12),
    frameMat
  )
  controlPanel.position.set(1.07, 2.7, 1.04)
  group.add(controlPanel)

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.52, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0f172a,
      emissiveIntensity: 0.45,
      metalness: 0.25,
      roughness: 0.45
    })
  )
  screen.position.set(1.07, 3.42, 1.11)
  group.add(screen)

  for (let i = 0; i < 6; i++) {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xe5e7eb : 0x94a3b8,
        metalness: 0.3,
        roughness: 0.45
      })
    )
    btn.rotation.x = Math.PI / 2
    btn.position.set(1.07, 3 - i * 0.2, 1.115)
    group.add(btn)
  }

  const pickupOuter = new THREE.Mesh(
    new THREE.BoxGeometry(2.28, 0.62, 0.34),
    frameMat
  )
  pickupOuter.position.set(0, 0.72, 0.91)
  group.add(pickupOuter)

  const pickupInner = new THREE.Mesh(
    new THREE.BoxGeometry(2.02, 0.42, 0.52),
    new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.8 })
  )
  pickupInner.position.set(0, 0.72, 0.62)
  group.add(pickupInner)

  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(2.42, 0.05, 1.42),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.25,
        roughness: 0.6
      })
    )
    shelf.position.set(0, 1.56 + i * 1.24, 0.28)
    group.add(shelf)
  }

  return group
}

const createProductUnit = (
  product: Product,
  x: number,
  y: number,
  z: number
) => {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.145, 0.48, 20),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(product.color),
      metalness: 0.36,
      roughness: 0.42
    })
  )
  body.castShadow = true

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.152, 0.152, 0.03, 20),
    new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.8,
      roughness: 0.2
    })
  )
  cap.position.y = 0.255

  const bottom = cap.clone()
  bottom.position.y = -0.255

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.151, 0.151, 0.18, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      metalness: 0.05,
      roughness: 0.7
    })
  )

  group.add(body)
  group.add(cap)
  group.add(bottom)
  group.add(label)
  group.position.set(x, y, z)

  return group
}

const createProducts = (products: Product[]) => {
  productMeshes.forEach((item) => {
    scene.remove(item)
    disposeObject(item)
  })
  productMeshes = []

  const startX = -0.74
  const startY = 4.44
  const startZ = 0.3
  const spacingX = 0.56
  const spacingY = 1.24

  products.forEach((product) => {
    if (product.stock <= 0) return

    const x = startX + product.col * spacingX
    const y = startY - product.row * spacingY

    const front = createProductUnit(product, x, y, startZ)
    scene.add(front)
    productMeshes.push(front)

    const stackCount = Math.min(product.stock, 3)
    for (let i = 1; i < stackCount; i++) {
      const stacked = createProductUnit(product, x, y, startZ - i * 0.24)
      scene.add(stacked)
      productMeshes.push(stacked)
    }
  })
}

const initScene = () => {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f1b2a)
  scene.fog = new THREE.Fog(0x0f1b2a, 14, 30)

  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
  camera.position.set(5.5, 4.8, 7.2)
  camera.lookAt(0, 2.6, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(getPixelRatio())
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  containerRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.target.set(0, 2.5, 0)
  controls.minDistance = 4.2
  controls.maxDistance = 15
  controls.maxPolarAngle = Math.PI / 2.05

  const ambient = new THREE.AmbientLight(0xffffff, 0.45)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
  keyLight.position.set(6, 9, 8)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 40
  keyLight.shadow.camera.left = -8
  keyLight.shadow.camera.right = 8
  keyLight.shadow.camera.top = 8
  keyLight.shadow.camera.bottom = -8
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0x67e8f9, 0.4)
  rimLight.position.set(-6, 4, -4)
  scene.add(rimLight)

  const accentLight = new THREE.PointLight(0x0f9d92, 1.1, 12)
  accentLight.position.set(0, 5, 2.4)
  scene.add(accentLight)

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshStandardMaterial({
      color: 0x152437,
      roughness: 0.8,
      metalness: 0.12
    })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.02
  floor.receiveShadow = true
  scene.add(floor)

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.9, 0.22, 48),
    new THREE.MeshStandardMaterial({
      color: 0x22364b,
      metalness: 0.35,
      roughness: 0.45
    })
  )
  platform.position.y = 0.06
  platform.receiveShadow = true
  platform.castShadow = true
  scene.add(platform)

  machineGroup = createVendingMachine()
  scene.add(machineGroup)

  createProducts(props.products)

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls.update()

    if (machineGroup) {
      machineGroup.rotation.y = Math.sin(performance.now() * 0.00035) * 0.02
    }

    renderer.render(scene, camera)
  }

  animate()
}

const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(getPixelRatio())
  renderer.setSize(width, height)
}

watch(
  () => props.products,
  (newProducts) => {
    if (!scene) return
    createProducts(newProducts)
  },
  { deep: true }
)

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)

  productMeshes.forEach((item) => disposeObject(item))
  productMeshes = []

  if (machineGroup) {
    disposeObject(machineGroup)
    machineGroup = null
  }

  controls?.dispose()

  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }

  renderer?.dispose()
  scene?.clear()
})
</script>

<style lang="scss" scoped>
.three-container {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border-radius: 16px;
  overflow: hidden;
  background: #0f1b2a;
}
</style>
