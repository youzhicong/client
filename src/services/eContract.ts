import { request } from '@/utils/request'

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

export const getContractList = (query: ContractListQuery = {}) => {
  return request<ContractListResult>('/e-contract/list', 'GET', {
    keyword: query.keyword?.trim(),
    status: query.status || undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 8
  })
}

export const getContractDetail = (id: number) => {
  return request<ContractItem>('/e-contract/detail', 'GET', { id })
}

export const createContract = (payload: CreateContractPayload) => {
  return request<ContractItem>('/e-contract/create', 'POST', payload)
}

export const updateContract = (payload: UpdateContractPayload) => {
  return request<ContractItem>('/e-contract/update', 'POST', payload)
}

export const submitContract = (payload: ContractActionPayload) => {
  return request<ContractItem>('/e-contract/submit', 'POST', payload)
}

export const rejectContract = (payload: ContractActionPayload) => {
  return request<ContractItem>('/e-contract/reject', 'POST', payload)
}

export const signContract = (payload: ContractSignPayload) => {
  return request<ContractItem>('/e-contract/sign', 'POST', payload)
}
