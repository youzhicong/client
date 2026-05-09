<template>
  <el-card class="toolbar-card" shadow="never">
    <div class="toolbar">
      <el-input
        v-model="keywordModel"
        clearable
        class="search-input"
        placeholder="搜索题目、标签或答案关键词，比如：闭包、diff、keep-alive、useEffect、性能优化"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="toolbar-actions">
        <el-switch
          :model-value="showAnswers"
          inline-prompt
          active-text="显示答案"
          inactive-text="只看题目"
          @update:model-value="handleShowAnswersChange"
        />
        <el-button type="primary" plain @click="emit('random-pick')">
          随机抽题
        </el-button>
      </div>

      <div class="toolbar-meta">
        <el-tag effect="plain" type="info"
          >当前展示 {{ displayedCount }} 题</el-tag
        >
        <el-tag effect="plain" type="success"
          >覆盖基础 / 手写 / Vue / React</el-tag
        >
        <el-tag effect="plain" type="warning">按初级 / 中级 / 高级分层</el-tag>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: string
  displayedCount: number
  showAnswers: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:showAnswers': [value: boolean]
  'random-pick': []
}>()

const handleShowAnswersChange = (value: string | number | boolean) => {
  emit('update:showAnswers', Boolean(value))
}

const keywordModel = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
  }
})
</script>

<style lang="scss" scoped>
.toolbar-card {
  margin-bottom: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.search-input {
  width: min(560px, 100%);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
