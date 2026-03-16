<template>
  <div class="ai-chat-page">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="hero-badge">AI Chat Workspace</span>
        <h1>聊天模块</h1>
        <p>
          这里直接复用 AI 设置页里的模型配置，适合先验证
          Key、模型名和兼容接口是否可用。
        </p>
      </div>
      <div class="hero-actions">
        <button class="ghost-btn" @click="handleRefreshSettings">
          <el-icon><RefreshRight /></el-icon>
          刷新配置
        </button>
        <button class="solid-btn" @click="goToSettings">
          <el-icon><Setting /></el-icon>
          打开 AI 设置
        </button>
      </div>
    </section>

    <section class="chat-layout">
      <div class="chat-card">
        <div class="chat-toolbar">
          <div>
            <strong>当前会话</strong>
            <p>
              已接入 {{ settings.provider || 'custom' }} /
              {{ settings.model || '未设置模型' }}
            </p>
          </div>
          <button class="clear-btn" @click="clearConversation">
            <el-icon><Delete /></el-icon>
            清空会话
          </button>
        </div>

        <div ref="messageListRef" class="message-list">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-row"
            :class="message.role"
          >
            <div class="message-avatar">
              {{ message.role === 'user' ? '你' : 'AI' }}
            </div>
            <div class="message-bubble" :class="{ error: message.error }">
              <div class="message-meta">
                <strong>{{
                  message.role === 'user' ? '你' : 'AI 助手'
                }}</strong>
                <span>{{ formatTime(message.createdAt) }}</span>
              </div>
              <p>{{ message.content }}</p>
            </div>
          </div>

          <div v-if="sending" class="message-row assistant">
            <div class="message-avatar">AI</div>
            <div class="message-bubble pending">
              <div class="message-meta">
                <strong>AI 助手</strong>
                <span>思考中</span>
              </div>
              <p>正在请求模型响应...</p>
            </div>
          </div>
        </div>

        <div class="composer">
          <textarea
            v-model="draft"
            class="composer-input"
            rows="4"
            placeholder="输入你的问题，按 Ctrl/Command + Enter 发送"
            @keydown="handleKeydown"
          />
          <div class="composer-actions">
            <span class="composer-tip"
              >建议先在右侧确认 Base URL 与模型名。</span
            >
            <button
              class="send-btn"
              :disabled="sending || !draft.trim()"
              @click="sendMessage()"
            >
              <el-icon><Promotion /></el-icon>
              {{ sending ? '发送中...' : '发送消息' }}
            </button>
          </div>
        </div>
      </div>

      <aside class="side-panel">
        <div class="panel-card status-card">
          <div class="panel-head">
            <strong>模型配置</strong>
            <span class="status-dot" :class="{ ready: isConfigured }"></span>
          </div>
          <dl class="meta-list">
            <div>
              <dt>Provider</dt>
              <dd>{{ settings.provider || 'custom' }}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{{ settings.model || '未设置' }}</dd>
            </div>
            <div>
              <dt>Base URL</dt>
              <dd>{{ settings.baseUrl || '未设置' }}</dd>
            </div>
            <div>
              <dt>实际接口</dt>
              <dd>{{ endpoint || '未生成' }}</dd>
            </div>
          </dl>
        </div>

        <div class="panel-card">
          <div class="panel-head">
            <strong>快捷提问</strong>
            <span>点击即发</span>
          </div>
          <div class="prompt-list">
            <button
              v-for="item in quickPrompts"
              :key="item"
              class="prompt-chip"
              @click="sendMessage(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="panel-card note-card">
          <div class="panel-head">
            <strong>接入说明</strong>
            <span>LongCat / OpenAI 兼容</span>
          </div>
          <ul class="note-list">
            <li>LongCat 请优先选择内置 `LongCat` 服务商。</li>
            <li>如果手填地址，推荐 `https://api.longcat.chat/openai`。</li>
            <li>测试和聊天都会自动请求兼容接口的 `chat/completions`。</li>
          </ul>
        </div>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Delete,
  Promotion,
  RefreshRight,
  Setting
} from '@element-plus/icons-vue'
import {
  chatWithAI,
  getAIChatEndpoint,
  getAISettings,
  normalizeAISettings,
  type AIMessage,
  type AISettings
} from '@/services/ai'

type ChatRecord = AIMessage & {
  id: string
  createdAt: number
  error?: boolean
}

const AI_CHAT_STORAGE_KEY = 'ai-chat-conversation'

const router = useRouter()
const messageListRef = ref<HTMLDivElement | null>(null)
const sending = ref(false)
const draft = ref('')
const settings = ref<AISettings>(normalizeAISettings(getAISettings()))
const messages = ref<ChatRecord[]>([])

const quickPrompts = [
  '帮我确认 LongCat 的 Base URL 和模型名怎么填',
  '给我写一个 Vue 3 + Element Plus 的聊天页面原型',
  '帮我分析这个接口为什么会返回 404',
  '把下面这段业务需求整理成实施步骤'
]

const endpoint = computed(() => getAIChatEndpoint(settings.value))
const isConfigured = computed(() =>
  Boolean(
    settings.value.apiKey && settings.value.model && settings.value.baseUrl
  )
)

const createMessage = (
  role: AIMessage['role'],
  content: string,
  extra: Pick<ChatRecord, 'error'> = {}
): ChatRecord => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  createdAt: Date.now(),
  ...extra
})

const defaultConversation = () => [
  createMessage(
    'assistant',
    '这里是 AI 聊天模块。先到 AI 设置页配置 Base URL、API Key 和模型名，再回来测试对话。'
  )
]

const persistMessages = () => {
  localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(messages.value))
}

const scrollToBottom = async () => {
  await nextTick()
  messageListRef.value?.scrollTo({
    top: messageListRef.value.scrollHeight,
    behavior: 'smooth'
  })
}

const refreshSettings = (showMessage = true) => {
  settings.value = normalizeAISettings(getAISettings())
  if (showMessage) {
    ElMessage.success('已刷新 AI 配置')
  }
}

const handleRefreshSettings = () => {
  refreshSettings(true)
}

const goToSettings = () => {
  router.push('/ai/settings')
}

const clearConversation = () => {
  messages.value = defaultConversation()
  persistMessages()
  scrollToBottom()
}

const buildConversation = (): AIMessage[] => {
  const conversation = messages.value
    .filter((item) => !item.error)
    .map((item) => ({
      role: item.role,
      content: item.content
    }))

  return [
    {
      role: 'system',
      content:
        '你是 PC 管理平台中的 AI 助手。默认使用中文回答，要求简洁、直接、可执行。'
    },
    ...conversation
  ]
}

const sendMessage = async (value = draft.value) => {
  const content = value.trim()
  if (!content || sending.value) return

  refreshSettings(false)

  if (!settings.value.apiKey) {
    ElMessage.warning('请先到 AI 设置页配置 API Key')
    return
  }

  if (!settings.value.model) {
    ElMessage.warning('请先配置模型名称')
    return
  }

  const userMessage = createMessage('user', content)
  messages.value.push(userMessage)
  draft.value = ''
  persistMessages()
  scrollToBottom()

  sending.value = true

  try {
    const reply = await chatWithAI(buildConversation(), {
      temperature: 0.6,
      maxTokens: 1200
    })

    messages.value.push(createMessage('assistant', reply))
    persistMessages()
    scrollToBottom()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '发送失败，请检查接口配置'
    messages.value.push(
      createMessage('assistant', `请求失败：${message}`, { error: true })
    )
    persistMessages()
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    sendMessage()
  }
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

onMounted(() => {
  const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY)

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ChatRecord[]
      messages.value = parsed.length > 0 ? parsed : defaultConversation()
    } catch {
      messages.value = defaultConversation()
    }
  } else {
    messages.value = defaultConversation()
  }

  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.ai-chat-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background:
    radial-gradient(
      circle at top right,
      rgba(254, 215, 170, 0.35),
      transparent 28%
    ),
    linear-gradient(180deg, #fff8f2 0%, #f8fbff 100%);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  margin-bottom: 24px;
  border-radius: 28px;
  background: linear-gradient(135deg, #172554 0%, #0f766e 52%, #f97316 100%);
  color: #fff;
  box-shadow: 0 20px 50px rgba(15, 118, 110, 0.18);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0 0 10px;
  font-size: 34px;
  line-height: 1.1;
}

.hero-copy p {
  max-width: 620px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.ghost-btn,
.solid-btn,
.send-btn,
.clear-btn,
.prompt-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn,
.solid-btn {
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 600;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.solid-btn {
  background: #fff3e8;
  color: #9a3412;
}

.chat-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 24px;
}

.chat-card,
.panel-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.chat-card {
  border-radius: 24px;
  overflow: hidden;
}

.chat-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 22px 24px;
  border-bottom: 1px solid #e2e8f0;

  strong {
    display: block;
    font-size: 16px;
    color: #0f172a;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
  }
}

.clear-btn {
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff1f2;
  color: #be123c;
  font-weight: 600;
}

.message-list {
  height: 560px;
  overflow-y: auto;
  padding: 24px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 247, 237, 0.65) 0%,
      rgba(255, 255, 255, 0.98) 26%
    ),
    linear-gradient(135deg, #fef7ed 0%, #eff6ff 100%);
}

.message-row {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;

  &.user {
    flex-direction: row-reverse;

    .message-bubble {
      background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
      color: #fff;

      p,
      span {
        color: inherit;
      }
    }
  }
}

.message-avatar {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #fed7aa 0%, #fb923c 100%);
  color: #7c2d12;
  font-weight: 700;
}

.message-bubble {
  max-width: min(78%, 720px);
  padding: 16px 18px;
  border-radius: 18px;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);

  &.pending {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
  }

  &.error {
    background: #fff1f2;
    color: #be123c;
  }

  p {
    margin: 0;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.message-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;

  strong {
    font-size: 13px;
  }

  span {
    color: #94a3b8;
  }
}

.composer {
  padding: 20px 24px 24px;
  background: #fff;
}

.composer-input {
  width: 100%;
  padding: 16px;
  border: 1px solid #dbe4ee;
  border-radius: 18px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.7;
  color: #0f172a;
  background: #f8fafc;

  &:focus {
    outline: none;
    border-color: #14b8a6;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
  }
}

.composer-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 14px;
}

.composer-tip {
  color: #64748b;
  font-size: 12px;
}

.send-btn {
  padding: 12px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff;
  font-weight: 700;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  border-radius: 22px;
  padding: 20px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  strong {
    color: #0f172a;
    font-size: 15px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.status-card {
  background: linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f97316;

  &.ready {
    background: #22c55e;
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
  }
}

.meta-list {
  margin: 0;

  div + div {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px dashed #d8e3ec;
  }

  dt {
    margin-bottom: 6px;
    color: #64748b;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  dd {
    margin: 0;
    color: #0f172a;
    font-size: 13px;
    line-height: 1.7;
    word-break: break-all;
  }
}

.prompt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.prompt-chip {
  width: 100%;
  justify-content: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #fff7ed 100%);
  color: #334155;
  text-align: left;
  line-height: 1.5;
}

.note-card {
  background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
}

.note-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  font-size: 13px;
  line-height: 1.8;
}

@media (max-width: 1024px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-card,
  .hero-actions,
  .composer-actions,
  .chat-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .message-list {
    height: 480px;
    padding: 18px;
  }

  .message-bubble {
    max-width: 100%;
  }
}
</style>
