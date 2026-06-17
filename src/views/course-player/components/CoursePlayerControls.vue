<template>
  <div class="course-player-controls">
    <div class="course-player-progress">
      <span>场景 {{ sceneIndex + 1 }} / {{ sceneTotal }}</span>
      <el-progress :percentage="progress" :stroke-width="8" />
    </div>

    <div class="course-player-actions">
      <el-button-group>
        <el-button :disabled="sceneIndex <= 0" @click="$emit('prev')">
          上一场景
        </el-button>
        <el-button type="primary" @click="$emit('toggle-play')">
          {{ playing ? '暂停' : '播放' }}
        </el-button>
        <el-button
          :disabled="sceneIndex >= sceneTotal - 1"
          @click="$emit('next')"
        >
          下一场景
        </el-button>
      </el-button-group>
    </div>

    <div v-if="subtitle" class="course-player-subtitle">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CoursePlayerControls'
})

defineProps<{
  playing: boolean
  sceneIndex: number
  sceneTotal: number
  progress: number
  subtitle: string
}>()

defineEmits<{
  'toggle-play': []
  prev: []
  next: []
}>()
</script>

<style scoped lang="scss">
.course-player-controls {
  display: grid;
  gap: 12px;
}

.course-player-progress {
  display: grid;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.course-player-actions {
  display: flex;
  justify-content: center;
}

.course-player-subtitle {
  min-height: 72px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  line-height: 1.7;
  font-size: 14px;
}
</style>
