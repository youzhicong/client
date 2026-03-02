<template>
  <div class="designer-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <header class="hero panel">
      <div class="hero-left">
        <span class="hero-badge">FORM BUILDER</span>
        <h1>可视化表单设计器</h1>
        <p>拖拽组件、实时编辑属性、排序字段并一键生成页面代码。</p>
      </div>

      <div class="hero-right">
        <div class="hero-stat">
          <span class="label">组件库</span>
          <strong class="value">{{ totalTools }}</strong>
        </div>
        <div class="hero-stat">
          <span class="label">画布字段</span>
          <strong class="value">{{ schema.length }}</strong>
        </div>
        <div class="hero-stat">
          <span class="label">必填字段</span>
          <strong class="value">{{ requiredCount }}</strong>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="toolbox panel">
        <div class="panel-title">组件库</div>

        <div class="toolbox-group">
          <div class="group-title">输入类</div>
          <div
            v-for="tool in inputTools"
            :key="tool.type"
            class="tool"
            draggable="true"
            @dragstart="onToolDragStart($event, tool)"
          >
            <span class="tool-name">{{ tool.label }}</span>
            <span class="tool-desc">{{ tool.desc }}</span>
          </div>
        </div>

        <div class="toolbox-group">
          <div class="group-title">选择类</div>
          <div
            v-for="tool in selectTools"
            :key="tool.type"
            class="tool"
            draggable="true"
            @dragstart="onToolDragStart($event, tool)"
          >
            <span class="tool-name">{{ tool.label }}</span>
            <span class="tool-desc">{{ tool.desc }}</span>
          </div>
        </div>

        <div class="toolbox-group">
          <div class="group-title">其他</div>
          <div
            v-for="tool in otherTools"
            :key="tool.type"
            class="tool"
            draggable="true"
            @dragstart="onToolDragStart($event, tool)"
          >
            <span class="tool-name">{{ tool.label }}</span>
            <span class="tool-desc">{{ tool.desc }}</span>
          </div>
        </div>
      </aside>

      <main class="canvas panel" @dragover.prevent @drop="onCanvasDrop">
        <div class="canvas-header">
          <div class="canvas-title">
            <h3>表单画布</h3>
            <span class="canvas-sub">拖拽组件到此区域，点击字段可编辑属性</span>
          </div>

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
              >清空</el-button
            >
          </div>
        </div>

        <div v-if="schema.length === 0" class="canvas-empty">
          <div class="empty-main">开始拖拽组件，构建你的表单</div>
          <div class="empty-sub">支持字段排序、属性编辑和代码导出</div>
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
            <div class="field-head">
              <span class="field-type">{{ typeLabel(field.type) }}</span>
              <span class="field-prop">{{ field.prop }}</span>
            </div>

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

      <aside class="props panel">
        <div class="panel-title">属性面板</div>

        <div v-if="!activeField" class="props-empty">
          请选择画布中的组件进行编辑
        </div>

        <div v-else class="props-form">
          <div class="props-row fixed">
            <span class="props-label">组件类型</span>
            <span class="props-value">{{ typeLabel(activeField.type) }}</span>
          </div>

          <el-input
            v-model="activeField.label"
            placeholder="字段标题"
            class="props-input"
          >
            <template #prepend>标题</template>
          </el-input>

          <el-input
            v-model="activeField.prop"
            placeholder="字段 key"
            class="props-input"
          >
            <template #prepend>字段</template>
          </el-input>

          <el-input
            v-if="showPlaceholder(activeField.type)"
            v-model="activeField.placeholder"
            placeholder="请输入提示语"
            class="props-input"
          >
            <template #prepend>提示</template>
          </el-input>

          <div class="props-row">
            <span class="props-label">必填</span>
            <el-switch v-model="activeField.required" />
          </div>

          <div v-if="needsOptions(activeField.type)" class="options">
            <div class="options-title">选项列表</div>
            <div
              v-for="(opt, idx) in activeField.options"
              :key="opt.value + idx"
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
      width="760px"
      class="code-dialog"
      title="生成页面代码"
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
            >复制代码</el-button
          >
          <el-button
            type="primary"
            @click="downloadPage"
            :disabled="!generatedCode"
          >
            下载页面
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
  desc: string
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
  {
    type: 'input',
    label: '单行文本',
    desc: '用于普通文字输入',
    placeholder: '请输入内容'
  },
  {
    type: 'textarea',
    label: '多行文本',
    desc: '用于备注和说明',
    placeholder: '请输入内容'
  }
]

const selectTools: Tool[] = [
  {
    type: 'select',
    label: '下拉选择',
    desc: '单项下拉选择框',
    placeholder: '请选择',
    options: [
      { label: '选项一', value: 'option1' },
      { label: '选项二', value: 'option2' }
    ]
  },
  {
    type: 'radio',
    label: '单选组',
    desc: '单项互斥选择',
    options: [
      { label: '选项一', value: 'radio1' },
      { label: '选项二', value: 'radio2' }
    ]
  },
  {
    type: 'checkbox',
    label: '多选组',
    desc: '可同时选择多项',
    options: [
      { label: '选项一', value: 'check1' },
      { label: '选项二', value: 'check2' }
    ]
  }
]

const otherTools: Tool[] = [
  { type: 'switch', label: '开关', desc: '布尔状态切换' },
  {
    type: 'date',
    label: '日期选择',
    desc: '日期类输入',
    placeholder: '请选择日期'
  },
  { type: 'button', label: '按钮', desc: '操作按钮组件' }
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

const totalTools = computed(
  () => inputTools.length + selectTools.length + otherTools.length
)
const requiredCount = computed(
  () => schema.value.filter((item) => item.required).length
)

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

  if (tool.type === 'checkbox') {
    formModel[prop] = []
  } else if (tool.type === 'switch') {
    formModel[prop] = false
  } else {
    formModel[prop] = ''
  }

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

  if (activeId.value === id) {
    activeId.value = schema.value[0]?.id || ''
  }
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

const optionComponentFor = (type: FieldType): Component | '' =>
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
  ElMessage.success('页面代码已下载')
}

const downloadConfig = () => {
  const payload = { schema: schema.value }
  const content = JSON.stringify(payload, null, 2)
  downloadBlob(content, 'form-schema.json', 'application/json;charset=utf-8')
  ElMessage.success('配置文件已下载')
}
</script>

<style lang="scss" scoped>
.designer-page {
  --bg-main: #eef7f6;
  --panel-bg: rgba(255, 255, 255, 0.84);
  --line: #d9e8e6;
  --text-main: #193941;
  --text-sub: #6b868c;
  --brand: #0f9d92;
  --brand-dark: #0b7b73;
  --danger: #dc2626;
  --shadow: 0 20px 42px rgba(25, 58, 66, 0.12);

  position: relative;
  min-height: calc(100vh - 64px);
  overflow: hidden;
  padding: 24px;
  color: var(--text-main);
  background:
    radial-gradient(circle at 8% 6%, #daf4f1 0%, transparent 38%),
    radial-gradient(circle at 95% 10%, #ffe8d7 0%, transparent 35%),
    var(--bg-main);
  font-family: 'Space Grotesk', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.shape-a {
  right: -120px;
  top: -120px;
  width: 260px;
  height: 260px;
  opacity: 0.42;
  background: linear-gradient(135deg, #b5f2ec, #ffd9bc);
}

.shape-b {
  left: -140px;
  bottom: -190px;
  width: 320px;
  height: 320px;
  opacity: 0.34;
  background: linear-gradient(135deg, #bfe9ff, #b0f6d9);
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.hero {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #bee2de;
  background: #e9f8f6;
  color: var(--brand-dark);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.hero h1 {
  margin: 12px 0 8px;
  font-size: 30px;
  line-height: 1.08;
}

.hero p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.hero-right {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  min-width: 340px;
}

.hero-stat {
  border: 1px solid #d7e8e6;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.74);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-stat .label {
  font-size: 12px;
  color: var(--text-sub);
}

.hero-stat .value {
  font-size: 22px;
  line-height: 1;
}

.layout {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: 300px 1fr 330px;
  gap: 14px;
  min-height: calc(100vh - 240px);
}

.toolbox,
.props {
  padding: 14px;
  overflow: auto;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.toolbox-group {
  margin-bottom: 14px;
  padding: 10px;
  border: 1px solid #deedeb;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.68);
}

.group-title {
  font-size: 12px;
  color: #678389;
  margin-bottom: 8px;
  letter-spacing: 0.03em;
}

.tool {
  border: 1px solid #dbeae8;
  border-radius: 10px;
  padding: 9px 10px;
  background: #f7fcfb;
  margin-bottom: 8px;
  cursor: grab;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool:last-child {
  margin-bottom: 0;
}

.tool:hover {
  transform: translateY(-1px);
  border-color: #b9dfda;
  box-shadow: 0 8px 16px rgba(15, 157, 146, 0.12);
}

.tool:active {
  cursor: grabbing;
}

.tool-name {
  font-size: 13px;
  color: #1e4149;
  font-weight: 700;
}

.tool-desc {
  font-size: 11px;
  color: #6f8b90;
}

.canvas {
  padding: 14px;
  display: flex;
  flex-direction: column;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  border-bottom: 1px solid #deecea;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.canvas-title h3 {
  margin: 0;
  font-size: 17px;
}

.canvas-sub {
  margin-top: 4px;
  display: inline-block;
  font-size: 12px;
  color: #708b90;
}

.canvas-empty {
  min-height: 220px;
  border: 2px dashed #d2e5e2;
  border-radius: 14px;
  background: #f7fcfb;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 6px;
}

.empty-main {
  font-size: 15px;
  color: #1f444c;
  font-weight: 600;
}

.empty-sub {
  font-size: 12px;
  color: #708c91;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
  overflow: auto;
}

.field {
  border: 1px solid #dcebe9;
  border-radius: 12px;
  background: #fff;
  padding: 10px;
  position: relative;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.field:hover {
  border-color: #b7ddd8;
  box-shadow: 0 8px 16px rgba(15, 157, 146, 0.11);
}

.field.active {
  border-color: var(--brand);
  background: #f0fbfa;
  box-shadow: 0 10px 18px rgba(15, 157, 146, 0.2);
}

.field.dragging {
  opacity: 0.6;
  transform: scale(0.99);
}

.field-head {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.field-type {
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #e7f7f4;
  color: #0d7a71;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.field-prop {
  font-size: 11px;
  color: #68848a;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    monospace;
}

.field-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.icon-btn {
  border: 1px solid #d8e7e5;
  border-radius: 8px;
  background: #fff;
  color: #355960;
  font-size: 12px;
  padding: 3px 9px;
  cursor: pointer;
}

.icon-btn:hover {
  border-color: #bfdcd8;
  background: #f7fcfb;
}

.icon-btn:disabled {
  cursor: not-allowed;
  color: #9ab0b5;
  background: #f4f8f8;
}

.icon-btn.danger {
  border-color: #fecaca;
  color: var(--danger);
  background: #fff5f5;
}

.icon-btn.danger:hover {
  background: #fee2e2;
}

.props-empty {
  font-size: 13px;
  color: #708b90;
  padding: 12px;
  border: 1px dashed #d5e5e3;
  border-radius: 12px;
  background: #f8fcfc;
}

.props-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.props-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.props-row.fixed {
  padding: 10px;
  border: 1px solid #deecea;
  border-radius: 10px;
  background: #f8fcfb;
}

.props-label {
  font-size: 12px;
  color: #6f8a90;
}

.props-value {
  font-size: 13px;
  color: #1f444c;
  font-weight: 700;
}

.props-input :deep(.el-input-group__prepend) {
  width: 64px;
  color: #6f8a90;
}

.options {
  border-top: 1px dashed #dbe9e7;
  padding-top: 12px;
}

.options-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.option-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1380px) {
  .layout {
    grid-template-columns: 260px 1fr;
  }

  .props {
    grid-column: 1 / -1;
  }
}

@media (max-width: 960px) {
  .designer-page {
    padding: 14px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-right {
    width: 100%;
    min-width: 0;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .canvas-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .option-row {
    grid-template-columns: 1fr;
  }
}
</style>
