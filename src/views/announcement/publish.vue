<template>
  <PageShell>
    <template #hero>
      <PageHero
        badge="EDITOR"
        :title="isEditMode ? '编辑公告' : '发布公告'"
        description="使用富文本编辑正文内容，支持先保存草稿再正式发布。"
      >
        <template #actions>
          <el-button @click="goList">返回列表</el-button>
        </template>
      </PageHero>
    </template>

    <PagePanel>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="88px"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告摘要" prop="summary">
          <el-input
            v-model="formData.summary"
            type="textarea"
            :rows="3"
            placeholder="用于列表页快速展示，建议 40-100 字"
          />
        </el-form-item>
        <el-form-item label="封面链接">
          <el-input v-model="formData.cover" placeholder="可选，填写图片 URL" />
        </el-form-item>
        <el-form-item label="正文内容" prop="content">
          <RichTextEditor v-model="formData.content" :min-height="360" />
        </el-form-item>
      </el-form>

      <div class="page-form-actions">
        <el-button :loading="submitting" @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" :loading="submitting" @click="publishNow">
          立即发布
        </el-button>
      </div>
    </PagePanel>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import PageHero from '@/components/page/PageHero.vue'
import PagePanel from '@/components/page/PagePanel.vue'
import PageShell from '@/components/page/PageShell.vue'
import { useUserStore } from '@/stores'
import { getApiErrorMessage } from '@/utils/request'
import {
  createAnnouncement,
  getAnnouncementDetail,
  publishAnnouncement,
  updateAnnouncement
} from '@/services/announcement'
import RichTextEditor from './components/RichTextEditor.vue'

defineOptions({
  name: 'AnnouncementPublishPage'
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const resolveAuthor = () => {
  const user = userStore.user
  const candidates = [user?.name, user?.username, user?.nickname, user?.account]
  const named = candidates.find(
    (item: unknown) => typeof item === 'string' && item.trim()
  )
  return named ? String(named) : '系统用户'
}

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formData = reactive({
  title: '',
  summary: '',
  cover: '',
  content: ''
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  summary: [{ required: true, message: '请输入公告摘要', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告正文', trigger: 'blur' }]
}

const editId = computed(() => {
  const raw = route.query.id
  const next = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(next) && next > 0 ? next : null
})

const isEditMode = computed(() => typeof editId.value === 'number')

const goList = () => {
  void router.push('/announcement/list')
}

const validateForm = async () => {
  if (!formRef.value) return false
  return !!(await formRef.value.validate().catch(() => false))
}

const loadDetail = async (id: number) => {
  try {
    const res = await getAnnouncementDetail(id)
    formData.title = res.data.title
    formData.summary = res.data.summary
    formData.cover = res.data.cover
    formData.content = res.data.content
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '获取公告详情失败'))
  }
}

const save = async () => {
  const valid = await validateForm()
  if (!valid) return null

  const payload = {
    title: formData.title,
    summary: formData.summary,
    cover: formData.cover,
    content: formData.content,
    author: resolveAuthor()
  }

  if (typeof editId.value === 'number') {
    const res = await updateAnnouncement({
      id: editId.value,
      ...payload
    })
    return res.data
  }

  const res = await createAnnouncement(payload)
  return res.data
}

const saveDraft = async () => {
  submitting.value = true
  try {
    const data = await save()
    if (!data) return
    ElMessage.success('草稿已保存')
    if (!isEditMode.value) {
      void router.replace({
        path: '/announcement/publish',
        query: { id: String(data.id) }
      })
    }
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '保存失败'))
  } finally {
    submitting.value = false
  }
}

const publishNow = async () => {
  submitting.value = true
  try {
    const data = await save()
    if (!data) return
    await publishAnnouncement(data.id)
    ElMessage.success('公告发布成功')
    void router.push('/announcement/list')
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '发布失败'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (typeof editId.value === 'number') {
    void loadDetail(editId.value)
  }
})
</script>

<style scoped lang="scss">
@use '@/style/page-shell.scss';
</style>
