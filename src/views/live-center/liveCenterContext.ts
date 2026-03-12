import { inject, type InjectionKey } from 'vue'
import type { useLiveCenter } from './useLiveCenter'

export type LiveCenterStore = ReturnType<typeof useLiveCenter>

export const liveCenterKey: InjectionKey<LiveCenterStore> =
  Symbol('live-center')

export const useLiveCenterContext = () => {
  const store = inject(liveCenterKey)
  if (!store) {
    throw new Error('LiveCenter context is not provided')
  }
  return store
}
