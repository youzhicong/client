import { request } from '@/utils/request'

export interface ClassStudent {
  id: string
  name: string
}

export interface ClassStudentListResult {
  list: ClassStudent[]
  total: number
  updatedAt: string
}

export const getClassStudents = () => {
  return request<ClassStudentListResult>('/class-lottery/students', 'GET')
}

export const saveClassStudents = (students: string[]) => {
  return request<ClassStudentListResult>(
    '/class-lottery/students',
    'PUT',
    { students }
  )
}
