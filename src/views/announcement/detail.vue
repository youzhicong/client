<template>
  <div class="announcement-detail-page">
    <header class="hero panel">
      <div class="hero-main">
        <span class="hero-badge">DETAIL</span>
        <h1>{{ detail.title || '公告详情' }}</h1>
        <p>{{ detail.summary || '查看公告完整内容与发布时间信息。' }}</p>
      </div>
      <div class="hero-actions">
        <el-button @click="goList">返回列表</el-button>
        <el-button type="primary" @click="goEdit">编辑公告</el-button>
      </div>
    </header>

    <section class="panel info-panel">
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
    </section>

    <section class="panel content-panel" v-loading="loading">
      <article
        class="content"
        v-html="detail.content || emptyContent"
      ></article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
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
    if (res.code !== 200) {
      ElMessage.error(res.message || '获取详情失败')
      return
    }
    Object.assign(detail, res.data)
  } catch {
    ElMessage.error('获取详情失败')
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
.announcement-detail-page {
  min-height: calc(100vh - 64px);
  padding: 22px;
  background:
    radial-gradient(circle at 12% 10%, #def3f5 0%, transparent 34%),
    radial-gradient(circle at 88% 12%, #fdecd9 0%, transparent 30%), #f3f8fc;
}

.panel {
  border-radius: 18px;
  border: 1px solid #d5e3eb;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 34px rgba(16, 53, 71, 0.08);
}

.hero {
  padding: 18px 22px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.hero-main h1 {
  margin: 10px 0 8px;
  color: #1a3f50;
}

.hero-main p {
  margin: 0;
  color: #6a8594;
}

.hero-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f8f92 0%, #2d69d2 100%);
  color: #fff;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.hero-actions {
  display: flex;
  gap: 10px;
}

.info-panel {
  margin-top: 12px;
  padding: 14px;
}

.content-panel {
  margin-top: 12px;
  padding: 20px;
}

.content {
  color: #264857;
  line-height: 1.8;
  font-size: 15px;
}

.content :deep(h2) {
  margin: 0 0 14px;
  font-size: 22px;
}

.content :deep(h3) {
  margin: 16px 0 10px;
  font-size: 18px;
}

.content :deep(p) {
  margin: 10px 0;
}

.content :deep(ul),
.content :deep(ol) {
  margin: 10px 0 10px 20px;
}

@media (max-width: 960px) {
  .announcement-detail-page {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
