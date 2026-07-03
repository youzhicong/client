import {
  createContract,
  signContract,
  submitContract,
  type ContractItem
} from '@/services/eContract'
import {
  runWorkflowAction,
  startWorkflow,
  type WorkflowInstance
} from '@/services/approvalWorkflow'
import { getApiErrorMessage } from '@/utils/request'
import { createElectronicSealData } from './e-seal'

export type BusinessClosureStep = {
  key: string
  label: string
  status: 'done' | 'error'
  detail: string
}
export type BusinessClosureResult = {
  keyword: string
  approvalId: number
  approvalCode: string
  approvalStatus: string
  contractId: number
  contractCode: string
  contractStatus: string
  contractTitle: string
  contractContent: string
  amount: number
  partyA: string
  partyB: string
  sealImages: { partyA: string; partyB: string }
  sealsApplied: string[]
  steps: BusinessClosureStep[]
  completedAt: number
}
export type BusinessClosureInput = {
  keyword: string
  title?: string
  amount?: number
  summary?: string
  operator?: string
  onStep?: (step: BusinessClosureStep) => void
}

/** 开发/Mock 环境走本地签章；生产仅在未强制后端时使用本地 */
const shouldUseLocalBusinessClosure = () => {
  if (import.meta.env.DEV) return true
  if (import.meta.env.VITE_USE_MOCK === 'true') return true
  return import.meta.env.VITE_USE_BACKEND_FOR_CORE_APIS !== 'true'
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const runLocalBusinessClosureFlow = async (
  input: BusinessClosureInput
): Promise<BusinessClosureResult> => {
  const keyword = input.keyword.trim()
  const amount = input.amount ?? 50000
  const reason =
    input.summary?.trim() ||
    `基于「${keyword}」AI 工作流产出结果，自动发起立项审批并完成电子合同签署。`
  const contractTitle = `${keyword} 合作框架协议`
  const partyA = 'FlowAgent'
  const partyB = '战略合作方'
  const ts = Date.now()
  const approvalCode = `WF-${ts}`
  const contractCode = `CT-${ts}`
  const steps: BusinessClosureStep[] = []
  const push = (step: BusinessClosureStep) => {
    steps.push(step)
    input.onStep?.(step)
  }

  await delay(250)
  push({
    key: 'approval_start',
    label: '发起审批',
    status: 'done',
    detail: `${approvalCode} · 主管审批`
  })
  await delay(200)
  push({
    key: 'approval_pass',
    label: '自动审批通过',
    status: 'done',
    detail: '已通过'
  })
  await delay(200)
  push({
    key: 'contract_create',
    label: '生成电子合同',
    status: 'done',
    detail: contractCode
  })
  await delay(200)
  push({
    key: 'contract_submit',
    label: '提交签署',
    status: 'done',
    detail: '待双方签章'
  })
  await delay(200)
  const sealPartyA = createElectronicSealData(partyA, 'partyA')
  push({
    key: 'seal_a',
    label: '甲方电子签章',
    status: 'done',
    detail: `${partyA} 已盖章`
  })
  await delay(200)
  const sealPartyB = createElectronicSealData(partyB, 'partyB')
  push({
    key: 'seal_b',
    label: '乙方电子签章',
    status: 'done',
    detail: `${partyB} 已盖章 · 合同生效`
  })

  return {
    keyword,
    approvalId: ts,
    approvalCode,
    approvalStatus: 'approved',
    contractId: ts + 1,
    contractCode,
    contractStatus: 'completed',
    contractTitle,
    contractContent: reason,
    amount,
    partyA,
    partyB,
    sealImages: { partyA: sealPartyA, partyB: sealPartyB },
    sealsApplied: ['partyA', 'partyB'],
    steps,
    completedAt: Date.now()
  }
}

const unwrap = <T>(response: { data: T }) => response.data
const pushStep = (
  steps: BusinessClosureStep[],
  step: BusinessClosureStep,
  onStep?: (step: BusinessClosureStep) => void
) => {
  steps.push(step)
  onStep?.(step)
}
export const runBusinessClosureFlow = async (
  input: BusinessClosureInput
): Promise<BusinessClosureResult> => {
  if (shouldUseLocalBusinessClosure()) {
    return runLocalBusinessClosureFlow(input)
  }

  const operator = input.operator?.trim() || 'FlowAgent AI'
  const keyword = input.keyword.trim()
  const title = input.title?.trim() || `${keyword} 产品立项审批`
  const amount = input.amount ?? 50000
  const reason =
    input.summary?.trim() ||
    `基于「${keyword}」AI 工作流产出结果，自动发起立项审批并完成电子合同签署。`
  const steps: BusinessClosureStep[] = []
  let workflow: WorkflowInstance
  try {
    workflow = unwrap(
      await startWorkflow({
        title,
        type: 'AI 立项审批',
        amount,
        reason,
        applicant: operator
      })
    )
    pushStep(
      steps,
      {
        key: 'approval_start',
        label: '发起审批',
        status: 'done',
        detail: `${workflow.code} · ${workflow.currentStep}`
      },
      input.onStep
    )
    workflow = unwrap(
      await runWorkflowAction({
        id: workflow.id,
        action: 'approve',
        operator: 'AI 审批官',
        comment: 'AI 自动审批通过'
      })
    )
    pushStep(
      steps,
      {
        key: 'approval_pass',
        label: '自动审批通过',
        status: 'done',
        detail: workflow.currentStep
      },
      input.onStep
    )
  } catch (error) {
    const message = getApiErrorMessage(error, '审批流程调用失败')
    pushStep(
      steps,
      {
        key: 'approval_error',
        label: '审批流程',
        status: 'error',
        detail: message
      },
      input.onStep
    )
    pushStep(
      steps,
      {
        key: 'fallback_local',
        label: '切换本地签章',
        status: 'done',
        detail: '远程审批不可用，已本地模拟'
      },
      input.onStep
    )
    return runLocalBusinessClosureFlow(input)
  }
  const sealsApplied: string[] = []
  let contract: ContractItem
  try {
    contract = unwrap(
      await createContract({
        title: `${keyword} 合作框架协议`,
        counterparty: 'FlowAgent 战略合作方',
        amount,
        content: reason,
        createdBy: operator
      })
    )
    pushStep(
      steps,
      {
        key: 'contract_create',
        label: '生成电子合同',
        status: 'done',
        detail: contract.code
      },
      input.onStep
    )
    contract = unwrap(
      await submitContract({
        id: contract.id,
        operator,
        comment: 'AI 自动提交签署'
      })
    )
    pushStep(
      steps,
      {
        key: 'contract_submit',
        label: '提交签署',
        status: 'done',
        detail: contract.currentStep
      },
      input.onStep
    )
    contract = unwrap(
      await signContract({
        id: contract.id,
        signerRole: 'partyA',
        signatureData: createElectronicSealData('FlowAgent', 'partyA'),
        operator: 'FlowAgent 甲方'
      })
    )
    sealsApplied.push('partyA')
    pushStep(
      steps,
      {
        key: 'seal_a',
        label: '甲方电子签章',
        status: 'done',
        detail: contract.currentStep
      },
      input.onStep
    )
    contract = unwrap(
      await signContract({
        id: contract.id,
        signerRole: 'partyB',
        signatureData: createElectronicSealData('战略合作方', 'partyB'),
        operator: 'FlowAgent 乙方'
      })
    )
    sealsApplied.push('partyB')
    pushStep(
      steps,
      {
        key: 'seal_b',
        label: '乙方电子签章',
        status: 'done',
        detail: `${contract.currentStep} · ${contract.statusLabel}`
      },
      input.onStep
    )
  } catch (error) {
    const message = getApiErrorMessage(error, '合同签署调用失败')
    pushStep(
      steps,
      {
        key: 'contract_error',
        label: '电子合同',
        status: 'error',
        detail: message
      },
      input.onStep
    )
    pushStep(
      steps,
      {
        key: 'fallback_local',
        label: '切换本地签章',
        status: 'done',
        detail: '远程合同接口不可用，已本地模拟'
      },
      input.onStep
    )
    return runLocalBusinessClosureFlow(input)
  }
  return {
    keyword,
    approvalId: workflow.id,
    approvalCode: workflow.code,
    approvalStatus: workflow.status,
    contractId: contract.id,
    contractCode: contract.code,
    contractStatus: contract.status,
    contractTitle: contract.formData.title,
    contractContent: contract.formData.content,
    amount: contract.formData.amount,
    partyA: 'FlowAgent',
    partyB: contract.formData.counterparty,
    sealImages: {
      partyA: createElectronicSealData('FlowAgent', 'partyA'),
      partyB: createElectronicSealData(contract.formData.counterparty, 'partyB')
    },
    sealsApplied,
    steps,
    completedAt: Date.now()
  }
}
