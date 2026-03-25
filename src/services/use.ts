import { request } from '@/utils/request'

type QueryParams = Record<string, unknown>
//获取当前直播课程
export const getvdlist = () =>
  request<unknown>('/media/zhzb/currentLiveCourses', 'GET')

export const getAttendanceRate = (params: QueryParams) =>
  request<unknown>('/media/appraiseTaskSend/submitDetail', 'GET', params)
export const sendCourseAttendance = (data: QueryParams) => {
  return request<unknown>('/media/courseAttendance/send', 'POST', data)
}
