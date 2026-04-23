<template>
  <div v-if="sections.length" class="section-grid">
    <el-card
      v-for="section in sections"
      :key="section.key"
      class="section-card"
      shadow="hover"
    >
      <template #header>
        <div class="section-header">
          <div>
            <h3>{{ section.title }}</h3>
            <p>{{ section.desc }}</p>
          </div>
          <el-tag :type="countTagType" effect="light">
            {{ section.questions.length }} 题
          </el-tag>
        </div>
      </template>
      <el-collapse>
        <el-collapse-item
          v-for="question in section.questions"
          :key="question.id"
          :name="question.id"
        >
          <template #title>
            <div class="question-title-row">
              <span class="question-title">{{ question.title }}</span>
              <el-tag
                size="small"
                effect="light"
                :type="levelTagType(question.level)"
              >
                {{ question.level }}
              </el-tag>
            </div>
          </template>
          <ul class="answer-list">
            <li v-for="point in question.answer" :key="point">
              {{ point }}
            </li>
          </ul>
          <div class="tag-row">
            <el-tag
              v-for="tag in question.tags"
              :key="`${question.id}-${tag}`"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
  <el-empty v-else :description="emptyDescription" />
</template>

<script lang="ts" setup>
import type { InterviewSection, QuestionLevel } from '../types'

withDefaults(
  defineProps<{
    sections: InterviewSection[]
    emptyDescription: string
    countTagType?: 'primary' | 'success' | 'info' | 'warning' | 'danger'
  }>(),
  {
    countTagType: 'primary'
  }
)

const levelTagType = (level: QuestionLevel) => {
  if (level === '初级') return 'success'
  if (level === '中级') return 'warning'
  return 'danger'
}
</script>

<style lang="scss" scoped>
.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.section-card {
  border-radius: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}

.section-header p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
}

.question-title-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 8px;
}

.question-title {
  font-size: 13px;
  color: #0f172a;
  font-weight: 600;
  line-height: 1.5;
}

.answer-list {
  margin: 2px 0 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.7;
}

.answer-list li {
  margin-bottom: 6px;
}

.tag-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  align-items: flex-start;
  min-height: 58px;
  height: auto;
  line-height: 1.4;
  border-bottom: 1px dashed #e2e8f0;
  padding: 8px 0;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: 1px solid #eef2f7;
  overflow-anchor: none;
}

:deep(.el-collapse-item:last-child .el-collapse-item__wrap) {
  border-bottom: none;
}

:deep(.el-collapse-item__content) {
  overflow-anchor: none;
}

@media (max-width: 1200px) {
  .section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
