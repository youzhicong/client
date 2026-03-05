export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export type UserStatus = 'active' | 'invited' | 'disabled'

export interface UserItem {
  id: number
  code: string
  name: string
  email: string
  department: string
  location: string
  role: string
  status: UserStatus
  lastActive: string
  joinedAt: string
  avatar: string
  online: boolean
}

export interface UserListQuery {
  keyword?: string
  role?: string
  status?: UserStatus | ''
  page?: number
  pageSize?: number
}

export interface UserListSummary {
  total: number
  active: number
  invited: number
  disabled: number
}

export interface UserListResult {
  list: UserItem[]
  total: number
  page: number
  pageSize: number
  roleOptions: string[]
  summary: UserListSummary
}

export interface UserUpsertPayload {
  id?: number
  name: string
  email: string
  department: string
  location: string
  role: string
  status: UserStatus
}

export interface VisitLogItem {
  id: number
  visitorName: string
  ip: string
  userAgent: string
  path: string
  visitedAt: string
}

export interface VisitLogResult {
  list: VisitLogItem[]
  total: number
}

export interface VisitLogQuery {
  page?: number
  pageSize?: number
}

export interface RegisterVisitPayload {
  visitorName?: string
  path?: string
}

const requestJson = async <T>(url: string, init?: RequestInit) => {
  const response = await fetch(url, init)
  return (await response.json()) as ApiResult<T>
}

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    search.append(key, String(value))
  })
  return search.toString()
}

export const getUserList = (query: UserListQuery = {}) => {
  const search = buildQuery({
    keyword: query.keyword?.trim(),
    role: query.role,
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 8
  })
  return requestJson<UserListResult>(`/api/users/list?${search}`)
}

export const createUser = (payload: UserUpsertPayload) => {
  return requestJson<UserItem>('/api/users/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const updateUser = (payload: UserUpsertPayload & { id: number }) => {
  return requestJson<UserItem>('/api/users/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const deleteUserById = (id: number) => {
  return requestJson<null>(`/api/users/delete/${id}`, {
    method: 'DELETE'
  })
}

export const registerVisit = (payload: RegisterVisitPayload) => {
  return requestJson<VisitLogItem>('/api/users/visit/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const getVisitLogs = (query: VisitLogQuery = {}) => {
  const search = buildQuery({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20
  })
  return requestJson<VisitLogResult>(`/api/users/visit/logs?${search}`)
}
