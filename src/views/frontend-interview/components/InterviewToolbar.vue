<template>
  <el-card class="toolbar-card" shadow="never">
    <div class="toolbar">
      <el-input
        v-model="keywordModel"
        clearable
        class="search-input"
        placeholder="搜索关键词，例如：diff、keep-alive、useEffect、性能优化..."
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="toolbar-meta">
        <el-tag type="info" effect="plain">
          当前展示 {{ displayedCount }} 题
        </el-tag>
        <el-tag type="success" effect="plain">初级/中级/高级分层</el-tag>
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
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

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
  border-radius: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.search-input {
  width: min(640px, 100%);
}

.toolbar-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
