<template>
  <div class="approval-page">
    <header class="hero panel">
      <div>
        <span class="hero-badge">WORKFLOW</span>
        <h1>审批流程可视化</h1>
        <p>
          业务闭环：发起审批 → 审批驳回 → 申请人修改 → 重新提交 / 审批通过。
        </p>
      </div>

      <div class="hero-right">
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
    </header>

    <section class="stats-grid">
      <article class="stat-card panel">
        <span>流程总数</span>
        <strong>{{ summary.total }}</strong>
      </article>
      <article class="stat-card panel warning">
        <span>审批中</span>
        <strong>{{ summary.pending }}</strong>
      </article>
      <article class="stat-card panel danger">
        <span>已驳回 / 待改</span>
        <strong>{{ summary.rejected + summary.modified }}</strong>
      </article>
      <article class="stat-card panel success">
        <span>已通过</span>
        <strong>{{ summary.approved }}</strong>
      </article>
    </section>

    <section class="main-grid">
      <aside class="left-col panel">
        <div class="col-head">
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

        <div class="form-actions">
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
      </aside>

      <section class="right-col">
        <WorkflowGraph
          :status="currentDetail?.status || 'pending'"
          :reject-count="currentDetail?.rejectCount || 0"
        />

        <div class="action-panel panel">
          <div class="col-head">
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

          <div class="action-buttons">
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
        </div>

        <WorkflowRecordTimeline :records="currentDetail?.records || []" />
      </section>
    </section>

    <section class="table-panel panel">
      <div class="table-head">
        <div class="table-filters">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索流程号 / 标题 / 申请人"
            style="width: 260px"
            @keyup.enter="handleSearch"
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
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
        <el-button @click="fetchList">刷新列表</el-button>
      </div>

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

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[8, 16, 24]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="fetchList"
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores'
import {
  getWorkflowDetail,
  getWorkflowList,
  runWorkflowAction,
  startWorkflow,
  type StartWorkflowPayload,
  type WorkflowInstance,
  type WorkflowListItem,
  type WorkflowStatus,
  type WorkflowSummary
} from '@/services/approvalWorkflow'
import WorkflowGraph from './components/WorkflowGraph.vue'
import WorkflowRecordTimeline from './components/WorkflowRecordTimeline.vue'

const userStore = useUserStore()

const resolveDefaultApplicant = () => {
  const user = userStore.user || {}
  const candidates = [user.name, user.username, user.nickname, user.account]
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

const filters = reactive({
  keyword: '',
  status: '' as WorkflowStatus | ''
})

const pagination = reactive({
  page: 1,
  pageSize: 8,
  total: 0
})

const summary = ref<WorkflowSummary>({
  total: 0,
  pending: 0,
  rejected: 0,
  modified: 0,
  approved: 0
})

const listLoading = ref(false)
const workflowList = ref<WorkflowListItem[]>([])
const selectedWorkflowId = ref<number | null>(null)
const currentDetail = ref<WorkflowInstance | null>(null)

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

const fetchList = async () => {
  listLoading.value = true
  try {
    const res = await getWorkflowList({
      keyword: filters.keyword,
      status: filters.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    })

    if (res.code !== 200) {
      ElMessage.error(res.message || '获取列表失败')
      return
    }

    workflowList.value = res.data.list
    summary.value = res.data.summary
    pagination.total = res.data.total

    if (!workflowList.value.length) {
      currentDetail.value = null
      selectedWorkflowId.value = null
      return
    }

    const hasSelected = workflowList.value.some(
      (item) => item.id === selectedWorkflowId.value
    )
    const nextId = hasSelected
      ? selectedWorkflowId.value
      : workflowList.value[0]?.id
    if (typeof nextId === 'number') {
      await selectWorkflow(nextId)
    }
  } catch {
    ElMessage.error('获取列表失败')
  } finally {
    listLoading.value = false
  }
}

const selectWorkflow = async (id: number) => {
  selectedWorkflowId.value = id
  const res = await getWorkflowDetail(id)
  if (res.code !== 200) {
    ElMessage.error(res.message || '获取流程详情失败')
    return
  }
  currentDetail.value = res.data
}

const handleSearch = () => {
  pagination.page = 1
  void fetchList()
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = ''
  pagination.page = 1
  void fetchList()
}

const handleSizeChange = () => {
  pagination.page = 1
  void fetchList()
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
    if (res.code !== 200) {
      ElMessage.error(res.message || '发起流程失败')
      return
    }

    ElMessage.success('审批流程已发起')
    selectedWorkflowId.value = res.data.id
    actionComment.value = ''
    await fetchList()
    resetFormData()
  } catch {
    ElMessage.error('发起流程失败')
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
    const res = await runWorkflowAction({
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

    if (res.code !== 200) {
      ElMessage.error(res.message || '操作失败')
      return
    }

    ElMessage.success(successText)
    actionComment.value = ''
    await fetchList()
  } catch {
    ElMessage.error('操作失败')
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

onMounted(() => {
  void fetchList()
})
</script>

<style scoped lang="scss">
.approval-page {
  --bg: #f0f7fa;
  --panel: rgba(255, 255, 255, 0.88);
  --line: #d6e6ec;
  --text-main: #133645;
  --text-sub: #5f7885;
  --brand: #19839a;
  --shadow: 0 20px 44px rgba(17, 50, 64, 0.12);

  min-height: calc(100vh - 64px);
  padding: 22px;
  background:
    radial-gradient(circle at 6% 8%, #d8f2f2 0%, transparent 32%),
    radial-gradient(circle at 95% 10%, #ffe5cf 0%, transparent 30%), var(--bg);
  color: var(--text-main);
  font-family: 'Outfit', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #0f8f92 0%, #2f6ed8 100%);
}

.hero h1 {
  margin: 12px 0 8px;
  font-size: 32px;
  line-height: 1.1;
}

.hero p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.hero-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 260px;
}

.stats-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card span {
  color: var(--text-sub);
  font-size: 12px;
}

.stat-card strong {
  font-size: 30px;
  line-height: 1;
}

.stat-card.warning {
  background: linear-gradient(
    160deg,
    rgba(255, 245, 227, 0.9),
    rgba(255, 255, 255, 0.88)
  );
}

.stat-card.danger {
  background: linear-gradient(
    160deg,
    rgba(255, 236, 236, 0.9),
    rgba(255, 255, 255, 0.88)
  );
}

.stat-card.success {
  background: linear-gradient(
    160deg,
    rgba(232, 250, 238, 0.9),
    rgba(255, 255, 255, 0.88)
  );
}

.main-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 12px;
}

.left-col {
  padding: 16px;
}

.right-col {
  display: grid;
  gap: 12px;
}

.action-panel {
  padding: 16px;
}

.col-head {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.col-head h3 {
  margin: 0;
  font-size: 16px;
  color: #153544;
}

.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-buttons {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.table-panel {
  margin-top: 14px;
  padding: 14px;
}

.table-head {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.table-filters {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .main-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-right {
    width: 100%;
    max-width: 360px;
  }
}

@media (max-width: 768px) {
  .approval-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
