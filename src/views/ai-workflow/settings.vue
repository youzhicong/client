<template>
  <div class="settings-page">
    <div class="settings-header">
      <div class="header-content">
        <h1>⚙️ AI 设置</h1>
        <p>统一配置工作流和聊天模块共用的模型、API Key 与兼容接口。</p>
      </div>
      <router-link to="/ai/chat" class="chat-entry">打开聊天模块</router-link>
    </div>

    <div class="settings-form">
      <div class="form-group">
        <label>选择服务商</label>
        <div class="provider-grid">
          <div
            v-for="provider in providers"
            :key="provider.id"
            class="provider-card"
            :class="{ active: settings.provider === provider.id }"
            @click="selectProvider(provider)"
          >
            <span class="provider-icon">{{ provider.icon }}</span>
            <span class="provider-name">{{ provider.name }}</span>
            <span v-if="provider.free" class="free-tag">有免费额度</span>
          </div>
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
            '支持填写 OpenAI 兼容地址，保存时会自动规范化。'
          }}
        </span>
        <span v-if="resolvedEndpoint" class="form-hint endpoint-hint">
          实际测试接口：{{ resolvedEndpoint }}
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
          <button type="button" class="toggle-btn" @click="showKey = !showKey">
            {{ showKey ? '🙈' : '👁️' }}
          </button>
        </div>
        <span class="form-hint">请前往服务商控制台获取 API Key。</span>
      </div>

      <div class="form-group">
        <label>模型名称</label>
        <input
          v-model="settings.model"
          list="model-options"
          type="text"
          class="form-input"
          placeholder="输入模型名，或从建议列表中选择"
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
        <span class="form-hint">
          可直接手填模型名。LongCat 建议从 `LongCat-Flash-Chat` 开始测试。
        </span>
      </div>

      <div class="form-actions">
        <button class="save-btn" @click="handleSaveSettings">
          <span>💾</span> 保存设置
        </button>
        <button class="test-btn" @click="handleTestConnection">
          <span v-if="!testing">🔗</span>
          <span v-else class="spin">⏳</span>
          {{ testing ? '测试中...' : '测试连接' }}
        </button>
        <button class="reset-btn" @click="resetSettings">
          <span>🔄</span> 重置
        </button>
      </div>

      <div
        v-if="testResult"
        class="test-result"
        :class="testResult.success ? 'success' : 'error'"
      >
        <span class="result-icon">{{ testResult.success ? '✅' : '❌' }}</span>
        <span class="result-text">{{ testResult.message }}</span>
      </div>
    </div>

    <div class="help-section">
      <h3>📖 接入说明</h3>
      <div class="help-cards">
        <div class="help-card">
          <h4>🟠 LongCat</h4>
          <ol>
            <li>
              获取 key 后直接选择 `LongCat`，或手填
              <code>https://api.longcat.chat/openai</code>
            </li>
            <li>模型建议先用 `LongCat-Flash-Chat`</li>
            <li>测试连接会自动请求 `/openai/v1/chat/completions`</li>
            <li>
              文档：
              <a href="https://docs.longcat.chat/" target="_blank"
                >docs.longcat.chat</a
              >
            </li>
          </ol>
        </div>
        <div class="help-card">
          <h4>🔵 DeepSeek</h4>
          <ol>
            <li>
              访问
              <a href="https://platform.deepseek.com" target="_blank"
                >platform.deepseek.com</a
              >
            </li>
            <li>注册账号并登录</li>
            <li>进入控制台 → API Keys</li>
            <li>创建新的 API Key</li>
          </ol>
        </div>
        <div class="help-card">
          <h4>🟢 通义千问</h4>
          <ol>
            <li>
              访问
              <a href="https://dashscope.aliyun.com" target="_blank"
                >dashscope.aliyun.com</a
              >
            </li>
            <li>使用阿里云账号登录</li>
            <li>进入 API-KEY 管理</li>
            <li>创建新的 API Key</li>
          </ol>
        </div>
        <div class="help-card">
          <h4>🟣 智谱 GLM</h4>
          <ol>
            <li>
              访问
              <a href="https://open.bigmodel.cn" target="_blank"
                >open.bigmodel.cn</a
              >
            </li>
            <li>注册并登录账号</li>
            <li>进入个人中心 → API Keys</li>
            <li>创建新的 API Key</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
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
  ElMessage.success('设置已保存')
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
.settings-page {
  padding: 24px;
  max-width: 980px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 32px;

  h1 {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 15px;
  }
}

.chat-entry {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ecfeff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  color: #0f766e;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.settings-form {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 28px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 10px;
  }
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.provider-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: #f8fafc;
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: #f1f5f9;
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
    border-color: #8b5cf6;
  }
}

.provider-icon {
  font-size: 28px;
}

.provider-name {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-align: center;
}

.free-tag {
  position: absolute;
  top: -6px;
  right: -6px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #1e293b;
  background: #fff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
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
  width: 50px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
}

.form-hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
}

.endpoint-hint {
  color: #0f766e;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.save-btn,
.test-btn,
.reset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.save-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: #fff;
}

.test-btn {
  background: #f1f5f9;
  color: #475569;
}

.reset-btn {
  background: #fef2f2;
  color: #dc2626;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.test-result {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;

  &.success {
    background: #ecfdf5;
    color: #16a34a;
  }

  &.error {
    background: #fef2f2;
    color: #dc2626;
  }
}

.result-icon {
  font-size: 18px;
}

.help-section {
  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
  }
}

.help-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.help-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  h4 {
    margin: 0 0 14px;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
  }

  ol {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    color: #64748b;
    line-height: 1.8;
  }

  a,
  code {
    color: #8b5cf6;
  }
}

@media (max-width: 1100px) {
  .provider-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
  }

  .help-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .provider-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
