import { request } from '@/utils/request'

export type ImUserStatus = 'online' | 'offline' | (string & {})
export type ConversationMode = 'direct' | (string & {})
export type MessageType = 'text' | 'image' | 'file' | 'system' | (string & {})
export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'read'
  | 'failed'
  | (string & {})

export interface ImUserProfile {
  id: string
  name: string
  avatar: string
  status: ImUserStatus
}

export interface ImUserSummary extends ImUserProfile {
  online: boolean
}

export interface ImMessageItem {
  id: string
  convId: string
  senderId: string
  senderName: string
  content: string
  type: MessageType
  createdAt: number
  status: MessageStatus
  fileName?: string
  errorMessage?: string
}

export interface ImConversationItem {
  id: string
  title: string
  avatar: string
  mode: ConversationMode
  members: ImUserProfile[]
  lastMessage: string
  lastTime: number
  unread: number
  pinned: boolean
  typing: boolean
}

export interface ImBootstrapResult {
  currentUser: ImUserProfile
  conversations: ImConversationItem[]
  activeConversationId: string
  onlineUsers: ImUserSummary[]
}

export interface ImConversationMessageResult {
  list: ImMessageItem[]
}

export interface ImSendMessagePayload {
  convId: string
  senderId: string
  content: string
  type: MessageType
  fileName?: string
}

export interface ImTogglePinPayload {
  pinned: boolean
}

export const getImBootstrap = () => {
  return request<ImBootstrapResult>('/im/bootstrap', 'GET')
}

export const getConversationMessages = (convId: string) => {
  return request<ImConversationMessageResult>(
    `/im/conversations/${convId}/messages`,
    'GET'
  )
}

export const sendConversationMessage = (payload: ImSendMessagePayload) => {
  return request<ImMessageItem>(
    `/im/conversations/${payload.convId}/messages`,
    'POST',
    payload
  )
}

export const markConversationRead = (convId: string) => {
  return request<null>(`/im/conversations/${convId}/read`, 'POST')
}

export const toggleConversationPin = (
  convId: string,
  payload: ImTogglePinPayload
) => {
  return request<null>(`/im/conversations/${convId}/pin`, 'POST', payload)
}

export const connectImSession = () => {
  return request<{ connected: boolean }>('/im/session/connect', 'POST')
}

export const disconnectImSession = () => {
  return request<{ connected: boolean }>('/im/session/disconnect', 'POST')
}
