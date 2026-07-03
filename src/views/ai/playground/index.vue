<template>
  <AgentPlatformPage title="" description="" active="playground">
    <header class="platform-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">Model Playground</span>
          <h2>模型 Playground</h2>
          <p>同一 Prompt 对比主模型与备用模型输出，快速验证效果</p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ isConfigured ? '✓' : '—' }}</strong>
            <span>模型就绪</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ primaryModel || '—' }}</strong>
            <span>主模型</span>
          </div>
        </div>
      </div>
    </header>

    <div v-if="!isConfigured" class="platform-hint-banner warn">
      <span>请先在模型配置页填写 API Key 与模型名称</span>
      <router-link to="/ai/settings">去配置 →</router-link>
    </div>

    <div class="platform-panel playground-editor">
      <div class="studio-side-head">
        <strong>测试 Prompt</strong>
        <span>对比运行会写入 Trace</span>
      </div>
      <textarea v-model="prompt" rows="5" placeholder="输入测试 Prompt…" />
      <div class="playground-row">
        <label class="alt-model">
          <span>备用模型（可选）</span>
          <input v-model="altModel" placeholder="留空则与主模型相同" />
        </label>
        <button
          type="button"
          class="platform-btn-primary"
          :disabled="running || !isConfigured"
          @click="runCompare"
        >
          {{ running ? '运行中…' : '对比运行' }}
        </button>
      </div>
      <div v-if="primaryOutput || altOutput" class="result-actions">
        <button type="button" class="platform-btn-ghost" @click="saveAsPrompt">
          保存为 Prompt
        </button>
        <button type="button" class="platform-btn-ghost" @click="sendToChat">
          发送到聊天
        </button>
        <button type="button" class="platform-btn-ghost" @click="copyPrimary">
          复制主模型输出
        </button>
      </div>
    </div>

    <div class="compare-grid">
      <article class="result-card platform-panel">
        <div class="result-head">
          <span class="result-icon primary">A</span>
          <div>
            <strong>主模型</strong>
            <span>{{ primaryModel }}</span>
          </div>
        </div>
        <pre>{{ primaryOutput || '等待运行…' }}</pre>
      </article>
      <article class="result-card platform-panel">
        <div class="result-head">
          <span class="result-icon alt">B</span>
          <div>
            <strong>对比模型</strong>
            <span>{{ altModel || primaryModel || '—' }}</span>
          </div>
        </div>
        <pre>{{ altOutput || '等待运行…' }}</pre>
      </article>
    </div>
  </AgentPlatformPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AgentPlatformPage from '@/components/agent/AgentPlatformPage.vue'
import {
  appendPlatformTrace,
  savePromptTemplate
} from '@/services/ai-platform-store'
import {
  chatWithAI,
  getAISettings,
  normalizeAISettings,
  type AISettings
} from '@/services/ai'

const router = useRouter()
const prompt = ref('用三句话解释 RAG 检索增强生成')
const altModel = ref('')
const primaryOutput = ref('')
const altOutput = ref('')
const running = ref(false)

const settings = computed(() => normalizeAISettings(getAISettings()))
const isConfigured = computed(() =>
  Boolean(settings.value.apiKey && settings.value.model)
)
const primaryModel = computed(() => settings.value.model)

const callModel = async (modelSettings: AISettings) => {
  const started = Date.now()
  const reply = await chatWithAI(
    [{ role: 'user', content: prompt.value.trim() }],
    {
      temperature: 0.5,
      maxTokens: 600
    }
  )
  appendPlatformTrace({
    type: 'playground',
    title: `Playground · ${modelSettings.model}`,
    detail: prompt.value.slice(0, 80),
    status: 'success',
    durationMs: Date.now() - started,
    sourcePath: '/ai/playground'
  })
  return reply
}

const runCompare = async () => {
  if (!prompt.value.trim()) {
    ElMessage.warning('请输入 Prompt')
    return
  }
  if (!isConfigured.value) {
    ElMessage.warning('请先配置模型')
    return
  }

  running.value = true
  primaryOutput.value = ''
  altOutput.value = ''

  try {
    primaryOutput.value = await callModel(settings.value)
    if (
      altModel.value.trim() &&
      altModel.value.trim() !== settings.value.model
    ) {
      altOutput.value = await callModel({
        ...settings.value,
        model: altModel.value.trim()
      })
    } else {
      altOutput.value = primaryOutput.value
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '运行失败')
  } finally {
    running.value = false
  }
}

const saveAsPrompt = () => {
  if (!prompt.value.trim()) return
  savePromptTemplate({
    name: `Playground · ${new Date().toLocaleDateString('zh-CN')}`,
    content: prompt.value.trim(),
    tags: ['playground']
  })
  ElMessage.success('已保存到 Prompt 工程')
}

const sendToChat = () => {
  void router.push({
    path: '/ai/chat',
    query: { send: '1', q: prompt.value.trim() }
  })
}

const copyPrimary = async () => {
  if (!primaryOutput.value) return
  await navigator.clipboard.writeText(primaryOutput.value)
  ElMessage.success('已复制主模型输出')
}
</script>

<style scoped lang="scss">
@use '@/style/platform-page.scss';

.platform-hint-banner.warn {
  border-color: rgba(217, 119, 6, 0.22);
  background: linear-gradient(135deg, #fffbeb 0%, var(--app-surface) 100%);
}

.playground-editor {
  margin-bottom: 14px;

  textarea,
  input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--app-border);
    background: var(--app-surface-muted);
    font-size: 14px;
    font-family: inherit;
    line-height: 1.6;

    &:focus {
      outline: none;
      border-color: var(--app-accent-muted);
      box-shadow: var(--app-search-focus-shadow);
    }
  }

  textarea {
    margin-bottom: 12px;
    resize: vertical;
  }
}

.playground-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.alt-model {
  flex: 1;
  min-width: 200px;

  span {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--app-text-faint);
    font-weight: 600;
  }
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--app-border);
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.result-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  strong {
    display: block;
    font-size: 14px;
    color: var(--app-text-main);
  }

  span {
    font-size: 11px;
    color: var(--app-text-faint);
  }
}

.result-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  color: #fff;

  &.primary {
    background: linear-gradient(
      135deg,
      var(--app-accent),
      var(--app-secondary)
    );
  }

  &.alt {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
  }
}

.result-card pre {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: var(--app-surface-muted);
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.65;
  color: var(--app-text-sub);
  max-height: 420px;
  overflow: auto;
}

@media (max-width: 960px) {
  .compare-grid {
    grid-template-columns: 1fr;
  }

  .playground-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
