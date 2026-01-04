<template>
  <div class="im-page">
    <header class="im-header">
      <div class="brand">
        <span class="brand-mark">Pulse</span>
        <span class="brand-title">即时通信</span>
      </div>
      <div class="header-actions">
        <div class="ws-state">
          <span class="dot" :class="{ online: connected }"></span>
          <span>{{ connected ? 'WebSocket 已连接' : 'WebSocket 已断开' }}</span>
        </div>
        <el-button size="small" @click="toggleConnection">
          {{ connected ? '断开' : '重连' }}
        </el-button>
      </div>
    </header>

    <section class="im-shell">
      <aside class="sidebar">
        <div class="search">
          <el-input v-model="keyword" placeholder="搜索会话或成员" clearable />
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

        <div class="conversation-list">
          <div
            v-for="conv in filteredConversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conv.id === activeId, pinned: conv.pinned }"
            @click="selectConversation(conv.id)"
          >
            <div class="avatar">
              <span>{{ conv.avatar }}</span>
            </div>
            <div class="conversation-info">
              <div class="conversation-title">
                <span>{{ conv.title }}</span>
                <span v-if="conv.mode === 'group'" class="mode-tag">群聊</span>
                <span v-else class="mode-tag outline">单聊</span>
              </div>
              <div class="conversation-preview">
                <span v-if="conv.typing" class="typing">对方正在输入…</span>
                <span v-else>{{ conv.lastMessage }}</span>
              </div>
            </div>
            <div class="conversation-meta">
              <span class="time">{{ formatListTime(conv.lastTime) }}</span>
              <span v-if="conv.unread" class="unread">{{ conv.unread }}</span>
              <button
                class="pin-btn"
                type="button"
                @click.stop="togglePin(conv.id)"
              >
                {{ conv.pinned ? '取消置顶' : '置顶' }}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main class="chat">
        <div v-if="!activeConversation" class="chat-empty">
          请选择一个会话开始聊天
        </div>
        <template v-else>
          <header class="chat-header">
            <div class="chat-title">
              <h3>{{ activeConversation.title }}</h3>
              <div class="chat-sub">
                <span class="status" :class="statusClass(activeConversation)">
                  {{ activeConversation.mode === 'group' ? '群聊' : '单聊' }}
                </span>
                <span class="member-count">
                  {{ activeConversation.members.length }} 人
                </span>
              </div>
            </div>
            <div class="chat-actions">
              <el-button size="small" @click="markRead(activeConversation.id)"
                >全部已读</el-button
              >
              <el-button size="small" type="primary">发起会议</el-button>
            </div>
          </header>

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
              暂无消息，开始聊点什么吧。
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
                  <span>{{ msg.senderName.slice(0, 1) }}</span>
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
                  <div class="bubble">
                    <div v-if="msg.type === 'file'" class="file-card">
                      <div class="file-icon">DOC</div>
                      <div class="file-name">
                        {{ msg.fileName || msg.content }}
                      </div>
                      <span class="file-tag">点击下载</span>
                    </div>
                    <div v-else-if="msg.type === 'image'" class="image-card">
                      <span>图片消息</span>
                    </div>
                    <div v-else class="text">{{ msg.content }}</div>
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
            <div v-if="activeConversation?.typing" class="typing-row">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <footer class="composer">
            <div class="composer-tools">
              <button class="tool-btn" type="button" @click="appendEmoji('😀')">
                😀 表情
              </button>
              <button class="tool-btn" type="button" @click="appendEmoji('✨')">
                ✨ 快捷语
              </button>
              <button class="tool-btn" type="button" @click="triggerFile">
                📎 上传
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
              :rows="3"
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              @keydown.enter.exact.prevent="submitMessage"
              @keydown.ctrl.enter.prevent="submitMessage"
              @keydown.meta.enter.prevent="submitMessage"
            />
            <div class="composer-footer">
              <span class="hint">当前会话：{{ activeConversation.title }}</span>
              <div class="composer-actions">
                <span class="count">{{ draft.length }}/500</span>
                <el-button type="primary" @click="submitMessage"
                  >发送</el-button
                >
              </div>
            </div>
          </footer>
        </template>
      </main>

      <aside class="members">
        <div class="members-title">
          参与成员
          <span class="count">{{
            activeConversation?.members.length || 0
          }}</span>
        </div>
        <div class="members-list">
          <div
            v-for="member in activeMembers"
            :key="member.id"
            class="member-item"
          >
            <div class="member-avatar">{{ member.avatar }}</div>
            <div class="member-info">
              <div class="member-name">
                {{ member.name }}
                <span v-if="member.id === currentUser?.id" class="self-tag"
                  >我</span
                >
              </div>
              <div class="member-status" :class="member.status">
                {{ statusLabel(member.status) }}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useImStore } from '@/stores'

type TabKey = 'all' | 'unread' | 'group'

const imStore = useImStore()
const keyword = ref('')
const draft = ref('')
const activeTab = ref<TabKey>('all')
const messageWrapRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

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
  currentUser
} = storeToRefs(imStore)

const activeMembers = computed(() =>
  (activeConversation.value?.members || []).filter((item) => Boolean(item))
)
const newMessageCount = ref(0)
const lastMessageCount = ref(0)
const autoScroll = ref(true)

const filteredConversations = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  const sorted = [...imStore.conversations].sort((a, b) => {
    const pinned = Number(b.pinned) - Number(a.pinned)
    if (pinned !== 0) return pinned
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
  if (date.toDateString() === today.toDateString()) return formatTime(value)
  return formatDate(value)
}

const formatTimeGroup = (value: number) => {
  const date = new Date(value)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  return isToday
    ? `今天 ${formatTime(value)}`
    : `${formatDate(value)} ${formatTime(value)}`
}

const formatMessageTime = (value: number) => formatTime(value)

const formatStatus = (status: string) => {
  if (status === 'sending') return '发送中'
  if (status === 'sent') return '已送达'
  return '已读'
}

const statusLabel = (status: string) => {
  if (status === 'online') return '在线'
  if (status === 'busy') return '忙碌'
  return '离线'
}

const statusClass = (conv: { mode: string }) =>
  conv.mode === 'group' ? 'group' : 'direct'

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
  const text = draft.value.trim()
  if (!text) return
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
  () => activeId.value,
  () => {
    newMessageCount.value = 0
    autoScroll.value = true
    lastMessageCount.value = activeMessages.value.length
  }
)
</script>

<style lang="scss" scoped>
:root {
  --bg-main: #f4f7fb;
  --bg-panel: #ffffff;
  --bg-muted: #f1f5f9;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --primary: #2563eb;
  --primary-soft: #e0e7ff;
  --border: #e2e8f0;
  --shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.im-page {
  min-height: 100vh;
  padding: 24px;
  font-family: 'IBM Plex Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: radial-gradient(
    circle at top left,
    #f8fafc 0%,
    #e2e8f0 55%,
    #f8fafc 100%
  );
  color: var(--text-main);
}

.im-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-radius: 18px;
  background: var(--bg-panel);
  box-shadow: var(--shadow);
  margin-bottom: 18px;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.brand-mark {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
}

.brand-title {
  font-size: 16px;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.ws-state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5f5;
}

.dot.online {
  background: #22c55e;
}

.im-shell {
  display: grid;
  grid-template-columns: 260px 1fr 240px;
  gap: 16px;
}

.sidebar,
.members,
.chat {
  background: var(--bg-panel);
  border-radius: 18px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px 0;
}

.tab-btn {
  border: 1px solid transparent;
  background: var(--bg-muted);
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-btn.active {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: #c7d2fe;
}

.tab-badge {
  background: var(--primary);
  color: #fff;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
}

.conversation-list {
  overflow: auto;
  padding: 12px 12px 16px;
}

.conversation-item {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.conversation-item:hover {
  background: #f1f5ff;
  transform: translateY(-1px);
}

.conversation-item.active {
  background: #e0ecff;
}

.conversation-item.pinned .conversation-title span:first-child {
  font-weight: 600;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #e0e7ff;
  display: grid;
  place-items: center;
  color: var(--primary);
  font-weight: 700;
}

.conversation-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-main);
}

.mode-tag {
  font-size: 11px;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 6px;
  border-radius: 999px;
}

.mode-tag.outline {
  color: #0f172a;
  background: #e2e8f0;
}

.conversation-preview {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typing {
  color: var(--primary);
}

.conversation-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.pin-btn {
  border: 1px dashed transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 999px;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.conversation-item:hover .pin-btn {
  opacity: 1;
}

.pin-btn:hover {
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.unread {
  min-width: 20px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  text-align: center;
}

.chat {
  display: flex;
  flex-direction: column;
  min-height: 620px;
}

.chat-header {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title h3 {
  margin: 0;
  font-size: 18px;
}

.chat-sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  gap: 12px;
}

.status.group {
  color: #0ea5e9;
}

.status.direct {
  color: #16a34a;
}

.chat-body {
  flex: 1;
  padding: 18px 20px;
  overflow: auto;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  position: relative;
}

.new-hint {
  position: sticky;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  border: none;
  padding: 6px 12px;
  border-radius: 999px;
  background: #1d4ed8;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  margin-bottom: 12px;
  box-shadow: 0 6px 16px rgba(29, 78, 216, 0.25);
}

.time-divider {
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  margin: 16px 0;
}

.system-message {
  text-align: center;
  font-size: 12px;
  color: #475569;
  background: #e2e8f0;
  border-radius: 999px;
  padding: 6px 12px;
  width: fit-content;
  margin: 12px auto;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  animation: fadeInUp 0.2s ease;
}

.message-row.self {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #dbeafe;
  display: grid;
  place-items: center;
  font-weight: 600;
  color: #1e40af;
}

.message-row.self .message-avatar {
  background: #d1fae5;
  color: #047857;
}

.message-content {
  max-width: 70%;
}

.sender {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.bubble {
  background: #fff;
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.message-row.self .bubble {
  background: #dbeafe;
}

.text {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.5;
}

.file-card,
.image-card {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
}

.file-tag {
  margin-left: auto;
  font-size: 11px;
  color: #2563eb;
}

.file-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #fef3c7;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #92400e;
}

.meta {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.typing-row {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  margin: 6px 0 12px 48px;
}

.typing-row span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typing 1.2s infinite ease-in-out;
}

.typing-row span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-row span:nth-child(3) {
  animation-delay: 0.4s;
}

.composer {
  border-top: 1px solid var(--border);
  padding: 14px 18px 18px;
  background: #fff;
}

.composer-tools {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.tool-btn {
  border: 1px solid var(--border);
  background: var(--bg-muted);
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
}

.file-input {
  display: none;
}

.composer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.composer-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.count {
  font-size: 12px;
  color: var(--text-muted);
}

.hint {
  color: var(--text-muted);
  font-size: 12px;
}

.members {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.members-title {
  font-weight: 600;
  display: flex;
  justify-content: space-between;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 12px;
  background: #f8fafc;
}

.member-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #e2e8f0;
  display: grid;
  place-items: center;
  font-weight: 600;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.self-tag {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #3730a3;
}

.member-status {
  color: var(--text-muted);
}

.member-status.online {
  color: #16a34a;
}

.member-status.busy {
  color: #f97316;
}

.member-status.offline {
  color: #94a3b8;
}

.chat-empty,
.empty-state {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-size: 14px;
}

@keyframes fadeInUp {
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
    opacity: 0.6;
  }
  50% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@media (max-width: 1080px) {
  .im-shell {
    grid-template-columns: 220px 1fr;
  }

  .members {
    display: none;
  }
}

@media (max-width: 820px) {
  .im-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .chat {
    order: 1;
    min-height: 520px;
  }
}
</style>
