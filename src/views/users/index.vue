<template>
  <div class="user-list-page">
    <el-card class="hero-card" shadow="never">
      <div class="hero-content">
        <div class="hero-text">
          <el-text class="hero-kicker">用户管理</el-text>
          <h1 class="hero-title">用户列表</h1>
          <p class="hero-desc">
            支持用户增删改查，并记录访问本项目的用户 IP 与访问时间。
          </p>
        </div>
        <el-space>
          <el-button @click="fetchUsers">刷新列表</el-button>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
          <el-button @click="handleExport">导出列表</el-button>
        </el-space>
      </div>
    </el-card>

    <el-row :gutter="16" class="stats-row">
      <el-col v-for="stat in stats" :key="stat.label" :span="6">
        <el-card class="stat-card" shadow="never">
          <div class="stat-head">
            <div class="stat-icon" :style="{ background: stat.gradient }">
              {{ stat.icon }}
            </div>
            <el-statistic :value="stat.value" :title="stat.label" />
          </div>
          <div class="stat-foot">{{ stat.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="filter-card" shadow="never">
      <div class="filter-content">
        <el-form :inline="true" class="filter-form">
          <el-form-item>
            <el-input
              v-model="filters.keyword"
              clearable
              placeholder="搜索姓名 / 邮箱 / 部门"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="filters.role"
              clearable
              placeholder="全部角色"
              style="width: 140px"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role"
                :label="role"
                :value="role"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="filters.status"
              clearable
              placeholder="全部状态"
              style="width: 140px"
            >
              <el-option
                v-for="status in statusOptions"
                :key="status"
                :label="statusLabelMap[status]"
                :value="status"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="filter-meta">
          <el-text size="small">共 {{ pagination.total }} 位成员</el-text>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <AppDataTable :data="users" style="width: 100%" v-loading="loading">
        <el-table-column label="成员" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-badge v-if="row.online" is-dot type="success">
                <el-avatar :src="row.avatar" :size="44" />
              </el-badge>
              <el-avatar v-else :src="row.avatar" :size="44" />
              <div class="user-meta">
                <div class="user-name">
                  {{ row.name }}
                  <span class="user-code">#{{ row.code }}</span>
                </div>
                <div class="user-email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="部门" min-width="140">
          <template #default="{ row }">
            <div class="dept-cell">
              <div class="dept-name">{{ row.department }}</div>
              <div class="dept-location">{{ row.location }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" effect="light">
              {{ row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="light">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近活跃" min-width="160">
          <template #default="{ row }">
            <div class="active-cell">
              <div class="active-time">{{ row.lastActive }}</div>
              <div class="active-desc">加入 {{ row.joinedAt }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="280">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewProfile(row)"
              >查看</el-button
            >
            <el-button type="primary" link @click="editUser(row)"
              >编辑</el-button
            >
            <el-button type="danger" link @click="removeUser(row)"
              >删除</el-button
            >
            <el-button type="warning" link @click="toggleStatus(row)">
              {{ row.status === 'disabled' ? '启用' : '停用' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="没有匹配的用户" />
        </template>
      </AppDataTable>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[8, 16, 24]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchUsers"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-card class="visit-card" shadow="never">
      <template #header>
        <div class="visit-header">
          <span>访问记录（可看到当前访问 IP）</span>
          <el-button size="small" @click="refreshVisitLogs">刷新记录</el-button>
        </div>
      </template>

      <div class="visit-meta">
        <el-tag type="info">当前访问者：{{ visitorName }}</el-tag>
        <el-tag v-if="currentVisitIp" type="success"
          >当前 IP：{{ currentVisitIp }}</el-tag
        >
      </div>

      <AppDataTable :data="visitLogs" size="small" v-loading="visitLoading">
        <el-table-column prop="visitedAt" label="访问时间" min-width="180" />
        <el-table-column prop="ip" label="IP" min-width="140" />
        <el-table-column prop="visitorName" label="访问者" min-width="140" />
        <el-table-column prop="path" label="访问路径" min-width="120" />
        <el-table-column
          prop="userAgent"
          label="User-Agent"
          min-width="320"
          show-overflow-tooltip
        />
      </AppDataTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="560px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="90px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="formData.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="formData.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-input
            v-model="formData.role"
            placeholder="请输入角色，例如：研发"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option
              v-for="status in statusOptions"
              :key="status"
              :label="statusLabelMap[status]"
              :value="status"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitUser">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="用户详情" width="620px">
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="编号">{{
          detailData.code
        }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{
          detailData.name
        }}</el-descriptions-item>
        <el-descriptions-item label="邮箱" :span="2">{{
          detailData.email
        }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{
          detailData.department
        }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{
          detailData.location
        }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{
          detailData.role
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          getStatusLabel(detailData.status)
        }}</el-descriptions-item>
        <el-descriptions-item label="加入时间">{{
          detailData.joinedAt
        }}</el-descriptions-item>
        <el-descriptions-item label="最近活跃">{{
          detailData.lastActive
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import { useUserStore } from '@/stores'
import {
  createUser,
  deleteUserById,
  getUserList,
  getVisitLogs,
  registerVisit,
  updateUser,
  type UserItem,
  type UserListSummary,
  type UserStatus,
  type UserUpsertPayload,
  type VisitLogItem
} from '@/services/users'

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const loading = ref(false)
const users = ref<UserItem[]>([])
const roleOptions = ref<string[]>([])
const statusOptions: UserStatus[] = ['active', 'invited', 'disabled']

const statusLabelMap: Record<UserStatus, string> = {
  active: '在职',
  invited: '待激活',
  disabled: '已停用'
}

const roleTagType: Record<string, TagType> = {
  管理员: 'danger',
  研发: 'success',
  设计: 'info',
  运营: 'warning'
}

const statusTagType: Record<UserStatus, TagType> = {
  active: 'success',
  invited: 'warning',
  disabled: 'danger'
}

const getRoleTagType = (role: string): TagType => roleTagType[role] ?? 'info'
const getStatusTagType = (status: UserStatus): TagType => statusTagType[status]
const getStatusLabel = (status: UserStatus): string => statusLabelMap[status]

const filters = reactive({
  keyword: '',
  role: '',
  status: '' as UserStatus | ''
})

const pagination = reactive({
  page: 1,
  pageSize: 8,
  total: 0
})

const summary = ref<UserListSummary>({
  total: 0,
  active: 0,
  invited: 0,
  disabled: 0
})

const stats = computed(() => [
  {
    label: '总用户数',
    value: summary.value.total,
    desc: '全部账户',
    icon: 'U',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  },
  {
    label: '在职账号',
    value: summary.value.active,
    desc: '活跃成员',
    icon: 'A',
    gradient: 'linear-gradient(135deg, #22c55e, #4ade80)'
  },
  {
    label: '待激活',
    value: summary.value.invited,
    desc: '新邀请账号',
    icon: 'P',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
  },
  {
    label: '已停用',
    value: summary.value.disabled,
    desc: '受限账号',
    icon: 'D',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)'
  }
])

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      keyword: filters.keyword,
      role: filters.role,
      status: filters.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    })

    if (res.code !== 10000) {
      ElMessage.error(res.message || '获取用户列表失败')
      return
    }

    users.value = res.data.list
    pagination.total = res.data.total
    roleOptions.value = res.data.roleOptions
    summary.value = res.data.summary
  } catch {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  void fetchUsers()
}

const handleReset = () => {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  pagination.page = 1
  void fetchUsers()
}

const handleSizeChange = () => {
  pagination.page = 1
  void fetchUsers()
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<UserUpsertPayload & { id?: number }>({
  id: undefined,
  name: '',
  email: '',
  department: '',
  location: '',
  role: '',
  status: 'active'
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }
  ],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  role: [{ required: true, message: '请输入角色', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.email = ''
  formData.department = ''
  formData.location = ''
  formData.role = ''
  formData.status = 'active'
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editUser = (user: UserItem) => {
  isEdit.value = true
  formData.id = user.id
  formData.name = user.name
  formData.email = user.email
  formData.department = user.department
  formData.location = user.location
  formData.role = user.role
  formData.status = user.status
  dialogVisible.value = true
}

const submitUser = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      const res = await updateUser({
        id: formData.id,
        name: formData.name,
        email: formData.email,
        department: formData.department,
        location: formData.location,
        role: formData.role,
        status: formData.status
      })
      if (res.code !== 10000) {
        ElMessage.error(res.message || '编辑失败')
        return
      }
      ElMessage.success('编辑成功')
    } else {
      const res = await createUser({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        location: formData.location,
        role: formData.role,
        status: formData.status
      })
      if (res.code !== 10000) {
        ElMessage.error(res.message || '新增失败')
        return
      }
      ElMessage.success('新增成功')
    }

    dialogVisible.value = false
    await fetchUsers()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

const removeUser = (user: UserItem) => {
  ElMessageBox.confirm(`确认删除用户 ${user.name} 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const res = await deleteUserById(user.id)
      if (res.code !== 10000) {
        ElMessage.error(res.message || '删除失败')
        return
      }
      ElMessage.success('删除成功')
      if (users.value.length === 1 && pagination.page > 1) {
        pagination.page -= 1
      }
      await fetchUsers()
    })
    .catch(() => {})
}

const toggleStatus = async (user: UserItem) => {
  const nextStatus: UserStatus =
    user.status === 'disabled' ? 'active' : 'disabled'
  const res = await updateUser({
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    location: user.location,
    role: user.role,
    status: nextStatus
  })
  if (res.code !== 10000) {
    ElMessage.error(res.message || '状态切换失败')
    return
  }
  ElMessage.success(
    `${user.name} 已${nextStatus === 'disabled' ? '停用' : '启用'}`
  )
  await fetchUsers()
}

const detailVisible = ref(false)
const detailData = ref<UserItem>()

const viewProfile = (user: UserItem) => {
  detailData.value = { ...user }
  detailVisible.value = true
}

const exportCsv = (rows: UserItem[]) => {
  const headers = [
    '编号',
    '姓名',
    '邮箱',
    '部门',
    '地点',
    '角色',
    '状态',
    '最近活跃',
    '加入时间'
  ]
  const records = rows.map((item) => [
    item.code,
    item.name,
    item.email,
    item.department,
    item.location,
    item.role,
    getStatusLabel(item.status),
    item.lastActive,
    item.joinedAt
  ])

  const csvContent = [headers, ...records]
    .map((row) =>
      row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const handleExport = async () => {
  try {
    const res = await getUserList({
      keyword: filters.keyword,
      role: filters.role,
      status: filters.status,
      page: 1,
      pageSize: 5000
    })

    if (res.code !== 10000) {
      ElMessage.error(res.message || '导出失败')
      return
    }

    if (!res.data.list.length) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    exportCsv(res.data.list)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

const visitLoading = ref(false)
const visitLogs = ref<VisitLogItem[]>([])
const currentVisitIp = ref('')
const visitorName = ref('匿名访问')
const VISIT_SESSION_KEY = 'pcdemo_visit_registered'
const VISIT_IP_KEY = 'pcdemo_current_visit_ip'
const VISITOR_NAME_KEY = 'pcdemo_visitor_name'

const userStore = useUserStore()

const resolveVisitorName = () => {
  const userData = userStore.user || {}
  const candidates = [
    userData.name,
    userData.username,
    userData.nickname,
    userData.account
  ]
  const named = candidates.find(
    (item) => typeof item === 'string' && item.trim()
  )
  if (named) return String(named)

  const cached = localStorage.getItem(VISITOR_NAME_KEY)
  if (cached) return cached

  const generated = `访客-${Math.random().toString(36).slice(2, 6)}`
  localStorage.setItem(VISITOR_NAME_KEY, generated)
  return generated
}

const registerCurrentVisit = async () => {
  visitorName.value = resolveVisitorName()
  const cachedIp = sessionStorage.getItem(VISIT_IP_KEY)
  if (sessionStorage.getItem(VISIT_SESSION_KEY) && cachedIp) {
    currentVisitIp.value = cachedIp
    return
  }

  try {
    const res = await registerVisit({
      visitorName: visitorName.value,
      path: window.location.pathname
    })

    if (res.code !== 10000) {
      ElMessage.warning(res.message || '访问记录写入失败')
      return
    }

    currentVisitIp.value = res.data.ip
    sessionStorage.setItem(VISIT_SESSION_KEY, '1')
    sessionStorage.setItem(VISIT_IP_KEY, res.data.ip)
  } catch {
    ElMessage.warning('访问记录写入失败')
  }
}

const refreshVisitLogs = async () => {
  visitLoading.value = true
  try {
    const res = await getVisitLogs({ page: 1, pageSize: 20 })
    if (res.code !== 10000) {
      ElMessage.error(res.message || '获取访问记录失败')
      return
    }
    visitLogs.value = res.data.list
  } catch {
    ElMessage.error('获取访问记录失败')
  } finally {
    visitLoading.value = false
  }
}

onMounted(async () => {
  await registerCurrentVisit()
  await Promise.all([fetchUsers(), refreshVisitLogs()])
})
</script>

<style lang="scss" scoped>
.user-list-page {
  padding: 24px 32px 40px;
  min-height: calc(100vh - 64px);
  background: radial-gradient(circle at top right, #eef2ff 0%, #ffffff 55%);
}

.hero-card {
  margin-bottom: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #111827 100%);
  color: #e2e8f0;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.hero-title {
  margin: 6px 0 8px;
  font-size: 26px;
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.7);
}

.stats-row {
  margin-bottom: 18px;
}

.stat-card {
  height: 100%;
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 18px;
}

.stat-foot {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
}

.filter-card {
  margin-bottom: 18px;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-card :deep(.el-table__cell) {
  padding: 14px 0;
}

.table-card :deep(.el-table .cell) {
  line-height: 1.7;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
}

.user-code {
  margin-left: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.user-email {
  font-size: 12px;
  color: #64748b;
}

.dept-name {
  font-weight: 600;
  color: #1e293b;
}

.dept-location {
  font-size: 11px;
  color: #94a3b8;
}

.active-time {
  font-weight: 600;
  color: #1e293b;
}

.active-desc {
  font-size: 11px;
  color: #94a3b8;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}

.visit-card {
  margin-top: 18px;
}

.visit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.visit-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

@media (max-width: 1200px) {
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 960px) {
  .user-list-page {
    padding: 18px 16px 32px;
  }
}
</style>
