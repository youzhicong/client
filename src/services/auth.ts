import { request } from '@/utils/request'

export interface AuthUser {
  token: string
  name: string
  username: string
  nickname: string
  account: string
  email: string
  role: string
  city: string
  avatar: string
}

export interface LoginPayload {
  account: string
  password: string
}

export interface LoginResult {
  user: AuthUser
}

export const login = (payload: LoginPayload) => {
  return request<LoginResult>('/auth/login', 'POST', payload)
}
