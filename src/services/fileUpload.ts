import { request } from '@/utils/request'

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

export const checkUpload = (payload: CheckUploadPayload) => {
  return request<CheckUploadResult>('/upload/check', 'POST', payload)
}

export const uploadChunk = (
  payload: UploadChunkPayload,
  signal?: AbortSignal
) => {
  return request<UploadChunkResult>('/upload/chunk', 'POST', payload, {
    signal
  })
}

export const mergeUpload = (payload: MergeUploadPayload) => {
  return request<MergeUploadResult>('/upload/merge', 'POST', payload)
}

export const getUploadTasks = (keyword?: string) => {
  return request<UploadServerTaskListResult>('/upload/tasks', 'GET', {
    keyword: keyword?.trim() || undefined
  })
}

export const removeUploadTask = (fileHash: string) => {
  return request<null>(`/upload/remove/${fileHash}`, 'DELETE')
}
