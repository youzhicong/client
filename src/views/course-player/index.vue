<template>
  <PageShell v-loading="loading">
    <template #hero>
      <PageHero
        badge="MAIC PLAYER"
        :title="courseMeta?.title || '课程播放'"
        :description="
          manifest?.stage.name ||
          courseMeta?.summary ||
          'Manifest 驱动的伪视频课程播放器'
        "
      >
        <template #actions>
          <el-tag type="info">Manifest 驱动 · TTS 时间轴</el-tag>
        </template>
      </PageHero>
    </template>

    <template #stats>
      <PageStatGrid :columns="3">
        <PageStatCard label="场景数" :value="scenes.length" />
        <PageStatCard label="当前场景" :value="sceneIndex + 1" tone="warning" />
        <PageStatCard label="播放进度" :value="`${progress}%`" tone="success" />
      </PageStatGrid>
    </template>

    <div class="course-player-layout">
      <PagePanel body-class="page-panel-body course-player-stage-panel">
        <div v-if="errorMessage" class="course-player-error">
          {{ errorMessage }}
        </div>

        <CourseQuizPanel
          v-else-if="waitingForQuiz && currentScene?.type === 'quiz'"
          :title="currentScene.title"
          :questions="currentScene.content.questions"
          @continue="continueFromQuiz"
        />

        <CourseSlideStage
          v-else-if="currentScene?.type === 'slide'"
          :course-id="courseId"
          :canvas="currentScene.content.canvas"
          :highlight-id="highlightId"
          :media-index="manifest?.mediaIndex"
        />

        <el-empty v-else description="暂无可播放内容" />
      </PagePanel>

      <PagePanel>
        <CoursePlayerControls
          :playing="playing"
          :scene-index="sceneIndex"
          :scene-total="scenes.length"
          :progress="progress"
          :subtitle="subtitle"
          @toggle-play="togglePlay"
          @prev="goPrevScene"
          @next="goNextScene"
        />

        <div class="course-scene-list">
          <button
            v-for="(scene, index) in scenes"
            :key="`${scene.order}-${scene.title}`"
            type="button"
            class="course-scene-item"
            :class="{ active: index === sceneIndex }"
            @click="jumpToScene(index)"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ scene.title }}</strong>
            <em>{{ scene.type === 'quiz' ? '测验' : '幻灯片' }}</em>
          </button>
        </div>
      </PagePanel>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHero from '@/components/page/PageHero.vue'
import PagePanel from '@/components/page/PagePanel.vue'
import PageShell from '@/components/page/PageShell.vue'
import PageStatCard from '@/components/page/PageStatCard.vue'
import PageStatGrid from '@/components/page/PageStatGrid.vue'
import { useCoursePlayer } from '@/composables/useCoursePlayer'
import { courseCatalog } from '@/services/coursePlayer'
import CoursePlayerControls from './components/CoursePlayerControls.vue'
import CourseQuizPanel from './components/CourseQuizPanel.vue'
import CourseSlideStage from './components/CourseSlideStage.vue'

defineOptions({
  name: 'CoursePlayerPage'
})

const route = useRoute()

const courseId = computed(() => {
  const raw = route.params.courseId
  const value = Array.isArray(raw) ? raw[0] : raw
  return value || 'oligosaccharide'
})

const courseMeta = computed(() =>
  courseCatalog.find((item) => item.id === courseId.value)
)

const {
  manifest,
  loading,
  playing,
  sceneIndex,
  subtitle,
  highlightId,
  waitingForQuiz,
  errorMessage,
  scenes,
  currentScene,
  progress,
  load,
  togglePlay,
  continueFromQuiz,
  jumpToScene
} = useCoursePlayer(courseId)

const goPrevScene = () => {
  jumpToScene(sceneIndex.value - 1)
}

const goNextScene = () => {
  jumpToScene(sceneIndex.value + 1)
}

onMounted(() => {
  void load()
})

watch(courseId, () => {
  void load()
})
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';

.course-player-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 12px;
}

.course-player-stage-panel {
  min-height: 420px;
}

.course-player-error {
  padding: 16px;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
}

.course-scene-list {
  margin-top: 14px;
  display: grid;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
}

.course-scene-item {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #dbe4ea;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.course-scene-item.active {
  border-color: #0f766e;
  background: #ecfdf5;
}

.course-scene-item span {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.course-scene-item strong {
  color: #1e293b;
  font-size: 14px;
}

.course-scene-item em {
  color: #64748b;
  font-style: normal;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .course-player-layout {
    grid-template-columns: 1fr;
  }
}
</style>
