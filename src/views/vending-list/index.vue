<template>
  <div class="vending-list-page">
    <div class="page-header">
      <h1>贩卖机管理</h1>
      <p class="subtitle">管理所有贩卖机设备</p>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <div class="search-group">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索名称/位置/编号"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="告警" value="warning" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增贩卖机</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="设备编号" width="120" />
        <el-table-column prop="name" label="设备名称" min-width="140" />
        <el-table-column prop="location" label="位置" min-width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度" width="90" align="center">
          <template #default="{ row }">
            {{ row.status === 'offline' ? '-' : row.temperature + '°C' }}
          </template>
        </el-table-column>
        <el-table-column prop="productCount" label="商品数" width="90" align="center" />
        <el-table-column prop="todaySales" label="今日销量" width="100" align="center" />
        <el-table-column prop="todayRevenue" label="今日营收" width="110" align="right">
          <template #default="{ row }"> ¥{{ row.todayRevenue }} </template>
        </el-table-column>
        <el-table-column prop="lastMaintenance" label="上次维护" width="120" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleView(row)"> 查看 </el-button>
            <el-button type="warning" size="small" text @click="handleEdit(row)"> 编辑 </el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
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
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="贩卖机详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备编号">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="位置" :span="2">{{
          detailData.location
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)" effect="dark">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="温度">
          {{ detailData.status === 'offline' ? '-' : detailData.temperature + '°C' }}
        </el-descriptions-item>
        <el-descriptions-item label="商品数量">{{ detailData.productCount }}</el-descriptions-item>
        <el-descriptions-item label="今日销量">{{ detailData.todaySales }} 件</el-descriptions-item>
        <el-descriptions-item label="今日营收">¥{{ detailData.todayRevenue }}</el-descriptions-item>
        <el-descriptions-item label="上次维护">{{
          detailData.lastMaintenance
        }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{
          detailData.createTime
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToMonitor(detailData)">进入监控</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import type { VendingMachine } from './types'

const router = useRouter()

const loading = ref(false)
const tableData = ref<VendingMachine[]>([])
const searchKeyword = ref('')
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = computed(() => (isEdit.value ? '编辑贩卖机' : '新增贩卖机'))
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: '',
  name: '',
  location: '',
  status: 'offline',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入设备位置', trigger: 'blur' }],
}

// 详情弹窗
const detailVisible = ref(false)
const detailData = ref<VendingMachine>({} as VendingMachine)

// 状态转换
const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'danger' | 'warning'> = {
    online: 'success',
    offline: 'danger',
    warning: 'warning',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '告警',
  }
  return map[status] || status
}

// 获取列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
    })
    if (searchKeyword.value) params.append('keyword', searchKeyword.value)
    if (filterStatus.value) params.append('status', filterStatus.value)

    const res = await fetch(`/api/vending/list?${params}`)
    const data = await res.json()
    if (data.code === 200) {
      tableData.value = data.data.list
      pagination.total = data.data.total
    }
  } catch {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

// 重置
const handleReset = () => {
  searchKeyword.value = ''
  filterStatus.value = ''
  pagination.page = 1
  fetchList()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  formData.id = ''
  formData.name = ''
  formData.location = ''
  formData.status = 'offline'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: VendingMachine) => {
  isEdit.value = true
  formData.id = row.id
  formData.name = row.name
  formData.location = row.location
  formData.status = row.status
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: VendingMachine) => {
  detailData.value = row
  detailVisible.value = true
}

// 删除
const handleDelete = (row: VendingMachine) => {
  ElMessageBox.confirm(`确定删除 ${row.name} 吗？此操作不可恢复。`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        const res = await fetch(`/api/vending/delete/${row.id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.code === 200) {
          ElMessage.success('删除成功')
          fetchList()
        } else {
          ElMessage.error(data.message)
        }
      } catch {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  submitLoading.value = true
  try {
    const url = isEdit.value ? '/api/vending/update' : '/api/vending/add'
    const method = isEdit.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()

    if (data.code === 200) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(data.message)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 进入监控
const goToMonitor = (machine: VendingMachine) => {
  detailVisible.value = false
  router.push('/vending-monitor')
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.vending-list-page {
  padding: 24px;
  background: #0f172a;
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  .subtitle {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.search-group {
  display: flex;
  gap: 12px;
}

.table-container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;

  :deep(.el-table) {
    background: transparent;
    --el-table-bg-color: #0f172a;
    --el-table-tr-bg-color: #0f172a;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.08);
    --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.12);
    --el-table-border-color: rgba(255, 255, 255, 0.1);
    --el-table-text-color: #fff;
    --el-table-header-text-color: rgba(255, 255, 255, 0.9);

    .el-table__row {
      background-color: #0f172a !important;
    }

    .el-table__row:nth-child(even) {
      background-color: rgba(255, 255, 255, 0.03) !important;
    }

    .el-table__body tr:hover > td {
      background-color: rgba(255, 255, 255, 0.08) !important;
    }

    th.el-table__cell {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;

  :deep(.el-pagination) {
    --el-pagination-bg-color: transparent;
    --el-pagination-text-color: rgba(255, 255, 255, 0.8);
    --el-pagination-button-disabled-color: rgba(255, 255, 255, 0.3);
  }
}
</style>
