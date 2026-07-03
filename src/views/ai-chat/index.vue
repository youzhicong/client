<template>
  <div class="ai-chat-page ai-agent-shell">
    <AgentStudioHeader title="" description="" active="chat" compact />

    <section class="chat-workspace studio-workspace">
      <div v-if="!isConfigured" class="ai-agent-config-banner">
        <div class="ai-agent-config-banner-copy">
          <strong>尚未配置模型</strong>
          <span>填写 API Key 与模型名称后，聊天与工作流即可使用</span>
        </div>
        <button
          class="ai-agent-btn-primary"
          type="button"
          @click="router.push('/ai/settings')"
        >
          去配置
        </button>
      </div>

      <div class="chat-workspace-main studio-workspace-main">
        <div class="ai-agent-chat-toolbar">
          <div class="ai-agent-chat-status">
            <span
              class="ai-agent-status-dot"
              :class="{ ready: isConfigured }"
            ></span>
            <div>
              <strong>Agent 聊天</strong>
              <span v-if="agentMode" class="ai-agent-agent-desc">{{
                selectedAgent.description
              }}</span>
              <span class="ai-agent-model-chip">{{ modelLabel }}</span>
              <span v-if="userTurnCount" class="chat-turn-badge"
                >{{ userTurnCount }} 轮</span
              >
            </div>
          </div>

          <div class="ai-agent-chat-controls">
            <button
              class="ai-agent-clear-btn toolbar-icon-btn"
              type="button"
              title="导出 Markdown"
              :disabled="!canExportConversation"
              @click="exportConversationMarkdown"
            >
              <el-icon><Download /></el-icon>
            </button>
            <button
              class="ai-agent-clear-btn toolbar-icon-btn"
              type="button"
              title="刷新模型配置"
              @click="handleRefreshSettings"
            >
              <el-icon><RefreshRight /></el-icon>
            </button>
            <div class="ai-agent-toggle">
              <button
                type="button"
                class="ai-agent-toggle-btn"
                :class="{ active: !agentMode }"
                @click="agentMode = false"
              >
                普通
              </button>
              <button
                type="button"
                class="ai-agent-toggle-btn"
                :class="{ active: agentMode }"
                @click="agentMode = true"
              >
                Agent
              </button>
            </div>
            <select
              v-if="agentMode"
              v-model="selectedAgentId"
              class="ai-agent-select"
            >
              <option
                v-for="preset in agentPresets"
                :key="preset.id"
                :value="preset.id"
              >
                {{ preset.name }}
              </option>
            </select>
            <button
              class="ai-agent-clear-btn"
              type="button"
              title="开始新对话"
              @click="clearConversation"
            >
              <el-icon><Delete /></el-icon>
              新对话
            </button>
          </div>
        </div>

        <div
          ref="messageListRef"
          class="ai-agent-messages"
          @scroll="handleMessagesScroll"
        >
          <div v-if="showWelcome" class="ai-agent-welcome">
            <div class="welcome-hero-card">
              <div class="ai-agent-welcome-icon">AI</div>
              <h3>开始与 Agent 对话</h3>
              <p>
                从右侧选择场景，或直接输入问题。Agent
                模式会调用工具并展示执行轨迹。
              </p>
              <div class="welcome-prompt-chips welcome-prompt-chips--featured">
                <button
                  v-for="item in featuredPrompts"
                  :key="item"
                  type="button"
                  @click="sendMessage(item)"
                >
                  {{ item }}
                </button>
              </div>
            </div>
          </div>

          <template v-for="item in timelineItems" :key="item.key">
            <div v-if="item.type === 'date'" class="chat-date-divider">
              <span>{{ item.label }}</span>
            </div>
            <div v-else class="ai-agent-msg" :class="item.message.role">
              <div class="ai-agent-msg-avatar">
                {{ item.message.role === 'user' ? '你' : 'AI' }}
              </div>
              <div
                class="ai-agent-msg-body"
                :class="{ error: item.message.error }"
              >
                <AgentMessageContent
                  :content="item.message.content"
                  :plain="item.message.role === 'user' || item.message.error"
                />
                <div class="ai-agent-msg-foot">
                  <span class="ai-agent-msg-time">{{
                    formatTime(item.message.createdAt)
                  }}</span>
                  <div class="ai-agent-msg-actions">
                    <button
                      v-if="
                        item.message.role === 'assistant' &&
                        item.message.content
                      "
                      type="button"
                      class="ai-agent-msg-copy"
                      @click="copyMessage(item.message.content)"
                    >
                      复制
                    </button>
                    <button
                      v-if="canRegenerate(item.message)"
                      type="button"
                      class="ai-agent-msg-copy"
                      @click="regenerateReply(item.message.id)"
                    >
                      重试
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-if="sending" class="ai-agent-msg assistant">
            <div class="ai-agent-msg-avatar">AI</div>
            <div class="ai-agent-msg-body pending">
              <AgentMessageContent
                v-if="streamingText"
                :content="streamingText"
              />
              <div v-else class="typing-block">
                <div class="typing-indicator" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p class="ai-agent-msg-text">{{ pendingHint }}</p>
              </div>
              <span class="ai-agent-msg-time">{{
                streamingText ? '流式输出' : '思考中'
              }}</span>
            </div>
          </div>

          <button
            v-show="showScrollBottom"
            type="button"
            class="scroll-bottom-btn"
            aria-label="回到底部"
            @click="scrollToBottom"
          >
            <span>↓</span>
          </button>
        </div>

        <div class="mobile-session-bar">
          <button
            v-for="session in filteredChatSessions.slice(0, 4)"
            :key="`mobile-${session.id}`"
            type="button"
            class="mobile-session-chip"
            :class="{ active: session.id === activeSessionId }"
            @click="switchSession(session.id)"
          >
            {{ session.title }}
          </button>
          <button
            type="button"
            class="mobile-session-chip new"
            @click="createNewSession"
          >
            + 新建
          </button>
        </div>

        <div class="mobile-quick-bar">
          <span class="mobile-quick-label">快捷提问</span>
          <div class="mobile-quick-scroll">
            <button
              v-for="item in featuredPrompts"
              :key="`m-${item}`"
              type="button"
              @click="sendMessage(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="ai-agent-composer">
          <div class="ai-agent-composer-box">
            <textarea
              ref="composerRef"
              v-model="draft"
              class="ai-agent-composer-input"
              rows="2"
              placeholder="输入问题，Enter 发送，Shift + Enter 换行"
              @keydown="handleKeydown"
              @input="adjustComposerHeight"
            />
            <div class="ai-agent-composer-foot">
              <span class="ai-agent-composer-hint">
                {{ composerHint
                }}<template v-if="sending"> · Esc 停止</template>
              </span>
              <div class="composer-actions">
                <button
                  v-if="lastUserTopic"
                  class="composer-link-btn"
                  type="button"
                  @click="startWorkflowFromChat"
                >
                  用话题启动工作流
                </button>
                <button
                  class="ai-agent-send-btn"
                  :class="{ 'is-stop': sending }"
                  type="button"
                  :disabled="!sending && !draft.trim()"
                  @click="sending ? stopGeneration() : sendMessage()"
                >
                  <el-icon><Promotion /></el-icon>
                  {{ sending ? '停止' : '发送' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="chat-workspace-side studio-workspace-side">
        <div class="studio-side-card session-panel">
          <div class="studio-side-head">
            <strong>会话历史</strong>
            <button
              type="button"
              class="session-new-btn"
              @click="createNewSession"
            >
              新建
            </button>
          </div>
          <input
            v-model="sessionSearchQuery"
            type="search"
            class="session-search"
            placeholder="搜索会话标题…"
          />
          <div v-if="!chatSessions.length" class="side-prompt-empty">
            暂无历史会话
          </div>
          <p
            v-else-if="sessionSearchQuery && !filteredChatSessions.length"
            class="side-prompt-empty"
          >
            没有匹配的会话
          </p>
          <button
            v-for="session in filteredChatSessions"
            :key="session.id"
            type="button"
            class="session-item"
            :class="{ active: session.id === activeSessionId }"
            @click="switchSession(session.id)"
          >
            <span class="session-title">{{ session.title }}</span>
            <span class="session-meta">{{
              formatSessionTime(session.updatedAt)
            }}</span>
            <span
              v-if="chatSessions.length > 1"
              class="session-delete"
              title="删除会话"
              @click.stop="deleteSession(session.id)"
              >×</span
            >
          </button>
        </div>

        <div class="studio-stat-grid">
          <div class="studio-stat">
            <span>对话轮次</span>
            <strong>{{ userTurnCount }}</strong>
          </div>
          <div class="studio-stat">
            <span>模型状态</span>
            <strong :class="{ ready: isConfigured }">{{
              isConfigured ? '已连接' : '未配置'
            }}</strong>
          </div>
        </div>

        <div class="studio-side-card side-model-card">
          <div class="side-model-row">
            <span>Provider</span>
            <strong>{{ settings.provider || 'custom' }}</strong>
          </div>
          <div class="side-model-row">
            <span>Model</span>
            <strong>{{ settings.model || '未设置' }}</strong>
          </div>
          <button
            class="side-model-link"
            type="button"
            @click="router.push('/ai/settings')"
          >
            <el-icon><Setting /></el-icon>
            调整模型配置
          </button>
        </div>

        <AgentTracePanel
          v-if="agentMode && agentSteps.length"
          class="ai-agent-trace-compact"
          :steps="agentSteps"
          title="执行轨迹"
        />

        <div class="studio-side-card side-prompt-panel">
          <div class="studio-side-head">
            <strong>Prompt 模板</strong>
            <router-link to="/ai/prompts">管理</router-link>
          </div>
          <button
            v-for="item in savedPrompts.slice(0, 4)"
            :key="item.id"
            type="button"
            class="side-prompt-btn template"
            @click="applyPromptTemplate(item.content)"
          >
            {{ item.name }}
          </button>
          <p v-if="!savedPrompts.length" class="side-prompt-empty">
            暂无模板，可在 Prompt 工程创建
          </p>
        </div>

        <div class="studio-side-card side-prompt-panel">
          <div class="studio-side-head">
            <strong>场景提问</strong>
            <span>点击即发送</span>
          </div>
          <div
            v-for="group in quickPromptGroups"
            :key="group.label"
            class="side-prompt-group"
          >
            <span class="side-prompt-label">{{ group.label }}</span>
            <button
              v-for="item in group.items"
              :key="item"
              type="button"
              class="side-prompt-btn"
              @click="sendMessage(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Delete,
  Download,
  Promotion,
  RefreshRight,
  Setting
} from '@element-plus/icons-vue'
import AgentTracePanel from '@/components/agent/AgentTracePanel.vue'
import AgentStudioHeader from '@/components/agent/AgentStudioHeader.vue'
import AgentMessageContent from '@/components/agent/AgentMessageContent.vue'
import {
  appendPlatformTrace,
  getPromptTemplates
} from '@/services/ai-platform-store'
import {
  CHAT_AGENT_PRESETS,
  buildChatAgentHistory,
  getChatAgentPreset,
  runChatAgent,
  type AgentStep
} from '@/services/ai-agent'
import {
  chatWithAI,
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

type ChatSession = {
  id: string
  title: string
  updatedAt: number
  messages: ChatRecord[]
}

type TimelineItem =
  | { type: 'date'; key: string; label: string }
  | { type: 'message'; key: string; message: ChatRecord }

const AI_CHAT_STORAGE_KEY = 'ai-chat-conversation'
const AI_CHAT_SESSIONS_KEY = 'ai-chat-sessions'
const AI_CHAT_ACTIVE_SESSION_KEY = 'ai-chat-active-session'
const MAX_CHAT_SESSIONS = 12

const router = useRouter()
const route = useRoute()
const messageListRef = ref<HTMLDivElement | null>(null)
const composerRef = ref<HTMLTextAreaElement | null>(null)
const sending = ref(false)
const draft = ref('')
const agentMode = ref(true)
const selectedAgentId = ref('general')
const agentSteps = ref<AgentStep[]>([])
const streamingText = ref('')
const pendingHint = ref('正在规划工具与推理步骤…')
const abortController = ref<AbortController | null>(null)
const chatTraceSessionId = `chat-${Date.now()}`
const settings = ref<AISettings>(normalizeAISettings(getAISettings()))
const messages = ref<ChatRecord[]>([])
const savedPrompts = ref(getPromptTemplates())
const showScrollBottom = ref(false)
const chatSessions = ref<ChatSession[]>([])
const activeSessionId = ref('')
const sessionSearchQuery = ref('')

const agentPresets = CHAT_AGENT_PRESETS
const selectedAgent = computed(() => getChatAgentPreset(selectedAgentId.value))

const quickPromptGroups = [
  {
    label: '产品策划',
    items: ['把「智能客服」整理成 MVP 方案', '分析宠物用品赛道的切入机会']
  },
  {
    label: '研发协作',
    items: ['Vue 3 接口 404 的排查步骤', '说明 FlowAgent 项目模块与路由结构']
  },
  {
    label: 'Agent 能力',
    items: ['读取项目模块并列出 AI 入口', '演示一次工具调用与工作流联动']
  }
]

const featuredPrompts = computed(() =>
  quickPromptGroups.flatMap((group) => group.items).slice(0, 4)
)

const filteredChatSessions = computed(() => {
  const query = sessionSearchQuery.value.trim().toLowerCase()
  if (!query) return chatSessions.value
  return chatSessions.value.filter((session) =>
    session.title.toLowerCase().includes(query)
  )
})

const canExportConversation = computed(() =>
  messages.value.some((item) => item.role === 'user' && item.content.trim())
)

const currentSessionTitle = computed(() => {
  const session = chatSessions.value.find(
    (item) => item.id === activeSessionId.value
  )
  return session?.title || deriveSessionTitle(messages.value)
})

const userTurnCount = computed(
  () => messages.value.filter((item) => item.role === 'user').length
)

const composerHint = computed(() =>
  agentMode.value
    ? `Agent 模式 · ${agentSteps.value.length ? `已记录 ${agentSteps.value.length} 步轨迹` : '等待工具调用'}`
    : '普通模式 · 直接对话'
)

const lastUserTopic = computed(() => {
  const lastUser = [...messages.value]
    .reverse()
    .find((item) => item.role === 'user')
  return lastUser?.content.trim() || ''
})

const startWorkflowFromChat = () => {
  if (!lastUserTopic.value) return
  void router.push({
    path: '/ai/workflow',
    query: { q: lastUserTopic.value.slice(0, 80), run: '1' }
  })
}

const isConfigured = computed(() =>
  Boolean(
    settings.value.apiKey && settings.value.model && settings.value.baseUrl
  )
)

const showWelcome = computed(() => messages.value.length <= 1 && !sending.value)

const visibleMessages = computed(() => {
  if (!showWelcome.value) return messages.value
  const onlyGreeting =
    messages.value.length === 1 && messages.value[0]?.role === 'assistant'
  return onlyGreeting ? [] : messages.value
})

const timelineItems = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = []
  let lastDate = ''

  for (const message of visibleMessages.value) {
    const dateKey = new Date(message.createdAt).toLocaleDateString('zh-CN')
    if (dateKey !== lastDate) {
      items.push({
        type: 'date',
        key: `date-${dateKey}`,
        label: formatDateLabel(message.createdAt)
      })
      lastDate = dateKey
    }
    items.push({ type: 'message', key: message.id, message })
  }

  return items
})

const lastAssistantMessageId = computed(() => {
  const last = [...visibleMessages.value]
    .reverse()
    .find((item) => item.role === 'assistant')
  return last?.id || ''
})

const modelLabel = computed(() => {
  const provider = settings.value.provider || 'custom'
  const model = settings.value.model || '未设置模型'
  return `${provider} · ${model}`
})

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
    '你好，我是 FlowAgent 助手。开启 Agent 模式后，我会按需调用工具并展示执行轨迹。'
  )
]

const persistMessages = () => {
  const title = deriveSessionTitle(messages.value)
  const payload: ChatSession = {
    id: activeSessionId.value,
    title,
    updatedAt: Date.now(),
    messages: messages.value
  }

  const index = chatSessions.value.findIndex(
    (item) => item.id === activeSessionId.value
  )
  if (index >= 0) {
    chatSessions.value[index] = payload
  } else {
    chatSessions.value.unshift(payload)
  }

  chatSessions.value = [...chatSessions.value]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CHAT_SESSIONS)

  localStorage.setItem(AI_CHAT_SESSIONS_KEY, JSON.stringify(chatSessions.value))
  localStorage.setItem(AI_CHAT_ACTIVE_SESSION_KEY, activeSessionId.value)
  localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(messages.value))
}

const deriveSessionTitle = (records: ChatRecord[]) => {
  const firstUser = records.find(
    (item) => item.role === 'user' && item.content.trim()
  )
  if (!firstUser) return '新对话'
  const text = firstUser.content.trim()
  return text.length > 26 ? `${text.slice(0, 26)}…` : text
}

const ensureActiveSession = () => {
  if (!activeSessionId.value) {
    activeSessionId.value = `session-${Date.now()}`
  }
}

const createNewSession = () => {
  abortController.value?.abort()
  abortController.value = null
  sending.value = false
  agentSteps.value = []
  streamingText.value = ''
  draft.value = ''

  if (messages.value.some((item) => item.role === 'user')) {
    persistMessages()
  }

  activeSessionId.value = `session-${Date.now()}`
  messages.value = defaultConversation()
  chatSessions.value.unshift({
    id: activeSessionId.value,
    title: '新对话',
    updatedAt: Date.now(),
    messages: messages.value
  })
  persistMessages()
  scrollToBottom()
}

const switchSession = (sessionId: string) => {
  if (sessionId === activeSessionId.value || sending.value) return

  persistMessages()
  activeSessionId.value = sessionId
  const session = chatSessions.value.find((item) => item.id === sessionId)
  messages.value = session?.messages?.length
    ? [...session.messages]
    : defaultConversation()
  agentSteps.value = []
  streamingText.value = ''
  persistMessages()
  scrollToBottom()

  if (route.query.session !== sessionId) {
    void router.replace({
      path: route.path,
      query: { ...route.query, session: sessionId }
    })
  }
}

const deleteSession = (sessionId: string) => {
  chatSessions.value = chatSessions.value.filter(
    (item) => item.id !== sessionId
  )

  if (activeSessionId.value === sessionId) {
    const next = chatSessions.value[0]
    if (next) {
      activeSessionId.value = next.id
      messages.value = [...next.messages]
    } else {
      activeSessionId.value = `session-${Date.now()}`
      messages.value = defaultConversation()
      chatSessions.value = [
        {
          id: activeSessionId.value,
          title: '新对话',
          updatedAt: Date.now(),
          messages: messages.value
        }
      ]
    }
  }

  persistMessages()
}

const loadChatSessions = () => {
  try {
    const storedSessions = localStorage.getItem(AI_CHAT_SESSIONS_KEY)
    if (storedSessions) {
      chatSessions.value = JSON.parse(storedSessions) as ChatSession[]
    }
  } catch {
    chatSessions.value = []
  }

  if (!chatSessions.value.length) {
    const legacy = localStorage.getItem(AI_CHAT_STORAGE_KEY)
    let legacyMessages = defaultConversation()
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy) as ChatRecord[]
        if (parsed.length) legacyMessages = parsed
      } catch {
        legacyMessages = defaultConversation()
      }
    }
    activeSessionId.value = `session-${Date.now()}`
    messages.value = legacyMessages
    chatSessions.value = [
      {
        id: activeSessionId.value,
        title: deriveSessionTitle(legacyMessages),
        updatedAt: Date.now(),
        messages: legacyMessages
      }
    ]
    persistMessages()
    return
  }

  activeSessionId.value =
    localStorage.getItem(AI_CHAT_ACTIVE_SESSION_KEY) ||
    chatSessions.value[0]?.id ||
    ''

  const current = chatSessions.value.find(
    (item) => item.id === activeSessionId.value
  )
  messages.value = current?.messages?.length
    ? [...current.messages]
    : defaultConversation()
  ensureActiveSession()
}

const scrollToBottom = async () => {
  await nextTick()
  messageListRef.value?.scrollTo({
    top: messageListRef.value.scrollHeight,
    behavior: 'smooth'
  })
  showScrollBottom.value = false
}

const handleMessagesScroll = () => {
  const el = messageListRef.value
  if (!el) return
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight
  showScrollBottom.value = distance > 100
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

const clearConversation = () => {
  createNewSession()
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
        '你是 FlowAgent 中的 AI 助手。默认使用中文回答，要求简洁、直接、可执行。'
    },
    ...conversation
  ]
}

const stopGeneration = () => {
  const partial = streamingText.value.trim()
  abortController.value?.abort()
  abortController.value = null
  sending.value = false

  if (partial) {
    messages.value.push(createMessage('assistant', partial))
    persistMessages()
    scrollToBottom()
  }

  streamingText.value = ''
  pendingHint.value = '已停止生成'
}

const adjustComposerHeight = () => {
  const el = composerRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

watch(draft, () => {
  nextTick(adjustComposerHeight)
})

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
  streamingText.value = ''
  agentSteps.value = []
  pendingHint.value = agentMode.value
    ? `${selectedAgent.value.name} 正在分析…`
    : '正在请求模型响应…'

  const controller = new AbortController()
  abortController.value = controller

  try {
    const started = Date.now()
    if (agentMode.value) {
      const history = buildChatAgentHistory(messages.value.slice(0, -1))
      const result = await runChatAgent(selectedAgentId.value, {
        userMessage: content,
        history,
        signal: controller.signal,
        onStep: (step) => {
          agentSteps.value = [...agentSteps.value, step]
          if (step.type === 'tool_call') {
            pendingHint.value = `正在调用工具 ${step.toolName || ''}…`
          }
          scrollToBottom()
        },
        onDelta: (chunk) => {
          streamingText.value += chunk
          scrollToBottom()
        }
      })

      appendPlatformTrace({
        type: 'agent',
        title: content.slice(0, 40),
        detail: `${result.answer.slice(0, 120)} · ${agentSteps.value.length} 步工具/推理`,
        status: 'success',
        durationMs: Date.now() - started,
        sourcePath: '/ai/chat',
        sessionId: chatTraceSessionId
      })

      messages.value.push(createMessage('assistant', result.answer))
    } else {
      const reply = await chatWithAI(buildConversation(), {
        temperature: 0.6,
        maxTokens: 1200,
        signal: controller.signal,
        onDelta: (chunk) => {
          streamingText.value += chunk
          scrollToBottom()
        }
      })

      appendPlatformTrace({
        type: 'chat',
        title: content.slice(0, 40),
        detail: reply.slice(0, 120),
        status: 'success',
        durationMs: Date.now() - started,
        sourcePath: '/ai/chat',
        sessionId: chatTraceSessionId
      })

      messages.value.push(createMessage('assistant', reply))
    }

    persistMessages()
    scrollToBottom()
  } catch (error) {
    if (controller.signal.aborted) return
    const message =
      error instanceof Error ? error.message : '发送失败，请检查接口配置'
    messages.value.push(
      createMessage('assistant', `请求失败：${message}`, { error: true })
    )
    persistMessages()
    scrollToBottom()
  } finally {
    sending.value = false
    streamingText.value = ''
    abortController.value = null
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && sending.value) {
    event.preventDefault()
    stopGeneration()
    return
  }

  if (event.key !== 'Enter' || event.isComposing || sending.value) return
  if (event.shiftKey) return

  event.preventDefault()
  sendMessage()
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

const formatDateLabel = (timestamp: number) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const key = (value: Date) => value.toLocaleDateString('zh-CN')
  if (key(date) === key(today)) return '今天'
  if (key(date) === key(yesterday)) return '昨天'
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

const formatSessionTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  })
}

const canRegenerate = (message: ChatRecord) =>
  message.role === 'assistant' &&
  Boolean(message.content) &&
  message.id === lastAssistantMessageId.value &&
  !sending.value

const regenerateReply = (messageId: string) => {
  const index = messages.value.findIndex((item) => item.id === messageId)
  if (index < 0) return

  const previousUser = [...messages.value.slice(0, index)]
    .reverse()
    .find((item) => item.role === 'user')

  if (!previousUser?.content.trim()) {
    ElMessage.warning('找不到可重试的用户提问')
    return
  }

  messages.value = messages.value.slice(0, index)
  persistMessages()
  void sendMessage(previousUser.content.trim())
}

const exportConversationMarkdown = () => {
  if (!canExportConversation.value) {
    ElMessage.warning('当前会话没有可导出的对话')
    return
  }

  const lines = [
    `# FlowAgent 对话 · ${currentSessionTitle.value}`,
    '',
    `> 导出时间：${new Date().toLocaleString('zh-CN')}`,
    `> 模型：${modelLabel.value}`,
    `> 模式：${agentMode.value ? `Agent · ${selectedAgent.value.name}` : '普通对话'}`,
    ''
  ]

  for (const message of messages.value) {
    if (message.role !== 'user' && message.role !== 'assistant') continue
    const roleLabel = message.role === 'user' ? '用户' : 'Assistant'
    const time = new Date(message.createdAt).toLocaleString('zh-CN')
    lines.push(`## ${roleLabel} · ${time}`, '', message.content.trim(), '')
  }

  if (agentMode.value && agentSteps.value.length) {
    lines.push('---', '', '## Agent 执行轨迹', '')
    for (const step of agentSteps.value) {
      lines.push(
        `- **${step.type}**${step.toolName ? ` · ${step.toolName}` : ''}${step.content ? `：${step.content.slice(0, 120)}` : ''}`
      )
    }
    lines.push('')
  }

  const safeName = currentSessionTitle.value
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 40)
  const blob = new Blob([lines.join('\n')], {
    type: 'text/markdown;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `flowagent-chat-${safeName || 'session'}-${Date.now()}.md`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('对话已导出为 Markdown')
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择文本')
  }
}

const applyPromptTemplate = (content: string) => {
  draft.value = content.trim()
  nextTick(() => {
    composerRef.value?.focus()
    adjustComposerHeight()
  })
  ElMessage.success('已填入 Prompt 模板，可直接发送')
}

onMounted(() => {
  loadChatSessions()

  const querySession = route.query.session
  if (typeof querySession === 'string' && querySession.trim()) {
    const target = chatSessions.value.find(
      (item) => item.id === querySession.trim()
    )
    if (target) {
      activeSessionId.value = target.id
      messages.value = [...target.messages]
    }
  }

  const queryPrompt = route.query.q
  const shouldAutoSend = route.query.send === '1'
  if (typeof queryPrompt === 'string' && queryPrompt.trim()) {
    draft.value = queryPrompt.trim()
    nextTick(() => {
      composerRef.value?.focus()
      adjustComposerHeight()
      if (shouldAutoSend && isConfigured.value) {
        void sendMessage()
      }
    })
  } else {
    nextTick(adjustComposerHeight)
  }

  scrollToBottom()
  messageListRef.value?.addEventListener('scroll', handleMessagesScroll, {
    passive: true
  })
})

onUnmounted(() => {
  messageListRef.value?.removeEventListener('scroll', handleMessagesScroll)
})
</script>

<style lang="scss" scoped>
@use '@/style/ai-agent-page.scss';
@use '@/style/studio-workspace.scss';

.ai-chat-page {
  &.ai-agent-shell {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    padding: 0;
    overflow: hidden;
  }

  :deep(.ai-agent-studio-head) {
    flex-shrink: 0;
    margin-bottom: 8px;
  }

  :deep(.ai-agent-trace-compact .agent-trace-list) {
    max-height: 180px;
  }

  .ai-agent-config-banner {
    grid-column: 1 / -1;
    margin: 0;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid rgba(217, 119, 6, 0.2);
  }

  .chat-workspace-main {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .side-model-card {
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .side-prompt-panel {
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .ai-agent-chat-toolbar {
    flex-shrink: 0;
    padding: 12px 16px;
    background: linear-gradient(
      180deg,
      var(--app-surface) 0%,
      var(--app-surface-muted) 100%
    );
    border-bottom: 1px solid var(--app-border);
  }

  .ai-agent-chat-status strong {
    font-size: 15px;
    letter-spacing: -0.02em;
  }

  .ai-agent-model-chip {
    display: inline-block;
    margin-top: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--app-accent-soft);
    color: var(--app-accent);
    border: 1px solid var(--app-accent-muted);
    font-size: 10px;
    font-weight: 700;
  }

  .chat-turn-badge {
    display: inline-block;
    margin-left: 6px;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);
    color: var(--app-text-faint);
    font-size: 10px;
    font-weight: 600;
    vertical-align: middle;
  }

  .toolbar-icon-btn {
    width: 34px;
    height: 34px;
    padding: 0;
    justify-content: center;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .ai-agent-agent-desc {
    display: block;
    margin-top: 2px;
    color: var(--app-text-faint);
    font-size: 11px;
    line-height: 1.4;
  }

  .ai-agent-clear-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    background: transparent;
    color: var(--app-text-sub);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      border-color: var(--app-border-strong);
      background: var(--app-surface-muted);
      color: var(--app-text-main);
    }
  }

  .ai-agent-messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 22px 14px;
    position: relative;
    background:
      radial-gradient(
        circle at 20% 0%,
        rgba(37, 99, 235, 0.04),
        transparent 40%
      ),
      var(--app-bg);
  }

  .scroll-bottom-btn {
    position: sticky;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    margin: 0 auto;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    background: var(--app-surface);
    color: var(--app-text-sub);
    box-shadow: var(--app-shadow);
    cursor: pointer;
    transition: all 0.15s ease;

    span {
      font-size: 16px;
      line-height: 1;
    }

    &:hover {
      border-color: var(--app-accent-muted);
      color: var(--app-accent);
      background: var(--app-accent-soft);
    }
  }

  .typing-block {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .typing-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;

    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--app-accent);
      animation: chatTyping 1.2s ease-in-out infinite;

      &:nth-child(2) {
        animation-delay: 0.15s;
      }

      &:nth-child(3) {
        animation-delay: 0.3s;
      }
    }
  }

  @keyframes chatTyping {
    0%,
    80%,
    100% {
      opacity: 0.35;
      transform: translateY(0);
    }
    40% {
      opacity: 1;
      transform: translateY(-3px);
    }
  }

  .welcome-prompt-groups {
    display: grid;
    gap: 12px;
    width: 100%;
    max-width: 640px;
    margin-top: 8px;
  }

  .welcome-prompt-group {
    text-align: left;
  }

  .welcome-prompt-label {
    display: block;
    margin-bottom: 6px;
    color: var(--app-text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .welcome-prompt-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;

    button {
      padding: 8px 12px;
      border: 1px solid var(--app-border);
      border-radius: 999px;
      background: var(--app-surface);
      color: var(--app-text-sub);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--app-accent-muted);
        background: var(--app-accent-soft);
        color: var(--app-accent);
      }
    }

    &--featured {
      margin-top: 4px;
    }
  }

  .composer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .composer-link-btn {
    padding: 8px 12px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    background: transparent;
    color: var(--app-text-sub);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      border-color: var(--app-accent-muted);
      color: var(--app-accent);
      background: var(--app-accent-soft);
    }
  }

  .side-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .side-stat {
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--app-surface);
    border: 1px solid var(--app-border);

    span {
      display: block;
      margin-bottom: 4px;
      color: var(--app-text-faint);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    strong {
      color: var(--app-text-main);
      font-size: 14px;

      &.ready {
        color: var(--app-success);
      }
    }
  }

  .side-model-card {
    padding: 12px;
    border-radius: 10px;
    background: var(--app-surface);
    border: 1px solid var(--app-border);
  }

  .side-model-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 0;

    & + & {
      border-top: 1px dashed var(--app-border);
    }

    span {
      color: var(--app-text-faint);
      font-size: 11px;
    }

    strong {
      color: var(--app-text-main);
      font-size: 12px;
      text-align: right;
      word-break: break-all;
    }
  }

  .side-model-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
    padding: 8px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 8px;
    background: transparent;
    color: var(--app-text-sub);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      border-color: var(--app-accent-muted);
      color: var(--app-accent);
      background: var(--app-accent-soft);
    }
  }

  .side-prompt-panel {
    display: grid;
    gap: 10px;
  }

  .side-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    strong {
      font-size: 13px;
      color: var(--app-text-main);
    }

    span {
      font-size: 11px;
      color: var(--app-text-faint);
    }

    .side-panel-link {
      font-size: 11px;
      color: var(--app-accent);
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .side-prompt-empty {
    margin: 0;
    font-size: 11px;
    color: var(--app-text-faint);
  }

  .side-prompt-group {
    display: grid;
    gap: 6px;
  }

  .side-prompt-label {
    color: var(--app-text-faint);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .side-prompt-btn {
    width: 100%;
    padding: 9px 10px;
    border: none;
    border-radius: 8px;
    background: var(--app-surface);
    color: var(--app-text-main);
    font-size: 12px;
    line-height: 1.5;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: var(--app-accent-soft);
      color: var(--app-accent);
    }
  }

  .ai-agent-welcome {
    margin: 24px auto 16px;
    max-width: 720px;
    width: 100%;
    align-items: stretch;
  }

  .welcome-hero-card {
    padding: 28px 24px;
    border-radius: 18px;
    border: 1px solid rgba(37, 99, 235, 0.12);
    background:
      radial-gradient(
        circle at 90% 0%,
        rgba(37, 99, 235, 0.08),
        transparent 45%
      ),
      linear-gradient(
        180deg,
        var(--app-surface) 0%,
        var(--app-surface-muted) 100%
      );
    box-shadow: var(--app-shadow-sm);
    text-align: center;
  }

  .welcome-hero-card .ai-agent-welcome-icon {
    margin: 0 auto 12px;
    width: 52px;
    height: 52px;
    font-size: 15px;
    background: var(--app-gradient-brand);
    color: #fff;
    border: none;
    box-shadow: 0 8px 22px rgba(37, 99, 235, 0.28);
  }

  .welcome-hero-card h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--app-text-main);
  }

  .welcome-hero-card p {
    margin: 0 auto 14px;
    max-width: 480px;
    font-size: 13px;
    line-height: 1.65;
    color: var(--app-text-sub);
  }

  .ai-agent-msg {
    gap: 10px;
    margin-bottom: 14px;
    max-width: 900px;

    &.user {
      flex-direction: row-reverse;
      margin-left: auto;

      .ai-agent-msg-body {
        background: linear-gradient(
          135deg,
          var(--app-accent) 0%,
          var(--app-accent-strong) 100%
        );
        color: #fff;
        border-color: transparent;
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.22);
      }

      .ai-agent-msg-time {
        color: rgba(255, 255, 255, 0.65);
      }

      .ai-agent-msg-copy {
        color: rgba(255, 255, 255, 0.55);

        &:hover {
          color: #fff;
        }
      }

      .ai-agent-msg-avatar {
        background: var(--app-accent-soft);
        border-color: var(--app-accent-muted);
        color: var(--app-accent);
      }
    }

    &.assistant {
      .ai-agent-msg-avatar {
        background: linear-gradient(135deg, #6366f1 0%, var(--app-accent) 100%);
        border-color: transparent;
        color: #fff;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      }

      .ai-agent-msg-body {
        background: var(--app-surface);
        box-shadow: var(--app-shadow-sm);
      }
    }
  }

  .ai-agent-msg-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 700;
  }

  .ai-agent-msg-body {
    max-width: min(88%, 680px);
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--app-border);
    background: var(--app-surface);

    &.pending {
      border-style: dashed;
      background: var(--app-surface-muted);
    }

    &.error {
      background: rgba(220, 38, 38, 0.05);
      border-color: rgba(220, 38, 38, 0.12);
      color: var(--app-danger);
    }
  }

  .ai-agent-msg-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ai-agent-msg-body :deep(.agent-message-content) {
    width: 100%;
  }

  .ai-agent-msg-time {
    color: var(--app-text-faint);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .ai-agent-msg-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 6px;
  }

  .ai-agent-msg-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .chat-date-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px auto 14px;
    max-width: 900px;
    color: var(--app-text-faint);
    font-size: 11px;
    font-weight: 600;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--app-border);
    }

    span {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--app-border);
      background: var(--app-surface);
    }
  }

  .session-panel {
    display: grid;
    gap: 6px;
    margin-bottom: 4px;
  }

  .session-search {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    background: var(--app-surface-muted);
    color: var(--app-text-main);
    font-size: 12px;

    &::placeholder {
      color: var(--app-text-faint);
    }

    &:focus {
      outline: none;
      border-color: var(--app-accent-muted);
      box-shadow: var(--app-search-focus-shadow);
      background: var(--app-surface);
    }
  }

  .session-new-btn {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--app-accent);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .session-item {
    position: relative;
    width: 100%;
    padding: 10px 28px 10px 10px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: var(--app-surface-muted);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      border-color: var(--app-border);
      background: var(--app-surface);
    }

    &.active {
      border-color: var(--app-accent-muted);
      background: var(--app-accent-soft);
    }
  }

  .session-title {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--app-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-meta {
    display: block;
    margin-top: 2px;
    font-size: 10px;
    color: var(--app-text-faint);
  }

  .session-delete {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    color: var(--app-text-faint);
    font-size: 14px;
    line-height: 1;

    &:hover {
      background: rgba(220, 38, 38, 0.1);
      color: var(--app-danger);
    }
  }

  .ai-agent-msg-copy {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--app-text-faint);
    font-size: 10px;
    cursor: pointer;

    &:hover {
      color: var(--app-accent);
    }
  }

  .ai-agent-msg.user .ai-agent-msg-copy {
    display: none;
  }

  .ai-agent-composer {
    flex-shrink: 0;
    padding: 14px 18px 16px;
    border-top: 1px solid var(--app-border);
    background: var(--app-surface);
  }

  .ai-agent-composer-box {
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid var(--app-border-strong);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;

    &:focus-within {
      border-color: var(--app-accent-muted);
      box-shadow: var(--app-search-focus-shadow);
    }
  }

  .ai-agent-composer-input {
    min-height: 40px;
    max-height: 120px;
    font-size: 14px;
  }

  .ai-agent-send-btn {
    padding: 9px 16px;
    border-radius: 10px;
    background: var(--app-accent);
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.22);

    &:hover:not(:disabled) {
      background: var(--app-accent-strong);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.28);
    }

    &:disabled {
      opacity: 0.45;
    }
  }

  .ai-agent-send-btn.is-stop {
    background: transparent;
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-main);

    &:hover:not(:disabled) {
      background: var(--app-surface-muted);
      border-color: var(--app-danger);
      color: var(--app-danger);
    }
  }

  .ai-agent-status-panel {
    padding: 14px;
  }

  .ai-agent-status-badge {
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(217, 119, 6, 0.1);
    color: var(--app-warning);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;

    &.ready {
      background: rgba(22, 163, 74, 0.1);
      color: var(--app-success);
    }
  }

  .ai-agent-status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }

  .ai-agent-status-item {
    padding: 10px;
    border-radius: 10px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);

    span {
      display: block;
      margin-bottom: 4px;
      color: var(--app-text-faint);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    strong {
      display: block;
      color: var(--app-text-main);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.4;
      word-break: break-all;
    }
  }

  .ai-agent-endpoint {
    margin-bottom: 12px;
    padding: 10px;
    border-radius: 10px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-border);

    span {
      display: block;
      margin-bottom: 4px;
      color: var(--app-text-faint);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    code {
      display: block;
      color: var(--app-text-sub);
      font-family: var(--app-font-mono);
      font-size: 11px;
      line-height: 1.5;
      word-break: break-all;
    }
  }

  .ai-agent-settings-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 8px;
    background: transparent;
    color: var(--app-text-sub);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      border-color: var(--app-accent-muted);
      background: var(--app-accent-soft);
      color: var(--app-accent);
    }
  }

  .ai-agent-prompt {
    padding: 10px 12px;
    border-radius: 8px;
    border: none;
    background: var(--app-surface-muted);
    font-size: 12px;
    line-height: 1.55;

    &:hover {
      background: var(--app-accent-soft);
    }
  }

  .ai-agent-welcome {
    margin: 12px auto 8px;
    padding: 0 12px;

    h3 {
      font-size: 16px;
    }

    p {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }

  .mobile-session-bar {
    display: none;
    flex-shrink: 0;
    gap: 8px;
    padding: 10px 14px 0;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .mobile-session-chip {
    flex: 0 0 auto;
    max-width: 140px;
    padding: 7px 12px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    background: var(--app-surface);
    color: var(--app-text-sub);
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;

    &.active {
      border-color: var(--app-accent-muted);
      background: var(--app-accent-soft);
      color: var(--app-accent);
      font-weight: 700;
    }

    &.new {
      color: var(--app-accent);
      font-weight: 700;
    }
  }

  .mobile-quick-bar {
    display: none;
    flex-shrink: 0;
    padding: 10px 14px 0;
    border-top: 1px dashed var(--app-border);
    background: var(--app-surface-muted);
  }

  .mobile-quick-label {
    display: block;
    margin-bottom: 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--app-text-faint);
  }

  .mobile-quick-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 10px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    button {
      flex: 0 0 auto;
      padding: 8px 12px;
      border: 1px solid var(--app-border);
      border-radius: 999px;
      background: var(--app-surface);
      color: var(--app-text-sub);
      font-size: 12px;
      white-space: nowrap;
      cursor: pointer;

      &:hover {
        border-color: var(--app-accent-muted);
        background: var(--app-accent-soft);
        color: var(--app-accent);
      }
    }
  }

  :deep(.studio-stat-grid .studio-stat) {
    border-top: 2px solid var(--app-accent-muted);
  }
}

:global(html.dark) {
  .ai-chat-page .welcome-hero-card {
    border-color: var(--app-border);
    background:
      radial-gradient(
        circle at 90% 0%,
        rgba(59, 130, 246, 0.1),
        transparent 45%
      ),
      linear-gradient(
        180deg,
        var(--app-surface) 0%,
        var(--app-surface-muted) 100%
      );
  }
}

@media (max-width: 960px) {
  .ai-chat-page .chat-workspace {
    grid-template-columns: 1fr;
  }

  .ai-chat-page .chat-workspace-side {
    display: none;
  }

  .ai-chat-page .mobile-quick-bar {
    display: block;
  }

  .ai-chat-page .mobile-session-bar {
    display: flex;
  }
}
</style>
