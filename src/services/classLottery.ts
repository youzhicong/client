export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export interface ClassStudent {
  id: string
  name: string
}

export interface ClassStudentListResult {
  list: ClassStudent[]
  total: number
  updatedAt: string
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  return (await response.json()) as ApiResult<T>
}

export const getClassStudents = () => {
  return requestJson<ClassStudentListResult>('/api/class-lottery/students')
}

export const saveClassStudents = (students: string[]) => {
  return requestJson<ClassStudentListResult>('/api/class-lottery/students', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students })
  })
}
