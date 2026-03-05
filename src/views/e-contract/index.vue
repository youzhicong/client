<template>
  <div class="econtract-page">
    <header class="hero panel">
      <div>
        <span class="hero-badge">E-CONTRACT</span>
        <h1>电子合同签署</h1>
        <p>支持合同创建、修改、提交签署、手写签名、驳回与重提的全流程管理。</p>
      </div>
      <div class="hero-right">
        <el-input
          v-model="operatorName"
          size="small"
          placeholder="当前操作人"
        />
        <el-segmented
          v-model="signerRole"
          :options="signerOptions"
          size="small"
        />
      </div>
    </header>

    <section class="stats-grid">
      <article class="stat panel">
        <span>合同总数</span>
        <strong>{{ summary.total }}</strong>
      </article>
      <article class="stat panel">
        <span>签署中</span>
        <strong>{{ summary.signing }}</strong>
      </article>
      <article class="stat panel">
        <span>已驳回</span>
        <strong>{{ summary.rejected }}</strong>
      </article>
      <article class="stat panel">
        <span>已完成</span>
        <strong>{{ summary.completed }}</strong>
      </article>
    </section>

    <section class="main-grid">
      <aside class="left panel">
        <div class="box-head">
          <h3>合同信息</h3>
          <el-tag v-if="currentDetail">当前：{{ currentDetail.code }}</el-tag>
        </div>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="88px"
        >
          <el-form-item label="合同标题" prop="title">
            <el-input
              v-model="formData.title"
              placeholder="例如：年度广告投放合作协议"
            />
          </el-form-item>
          <el-form-item label="对方公司" prop="counterparty">
            <el-input
              v-model="formData.counterparty"
              placeholder="请输入合作方公司名称"
            />
          </el-form-item>
          <el-form-item label="合同金额" prop="amount">
            <el-input-number
              v-model="formData.amount"
              :min="0"
              :step="1000"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="合同正文" prop="content">
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="5"
              placeholder="填写合同主要条款"
            />
          </el-form-item>
        </el-form>

        <div class="actions">
          <el-button
            type="success"
            :loading="submitting"
            @click="createNewContract"
            >创建草稿</el-button
          >
          <el-button
            :disabled="!canEditCurrent"
            :loading="submitting"
            @click="saveCurrentDraft"
            >保存修改</el-button
          >
          <el-button
            type="primary"
            :disabled="!canSubmitCurrent"
            :loading="submitting"
            @click="submitCurrentContract"
          >
            提交签署
          </el-button>
          <el-button @click="resetFormData">清空</el-button>
        </div>

        <div v-if="currentDetail?.rejectReason" class="reject-tip">
          <strong>驳回原因：</strong>{{ currentDetail.rejectReason }}
        </div>
      </aside>

      <section class="right-col">
        <ContractFlow :status="currentDetail?.status || 'draft'" />

        <section class="sign-box panel">
          <div class="box-head">
            <h3>电子签名</h3>
            <el-tag type="info">当前签署方：{{ signerRoleLabel }}</el-tag>
          </div>
          <SignaturePad ref="signaturePadRef" />

          <el-input
            v-model="actionComment"
            type="textarea"
            :rows="2"
            placeholder="签署/驳回意见（可选）"
          />

          <div class="actions">
            <el-button
              type="primary"
              :disabled="!canSignCurrent"
              :loading="submitting"
              @click="signCurrentContract"
            >
              完成签署
            </el-button>
            <el-button
              type="danger"
              :disabled="!canRejectCurrent"
              :loading="submitting"
              @click="rejectCurrentContract"
            >
              驳回合同
            </el-button>
            <el-button :disabled="!currentDetail" @click="loadCurrentToForm"
              >回填到左侧编辑</el-button
            >
          </div>
        </section>

        <section class="record-box panel">
          <div class="box-head">
            <h3>签署记录</h3>
          </div>
          <el-timeline v-if="currentDetail?.records?.length">
            <el-timeline-item
              v-for="item in currentDetail.records"
              :key="item.id"
              :timestamp="item.createdAt"
              :type="recordTypeMap[item.action]"
            >
              <strong>{{ recordLabelMap[item.action] }}</strong>
              <span class="record-operator"> {{ item.operator }}</span>
              <p class="record-comment">{{ item.comment }}</p>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无记录" />
        </section>
      </section>
    </section>

    <section class="table-wrap panel">
      <div class="table-head">
        <div class="filters">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索合同号/标题/公司"
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部状态"
            style="width: 160px"
          >
            <el-option
              v-for="item in statusOptions"
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

      <AppDataTable :data="contractList" border v-loading="listLoading">
        <el-table-column prop="code" label="合同号" min-width="160" />
        <el-table-column prop="title" label="合同标题" min-width="220" />
        <el-table-column prop="counterparty" label="对方公司" min-width="180" />
        <el-table-column label="金额" width="130" align="right">
          <template #default="{ row }"
            >¥{{ Number(row.amount).toLocaleString() }}</template
          >
        </el-table-column>
        <el-table-column prop="createdBy" label="发起人" min-width="120" />
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{
              row.statusLabel
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentStep" label="当前环节" min-width="120" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="selectContract(row.id)"
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
  createContract,
  getContractDetail,
  getContractList,
  rejectContract,
  signContract,
  submitContract,
  updateContract,
  type ContractItem,
  type ContractListItem,
  type ContractStatus,
  type ContractSummary,
  type SignerRole
} from '@/services/eContract'
import SignaturePad from './components/SignaturePad.vue'
import ContractFlow from './components/ContractFlow.vue'

const userStore = useUserStore()

const resolveOperatorName = () => {
  const user = userStore.user || {}
  const candidates = [user.name, user.username, user.nickname, user.account]
  const named = candidates.find(
    (item: unknown) => typeof item === 'string' && item.trim()
  )
  return named ? String(named) : '签署人A'
}

const operatorName = ref(resolveOperatorName())
const signerRole = ref<SignerRole>('partyA')

const signerOptions = [
  { label: '甲方签署', value: 'partyA' },
  { label: '乙方签署', value: 'partyB' }
]

const signerRoleLabel = computed(() =>
  signerRole.value === 'partyA' ? '甲方' : '乙方'
)

const statusTypeMap: Record<
  ContractStatus,
  'info' | 'warning' | 'danger' | 'success'
> = {
  draft: 'info',
  pending_a: 'warning',
  pending_b: 'warning',
  rejected: 'danger',
  completed: 'success'
}

const getStatusTagType = (status: unknown) => {
  if (typeof status !== 'string') return 'info'
  return statusTypeMap[status as ContractStatus] || 'info'
}

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待甲方签署', value: 'pending_a' },
  { label: '待乙方签署', value: 'pending_b' },
  { label: '已驳回', value: 'rejected' },
  { label: '已完成', value: 'completed' }
]

const recordLabelMap: Record<string, string> = {
  create: '创建合同',
  update: '修改合同',
  submit: '提交签署',
  sign: '完成签署',
  reject: '驳回合同'
}

const recordTypeMap: Record<
  string,
  'primary' | 'warning' | 'success' | 'danger'
> = {
  create: 'primary',
  update: 'warning',
  submit: 'primary',
  sign: 'success',
  reject: 'danger'
}

const filters = reactive({
  keyword: '',
  status: '' as ContractStatus | ''
})

const pagination = reactive({
  page: 1,
  pageSize: 8,
  total: 0
})

const summary = ref<ContractSummary>({
  total: 0,
  draft: 0,
  signing: 0,
  rejected: 0,
  completed: 0
})

const listLoading = ref(false)
const contractList = ref<ContractListItem[]>([])
const currentDetail = ref<ContractItem | null>(null)
const selectedContractId = ref<number | null>(null)

const formRef = ref<FormInstance>()
const signaturePadRef = ref<InstanceType<typeof SignaturePad> | null>(null)
const submitting = ref(false)
const actionComment = ref('')

const formData = reactive({
  title: '',
  counterparty: '',
  amount: 0,
  content: ''
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入合同标题', trigger: 'blur' }],
  counterparty: [
    { required: true, message: '请输入对方公司', trigger: 'blur' }
  ],
  amount: [{ required: true, message: '请输入合同金额', trigger: 'change' }],
  content: [{ required: true, message: '请输入合同正文', trigger: 'blur' }]
}

const canEditCurrent = computed(() => {
  if (!currentDetail.value) return false
  return (
    currentDetail.value.status === 'draft' ||
    currentDetail.value.status === 'rejected'
  )
})

const canSubmitCurrent = computed(() => {
  if (!currentDetail.value) return false
  return (
    currentDetail.value.status === 'draft' ||
    currentDetail.value.status === 'rejected'
  )
})

const canSignCurrent = computed(() => {
  if (!currentDetail.value) return false
  if (currentDetail.value.status === 'pending_a')
    return signerRole.value === 'partyA'
  if (currentDetail.value.status === 'pending_b')
    return signerRole.value === 'partyB'
  return false
})

const canRejectCurrent = computed(() => {
  if (!currentDetail.value) return false
  return (
    currentDetail.value.status === 'pending_a' ||
    currentDetail.value.status === 'pending_b'
  )
})

const applyDetailToForm = (detail: ContractItem) => {
  formData.title = detail.formData.title
  formData.counterparty = detail.formData.counterparty
  formData.amount = detail.formData.amount
  formData.content = detail.formData.content
}

const resetFormData = () => {
  formData.title = ''
  formData.counterparty = ''
  formData.amount = 0
  formData.content = ''
}

const validateForm = async () => {
  if (!formRef.value) return false
  return !!(await formRef.value.validate().catch(() => false))
}

const fetchList = async () => {
  listLoading.value = true
  try {
    const res = await getContractList({
      keyword: filters.keyword,
      status: filters.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '获取合同列表失败')
      return
    }

    contractList.value = res.data.list
    pagination.total = res.data.total
    summary.value = res.data.summary

    if (!contractList.value.length) {
      currentDetail.value = null
      selectedContractId.value = null
      return
    }

    const hasSelected = contractList.value.some(
      (item) => item.id === selectedContractId.value
    )
    const nextId = hasSelected
      ? selectedContractId.value
      : contractList.value[0]?.id
    if (typeof nextId === 'number') await selectContract(nextId)
  } catch {
    ElMessage.error('获取合同列表失败')
  } finally {
    listLoading.value = false
  }
}

const selectContract = async (id: number) => {
  selectedContractId.value = id
  const res = await getContractDetail(id)
  if (res.code !== 200) {
    ElMessage.error(res.message || '获取合同详情失败')
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

const createNewContract = async () => {
  const valid = await validateForm()
  if (!valid) return

  submitting.value = true
  try {
    const res = await createContract({
      title: formData.title,
      counterparty: formData.counterparty,
      amount: Number(formData.amount),
      content: formData.content,
      createdBy: operatorName.value.trim() || '合同发起人'
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '创建失败')
      return
    }
    ElMessage.success('合同草稿已创建')
    selectedContractId.value = res.data.id
    actionComment.value = ''
    signaturePadRef.value?.clearPad()
    await fetchList()
  } catch {
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

const saveCurrentDraft = async () => {
  if (!currentDetail.value) return
  const valid = await validateForm()
  if (!valid) return

  submitting.value = true
  try {
    const res = await updateContract({
      id: currentDetail.value.id,
      title: formData.title,
      counterparty: formData.counterparty,
      amount: Number(formData.amount),
      content: formData.content,
      operator: operatorName.value.trim() || '合同发起人'
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '保存失败')
      return
    }
    ElMessage.success('合同已保存')
    await fetchList()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

const submitCurrentContract = async () => {
  if (!currentDetail.value) return
  submitting.value = true
  try {
    const res = await submitContract({
      id: currentDetail.value.id,
      operator: operatorName.value.trim() || '合同发起人',
      comment: actionComment.value.trim()
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '提交失败')
      return
    }
    ElMessage.success('已提交签署')
    actionComment.value = ''
    signaturePadRef.value?.clearPad()
    await fetchList()
  } catch {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const signCurrentContract = async () => {
  if (!currentDetail.value) return
  const signatureData = signaturePadRef.value?.exportSignature() || ''
  if (!signatureData) {
    ElMessage.warning('请先手写签名')
    return
  }

  submitting.value = true
  try {
    const res = await signContract({
      id: currentDetail.value.id,
      signerRole: signerRole.value,
      signatureData,
      operator: operatorName.value.trim() || '签署人',
      comment: actionComment.value.trim()
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '签署失败')
      return
    }
    ElMessage.success('签署成功')
    actionComment.value = ''
    signaturePadRef.value?.clearPad()
    await fetchList()
  } catch {
    ElMessage.error('签署失败')
  } finally {
    submitting.value = false
  }
}

const rejectCurrentContract = async () => {
  if (!currentDetail.value) return
  submitting.value = true
  try {
    const res = await rejectContract({
      id: currentDetail.value.id,
      operator: operatorName.value.trim() || '审批人',
      comment: actionComment.value.trim()
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '驳回失败')
      return
    }
    ElMessage.success('合同已驳回')
    actionComment.value = ''
    signaturePadRef.value?.clearPad()
    await fetchList()
  } catch {
    ElMessage.error('驳回失败')
  } finally {
    submitting.value = false
  }
}

const loadCurrentToForm = () => {
  if (!currentDetail.value) return
  applyDetailToForm(currentDetail.value)
  ElMessage.info('已回填到左侧，可继续编辑')
}

onMounted(() => {
  void fetchList()
})
</script>

<style scoped lang="scss">
.econtract-page {
  --bg: #f1f7fa;
  --panel: rgba(255, 255, 255, 0.9);
  --line: #d6e6ee;
  --text-main: #153846;
  --text-sub: #69818d;
  --shadow: 0 20px 40px rgba(19, 56, 70, 0.12);

  min-height: calc(100vh - 64px);
  padding: 22px;
  background:
    radial-gradient(circle at 8% 8%, #d7f2ef 0%, transparent 35%),
    radial-gradient(circle at 90% 10%, #ffe9d7 0%, transparent 32%), var(--bg);
  color: var(--text-main);
  font-family: 'Outfit', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.panel {
  border-radius: 20px;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
}

.hero {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, #0f8f92 0%, #2f6ed8 100%);
}

.hero h1 {
  margin: 12px 0 8px;
  font-size: 32px;
}

.hero p {
  margin: 0;
  color: var(--text-sub);
  font-size: 14px;
}

.hero-right {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat span {
  color: var(--text-sub);
  font-size: 12px;
}

.stat strong {
  font-size: 30px;
  line-height: 1;
}

.main-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 12px;
}

.left {
  padding: 16px;
}

.right-col {
  display: grid;
  gap: 12px;
}

.sign-box,
.record-box {
  padding: 14px;
}

.box-head {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.box-head h3 {
  margin: 0;
  font-size: 16px;
  color: #183c4c;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.reject-tip {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff3f3;
  color: #9b2c2c;
  font-size: 13px;
}

.record-operator {
  margin-left: 8px;
  color: #5c7888;
}

.record-comment {
  margin: 4px 0 0;
  color: #456474;
  font-size: 13px;
}

.table-wrap {
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

.filters {
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

@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .econtract-page {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-right {
    width: 100%;
    max-width: 320px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
