import { computed, reactive, ref } from 'vue'
import {
  AI_ASSISTANT_USER_ID,
  AI_CONVERSATION_ID,
  CHAT_INIT_ERROR_MESSAGE,
  CHAT_MESSAGE_ERROR_MESSAGE,
  CHAT_SEND_ERROR_MESSAGE,
  createAiConversation,
  getHumanOnlineUsers,
  isAiFallbackActive,
  markMessageFailed,
  normalizeConversation,
  normalizeImError,
  replaceMessageById,
  resolveMemberLiveStatus,
  resolveLoggedInImUser
} from './imState'
import { useUserStore } from './use'
import { chatWithAI, type AIMessage } from '@/services/ai'
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
  type ImUserSummary as UserSummary,
  type ImUserProfile as UserProfile,
  type MessageType
} from '@/services/im'

const createTempMessageId = () =>
  `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms))

const resolveChunkDelay = (chunk: string) => {
  if (/[\r\n]/.test(chunk)) return 45
  if (/[\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u3001,.!?;]/.test(chunk)) return 70
  return 16
}

const getStreamChunkSize = (remaining: number) => {
  if (remaining > 80) return 3
  if (remaining > 24) return 2
  return 1
}

const AI_SYSTEM_PROMPT =
  '\u4f60\u662f IM \u804a\u5929\u754c\u9762\u91cc\u7684 AI \u52a9\u624b\u3002\u5f53\u524d\u6682\u65e0\u4eba\u5de5\u5728\u7ebf\uff0c\u8bf7\u7528\u7b80\u6d01\u3001\u53ef\u9760\u7684\u4e2d\u6587\u5148\u63a5\u5f85\u7528\u6237\uff1b\u5982\u679c\u95ee\u9898\u9700\u8981\u4eba\u5de5\u5904\u7406\uff0c\u8bf7\u8bf4\u660e\u53ef\u4ee5\u7a0d\u540e\u8f6c\u4eba\u5de5\u7ee7\u7eed\u8ddf\u8fdb\u3002'

export const useImStore = defineStore('im', () => {
  const conversations = ref<ConversationItem[]>([])
  const onlineUsers = ref<UserSummary[]>([])
  const messages = reactive<Record<string, MessageItem[]>>({})
  const activeId = ref('')
  const connected = ref(false)
  const currentUser = ref<UserProfile | null>(null)
  const loadedMessageIds = ref<string[]>([])
  const localConversationIds = ref<string[]>([])
  const initLoading = ref(false)
  const messageLoading = ref(false)
  const initError = ref('')
  const messageError = ref('')

  const activeConversation = computed(
    () => conversations.value.find((item) => item.id === activeId.value) || null
  )

  const activeMessages = computed(() => messages[activeId.value] || [])

  const totalUnread = computed(() =>
    conversations.value.reduce((sum, item) => sum + (item.unread || 0), 0)
  )

  const humanOnlineUsers = computed(() =>
    getHumanOnlineUsers(currentUser.value, onlineUsers.value)
  )

  const aiFallbackActive = computed(() =>
    isAiFallbackActive(currentUser.value, onlineUsers.value)
  )

  const messageLoaded = (convId: string) =>
    loadedMessageIds.value.includes(convId)

  const isAiConversation = (convId: string) => convId === AI_CONVERSATION_ID

  const rememberLoaded = (convId: string) => {
    if (!messageLoaded(convId)) {
      loadedMessageIds.value = [...loadedMessageIds.value, convId]
    }
  }

  const rememberLocalConversation = (convId: string) => {
    if (!localConversationIds.value.includes(convId)) {
      localConversationIds.value = [...localConversationIds.value, convId]
    }
  }

  const isLocalConversation = (convId: string) =>
    localConversationIds.value.includes(convId)

  const ensureAiConversation = () => {
    if (!currentUser.value || !aiFallbackActive.value) return

    const existing = conversations.value.find(
      (item) => item.id === AI_CONVERSATION_ID
    )
    const aiConversation = createAiConversation(currentUser.value)

    if (existing) {
      Object.assign(existing, {
        ...aiConversation,
        lastMessage: existing.lastMessage || aiConversation.lastMessage,
        lastTime: existing.lastTime || aiConversation.lastTime,
        typing: existing.typing
      })
    } else {
      conversations.value = [aiConversation, ...conversations.value]
    }

    if (!messages[AI_CONVERSATION_ID]) {
      messages[AI_CONVERSATION_ID] = [
        {
          id: createTempMessageId(),
          convId: AI_CONVERSATION_ID,
          senderId: AI_ASSISTANT_USER_ID,
          senderName: 'AI',
          content:
            '\u5f53\u524d\u6682\u65e0\u4eba\u5de5\u5728\u7ebf\uff0c\u6211\u53ef\u4ee5\u5148\u5e2e\u4f60\u89e3\u7b54\u3002',
          type: 'text',
          createdAt: Date.now(),
          status: 'sent'
        }
      ]
    }

    rememberLoaded(AI_CONVERSATION_ID)
    rememberLocalConversation(AI_CONVERSATION_ID)
  }

  const getDirectConversationByMember = (member: UserProfile) =>
    conversations.value.find(
      (item) =>
        item.mode === 'direct' &&
        item.members.some(
          (target) => target.id === member.id || target.name === member.name
        )
    )

  const loadMessages = async (convId: string) => {
    if (isAiConversation(convId)) {
      rememberLoaded(convId)
      return true
    }

    messageLoading.value = true
    messageError.value = ''

    try {
      const response = await getConversationMessages(convId)
      if (response.code !== 200) return false
      messages[convId] = response.data.list
      rememberLoaded(convId)
      return true
    } catch (error) {
      messageError.value = normalizeImError(error, CHAT_MESSAGE_ERROR_MESSAGE)
      return false
    } finally {
      messageLoading.value = false
    }
  }

  const loadBootstrap = async () => {
    initLoading.value = true
    initError.value = ''

    try {
      const response = await getImBootstrap()
      if (response.code !== 200) return false

      const userStore = useUserStore()
      currentUser.value = resolveLoggedInImUser(
        userStore.user,
        response.data.currentUser
      )
      onlineUsers.value = response.data.onlineUsers || []
      conversations.value = response.data.conversations.map(
        normalizeConversation
      )
      ensureAiConversation()
      activeId.value = aiFallbackActive.value
        ? AI_CONVERSATION_ID
        : response.data.activeConversationId ||
          response.data.conversations[0]?.id ||
          ''

      if (activeId.value && !isAiConversation(activeId.value)) {
        await loadMessages(activeId.value)
      }

      return true
    } catch (error) {
      initError.value = normalizeImError(error, CHAT_INIT_ERROR_MESSAGE)
      return false
    } finally {
      initLoading.value = false
    }
  }

  const markRead = async (convId: string) => {
    if (isAiConversation(convId)) return

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
    messageError.value = ''
    activeId.value = convId

    if (isAiConversation(convId)) {
      rememberLoaded(convId)
      return
    }

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

  const streamAssistantMessage = async (
    convId: string,
    content: string,
    senderName: string
  ) => {
    if (!messages[convId]) {
      messages[convId] = []
    }

    const assistantMessage: MessageItem = {
      id: createTempMessageId(),
      convId,
      senderId: AI_ASSISTANT_USER_ID,
      senderName,
      content: '',
      type: 'text',
      createdAt: Date.now(),
      status: 'sent'
    }

    messages[convId]!.push(assistantMessage)
    updateConversationPreview(convId, {
      lastMessage: '',
      lastTime: assistantMessage.createdAt
    })

    let cursor = 0

    while (cursor < content.length) {
      const remaining = content.length - cursor
      const chunkSize = getStreamChunkSize(remaining)
      const chunk = content.slice(cursor, cursor + chunkSize)

      assistantMessage.content += chunk
      updateConversationPreview(convId, {
        lastMessage: assistantMessage.content,
        lastTime: assistantMessage.createdAt
      })
      cursor += chunk.length
      await wait(resolveChunkDelay(chunk))
    }
  }

  const toAiMessages = (convId: string): AIMessage[] => {
    const history = (messages[convId] || [])
      .filter((item) => item.type === 'text' && item.status !== 'failed')
      .slice(-12)
      .map<AIMessage>((item) => ({
        role: item.senderId === currentUser.value?.id ? 'user' : 'assistant',
        content: item.content
      }))

    return [
      {
        role: 'system',
        content: AI_SYSTEM_PROMPT
      },
      ...history
    ]
  }

  const sendAiMessage = async (
    content: string,
    type: MessageType,
    fileName?: string
  ) => {
    if (!currentUser.value) return

    if (type !== 'text') {
      pushSystemMessage(
        AI_CONVERSATION_ID,
        '\u0041\u0049\u0020\u52a9\u624b\u6682\u4e0d\u5904\u7406\u9644\u4ef6\uff0c\u8bf7\u76f4\u63a5\u8f93\u5165\u6587\u5b57\u95ee\u9898\u3002'
      )
      return
    }

    const conv = conversations.value.find(
      (item) => item.id === AI_CONVERSATION_ID
    )
    const userMessage: MessageItem = {
      id: createTempMessageId(),
      convId: AI_CONVERSATION_ID,
      senderId: currentUser.value.id,
      senderName: currentUser.value.name,
      content,
      type,
      createdAt: Date.now(),
      status: 'sent',
      fileName
    }

    if (!messages[AI_CONVERSATION_ID]) {
      messages[AI_CONVERSATION_ID] = []
    }

    messages[AI_CONVERSATION_ID]!.push(userMessage)
    updateConversationPreview(AI_CONVERSATION_ID, {
      lastMessage: content,
      lastTime: userMessage.createdAt
    })

    if (conv) conv.typing = true

    try {
      const reply = await chatWithAI(toAiMessages(AI_CONVERSATION_ID), {
        temperature: 0.6,
        maxTokens: 800
      })
      await streamAssistantMessage(AI_CONVERSATION_ID, reply, 'AI')
    } catch (error) {
      const failedMessage: MessageItem = {
        id: createTempMessageId(),
        convId: AI_CONVERSATION_ID,
        senderId: AI_ASSISTANT_USER_ID,
        senderName: 'AI',
        content: normalizeImError(
          error,
          '\u0041\u0049\u0020\u52a9\u624b\u6682\u65f6\u65e0\u6cd5\u56de\u590d\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002'
        ),
        type: 'text',
        createdAt: Date.now(),
        status: 'failed'
      }
      messages[AI_CONVERSATION_ID]!.push(failedMessage)
      updateConversationPreview(AI_CONVERSATION_ID, {
        lastMessage:
          '\u0041\u0049\u0020\u52a9\u624b\u6682\u65f6\u65e0\u6cd5\u56de\u590d',
        lastTime: failedMessage.createdAt
      })
    } finally {
      if (conv) conv.typing = false
    }
  }

  const openDirectConversation = async (member: UserProfile) => {
    if (!currentUser.value) return ''

    const existing = getDirectConversationByMember(member)
    if (existing) {
      await selectConversation(existing.id)
      return existing.id
    }

    const convId = `local-direct-${member.id}`
    const localConversation = conversations.value.find(
      (item) => item.id === convId
    )

    if (!localConversation) {
      conversations.value = [
        {
          id: convId,
          title: member.name,
          avatar: member.avatar,
          mode: 'direct',
          members: [currentUser.value, member],
          lastMessage:
            member.status === 'online'
              ? '\u53ef\u4ee5\u5f00\u59cb\u804a\u5929'
              : '\u5bf9\u65b9\u79bb\u7ebf\uff0c\u53ef\u5148\u7559\u8a00',
          lastTime: Date.now(),
          unread: 0,
          pinned: false,
          typing: false
        },
        ...conversations.value
      ]
    }

    if (!messages[convId]) {
      messages[convId] = []
    }

    rememberLoaded(convId)
    rememberLocalConversation(convId)
    messageError.value = ''
    activeId.value = convId
    return convId
  }

  const sendMessage = async (
    content: string,
    type: MessageType = 'text',
    fileName?: string
  ) => {
    if (!activeId.value || !currentUser.value) return
    if (!content.trim()) return

    if (isAiConversation(activeId.value)) {
      await sendAiMessage(content, type, fileName)
      return
    }

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

    if (isLocalConversation(activeId.value)) {
      tempMessage.status = 'sent'
      return
    }

    const response = await sendConversationMessage({
      convId: activeId.value,
      content,
      type,
      fileName,
      senderId: currentUser.value.id
    }).catch(() => null)

    if (!response || response.code !== 200) {
      const list = messages[activeId.value] || []
      replaceMessageById(
        list,
        tempMessage.id,
        markMessageFailed(tempMessage, CHAT_SEND_ERROR_MESSAGE)
      )
      return
    }

    const list = messages[activeId.value] || []
    const sentMessage: MessageItem = {
      ...response.data,
      convId: activeId.value,
      senderId: currentUser.value.id,
      senderName: currentUser.value.name
    }
    replaceMessageById(list, tempMessage.id, sentMessage)
    updateConversationPreview(activeId.value, {
      lastMessage: sentMessage.fileName || sentMessage.content,
      lastTime: sentMessage.createdAt
    })
  }

  const togglePin = async (convId: string) => {
    if (isAiConversation(convId)) return

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
      senderName: '\u7cfb\u7edf',
      content,
      type: 'system',
      createdAt: Date.now(),
      status: 'sent'
    })
  }

  const connect = async () => {
    if (connected.value) return
    initLoading.value = true
    initError.value = ''

    const response = await connectImSession().catch((error) => {
      initError.value = normalizeImError(error, CHAT_INIT_ERROR_MESSAGE)
      return null
    })

    if (!response) {
      connected.value = false
      initLoading.value = false
      return
    }

    connected.value = true
    initLoading.value = false
    await loadBootstrap()
  }

  const disconnect = async () => {
    if (!connected.value) return
    await disconnectImSession().catch(() => null)
    connected.value = false
  }

  return {
    conversations,
    onlineUsers,
    messages,
    activeId,
    activeConversation,
    activeMessages,
    totalUnread,
    connected,
    currentUser,
    localConversationIds,
    initLoading,
    messageLoading,
    initError,
    messageError,
    humanOnlineUsers,
    aiFallbackActive,
    selectConversation,
    sendMessage,
    connect,
    disconnect,
    markRead,
    togglePin,
    openDirectConversation,
    pushSystemMessage,
    loadBootstrap,
    loadMessages,
    resolveLiveStatus: (member: UserProfile) =>
      resolveMemberLiveStatus(member, currentUser.value, onlineUsers.value)
  }
})
