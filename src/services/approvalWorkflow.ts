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

interface ApiResult<T> {
  code: number
  message: string
  data: T
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

const requestJson = async <T>(url: string, init?: RequestInit) => {
  const response = await fetch(url, init)
  return (await response.json()) as ApiResult<T>
}

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    query.set(key, String(value))
  })
  return query.toString()
}

export const getWorkflowList = (query: WorkflowListQuery = {}) => {
  const queryText = buildQuery({
    keyword: query.keyword?.trim(),
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 8
  })
  return requestJson<WorkflowListResult>(
    `/api/approval-workflow/instances?${queryText}`
  )
}

export const getWorkflowDetail = (id: number) => {
  return requestJson<WorkflowInstance>(`/api/approval-workflow/detail/${id}`)
}

export const startWorkflow = (payload: StartWorkflowPayload) => {
  return requestJson<WorkflowInstance>('/api/approval-workflow/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const runWorkflowAction = (payload: WorkflowActionPayload) => {
  return requestJson<WorkflowInstance>('/api/approval-workflow/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
