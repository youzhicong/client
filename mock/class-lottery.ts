import type { MockMethod } from 'vite-plugin-mock'

type StudentItem = {
  id: string
  name: string
}

type SaveStudentsPayload = {
  students?: string[]
}

const seedStudents = [
  '张三',
  '李四',
  '王五',
  '赵六',
  '陈晨',
  '刘洋',
  '周宁',
  '吴迪',
  '徐飞',
  '孙悦',
  '马可',
  '黄琳',
  '朱涛',
  '胡静',
  '林浩',
  '郭倩',
  '何帆',
  '高晴',
  '罗宇',
  '梁辰'
]

const normalizeName = (value: unknown) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''

const headerKeywords = new Set([
  '姓名',
  '名字',
  '学生姓名',
  'name',
  'student',
  'studentname'
])

const uniqueNames = (values: string[]) => {
  const set = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const name = normalizeName(value)
    if (!name) continue
    if (headerKeywords.has(name.toLowerCase())) continue
    if (set.has(name)) continue
    set.add(name)
    result.push(name)
  }

  return result
}

const toStudentId = (name: string, index: number) => {
  const hex = Buffer.from(name).toString('hex').slice(0, 16)
  return `stu-${hex}-${index + 1}`
}

const buildStudents = (names: string[]): StudentItem[] =>
  uniqueNames(names).map((name, index) => ({
    id: toStudentId(name, index),
    name
  }))

let studentStore: StudentItem[] = buildStudents(seedStudents)
let updatedAt = Date.now()

const formatData = () => ({
  list: studentStore,
  total: studentStore.length,
  updatedAt: new Date(updatedAt).toISOString()
})

export default [
  {
    url: '/api/class-lottery/students',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: formatData()
      }
    }
  },
  {
    url: '/api/class-lottery/students',
    method: 'put',
    response: ({ body }) => {
      const payload = (body || {}) as SaveStudentsPayload
      if (!Array.isArray(payload.students)) {
        return {
          code: 400,
          message: 'students 参数必须是数组'
        }
      }

      const next = buildStudents(payload.students)
      if (!next.length) {
        return {
          code: 422,
          message: '学生名单不能为空'
        }
      }

      studentStore = next
      updatedAt = Date.now()

      return {
        code: 200,
        message: '保存成功',
        data: formatData()
      }
    }
  }
] as MockMethod[]
