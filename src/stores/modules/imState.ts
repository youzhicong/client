import type {
  ImConversationItem,
  ImMessageItem,
  ImUserProfile,
  ImUserSummary
} from '@/services/im'

export const CHAT_INIT_ERROR_MESSAGE = '聊天室初始化失败，请稍后重试'
export const CHAT_MESSAGE_ERROR_MESSAGE = '消息加载失败，请重新选择会话'
export const CHAT_SEND_ERROR_MESSAGE = '消息发送失败，请重试'
export const AI_CONVERSATION_ID = 'local-ai-assistant'
export const AI_ASSISTANT_USER_ID = 'ai-assistant'

type ImMessageWithError = ImMessageItem & {
  errorMessage?: string
}

type LoginUserLike = {
  id?: string | number
  name?: string
  username?: string
  nickname?: string
  account?: string
  avatar?: string
}

export const normalizeImError = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(
      (error as { message?: unknown }).message || ''
    ).trim()
    if (message) return message
  }

  return fallback
}

export const markMessageFailed = (
  message: ImMessageItem,
  errorMessage = CHAT_SEND_ERROR_MESSAGE
): ImMessageWithError => ({
  ...message,
  status: 'failed',
  errorMessage
})

export const replaceMessageById = (
  list: ImMessageItem[],
  targetId: string,
  nextMessage: ImMessageItem
) => {
  const index = list.findIndex((item) => item.id === targetId)
  if (index < 0) return false

  list.splice(index, 1, nextMessage)
  return true
}

export const resolveLoggedInImUser = (
  loginUser?: LoginUserLike | null,
  fallback?: ImUserProfile | null
): ImUserProfile => {
  const id = String(
    loginUser?.id ||
      loginUser?.account ||
      loginUser?.username ||
      loginUser?.name ||
      fallback?.id ||
      'current-user'
  )
  const name = String(
    loginUser?.name ||
      loginUser?.nickname ||
      loginUser?.username ||
      loginUser?.account ||
      fallback?.name ||
      '我'
  )
  const avatar = String(loginUser?.avatar || fallback?.avatar || '')

  return {
    id,
    name,
    avatar,
    status: 'online'
  }
}

export const normalizeConversation = (
  conversation: ImConversationItem
): ImConversationItem => ({
  ...conversation,
  pinned: Boolean(conversation.pinned),
  typing: Boolean(conversation.typing)
})

export const getHumanOnlineUsers = (
  currentUser: ImUserProfile | null | undefined,
  onlineUsers: ImUserSummary[]
) => {
  const currentUserId = currentUser?.id
  return onlineUsers.filter(
    (user) => user.id !== currentUserId && user.online !== false
  )
}

export const isAiFallbackActive = (
  currentUser: ImUserProfile | null | undefined,
  onlineUsers: ImUserSummary[]
) =>
  Boolean(currentUser) &&
  getHumanOnlineUsers(currentUser, onlineUsers).length === 0

export const resolveMemberLiveStatus = (
  member: ImUserProfile,
  currentUser: ImUserProfile | null | undefined,
  onlineUsers: ImUserSummary[]
) => {
  if (member.id === AI_ASSISTANT_USER_ID) return 'online'
  if (currentUser?.id === member.id) return 'online'

  return onlineUsers.some(
    (user) => user.id === member.id && user.online !== false
  )
    ? 'online'
    : 'offline'
}

export const createAiConversation = (
  currentUser: ImUserProfile
): ImConversationItem => ({
  id: AI_CONVERSATION_ID,
  title: 'AI 助手',
  avatar: '',
  mode: 'ai',
  members: [
    currentUser,
    {
      id: AI_ASSISTANT_USER_ID,
      name: 'AI 助手',
      avatar: '',
      status: 'online'
    }
  ],
  lastMessage: '当前暂无人工在线，可以先问 AI 助手',
  lastTime: Date.now(),
  unread: 0,
  pinned: true,
  typing: false
})
