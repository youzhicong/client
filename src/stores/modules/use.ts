import type { AuthUser } from '@/services/auth'

export const useUserStore = defineStore(
  'cp-user',
  () => {
    const user = ref<AuthUser>()

    const setUser = (nextUser: AuthUser) => {
      user.value = nextUser
    }

    const delUser = () => {
      user.value = undefined
    }

    return { user, setUser, delUser }
  },
  {
    persist: true
  }
)
