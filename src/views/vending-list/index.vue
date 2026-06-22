<template>
  <PageShell class="vending-page">
    <template #hero>
      <PageHero
        badge="DEVICE OPS"
        title="贩卖机管理控制台"
        description="统一管理设备状态、销售表现和维护记录，支持快速筛选与即时操作。"
      >
        <template #actions>
          <el-button @click="refresh">刷新列表</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增设备
          </el-button>
        </template>
      </PageHero>
    </template>

    <template #stats>
      <PageStatGrid :columns="4">
        <PageStatCard label="当前页设备" :value="pageStats.total" />
        <PageStatCard
          label="在线设备"
          :value="pageStats.online"
          tone="success"
        />
        <PageStatCard
          label="告警设备"
          :value="pageStats.warning"
          tone="warning"
        />
        <PageStatCard
          label="今日营收"
          :value="formatCurrency(pageStats.revenue)"
        />
      </PageStatGrid>
    </template>

    <PagePanel>
      <PageFilterBar>
        <template #filters>
          <el-input
            v-model="filters.keyword"
            placeholder="搜索名称 / 位置 / 编号"
            clearable
            class="search-input"
            @keyup.enter="search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="filters.status"
            placeholder="状态筛选"
            clearable
            class="status-select"
          >
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="告警" value="warning" />
          </el-select>

          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="reset">重置</el-button>
        </template>
        <template #extra>
          <span class="toolbar-meta">在线率：{{ onlineRate }}</span>
          <span class="toolbar-meta">平均温度：{{ averageTemperature }}</span>
        </template>
      </PageFilterBar>

      <AppDataTable
        :data="list"
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

      <div class="page-pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="refresh"
        />
      </div>
    </PagePanel>

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
  </PageShell>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import { useRouter } from 'vue-router'
import PageFilterBar from '@/components/page/PageFilterBar.vue'
import PageHero from '@/components/page/PageHero.vue'
import PagePanel from '@/components/page/PagePanel.vue'
import PageShell from '@/components/page/PageShell.vue'
import PageStatCard from '@/components/page/PageStatCard.vue'
import PageStatGrid from '@/components/page/PageStatGrid.vue'
import { usePaginatedQuery } from '@/composables/usePaginatedQuery'
import { getApiErrorMessage } from '@/utils/request'
import {
  createVendingMachine,
  deleteVendingMachine,
  getVendingList,
  updateVendingMachine,
  type VendingListResult,
  type VendingMachine,
  type VendingMachineStatus
} from '@/services/vending'

const router = useRouter()

type VendingFilters = {
  keyword: string
  status: VendingMachineStatus | ''
}

const {
  filters,
  pagination,
  loading,
  list,
  refresh,
  search,
  reset,
  handleSizeChange,
  adjustPageAfterDelete
} = usePaginatedQuery<VendingMachine, VendingFilters, VendingListResult>({
  defaultFilters: {
    keyword: '',
    status: ''
  },
  errorMessage: '获取列表失败',
  fetcher: (query) =>
    getVendingList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword.trim(),
      status: query.status
    })
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
  const online = list.value.filter((item) => item.status === 'online').length
  const warning = list.value.filter((item) => item.status === 'warning').length
  const revenue = list.value.reduce((sum, item) => sum + item.todayRevenue, 0)

  return {
    total: list.value.length,
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
  const valid = list.value.filter((item) => item.status !== 'offline')
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
        await deleteVendingMachine(row.id)
        ElMessage.success('删除成功')
        adjustPageAfterDelete()
        await refresh()
      } catch (error) {
        ElMessage.error(getApiErrorMessage(error, '删除失败'))
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
    if (isEdit.value) {
      await updateVendingMachine({
        id: formData.id,
        name: formData.name,
        location: formData.location,
        status: formData.status
      })
    } else {
      await createVendingMachine({
        name: formData.name,
        location: formData.location,
        status: formData.status
      })
    }
    ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
    dialogVisible.value = false
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
  } finally {
    submitLoading.value = false
  }
}

const goToMonitor = (machine: VendingMachine) => {
  detailVisible.value = false
  if (!machine.id) return
  router.push({ path: '/vending-monitor', query: { id: machine.id } })
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
</script>

<style lang="scss" scoped>
@use '@/style/page-shell.scss';

.toolbar-meta {
  color: #6f8790;
  font-size: 12px;
}

.search-input {
  width: 280px;
}

.status-select {
  width: 140px;
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

@media (max-width: 860px) {
  .search-input,
  .status-select {
    width: 100%;
  }
}
</style>
