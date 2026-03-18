import { request } from '@/utils/request'

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

export const getUserList = (query: UserListQuery = {}) => {
  return request<UserListResult>('/users/list', 'GET', {
    keyword: query.keyword?.trim(),
    role: query.role,
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 8
  })
}

export const createUser = (payload: UserUpsertPayload) => {
  return request<UserItem>('/users/add', 'POST', payload)
}

export const updateUser = (payload: UserUpsertPayload & { id: number }) => {
  return request<UserItem>('/users/update', 'PUT', payload)
}

export const deleteUserById = (id: number) => {
  return request<null>(`/users/delete/${id}`, 'DELETE')
}

export const registerVisit = (payload: RegisterVisitPayload) => {
  return request<VisitLogItem>('/users/visit/register', 'POST', payload)
}

export const getVisitLogs = (query: VisitLogQuery = {}) => {
  return request<VisitLogResult>('/users/visit/logs', 'GET', {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20
  })
}
