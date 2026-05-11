<template>
  <div class="im-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <div class="im-header panel">
      <div class="brand">
        <span class="brand-badge">IM HUB</span>
        <div class="brand-copy">
          <h2>协同消息中心</h2>
          <p>把会话、通知和协作放在一个面板里完成。</p>
        </div>
      </div>

      <div class="header-actions">
        <div class="ws-state" :class="{ online: connected }">
          <span class="state-dot"></span>
          <span>{{ connected ? 'WebSocket 已连接' : 'WebSocket 已断开' }}</span>
        </div>
        <el-button size="small" class="ws-btn" @click="toggleConnection">
          {{ connected ? '断开连接' : '重新连接' }}
        </el-button>
      </div>
    </div>

    <div class="im-shell">
      <div class="sidebar panel">
        <div class="search-wrap">
          <el-input
            v-model="keyword"
            placeholder="搜索会话或成员"
            clearable
            class="search-input"
          />
        </div>

        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: tab.value === activeTab }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span
              v-if="tab.value === 'unread' && totalUnread"
              class="tab-badge"
            >
              {{ totalUnread }}
            </span>
          </button>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span>会话</span>
            <strong>{{ totalConversations }}</strong>
          </div>
          <div class="summary-card">
            <span>人工在线</span>
            <strong>{{ humanOnlineUsers.length }}</strong>
          </div>
          <div class="summary-card highlight">
            <span>未读</span>
            <strong>{{ totalUnread }}</strong>
          </div>
        </div>

        <div v-if="aiFallbackActive" class="ai-fallback-note">
          当前只有你在线，已启用 AI 助手接待。
        </div>

        <div class="conversation-list">
          <div
            v-if="filteredConversations.length === 0"
            class="conversation-empty"
          >
            没有匹配的会话
          </div>

          <div
            v-for="(conv, idx) in filteredConversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conv.id === activeId, pinned: conv.pinned }"
            :style="{ '--delay': `${idx * 0.03}s` }"
            @click="selectConversation(conv.id)"
          >
            <div class="avatar">
              <img
                v-if="showAvatarImage(conv.avatar)"
                class="avatar-media"
                :src="conv.avatar"
                :alt="`${conv.title} 头像`"
                @error="markAvatarBroken(conv.avatar)"
              />
              <span v-else class="avatar-fallback">
                {{ getAvatarFallbackText(conv.title) }}
              </span>
            </div>

            <div class="conversation-content">
              <div class="top-line">
                <span class="name">{{ conv.title }}</span>
                <span class="time">{{ formatListTime(conv.lastTime) }}</span>
              </div>

              <div class="bottom-line">
                <span v-if="conv.typing" class="typing">对方正在输入...</span>
                <span v-else class="preview">{{ conv.lastMessage }}</span>
                <span v-if="conv.unread" class="unread">{{ conv.unread }}</span>
              </div>

              <div class="tags-line">
                <span class="mode-tag" :class="conv.mode">
                  {{ conversationModeLabel(conv.mode) }}
                </span>
                <button
                  v-if="!isAiConversation(conv.id)"
                  class="pin-btn"
                  type="button"
                  @click.stop="togglePin(conv.id)"
                >
                  {{ conv.pinned ? '取消置顶' : '置顶' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main class="chat panel">
        <div v-if="!activeConversation" class="chat-empty">
          <h3>选择一个会话开始沟通</h3>
          <p>可在左侧搜索、筛选并管理你的会话列表。</p>
        </div>

        <template v-else>
          <div class="chat-header">
            <div>
              <h3>{{ activeConversation.title }}</h3>
              <div class="chat-sub">
                <span class="status" :class="statusClass(activeConversation)">
                  {{ conversationModeLabel(activeConversation.mode) }}
                </span>
                <span>{{ activeConversation.members.length }} 位成员</span>
                <span v-if="activeConversation.typing" class="typing-text"
                  >有人正在输入...</span
                >
              </div>
            </div>

            <div class="chat-actions">
              <template v-if="!isActiveAiConversation">
                <el-button size="small" @click="markRead(activeConversation.id)"
                  >全部已读</el-button
                >
                <el-button size="small" type="primary" plain
                  >发起会议</el-button
                >
              </template>
              <span v-else class="ai-session-chip">AI 接待中</span>
            </div>
          </div>

          <div ref="messageWrapRef" class="chat-body" @scroll="handleScroll">
            <button
              v-if="newMessageCount"
              class="new-hint"
              type="button"
              @click="jumpToBottom"
            >
              有 {{ newMessageCount }} 条新消息
            </button>

            <div v-if="messageView.length === 0" class="empty-state">
              还没有消息，发一条开启对话吧。
            </div>

            <template v-for="msg in messageView" :key="msg.id">
              <div v-if="msg.showTime" class="time-divider">
                {{ formatTimeGroup(msg.createdAt) }}
              </div>

              <div v-if="msg.type === 'system'" class="system-message">
                {{ msg.content }}
              </div>

              <div
                v-else
                class="message-row"
                :class="{ self: msg.senderId === currentUser?.id }"
              >
                <div class="message-avatar">
                  {{ msg.senderName.slice(0, 1) }}
                </div>

                <div class="message-content">
                  <div
                    v-if="
                      activeConversation.mode === 'group' &&
                      msg.senderId !== currentUser?.id
                    "
                    class="sender"
                  >
                    {{ msg.senderName }}
                  </div>

                  <div class="bubble" :class="msg.type">
                    <div v-if="msg.type === 'file'" class="file-card">
                      <div class="file-icon">FILE</div>
                      <div class="file-info">
                        <div class="file-name">
                          {{ msg.fileName || msg.content }}
                        </div>
                        <div class="file-tip">点击下载附件</div>
                      </div>
                    </div>

                    <div v-else-if="msg.type === 'image'" class="image-card">
                      <span>图片消息</span>
                    </div>

                    <div v-else class="text">
                      {{ msg.content
                      }}<span
                        v-if="isStreamingAiMessage(msg)"
                        class="typing-cursor"
                      ></span>
                    </div>
                  </div>

                  <div class="meta">
                    <span>{{ formatMessageTime(msg.createdAt) }}</span>
                    <span
                      v-if="msg.senderId === currentUser?.id"
                      class="status"
                    >
                      {{ formatStatus(msg.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <div
              v-if="activeConversation.typing && !hasStreamingAiMessage"
              class="typing-row"
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div class="composer">
            <div class="composer-tools">
              <button class="tool-btn" type="button" @click="appendEmoji('😊')">
                表情
              </button>
              <button
                class="tool-btn"
                type="button"
                @click="appendText('收到，30 分钟内给你回复。')"
              >
                快捷回复
              </button>
              <button
                v-if="!isActiveAiConversation"
                class="tool-btn"
                type="button"
                @click="triggerFile"
              >
                上传文件
              </button>
              <input
                ref="fileInputRef"
                class="file-input"
                type="file"
                @change="onFileChange"
              />
              <button class="tool-btn" type="button" @click="appendText('@')">
                @ 提及
              </button>
            </div>

            <el-input
              v-model="draft"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              @keydown.enter.exact.prevent="submitMessage"
              @keydown.ctrl.enter.prevent="submitMessage"
              @keydown.meta.enter.prevent="submitMessage"
            />

            <div class="composer-footer">
              <span class="hint">{{ composerHint }}</span>

              <div class="composer-actions">
                <span class="count" :class="{ danger: draftOverflow }">
                  {{ draftLength }}/{{ draftLimit }}
                </span>
                <el-button
                  type="primary"
                  :disabled="!canSend"
                  @click="submitMessage"
                >
                  发送消息
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </main>

      <div class="members panel">
        <div class="members-head">
          <h4>参与成员</h4>
          <span class="count">{{ activeMembers.length }}</span>
        </div>

        <p class="members-sub">在线 {{ onlineMembers }} 人</p>

        <div class="members-list">
          <div v-if="activeMembers.length === 0" class="members-empty">
            当前无成员信息
          </div>

          <div
            v-for="member in activeMembers"
            :key="member.id"
            class="member-item"
          >
            <div class="member-avatar">
              <img
                v-if="showAvatarImage(member.avatar)"
                class="avatar-media"
                :src="member.avatar"
                :alt="`${member.name} 头像`"
                @error="markAvatarBroken(member.avatar)"
              />
              <span v-else class="avatar-fallback">
                {{ getAvatarFallbackText(member.name) }}
              </span>
            </div>
            <div class="member-info">
              <div class="member-name">
                {{ member.name }}
                <span v-if="member.id === currentUser?.id" class="self-tag"
                  >我</span
                >
              </div>
              <div class="member-status" :class="memberLiveStatus(member)">
                {{ statusLabel(memberLiveStatus(member)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useImStore } from '@/stores'
import { AI_CONVERSATION_ID } from '@/stores/modules/imState'
import type { ImUserProfile } from '@/services/im'
import { canRenderAvatarImage, getAvatarFallbackText } from './avatarDisplay'

type TabKey = 'all' | 'unread' | 'group'

const imStore = useImStore()
const keyword = ref('')
const draft = ref('')
const activeTab = ref<TabKey>('all')
const messageWrapRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const draftLimit = 500

const tabs = [
  { label: '全部', value: 'all' as TabKey },
  { label: '未读', value: 'unread' as TabKey },
  { label: '群聊', value: 'group' as TabKey }
]

const { selectConversation, markRead, togglePin } = imStore
const {
  activeId,
  activeConversation,
  activeMessages,
  connected,
  totalUnread,
  currentUser,
  humanOnlineUsers,
  aiFallbackActive
} = storeToRefs(imStore)

const activeMembers = computed(() =>
  (activeConversation.value?.members || []).filter((item) => Boolean(item))
)
const totalConversations = computed(() => imStore.conversations.length)
const onlineMembers = computed(
  () =>
    activeMembers.value.filter((item) => memberLiveStatus(item) === 'online')
      .length
)
const isActiveAiConversation = computed(
  () => activeId.value === AI_CONVERSATION_ID
)
const composerHint = computed(() =>
  isActiveAiConversation.value
    ? '当前由 AI 助手接待，人工上线后可继续转人工沟通。'
    : `当前会话：${activeConversation.value?.title || '-'}`
)

const draftLength = computed(() => draft.value.length)
const draftOverflow = computed(() => draftLength.value > draftLimit)
const canSend = computed(
  () =>
    Boolean(activeConversation.value) &&
    draft.value.trim().length > 0 &&
    !draftOverflow.value &&
    !(isActiveAiConversation.value && activeConversation.value?.typing)
)

const newMessageCount = ref(0)
const lastMessageCount = ref(0)
const autoScroll = ref(true)
const brokenAvatarSources = ref<string[]>([])

const showAvatarImage = (source?: string | null) => {
  const normalized = source?.trim()
  if (!normalized) return false

  return (
    canRenderAvatarImage(normalized) &&
    !brokenAvatarSources.value.includes(normalized)
  )
}

const isAiConversation = (convId: string) => convId === AI_CONVERSATION_ID

const conversationModeLabel = (mode: string) => {
  if (mode === 'group') return '群聊'
  if (mode === 'ai') return 'AI 接待'
  return '私聊'
}

const memberLiveStatus = (member: ImUserProfile) =>
  imStore.resolveLiveStatus(member)

const markAvatarBroken = (source?: string | null) => {
  const normalized = source?.trim()
  if (!normalized || brokenAvatarSources.value.includes(normalized)) return
  brokenAvatarSources.value = [...brokenAvatarSources.value, normalized]
}

const filteredConversations = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  const sorted = [...imStore.conversations].sort((a, b) => {
    const pinnedWeight = Number(b.pinned) - Number(a.pinned)
    if (pinnedWeight !== 0) return pinnedWeight
    return b.lastTime - a.lastTime
  })

  return sorted.filter((item) => {
    if (activeTab.value === 'unread' && item.unread === 0) return false
    if (activeTab.value === 'group' && item.mode !== 'group') return false
    if (!key) return true

    return (
      item.title.toLowerCase().includes(key) ||
      item.members.some((member) => member.name.toLowerCase().includes(key))
    )
  })
})

const messageView = computed(() => {
  let lastTime = 0
  return activeMessages.value.map((msg) => {
    const showTime = msg.createdAt - lastTime > 5 * 60 * 1000
    if (showTime) lastTime = msg.createdAt
    return { ...msg, showTime }
  })
})

const isStreamingAiMessage = (msg: {
  id: string
  senderId: string
  type: string
}) => {
  if (!activeConversation.value?.typing) return false
  if (msg.senderId === currentUser.value?.id || msg.type !== 'text')
    return false
  const lastMessage = activeMessages.value[activeMessages.value.length - 1]
  return lastMessage?.id === msg.id
}

const hasStreamingAiMessage = computed(() =>
  activeMessages.value.some((msg) => isStreamingAiMessage(msg))
)

const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

const formatDate = (value: number) =>
  new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })

const formatListTime = (value: number) => {
  const date = new Date(value)
  const today = new Date()

  if (isSameDate(date, today)) return formatTime(value)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDate(date, yesterday)) return '昨天'

  return formatDate(value)
}

const formatTimeGroup = (value: number) => {
  const date = new Date(value)
  const today = new Date()
  const isToday = isSameDate(date, today)

  return isToday
    ? `今天 ${formatTime(value)}`
    : `${formatDate(value)} ${formatTime(value)}`
}

const formatMessageTime = (value: number) => formatTime(value)

const formatStatus = (status: string) => {
  if (status === 'sending') return '发送中'
  if (status === 'failed') return '发送失败'
  if (status === 'sent') return '已送达'
  return '已读'
}

const statusLabel = (status: string) => {
  if (status === 'online') return '在线'
  if (status === 'busy') return '忙碌'
  return '离线'
}

const statusClass = (conv: { mode: string }) =>
  conv.mode === 'group' ? 'group' : conv.mode === 'ai' ? 'ai' : 'direct'

const scrollToBottom = () => {
  if (!messageWrapRef.value) return
  messageWrapRef.value.scrollTop = messageWrapRef.value.scrollHeight
}

const handleScroll = () => {
  if (!messageWrapRef.value) return

  const { scrollTop, clientHeight, scrollHeight } = messageWrapRef.value
  autoScroll.value = scrollHeight - scrollTop - clientHeight < 80
  if (autoScroll.value) newMessageCount.value = 0
}

const jumpToBottom = () => {
  autoScroll.value = true
  newMessageCount.value = 0
  nextTick(scrollToBottom)
}

const submitMessage = () => {
  if (!canSend.value) return

  const text = draft.value.trim()
  imStore.sendMessage(text, 'text')
  draft.value = ''
  nextTick(scrollToBottom)
}

const appendEmoji = (emoji: string) => {
  draft.value = `${draft.value}${emoji}`
}

const appendText = (text: string) => {
  draft.value = `${draft.value}${text}`
}

const triggerFile = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  imStore.sendMessage(file.name, 'file', file.name)
  input.value = ''
  nextTick(scrollToBottom)
}

const toggleConnection = () => {
  if (connected.value) {
    imStore.disconnect()
  } else {
    imStore.connect()
  }
}

onMounted(() => {
  imStore.connect()
})

onBeforeUnmount(() => {
  imStore.disconnect()
})

watch(
  () => [activeMessages.value.length, activeId.value],
  () => {
    const count = activeMessages.value.length
    if (autoScroll.value) {
      newMessageCount.value = 0
      nextTick(scrollToBottom)
    } else if (count > lastMessageCount.value) {
      newMessageCount.value += count - lastMessageCount.value
    }
    lastMessageCount.value = count
  },
  { immediate: true }
)

watch(
  () => activeMessages.value.map((item) => item.content).join('\u0000'),
  () => {
    if (!autoScroll.value) return
    nextTick(scrollToBottom)
  }
)

watch(
  () => activeId.value,
  () => {
    newMessageCount.value = 0
    autoScroll.value = true
    lastMessageCount.value = activeMessages.value.length
  }
)
</script>

<style lang="scss" scoped>
.im-page {
  --bg-main: #eef6ff;
  --bg-side: #e9fbf8;
  --panel: rgba(255, 255, 255, 0.9);
  --panel-solid: #ffffff;
  --line: #d6e4f0;
  --text-main: #10263f;
  --text-secondary: #647a94;
  --brand: #0c74e6;
  --brand-soft: #dbeafe;
  --teal: #18a0a8;
  --teal-soft: #d5f5f3;
  --warning: #f59e0b;
  --danger: #ef4444;
  --ok: #22c55e;
  --shadow: 0 18px 42px rgba(16, 38, 63, 0.12);

  position: relative;
  min-height: 100vh;
  padding: 24px;
  overflow: hidden;
  color: var(--text-main);
  font-family: 'Space Grotesk', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(circle at 15% 0%, var(--bg-side) 0%, transparent 46%),
    radial-gradient(circle at 100% 10%, #d7ecff 0%, transparent 40%),
    var(--bg-main);
}

.bg-shape {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(1px);
}

.shape-a {
  top: -110px;
  right: -50px;
  width: 260px;
  height: 260px;
  background: linear-gradient(135deg, #9ad4ff, #8ef1e5);
  opacity: 0.34;
}

.shape-b {
  left: -100px;
  bottom: -130px;
  width: 320px;
  height: 320px;
  background: linear-gradient(135deg, #c8e0ff, #b8ffe7);
  opacity: 0.42;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
}

.im-header {
  position: relative;
  z-index: 1;
  padding: 18px 22px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: reveal-up 0.45s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-badge {
  min-width: 74px;
  height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.08em;
  font-weight: 700;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--teal));
}

.brand-copy h2 {
  margin: 0;
  font-size: 20px;
}

.brand-copy p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ws-state {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #dbe7f2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  background: #f7fbff;
}

.state-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a2b5c9;
}

.ws-state.online {
  border-color: #bbf7d0;
  color: #15803d;
  background: #ecfdf3;
}

.ws-state.online .state-dot {
  background: var(--ok);
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
}

.ws-btn {
  border-radius: 10px;
}

.im-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 260px;
  gap: 16px;
}

.sidebar,
.chat,
.members {
  animation: reveal-up 0.52s ease;
}

.sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-wrap {
  padding: 16px;
  border-bottom: 1px solid var(--line);
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none;
  background: #f6fbff;
}

.tabs {
  display: flex;
  gap: 8px;
  padding: 14px 16px 0;
}

.tab-btn {
  height: 30px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: #edf4fb;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--brand);
  border-color: #c6ddf6;
}

.tab-btn.active {
  color: var(--brand);
  background: var(--brand-soft);
  border-color: #b8d5f7;
}

.tab-badge {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  font-size: 10px;
  color: #fff;
  background: var(--danger);
  display: grid;
  place-items: center;
}

.summary-grid {
  margin: 14px 16px 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.summary-card {
  padding: 8px 10px;
  border-radius: 12px;
  background: #f5f9fe;
  border: 1px solid #e3edf6;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.summary-card strong {
  font-size: 16px;
  color: var(--text-main);
  line-height: 1;
}

.summary-card.highlight {
  background: #fff7eb;
  border-color: #fde0be;
}

.summary-card.highlight strong {
  color: #c2410c;
}

.ai-fallback-note {
  margin: 12px 16px 0;
  padding: 9px 11px;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  line-height: 1.5;
}

.conversation-list {
  flex: 1;
  padding: 12px;
  overflow: auto;
}

.conversation-empty {
  margin: 24px 8px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.conversation-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: fade-in 0.4s ease both;
  animation-delay: var(--delay, 0s);
}

.conversation-item:hover {
  transform: translateY(-1px);
  border-color: #cfe0f1;
  background: #f4f9ff;
}

.conversation-item.active {
  background: linear-gradient(135deg, #e7f1ff, #e6fbf8);
  border-color: #bdd8f8;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-weight: 700;
  color: #0b4d8f;
  background: linear-gradient(135deg, #dbeafe, #cffafe);
}

.avatar-media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.avatar-fallback {
  line-height: 1;
}

.conversation-content {
  min-width: 0;
}

.top-line,
.bottom-line,
.tags-line {
  display: flex;
  align-items: center;
}

.top-line {
  justify-content: space-between;
  gap: 8px;
}

.name {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-secondary);
}

.bottom-line {
  margin-top: 4px;
  gap: 8px;
}

.preview,
.typing {
  min-width: 0;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typing {
  color: var(--teal);
}

.unread {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
}

.tags-line {
  margin-top: 6px;
  justify-content: space-between;
  gap: 8px;
}

.mode-tag {
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
}

.mode-tag.group {
  color: #0369a1;
  background: #e0f2fe;
}

.mode-tag.direct {
  color: #0f766e;
  background: #dffaf6;
}

.mode-tag.ai {
  color: #4338ca;
  background: #eef2ff;
}

.pin-btn {
  border: 1px dashed transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  opacity: 0;
  padding: 0 6px;
  height: 20px;
  transition: all 0.2s ease;
}

.conversation-item:hover .pin-btn,
.conversation-item.pinned .pin-btn {
  opacity: 1;
}

.pin-btn:hover {
  color: var(--brand);
  border-color: #b8d5f7;
}

.chat {
  display: flex;
  flex-direction: column;
  min-height: 680px;
  overflow: hidden;
}

.chat-empty {
  flex: 1;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
}

.chat-empty h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-main);
}

.chat-empty p {
  margin: 8px 0 0;
  font-size: 13px;
}

.chat-header {
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.66);
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
}

.chat-sub {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.status.group {
  color: #0369a1;
}

.status.direct {
  color: #0f766e;
}

.status.ai {
  color: #4338ca;
}

.typing-text {
  color: var(--brand);
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-session-chip {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  color: #4338ca;
  background: #eef2ff;
  font-size: 12px;
  font-weight: 600;
}

.chat-body {
  position: relative;
  flex: 1;
  overflow: auto;
  padding: 18px;
  background:
    linear-gradient(180deg, #fbfdff 0%, #edf6ff 55%, #eefcf8 100%),
    linear-gradient(90deg, rgba(12, 116, 230, 0.02), transparent 30%);
}

.new-hint {
  position: sticky;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--teal));
  box-shadow: 0 8px 18px rgba(12, 116, 230, 0.24);
}

.time-divider {
  text-align: center;
  margin: 14px 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.system-message {
  width: fit-content;
  margin: 10px auto;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e6edf5;
  color: #506780;
  font-size: 12px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
  animation: bubble-in 0.2s ease;
}

.message-row.self {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #0b4d8f;
  background: #dceeff;
}

.message-row.self .message-avatar {
  color: #0f766e;
  background: #d8fbf1;
}

.message-content {
  max-width: min(72%, 620px);
}

.sender {
  margin: 0 0 6px 2px;
  font-size: 12px;
  color: var(--text-secondary);
}

.bubble {
  border-radius: 14px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #deebf7;
  box-shadow: 0 8px 16px rgba(16, 38, 63, 0.06);
}

.message-row.self .bubble {
  background: #e4f8f3;
  border-color: #b7ece0;
}

.text {
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-main);
  white-space: pre-wrap;
}

.typing-cursor {
  display: inline-block;
  width: 1px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -2px;
  background: currentColor;
  animation: blink-cursor 0.9s steps(1) infinite;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #92400e;
  background: #fef2d2;
}

.file-info {
  min-width: 0;
}

.file-name {
  font-size: 13px;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-tip {
  margin-top: 2px;
  font-size: 11px;
  color: var(--brand);
}

.image-card {
  width: 220px;
  max-width: 100%;
  height: 120px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #134e7f;
  font-size: 13px;
  background: linear-gradient(135deg, #dbeafe, #dffaf6);
}

.meta {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  font-size: 11px;
  color: var(--text-secondary);
}

.typing-row {
  margin: 2px 0 14px 44px;
  display: inline-flex;
  gap: 5px;
}

.typing-row span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7aa0c7;
  animation: typing 1.1s infinite ease-in-out;
}

.typing-row span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-row span:nth-child(3) {
  animation-delay: 0.3s;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 140px;
  color: var(--text-secondary);
  font-size: 13px;
}

.composer {
  padding: 14px 16px 16px;
  border-top: 1px solid var(--line);
  background: var(--panel-solid);
}

.composer-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.tool-btn {
  height: 30px;
  border: 1px solid #d3e2ef;
  border-radius: 10px;
  background: #f5faff;
  color: var(--text-main);
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  border-color: #b3d2f1;
  background: #eaf4ff;
}

.file-input {
  display: none;
}

:deep(.composer .el-textarea__inner) {
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: none;
}

.composer-footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.composer-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.count {
  font-size: 12px;
  color: var(--text-secondary);
}

.count.danger {
  color: var(--danger);
}

.members {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.members-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.members-head h4 {
  margin: 0;
  font-size: 16px;
}

.members-head .count {
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #e6f0fb;
  color: #0f4f8f;
  font-size: 12px;
}

.members-sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.members-list {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
}

.members-empty {
  padding: 18px 8px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
}

.member-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 12px;
  background: #f6faff;
  border: 1px solid #e4edf7;
}

.member-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  color: #0f4f8f;
  background: #ddeafb;
}

.member-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
}

.self-tag {
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  color: #0f766e;
  background: #d7faf2;
}

.member-status {
  font-size: 12px;
  color: var(--text-secondary);
}

.member-status.online {
  color: #15803d;
}

.member-status.busy {
  color: #d97706;
}

.member-status.offline {
  color: #94a3b8;
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes bubble-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  50% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@media (max-width: 1320px) {
  .im-shell {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .members {
    display: none;
  }
}

@media (max-width: 980px) {
  .im-page {
    padding: 14px;
  }

  .im-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .im-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    max-height: 360px;
  }

  .chat {
    min-height: 600px;
  }
}

@media (max-width: 680px) {
  .chat-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chat-actions {
    width: 100%;
  }

  .chat-actions :deep(.el-button) {
    flex: 1;
  }

  .message-content {
    max-width: 84%;
  }

  .composer-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .composer-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@keyframes blink-cursor {
  0%,
  49% {
    opacity: 1;
  }

  50%,
  100% {
    opacity: 0;
  }
}
</style>
