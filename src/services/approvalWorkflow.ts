import { request } from '@/utils/request'

export type WorkflowStatus = 'pending' | 'rejected' | 'modified' | 'approved'
export type WorkflowAction =
  | 'start'
  | 'approve'
  | 'reject'
  | 'modify'
  | 'resubmit'

export interface WorkflowFormData {
  title: string
  type: string
  amount: number
  reason: string
}

export interface WorkflowRecord {
  id: number
  action: WorkflowAction
  operator: string
  comment: string
  createdAt: string
}

export interface WorkflowInstance {
  id: number
  code: string
  applicant: string
  status: WorkflowStatus
  currentStep: string
  rejectCount: number
  formData: WorkflowFormData
  records: WorkflowRecord[]
  createdAt: string
  updatedAt: string
}

export interface WorkflowListItem {
  id: number
  code: string
  applicant: string
  title: string
  type: string
  amount: number
  status: WorkflowStatus
  statusLabel: string
  currentStep: string
  rejectCount: number
  updatedAt: string
}

export interface WorkflowSummary {
  total: number
  pending: number
  rejected: number
  modified: number
  approved: number
}

export interface WorkflowListResult {
  list: WorkflowListItem[]
  total: number
  page: number
  pageSize: number
  summary: WorkflowSummary
}

export interface WorkflowListQuery {
  keyword?: string
  status?: WorkflowStatus | ''
  page?: number
  pageSize?: number
}

export interface StartWorkflowPayload extends WorkflowFormData {
  applicant?: string
}

export interface WorkflowActionPayload {
  id: number
  action: Exclude<WorkflowAction, 'start'>
  operator: string
  comment?: string
  patchData?: Partial<WorkflowFormData>
}

export const getWorkflowList = (query: WorkflowListQuery = {}) => {
  return request<WorkflowListResult>('/approval-workflow/instances', 'GET', {
    keyword: query.keyword?.trim(),
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 8
  })
}

export const getWorkflowDetail = (id: number) => {
  return request<WorkflowInstance>(`/approval-workflow/detail/${id}`, 'GET')
}

export const startWorkflow = (payload: StartWorkflowPayload) => {
  return request<WorkflowInstance>('/approval-workflow/start', 'POST', payload)
}

export const runWorkflowAction = (payload: WorkflowActionPayload) => {
  return request<WorkflowInstance>('/approval-workflow/action', 'POST', payload)
}
