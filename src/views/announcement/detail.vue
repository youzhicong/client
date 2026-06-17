<template>
  <PageShell>
    <template #hero>
      <PageHero
        badge="DETAIL"
        :title="detail.title || '公告详情'"
        :description="detail.summary || '查看公告完整内容与发布时间信息。'"
      >
        <template #actions>
          <el-button @click="goList">返回列表</el-button>
          <el-button type="primary" @click="goEdit">编辑公告</el-button>
        </template>
      </PageHero>
    </template>

    <PagePanel>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="作者">{{
          detail.author || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === 'published' ? 'success' : 'info'">
            {{ detail.statusLabel || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="阅读量">{{
          detail.viewCount || 0
        }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">
          {{ detail.publishedAt || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </PagePanel>

    <PagePanel v-loading="loading">
      <div
        class="page-article-content"
        v-html="detail.content || emptyContent"
      ></div>
    </PagePanel>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import PageHero from '@/components/page/PageHero.vue'
import PagePanel from '@/components/page/PagePanel.vue'
import PageShell from '@/components/page/PageShell.vue'
import { getApiErrorMessage } from '@/utils/request'
import {
  getAnnouncementDetail,
  type AnnouncementItem
} from '@/services/announcement'

defineOptions({
  name: 'AnnouncementDetailPage'
})

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const emptyContent = '<p>暂无正文内容</p>'

const detail = reactive<AnnouncementItem>({
  id: 0,
  title: '',
  summary: '',
  content: '',
  cover: '',
  author: '',
  status: 'draft',
  statusLabel: '',
  viewCount: 0,
  createdAt: '',
  updatedAt: '',
  publishedAt: ''
})

const resolveId = () => {
  const id = Number(route.params.id)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

const fetchDetail = async () => {
  const id = resolveId()
  if (!id) {
    ElMessage.error('公告 ID 无效')
    return
  }

  loading.value = true
  try {
    const res = await getAnnouncementDetail(id)
    Object.assign(detail, res.data)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '获取详情失败'))
  } finally {
    loading.value = false
  }
}

const goList = () => {
  void router.push('/announcement/list')
}

const goEdit = () => {
  if (!detail.id) return
  void router.push({
    path: '/announcement/publish',
    query: { id: String(detail.id) }
  })
}

onMounted(() => {
  void fetchDetail()
})
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
