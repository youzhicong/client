<template>
  <div class="course-quiz-panel">
    <div class="course-quiz-head">
      <span class="course-quiz-badge">QUIZ</span>
      <h3>{{ title }}</h3>
    </div>

    <div
      v-for="(question, index) in questions"
      :key="question.id"
      class="course-quiz-item"
    >
      <div class="course-quiz-index">Q{{ index + 1 }}</div>
      <div class="course-quiz-body">
        <p class="course-quiz-question">{{ question.question }}</p>
        <div class="course-quiz-options">
          <div
            v-for="option in question.options"
            :key="option.value"
            class="course-quiz-option"
          >
            <strong>{{ option.value }}.</strong> {{ option.label }}
          </div>
        </div>
        <p v-if="question.analysis" class="course-quiz-analysis">
          解析：{{ question.analysis }}
        </p>
      </div>
    </div>

    <div class="course-quiz-actions">
      <el-button type="primary" @click="$emit('continue')">继续播放</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuizQuestion } from '@/types/courseManifest'

defineOptions({
  name: 'CourseQuizPanel'
})

defineProps<{
  title: string
  questions: QuizQuestion[]
}>()

defineEmits<{
  continue: []
}>()
</script>

<style scoped lang="scss">
.course-quiz-panel {
  padding: 4px 2px 8px;
}

.course-quiz-head {
  margin-bottom: 14px;
}

.course-quiz-badge {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.course-quiz-head h3 {
  margin: 10px 0 0;
  color: #1e3a4a;
}

.course-quiz-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #e2e8f0;
}

.course-quiz-index {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  font-weight: 700;
  flex-shrink: 0;
}

.course-quiz-question {
  margin: 0 0 10px;
  color: #1f2937;
  line-height: 1.7;
}

.course-quiz-options {
  display: grid;
  gap: 8px;
}

.course-quiz-option {
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
}

.course-quiz-analysis {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
  line-height: 1.6;
}

.course-quiz-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>
