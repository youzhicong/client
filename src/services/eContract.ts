export type ContractStatus =
  | 'draft'
  | 'pending_a'
  | 'pending_b'
  | 'rejected'
  | 'completed'
export type SignerRole = 'partyA' | 'partyB'

export interface ContractFormData {
  title: string
  counterparty: string
  amount: number
  content: string
}

export interface ContractSignature {
  signerName: string
  signerRole: SignerRole
  signedAt: string
  signatureData: string
}

export interface ContractRecord {
  id: number
  action: 'create' | 'update' | 'submit' | 'sign' | 'reject'
  operator: string
  comment: string
  createdAt: string
}

export interface ContractItem {
  id: number
  code: string
  createdBy: string
  status: ContractStatus
  statusLabel: string
  currentStep: string
  formData: ContractFormData
  signatures: {
    partyA?: ContractSignature
    partyB?: ContractSignature
  }
  rejectReason: string
  records: ContractRecord[]
  createdAt: string
  updatedAt: string
}

export interface ContractListItem {
  id: number
  code: string
  title: string
  counterparty: string
  amount: number
  createdBy: string
  status: ContractStatus
  statusLabel: string
  currentStep: string
  updatedAt: string
}

export interface ContractSummary {
  total: number
  draft: number
  signing: number
  rejected: number
  completed: number
}

interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export interface ContractListResult {
  list: ContractListItem[]
  total: number
  page: number
  pageSize: number
  summary: ContractSummary
}

export interface ContractListQuery {
  keyword?: string
  status?: ContractStatus | ''
  page?: number
  pageSize?: number
}

export interface CreateContractPayload extends ContractFormData {
  createdBy?: string
}

export interface UpdateContractPayload extends Partial<ContractFormData> {
  id: number
  operator?: string
}

export interface ContractActionPayload {
  id: number
  operator?: string
  comment?: string
}

export interface ContractSignPayload extends ContractActionPayload {
  signerRole: SignerRole
  signatureData: string
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

export const getContractList = (query: ContractListQuery = {}) => {
  const search = buildQuery({
    keyword: query.keyword?.trim(),
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 8
  })
  return requestJson<ContractListResult>(`/api/e-contract/list?${search}`)
}

export const getContractDetail = (id: number) => {
  return requestJson<ContractItem>(`/api/e-contract/detail?id=${id}`)
}

export const createContract = (payload: CreateContractPayload) => {
  return requestJson<ContractItem>('/api/e-contract/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const updateContract = (payload: UpdateContractPayload) => {
  return requestJson<ContractItem>('/api/e-contract/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const submitContract = (payload: ContractActionPayload) => {
  return requestJson<ContractItem>('/api/e-contract/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const rejectContract = (payload: ContractActionPayload) => {
  return requestJson<ContractItem>('/api/e-contract/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const signContract = (payload: ContractSignPayload) => {
  return requestJson<ContractItem>('/api/e-contract/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
