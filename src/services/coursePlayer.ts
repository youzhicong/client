import type { CourseManifest } from '@/types/courseManifest'

export type CourseCatalogItem = {
  id: string
  title: string
  summary: string
  sceneCount: number
  badge: string
}

export const courseCatalog: CourseCatalogItem[] = [
  {
    id: 'oligosaccharide',
    title: '低聚糖与人体健康',
    summary: '基于 manifest + TTS 音频的伪视频课程播放演示',
    sceneCount: 9,
    badge: 'MAIC DEMO'
  }
]

export const getCourseManifest = async (courseId: string) => {
  const response = await fetch(`/course-demo/${courseId}/manifest.json`)
  if (!response.ok) {
    throw new Error('课程 manifest 加载失败')
  }
  return (await response.json()) as CourseManifest
}

export const resolveCourseAssetUrl = (courseId: string, ref: string) => {
  if (
    ref.startsWith('http://') ||
    ref.startsWith('https://') ||
    ref.startsWith('/')
  ) {
    return ref
  }
  return `/course-demo/${courseId}/${ref.replace(/^\/+/, '')}`
}

export const resolveMediaRef = (
  courseId: string,
  ref: string,
  mediaIndex?: CourseManifest['mediaIndex']
) => {
  const candidates = [
    `media/${ref}.mp4`,
    `media/${ref}.png`,
    `media/${ref}.jpg`,
    ref
  ]

  for (const key of candidates) {
    if (mediaIndex?.[key]) {
      return resolveCourseAssetUrl(courseId, key)
    }
  }

  return resolveCourseAssetUrl(courseId, `media/${ref}.png`)
}
