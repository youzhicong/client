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

interface ApiResult<T> {
  code: number
  message: string
  data: T
}

const requestJson = async <T>(url: string, init?: RequestInit) => {
  const response = await fetch(url, init)
  return (await response.json()) as ApiResult<T>
}

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    query.append(key, String(value))
  })
  return query.toString()
}

export const getAnnouncementList = (query: AnnouncementListQuery = {}) => {
  const queryText = buildQuery({
    keyword: query.keyword?.trim(),
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10
  })
  return requestJson<AnnouncementListResult>(
    `/api/announcement/list?${queryText}`
  )
}

export const getAnnouncementDetail = (id: number) => {
  return requestJson<AnnouncementItem>(`/api/announcement/detail?id=${id}`)
}

export const createAnnouncement = (payload: AnnouncementSavePayload) => {
  return requestJson<AnnouncementItem>('/api/announcement/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const updateAnnouncement = (
  payload: AnnouncementSavePayload & { id: number }
) => {
  return requestJson<AnnouncementItem>('/api/announcement/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const publishAnnouncement = (id: number) => {
  const payload: IdPayload = { id }
  return requestJson<AnnouncementItem>('/api/announcement/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const deleteAnnouncement = (id: number) => {
  const payload: IdPayload = { id }
  return requestJson<Record<string, never>>('/api/announcement/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
