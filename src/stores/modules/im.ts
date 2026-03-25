import { computed, reactive, ref } from 'vue'
import {
  connectImSession,
  disconnectImSession,
  getConversationMessages,
  getImBootstrap,
  markConversationRead,
  sendConversationMessage,
  toggleConversationPin,
  type ImConversationItem as ConversationItem,
  type ImMessageItem as MessageItem,
  type ImUserProfile as UserProfile,
  type MessageStatus,
  type MessageType
} from '@/services/im'

const createTempMessageId = () =>
  `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useImStore = defineStore('im', () => {
  const conversations = ref<ConversationItem[]>([])
  const messages = reactive<Record<string, MessageItem[]>>({})
  const activeId = ref('')
  const connected = ref(false)
  const currentUser = ref<UserProfile | null>(null)
  const loadedMessageIds = ref<string[]>([])

  const activeConversation = computed(
    () => conversations.value.find((item) => item.id === activeId.value) || null
  )

  const activeMessages = computed(() => messages[activeId.value] || [])

  const totalUnread = computed(() =>
    conversations.value.reduce((sum, item) => sum + (item.unread || 0), 0)
  )

  const messageLoaded = (convId: string) =>
    loadedMessageIds.value.includes(convId)

  const rememberLoaded = (convId: string) => {
    if (!messageLoaded(convId)) {
      loadedMessageIds.value = [...loadedMessageIds.value, convId]
    }
  }

  const loadMessages = async (convId: string) => {
    const response = await getConversationMessages(convId)
    if (response.code !== 200) return
    messages[convId] = response.data.list
    rememberLoaded(convId)
  }

  const loadBootstrap = async () => {
    const response = await getImBootstrap()
    if (response.code !== 200) return

    currentUser.value = response.data.currentUser
    conversations.value = response.data.conversations
    activeId.value =
      response.data.activeConversationId ||
      response.data.conversations[0]?.id ||
      ''

    if (activeId.value) {
      await loadMessages(activeId.value)
    }
  }

  const markRead = async (convId: string) => {
    const conv = conversations.value.find((item) => item.id === convId)
    if (!conv) return

    conv.unread = 0
    messages[convId]?.forEach((msg) => {
      if (msg.senderId !== currentUser.value?.id) {
        msg.status = 'read'
      }
    })
    await markConversationRead(convId)
  }

  const selectConversation = async (convId: string) => {
    activeId.value = convId
    if (!messageLoaded(convId)) {
      await loadMessages(convId)
    }
    await markRead(convId)
  }

  const updateConversationPreview = (
    convId: string,
    next: Pick<ConversationItem, 'lastMessage' | 'lastTime'>
  ) => {
    const conv = conversations.value.find((item) => item.id === convId)
    if (!conv) return
    conv.lastMessage = next.lastMessage
    conv.lastTime = next.lastTime
  }

  const sendMessage = async (
    content: string,
    type: MessageType = 'text',
    fileName?: string
  ) => {
    if (!activeId.value || !currentUser.value) return
    if (!content.trim()) return

    const tempMessage: MessageItem = {
      id: createTempMessageId(),
      convId: activeId.value,
      senderId: currentUser.value.id,
      senderName: currentUser.value.name,
      content,
      type,
      createdAt: Date.now(),
      status: 'sending',
      fileName
    }

    if (!messages[activeId.value]) {
      messages[activeId.value] = []
    }
    messages[activeId.value]!.push(tempMessage)
    updateConversationPreview(activeId.value, {
      lastMessage: fileName || content,
      lastTime: tempMessage.createdAt
    })

    const response = await sendConversationMessage({
      convId: activeId.value,
      content,
      type,
      fileName
    }).catch(() => null)

    if (!response || response.code !== 200) {
      tempMessage.status = 'read' as MessageStatus
      return
    }

    const list = messages[activeId.value] || []
    const index = list.findIndex((item) => item.id === tempMessage.id)
    if (index >= 0) {
      list.splice(index, 1, response.data)
    }
    updateConversationPreview(activeId.value, {
      lastMessage: response.data.fileName || response.data.content,
      lastTime: response.data.createdAt
    })
  }

  const togglePin = async (convId: string) => {
    const conv = conversations.value.find((item) => item.id === convId)
    if (!conv) return
    const nextPinned = !conv.pinned
    conv.pinned = nextPinned
    await toggleConversationPin(convId, { pinned: nextPinned })
  }

  const pushSystemMessage = (convId: string, content: string) => {
    if (!messages[convId]) {
      messages[convId] = []
    }
    messages[convId]!.push({
      id: createTempMessageId(),
      convId,
      senderId: 'system',
      senderName: '系统',
      content,
      type: 'system',
      createdAt: Date.now(),
      status: 'sent'
    })
  }

  const connect = async () => {
    if (connected.value) return
    await connectImSession().catch(() => null)
    connected.value = true
    await loadBootstrap()
  }

  const disconnect = async () => {
    if (!connected.value) return
    await disconnectImSession().catch(() => null)
    connected.value = false
  }

  return {
    conversations,
    messages,
    activeId,
    activeConversation,
    activeMessages,
    totalUnread,
    connected,
    currentUser,
    selectConversation,
    sendMessage,
    connect,
    disconnect,
    markRead,
    togglePin,
    pushSystemMessage,
    loadBootstrap,
    loadMessages
  }
})
