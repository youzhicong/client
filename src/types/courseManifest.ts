export type CourseAgent = {
  name: string
  role: string
  persona: string
  avatar: string
  color: string
  priority: number
}

export type CanvasElement = {
  id: string
  type: 'text' | 'shape' | 'image' | 'video' | 'latex'
  left: number
  top: number
  width: number
  height: number
  rotate?: number
  content?: string
  fill?: string
  src?: string
  mediaRef?: string
  autoplay?: boolean
  html?: string
}

export type SlideCanvas = {
  viewportSize: number
  viewportRatio: number
  theme?: {
    backgroundColor?: string
  }
  elements: CanvasElement[]
}

export type QuizQuestion = {
  id: string
  type: 'single' | 'multiple'
  question: string
  options: Array<{ label: string; value: string }>
  answer: string[]
  analysis?: string
  points?: number
}

export type CourseAction =
  | {
      id: string
      type: 'speech'
      text: string
      audioRef: string
    }
  | {
      id: string
      type: 'spotlight' | 'laser'
      elementId: string
    }
  | {
      id: string
      type: 'discussion'
      topic?: string
      prompt?: string
      agentId?: string
    }

export type CourseScene =
  | {
      type: 'slide'
      title: string
      order: number
      content: {
        type: 'slide'
        canvas: SlideCanvas
      }
      actions?: CourseAction[]
    }
  | {
      type: 'quiz'
      title: string
      order: number
      content: {
        type: 'quiz'
        questions: QuizQuestion[]
      }
      actions?: CourseAction[]
    }

export type CourseManifest = {
  formatVersion: number
  stage: {
    name: string
    description?: string
    language?: string
    style?: string
  }
  agents: CourseAgent[]
  scenes: CourseScene[]
  mediaIndex?: Record<
    string,
    { type: string; format?: string; mimeType?: string }
  >
}
