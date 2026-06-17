<template>
  <div class="course-slide-stage" ref="containerRef">
    <div class="course-slide-canvas" :style="canvasStyle">
      <div
        v-for="element in elements"
        :key="element.id"
        class="course-slide-element"
        :class="{
          'is-highlighted': element.id === highlightId,
          'is-laser': element.id === highlightId && highlightMode === 'laser'
        }"
        :style="elementStyle(element)"
      >
        <div
          v-if="element.type === 'text' || element.type === 'latex'"
          class="course-slide-text"
          v-html="element.content || element.html"
        />
        <img
          v-else-if="element.type === 'image'"
          :src="resolveImage(element)"
          alt=""
          class="course-slide-image"
        />
        <video
          v-else-if="element.type === 'video'"
          :src="resolveVideo(element)"
          class="course-slide-video"
          :autoplay="element.autoplay"
          muted
          playsinline
          loop
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { resolveMediaRef } from '@/services/coursePlayer'
import type { CanvasElement, SlideCanvas } from '@/types/courseManifest'

defineOptions({
  name: 'CourseSlideStage'
})

const props = defineProps<{
  courseId: string
  canvas: SlideCanvas
  highlightId?: string | null
  highlightMode?: 'spotlight' | 'laser'
  mediaIndex?: Record<string, { type: string }>
}>()

const containerRef = ref<HTMLElement>()
const scale = ref(1)

const elements = computed(() => props.canvas.elements ?? [])

const canvasStyle = computed(() => ({
  width: `${props.canvas.viewportSize}px`,
  height: `${props.canvas.viewportSize * props.canvas.viewportRatio}px`,
  background: props.canvas.theme?.backgroundColor || '#ffffff',
  transform: `scale(${scale.value})`
}))

const elementStyle = (element: CanvasElement) => ({
  left: `${element.left}px`,
  top: `${element.top}px`,
  width: `${element.width}px`,
  height: `${element.height}px`,
  background: element.type === 'shape' ? element.fill || '#e2e8f0' : undefined,
  transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined
})

const resolveImage = (element: CanvasElement) => {
  if (!element.src) return ''
  return resolveMediaRef(props.courseId, element.src, props.mediaIndex)
}

const resolveVideo = (element: CanvasElement) => {
  if (!element.mediaRef) return ''
  return resolveMediaRef(props.courseId, element.mediaRef, props.mediaIndex)
}

const updateScale = () => {
  if (!containerRef.value) return
  const width = containerRef.value.clientWidth
  scale.value = Math.min(1, width / props.canvas.viewportSize)
}

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})
</script>

<style scoped lang="scss">
.course-slide-stage {
  width: 100%;
  overflow: hidden;
  border-radius: 14px;
  background: #0f172a;
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.course-slide-canvas {
  position: relative;
  transform-origin: top center;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
}

.course-slide-element {
  position: absolute;
  overflow: hidden;
  border-radius: 4px;
  transition:
    box-shadow 0.25s ease,
    outline 0.25s ease;
}

.course-slide-element.is-highlighted {
  outline: 3px solid rgba(250, 204, 21, 0.95);
  box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.18);
  z-index: 2;
}

.course-slide-element.is-laser {
  outline-color: rgba(239, 68, 68, 0.95);
  box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.16);
}

.course-slide-text {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.course-slide-text :deep(p) {
  margin: 0;
}

.course-slide-image,
.course-slide-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
