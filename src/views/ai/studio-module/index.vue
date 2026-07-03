<template>
  <AgentPlatformPage title="" description="" :active="moduleKey">
    <section class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">{{ moduleMeta?.label }}</span>
          <h2>{{ pageTitle }}</h2>
          <p>{{ pageDesc }}</p>
        </div>
      </div>
    </section>

    <div v-if="moduleKey === 'dashboard'" class="platform-grid">
      <div
        v-for="card in dashCards"
        :key="card.label"
        class="platform-stat-card"
      >
        <span class="platform-stat-label">{{ card.label }}</span>
        <strong class="platform-stat-value">{{ card.value }}</strong>
        <p>{{ card.desc }}</p>
      </div>
    </div>

    <div v-else-if="moduleKey === 'apps'" class="platform-list">
      <router-link
        v-for="app in apps"
        :key="app.path"
        :to="app.path"
        class="platform-list-item"
      >
        <span class="platform-list-icon">🚀</span>
        <div class="platform-list-copy">
          <strong>{{ app.name }}</strong>
          <p>{{ app.type }} 应用</p>
        </div>
        <span class="platform-pill type">{{ app.type }}</span>
      </router-link>
    </div>

    <div v-else-if="moduleKey === 'knowledge'" class="platform-workbench">
      <div class="platform-panel">
        <div class="platform-toolbar">
          <input v-model="kbName" placeholder="新建知识库名称" />
          <button type="button" class="platform-btn-primary" @click="addKb">
            创建
          </button>
        </div>
        <div class="platform-list">
          <div v-for="kb in kbs" :key="kb.id" class="platform-list-item">
            <span class="platform-list-icon">📚</span>
            <div class="platform-list-copy">
              <strong>{{ kb.name }}</strong>
              <p>{{ kb.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="moduleKey === 'prompts'"
      class="platform-panel platform-stack"
    >
      <textarea v-model="promptDraft" rows="6" placeholder="Prompt 模板" />
      <div class="platform-list">
        <div v-for="p in prompts" :key="p" class="platform-list-item">
          <div class="platform-list-copy">
            <pre>{{ p }}</pre>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="moduleKey === 'tools'" class="platform-list">
      <div v-for="tool in tools" :key="tool.name" class="platform-list-item">
        <span class="platform-list-icon">🔧</span>
        <div class="platform-list-copy">
          <strong>{{ tool.name }}</strong>
          <p>{{ tool.description }}</p>
        </div>
      </div>
    </div>

    <div
      v-else-if="moduleKey === 'playground'"
      class="platform-panel platform-stack"
    >
      <textarea v-model="pgPrompt" rows="4" placeholder="输入对比 Prompt" />
      <div class="platform-toolbar">
        <button
          type="button"
          class="platform-btn-primary"
          :disabled="pgRunning"
          @click="runPg"
        >
          {{ pgRunning ? '运行中…' : '对比运行' }}
        </button>
      </div>
      <pre v-if="pgOutput" class="platform-code">{{ pgOutput }}</pre>
    </div>

    <div v-else-if="moduleKey === 'observability'" class="platform-list">
      <div v-for="log in obsLogs" :key="log.id" class="platform-list-item">
        <span class="platform-list-icon">📈</span>
        <div class="platform-list-copy">
          <strong>{{ log.title }}</strong>
          <div class="platform-list-meta">
            <span>{{ log.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="moduleKey === 'api'" class="platform-panel platform-stack">
      <div class="platform-list-item">
        <div class="platform-list-copy">
          <strong>Endpoint</strong>
          <code class="platform-code-inline">{{ apiEndpoint }}</code>
        </div>
      </div>
      <pre class="platform-code">{{ apiSample }}</pre>
    </div>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import { aiPlatformModules, type AiModuleKey } from '@/config/ai-platform'
import { chatAgentTools } from '@/services/ai-agent/tools'
import {
  chatWithAI,
  getAIChatEndpoint,
  getAISettings,
  getHistory,
  normalizeAISettings
} from '@/services/ai'

const route = useRoute()
const moduleKey = computed(
  () => String(route.meta.moduleKey || 'dashboard') as AiModuleKey
)
const moduleMeta = computed(
  () =>
    aiPlatformModules.find((m) => m.key === moduleKey.value) ||
    aiPlatformModules[0]
)
const pageTitle = computed(() => moduleMeta.value?.label || '模块')
const pageDesc = computed(() => moduleMeta.value?.desc || '')
const dashCards = computed(() => [
  {
    label: '模块',
    value: String(aiPlatformModules.length),
    desc: 'AI 平台能力'
  },
  { label: '工作流', value: String(getHistory().length), desc: '历史任务' }
])
const apps = [
  { name: '产品策划助手', type: 'Workflow', path: '/ai/workflow' },
  { name: '通用 Agent', type: 'Chat', path: '/ai/chat' }
]
const kbs = ref([{ id: '1', name: '产品文档', desc: 'FlowAgent 模块说明' }])
const kbName = ref('')
const addKb = () => {
  if (!kbName.value.trim()) return
  kbs.value.unshift({
    id: String(Date.now()),
    name: kbName.value.trim(),
    desc: '新建库'
  })
  kbName.value = ''
  ElMessage.success('已创建')
}
const prompts = ['请拆解需求', 'Review 代码']
const promptDraft = ref('')
const tools = chatAgentTools
const pgPrompt = ref('解释 RAG')
const pgOutput = ref('')
const pgRunning = ref(false)
const runPg = async () => {
  pgRunning.value = true
  try {
    pgOutput.value = await chatWithAI(
      [{ role: 'user', content: pgPrompt.value }],
      { maxTokens: 300 }
    )
  } catch (e) {
    pgOutput.value = e instanceof Error ? e.message : '失败'
  } finally {
    pgRunning.value = false
  }
}
const obsLogs = ref<{ id: string; title: string; time: string }[]>([])
onMounted(() => {
  obsLogs.value = getHistory()
    .slice(0, 6)
    .map((h) => ({
      id: String(h.timestamp),
      title: h.keyword,
      time: new Date(h.timestamp).toLocaleString('zh-CN')
    }))
})
const apiEndpoint = computed(
  () =>
    getAIChatEndpoint(normalizeAISettings(getAISettings())) || '请先配置模型'
)
const apiSample =
  '{"model":"your-model","messages":[{"role":"user","content":"hi"}]}'
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.platform-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.platform-stat-card {
  padding: 16px 18px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-muted);

  p {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--app-text-sub);
  }
}

.platform-stat-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--app-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.platform-stat-value {
  display: block;
  margin-top: 6px;
  font-size: 28px;
  font-weight: 800;
  color: var(--app-text-main);
}

.platform-stack {
  display: grid;
  gap: 12px;
}

.platform-stack textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text-main);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
}

.platform-code {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--app-text-sub);
}

.platform-code-inline {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--app-accent);
}

a.platform-list-item {
  text-decoration: none;
  color: inherit;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 12px;
}

@media (max-width: 640px) {
  .platform-grid {
    grid-template-columns: 1fr;
  }
}
</style>
