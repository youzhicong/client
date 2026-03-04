export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export interface CheckUploadPayload {
  fileHash: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
}

export interface CheckUploadResult {
  shouldUpload: boolean
  merged: boolean
  uploadedChunks: number[]
  fileUrl?: string
}

export interface UploadChunkPayload extends CheckUploadPayload {
  chunkIndex: number
  chunkHash?: string
}

export interface UploadChunkResult {
  uploadedCount: number
  totalChunks: number
  uploadedChunks: number[]
  progress: number
}

export interface MergeUploadPayload {
  fileHash: string
  fileName: string
  fileSize: number
  totalChunks: number
}

export interface MergeUploadResult {
  fileHash: string
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}

export type UploadServerTaskStatus = 'pending' | 'uploading' | 'completed'

export interface UploadServerTask {
  fileHash: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  uploadedChunks: number
  progress: number
  status: UploadServerTaskStatus
  createdAt: string
  updatedAt: string
  fileUrl?: string
}

export interface UploadServerTaskListResult {
  list: UploadServerTask[]
  total: number
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  return (await response.json()) as ApiResult<T>
}

export const checkUpload = (payload: CheckUploadPayload) => {
  return requestJson<CheckUploadResult>('/api/upload/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const uploadChunk = (
  payload: UploadChunkPayload,
  signal?: AbortSignal
) => {
  return requestJson<UploadChunkResult>('/api/upload/chunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  })
}

export const mergeUpload = (payload: MergeUploadPayload) => {
  return requestJson<MergeUploadResult>('/api/upload/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const getUploadTasks = (keyword?: string) => {
  const query = keyword?.trim()
    ? `?keyword=${encodeURIComponent(keyword.trim())}`
    : ''
  return requestJson<UploadServerTaskListResult>(`/api/upload/tasks${query}`)
}

export const removeUploadTask = (fileHash: string) => {
  return requestJson<null>(`/api/upload/remove/${fileHash}`, {
    method: 'DELETE'
  })
}
