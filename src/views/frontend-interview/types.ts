export type FrameworkTab = 'foundation' | 'handwriting' | 'vue' | 'react'

export type QuestionLevel = '初级' | '中级' | '高级'

export interface InterviewQuestion {
  id: string
  title: string
  level: QuestionLevel
  tags: string[]
  answer: string[]
  sourceName?: string
  sourceUrl?: string
  syncedAt?: string
}

export interface InterviewSection {
  key: string
  title: string
  desc: string
  questions: InterviewQuestion[]
}
