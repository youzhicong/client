import type { MockMethod } from 'vite-plugin-mock'

type WorkflowStatus = 'pending' | 'rejected' | 'modified' | 'approved'
type WorkflowAction = 'start' | 'approve' | 'reject' | 'modify' | 'resubmit'

interface WorkflowFormData {
  title: string
  type: string
  amount: number
  reason: string
}

interface WorkflowRecord {
  id: number
  action: WorkflowAction
  operator: string
  comment: string
  createdAt: string
}

interface WorkflowInstance {
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

type QueryRecord = Record<string, string>

interface StartPayload extends WorkflowFormData {
  applicant?: string
}

interface ActionPayload {
  id?: number
  action?: WorkflowAction
  operator?: string
  comment?: string
  patchData?: Partial<WorkflowFormData>
}

let nextRecordId = 1
let nextWorkflowId = 3

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

const createRecord = (
  action: WorkflowAction,
  operator: string,
  comment: string
): WorkflowRecord => ({
  id: nextRecordId++,
  action,
  operator,
  comment,
  createdAt: now()
})

const workflowStore: WorkflowInstance[] = [
  {
    id: 1,
    code: 'WF-20260305-001',
    applicant: '王雪',
    status: 'pending',
    currentStep: '主管审批',
    rejectCount: 0,
    formData: {
      title: '2026 Q2 市场投放预算申请',
      type: '预算审批',
      amount: 28000,
      reason: '用于新渠道试投放，覆盖短视频与本地信息流。'
    },
    records: [createRecord('start', '王雪', '提交审批')],
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 2,
    code: 'WF-20260305-002',
    applicant: '李浩',
    status: 'rejected',
    currentStep: '申请人修改',
    rejectCount: 1,
    formData: {
      title: '研发服务器扩容申请',
      type: '采购审批',
      amount: 56000,
      reason: '现有测试环境并发不足，影响交付效率。'
    },
    records: [
      createRecord('start', '李浩', '提交审批'),
      createRecord('reject', '赵主管', '预算说明不完整，请补充成本拆分。')
    ],
    createdAt: now(),
    updatedAt: now()
  }
]

const statusLabelMap: Record<WorkflowStatus, string> = {
  pending: '审批中',
  rejected: '已驳回',
  modified: '待重新提交',
  approved: '已通过'
}

const summaryOf = (list: WorkflowInstance[]) => {
  return {
    total: list.length,
    pending: list.filter((item) => item.status === 'pending').length,
    rejected: list.filter((item) => item.status === 'rejected').length,
    modified: list.filter((item) => item.status === 'modified').length,
    approved: list.filter((item) => item.status === 'approved').length
  }
}

const findWorkflow = (id: number) =>
  workflowStore.find((item) => item.id === id)

export default [
  {
    url: '/api/approval-workflow/instances',
    method: 'get',
    response: ({ query }: { query: QueryRecord }) => {
      const keyword = (query.keyword || '').trim().toLowerCase()
      const status = (query.status || '').trim() as WorkflowStatus | ''
      const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1)
      const pageSize = Math.max(
        1,
        Number.parseInt(query.pageSize || '8', 10) || 8
      )

      const filtered = workflowStore.filter((item) => {
        const hitKeyword =
          !keyword ||
          [item.code, item.applicant, item.formData.title].some((field) =>
            field.toLowerCase().includes(keyword)
          )
        const hitStatus = !status || item.status === status
        return hitKeyword && hitStatus
      })

      const start = (page - 1) * pageSize
      const list = filtered.slice(start, start + pageSize).map((item) => ({
        id: item.id,
        code: item.code,
        applicant: item.applicant,
        title: item.formData.title,
        type: item.formData.type,
        amount: item.formData.amount,
        status: item.status,
        statusLabel: statusLabelMap[item.status],
        currentStep: item.currentStep,
        rejectCount: item.rejectCount,
        updatedAt: item.updatedAt
      }))

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
    url: '/api/approval-workflow/detail/:id',
    method: 'get',
    response: ({
      query,
      params
    }: {
      query?: QueryRecord
      params?: QueryRecord
    }) => {
      const id = Number(params?.id || query?.id)
      const target = findWorkflow(id)
      if (!target) {
        return {
          code: 404,
          message: '流程不存在'
        }
      }
      return {
        code: 200,
        message: 'success',
        data: target
      }
    }
  },
  {
    url: '/api/approval-workflow/start',
    method: 'post',
    response: ({ body }: { body: StartPayload }) => {
      if (!body?.title || !body?.type || !body?.amount || !body?.reason) {
        return {
          code: 422,
          message: '请填写完整申请信息'
        }
      }

      const id = nextWorkflowId++
      const code = `WF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
        id
      ).padStart(3, '0')}`
      const applicant = body.applicant?.trim() || '匿名申请人'
      const createdAt = now()

      const workflow: WorkflowInstance = {
        id,
        code,
        applicant,
        status: 'pending',
        currentStep: '主管审批',
        rejectCount: 0,
        formData: {
          title: body.title.trim(),
          type: body.type.trim(),
          amount: Number(body.amount) || 0,
          reason: body.reason.trim()
        },
        records: [createRecord('start', applicant, '发起审批')],
        createdAt,
        updatedAt: createdAt
      }

      workflowStore.unshift(workflow)

      return {
        code: 200,
        message: '流程已发起',
        data: workflow
      }
    }
  },
  {
    url: '/api/approval-workflow/action',
    method: 'post',
    response: ({ body }: { body: ActionPayload }) => {
      const id = Number(body?.id)
      const action = body?.action
      const operator = body?.operator?.trim() || '系统用户'
      const comment = body?.comment?.trim() || ''

      if (!id || !action) {
        return {
          code: 400,
          message: '缺少必要参数'
        }
      }

      const target = findWorkflow(id)
      if (!target) {
        return {
          code: 404,
          message: '流程不存在'
        }
      }

      if (action === 'approve') {
        if (target.status !== 'pending') {
          return { code: 409, message: '当前流程不可审批通过' }
        }
        target.status = 'approved'
        target.currentStep = '审批完成'
        target.records.push(
          createRecord('approve', operator, comment || '审批通过')
        )
      } else if (action === 'reject') {
        if (target.status !== 'pending') {
          return { code: 409, message: '当前流程不可驳回' }
        }
        target.status = 'rejected'
        target.currentStep = '申请人修改'
        target.rejectCount += 1
        target.records.push(
          createRecord('reject', operator, comment || '审批驳回')
        )
      } else if (action === 'modify') {
        if (target.status !== 'rejected' && target.status !== 'modified') {
          return { code: 409, message: '当前流程不可修改' }
        }
        target.status = 'modified'
        target.currentStep = '申请人修改'
        target.formData = {
          ...target.formData,
          ...(body.patchData || {}),
          amount: Number(body.patchData?.amount ?? target.formData.amount) || 0
        }
        target.records.push(
          createRecord('modify', operator, comment || '申请人已修改')
        )
      } else if (action === 'resubmit') {
        if (target.status !== 'rejected' && target.status !== 'modified') {
          return { code: 409, message: '当前流程不可重新提交' }
        }
        target.formData = {
          ...target.formData,
          ...(body.patchData || {}),
          amount: Number(body.patchData?.amount ?? target.formData.amount) || 0
        }
        target.status = 'pending'
        target.currentStep = '主管审批'
        target.records.push(
          createRecord('resubmit', operator, comment || '修改后重新提交')
        )
      } else {
        return { code: 400, message: '未知操作' }
      }

      target.updatedAt = now()
      return {
        code: 200,
        message: '操作成功',
        data: target
      }
    }
  }
] as MockMethod[]
