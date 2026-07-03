<template>
  <div class="ai-settings-page ai-agent-shell">
    <AgentStudioHeader title="" description="" active="settings" compact />

    <header class="platform-hero settings-hero">
      <div class="platform-hero-inner">
        <div>
          <span class="platform-kicker">Model Settings</span>
          <h2>模型配置</h2>
          <p>统一配置工作流与聊天共用的 API Key、模型与兼容接口</p>
        </div>
        <div class="platform-hero-actions">
          <div class="platform-hero-stat">
            <strong>{{ isConfigured ? '✓' : '—' }}</strong>
            <span>{{ isConfigured ? '已就绪' : '待配置' }}</span>
          </div>
          <div class="platform-hero-stat">
            <strong>{{ settings.model || '—' }}</strong>
            <span>当前模型</span>
          </div>
        </div>
      </div>
    </header>

    <div class="ai-agent-settings-layout studio-workspace">
      <section
        class="ai-agent-panel ai-agent-settings-main studio-workspace-main"
      >
        <div class="ai-agent-panel-head">
          <strong>连接配置</strong>
          <span>保存后聊天与工作流共用</span>
        </div>

        <div class="form-group">
          <label>选择服务商</label>
          <div class="provider-grid">
            <button
              v-for="provider in providers"
              :key="provider.id"
              type="button"
              class="provider-card"
              :class="{ active: settings.provider === provider.id }"
              @click="selectProvider(provider)"
            >
              <span class="provider-icon">{{ provider.icon }}</span>
              <span class="provider-name">{{ provider.name }}</span>
              <span v-if="provider.free" class="free-tag">免费额度</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>API 地址</label>
          <input
            v-model="settings.baseUrl"
            type="text"
            class="form-input"
            placeholder="https://api.example.com/v1"
          />
          <span class="form-hint">
            {{
              currentProvider?.hint ||
              '支持 OpenAI 兼容地址，保存时会自动规范化。'
            }}
          </span>
          <span v-if="resolvedEndpoint" class="form-hint endpoint-hint">
            实际接口：{{ resolvedEndpoint }}
          </span>
        </div>

        <div class="form-group">
          <label>API Key</label>
          <div class="key-input-wrapper">
            <input
              v-model="settings.apiKey"
              :type="showKey ? 'text' : 'password'"
              class="form-input"
              placeholder="sk-xxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              class="toggle-btn"
              @click="showKey = !showKey"
            >
              <el-icon><component :is="showKey ? Hide : View" /></el-icon>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>模型名称</label>
          <input
            v-model="settings.model"
            list="model-options"
            type="text"
            class="form-input"
            placeholder="输入或选择模型名"
          />
          <datalist id="model-options">
            <option
              v-for="model in currentModels"
              :key="model.id"
              :value="model.id"
            >
              {{ model.name }}
            </option>
          </datalist>
        </div>

        <div class="form-actions">
          <button
            class="ai-agent-btn-primary"
            type="button"
            @click="handleSaveSettings"
          >
            保存设置
          </button>
          <button
            class="ai-agent-btn-ghost"
            type="button"
            :disabled="testing"
            @click="handleTestConnection"
          >
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <button
            class="ai-agent-icon-btn"
            type="button"
            @click="resetSettings"
          >
            重置
          </button>
        </div>

        <div
          v-if="testResult"
          class="test-result"
          :class="testResult.success ? 'success' : 'error'"
        >
          <el-icon
            ><component :is="testResult.success ? CircleCheck : CircleClose"
          /></el-icon>
          <span>{{ testResult.message }}</span>
        </div>
      </section>

      <aside
        class="ai-agent-panel ai-agent-settings-help studio-workspace-side"
      >
        <div class="settings-status-card" :class="{ ready: isConfigured }">
          <div class="settings-status-head">
            <span class="settings-status-dot"></span>
            <strong>{{ isConfigured ? '配置完整' : '待完善配置' }}</strong>
          </div>
          <div class="settings-status-row">
            <span>Provider</span>
            <strong>{{ settings.provider || 'custom' }}</strong>
          </div>
          <div class="settings-status-row">
            <span>Model</span>
            <strong>{{ settings.model || '未设置' }}</strong>
          </div>
          <div class="settings-status-actions">
            <button
              type="button"
              @click="router.push('/ai/workflow?q=咖啡&run=1')"
            >
              一键体验示例工作流
            </button>
            <button type="button" @click="router.push('/ai/chat')">
              去 Agent 聊天
            </button>
          </div>
        </div>

        <div class="ai-agent-panel-head">
          <strong>接入说明</strong>
          <span>常用服务商</span>
        </div>
        <div class="help-cards">
          <div class="help-card">
            <h4>LongCat</h4>
            <p>Base URL: <code>https://api.longcat.chat/openai</code></p>
            <p>模型建议：<code>LongCat-Flash-Chat</code></p>
          </div>
          <div class="help-card">
            <h4>DeepSeek</h4>
            <p>
              控制台：
              <a href="https://platform.deepseek.com" target="_blank"
                >platform.deepseek.com</a
              >
            </p>
          </div>
          <div class="help-card">
            <h4>通义千问</h4>
            <p>
              控制台：
              <a href="https://dashscope.aliyun.com" target="_blank"
                >dashscope.aliyun.com</a
              >
            </p>
          </div>
          <div class="help-card">
            <h4>智谱 GLM</h4>
            <p>
              控制台：
              <a href="https://open.bigmodel.cn" target="_blank"
                >open.bigmodel.cn</a
              >
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose, Hide, View } from '@element-plus/icons-vue'
import AgentStudioHeader from '@/components/agent/AgentStudioHeader.vue'
import {
  AI_PROVIDERS,
  getAIChatEndpoint,
  getAIProviderById,
  getAISettings,
  normalizeAISettings,
  saveAISettings,
  testAIConnection,
  type AIProviderOption,
  type AISettings
} from '@/services/ai'

defineOptions({
  name: 'AiWorkflowSettingsPage'
})

const router = useRouter()
const showKey = ref(false)
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const providers = AI_PROVIDERS

const settings = ref<AISettings>({
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat'
})

const currentProvider = computed(() =>
  getAIProviderById(settings.value.provider)
)
const currentModels = computed(() => currentProvider.value?.models || [])
const resolvedEndpoint = computed(() => getAIChatEndpoint(settings.value))
const isConfigured = computed(() =>
  Boolean(
    settings.value.apiKey && settings.value.model && settings.value.baseUrl
  )
)

onMounted(() => {
  settings.value = getAISettings()
})

const applyNormalizedSettings = () => {
  const normalized = normalizeAISettings(settings.value)
  settings.value = { ...normalized }
  return normalized
}

const selectProvider = (provider: AIProviderOption) => {
  settings.value.provider = provider.id
  settings.value.baseUrl = provider.baseUrl

  const [firstModel] = provider.models
  if (firstModel) {
    settings.value.model = firstModel.id
  } else {
    settings.value.model = ''
  }

  testResult.value = null
}

const handleSaveSettings = () => {
  const normalized = applyNormalizedSettings()

  if (!normalized.apiKey) {
    ElMessage.warning('请输入 API Key')
    return
  }

  if (!normalized.model) {
    ElMessage.warning('请输入模型名称')
    return
  }

  saveAISettings(normalized)
  ElMessage.success('设置已保存，可点击右侧「一键体验示例工作流」')
}

const handleTestConnection = async () => {
  const normalized = applyNormalizedSettings()

  if (!normalized.apiKey) {
    ElMessage.warning('请先输入 API Key')
    return
  }

  if (!normalized.model) {
    ElMessage.warning('请先输入模型名称')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const result = await testAIConnection(normalized)
    testResult.value = result

    if (result.success) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    testing.value = false
  }
}

const resetSettings = () => {
  settings.value = getAISettings()
  testResult.value = null
  localStorage.removeItem('ai-settings')
  settings.value = {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-chat'
  }
  ElMessage.success('设置已重置')
}
</script>

<style lang="scss" scoped>
@use '@/style/ai-agent-page.scss';
@use '@/style/studio-workspace.scss';
@use '@/style/platform-page.scss';

.ai-settings-page {
  background: transparent;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 16px;
  box-sizing: border-box;

  :deep(.ai-agent-studio-head) {
    flex-shrink: 0;
    margin-bottom: 0;
  }
}

.settings-hero {
  flex-shrink: 0;
  margin-bottom: 0;
}

.ai-agent-settings-layout {
  flex: 1;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 22vw);
  gap: 0;
  align-content: stretch;
}

.ai-agent-settings-main {
  min-height: 0;
  overflow-y: auto;
  border-right: none;
  border-radius: 0;
  box-shadow: none;
  padding: 18px 20px 22px;
}

.ai-agent-settings-help {
  min-height: 0;
  overflow-y: auto;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.settings-status-card {
  padding: 14px;
  border-radius: 12px;
  background: var(--app-surface);
  border: 1px solid rgba(217, 119, 6, 0.18);

  &.ready {
    border-color: rgba(22, 163, 74, 0.2);
  }
}

.settings-status-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  strong {
    font-size: 13px;
    color: var(--app-text-main);
  }
}

.settings-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-warning);
}

.settings-status-card.ready .settings-status-dot {
  background: var(--app-success);
}

.settings-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;

  & + & {
    border-top: 1px dashed var(--app-border);
  }

  span {
    color: var(--app-text-faint);
  }

  strong {
    color: var(--app-text-main);
    font-weight: 600;
    word-break: break-all;
    text-align: right;
  }
}

.settings-status-actions {
  display: grid;
  gap: 8px;
  margin-top: 12px;

  button {
    padding: 8px 10px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 8px;
    background: transparent;
    color: var(--app-text-sub);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      border-color: var(--app-accent-muted);
      background: var(--app-accent-soft);
      color: var(--app-accent);
    }
  }
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--app-text-main);
  }
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}

.provider-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-muted);
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: var(--app-accent-muted);
    transform: translateY(-1px);
  }

  &.active {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
    box-shadow: inset 0 0 0 1px var(--app-accent-muted);
  }
}

.provider-icon {
  font-size: 24px;
}

.provider-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--app-text-sub);
  text-align: center;
}

.free-tag {
  position: absolute;
  top: -6px;
  right: -4px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--app-success);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}

.form-input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-muted);
  color: var(--app-text-main);
  font-size: 14px;
  transition: all 0.18s ease;

  &:focus {
    outline: none;
    border-color: var(--app-accent-muted);
    box-shadow: var(--app-search-focus-shadow);
    background: var(--app-surface);
  }
}

.key-input-wrapper {
  display: flex;
  gap: 8px;

  .form-input {
    flex: 1;
  }
}

.toggle-btn {
  width: 44px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--app-text-sub);
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--app-text-faint);
  line-height: 1.5;
}

.endpoint-hint {
  color: var(--app-accent);
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;

  &.success {
    background: rgba(22, 163, 74, 0.08);
    border: 1px solid rgba(22, 163, 74, 0.14);
    color: var(--app-success);
  }

  &.error {
    background: rgba(220, 38, 38, 0.08);
    border: 1px solid rgba(220, 38, 38, 0.14);
    color: var(--app-danger);
  }
}

.help-cards {
  display: grid;
  gap: 10px;
}

.help-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);

  h4 {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--app-text-main);
  }

  p {
    margin: 0 0 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--app-text-sub);
  }

  code {
    font-family: var(--app-font-mono);
    font-size: 11px;
  }

  a {
    color: var(--app-accent);
  }
}

@media (max-width: 1024px) {
  .ai-agent-settings-layout {
    grid-template-columns: 1fr;
  }
}
</style>
