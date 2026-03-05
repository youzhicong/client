<template>
  <div class="signature-pad">
    <canvas
      ref="canvasRef"
      class="signature-canvas"
      @mousedown="startDraw"
      @mousemove="onDraw"
      @mouseup="endDraw"
      @mouseleave="endDraw"
      @touchstart.prevent="startDrawTouch"
      @touchmove.prevent="onDrawTouch"
      @touchend.prevent="endDraw"
    ></canvas>

    <div class="signature-tools">
      <el-button size="small" @click="clearPad">清空签名</el-button>
      <el-text size="small" type="info">请在签名框内手写签名</el-text>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const drawing = ref(false)
const hasSigned = ref(false)

const getContext = () => {
  const canvas = canvasRef.value
  if (!canvas) return null
  return canvas.getContext('2d')
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ratio = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * ratio
  canvas.height = rect.height * ratio
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(ratio, ratio)
  ctx.lineWidth = 2.2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#163a4a'
}

const getPoint = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

const startDraw = (event: MouseEvent) => {
  const ctx = getContext()
  if (!ctx) return
  drawing.value = true
  const point = getPoint(event)
  ctx.beginPath()
  ctx.moveTo(point.x, point.y)
}

const onDraw = (event: MouseEvent) => {
  if (!drawing.value) return
  const ctx = getContext()
  if (!ctx) return
  const point = getPoint(event)
  ctx.lineTo(point.x, point.y)
  ctx.stroke()
  hasSigned.value = true
}

const startDrawTouch = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch) return
  startDraw(
    new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
  )
}

const onDrawTouch = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch) return
  onDraw(
    new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
  )
}

const endDraw = () => {
  drawing.value = false
}

const clearPad = () => {
  const ctx = getContext()
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  hasSigned.value = false
}

const exportSignature = () => {
  if (!canvasRef.value || !hasSigned.value) return ''
  return canvasRef.value.toDataURL('image/png')
}

defineExpose({
  clearPad,
  exportSignature,
  hasSigned
})

onMounted(async () => {
  await nextTick()
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})
</script>

<style scoped lang="scss">
.signature-pad {
  border: 1px solid #d7e7ef;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 180px;
  cursor: crosshair;
  background:
    linear-gradient(
      180deg,
      rgba(245, 251, 255, 0.9) 0%,
      rgba(238, 247, 252, 0.9) 100%
    ),
    repeating-linear-gradient(
      180deg,
      rgba(105, 140, 160, 0.08),
      rgba(105, 140, 160, 0.08) 1px,
      transparent 1px,
      transparent 28px
    );
}

.signature-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-top: 1px solid #e2edf3;
}
</style>
