<template>
  <div class="upload-center">
    <div class="hero card">
      <div>
        <span class="badge">UPLOAD CENTER</span>
        <h1>上传中心</h1>
        <p>
          支持图片/视频/音频/文档上传，同时具备大文件分片并发、断点续传、秒传和重试。
        </p>
      </div>

      <div class="hero-actions">
        <el-input-number
          v-model="settings.chunkSizeMB"
          :min="1"
          :max="64"
          :step="1"
        />
        <span class="label">分片(MB)</span>

        <el-input-number
          v-model="settings.concurrent"
          :min="1"
          :max="8"
          :step="1"
        />
        <span class="label">并发</span>

        <el-input-number
          v-model="settings.maxRetries"
          :min="0"
          :max="5"
          :step="1"
        />
        <span class="label">重试</span>

        <el-switch v-model="settings.autoStart" active-text="自动上传" />

        <el-button :icon="FolderOpened" @click="openFilePicker"
          >选择文件</el-button
        >
        <el-button
          type="primary"
          :icon="VideoPlay"
          :disabled="!hasPendingTask"
          @click="startAllUpload"
        >
          全部开始
        </el-button>
        <el-button
          :icon="VideoPause"
          :disabled="!hasRunningTask"
          @click="pauseAllUpload"
        >
          全部暂停
        </el-button>
        <el-button :icon="Delete" @click="clearCompletedTasks"
          >清理完成</el-button
        >
      </div>
    </div>

    <div class="stats card">
      <div class="stat-item">
        <span>本地任务</span>
        <strong>{{ localTasks.length }}</strong>
      </div>
      <div class="stat-item">
        <span>图片文件</span>
        <strong>{{ imageCount }}</strong>
      </div>
      <div class="stat-item stat-progress">
        <span>总进度 {{ totalProgress }}%</span>
        <el-progress
          :percentage="totalProgress"
          :show-text="false"
          :stroke-width="8"
        />
      </div>
      <div class="stat-item">
        <span>实时速率</span>
        <strong>{{ totalSpeedLabel }}</strong>
      </div>
    </div>

    <div class="drop-card card">
      <input
        ref="fileInputRef"
        class="hidden"
        type="file"
        multiple
        @change="handleFileChange"
      />
      <div
        class="drop-area"
        :class="{ active: dragActive }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="openFilePicker"
      >
        <el-icon class="drop-icon"><UploadFilled /></el-icon>
        <h3>拖拽文件到这里，或点击选择文件</h3>
        <p>图片、视频、音频、文档、压缩包都支持上传</p>
      </div>
    </div>

    <div class="card table-card">
      <div class="toolbar">
        <h3>本地上传队列</h3>
        <div class="toolbar-right">
          <el-select v-model="taskFilter" class="filter-select">
            <el-option label="全部" value="all" />
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="音频" value="audio" />
            <el-option label="文档" value="document" />
            <el-option label="压缩包" value="archive" />
            <el-option label="其他" value="other" />
          </el-select>
          <span class="count">{{ displayLocalTasks.length }} 条</span>
        </div>
      </div>

      <AppDataTable
        :data="displayLocalTasks"
        border
        empty-text="暂无任务，请先选择文件"
      >
        <el-table-column label="预览" width="82" align="center">
          <template #default="{ row }">
            <div class="thumb">
              <img
                v-if="row.category === 'image' && row.previewUrl"
                :src="row.previewUrl"
                :alt="row.fileName"
              />
              <span v-else>{{ categoryShort(row.category) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="fileName" label="文件名" min-width="220" />

        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="categoryTagType(row.category)">{{
              categoryLabel(row.category)
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="大小" width="120" align="right">
          <template #default="{ row }">{{
            formatBytes(row.fileSize)
          }}</template>
        </el-table-column>

        <el-table-column label="进度" min-width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :status="row.status === 'error' ? 'exception' : undefined"
            />
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{
              statusText(row.status)
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="速率" width="120" align="right">
          <template #default="{ row }">{{ formatSpeed(row.speed) }}</template>
        </el-table-column>

        <el-table-column label="结果" min-width="200">
          <template #default="{ row }">
            <a
              v-if="row.status === 'success' && row.fileUrl"
              :href="row.fileUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ row.fileUrl }}</a
            >
            <span v-else-if="row.errorMessage" class="error">{{
              row.errorMessage
            }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canStart(row)"
              type="primary"
              text
              :icon="VideoPlay"
              @click="startTask(row)"
            >
              {{ row.status === 'paused' ? '继续' : '开始' }}
            </el-button>
            <el-button
              v-if="canPause(row)"
              type="warning"
              text
              :icon="VideoPause"
              @click="pauseTask(row)"
              >暂停</el-button
            >
            <el-button
              v-if="row.status === 'error'"
              type="primary"
              text
              :icon="Refresh"
              @click="retryTask(row)"
              >重试</el-button
            >
            <el-button
              type="danger"
              text
              :icon="Delete"
              @click="removeLocalTask(row)"
              >移除</el-button
            >
          </template>
        </el-table-column>
      </AppDataTable>
    </div>
    <div class="card table-card">
      <div class="toolbar">
        <h3>服务端上传记录</h3>
        <div class="toolbar-right">
          <el-input
            v-model="serverKeyword"
            class="search-input"
            placeholder="搜索文件名"
            clearable
            @keyup.enter="refreshServerTasks"
          />
          <el-button :icon="Refresh" @click="refreshServerTasks"
            >刷新</el-button
          >
        </div>
      </div>

      <AppDataTable
        :data="serverTasks"
        border
        v-loading="serverLoading"
        empty-text="暂无服务端记录"
      >
        <el-table-column prop="fileName" label="文件名" min-width="220" />
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="categoryTagType(serverTaskCategory(row.fileName))">
              {{ categoryLabel(serverTaskCategory(row.fileName)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="120" align="right">
          <template #default="{ row }">{{
            formatBytes(row.fileSize)
          }}</template>
        </el-table-column>
        <el-table-column label="进度" width="150" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="serverStatusTagType(row.status)">{{
              serverStatusText(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
        <el-table-column label="文件地址" min-width="220">
          <template #default="{ row }">
            <a
              v-if="row.fileUrl"
              :href="row.fileUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ row.fileUrl }}</a
            >
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              text
              :icon="Delete"
              @click="removeServerTask(row.fileHash)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </AppDataTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  Delete,
  FolderOpened,
  Refresh,
  UploadFilled,
  VideoPause,
  VideoPlay
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  checkUpload,
  getUploadTasks,
  mergeUpload,
  removeUploadTask,
  uploadChunk,
  type UploadServerTask
} from '@/services/fileUpload'

type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'other'
type LocalTaskStatus =
  | 'queued'
  | 'hashing'
  | 'uploading'
  | 'paused'
  | 'merging'
  | 'success'
  | 'error'

type LocalTask = {
  uid: string
  file: File
  fileName: string
  fileSize: number
  category: FileCategory
  previewUrl?: string
  chunkSize: number
  totalChunks: number
  fileHash: string
  uploadedChunkSet: Set<number>
  progress: number
  uploadedBytes: number
  speed: number
  status: LocalTaskStatus
  retries: number
  errorMessage: string
  fileUrl?: string
  startAt: number
  controllers: Set<AbortController>
}

const MB = 1024 * 1024
const SAMPLE_SIZE = 2 * MB

const imageExtSet = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'svg',
  'avif'
])
const videoExtSet = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv'])
const audioExtSet = new Set(['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg'])
const archiveExtSet = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2'])
const documentExtSet = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'md',
  'csv',
  'json',
  'xml'
])

const fileInputRef = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)
const localTasks = ref<LocalTask[]>([])
const taskFilter = ref<'all' | FileCategory>('all')

const settings = reactive({
  chunkSizeMB: 5,
  concurrent: 3,
  maxRetries: 2,
  autoStart: true
})

const serverTasks = ref<UploadServerTask[]>([])
const serverLoading = ref(false)
const serverKeyword = ref('')

const displayLocalTasks = computed(() => {
  if (taskFilter.value === 'all') return localTasks.value
  return localTasks.value.filter((task) => task.category === taskFilter.value)
})

const imageCount = computed(
  () => localTasks.value.filter((task) => task.category === 'image').length
)

const hasPendingTask = computed(() => {
  return localTasks.value.some((task) =>
    ['queued', 'paused', 'error'].includes(task.status)
  )
})

const hasRunningTask = computed(() => {
  return localTasks.value.some((task) => task.status === 'uploading')
})

const totalProgress = computed(() => {
  const totalBytes = localTasks.value.reduce(
    (sum, task) => sum + task.fileSize,
    0
  )
  if (!totalBytes) return 0
  const uploadedBytes = localTasks.value.reduce(
    (sum, task) => sum + task.uploadedBytes,
    0
  )
  return Number(((uploadedBytes / totalBytes) * 100).toFixed(2))
})

const totalSpeedLabel = computed(() => {
  const speed = localTasks.value.reduce((sum, task) => sum + task.speed, 0)
  return formatSpeed(speed)
})

const createUid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const isAbortError = (error: unknown) => {
  return error instanceof DOMException && error.name === 'AbortError'
}

const getExtension = (fileName: string) => {
  const index = fileName.lastIndexOf('.')
  if (index < 0) return ''
  return fileName.slice(index + 1).toLowerCase()
}

const detectCategoryByName = (fileName: string): FileCategory => {
  const ext = getExtension(fileName)
  if (imageExtSet.has(ext)) return 'image'
  if (videoExtSet.has(ext)) return 'video'
  if (audioExtSet.has(ext)) return 'audio'
  if (archiveExtSet.has(ext)) return 'archive'
  if (documentExtSet.has(ext)) return 'document'
  return 'other'
}

const detectCategory = (file: File): FileCategory => {
  const mime = file.type.toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return detectCategoryByName(file.name)
}

const createPreviewUrl = (file: File, category: FileCategory) => {
  if (category !== 'image') return undefined
  return URL.createObjectURL(file)
}

const revokeTaskPreview = (task: LocalTask) => {
  if (!task.previewUrl) return
  URL.revokeObjectURL(task.previewUrl)
  task.previewUrl = undefined
}

const normalizeChunkList = (task: LocalTask, list: number[]) => {
  const set = new Set<number>()
  list.forEach((index) => {
    if (index >= 0 && index < task.totalChunks) set.add(index)
  })
  return set
}

const getChunkRange = (task: LocalTask, chunkIndex: number) => {
  const start = chunkIndex * task.chunkSize
  const end = Math.min(task.fileSize, start + task.chunkSize)
  return { start, end, size: Math.max(0, end - start) }
}

const recalculateTask = (task: LocalTask) => {
  let uploadedBytes = 0
  task.uploadedChunkSet.forEach((index) => {
    uploadedBytes += getChunkRange(task, index).size
  })
  task.uploadedBytes = uploadedBytes
  task.progress = Number(
    ((uploadedBytes / Math.max(task.fileSize, 1)) * 100).toFixed(2)
  )

  if (task.status === 'uploading') {
    const elapsed = Math.max((Date.now() - task.startAt) / 1000, 1)
    task.speed = uploadedBytes / elapsed
  } else {
    task.speed = 0
  }
}

const resetTaskControllers = (task: LocalTask) => {
  task.controllers.forEach((controller) => controller.abort())
  task.controllers.clear()
}

const fileToHash = async (file: File) => {
  if (!window.crypto?.subtle) {
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  const blocks: Uint8Array[] = []
  const meta = new TextEncoder().encode(
    `${file.name}|${file.size}|${file.lastModified}|${file.type}`
  )
  blocks.push(meta)

  const first = new Uint8Array(
    await file.slice(0, Math.min(SAMPLE_SIZE, file.size)).arrayBuffer()
  )
  blocks.push(first)

  if (file.size > SAMPLE_SIZE) {
    const last = new Uint8Array(
      await file
        .slice(Math.max(file.size - SAMPLE_SIZE, 0), file.size)
        .arrayBuffer()
    )
    blocks.push(last)
  }

  const total = blocks.reduce((sum, block) => sum + block.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  blocks.forEach((block) => {
    merged.set(block, offset)
    offset += block.length
  })

  const digest = await crypto.subtle.digest('SHA-256', merged)
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
}

const createTask = (file: File): LocalTask => {
  const chunkSize = Math.max(1, Math.floor(settings.chunkSizeMB)) * MB
  const category = detectCategory(file)

  return {
    uid: createUid(),
    file,
    fileName: file.name,
    fileSize: file.size,
    category,
    previewUrl: createPreviewUrl(file, category),
    chunkSize,
    totalChunks: Math.max(1, Math.ceil(file.size / chunkSize)),
    fileHash: '',
    uploadedChunkSet: new Set<number>(),
    progress: 0,
    uploadedBytes: 0,
    speed: 0,
    status: 'queued',
    retries: 0,
    errorMessage: '',
    startAt: 0,
    controllers: new Set<AbortController>()
  }
}

const addFiles = (files: File[]) => {
  const available = files.filter((file) => file.size > 0)
  if (!available.length) {
    ElMessage.warning('未检测到可上传文件')
    return
  }

  const added: LocalTask[] = []
  available.forEach((file) => {
    const exists = localTasks.value.some(
      (task) =>
        task.fileName === file.name &&
        task.fileSize === file.size &&
        task.file.lastModified === file.lastModified
    )

    if (!exists) {
      added.push(createTask(file))
    }
  })

  if (!added.length) {
    ElMessage.info('文件已存在上传队列')
    return
  }

  localTasks.value = [...added, ...localTasks.value]
  if (settings.autoStart) {
    added.forEach((task) => {
      void startTask(task)
    })
  }
}

const uploadSingleChunk = async (task: LocalTask, chunkIndex: number) => {
  let attempt = 0
  while (attempt <= settings.maxRetries) {
    if (task.status !== 'uploading') return

    const controller = new AbortController()
    task.controllers.add(controller)

    try {
      const range = getChunkRange(task, chunkIndex)
      const chunkHash = `${task.fileHash}-${chunkIndex}-${range.start}-${range.end}`
      const result = await uploadChunk(
        {
          fileHash: task.fileHash,
          fileName: task.fileName,
          fileSize: task.fileSize,
          chunkSize: task.chunkSize,
          totalChunks: task.totalChunks,
          chunkIndex,
          chunkHash
        },
        controller.signal
      )

      if (result.code !== 200) {
        throw new Error(result.message || '分片上传失败')
      }

      task.uploadedChunkSet.add(chunkIndex)
      recalculateTask(task)
      return
    } catch (error) {
      if (isAbortError(error) || task.status !== 'uploading') return

      attempt += 1
      task.retries += 1
      if (attempt > settings.maxRetries) {
        throw error
      }
      await wait(400 * attempt)
    } finally {
      task.controllers.delete(controller)
    }
  }
}

const uploadTaskInChunks = async (task: LocalTask) => {
  const pending = Array.from(
    { length: task.totalChunks },
    (_, index) => index
  ).filter((index) => !task.uploadedChunkSet.has(index))

  if (!pending.length) return

  const workers = Math.min(Math.max(1, settings.concurrent), pending.length)
  let cursor = 0

  const runWorker = async () => {
    while (cursor < pending.length) {
      if (task.status !== 'uploading') return
      const current = pending[cursor]
      cursor += 1
      if (typeof current !== 'number') return
      await uploadSingleChunk(task, current)
    }
  }

  await Promise.all(Array.from({ length: workers }, () => runWorker()))
}

const startTask = async (task: LocalTask) => {
  if (
    task.status === 'uploading' ||
    task.status === 'merging' ||
    task.status === 'hashing'
  ) {
    return
  }

  task.errorMessage = ''
  task.retries = 0

  try {
    if (!task.fileHash) {
      task.status = 'hashing'
      task.fileHash = await fileToHash(task.file)
    }

    const checkResult = await checkUpload({
      fileHash: task.fileHash,
      fileName: task.fileName,
      fileSize: task.fileSize,
      chunkSize: task.chunkSize,
      totalChunks: task.totalChunks
    })

    if (checkResult.code !== 200) {
      throw new Error(checkResult.message || '上传校验失败')
    }

    if (checkResult.data.merged && !checkResult.data.shouldUpload) {
      task.status = 'success'
      task.uploadedChunkSet = new Set(
        Array.from({ length: task.totalChunks }, (_, i) => i)
      )
      task.uploadedBytes = task.fileSize
      task.progress = 100
      task.fileUrl = checkResult.data.fileUrl
      task.speed = 0
      ElMessage.success(`${task.fileName} 秒传成功`)
      await refreshServerTasks()
      return
    }

    task.uploadedChunkSet = normalizeChunkList(
      task,
      checkResult.data.uploadedChunks
    )
    task.startAt = Date.now()
    task.status = 'uploading'
    recalculateTask(task)

    await uploadTaskInChunks(task)

    if (task.status !== 'uploading') return
    if (task.uploadedChunkSet.size < task.totalChunks) return

    task.status = 'merging'
    recalculateTask(task)

    const mergeResult = await mergeUpload({
      fileHash: task.fileHash,
      fileName: task.fileName,
      fileSize: task.fileSize,
      totalChunks: task.totalChunks
    })

    if (mergeResult.code !== 200) {
      throw new Error(mergeResult.message || '分片合并失败')
    }

    task.status = 'success'
    task.fileUrl = mergeResult.data.fileUrl
    task.uploadedChunkSet = new Set(
      Array.from({ length: task.totalChunks }, (_, i) => i)
    )
    task.uploadedBytes = task.fileSize
    task.progress = 100
    task.speed = 0

    ElMessage.success(`${task.fileName} 上传成功`)
    await refreshServerTasks()
  } catch (error) {
    if (task.status === 'paused') return
    task.status = 'error'
    task.speed = 0
    task.errorMessage = error instanceof Error ? error.message : '上传失败'
    ElMessage.error(`${task.fileName}：${task.errorMessage}`)
  } finally {
    resetTaskControllers(task)
  }
}

const pauseTask = (task: LocalTask) => {
  if (task.status !== 'uploading') return
  task.status = 'paused'
  task.speed = 0
  resetTaskControllers(task)
}

const retryTask = (task: LocalTask) => {
  task.status = 'queued'
  task.errorMessage = ''
  void startTask(task)
}

const removeLocalTask = (task: LocalTask) => {
  resetTaskControllers(task)
  revokeTaskPreview(task)
  localTasks.value = localTasks.value.filter((item) => item.uid !== task.uid)
}

const canPause = (task: LocalTask) => task.status === 'uploading'
const canStart = (task: LocalTask) =>
  ['queued', 'paused', 'error'].includes(task.status)

const startAllUpload = () => {
  localTasks.value.forEach((task) => {
    if (canStart(task)) {
      void startTask(task)
    }
  })
}

const pauseAllUpload = () => {
  localTasks.value.forEach((task) => {
    if (canPause(task)) {
      pauseTask(task)
    }
  })
}

const clearCompletedTasks = () => {
  localTasks.value
    .filter((task) => task.status === 'success')
    .forEach((task) => {
      revokeTaskPreview(task)
    })

  localTasks.value = localTasks.value.filter(
    (task) => task.status !== 'success'
  )
}

const refreshServerTasks = async () => {
  serverLoading.value = true
  try {
    const result = await getUploadTasks(serverKeyword.value)
    if (result.code === 200) {
      serverTasks.value = result.data.list
      return
    }
    ElMessage.error(result.message || '获取服务端任务失败')
  } catch {
    ElMessage.error('获取服务端任务失败')
  } finally {
    serverLoading.value = false
  }
}

const removeServerTask = (fileHash: string) => {
  ElMessageBox.confirm('确定删除这条服务端上传记录吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const result = await removeUploadTask(fileHash)
      if (result.code === 200) {
        ElMessage.success('删除成功')
        await refreshServerTasks()
      } else {
        ElMessage.error(result.message || '删除失败')
      }
    })
    .catch(() => {})
}

const openFilePicker = () => fileInputRef.value?.click()

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files ? Array.from(target.files) : []
  addFiles(files)
  target.value = ''
}

const handleDragOver = () => {
  dragActive.value = true
}

const handleDragLeave = () => {
  dragActive.value = false
}

const handleDrop = (event: DragEvent) => {
  dragActive.value = false
  const files = event.dataTransfer?.files
    ? Array.from(event.dataTransfer.files)
    : []
  addFiles(files)
}

const categoryLabel = (category: FileCategory) => {
  const map: Record<FileCategory, string> = {
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
    archive: '压缩包',
    other: '其他'
  }
  return map[category]
}

const categoryShort = (category: FileCategory) => {
  const map: Record<FileCategory, string> = {
    image: 'IMG',
    video: 'VID',
    audio: 'AUD',
    document: 'DOC',
    archive: 'ZIP',
    other: 'FILE'
  }
  return map[category]
}

const categoryTagType = (
  category: FileCategory
): 'success' | 'warning' | 'primary' | 'info' => {
  const map: Record<FileCategory, 'success' | 'warning' | 'primary' | 'info'> =
    {
      image: 'success',
      video: 'warning',
      audio: 'warning',
      document: 'primary',
      archive: 'info',
      other: 'info'
    }
  return map[category]
}

const statusText = (status: LocalTaskStatus) => {
  const map: Record<LocalTaskStatus, string> = {
    queued: '待上传',
    hashing: '哈希中',
    uploading: '上传中',
    paused: '已暂停',
    merging: '合并中',
    success: '已完成',
    error: '失败'
  }
  return map[status]
}

const statusTagType = (status: LocalTaskStatus) => {
  const map: Record<
    LocalTaskStatus,
    'info' | 'warning' | 'primary' | 'success' | 'danger'
  > = {
    queued: 'info',
    hashing: 'warning',
    uploading: 'primary',
    paused: 'warning',
    merging: 'warning',
    success: 'success',
    error: 'danger'
  }
  return map[status]
}

const serverTaskCategory = (fileName: string) => detectCategoryByName(fileName)

const serverStatusText = (status: UploadServerTask['status']) => {
  const map: Record<UploadServerTask['status'], string> = {
    pending: '待上传',
    uploading: '上传中',
    completed: '已完成'
  }
  return map[status]
}

const serverStatusTagType = (status: UploadServerTask['status']) => {
  const map: Record<
    UploadServerTask['status'],
    'info' | 'primary' | 'success'
  > = {
    pending: 'info',
    uploading: 'primary',
    completed: 'success'
  }
  return map[status]
}

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2)} ${units[index]}`
}

const formatSpeed = (speed: number) => {
  if (!speed || speed <= 0) return '-'
  return `${formatBytes(speed)}/s`
}

onMounted(() => {
  void refreshServerTasks()
})

onUnmounted(() => {
  localTasks.value.forEach((task) => {
    resetTaskControllers(task)
    revokeTaskPreview(task)
  })
})
</script>

<style lang="scss" scoped>
.upload-center {
  --line: #d9e5ef;
  --panel: rgba(255, 255, 255, 0.88);
  --text: #16374c;
  --sub: #6f8797;

  min-height: calc(100vh - 60px);
  padding: 20px;
  color: var(--text);
  background:
    radial-gradient(circle at 8% 8%, #d8edf8 0%, transparent 30%),
    radial-gradient(circle at 92% 10%, #ffe9d8 0%, transparent 30%), #f3f8fb;
}

.card {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--panel);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 36px rgba(16, 50, 72, 0.1);
}

.hero {
  padding: 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
}

.badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #0f8ea6, #2a78d2);
}

.hero h1 {
  margin: 10px 0 8px;
  font-size: 30px;
}

.hero p {
  margin: 0;
  color: var(--sub);
  font-size: 14px;
}

.hero-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.label {
  font-size: 12px;
  color: var(--sub);
}

.stats {
  margin-top: 12px;
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  padding: 12px;
  border-radius: 12px;
  background: #f7fbff;
  border: 1px solid #deebf5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item span {
  font-size: 12px;
  color: var(--sub);
}

.stat-item strong {
  font-size: 24px;
}

.stat-progress {
  justify-content: center;
}

.drop-card,
.table-card {
  margin-top: 12px;
  padding: 14px;
}

.hidden {
  display: none;
}

.drop-area {
  min-height: 140px;
  border: 2px dashed #bdd1e0;
  border-radius: 14px;
  display: grid;
  place-items: center;
  text-align: center;
  background: linear-gradient(135deg, #f8fcff, #f1faf5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.drop-area.active,
.drop-area:hover {
  border-color: #0f8ea6;
  box-shadow: 0 8px 20px rgba(15, 142, 166, 0.14);
}

.drop-icon {
  font-size: 32px;
  color: #0f8ea6;
}

.drop-area h3 {
  margin: 8px 0 4px;
  font-size: 17px;
}

.drop-area p {
  margin: 0;
  color: var(--sub);
  font-size: 12px;
}

.toolbar {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.toolbar h3 {
  margin: 0;
  font-size: 17px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  width: 120px;
}

.search-input {
  width: 220px;
}

.count {
  color: var(--sub);
  font-size: 12px;
}

.thumb {
  width: 46px;
  height: 46px;
  margin: 0 auto;
  border-radius: 8px;
  border: 1px solid #dce8f3;
  background: #eff6fb;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 11px;
  font-weight: 700;
  color: #5b7688;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.error {
  color: #dc2626;
}

a {
  color: #1d4ed8;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: rgba(215, 236, 247, 0.45);
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.68);
  --el-table-row-hover-bg-color: rgba(212, 237, 248, 0.48);
  --el-table-border-color: #d8e5ee;
}

@media (max-width: 1300px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 860px) {
  .upload-center {
    padding: 12px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-right,
  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
