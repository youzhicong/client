<template>
  <PageShell>
    <template #hero>
      <PageHero
        badge="WORKFLOW"
        title="审批流程可视化"
        description="业务闭环：发起审批 → 审批驳回 → 申请人修改 → 重新提交 / 审批通过。"
      >
        <template #actions>
          <div class="workflow-hero-extra">
            <el-radio-group v-model="operatorRole" size="small">
              <el-radio-button label="applicant">申请人视角</el-radio-button>
              <el-radio-button label="approver">审批人视角</el-radio-button>
            </el-radio-group>
            <el-input
              v-model="operatorName"
              size="small"
              placeholder="当前操作人姓名"
            />
          </div>
        </template>
      </PageHero>
    </template>

    <template #stats>
      <PageStatGrid :columns="4">
        <PageStatCard label="流程总数" :value="summary.total" />
        <PageStatCard label="审批中" :value="summary.pending" tone="warning" />
        <PageStatCard
          label="已驳回 / 待改"
          :value="summary.rejected + summary.modified"
          tone="danger"
        />
        <PageStatCard label="已通过" :value="summary.approved" tone="success" />
      </PageStatGrid>
    </template>

    <div class="workflow-main-grid">
      <PagePanel>
        <div class="workflow-col-head">
          <h3>申请单编辑</h3>
          <el-tag v-if="canModifyCurrent" type="warning">当前单可修改</el-tag>
        </div>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="88px"
        >
          <el-form-item label="申请标题" prop="title">
            <el-input
              v-model="formData.title"
              placeholder="例如：市场预算申请"
            />
          </el-form-item>
          <el-form-item label="审批类型" prop="type">
            <el-select v-model="formData.type" style="width: 100%">
              <el-option label="预算审批" value="预算审批" />
              <el-option label="采购审批" value="采购审批" />
              <el-option label="合同审批" value="合同审批" />
              <el-option label="用印审批" value="用印审批" />
            </el-select>
          </el-form-item>
          <el-form-item label="金额" prop="amount">
            <el-input-number
              v-model="formData.amount"
              :min="0"
              :step="1000"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="申请说明" prop="reason">
            <el-input
              v-model="formData.reason"
              type="textarea"
              :rows="4"
              placeholder="说明申请背景、用途、收益预期"
            />
          </el-form-item>
        </el-form>

        <div class="workflow-form-actions">
          <el-button
            v-if="canModifyCurrent"
            type="warning"
            :loading="submitting"
            @click="saveModify"
          >
            保存修改
          </el-button>
          <el-button
            v-if="canModifyCurrent"
            type="primary"
            :loading="submitting"
            @click="resubmitCurrent"
          >
            修改后重新提交
          </el-button>
          <el-button @click="resetFormData">清空表单</el-button>
          <el-button
            type="success"
            :loading="submitting"
            @click="startNewWorkflow"
          >
            发起新审批
          </el-button>
        </div>
      </PagePanel>

      <div class="workflow-right-col">
        <WorkflowGraph
          :status="currentDetail?.status || 'pending'"
          :reject-count="currentDetail?.rejectCount || 0"
        />

        <PagePanel>
          <div class="workflow-col-head">
            <h3>审批动作</h3>
            <el-tag type="info" effect="plain">
              当前流程：{{ currentDetail?.code || '未选择' }}
            </el-tag>
          </div>

          <el-input
            v-model="actionComment"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见（可选）"
          />

          <div class="workflow-action-buttons">
            <el-button
              type="success"
              :disabled="!canApproveCurrent"
              :loading="submitting"
              @click="approveCurrent"
            >
              审批通过
            </el-button>
            <el-button
              type="danger"
              :disabled="!canRejectCurrent"
              :loading="submitting"
              @click="rejectCurrent"
            >
              驳回申请
            </el-button>
            <el-button
              :disabled="!canLoadCurrentToForm"
              @click="loadCurrentToForm"
            >
              驳回单回填到表单
            </el-button>
          </div>
        </PagePanel>

        <WorkflowRecordTimeline :records="currentDetail?.records || []" />
      </div>
    </div>

    <PagePanel>
      <PageFilterBar>
        <template #filters>
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索流程号 / 标题 / 申请人"
            style="width: 260px"
            @keyup.enter="search"
          />
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部状态"
            style="width: 160px"
          >
            <el-option
              v-for="item in statusFilters"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="reset">重置</el-button>
        </template>
        <template #extra>
          <el-button @click="refresh">刷新列表</el-button>
        </template>
      </PageFilterBar>

      <AppDataTable :data="workflowList" border v-loading="listLoading">
        <el-table-column prop="code" label="流程号" min-width="160" />
        <el-table-column prop="title" label="申请标题" min-width="220" />
        <el-table-column prop="applicant" label="申请人" min-width="120" />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }"
            >¥{{ Number(row.amount).toLocaleString() }}</template
          >
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{
              row.statusLabel
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentStep" label="当前环节" min-width="120" />
        <el-table-column
          prop="rejectCount"
          label="驳回次数"
          width="100"
          align="center"
        />
        <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="selectWorkflow(row.id)"
              >查看</el-button
            >
          </template>
        </el-table-column>
      </AppDataTable>

      <div class="page-pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[8, 16, 24]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="refresh"
        />
      </div>
    </PagePanel>
  </PageShell>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import PageFilterBar from '@/components/page/PageFilterBar.vue'
import PageHero from '@/components/page/PageHero.vue'
import PagePanel from '@/components/page/PagePanel.vue'
import PageShell from '@/components/page/PageShell.vue'
import PageStatCard from '@/components/page/PageStatCard.vue'
import PageStatGrid from '@/components/page/PageStatGrid.vue'
import { usePaginatedQuery } from '@/composables/usePaginatedQuery'
import { useUserStore } from '@/stores'
import { getApiErrorMessage } from '@/utils/request'
import {
  getWorkflowDetail,
  getWorkflowList,
  runWorkflowAction,
  startWorkflow,
  type StartWorkflowPayload,
  type WorkflowInstance,
  type WorkflowListItem,
  type WorkflowListResult,
  type WorkflowStatus,
  type WorkflowSummary
} from '@/services/approvalWorkflow'
import WorkflowGraph from './components/WorkflowGraph.vue'
import WorkflowRecordTimeline from './components/WorkflowRecordTimeline.vue'

const userStore = useUserStore()

const resolveDefaultApplicant = () => {
  const user = userStore.user
  const candidates = [user?.name, user?.username, user?.nickname, user?.account]
  const named = candidates.find(
    (item: unknown) => typeof item === 'string' && item.trim()
  )
  return named ? String(named) : '申请人A'
}

const operatorRole = ref<'applicant' | 'approver'>('applicant')
const operatorName = ref(resolveDefaultApplicant())

const statusTypeMap: Record<
  WorkflowStatus,
  'warning' | 'danger' | 'info' | 'success'
> = {
  pending: 'warning',
  rejected: 'danger',
  modified: 'info',
  approved: 'success'
}

const getStatusTagType = (status: unknown) => {
  if (typeof status !== 'string') return 'info'
  return statusTypeMap[status as WorkflowStatus] || 'info'
}

const statusFilters = [
  { label: '审批中', value: 'pending' },
  { label: '已驳回', value: 'rejected' },
  { label: '待重新提交', value: 'modified' },
  { label: '已通过', value: 'approved' }
]

type WorkflowFilters = {
  keyword: string
  status: WorkflowStatus | ''
}

const summary = ref<WorkflowSummary>({
  total: 0,
  pending: 0,
  rejected: 0,
  modified: 0,
  approved: 0
})

const selectedWorkflowId = ref<number | null>(null)
const currentDetail = ref<WorkflowInstance | null>(null)

const syncSelectionAfterList = (items: WorkflowListItem[]) => {
  if (!items.length) {
    currentDetail.value = null
    selectedWorkflowId.value = null
    return
  }

  const hasSelected = items.some((item) => item.id === selectedWorkflowId.value)
  const nextId = hasSelected ? selectedWorkflowId.value : items[0]?.id
  if (typeof nextId === 'number') {
    void selectWorkflow(nextId)
  }
}

const {
  filters,
  pagination,
  loading: listLoading,
  list: workflowList,
  refresh,
  search,
  reset,
  handleSizeChange
} = usePaginatedQuery<WorkflowListItem, WorkflowFilters, WorkflowListResult>({
  defaultFilters: {
    keyword: '',
    status: ''
  },
  pageSize: 8,
  errorMessage: '获取列表失败',
  fetcher: (query) => getWorkflowList(query),
  onLoaded: (data) => {
    summary.value = data.summary
    syncSelectionAfterList(data.list)
  }
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const actionComment = ref('')

const formData = reactive<StartWorkflowPayload>({
  applicant: resolveDefaultApplicant(),
  title: '',
  type: '预算审批',
  amount: 0,
  reason: ''
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入申请标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择审批类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'change' }],
  reason: [{ required: true, message: '请输入申请说明', trigger: 'blur' }]
}

const canApproveCurrent = computed(() => {
  return (
    operatorRole.value === 'approver' &&
    !!currentDetail.value &&
    currentDetail.value.status === 'pending'
  )
})

const canRejectCurrent = computed(() => {
  return (
    operatorRole.value === 'approver' &&
    !!currentDetail.value &&
    currentDetail.value.status === 'pending'
  )
})

const canModifyCurrent = computed(() => {
  return (
    operatorRole.value === 'applicant' &&
    !!currentDetail.value &&
    (currentDetail.value.status === 'rejected' ||
      currentDetail.value.status === 'modified')
  )
})

const canLoadCurrentToForm = computed(() => {
  if (!currentDetail.value) return false
  return (
    currentDetail.value.status === 'rejected' ||
    currentDetail.value.status === 'modified'
  )
})

const applyDetailToForm = (detail: WorkflowInstance) => {
  formData.applicant = detail.applicant
  formData.title = detail.formData.title
  formData.type = detail.formData.type
  formData.amount = detail.formData.amount
  formData.reason = detail.formData.reason
}

const resetFormData = () => {
  formData.applicant = resolveDefaultApplicant()
  formData.title = ''
  formData.type = '预算审批'
  formData.amount = 0
  formData.reason = ''
}

const selectWorkflow = async (id: number) => {
  selectedWorkflowId.value = id
  try {
    const res = await getWorkflowDetail(id)
    currentDetail.value = res.data
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '获取流程详情失败'))
  }
}

const validateForm = async () => {
  if (!formRef.value) return false
  return !!(await formRef.value.validate().catch(() => false))
}

const startNewWorkflow = async () => {
  const valid = await validateForm()
  if (!valid) return

  submitting.value = true
  try {
    const res = await startWorkflow({
      applicant:
        operatorRole.value === 'applicant'
          ? operatorName.value
          : formData.applicant,
      title: formData.title,
      type: formData.type,
      amount: Number(formData.amount),
      reason: formData.reason
    })

    ElMessage.success('审批流程已发起')
    selectedWorkflowId.value = res.data.id
    actionComment.value = ''
    await refresh()
    resetFormData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '发起流程失败'))
  } finally {
    submitting.value = false
  }
}

const runCurrentAction = async (
  action: 'approve' | 'reject' | 'modify' | 'resubmit',
  successText: string
) => {
  if (!currentDetail.value) return
  submitting.value = true
  try {
    await runWorkflowAction({
      id: currentDetail.value.id,
      action,
      operator: operatorName.value.trim() || '系统用户',
      comment: actionComment.value.trim(),
      patchData:
        action === 'modify' || action === 'resubmit'
          ? {
              title: formData.title,
              type: formData.type,
              amount: Number(formData.amount),
              reason: formData.reason
            }
          : undefined
    })

    ElMessage.success(successText)
    actionComment.value = ''
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
  } finally {
    submitting.value = false
  }
}

const approveCurrent = async () => {
  if (!canApproveCurrent.value) return
  await runCurrentAction('approve', '审批通过')
}

const rejectCurrent = async () => {
  if (!canRejectCurrent.value) return
  await runCurrentAction('reject', '已驳回申请')
}

const saveModify = async () => {
  if (!canModifyCurrent.value) return
  const valid = await validateForm()
  if (!valid) return
  await runCurrentAction('modify', '修改内容已保存')
}

const resubmitCurrent = async () => {
  if (!canModifyCurrent.value) return
  const valid = await validateForm()
  if (!valid) return
  await runCurrentAction('resubmit', '已重新提交审批')
}

const loadCurrentToForm = () => {
  if (!currentDetail.value) return
  applyDetailToForm(currentDetail.value)
  ElMessage.info('已回填到左侧表单，可继续修改')
}
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
@use '@/style/workflow-page.scss';
</style>
