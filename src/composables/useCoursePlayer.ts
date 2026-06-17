import {
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  toValue,
  type MaybeRefOrGetter
} from 'vue'
import {
  getCourseManifest,
  resolveCourseAssetUrl
} from '@/services/coursePlayer'
import type {
  CourseAction,
  CourseManifest,
  CourseScene
} from '@/types/courseManifest'

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

export function useCoursePlayer(courseId: MaybeRefOrGetter<string>) {
  const getCourseId = () => toValue(courseId)
  const manifest = shallowRef<CourseManifest | null>(null)
  const loading = ref(false)
  const playing = ref(false)
  const sceneIndex = ref(0)
  const actionIndex = ref(0)
  const subtitle = ref('')
  const highlightId = ref<string | null>(null)
  const waitingForQuiz = ref(false)
  const errorMessage = ref('')

  let currentAudio: HTMLAudioElement | null = null
  let playbackToken = 0

  const scenes = computed(() => manifest.value?.scenes ?? [])
  const currentScene = computed(() => scenes.value[sceneIndex.value] ?? null)
  const progress = computed(() => {
    if (!scenes.value.length) return 0
    return Math.round(((sceneIndex.value + 1) / scenes.value.length) * 100)
  })

  const stopAudio = () => {
    if (!currentAudio) return
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }

  const playAudio = async (url: string) => {
    stopAudio()
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url)
      currentAudio = audio
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('音频播放失败'))
      void audio.play().catch(reject)
    })
  }

  const runVisualAction = async (action: CourseAction) => {
    if (action.type === 'spotlight' || action.type === 'laser') {
      highlightId.value = action.elementId
      subtitle.value = ''
      await delay(action.type === 'laser' ? 650 : 900)
      return
    }

    if (action.type === 'discussion') {
      highlightId.value = null
      subtitle.value = action.prompt || action.topic || '课堂讨论'
      await delay(1800)
    }
  }

  const runSpeechAction = async (
    action: Extract<CourseAction, { type: 'speech' }>
  ) => {
    highlightId.value = null
    subtitle.value = action.text
    await playAudio(resolveCourseAssetUrl(getCourseId(), action.audioRef))
  }

  const runAction = async (action: CourseAction) => {
    if (action.type === 'speech') {
      await runSpeechAction(action)
      return
    }
    await runVisualAction(action)
  }

  const runSceneActions = async (scene: CourseScene, token: number) => {
    const actions = scene.actions ?? []
    while (actionIndex.value < actions.length) {
      if (token !== playbackToken || !playing.value) return
      const action = actions[actionIndex.value]
      if (!action) break
      await runAction(action)
      actionIndex.value += 1
    }
  }

  const advanceScene = async (token: number) => {
    if (sceneIndex.value >= scenes.value.length - 1) {
      playing.value = false
      subtitle.value = '课程播放完成'
      return
    }

    sceneIndex.value += 1
    actionIndex.value = 0
    highlightId.value = null

    const nextScene = scenes.value[sceneIndex.value]
    if (!nextScene) return

    if (nextScene.type === 'quiz') {
      waitingForQuiz.value = true
      playing.value = false
      subtitle.value = nextScene.title
      return
    }

    if (playing.value) {
      await runSceneActions(nextScene, token)
      if (token === playbackToken && playing.value) {
        await advanceScene(token)
      }
    }
  }

  const startPlayback = async () => {
    if (!manifest.value || !scenes.value.length) return

    playbackToken += 1
    const token = playbackToken
    playing.value = true
    waitingForQuiz.value = false
    errorMessage.value = ''

    const scene = scenes.value[sceneIndex.value]
    if (!scene) return

    if (scene.type === 'quiz') {
      waitingForQuiz.value = true
      playing.value = false
      subtitle.value = scene.title
      return
    }

    try {
      await runSceneActions(scene, token)
      if (token === playbackToken && playing.value) {
        await advanceScene(token)
      }
    } catch {
      errorMessage.value = '播放失败，请检查音频资源'
      playing.value = false
    }
  }

  const pause = () => {
    playing.value = false
    playbackToken += 1
    stopAudio()
  }

  const resume = () => {
    if (waitingForQuiz.value) return
    void startPlayback()
  }

  const togglePlay = () => {
    if (playing.value) {
      pause()
      return
    }
    void resume()
  }

  const continueFromQuiz = () => {
    waitingForQuiz.value = false
    if (sceneIndex.value >= scenes.value.length - 1) {
      subtitle.value = '课程播放完成'
      playing.value = false
      return
    }

    sceneIndex.value += 1
    actionIndex.value = 0
    highlightId.value = null
    void startPlayback()
  }

  const jumpToScene = (index: number) => {
    if (index < 0 || index >= scenes.value.length) return
    pause()
    sceneIndex.value = index
    actionIndex.value = 0
    highlightId.value = null
    subtitle.value = ''
    waitingForQuiz.value = scenes.value[index]?.type === 'quiz'
  }

  const load = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
      manifest.value = await getCourseManifest(getCourseId())
      sceneIndex.value = 0
      actionIndex.value = 0
      subtitle.value = manifest.value.stage.name
    } catch {
      errorMessage.value = '课程加载失败'
    } finally {
      loading.value = false
    }
  }

  onBeforeUnmount(() => {
    pause()
  })

  return {
    manifest,
    loading,
    playing,
    sceneIndex,
    subtitle,
    highlightId,
    waitingForQuiz,
    errorMessage,
    scenes,
    currentScene,
    progress,
    load,
    togglePlay,
    pause,
    continueFromQuiz,
    jumpToScene
  }
}

export type UseCoursePlayerReturn = ReturnType<typeof useCoursePlayer>
