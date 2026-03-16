import type { MockMethod } from 'vite-plugin-mock'

const useBackend = process.env.VITE_USE_BACKEND_FOR_CORE_APIS === 'true'

type AnnouncementStatus = 'draft' | 'published'

interface AnnouncementItem {
  id: number
  title: string
  summary: string
  content: string
  cover: string
  author: string
  status: AnnouncementStatus
  statusLabel: string
  viewCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string
}

type QueryRecord = Record<string, string>

interface ListQuery extends QueryRecord {
  keyword?: string
  status?: AnnouncementStatus | ''
  page?: string
  pageSize?: string
}

interface SavePayload {
  id?: number
  title?: string
  summary?: string
  content?: string
  cover?: string
  author?: string
}

interface IdPayload {
  id?: number
}

let nextId = 4

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

const statusLabelMap: Record<AnnouncementStatus, string> = {
  draft: '草稿',
  published: '已发布'
}

const announcementStore: AnnouncementItem[] = [
  {
    id: 1,
    title: '关于春季学期教学安排调整的通知',
    summary: '本通知说明春季学期课程时间、教室分配和线上平台接入方式。',
    content:
      '<h2>通知内容</h2><p>为保障教学秩序，春季学期课程将按新排课执行。</p><ul><li>第 1 周起执行新课表</li><li>实验课请提前 10 分钟到场</li><li>线上课程统一使用平台直播</li></ul><p>请各位同学及时查看班级群通知。</p>',
    cover: '',
    author: '教务处',
    status: 'published',
    statusLabel: statusLabelMap.published,
    viewCount: 368,
    createdAt: now(),
    updatedAt: now(),
    publishedAt: now()
  },
  {
    id: 2,
    title: '校园网络维护公告',
    summary: '本周六凌晨将进行核心交换机维护，期间网络可能短暂波动。',
    content:
      '<h2>维护时间</h2><p>周六 01:30 - 03:30。</p><h3>影响范围</h3><p>教学楼、宿舍区部分网段会出现短时断连。</p>',
    cover: '',
    author: '信息中心',
    status: 'published',
    statusLabel: statusLabelMap.published,
    viewCount: 212,
    createdAt: now(),
    updatedAt: now(),
    publishedAt: now()
  },
  {
    id: 3,
    title: '社团招新活动预告',
    summary: '拟发布下周社团联合招新活动安排，正在完善时间表和场地信息。',
    content:
      '<h2>活动草稿</h2><p>地点暂定体育馆北广场，欢迎各社团提交摊位需求。</p>',
    cover: '',
    author: '校团委',
    status: 'draft',
    statusLabel: statusLabelMap.draft,
    viewCount: 0,
    createdAt: now(),
    updatedAt: now(),
    publishedAt: ''
  }
]

const summaryOf = (list: AnnouncementItem[]) => ({
  total: list.length,
  draft: list.filter((item) => item.status === 'draft').length,
  published: list.filter((item) => item.status === 'published').length
})

const toListItem = (item: AnnouncementItem) => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  author: item.author,
  status: item.status,
  statusLabel: item.statusLabel,
  viewCount: item.viewCount,
  publishedAt: item.publishedAt,
  updatedAt: item.updatedAt
})

const findAnnouncement = (id: number) =>
  announcementStore.find((item) => item.id === id)

const saveDraft = (item: AnnouncementItem) => {
  item.status = 'draft'
  item.statusLabel = statusLabelMap.draft
  item.updatedAt = now()
  item.publishedAt = ''
}

export default (useBackend
  ? []
  : [
      {
        url: '/api/announcement/list',
        method: 'get',
        response: ({ query }: { query: ListQuery }) => {
          const keyword = (query.keyword || '').trim().toLowerCase()
          const status = (query.status || '').trim() as AnnouncementStatus | ''
          const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1)
          const pageSize = Math.max(
            1,
            Number.parseInt(query.pageSize || '10', 10) || 10
          )

          const filtered = announcementStore.filter((item) => {
            const hitKeyword =
              !keyword ||
              [item.title, item.summary, item.author].some((field) =>
                field.toLowerCase().includes(keyword)
              )
            const hitStatus = !status || item.status === status
            return hitKeyword && hitStatus
          })

          const start = (page - 1) * pageSize
          const list = filtered.slice(start, start + pageSize).map(toListItem)

          return {
            code: 200,
            message: 'success',
            data: {
              list,
              total: filtered.length,
              page,
              pageSize,
              summary: summaryOf(announcementStore)
            }
          }
        }
      },
      {
        url: '/api/announcement/detail',
        method: 'get',
        response: ({ query }: { query: QueryRecord }) => {
          const id = Number(query.id)
          const target = findAnnouncement(id)
          if (!target) return { code: 404, message: '公告不存在' }

          if (target.status === 'published') {
            target.viewCount += 1
            target.updatedAt = now()
          }

          return {
            code: 200,
            message: 'success',
            data: target
          }
        }
      },
      {
        url: '/api/announcement/create',
        method: 'post',
        response: ({ body }: { body: SavePayload }) => {
          if (
            !body?.title?.trim() ||
            !body?.summary?.trim() ||
            !body?.content?.trim()
          ) {
            return { code: 422, message: '请填写完整公告内容' }
          }

          const createdAt = now()
          const author = body.author?.trim() || '系统用户'
          const item: AnnouncementItem = {
            id: nextId++,
            title: body.title.trim(),
            summary: body.summary.trim(),
            content: body.content.trim(),
            cover: body.cover?.trim() || '',
            author,
            status: 'draft',
            statusLabel: statusLabelMap.draft,
            viewCount: 0,
            createdAt,
            updatedAt: createdAt,
            publishedAt: ''
          }
          announcementStore.unshift(item)
          return { code: 200, message: '创建成功', data: item }
        }
      },
      {
        url: '/api/announcement/update',
        method: 'post',
        response: ({ body }: { body: SavePayload }) => {
          const id = Number(body?.id)
          if (!id) return { code: 400, message: '缺少公告 ID' }
          const target = findAnnouncement(id)
          if (!target) return { code: 404, message: '公告不存在' }

          if (body.title !== undefined) target.title = body.title.trim()
          if (body.summary !== undefined) target.summary = body.summary.trim()
          if (body.content !== undefined) target.content = body.content.trim()
          if (body.cover !== undefined) target.cover = body.cover.trim()
          if (body.author !== undefined && body.author.trim()) {
            target.author = body.author.trim()
          }

          saveDraft(target)
          return { code: 200, message: '保存成功', data: target }
        }
      },
      {
        url: '/api/announcement/publish',
        method: 'post',
        response: ({ body }: { body: IdPayload }) => {
          const id = Number(body?.id)
          if (!id) return { code: 400, message: '缺少公告 ID' }
          const target = findAnnouncement(id)
          if (!target) return { code: 404, message: '公告不存在' }
          if (!target.title || !target.summary || !target.content) {
            return { code: 422, message: '公告内容不完整，无法发布' }
          }

          const publishedAt = now()
          target.status = 'published'
          target.statusLabel = statusLabelMap.published
          target.publishedAt = publishedAt
          target.updatedAt = publishedAt

          return { code: 200, message: '发布成功', data: target }
        }
      },
      {
        url: '/api/announcement/delete',
        method: 'post',
        response: ({ body }: { body: IdPayload }) => {
          const id = Number(body?.id)
          if (!id) return { code: 400, message: '缺少公告 ID' }
          const index = announcementStore.findIndex((item) => item.id === id)
          if (index < 0) return { code: 404, message: '公告不存在' }
          announcementStore.splice(index, 1)
          return { code: 200, message: '删除成功' }
        }
      }
    ]) as MockMethod[]
