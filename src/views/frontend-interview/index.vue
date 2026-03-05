<template>
  <div class="interview-page">
    <InterviewHero
      :total-questions="totalQuestions"
      :total-vue-questions="totalVueQuestions"
      :total-react-questions="totalReactQuestions"
    />

    <InterviewToolbar v-model="keyword" :displayed-count="displayedCount" />

    <el-tabs v-model="activeTab" class="question-tabs">
      <el-tab-pane :label="`Vue 面试题（${totalVueQuestions}）`" name="vue">
        <QuestionSectionGrid
          :sections="filteredVueSections"
          count-tag-type="primary"
          empty-description="当前关键词下没有匹配的 Vue 题目"
        />
      </el-tab-pane>

      <el-tab-pane
        :label="`React 面试题（${totalReactQuestions}）`"
        name="react"
      >
        <QuestionSectionGrid
          :sections="filteredReactSections"
          count-tag-type="success"
          empty-description="当前关键词下没有匹配的 React 题目"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import InterviewHero from './components/InterviewHero.vue'
import InterviewToolbar from './components/InterviewToolbar.vue'
import QuestionSectionGrid from './components/QuestionSectionGrid.vue'
import { reactSections, vueSections } from './questionBank'
import type { FrameworkTab, InterviewQuestion, InterviewSection } from './types'

const activeTab = ref<FrameworkTab>('vue')
const keyword = ref('')

const normalize = (value: string) => value.trim().toLowerCase()

const matchesQuestion = (
  question: InterviewQuestion,
  normalizedKey: string
) => {
  if (!normalizedKey) return true
  return (
    normalize(question.title).includes(normalizedKey) ||
    question.tags.some((tag) => normalize(tag).includes(normalizedKey)) ||
    question.answer.some((line) => normalize(line).includes(normalizedKey))
  )
}

const filterSections = (
  sections: InterviewSection[],
  normalizedKey: string
): InterviewSection[] =>
  sections
    .map((section) => ({
      ...section,
      questions: section.questions.filter((question) =>
        matchesQuestion(question, normalizedKey)
      )
    }))
    .filter((section) => section.questions.length > 0)

const normalizedKeyword = computed(() => normalize(keyword.value))

const filteredVueSections = computed(() =>
  filterSections(vueSections, normalizedKeyword.value)
)
const filteredReactSections = computed(() =>
  filterSections(reactSections, normalizedKeyword.value)
)

const countQuestions = (sections: InterviewSection[]) =>
  sections.reduce((sum, section) => sum + section.questions.length, 0)

const totalVueQuestions = countQuestions(vueSections)
const totalReactQuestions = countQuestions(reactSections)
const totalQuestions = totalVueQuestions + totalReactQuestions

const displayedCount = computed(() =>
  activeTab.value === 'vue'
    ? countQuestions(filteredVueSections.value)
    : countQuestions(filteredReactSections.value)
)
</script>

<style lang="scss" scoped>
.interview-page {
  min-height: calc(100vh - 64px);
  padding: 24px 28px 34px;
  background:
    radial-gradient(circle at 6% 8%, #dbeafe 0%, rgba(219, 234, 254, 0) 42%),
    radial-gradient(circle at 92% 4%, #dcfce7 0%, rgba(220, 252, 231, 0) 36%),
    #f8fafc;
}

.question-tabs {
  margin-top: 2px;
}

@media (max-width: 1200px) {
  .interview-page {
    padding: 20px 16px 30px;
  }
}
</style>
