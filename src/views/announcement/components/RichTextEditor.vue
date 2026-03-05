<template>
  <div class="rich-editor">
    <div class="toolbar">
      <el-button-group>
        <el-button size="small" @click="runCommand('bold')">B</el-button>
        <el-button size="small" @click="runCommand('italic')">I</el-button>
        <el-button size="small" @click="runCommand('underline')">U</el-button>
      </el-button-group>

      <el-button-group>
        <el-button size="small" @click="runCommand('insertUnorderedList')"
          >无序列表</el-button
        >
        <el-button size="small" @click="runCommand('insertOrderedList')"
          >有序列表</el-button
        >
      </el-button-group>

      <el-button-group>
        <el-button size="small" @click="runCommand('justifyLeft')"
          >左对齐</el-button
        >
        <el-button size="small" @click="runCommand('justifyCenter')"
          >居中</el-button
        >
        <el-button size="small" @click="runCommand('justifyRight')"
          >右对齐</el-button
        >
      </el-button-group>

      <el-button size="small" @click="insertLink">插入链接</el-button>
      <el-button size="small" @click="clearFormat">清除格式</el-button>
    </div>

    <div
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      :data-placeholder="placeholder"
      :style="{ minHeight: `${minHeight}px` }"
      @input="handleInput"
      @blur="handleInput"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    minHeight?: number
  }>(),
  {
    placeholder: '请输入公告正文内容',
    minHeight: 280
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLDivElement | null>(null)

const syncFromModel = () => {
  const target = editorRef.value
  if (!target) return
  const nextValue = props.modelValue || ''
  if (target.innerHTML !== nextValue) {
    target.innerHTML = nextValue
  }
}

const handleInput = () => {
  emit('update:modelValue', editorRef.value?.innerHTML || '')
}

const focusEditor = () => {
  editorRef.value?.focus()
}

const runCommand = (command: string, value?: string) => {
  focusEditor()
  document.execCommand(command, false, value)
  handleInput()
}

const insertLink = () => {
  const url = window.prompt('请输入链接地址（https://）')
  if (!url) return
  runCommand('createLink', url.trim())
}

const clearFormat = () => {
  runCommand('removeFormat')
  runCommand('unlink')
}

watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    syncFromModel()
  }
)

onMounted(() => {
  syncFromModel()
})
</script>

<style scoped lang="scss">
.rich-editor {
  border: 1px solid #d8e5eb;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid #e5edf2;
  background: linear-gradient(180deg, #f7fbfd 0%, #f2f8fb 100%);
}

.editor-content {
  padding: 12px 14px;
  line-height: 1.7;
  color: #1f3f4d;
  outline: none;
  overflow-y: auto;

  &:empty::before {
    content: attr(data-placeholder);
    color: #9aacb6;
  }
}
</style>
