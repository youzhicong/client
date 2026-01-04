<template>
  <div class="page">
    <div class="header">
      <h2>表单构建</h2>
      <p>从左侧拖拽组件到中间画布，右侧可编辑属性。</p>
    </div>

    <div class="layout">
      <aside class="toolbox">
        <div class="toolbox-title">组件库</div>
        <div class="toolbox-group">
          <div class="toolbox-group-title">输入型</div>
          <div
            v-for="tool in inputTools"
            :key="tool.type"
            class="tool"
            draggable="true"
            @dragstart="onToolDragStart($event, tool)"
          >
            {{ tool.label }}
          </div>
        </div>
        <div class="toolbox-group">
          <div class="toolbox-group-title">选择型</div>
          <div
            v-for="tool in selectTools"
            :key="tool.type"
            class="tool"
            draggable="true"
            @dragstart="onToolDragStart($event, tool)"
          >
            {{ tool.label }}
          </div>
        </div>
        <div class="toolbox-group">
          <div class="toolbox-group-title">其他</div>
          <div
            v-for="tool in otherTools"
            :key="tool.type"
            class="tool"
            draggable="true"
            @dragstart="onToolDragStart($event, tool)"
          >
            {{ tool.label }}
          </div>
        </div>
      </aside>

      <main class="canvas" @dragover.prevent @drop="onCanvasDrop">
        <div class="canvas-header">
          <span>拖拽组件到此区域</span>
          <div class="canvas-actions">
            <el-button
              size="small"
              @click="openCodeDialog"
              :disabled="schema.length === 0"
            >
              生成代码
            </el-button>
            <el-button
              size="small"
              @click="downloadConfig"
              :disabled="schema.length === 0"
            >
              下载配置
            </el-button>
            <el-button
              size="small"
              @click="clearAll"
              :disabled="schema.length === 0"
            >
              清空
            </el-button>
          </div>
        </div>
        <div v-if="schema.length === 0" class="empty">
          从左侧拖拽组件开始构建
        </div>
        <el-form v-else class="form" label-width="100px">
          <div
            v-for="(field, index) in schema"
            :key="field.id"
            class="field"
            :class="{
              active: field.id === activeId,
              dragging: index === dragIndex
            }"
            draggable="true"
            @click="setActive(field.id)"
            @dragstart="onFieldDragStart($event, index)"
            @dragover.prevent
            @drop.stop="onFieldDrop(index)"
            @dragend="onFieldDragEnd"
          >
            <el-form-item :label="field.label" :required="field.required">
              <el-button v-if="field.type === 'button'" type="primary">
                {{ field.label }}
              </el-button>
              <component
                v-else
                :is="componentMap[field.type]"
                v-model="formModel[field.prop]"
                v-bind="getComponentProps(field)"
              >
                <template v-if="needsOptions(field.type)">
                  <component
                    :is="optionComponentFor(field.type)"
                    v-for="opt in field.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </component>
                </template>
              </component>
            </el-form-item>
            <div class="field-actions">
              <button
                type="button"
                class="icon-btn"
                @click.stop="moveItem(index, -1)"
                :disabled="index === 0"
              >
                上移
              </button>
              <button
                type="button"
                class="icon-btn"
                @click.stop="moveItem(index, 1)"
                :disabled="index === schema.length - 1"
              >
                下移
              </button>
              <button
                type="button"
                class="icon-btn danger"
                @click.stop="removeField(field.id)"
              >
                删除
              </button>
            </div>
          </div>
        </el-form>
      </main>

      <aside class="props">
        <div class="props-title">组件属性</div>
        <div v-if="!activeField" class="empty">请选择中间组件进行编辑</div>
        <div v-else class="props-form">
          <div class="props-row">
            <span class="props-label">类型</span>
            <span class="props-value">{{ typeLabel(activeField.type) }}</span>
          </div>
          <el-input
            v-model="activeField.label"
            placeholder="标题"
            class="props-input"
          >
            <template #prepend>标题</template>
          </el-input>
          <el-input
            v-model="activeField.prop"
            placeholder="字段名"
            class="props-input"
          >
            <template #prepend>字段名</template>
          </el-input>
          <el-input
            v-if="showPlaceholder(activeField.type)"
            v-model="activeField.placeholder"
            placeholder="提示文字"
            class="props-input"
          >
            <template #prepend>提示</template>
          </el-input>
          <div class="props-row">
            <span class="props-label">必填</span>
            <el-switch v-model="activeField.required" />
          </div>
          <div v-if="needsOptions(activeField.type)" class="options">
            <div class="options-title">选项</div>
            <div
              v-for="(opt, idx) in activeField.options"
              :key="opt.value"
              class="option-row"
            >
              <el-input
                v-model="opt.label"
                placeholder="名称"
                class="option-input"
              />
              <el-input
                v-model="opt.value"
                placeholder="值"
                class="option-input"
              />
              <button
                type="button"
                class="icon-btn danger"
                @click="removeOption(idx)"
              >
                删除
              </button>
            </div>
            <el-button size="small" @click="addOption">新增选项</el-button>
          </div>
        </div>
      </aside>
    </div>

    <el-dialog
      v-model="codeDialogVisible"
      width="720px"
      class="code-dialog"
      title="Generated Page"
    >
      <el-input
        v-model="generatedCode"
        type="textarea"
        :autosize="{ minRows: 16, maxRows: 24 }"
        readonly
      />
      <template #footer>
        <div class="dialog-actions">
          <el-button @click="copyCode" :disabled="!generatedCode"
            >Copy Code</el-button
          >
          <el-button
            type="primary"
            @click="downloadPage"
            :disabled="!generatedCode"
          >
            Download Page
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, type Component } from 'vue'
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElDialog,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch
} from 'element-plus'

type FieldType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'button'
type OptionFieldType = 'select' | 'radio' | 'checkbox'

type Tool = {
  type: FieldType
  label: string
  placeholder?: string
  options?: Array<{ label: string; value: string }>
}

type FieldSchema = {
  id: string
  type: FieldType
  label: string
  prop: string
  placeholder: string
  required: boolean
  options: Array<{ label: string; value: string }>
}

const inputTools: Tool[] = [
  { type: 'input', label: '单行文本', placeholder: '请输入内容' },
  { type: 'textarea', label: '多行文本', placeholder: '请输入内容' }
]
const selectTools: Tool[] = [
  {
    type: 'select',
    label: '下拉选择',
    placeholder: '请选择',
    options: [
      { label: '选项一', value: 'option1' },
      { label: '选项二', value: 'option2' }
    ]
  },
  {
    type: 'radio',
    label: '单选组',
    options: [
      { label: '选项一', value: 'radio1' },
      { label: '选项二', value: 'radio2' }
    ]
  },
  {
    type: 'checkbox',
    label: '多选组',
    options: [
      { label: '选项一', value: 'check1' },
      { label: '选项二', value: 'check2' }
    ]
  }
]
const otherTools: Tool[] = [
  { type: 'switch', label: '开关' },
  { type: 'date', label: '日期选择', placeholder: '请选择日期' },
  { type: 'button', label: '按钮' }
]

const schema = ref<FieldSchema[]>([])
const activeId = ref('')
const formModel = reactive<Record<string, unknown>>({})
const dragIndex = ref<number | null>(null)
const codeDialogVisible = ref(false)
const generatedCode = ref('')

const componentMap: Record<FieldType, Component> = {
  input: ElInput,
  textarea: ElInput,
  select: ElSelect,
  radio: ElRadioGroup,
  checkbox: ElCheckboxGroup,
  switch: ElSwitch,
  date: ElDatePicker,
  button: ElButton
}

const optionComponentMap: Record<OptionFieldType, Component> = {
  select: ElOption,
  radio: ElRadio,
  checkbox: ElCheckbox
}

const onToolDragStart = (event: DragEvent, tool: Tool) => {
  event.dataTransfer?.setData('tool', JSON.stringify(tool))
  event.dataTransfer?.setData('mode', 'tool')
}

const createField = (tool: Tool): FieldSchema => {
  const id = `${tool.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const prop = `${tool.type}${schema.value.length + 1}`
  const field: FieldSchema = {
    id,
    type: tool.type,
    label: tool.label,
    prop,
    placeholder: tool.placeholder || '',
    required: false,
    options: tool.options ? tool.options.map((opt) => ({ ...opt })) : []
  }
  if (tool.type === 'checkbox') formModel[prop] = []
  else if (tool.type === 'switch') formModel[prop] = false
  else formModel[prop] = ''
  return field
}

const onCanvasDrop = (event: DragEvent) => {
  const mode = event.dataTransfer?.getData('mode')
  if (mode === 'tool') {
    const raw = event.dataTransfer?.getData('tool') || ''
    if (!raw) return
    const tool = JSON.parse(raw) as Tool
    const field = createField(tool)
    schema.value.push(field)
    activeId.value = field.id
    return
  }
  if (mode === 'field' && dragIndex.value !== null) {
    const from = dragIndex.value
    const list = schema.value
    const [item] = list.splice(from, 1)
    if (item) list.push(item)
    dragIndex.value = null
  }
}

const onFieldDragStart = (event: DragEvent, index: number) => {
  dragIndex.value = index
  event.dataTransfer?.setData('mode', 'field')
}

const onFieldDrop = (index: number) => {
  const from = dragIndex.value
  if (from === null || from === index) return
  const list = schema.value
  const [item] = list.splice(from, 1)
  if (!item) return
  list.splice(index, 0, item)
  dragIndex.value = null
}

const onFieldDragEnd = () => {
  dragIndex.value = null
}

const setActive = (id: string) => {
  activeId.value = id
}

const activeField = computed(() =>
  schema.value.find((item) => item.id === activeId.value)
)

const removeField = (id: string) => {
  const index = schema.value.findIndex((item) => item.id === id)
  if (index === -1) return
  const [removed] = schema.value.splice(index, 1)
  if (removed) {
    delete formModel[removed.prop]
  }
  if (activeId.value === id) activeId.value = schema.value[0]?.id || ''
}

const moveItem = (index: number, offset: number) => {
  const next = index + offset
  if (next < 0 || next >= schema.value.length) return
  const list = schema.value
  const temp = list[index]
  const target = list[next]
  if (!temp || !target) return
  list[index] = target
  list[next] = temp
}

const clearAll = () => {
  schema.value = []
  activeId.value = ''
  Object.keys(formModel).forEach((key) => delete formModel[key])
}

const needsOptions = (type: FieldType): type is OptionFieldType =>
  ['select', 'radio', 'checkbox'].includes(type)
const showPlaceholder = (type: FieldType) =>
  ['input', 'textarea', 'select', 'date'].includes(type)

const optionComponentFor = (type: FieldType) =>
  needsOptions(type) ? optionComponentMap[type] : ''

const getComponentProps = (field: FieldSchema) => {
  if (field.type === 'textarea')
    return { type: 'textarea', rows: 3, placeholder: field.placeholder }
  if (field.type === 'date')
    return { type: 'date', placeholder: field.placeholder }
  if (field.type === 'select') return { placeholder: field.placeholder }
  if (field.type === 'input') return { placeholder: field.placeholder }
  return {}
}

const addOption = () => {
  if (!activeField.value) return
  activeField.value.options.push({
    label: `选项${activeField.value.options.length + 1}`,
    value: `option${activeField.value.options.length + 1}`
  })
}

const removeOption = (index: number) => {
  if (!activeField.value) return
  activeField.value.options.splice(index, 1)
}

const typeLabel = (type: FieldType) => {
  const map: Record<FieldType, string> = {
    input: '单行文本',
    textarea: '多行文本',
    select: '下拉选择',
    radio: '单选组',
    checkbox: '多选组',
    switch: '开关',
    date: '日期选择',
    button: '按钮'
  }
  return map[type]
}

const buildFieldTemplate = (field: FieldSchema) => {
  const label = JSON.stringify(field.label)
  const modelKey = JSON.stringify(field.prop)
  const placeholder = JSON.stringify(field.placeholder || '')
  const lines: string[] = [
    `    <el-form-item :label=${label} :required=${field.required}>`
  ]

  if (field.type === 'button') {
    lines.push(`      <el-button type="primary">{{ ${label} }}</el-button>`)
    lines.push('    </el-form-item>')
    return lines.join('\n')
  }

  if (field.type === 'textarea') {
    lines.push(
      `      <el-input v-model="formModel[${modelKey}]" type="textarea" :rows="3" :placeholder=${placeholder} />`
    )
  } else if (field.type === 'date') {
    lines.push(
      `      <el-date-picker v-model="formModel[${modelKey}]" type="date" :placeholder=${placeholder} />`
    )
  } else if (field.type === 'select') {
    lines.push(
      `      <el-select v-model="formModel[${modelKey}]" :placeholder=${placeholder}>`
    )
    lines.push(
      `        <el-option v-for="opt in options[${modelKey}]" :key="opt.value" :label="opt.label" :value="opt.value" />`
    )
    lines.push('      </el-select>')
  } else if (field.type === 'radio') {
    lines.push(`      <el-radio-group v-model="formModel[${modelKey}]">`)
    lines.push(
      `        <el-radio v-for="opt in options[${modelKey}]" :key="opt.value" :label="opt.value">`
    )
    lines.push('          {{ opt.label }}')
    lines.push('        </el-radio>')
    lines.push('      </el-radio-group>')
  } else if (field.type === 'checkbox') {
    lines.push(`      <el-checkbox-group v-model="formModel[${modelKey}]">`)
    lines.push(
      `        <el-checkbox v-for="opt in options[${modelKey}]" :key="opt.value" :label="opt.value">`
    )
    lines.push('          {{ opt.label }}')
    lines.push('        </el-checkbox>')
    lines.push('      </el-checkbox-group>')
  } else if (field.type === 'switch') {
    lines.push(`      <el-switch v-model="formModel[${modelKey}]" />`)
  } else {
    lines.push(
      `      <el-input v-model="formModel[${modelKey}]" :placeholder=${placeholder} />`
    )
  }

  lines.push('    </el-form-item>')
  return lines.join('\n')
}
const buildGeneratedCode = () => {
  const templateLines = schema.value.map((field) => buildFieldTemplate(field))
  const modelLines = schema.value.map((field) => {
    if (field.type === 'checkbox') return `  ${JSON.stringify(field.prop)}: [],`
    if (field.type === 'switch')
      return `  ${JSON.stringify(field.prop)}: false,`
    return `  ${JSON.stringify(field.prop)}: '',`
  })
  const optionLines = schema.value
    .filter((field) => needsOptions(field.type))
    .map((field) => {
      const optionValue = JSON.stringify(field.options ?? [], null, 2).replace(
        /\n/g,
        '\n  '
      )
      return `  ${JSON.stringify(field.prop)}: ${optionValue},`
    })

  const scriptLines = [
    '<script setup lang="ts">',
    "import { reactive } from 'vue'",
    '',
    'const formModel = reactive({',
    ...modelLines,
    '})'
  ]

  if (optionLines.length > 0) {
    scriptLines.push('', 'const options = {', ...optionLines, '}')
  }

  scriptLines.push('</' + 'script>')

  return [
    '<template>',
    '  <el-form label-width="100px">',
    ...templateLines,
    '  </el-form>',
    '</template>',
    '',
    ...scriptLines,
    ''
  ].join('\n')
}

const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const openCodeDialog = () => {
  generatedCode.value = buildGeneratedCode()
  codeDialogVisible.value = true
}

const copyCode = async () => {
  if (!generatedCode.value) return
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    ElMessage.success('代码已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const downloadPage = () => {
  if (!generatedCode.value) return
  downloadBlob(
    generatedCode.value,
    'GeneratedForm.vue',
    'text/plain;charset=utf-8'
  )
  ElMessage.success('页面已下载')
}

const downloadConfig = () => {
  const payload = {
    schema: schema.value
  }
  const content = JSON.stringify(payload, null, 2)
  downloadBlob(content, 'form-schema.json', 'application/json;charset=utf-8')
  ElMessage.success('配置已下载')
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  color: #1f2329;
  background: linear-gradient(180deg, #f5f7fb 0%, #eef2f8 100%);
}

.header {
  background: #fff;
  border: 1px solid #e6e9ef;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.header h2 {
  margin: 0 0 6px;
  font-size: 20px;
}

.header p {
  margin: 0;
  color: #6b7280;
}

.layout {
  display: grid;
  grid-template-columns: 240px 1fr 300px;
  gap: 16px;
  align-items: start;
}

.toolbox,
.props {
  background: #fff;
  border: 1px solid #e6e9ef;
  border-radius: 14px;
  padding: 14px;
  height: calc(100vh - 230px);
  overflow: auto;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.toolbox-title,
.props-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.toolbox-group {
  margin-bottom: 14px;
}

.toolbox-group-title {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 8px;
}

.tool {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: grab;
  background: #f8fafc;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease;
}

.tool:hover {
  border-color: #c7d2fe;
  box-shadow: 0 6px 12px rgba(99, 102, 241, 0.12);
  transform: translateY(-1px);
}

.tool:active {
  cursor: grabbing;
  transform: scale(0.99);
}

.canvas {
  min-height: 520px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  background: #fff;
  padding: 12px 16px 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 10px;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 13px;
}

.empty {
  color: #94a3b8;
  padding: 16px;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 6px;
}

.field {
  position: relative;
  border: 1px solid #eef2f7;
  padding: 12px 12px 12px 10px;
  border-radius: 10px;
  background: #fff;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.field:hover {
  border-color: #d6e0ff;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.08);
}

.field.dragging {
  opacity: 0.6;
  transform: scale(0.99);
}

.field.active {
  border-color: #3b82f6;
  background: #f4f8ff;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.16);
}

.field-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px;
  border-radius: 8px;
}

.icon-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;
  color: #334155;
  transition:
    border-color 120ms ease,
    color 120ms ease,
    background 120ms ease;
}

.icon-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.icon-btn:disabled {
  cursor: not-allowed;
  color: #9aa4b2;
  background: #f1f5f9;
}

.icon-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fff5f5;
}

.icon-btn.danger:hover {
  background: #fee2e2;
}

.props-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.props-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
}

.props-label {
  color: #6b7280;
}

.props-input :deep(.el-input-group__prepend) {
  width: 70px;
  color: #64748b;
}

.options {
  border-top: 1px dashed #e2e8f0;
  padding-top: 12px;
}

.options-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}

.option-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
</style>
