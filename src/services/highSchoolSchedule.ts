import { request } from '@/utils/request'

export type Grade = '高一' | '高二' | '高三'
export type Weekday = '周一' | '周二' | '周三' | '周四' | '周五'
export type SwapMode = 'timeslot' | 'teacher'

export interface ScheduleCourseItem {
  id: string
  teacherName: string
  subject: string
  grade: Grade
  className: string
  weekday: Weekday
  period: string
  classroom: string
}

export interface ScheduleSwapLogItem {
  id: string
  timestamp: string
  summary: string
  reason: string
}

export interface ScheduleListResult {
  list: ScheduleCourseItem[]
  swapLogs: ScheduleSwapLogItem[]
  updatedAt: string
}

export interface ScheduleCoursePayload {
  teacherName: string
  subject: string
  grade: Grade
  className: string
  weekday: Weekday
  period: string
  classroom: string
}

export interface ScheduleSwapPayload {
  firstCourseId: string
  secondCourseId: string
  mode: SwapMode
  reason?: string
}

export interface ScheduleImportPayload {
  courses: ScheduleCoursePayload[]
}

export const getScheduleList = () => {
  return request<ScheduleListResult>('/high-school-schedule/courses', 'GET')
}

export const createScheduleCourse = (payload: ScheduleCoursePayload) => {
  return request<ScheduleCourseItem>(
    '/high-school-schedule/courses',
    'POST',
    payload
  )
}

export const updateScheduleCourse = (
  id: string,
  payload: ScheduleCoursePayload
) => {
  return request<ScheduleCourseItem>(
    `/high-school-schedule/courses/${id}`,
    'PUT',
    payload
  )
}

export const deleteScheduleCourse = (id: string) => {
  return request<null>(`/high-school-schedule/courses/${id}`, 'DELETE')
}

export const swapScheduleCourses = (payload: ScheduleSwapPayload) => {
  return request<ScheduleListResult>(
    '/high-school-schedule/courses/swap',
    'POST',
    payload
  )
}

export const importScheduleCourses = (payload: ScheduleImportPayload) => {
  return request<ScheduleListResult>(
    '/high-school-schedule/courses/import',
    'POST',
    payload
  )
}

export const resetScheduleCourses = () => {
  return request<ScheduleListResult>(
    '/high-school-schedule/courses/reset',
    'POST'
  )
}
