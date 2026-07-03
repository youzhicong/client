import { computed } from 'vue'
import { useRoute } from 'vue-router'

export const useLotteryEmbedded = () => {
  const route = useRoute()

  return computed(() =>
    route.matched.some((record) => record.name === 'lottery')
  )
}
