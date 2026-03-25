import { request } from '@/utils/request'

export type AnnouncementStatus = 'draft' | 'published'

export interface AnnouncementItem {
  id: number
  title: string
  summary: string
  content: string
  cover: string
  author: string
  status: AnnouncementStatus
  statusLabel: string
  viewCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string
}

export interface AnnouncementListItem {
  id: number
  title: string
  summary: string
  author: string
  status: AnnouncementStatus
  statusLabel: string
  viewCount: number
  publishedAt: string
  updatedAt: string
}

export interface AnnouncementSummary {
  total: number
  draft: number
  published: number
}

export interface AnnouncementListResult {
  list: AnnouncementListItem[]
  total: number
  page: number
  pageSize: number
  summary: AnnouncementSummary
}

export interface AnnouncementListQuery {
  keyword?: string
  status?: AnnouncementStatus | ''
  page?: number
  pageSize?: number
}

export interface AnnouncementSavePayload {
  id?: number
  title: string
  summary: string
  content: string
  cover?: string
  author?: string
}

interface IdPayload {
  id: number
}

export const getAnnouncementList = (query: AnnouncementListQuery = {}) => {
  return request<AnnouncementListResult>('/announcement/list', 'GET', {
    keyword: query.keyword?.trim(),
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10
  })
}

export const getAnnouncementDetail = (id: number) => {
  return request<AnnouncementItem>('/announcement/detail', 'GET', { id })
}

export const createAnnouncement = (payload: AnnouncementSavePayload) => {
  return request<AnnouncementItem>('/announcement/create', 'POST', payload)
}

export const updateAnnouncement = (
  payload: AnnouncementSavePayload & { id: number }
) => {
  return request<AnnouncementItem>('/announcement/update', 'POST', payload)
}

export const publishAnnouncement = (id: number) => {
  const payload: IdPayload = { id }
  return request<AnnouncementItem>('/announcement/publish', 'POST', payload)
}

export const deleteAnnouncement = (id: number) => {
  const payload: IdPayload = { id }
  return request<Record<string, never>>('/announcement/delete', 'POST', payload)
}
