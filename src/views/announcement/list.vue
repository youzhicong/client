<template>
  <div class="announcement-list-page">
    <header class="hero panel">
      <div>
        <span class="hero-badge">ANNOUNCEMENT</span>
        <h1>公告管理</h1>
        <p>查看公告发布数量、状态和阅读情况，支持快速跳转编辑与详情。</p>
      </div>
      <el-button type="primary" @click="goPublish()">发布新公告</el-button>
    </header>

    <section class="stats-grid">
      <article class="panel stat">
        <span>公告总数</span>
        <strong>{{ summary.total }}</strong>
      </article>
      <article class="panel stat">
        <span>已发布</span>
        <strong>{{ summary.published }}</strong>
      </article>
      <article class="panel stat">
        <span>草稿</span>
        <strong>{{ summary.draft }}</strong>
      </article>
    </section>

    <section class="panel table-panel">
      <div class="table-head">
        <div class="filters">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索标题/摘要/作者"
            style="width: 280px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="filters.status"
            clearable
            style="width: 140px"
            placeholder="全部状态"
          >
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
        <el-button @click="fetchList">刷新</el-button>
      </div>

      <AppDataTable :data="tableData" border v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column
          prop="summary"
          label="摘要"
          min-width="280"
          show-overflow-tooltip
        />
        <el-table-column prop="author" label="作者" min-width="120" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{
              row.statusLabel
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="viewCount"
          label="阅读量"
          width="100"
          align="center"
        />
        <el-table-column prop="publishedAt" label="发布时间" min-width="170" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="goDetail(row.id)"
              >详情</el-button
            >
            <el-button type="warning" link @click="goPublish(row.id)"
              >编辑</el-button
            >
            <el-button
              v-if="row.status === 'draft'"
              type="success"
              link
              @click="handlePublish(row.id)"
            >
              发布
            </el-button>
            <el-button type="danger" link @click="handleDelete(row.id)"
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
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="fetchList"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  deleteAnnouncement,
  getAnnouncementList,
  publishAnnouncement,
  type AnnouncementListItem,
  type AnnouncementStatus,
  type AnnouncementSummary
} from '@/services/announcement'

defineOptions({
  name: 'AnnouncementListPage'
})

const router = useRouter()

const filters = reactive({
  keyword: '',
  status: '' as AnnouncementStatus | ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const loading = ref(false)
const tableData = ref<AnnouncementListItem[]>([])
const summary = ref<AnnouncementSummary>({
  total: 0,
  draft: 0,
  published: 0
})

const getStatusTagType = (status: unknown) => {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'info'
  return 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAnnouncementList({
      keyword: filters.keyword,
      status: filters.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '获取公告列表失败')
      return
    }
    tableData.value = res.data.list
    pagination.total = res.data.total
    summary.value = res.data.summary
  } catch {
    ElMessage.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
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

const goPublish = (id?: number) => {
  if (typeof id === 'number') {
    void router.push({
      path: '/announcement/publish',
      query: { id: String(id) }
    })
    return
  }
  void router.push('/announcement/publish')
}

const goDetail = (id: number) => {
  void router.push(`/announcement/detail/${id}`)
}

const handlePublish = async (id: number) => {
  try {
    const res = await publishAnnouncement(id)
    if (res.code !== 200) {
      ElMessage.error(res.message || '发布失败')
      return
    }
    ElMessage.success('公告已发布')
    await fetchList()
  } catch {
    ElMessage.error('发布失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      '确认删除该公告吗？删除后不可恢复。',
      '删除确认',
      {
        type: 'warning'
      }
    )
  } catch {
    return
  }

  try {
    const res = await deleteAnnouncement(id)
    if (res.code !== 200) {
      ElMessage.error(res.message || '删除失败')
      return
    }
    ElMessage.success('删除成功')
    if (tableData.value.length <= 1 && pagination.page > 1) {
      pagination.page -= 1
    }
    await fetchList()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  void fetchList()
})
</script>

<style scoped lang="scss">
.announcement-list-page {
  min-height: calc(100vh - 64px);
  padding: 22px;
  background:
    radial-gradient(circle at 8% 10%, #e0f2f6 0%, transparent 34%),
    radial-gradient(circle at 90% 12%, #fcebd8 0%, transparent 30%), #f2f7fb;
}

.panel {
  border-radius: 18px;
  border: 1px solid #d6e4ec;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 36px rgba(17, 55, 74, 0.08);
}

.hero {
  padding: 20px 24px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f8f92 0%, #2a66d1 100%);
  color: #fff;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.hero h1 {
  margin: 10px 0 6px;
}

.hero p {
  margin: 0;
  color: #648091;
}

.stats-grid {
  margin-top: 12px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat {
  padding: 14px 16px;
}

.stat span {
  color: #6a8795;
  font-size: 12px;
}

.stat strong {
  margin-top: 8px;
  display: block;
  font-size: 30px;
  color: #1b3f51;
}

.table-panel {
  margin-top: 12px;
  padding: 14px;
}

.table-head {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .announcement-list-page {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
