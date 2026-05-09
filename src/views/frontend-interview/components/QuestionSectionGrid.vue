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
          <div class="section-copy">
            <h3>{{ section.title }}</h3>
            <p>{{ section.desc }}</p>
          </div>
          <el-tag :type="countTagType" effect="light">
            {{ section.questions.length }} 题
          </el-tag>
        </div>
      </template>

      <el-collapse accordion>
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

          <template v-if="showAnswers">
            <ul class="answer-list">
              <li v-for="point in question.answer" :key="point">
                {{ point }}
              </li>
            </ul>
          </template>
          <div v-else class="answer-placeholder">
            当前为只看题目模式，展开后可先自行作答，再切换到显示答案复盘。
          </div>

          <div
            v-if="
              question.sourceName || question.sourceUrl || question.syncedAt
            "
            class="question-meta"
          >
            <span v-if="question.sourceName" class="meta-item">
              来源：{{ question.sourceName }}
            </span>
            <a
              v-if="question.sourceUrl"
              class="meta-link"
              :href="question.sourceUrl"
              target="_blank"
              rel="noreferrer"
            >
              查看原文
            </a>
            <span v-if="question.syncedAt" class="meta-item">
              同步：{{ formatSyncedAt(question.syncedAt) }}
            </span>
          </div>

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
    showAnswers?: boolean
    countTagType?: 'primary' | 'success' | 'info' | 'warning' | 'danger'
  }>(),
  {
    countTagType: 'primary',
    showAnswers: true
  }
)

const levelTagType = (level: QuestionLevel) => {
  if (level === '初级') return 'success'
  if (level === '中级') return 'warning'
  return 'danger'
}

const formatSyncedAt = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-copy h3 {
  margin: 0;
  font-size: 17px;
  color: #0f172a;
}

.section-copy p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.question-title-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-right: 8px;
}

.question-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.6;
  color: #0f172a;
}

.answer-list {
  margin: 2px 0 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.8;
}

.answer-list li + li {
  margin-top: 6px;
}

.answer-placeholder {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
}

.meta-item {
  line-height: 1.6;
}

.meta-link {
  color: #2563eb;
  line-height: 1.6;
  text-decoration: none;
}

.meta-link:hover {
  text-decoration: underline;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  min-height: 58px;
  height: auto;
  line-height: 1.5;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px dashed #e2e8f0;
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
