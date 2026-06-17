<template>
  <PageShell>
    <template #hero>
      <PageHero
        badge="ANNOUNCEMENT"
        title="公告管理"
        description="查看公告发布数量、状态和阅读情况，支持快速跳转编辑与详情。"
      >
        <template #actions>
          <el-button type="primary" @click="goPublish()">发布新公告</el-button>
        </template>
      </PageHero>
    </template>

    <template #stats>
      <PageStatGrid>
        <PageStatCard label="公告总数" :value="summary.total" />
        <PageStatCard label="已发布" :value="summary.published" />
        <PageStatCard label="草稿" :value="summary.draft" />
      </PageStatGrid>
    </template>

    <PagePanel>
      <PageFilterBar>
        <template #filters>
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索标题/摘要/作者"
            style="width: 280px"
            @keyup.enter="search"
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
          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="reset">重置</el-button>
        </template>
        <template #extra>
          <el-button @click="refresh">刷新</el-button>
        </template>
      </PageFilterBar>

      <AppDataTable :data="list" border v-loading="loading">
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

      <div class="page-pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="refresh"
        />
      </div>
    </PagePanel>
  </PageShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  deleteAnnouncement,
  getAnnouncementList,
  publishAnnouncement,
  type AnnouncementListItem,
  type AnnouncementListResult,
  type AnnouncementStatus,
  type AnnouncementSummary
} from '@/services/announcement'

defineOptions({
  name: 'AnnouncementListPage'
})

const router = useRouter()

const defaultSummary = (): AnnouncementSummary => ({
  total: 0,
  draft: 0,
  published: 0
})

const summary = ref<AnnouncementSummary>(defaultSummary())

type AnnouncementFilters = {
  keyword: string
  status: AnnouncementStatus | ''
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
} = usePaginatedQuery<
  AnnouncementListItem,
  AnnouncementFilters,
  AnnouncementListResult
>({
  defaultFilters: {
    keyword: '',
    status: ''
  },
  errorMessage: '获取公告列表失败',
  fetcher: (query) => getAnnouncementList(query),
  onLoaded: (data) => {
    summary.value = data.summary
  }
})

const getStatusTagType = (status: unknown) => {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'info'
  return 'info'
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
    await publishAnnouncement(id)
    ElMessage.success('公告已发布')
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '发布失败'))
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
    await deleteAnnouncement(id)
    ElMessage.success('删除成功')
    adjustPageAfterDelete()
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '删除失败'))
  }
}
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
