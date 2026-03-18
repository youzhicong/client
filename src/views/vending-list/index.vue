<template>
  <div class="vending-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <div class="hero panel">
      <div>
        <span class="hero-badge">DEVICE OPS</span>
        <h1>贩卖机管理控制台</h1>
        <p>统一管理设备状态、销售表现和维护记录，支持快速筛选与即时操作。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="fetchList">刷新列表</el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd"
          >新增设备</el-button
        >
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card panel">
        <span class="label">当前页设备</span>
        <strong class="value">{{ pageStats.total }}</strong>
        <span class="hint">总设备数（当前页）</span>
      </div>

      <div class="stat-card panel online">
        <span class="label">在线设备</span>
        <strong class="value">{{ pageStats.online }}</strong>
        <span class="hint">状态正常可服务</span>
      </div>

      <div class="stat-card panel warning">
        <span class="label">告警设备</span>
        <strong class="value">{{ pageStats.warning }}</strong>
        <span class="hint">建议优先巡检</span>
      </div>

      <div class="stat-card panel">
        <span class="label">今日营收</span>
        <strong class="value">{{ formatCurrency(pageStats.revenue) }}</strong>
        <span class="hint">当前页累计</span>
      </div>
    </div>

    <div class="toolbar panel">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索名称 / 位置 / 编号"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="filterStatus"
          placeholder="状态筛选"
          clearable
          class="status-select"
        >
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="告警" value="warning" />
        </el-select>

        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <div class="toolbar-right">
        <span>在线率：{{ onlineRate }}</span>
        <span>平均温度：{{ averageTemperature }}</span>
      </div>
    </div>

    <div class="table-panel panel">
      <AppDataTable
        :data="tableData"
        v-loading="loading"
        border
        height="560"
        :row-class-name="rowClassName"
      >
        <el-table-column prop="id" label="设备编号" width="120" fixed="left" />
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="location" label="位置" min-width="200" />

        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">{{
              getStatusText(row.status)
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="temperature"
          label="温度"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ row.status === 'offline' ? '-' : row.temperature + '°C' }}
          </template>
        </el-table-column>

        <el-table-column
          prop="productCount"
          label="商品数"
          width="96"
          align="center"
        />

        <el-table-column
          prop="todaySales"
          label="今日销量"
          width="100"
          align="center"
        >
          <template #default="{ row }">{{ row.todaySales }} 件</template>
        </el-table-column>

        <el-table-column
          prop="todayRevenue"
          label="今日营收"
          width="120"
          align="right"
        >
          <template #default="{ row }">{{
            formatCurrency(row.todayRevenue)
          }}</template>
        </el-table-column>

        <el-table-column
          prop="lastMaintenance"
          label="上次维护"
          width="120"
          align="center"
        />

        <el-table-column label="操作" width="210" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleView(row)"
              >查看</el-button
            >
            <el-button type="warning" size="small" text @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="small"
              text
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </AppDataTable>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="96px"
      >
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入设备名称" />
        </el-form-item>

        <el-form-item label="位置" prop="location">
          <el-input v-model="formData.location" placeholder="请输入设备位置" />
        </el-form-item>

        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="告警" value="warning" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="设备详情" width="640px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备编号">{{
          detailData.id
        }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{
          detailData.name
        }}</el-descriptions-item>
        <el-descriptions-item label="位置" :span="2">{{
          detailData.location
        }}</el-descriptions-item>

        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)" effect="light">{{
            getStatusText(detailData.status)
          }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="温度">
          {{
            detailData.status === 'offline'
              ? '-'
              : `${detailData.temperature}°C`
          }}
        </el-descriptions-item>

        <el-descriptions-item label="商品数量">{{
          detailData.productCount
        }}</el-descriptions-item>
        <el-descriptions-item label="今日销量"
          >{{ detailData.todaySales }} 件</el-descriptions-item
        >
        <el-descriptions-item label="今日营收">{{
          formatCurrency(detailData.todayRevenue)
        }}</el-descriptions-item>
        <el-descriptions-item label="上次维护">{{
          detailData.lastMaintenance
        }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{
          detailData.createTime
        }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToMonitor(detailData)"
          >进入监控</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import { useRouter } from 'vue-router'
import {
  createVendingMachine,
  deleteVendingMachine,
  getVendingList,
  updateVendingMachine,
  type VendingMachine
} from '@/services/vending'

const router = useRouter()

const loading = ref(false)
const tableData = ref<VendingMachine[]>([])
const searchKeyword = ref('')
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<
  Pick<VendingMachine, 'id' | 'name' | 'location' | 'status'>
>({
  id: '',
  name: '',
  location: '',
  status: 'offline'
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入设备位置', trigger: 'blur' }]
}

const detailVisible = ref(false)
const detailData = ref<VendingMachine>({
  id: '',
  name: '',
  location: '',
  status: 'offline',
  temperature: 0,
  productCount: 0,
  todaySales: 0,
  todayRevenue: 0,
  lastMaintenance: '-',
  createTime: '-'
})

const dialogTitle = computed(() => (isEdit.value ? '编辑贩卖机' : '新增贩卖机'))

const pageStats = computed(() => {
  const online = tableData.value.filter(
    (item) => item.status === 'online'
  ).length
  const warning = tableData.value.filter(
    (item) => item.status === 'warning'
  ).length
  const revenue = tableData.value.reduce(
    (sum, item) => sum + item.todayRevenue,
    0
  )

  return {
    total: tableData.value.length,
    online,
    warning,
    revenue
  }
})

const onlineRate = computed(() => {
  const total = pageStats.value.total
  if (!total) return '0.0%'
  return `${((pageStats.value.online / total) * 100).toFixed(1)}%`
})

const averageTemperature = computed(() => {
  const valid = tableData.value.filter((item) => item.status !== 'offline')
  if (!valid.length) return '-'
  const avg =
    valid.reduce((sum, item) => sum + item.temperature, 0) / valid.length
  return `${avg.toFixed(1)}°C`
})

const formatCurrency = (value: number) => `¥${value.toFixed(2)}`

const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning'> = {
    online: 'success',
    offline: 'danger',
    warning: 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '告警'
  }
  return map[status] || status
}

const rowClassName = ({ row }: { row: unknown }) => {
  const status =
    typeof row === 'object' &&
    row !== null &&
    'status' in row &&
    typeof (row as { status?: unknown }).status === 'string'
      ? (row as { status: string }).status
      : 'unknown'
  return `row-${status}`
}

const fetchList = async () => {
  loading.value = true
  try {
    const response = await getVendingList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value.trim(),
      status: filterStatus.value as VendingMachine['status'] | ''
    })
    const data = response

    if (data.code === 10000) {
      tableData.value = data.data.list
      pagination.total = data.data.total
    } else {
      ElMessage.error(data.message || '获取列表失败')
    }
  } catch {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  void fetchList()
}

const handleReset = () => {
  searchKeyword.value = ''
  filterStatus.value = ''
  pagination.page = 1
  void fetchList()
}

const handleAdd = () => {
  isEdit.value = false
  formData.id = ''
  formData.name = ''
  formData.location = ''
  formData.status = 'offline'
  dialogVisible.value = true
}

const handleEdit = (row: VendingMachine) => {
  isEdit.value = true
  formData.id = row.id
  formData.name = row.name
  formData.location = row.location
  formData.status = row.status
  dialogVisible.value = true
}

const handleView = (row: VendingMachine) => {
  detailData.value = { ...row }
  detailVisible.value = true
}

const handleDelete = (row: VendingMachine) => {
  ElMessageBox.confirm(
    `确定删除设备 ${row.name} 吗？该操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const response = await deleteVendingMachine(row.id)
        const data = response
        if (data.code === 10000) {
          ElMessage.success('删除成功')
          await fetchList()
        } else {
          ElMessage.error(data.message || '删除失败')
        }
      } catch {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const response = isEdit.value
      ? await updateVendingMachine({
          id: formData.id,
          name: formData.name,
          location: formData.location,
          status: formData.status
        })
      : await createVendingMachine({
          name: formData.name,
          location: formData.location,
          status: formData.status
        })
    const data = response

    if (data.code === 10000) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      dialogVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(data.message || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

const goToMonitor = (machine: VendingMachine) => {
  detailVisible.value = false
  if (!machine.id) return
  router.push({ path: '/vending-monitor', query: { id: machine.id } })
}

onMounted(() => {
  void fetchList()
})
</script>

<style lang="scss" scoped>
.vending-page {
  --bg-main: #f2f5f8;
  --panel-bg: rgba(255, 255, 255, 0.86);
  --line: #d9e3ea;
  --text-main: #1a3942;
  --text-sub: #6f8790;
  --brand: #117f86;
  --shadow: 0 20px 42px rgba(24, 57, 69, 0.12);

  min-height: calc(100vh - 60px);
  position: relative;
  padding: 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at 6% 8%, #d7eef6 0%, transparent 32%),
    radial-gradient(circle at 90% 10%, #ffe7d4 0%, transparent 30%),
    var(--bg-main);
  color: var(--text-main);
  font-family: 'Outfit', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  filter: blur(30px);
  opacity: 0.38;
  pointer-events: none;
}

.shape-a {
  width: 260px;
  height: 260px;
  right: -90px;
  top: -50px;
  background: #b8e5f0;
}

.shape-b {
  width: 220px;
  height: 220px;
  left: -70px;
  bottom: 120px;
  background: #cae8df;
}

.panel {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow);
}

.hero {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #117f86 0%, #2f6fda 100%);
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

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stats-grid {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card .label {
  color: var(--text-sub);
  font-size: 12px;
}

.stat-card .value {
  font-size: 28px;
  line-height: 1.05;
}

.stat-card .hint {
  color: #8ea2ab;
  font-size: 12px;
}

.stat-card.online .value {
  color: #15803d;
}

.stat-card.warning .value {
  color: #d97706;
}

.toolbar {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 280px;
}

.status-select {
  width: 140px;
}

.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--text-sub);
  font-size: 12px;
}

.table-panel {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  padding: 14px;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: rgba(210, 233, 238, 0.45);
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.66);
  --el-table-row-hover-bg-color: rgba(213, 239, 244, 0.55);
  --el-table-border-color: #d6e1e8;
  --el-table-text-color: #1a3b46;
  --el-table-header-text-color: #204f5b;
}

:deep(.el-table .row-online) {
  --row-highlight: rgba(34, 197, 94, 0.08);
}

:deep(.el-table .row-warning) {
  --row-highlight: rgba(245, 158, 11, 0.12);
}

:deep(.el-table .row-offline) {
  --row-highlight: rgba(239, 68, 68, 0.08);
}

:deep(.el-table .el-table__row td) {
  background: linear-gradient(
    to right,
    var(--row-highlight, transparent),
    transparent
  ) !important;
}

.pagination-wrap {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 860px) {
  .vending-page {
    padding: 14px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero h1 {
    font-size: 26px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .search-input,
  .status-select {
    width: 100%;
  }

  .toolbar-left {
    width: 100%;
  }
}
</style>
