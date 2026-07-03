<template>
  <AgentPlatformPage title="" description="" active="prompts">
    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">Prompt Engineering</span>
          <h2>Prompt 工程</h2>
          <p>模板管理、变量占位与版本保存 · 一键用于 Agent 聊天</p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ prompts.length }}</strong>
            <span>已保存</span>
          </div>
          <router-link to="/ai/chat" class="platform-btn-ghost"
            >打开聊天</router-link
          >
        </div>
      </div>
    </header>

    <div class="platform-workbench prompts-layout">
      <section class="platform-panel editor-panel">
        <div class="studio-side-head">
          <strong>{{ form.id ? '编辑模板' : '新建模板' }}</strong>
          <span>支持 &#123;&#123;变量&#125;&#125; 占位</span>
        </div>
        <div class="editor platform-form">
          <input v-model="form.name" placeholder="模板名称" />
          <input v-model="tagInput" placeholder="标签，逗号分隔" />
          <textarea
            v-model="form.content"
            rows="10"
            placeholder="Prompt 模板内容…"
          />
          <div class="actions">
            <button
              type="button"
              class="platform-btn-primary"
              @click="handleSave"
            >
              {{ form.id ? '更新模板' : '保存模板' }}
            </button>
            <button
              v-if="form.id"
              type="button"
              class="platform-btn-ghost"
              @click="resetForm"
            >
              新建
            </button>
          </div>
        </div>
      </section>

      <section class="platform-panel list-panel">
        <div class="studio-side-head">
          <strong>已保存模板</strong>
          <span>{{ prompts.length }} 个</span>
        </div>
        <div class="prompt-list">
          <article
            v-for="item in prompts"
            :key="item.id"
            class="prompt-card platform-card"
          >
            <div class="prompt-head">
              <strong>{{ item.name }}</strong>
              <span>{{ formatTime(item.updatedAt) }}</span>
            </div>
            <p v-if="item.tags.length" class="tags">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="platform-pill type"
                >{{ tag }}</span
              >
            </p>
            <pre>{{ item.content }}</pre>
            <div class="card-actions">
              <button
                type="button"
                class="platform-btn-ghost"
                @click="editPrompt(item)"
              >
                编辑
              </button>
              <button
                type="button"
                class="platform-btn-primary"
                @click="useInChat(item.content)"
              >
                用于聊天
              </button>
              <button
                type="button"
                class="platform-btn-ghost"
                @click="copyPrompt(item.content)"
              >
                复制
              </button>
              <button
                type="button"
                class="btn-danger"
                @click="removePrompt(item.id)"
              >
                删除
              </button>
            </div>
          </article>
          <div v-if="!prompts.length" class="platform-empty">
            <div class="empty-icon">✍️</div>
            <p>暂无模板，在左侧创建第一个 Prompt</p>
          </div>
        </div>
      </section>
    </div>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import {
  deletePromptTemplate,
  getPromptTemplates,
  savePromptTemplate,
  type PromptTemplate
} from '@/services/ai-platform-store'

const prompts = ref<PromptTemplate[]>([])
const router = useRouter()
const tagInput = ref('')
const form = ref({ id: '', name: '', content: '' })

const refresh = () => {
  prompts.value = getPromptTemplates()
}

const resetForm = () => {
  form.value = { id: '', name: '', content: '' }
  tagInput.value = ''
}

const handleSave = () => {
  if (!form.value.content.trim()) {
    ElMessage.warning('请填写 Prompt 内容')
    return
  }
  savePromptTemplate({
    id: form.value.id || undefined,
    name: form.value.name || '未命名模板',
    content: form.value.content,
    tags: tagInput.value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
  })
  refresh()
  resetForm()
  ElMessage.success('模板已保存')
}

const editPrompt = (item: PromptTemplate) => {
  form.value = { id: item.id, name: item.name, content: item.content }
  tagInput.value = item.tags.join(', ')
}

const removePrompt = (id: string) => {
  deletePromptTemplate(id)
  refresh()
  ElMessage.success('已删除')
}

const copyPrompt = async (content: string) => {
  await navigator.clipboard.writeText(content)
  ElMessage.success('已复制')
}

const useInChat = (content: string) => {
  void router.push({
    path: '/ai/chat',
    query: { q: content.slice(0, 500) }
  })
}

const formatTime = (value: number) =>
  new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

onMounted(refresh)
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.prompts-layout {
  align-items: stretch;
}

.editor-panel,
.list-panel {
  min-height: 420px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.prompt-list {
  display: grid;
  gap: 12px;
  max-height: 520px;
  overflow-y: auto;
}

.prompt-card {
  pre {
    margin: 10px 0;
    padding: 12px;
    border-radius: 10px;
    background: var(--app-surface-muted);
    white-space: pre-wrap;
    font-size: 12px;
    line-height: 1.6;
    color: var(--app-text-sub);
    max-height: 160px;
    overflow: auto;
  }
}

.prompt-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;

  strong {
    font-size: 15px;
    color: var(--app-text-main);
  }

  span {
    font-size: 11px;
    color: var(--app-text-faint);
    white-space: nowrap;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-danger {
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
