import type { MockMethod } from 'vite-plugin-mock'

const useBackend = process.env.VITE_USE_BACKEND_FOR_CORE_APIS === 'true'

type ContractStatus =
  | 'draft'
  | 'pending_a'
  | 'pending_b'
  | 'rejected'
  | 'completed'
type ContractAction = 'create' | 'update' | 'submit' | 'sign' | 'reject'
type SignerRole = 'partyA' | 'partyB'

interface ContractFormData {
  title: string
  counterparty: string
  amount: number
  content: string
}

interface ContractSignature {
  signerName: string
  signerRole: SignerRole
  signedAt: string
  signatureData: string
}

interface ContractRecord {
  id: number
  action: ContractAction
  operator: string
  comment: string
  createdAt: string
}

interface ContractItem {
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

type QueryRecord = Record<string, string>

interface CreatePayload extends ContractFormData {
  createdBy?: string
}

interface UpdatePayload extends Partial<ContractFormData> {
  id?: number
  operator?: string
}

interface ActionPayload {
  id?: number
  operator?: string
  comment?: string
}

interface SignPayload extends ActionPayload {
  signerRole?: SignerRole
  signatureData?: string
}

let nextContractId = 3
let nextRecordId = 1

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

const statusLabelMap: Record<ContractStatus, string> = {
  draft: '草稿',
  pending_a: '待甲方签署',
  pending_b: '待乙方签署',
  rejected: '已驳回',
  completed: '已完成'
}

const stepMap: Record<ContractStatus, string> = {
  draft: '草稿编辑',
  pending_a: '甲方签署',
  pending_b: '乙方签署',
  rejected: '驳回待修改',
  completed: '合同归档'
}

const createRecord = (
  action: ContractAction,
  operator: string,
  comment: string
): ContractRecord => ({
  id: nextRecordId++,
  action,
  operator,
  comment,
  createdAt: now()
})

const contractStore: ContractItem[] = [
  {
    id: 1,
    code: 'EC-20260305-001',
    createdBy: '张楠',
    status: 'pending_a',
    statusLabel: statusLabelMap.pending_a,
    currentStep: stepMap.pending_a,
    formData: {
      title: '年度广告投放合作协议',
      counterparty: '星河传媒有限公司',
      amount: 168000,
      content:
        '甲乙双方就 2026 年度广告投放合作事项达成一致。付款方式为按季度结算，乙方需提供投放报告与发票。'
    },
    signatures: {},
    rejectReason: '',
    records: [
      createRecord('create', '张楠', '创建电子合同'),
      createRecord('submit', '张楠', '提交签署流程')
    ],
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 2,
    code: 'EC-20260305-002',
    createdBy: '王蕾',
    status: 'rejected',
    statusLabel: statusLabelMap.rejected,
    currentStep: stepMap.rejected,
    formData: {
      title: '服务器采购框架合同',
      counterparty: '云算科技股份有限公司',
      amount: 226000,
      content:
        '本合同约定服务器采购批次、验收标准、售后条款与质保周期。甲方验收通过后 15 个工作日内付款。'
    },
    signatures: {},
    rejectReason: '合同付款节点描述不清，请补充分期条款。',
    records: [
      createRecord('create', '王蕾', '创建电子合同'),
      createRecord('submit', '王蕾', '提交签署流程'),
      createRecord('reject', '法务-陈晨', '付款节点描述不清，请补充分期条款。')
    ],
    createdAt: now(),
    updatedAt: now()
  }
]

const setStatus = (target: ContractItem, status: ContractStatus) => {
  target.status = status
  target.statusLabel = statusLabelMap[status]
  target.currentStep = stepMap[status]
}

const findContract = (id: number) =>
  contractStore.find((item) => item.id === id)

const toListItem = (item: ContractItem) => ({
  id: item.id,
  code: item.code,
  title: item.formData.title,
  counterparty: item.formData.counterparty,
  amount: item.formData.amount,
  createdBy: item.createdBy,
  status: item.status,
  statusLabel: item.statusLabel,
  currentStep: item.currentStep,
  updatedAt: item.updatedAt
})

const summaryOf = (list: ContractItem[]) => ({
  total: list.length,
  draft: list.filter((item) => item.status === 'draft').length,
  signing: list.filter(
    (item) => item.status === 'pending_a' || item.status === 'pending_b'
  ).length,
  rejected: list.filter((item) => item.status === 'rejected').length,
  completed: list.filter((item) => item.status === 'completed').length
})

export default (useBackend
  ? []
  : [
      {
        url: '/api/e-contract/list',
        method: 'get',
        response: ({ query }: { query: QueryRecord }) => {
          const keyword = (query.keyword || '').trim().toLowerCase()
          const status = (query.status || '').trim() as ContractStatus | ''
          const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1)
          const pageSize = Math.max(
            1,
            Number.parseInt(query.pageSize || '8', 10) || 8
          )

          const filtered = contractStore.filter((item) => {
            const hitKeyword =
              !keyword ||
              [
                item.code,
                item.formData.title,
                item.formData.counterparty,
                item.createdBy
              ].some((field) => field.toLowerCase().includes(keyword))
            const hitStatus = !status || item.status === status
            return hitKeyword && hitStatus
          })

          const start = (page - 1) * pageSize
          const list = filtered.slice(start, start + pageSize).map(toListItem)
          return {
            code: 200,
            message: 'success',
            data: {
              list,
              total: filtered.length,
              page,
              pageSize,
              summary: summaryOf(filtered)
            }
          }
        }
      },
      {
        url: '/api/e-contract/detail',
        method: 'get',
        response: ({ query }: { query: QueryRecord }) => {
          const id = Number(query.id)
          const target = findContract(id)
          if (!target) return { code: 404, message: '合同不存在' }
          return { code: 200, message: 'success', data: target }
        }
      },
      {
        url: '/api/e-contract/create',
        method: 'post',
        response: ({ body }: { body: CreatePayload }) => {
          if (!body?.title || !body?.counterparty || !body?.content) {
            return { code: 422, message: '请填写完整合同信息' }
          }
          const id = nextContractId++
          const code = `EC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(id).padStart(3, '0')}`
          const operator = body.createdBy?.trim() || '合同发起人'
          const createdAt = now()

          const contract: ContractItem = {
            id,
            code,
            createdBy: operator,
            status: 'draft',
            statusLabel: statusLabelMap.draft,
            currentStep: stepMap.draft,
            formData: {
              title: body.title.trim(),
              counterparty: body.counterparty.trim(),
              amount: Number(body.amount) || 0,
              content: body.content.trim()
            },
            signatures: {},
            rejectReason: '',
            records: [createRecord('create', operator, '创建电子合同')],
            createdAt,
            updatedAt: createdAt
          }
          contractStore.unshift(contract)
          return { code: 200, message: '创建成功', data: contract }
        }
      },
      {
        url: '/api/e-contract/update',
        method: 'post',
        response: ({ body }: { body: UpdatePayload }) => {
          const id = Number(body?.id)
          if (!id) return { code: 400, message: '缺少合同 ID' }
          const target = findContract(id)
          if (!target) return { code: 404, message: '合同不存在' }
          if (target.status !== 'draft' && target.status !== 'rejected') {
            return { code: 409, message: '当前状态不可修改' }
          }

          target.formData = {
            ...target.formData,
            ...(body.title !== undefined ? { title: body.title.trim() } : {}),
            ...(body.counterparty !== undefined
              ? { counterparty: body.counterparty.trim() }
              : {}),
            ...(body.content !== undefined
              ? { content: body.content.trim() }
              : {}),
            ...(body.amount !== undefined
              ? { amount: Number(body.amount) || 0 }
              : {})
          }
          setStatus(target, 'draft')
          target.rejectReason = ''
          target.records.push(
            createRecord(
              'update',
              body.operator?.trim() || '合同发起人',
              '修改合同内容'
            )
          )
          target.updatedAt = now()
          return { code: 200, message: '修改成功', data: target }
        }
      },
      {
        url: '/api/e-contract/submit',
        method: 'post',
        response: ({ body }: { body: ActionPayload }) => {
          const id = Number(body?.id)
          if (!id) return { code: 400, message: '缺少合同 ID' }
          const target = findContract(id)
          if (!target) return { code: 404, message: '合同不存在' }
          if (target.status !== 'draft' && target.status !== 'rejected') {
            return { code: 409, message: '当前状态不可提交签署' }
          }

          target.signatures = {}
          target.rejectReason = ''
          setStatus(target, 'pending_a')
          target.records.push(
            createRecord(
              'submit',
              body.operator?.trim() || '合同发起人',
              body.comment?.trim() || '提交签署流程'
            )
          )
          target.updatedAt = now()
          return { code: 200, message: '已提交签署', data: target }
        }
      },
      {
        url: '/api/e-contract/sign',
        method: 'post',
        response: ({ body }: { body: SignPayload }) => {
          const id = Number(body?.id)
          const signerRole = body?.signerRole
          const signerName = body?.operator?.trim() || ''
          const signatureData = body?.signatureData?.trim() || ''
          if (!id || !signerRole || !signerName || !signatureData) {
            return { code: 400, message: '签署参数不完整' }
          }

          const target = findContract(id)
          if (!target) return { code: 404, message: '合同不存在' }

          if (target.status === 'pending_a' && signerRole !== 'partyA') {
            return { code: 409, message: '当前应由甲方签署' }
          }
          if (target.status === 'pending_b' && signerRole !== 'partyB') {
            return { code: 409, message: '当前应由乙方签署' }
          }
          if (target.status !== 'pending_a' && target.status !== 'pending_b') {
            return { code: 409, message: '当前状态不可签署' }
          }

          const signedAt = now()
          target.signatures[signerRole] = {
            signerName,
            signerRole,
            signedAt,
            signatureData
          }

          if (target.status === 'pending_a') {
            setStatus(target, 'pending_b')
          } else {
            setStatus(target, 'completed')
          }

          target.records.push(
            createRecord(
              'sign',
              signerName,
              body.comment?.trim() ||
                `${signerRole === 'partyA' ? '甲方' : '乙方'}完成签署`
            )
          )
          target.updatedAt = signedAt
          return { code: 200, message: '签署成功', data: target }
        }
      },
      {
        url: '/api/e-contract/reject',
        method: 'post',
        response: ({ body }: { body: ActionPayload }) => {
          const id = Number(body?.id)
          if (!id) return { code: 400, message: '缺少合同 ID' }
          const target = findContract(id)
          if (!target) return { code: 404, message: '合同不存在' }
          if (target.status !== 'pending_a' && target.status !== 'pending_b') {
            return { code: 409, message: '当前状态不可驳回' }
          }

          const reason = body.comment?.trim() || '请补充合同条款后重新提交'
          setStatus(target, 'rejected')
          target.rejectReason = reason
          target.records.push(
            createRecord('reject', body.operator?.trim() || '审批人', reason)
          )
          target.updatedAt = now()
          return { code: 200, message: '已驳回', data: target }
        }
      }
    ]) as MockMethod[]
