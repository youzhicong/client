type UserStatus = 'online' | 'offline' | 'busy'
type ConversationMode = 'direct' | 'group'
type MessageType = 'text' | 'image' | 'file' | 'system'
type MessageStatus = 'sending' | 'sent' | 'read'

type UserProfile = {
  id: string
  name: string
  avatar: string
  status: UserStatus
}

type MessageItem = {
  id: string
  convId: string
  senderId: string
  senderName: string
  content: string
  type: MessageType
  createdAt: number
  status: MessageStatus
  fileName?: string
}

type ConversationItem = {
  id: string
  title: string
  avatar: string
  mode: ConversationMode
  members: UserProfile[]
  lastMessage: string
  lastTime: number
  unread: number
  pinned?: boolean
  typing?: boolean
}

const createMessageId = () =>
  `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`

const formatPreview = (message: MessageItem) => {
  if (message.type === 'system') return message.content
  if (message.type === 'image') return '[图片]'
  if (message.type === 'file')
    return `[文件] ${message.fileName || message.content}`
  return message.content
}

const createUser = (
  id: string,
  name: string,
  avatar: string,
  status: UserStatus
): UserProfile => ({
  id,
  name,
  avatar,
  status
})

const now = Date.now()

const currentUser = createUser('u-1', '我', '我', 'online')
const users: UserProfile[] = [
  createUser('u-2', '梁欢', 'LH', 'online'),
  createUser('u-3', 'Mia', 'M', 'busy'),
  createUser('u-4', '周培', 'ZP', 'online'),
  createUser('u-5', 'Alice', 'A', 'offline'),
  createUser('u-6', 'Ben', 'B', 'online')
]

const seedMessages = (
  convId: string,
  sender: UserProfile,
  text: string,
  minutesAgo: number
) => ({
  id: createMessageId(),
  convId,
  senderId: sender.id,
  senderName: sender.name,
  content: text,
  type: 'text' as const,
  createdAt: now - minutesAgo * 60 * 1000,
  status: sender.id === currentUser.id ? 'read' : 'sent'
})

const mockConversations: ConversationItem[] = [
  {
    id: 'conv-1',
    title: '产品讨论组',
    avatar: '产',
    mode: 'group',
    members: [currentUser, users[0], users[1], users[2]],
    lastMessage: '今天下午可以同步一下版本节奏吗？',
    lastTime: now - 8 * 60 * 1000,
    unread: 2,
    pinned: true
  },
  {
    id: 'conv-2',
    title: '视觉设计 · Alice',
    avatar: 'A',
    mode: 'direct',
    members: [currentUser, users[3]],
    lastMessage: '新插画已经发你啦，查收一下～',
    lastTime: now - 32 * 60 * 1000,
    unread: 0
  },
  {
    id: 'conv-3',
    title: '前端协作',
    avatar: '前',
    mode: 'group',
    members: [currentUser, users[3], users[4]],
    lastMessage: '我补了一个loading动效',
    lastTime: now - 85 * 60 * 1000,
    unread: 3
  },
  {
    id: 'conv-4',
    title: '运维值班',
    avatar: '运',
    mode: 'group',
    members: [currentUser, users[2], users[4]],
    lastMessage: '刚刚有一次高延迟告警',
    lastTime: now - 180 * 60 * 1000,
    unread: 0
  }
]

const mockMessages: Record<string, MessageItem[]> = {
  'conv-1': [
    seedMessages('conv-1', users[0], '我们可以先对齐一下需求风险。', 60),
    seedMessages('conv-1', users[1], '今天下午可以同步一下版本节奏吗？', 8)
  ],
  'conv-2': [
    seedMessages('conv-2', users[3], '新插画已经发你啦，查收一下～', 32)
  ],
  'conv-3': [
    seedMessages('conv-3', users[4], '我补了一个loading动效', 85),
    seedMessages('conv-3', currentUser, '我会把消息动效再润色下', 72)
  ],
  'conv-4': [seedMessages('conv-4', users[2], '刚刚有一次高延迟告警', 180)]
}

const incomingSamples = [
  '收到，我这边继续推进。',
  '你看这个方案可以吗？',
  '我发一版新的排期。',
  '要不要加一个动效试试？',
  '我补了两张示意图。',
  '等等我加完日志就好。'
]

const incomingFiles = ['产品路线图.pdf', '原型稿-0902.fig', '迭代说明.docx']

const systemSamples = [
  '你已进入会话',
  '已自动同步历史记录',
  '该群聊已开启消息免打扰'
]

export const useImStore = defineStore('im', () => {
  const conversations = ref<ConversationItem[]>(mockConversations)
  const messages = reactive<Record<string, MessageItem[]>>({ ...mockMessages })
  const activeId = ref(conversations.value[0]?.id || '')
  const connected = ref(false)

  let messageTimer: ReturnType<typeof setInterval> | null = null
  let statusTimer: ReturnType<typeof setInterval> | null = null
  const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  const activeConversation = computed(
    () => conversations.value.find((item) => item.id === activeId.value) || null
  )

  const activeMessages = computed(() => messages[activeId.value] || [])

  const totalUnread = computed(() =>
    conversations.value.reduce((sum, item) => sum + (item.unread || 0), 0)
  )

  const markRead = (convId: string) => {
    const conv = conversations.value.find((item) => item.id === convId)
    if (!conv) return
    conv.unread = 0
    const list = messages[convId]
    if (!list) return
    list.forEach((msg) => {
      if (msg.senderId !== currentUser.id) msg.status = 'read'
    })
  }

  const selectConversation = (convId: string) => {
    activeId.value = convId
    markRead(convId)
  }

  const pushMessage = (msg: MessageItem, incoming: boolean) => {
    if (!messages[msg.convId]) messages[msg.convId] = []
    messages[msg.convId].push(msg)

    const conv = conversations.value.find((item) => item.id === msg.convId)
    if (conv) {
      conv.lastMessage = formatPreview(msg)
      conv.lastTime = msg.createdAt
      if (incoming && msg.convId !== activeId.value) {
        conv.unread += 1
      }
      if (incoming && msg.convId === activeId.value) {
        markRead(msg.convId)
      }
    }
  }

  const sendMessage = (
    content: string,
    type: MessageType = 'text',
    fileName?: string
  ) => {
    if (!activeId.value) return
    if (!content.trim()) return
    const msg: MessageItem = {
      id: createMessageId(),
      convId: activeId.value,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      type,
      createdAt: Date.now(),
      status: 'sending',
      fileName
    }
    pushMessage(msg, false)
    window.setTimeout(() => {
      msg.status = 'sent'
    }, 380)
    window.setTimeout(() => {
      if (msg.convId === activeId.value) msg.status = 'read'
    }, 1800)
  }

  const setTyping = (convId: string, typing: boolean) => {
    const conv = conversations.value.find((item) => item.id === convId)
    if (!conv) return
    conv.typing = typing
  }

  const pushSystemMessage = (convId: string, content: string) => {
    const msg: MessageItem = {
      id: createMessageId(),
      convId,
      senderId: 'system',
      senderName: '系统',
      content,
      type: 'system',
      createdAt: Date.now(),
      status: 'sent'
    }
    pushMessage(msg, true)
  }

  const receiveMessage = (conv: ConversationItem) => {
    const candidates = conv.members.filter(
      (item): item is UserProfile => Boolean(item) && item.id !== currentUser.id
    )
    const sender =
      candidates[Math.floor(Math.random() * candidates.length)] || users[0]
    const random = Math.random()
    const isFile = random > 0.82
    const isImage = random > 0.68 && random <= 0.82
    const text =
      incomingSamples[Math.floor(Math.random() * incomingSamples.length)]
    const fileName =
      incomingFiles[Math.floor(Math.random() * incomingFiles.length)]
    const msg: MessageItem = {
      id: createMessageId(),
      convId: conv.id,
      senderId: sender.id,
      senderName: sender.name,
      content: isFile ? fileName : text,
      type: isFile ? 'file' : isImage ? 'image' : 'text',
      createdAt: Date.now(),
      status: 'sent',
      fileName: isFile ? fileName : undefined
    }
    pushMessage(msg, true)
  }

  const togglePin = (convId: string) => {
    const conv = conversations.value.find((item) => item.id === convId)
    if (!conv) return
    conv.pinned = !conv.pinned
  }

  const toggleRandomStatus = () => {
    const target = users[Math.floor(Math.random() * users.length)]
    if (!target) return
    const next =
      target.status === 'online'
        ? 'busy'
        : target.status === 'busy'
          ? 'offline'
          : 'online'
    target.status = next
  }

  const connect = () => {
    if (connected.value) return
    connected.value = true
    if (activeId.value) {
      pushSystemMessage(
        activeId.value,
        systemSamples[Math.floor(Math.random() * systemSamples.length)]
      )
    }
    messageTimer = window.setInterval(() => {
      const target =
        conversations.value[
          Math.floor(Math.random() * conversations.value.length)
        ]
      if (!target) return
      setTyping(target.id, true)
      const typingTimer = window.setTimeout(
        () => {
          setTyping(target.id, false)
          receiveMessage(target)
        },
        900 + Math.random() * 900
      )
      typingTimers.set(target.id, typingTimer)
    }, 6000)
    statusTimer = window.setInterval(() => {
      toggleRandomStatus()
    }, 8000)
  }

  const disconnect = () => {
    connected.value = false
    if (messageTimer) {
      clearInterval(messageTimer)
      messageTimer = null
    }
    if (statusTimer) {
      clearInterval(statusTimer)
      statusTimer = null
    }
    typingTimers.forEach((timer) => clearTimeout(timer))
    typingTimers.clear()
    conversations.value.forEach((conv) => {
      conv.typing = false
    })
    if (activeId.value)
      pushSystemMessage(activeId.value, '连接已断开，消息将暂存')
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
    pushSystemMessage
  }
})
