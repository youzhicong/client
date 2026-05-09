<template>
  <div class="interview-page">
    <InterviewHero
      :total-questions="totalQuestions"
      :total-foundation-questions="totalFoundationQuestions"
      :total-handwriting-questions="totalHandwritingQuestions"
      :total-vue-questions="totalVueQuestions"
      :total-react-questions="totalReactQuestions"
    />

    <InterviewToolbar
      v-model="keyword"
      :displayed-count="displayedCount"
      :show-answers="showAnswers"
      @update:show-answers="showAnswers = $event"
      @random-pick="pickRandomQuestion"
    />

    <section v-if="randomQuestion" class="spotlight-card">
      <div class="spotlight-header">
        <div>
          <p class="spotlight-kicker">RANDOM PICK</p>
          <h3>{{ randomQuestion.title }}</h3>
        </div>
        <div class="spotlight-tags">
          <el-tag effect="light" type="primary">{{
            randomQuestion.level
          }}</el-tag>
          <el-tag effect="plain">{{ randomSourceLabel }}</el-tag>
        </div>
      </div>
      <div class="tag-row">
        <el-tag
          v-for="tag in randomQuestion.tags"
          :key="`random-${tag}`"
          size="small"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
      </div>
      <ul v-if="showAnswers" class="spotlight-answer">
        <li v-for="line in randomQuestion.answer" :key="line">
          {{ line }}
        </li>
      </ul>
      <div v-else class="spotlight-placeholder">
        当前是只看题目模式，这里先留白给你自己答。
      </div>
    </section>

    <el-tabs v-model="activeTab" class="question-tabs">
      <el-tab-pane
        :label="`通用基础（${totalFoundationQuestions}）`"
        name="foundation"
      >
        <QuestionSectionGrid
          :sections="filteredFoundationSections"
          :show-answers="showAnswers"
          count-tag-type="info"
          empty-description="当前关键词下没有匹配到通用基础题目"
        />
      </el-tab-pane>

      <el-tab-pane
        :label="`手写题（${totalHandwritingQuestions}）`"
        name="handwriting"
      >
        <QuestionSectionGrid
          :sections="filteredHandwritingSections"
          :show-answers="showAnswers"
          count-tag-type="warning"
          empty-description="当前关键词下没有匹配到手写题"
        />
      </el-tab-pane>

      <el-tab-pane :label="`Vue（${totalVueQuestions}）`" name="vue">
        <QuestionSectionGrid
          :sections="filteredVueSections"
          :show-answers="showAnswers"
          count-tag-type="primary"
          empty-description="当前关键词下没有匹配到 Vue 题目"
        />
      </el-tab-pane>

      <el-tab-pane :label="`React（${totalReactQuestions}）`" name="react">
        <QuestionSectionGrid
          :sections="filteredReactSections"
          :show-answers="showAnswers"
          count-tag-type="success"
          empty-description="当前关键词下没有匹配到 React 题目"
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
import {
  foundationSections,
  handwritingSections,
  reactSections,
  vueSections
} from './questionBank'
import type { FrameworkTab, InterviewQuestion, InterviewSection } from './types'

const activeTab = ref<FrameworkTab>('foundation')
const keyword = ref('')
const showAnswers = ref(true)
const randomQuestion = ref<InterviewQuestion | null>(null)
const randomSourceLabel = ref('')

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

const filteredFoundationSections = computed(() =>
  filterSections(foundationSections, normalizedKeyword.value)
)
const filteredHandwritingSections = computed(() =>
  filterSections(handwritingSections, normalizedKeyword.value)
)
const filteredVueSections = computed(() =>
  filterSections(vueSections, normalizedKeyword.value)
)
const filteredReactSections = computed(() =>
  filterSections(reactSections, normalizedKeyword.value)
)

const countQuestions = (sections: InterviewSection[]) =>
  sections.reduce((sum, section) => sum + section.questions.length, 0)

const totalFoundationQuestions = countQuestions(foundationSections)
const totalHandwritingQuestions = countQuestions(handwritingSections)
const totalVueQuestions = countQuestions(vueSections)
const totalReactQuestions = countQuestions(reactSections)
const totalQuestions =
  totalFoundationQuestions +
  totalHandwritingQuestions +
  totalVueQuestions +
  totalReactQuestions

const displayedCount = computed(() => {
  if (activeTab.value === 'foundation') {
    return countQuestions(filteredFoundationSections.value)
  }

  if (activeTab.value === 'handwriting') {
    return countQuestions(filteredHandwritingSections.value)
  }

  if (activeTab.value === 'vue') {
    return countQuestions(filteredVueSections.value)
  }

  return countQuestions(filteredReactSections.value)
})

const randomPool = computed(() => {
  const sourceMap: Record<
    FrameworkTab,
    { label: string; sections: InterviewSection[] }
  > = {
    foundation: {
      label: '通用基础',
      sections: filteredFoundationSections.value
    },
    handwriting: {
      label: '手写题',
      sections: filteredHandwritingSections.value
    },
    vue: { label: 'Vue', sections: filteredVueSections.value },
    react: { label: 'React', sections: filteredReactSections.value }
  }

  const current = sourceMap[activeTab.value]

  return current.sections.flatMap((section) =>
    section.questions.map((question) => ({
      question,
      label: `${current.label} / ${section.title}`
    }))
  )
})

const pickRandomQuestion = () => {
  if (!randomPool.value.length) {
    randomQuestion.value = null
    randomSourceLabel.value = ''
    return
  }

  const index = Math.floor(Math.random() * randomPool.value.length)
  const selected = randomPool.value[index]
  if (!selected) return
  randomQuestion.value = selected.question
  randomSourceLabel.value = selected.label
}
</script>

<style lang="scss" scoped>
.interview-page {
  min-height: calc(100vh - 64px);
  padding: 24px 28px 34px;
  background:
    radial-gradient(circle at 8% 8%, rgba(191, 219, 254, 0.7), transparent 30%),
    radial-gradient(
      circle at 92% 6%,
      rgba(187, 247, 208, 0.68),
      transparent 26%
    ),
    #f8fafc;
}

.spotlight-card {
  margin-bottom: 14px;
  padding: 20px 22px;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #f8fbff);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.spotlight-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.spotlight-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
}

.spotlight-header h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
  color: #0f172a;
}

.spotlight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spotlight-answer {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.8;
}

.spotlight-placeholder {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.question-tabs {
  margin-top: 2px;
}

@media (max-width: 1200px) {
  .interview-page {
    padding: 20px 16px 30px;
  }
}

@media (max-width: 768px) {
  .spotlight-header {
    flex-direction: column;
  }
}
</style>
