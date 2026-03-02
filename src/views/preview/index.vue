<template>
  <div class="preview-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <header class="hero panel">
      <div class="hero-main">
        <span class="hero-badge">ONLINE PREVIEW</span>
        <h1>文件在线预览中心</h1>
        <p>支持 PDF、Word、Excel、图片和文本文件，支持拖拽上传与快速下载。</p>
      </div>

      <div class="hero-stats">
        <div class="hero-stat">
          <span class="label">当前文件</span>
          <span class="value">{{ file ? file.name : '未选择' }}</span>
        </div>
        <div class="hero-stat">
          <span class="label">预览类型</span>
          <span class="value">{{ previewTypeLabel }}</span>
        </div>
      </div>
    </header>

    <section
      class="upload-panel panel"
      :class="{ dragover: dragActive }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInputRef"
        class="hidden-input"
        type="file"
        @change="onFileChange"
      />

      <div class="upload-left">
        <h3>上传文件</h3>
        <p>点击选择文件，或将文件拖拽到这里</p>
        <div class="upload-actions">
          <button class="btn primary" type="button" @click="triggerPick">
            选择文件
          </button>
          <button
            class="btn"
            type="button"
            :disabled="!file"
            @click="clearFile"
          >
            清空
          </button>
          <a
            v-if="file && objectUrl"
            class="btn link"
            :href="objectUrl"
            :download="file.name"
            >下载当前文件</a
          >
        </div>
      </div>

      <div class="upload-right">
        <span class="support-title">支持类型</span>
        <div class="support-tags">
          <span v-for="item in supportTypes" :key="item" class="tag">{{
            item
          }}</span>
        </div>
      </div>
    </section>

    <section class="workspace">
      <aside class="meta-panel panel">
        <h3>文件信息</h3>

        <div v-if="!file" class="meta-empty">请选择文件后查看详细信息</div>

        <template v-else>
          <div class="meta-item">
            <span class="meta-label">文件名</span>
            <span class="meta-value strong">{{ file.name }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">MIME 类型</span>
            <span class="meta-value">{{ file.type || '未知' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">文件大小</span>
            <span class="meta-value">{{ sizeText }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">预览类型</span>
            <span class="meta-value">{{ previewTypeLabel }}</span>
          </div>

          <div class="meta-message" :class="{ warning: message }">
            {{ message || '文件已就绪，可直接预览。' }}
          </div>
        </template>
      </aside>

      <main class="preview-panel panel">
        <div class="preview-head">
          <span class="head-title">预览窗口</span>
          <span class="head-sub">{{ headStatusText }}</span>
        </div>

        <div class="preview-stage">
          <div v-if="!file" class="state-box">请选择文件开始预览</div>
          <div v-else-if="loading" class="state-box">文件加载中，请稍候...</div>
          <div v-else-if="message" class="state-box warning">{{ message }}</div>

          <vue-office-pdf
            v-else-if="previewType === 'pdf'"
            class="office"
            :src="objectUrl"
          />

          <vue-office-docx
            v-else-if="previewType === 'docx'"
            class="office"
            :src="docxData"
            @error="onOfficeError"
          />

          <vue-office-excel
            v-else-if="previewType === 'excel'"
            class="office"
            :src="excelData"
            @error="onOfficeError"
          />

          <img
            v-else-if="previewType === 'image'"
            class="image"
            :src="objectUrl"
            alt="preview"
          />

          <pre v-else-if="previewType === 'text'" class="text">{{
            textContent
          }}</pre>

          <div v-else class="state-box warning">
            暂不支持该文件类型的在线预览
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import VueOfficeDocx from '@vue-office/docx/lib/v3/index.js'
import VueOfficeExcel from '@vue-office/excel/lib/v3/index.js'
import VueOfficePdf from '@vue-office/pdf/lib/v3/index.js'
import '@vue-office/docx/lib/v3/index.css'
import '@vue-office/excel/lib/v3/index.css'

type PreviewType = 'pdf' | 'docx' | 'excel' | 'image' | 'text' | 'none'

const supportTypes = [
  'PDF',
  'DOCX',
  'XLSX/XLS',
  'PNG/JPG/WebP',
  'TXT/MD/JSON/CSV'
]

const fileInputRef = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const objectUrl = ref('')
const textContent = ref('')
const previewType = ref<PreviewType>('none')
const message = ref('')
const loading = ref(false)
const dragActive = ref(false)
const docxData = ref<ArrayBuffer | null>(null)
const excelData = ref<ArrayBuffer | null>(null)

const previewTypeLabel = computed(() => {
  const map: Record<PreviewType, string> = {
    pdf: 'PDF',
    docx: 'Word (DOCX)',
    excel: 'Excel (XLSX/XLS)',
    image: '图片',
    text: '文本',
    none: '未识别'
  }
  return map[previewType.value]
})

const headStatusText = computed(() => {
  if (!file.value) return '未选择文件'
  if (loading.value) return '正在读取文件'
  if (message.value) return '当前文件不可预览'
  return '预览已就绪'
})

const sizeText = computed(() => {
  if (!file.value) return ''
  const size = file.value.size
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
})

const clearObjectUrl = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
}

const resetPreview = () => {
  clearObjectUrl()
  textContent.value = ''
  previewType.value = 'none'
  message.value = ''
  loading.value = false
  docxData.value = null
  excelData.value = null
}

const clearFile = () => {
  resetPreview()
  file.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const triggerPick = () => {
  fileInputRef.value?.click()
}

const isTextFile = (f: File) => {
  const type = f.type.toLowerCase()
  if (type.startsWith('text/')) return true
  if (type === 'application/json') return true
  const name = f.name.toLowerCase()
  return ['.txt', '.md', '.json', '.log', '.xml', '.csv'].some((ext) =>
    name.endsWith(ext)
  )
}

const readAsArrayBuffer = (f: File) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsArrayBuffer(f)
  })

const readAsText = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsText(f)
  })

const onOfficeError = () => {
  message.value = '文件解析失败，请确认文件完整性后重试。'
}

const loadFile = async (picked: File) => {
  resetPreview()
  file.value = picked
  objectUrl.value = URL.createObjectURL(picked)

  const type = picked.type.toLowerCase()
  const name = picked.name.toLowerCase()

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    previewType.value = 'pdf'
    return
  }

  if (type.startsWith('image/')) {
    previewType.value = 'image'
    return
  }

  if (name.endsWith('.docx')) {
    previewType.value = 'docx'
    loading.value = true
    try {
      docxData.value = await readAsArrayBuffer(picked)
    } catch {
      message.value = '读取文件失败，请重试。'
    } finally {
      loading.value = false
    }
    return
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    previewType.value = 'excel'
    loading.value = true
    try {
      excelData.value = await readAsArrayBuffer(picked)
    } catch {
      message.value = '读取文件失败，请重试。'
    } finally {
      loading.value = false
    }
    return
  }

  if (isTextFile(picked)) {
    previewType.value = 'text'
    loading.value = true
    try {
      textContent.value = await readAsText(picked)
    } catch {
      message.value = '读取文件失败，请重试。'
    } finally {
      loading.value = false
    }
    return
  }

  previewType.value = 'none'
  if (name.endsWith('.doc')) {
    message.value = '老版 Word（.doc）暂不支持，请转换为 .docx。'
  } else if (name.endsWith('.exe')) {
    message.value = 'EXE 文件不支持预览，请确认来源后下载使用。'
  } else {
    message.value = '该文件类型暂不支持在线预览。'
  }
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0] || null
  input.value = ''
  if (!picked) return
  await loadFile(picked)
}

const onDragEnter = () => {
  dragActive.value = true
}

const onDragOver = () => {
  dragActive.value = true
}

const onDragLeave = (event: DragEvent) => {
  const target = event.currentTarget as HTMLElement | null
  const related = event.relatedTarget as Node | null
  if (target && related && target.contains(related)) return
  dragActive.value = false
}

const onDrop = async (event: DragEvent) => {
  dragActive.value = false
  const picked = event.dataTransfer?.files?.[0] || null
  if (!picked) return
  await loadFile(picked)
}

onBeforeUnmount(() => {
  clearObjectUrl()
})
</script>

<style scoped>
.preview-page {
  --bg-main: #eef7f6;
  --panel-bg: rgba(255, 255, 255, 0.84);
  --line: #d8e8e6;
  --text-main: #193a42;
  --text-sub: #6a858b;
  --brand: #0f9d92;
  --brand-dark: #0b7b73;
  --warn: #b45309;
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
  opacity: 0.4;
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
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
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
  grid-template-columns: 1fr;
  gap: 10px;
  min-width: 260px;
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
  font-size: 13px;
  color: var(--text-main);
  font-weight: 700;
  word-break: break-all;
}

.upload-panel {
  margin-top: 14px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-style: dashed;
}

.upload-panel.dragover {
  border-color: var(--brand);
  background: rgba(229, 247, 244, 0.92);
}

.hidden-input {
  display: none;
}

.upload-left h3 {
  margin: 0;
  font-size: 18px;
}

.upload-left p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-sub);
}

.upload-actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #cfe2e0;
  background: #fff;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #b8d7d3;
}

.btn:disabled {
  cursor: not-allowed;
  color: #9bb0b5;
}

.btn.primary {
  border-color: transparent;
  background: linear-gradient(135deg, var(--brand), #11b0a4);
  color: #fff;
}

.btn.link {
  color: var(--brand-dark);
  background: #ecf9f7;
  border-color: #c7e9e5;
}

.upload-right {
  max-width: 360px;
}

.support-title {
  font-size: 12px;
  color: var(--text-sub);
}

.support-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid #d5e8e6;
  background: #f5fbfa;
  font-size: 11px;
  color: #44646a;
  display: inline-flex;
  align-items: center;
}

.workspace {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 14px;
  min-height: calc(100vh - 330px);
}

.meta-panel {
  padding: 16px;
}

.meta-panel h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.meta-empty {
  font-size: 13px;
  color: var(--text-sub);
}

.meta-item {
  padding: 9px 0;
  border-bottom: 1px dashed #dbeae8;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-item:last-of-type {
  border-bottom: none;
}

.meta-label {
  font-size: 11px;
  color: #6f8a90;
}

.meta-value {
  font-size: 13px;
  color: #23474f;
  word-break: break-all;
}

.meta-value.strong {
  font-weight: 700;
}

.meta-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 10px;
  background: #ecf8f6;
  color: #356168;
  font-size: 12px;
  line-height: 1.45;
}

.meta-message.warning {
  background: #fff4e9;
  color: #9a5a1a;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-head {
  height: 48px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #dceae8;
  background: rgba(255, 255, 255, 0.62);
}

.head-title {
  font-size: 14px;
  font-weight: 700;
}

.head-sub {
  font-size: 12px;
  color: var(--text-sub);
}

.preview-stage {
  flex: 1;
  min-height: 580px;
  padding: 12px;
  background: #f8fcfb;
  overflow: auto;
}

.office {
  width: 100%;
  min-height: 620px;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.image {
  display: block;
  max-width: 100%;
  max-height: 640px;
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid #ddeceb;
  background: #fff;
}

.text {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #dceae8;
  background: #fff;
  color: #1f3f45;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

.state-box {
  min-height: 220px;
  border: 2px dashed #d4e5e3;
  border-radius: 14px;
  background: #f5fbfa;
  color: #628187;
  display: grid;
  place-items: center;
  font-size: 14px;
  padding: 14px;
  text-align: center;
}

.state-box.warning {
  border-color: #ffd7b4;
  background: #fff5eb;
  color: var(--warn);
}

@media (max-width: 1150px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .meta-panel {
    order: 2;
  }

  .preview-panel {
    order: 1;
  }
}

@media (max-width: 820px) {
  .preview-page {
    padding: 14px;
  }

  .hero {
    flex-direction: column;
  }

  .hero-right {
    width: 100%;
  }

  .upload-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .upload-right {
    max-width: 100%;
  }

  .preview-stage {
    min-height: 460px;
  }

  .office {
    min-height: 500px;
  }
}
</style>
