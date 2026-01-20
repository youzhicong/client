<template>
  <div class="settings-page">
    <!-- Header -->
    <section class="settings-header">
      <div class="header-content">
        <h1>⚙️ AI 设置</h1>
        <p>配置 AI 服务的 API Key 和模型</p>
      </div>
    </section>

    <!-- Settings Form -->
    <section class="settings-form">
      <!-- Provider Selection -->
      <div class="form-group">
        <label>选择服务商</label>
        <div class="provider-grid">
          <div
            v-for="p in providers"
            :key="p.id"
            class="provider-card"
            :class="{ active: settings.provider === p.id }"
            @click="selectProvider(p)"
          >
            <span class="provider-icon">{{ p.icon }}</span>
            <span class="provider-name">{{ p.name }}</span>
            <span v-if="p.free" class="free-tag">有免费额度</span>
          </div>
        </div>
      </div>

      <!-- API Base URL -->
      <div class="form-group">
        <label>API 地址</label>
        <input
          v-model="settings.baseUrl"
          type="text"
          class="form-input"
          placeholder="https://api.example.com"
        />
        <span class="form-hint">不同服务商的 API 地址不同</span>
      </div>

      <!-- API Key -->
      <div class="form-group">
        <label>API Key</label>
        <div class="key-input-wrapper">
          <input
            v-model="settings.apiKey"
            :type="showKey ? 'text' : 'password'"
            class="form-input"
            placeholder="sk-xxxxxxxxxxxxxxxx"
          />
          <button class="toggle-btn" @click="showKey = !showKey">
            {{ showKey ? '🙈' : '👁️' }}
          </button>
        </div>
        <span class="form-hint">请前往服务商控制台获取 API Key</span>
      </div>

      <!-- Model Selection -->
      <div class="form-group">
        <label>模型选择</label>
        <select v-model="settings.model" class="form-select">
          <option
            v-for="model in currentModels"
            :key="model.id"
            :value="model.id"
          >
            {{ model.name }}
          </option>
        </select>
        <span class="form-hint">不同模型价格和能力不同</span>
      </div>

      <!-- Buttons -->
      <div class="form-actions">
        <button class="save-btn" @click="saveSettings">
          <span>💾</span> 保存设置
        </button>
        <button class="test-btn" @click="testConnection">
          <span v-if="!testing">🔗</span>
          <span v-else class="spin">⏳</span>
          {{ testing ? '测试中...' : '测试连接' }}
        </button>
        <button class="reset-btn" @click="resetSettings">
          <span>🔄</span> 重置
        </button>
      </div>

      <!-- Test Result -->
      <div
        v-if="testResult"
        class="test-result"
        :class="testResult.success ? 'success' : 'error'"
      >
        <span class="result-icon">{{ testResult.success ? '✅' : '❌' }}</span>
        <span class="result-text">{{ testResult.message }}</span>
      </div>
    </section>

    <!-- Help Section -->
    <section class="help-section">
      <h3>📖 获取 API Key 指南</h3>
      <div class="help-cards">
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
          <h4>🟢 阿里通义千问</h4>
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
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAISettings,
  saveAISettings,
  testAIConnection,
  type AISettings
} from '@/services/ai'

const showKey = ref(false)
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

const providers = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔵',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ],
    free: true
  },
  {
    id: 'qwen',
    name: '通义千问',
    icon: '🟢',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-max', name: 'Qwen Max' }
    ],
    free: true
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    icon: '🟣',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4-flash', name: 'GLM-4 Flash (免费)' },
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus' }
    ],
    free: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '⚪',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
    ],
    free: false
  },
  {
    id: 'custom',
    name: '自定义',
    icon: '🔧',
    baseUrl: '',
    models: [{ id: 'custom', name: '自定义模型' }],
    free: false
  }
]

const settings = ref<AISettings>({
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat'
})

const currentModels = computed(() => {
  const provider = providers.find((p) => p.id === settings.value.provider)
  return provider?.models || []
})

onMounted(() => {
  const saved = getAISettings()
  if (saved) {
    settings.value = saved
  }
})

const selectProvider = (provider: (typeof providers)[0]) => {
  settings.value.provider = provider.id
  settings.value.baseUrl = provider.baseUrl
  settings.value.model = provider.models[0].id
}

const saveSettings = () => {
  if (!settings.value.apiKey.trim()) {
    ElMessage.warning('请输入 API Key')
    return
  }
  saveAISettings(settings.value)
  ElMessage.success('设置已保存')
}

const testConnection = async () => {
  if (!settings.value.apiKey.trim()) {
    ElMessage.warning('请先输入 API Key')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const result = await testAIConnection(settings.value)
    testResult.value = result
    if (result.success) {
      ElMessage.success('连接成功！')
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    testResult.value = { success: false, message: '测试失败，请检查网络' }
    ElMessage.error('测试失败')
  } finally {
    testing.value = false
  }
}

const resetSettings = () => {
  settings.value = {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-chat'
  }
  localStorage.removeItem('ai-settings')
  ElMessage.success('设置已重置')
}
</script>

<style lang="scss" scoped>
.settings-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.settings-header {
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
  grid-template-columns: repeat(5, 1fr);
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

.form-input,
.form-select {
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

.form-select {
  cursor: pointer;
}

.key-input-wrapper {
  position: relative;
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

  &:hover {
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  }
}

.test-btn {
  background: #f1f5f9;
  color: #475569;

  &:hover {
    background: #e2e8f0;
  }
}

.reset-btn {
  background: #fef2f2;
  color: #dc2626;

  &:hover {
    background: #fee2e2;
  }
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

/* Help Section */
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
  grid-template-columns: repeat(3, 1fr);
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

  a {
    color: #8b5cf6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 900px) {
  .provider-grid {
    grid-template-columns: repeat(3, 1fr);
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
