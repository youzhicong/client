import { request } from '@/utils/request'
//获取当前直播课程
export const getvdlist = () =>
  request<any>('/media/zhzb/currentLiveCourses', 'GET')


export const getAttendanceRate = (params: any) =>
  request<any>(`/media/appraiseTaskSend/submitDetail`, 'GET', params)
export const sendCourseAttendance = (data: any) => {
  return request('/media/courseAttendance/send', 'post', data)
}
