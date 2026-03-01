<template>
  <div class="page">
    <div class="header">
      <h2>在线预览</h2>
      <p>使用 vue-office 预览 PDF、Word、Excel，其他类型给出提示。</p>
    </div>

    <div class="toolbar">
      <label class="file-btn">
        <input type="file" @change="onFileChange" />
        <span>选择文件</span>
      </label>
      <button class="btn" :disabled="!file" @click="clearFile">清空</button>
      <a
        v-if="file && objectUrl"
        class="link"
        :href="objectUrl"
        :download="file.name"
        >下载当前文件</a
      >
    </div>

    <div v-if="file" class="meta">
      <div><strong>名称：</strong>{{ file.name }}</div>
      <div><strong>类型：</strong>{{ file.type || '未知' }}</div>
      <div><strong>大小：</strong>{{ sizeText }}</div>
    </div>

    <div class="preview">
      <div v-if="!file" class="empty">请选择文件开始预览。</div>
      <div v-else-if="loading" class="empty">加载中，请稍候…</div>
      <div v-else-if="message" class="empty">{{ message }}</div>
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
      <div v-else class="empty">暂不支持该文件类型的在线预览。</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import VueOfficeDocx from '@vue-office/docx/lib/index.js'
import VueOfficeExcel from '@vue-office/excel'
import VueOfficePdf from '@vue-office/pdf'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'

type PreviewType = 'pdf' | 'docx' | 'excel' | 'image' | 'text' | 'none'

const file = ref<File | null>(null)
const objectUrl = ref('')
const textContent = ref('')
const previewType = ref<PreviewType>('none')
const message = ref('')
const loading = ref(false)
const docxData = ref<ArrayBuffer | null>(null)
const excelData = ref<ArrayBuffer | null>(null)

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
  message.value = '文件解析失败，请确认文件完整性。'
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0] || null
  input.value = ''
  if (!picked) return

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
    message.value = 'EXE 不支持预览，请确认来源后下载使用。'
  } else {
    message.value = '该文件类型暂不支持在线预览。'
  }
}

onBeforeUnmount(() => {
  clearObjectUrl()
})
</script>

<style scoped>
.page {
  padding: 24px;
  color: #1f2329;
}

.header h2 {
  margin: 0 0 8px;
}

.header p {
  margin: 0 0 16px;
  color: #5f6b7a;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.file-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 6px;
  background: #1677ff;
  color: #fff;
  cursor: pointer;
}

.file-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.btn {
  padding: 8px 14px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.btn:disabled {
  cursor: not-allowed;
  color: #9aa4b2;
}

.link {
  color: #1677ff;
  text-decoration: none;
}

.meta {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  color: #3b4252;
}

.preview {
  min-height: 420px;
  border: 1px dashed #d0d7de;
  border-radius: 8px;
  padding: 12px;
  background: #fafbfc;
}

.office {
  width: 100%;
  min-height: 520px;
}

.image {
  max-width: 100%;
  max-height: 520px;
  display: block;
  margin: 0 auto;
}

.text {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

.empty {
  color: #5f6b7a;
  padding: 16px;
}
</style>
