import type { MockMethod } from 'vite-plugin-mock'

const useBackend = process.env.VITE_USE_BACKEND_FOR_CORE_APIS === 'true'

type UploadTaskState = {
  fileHash: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  uploadedChunks: Set<number>
  merged: boolean
  fileUrl?: string
  createdAt: number
  updatedAt: number
}

type UploadPayload = {
  fileHash?: string
  fileName?: string
  fileSize?: number
  chunkSize?: number
  totalChunks?: number
}

const taskStore = new Map<string, UploadTaskState>()

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const toSafeNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const num = Number(value)
    if (Number.isFinite(num)) return num
  }
  return fallback
}

const toSafeString = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : ''
}

const buildFileUrl = (task: UploadTaskState) => {
  return `/mock-upload/${task.fileHash}/${encodeURIComponent(task.fileName)}`
}

const ensureTask = (payload: UploadPayload) => {
  const fileHash = toSafeString(payload.fileHash)
  const fileName = toSafeString(payload.fileName)
  const fileSize = Math.max(0, toSafeNumber(payload.fileSize, 0))
  const chunkSize = Math.max(
    1,
    toSafeNumber(payload.chunkSize, 5 * 1024 * 1024)
  )
  const totalChunks = Math.max(1, toSafeNumber(payload.totalChunks, 1))

  let task = taskStore.get(fileHash)
  if (!task) {
    task = {
      fileHash,
      fileName,
      fileSize,
      chunkSize,
      totalChunks,
      uploadedChunks: new Set<number>(),
      merged: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    taskStore.set(fileHash, task)
    return task
  }

  task.fileName = fileName || task.fileName
  task.fileSize = fileSize || task.fileSize
  task.chunkSize = chunkSize || task.chunkSize
  task.totalChunks = totalChunks || task.totalChunks
  task.updatedAt = Date.now()
  return task
}

const formatTask = (task: UploadTaskState) => {
  const uploadedCount = task.uploadedChunks.size
  const progress = Number(
    ((uploadedCount / Math.max(task.totalChunks, 1)) * 100).toFixed(2)
  )
  return {
    fileHash: task.fileHash,
    fileName: task.fileName,
    fileSize: task.fileSize,
    chunkSize: task.chunkSize,
    totalChunks: task.totalChunks,
    uploadedChunks: uploadedCount,
    progress,
    status: task.merged
      ? 'completed'
      : uploadedCount > 0
        ? 'uploading'
        : 'pending',
    createdAt: new Date(task.createdAt).toISOString(),
    updatedAt: new Date(task.updatedAt).toISOString(),
    fileUrl: task.fileUrl
  }
}

export default (useBackend
  ? []
  : [
      {
        url: '/api/upload/check',
        method: 'post',
        response: ({ body }) => {
          const payload = (body || {}) as UploadPayload
          const fileHash = toSafeString(payload.fileHash)

          if (!fileHash) {
            return { code: 400, message: 'fileHash 不能为空' }
          }

          const task = ensureTask(payload)

          if (task.merged) {
            return {
              code: 200,
              message: '秒传成功',
              data: {
                shouldUpload: false,
                merged: true,
                uploadedChunks: [],
                fileUrl: task.fileUrl
              }
            }
          }

          return {
            code: 200,
            message: 'success',
            data: {
              shouldUpload: true,
              merged: false,
              uploadedChunks: Array.from(task.uploadedChunks).sort(
                (a, b) => a - b
              )
            }
          }
        }
      },
      {
        url: '/api/upload/chunk',
        method: 'post',
        response: async ({ body }) => {
          await delay(120 + Math.floor(Math.random() * 180))
          const payload = (body || {}) as UploadPayload & {
            chunkIndex?: number
          }
          const fileHash = toSafeString(payload.fileHash)

          if (!fileHash) {
            return { code: 400, message: 'fileHash 不能为空' }
          }

          const task = ensureTask(payload)
          const rawChunkIndex = toSafeNumber(payload.chunkIndex, -1)
          const chunkIndex = Math.min(
            task.totalChunks - 1,
            Math.max(0, Math.floor(rawChunkIndex))
          )

          task.uploadedChunks.add(chunkIndex)
          task.updatedAt = Date.now()

          const uploadedCount = task.uploadedChunks.size

          return {
            code: 200,
            message: 'chunk upload success',
            data: {
              uploadedCount,
              totalChunks: task.totalChunks,
              uploadedChunks: Array.from(task.uploadedChunks).sort(
                (a, b) => a - b
              ),
              progress: Number(
                ((uploadedCount / Math.max(task.totalChunks, 1)) * 100).toFixed(
                  2
                )
              )
            }
          }
        }
      },
      {
        url: '/api/upload/merge',
        method: 'post',
        response: ({ body }) => {
          const payload = (body || {}) as UploadPayload
          const fileHash = toSafeString(payload.fileHash)
          if (!fileHash) {
            return { code: 400, message: 'fileHash 不能为空' }
          }

          const task = taskStore.get(fileHash)
          if (!task) {
            return { code: 404, message: '未找到上传任务' }
          }

          if (task.uploadedChunks.size < task.totalChunks) {
            return {
              code: 409,
              message: '分片未上传完成，无法合并',
              data: {
                missingChunks: task.totalChunks - task.uploadedChunks.size
              }
            }
          }

          task.merged = true
          task.fileUrl = buildFileUrl(task)
          task.updatedAt = Date.now()

          return {
            code: 200,
            message: 'merge success',
            data: {
              fileHash: task.fileHash,
              fileName: task.fileName,
              fileSize: task.fileSize,
              fileUrl: task.fileUrl,
              uploadedAt: new Date(task.updatedAt).toISOString()
            }
          }
        }
      },
      {
        url: '/api/upload/tasks',
        method: 'get',
        response: ({ query }) => {
          const keyword = toSafeString(query?.keyword).toLowerCase()

          const list = Array.from(taskStore.values())
            .filter((task) => {
              if (!keyword) return true
              return (
                task.fileName.toLowerCase().includes(keyword) ||
                task.fileHash.toLowerCase().includes(keyword)
              )
            })
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map(formatTask)

          return {
            code: 200,
            message: 'success',
            data: {
              list,
              total: list.length
            }
          }
        }
      },
      {
        url: '/api/upload/remove/:fileHash',
        method: 'delete',
        response: ({ params }) => {
          const fileHash = toSafeString(params?.fileHash)
          if (!fileHash) {
            return { code: 400, message: 'fileHash 不能为空' }
          }
          taskStore.delete(fileHash)
          return { code: 200, message: 'remove success', data: null }
        }
      }
    ]) as MockMethod[]
