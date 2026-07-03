import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import router from './router'
import { useUserStore } from './stores'
import { defaultHomePath, documentTitle } from '@/config/product'

const WHITE_LIST = ['/login']

router.beforeEach((to) => {
  NProgress.start()

  const userStore = useUserStore()
  const hasToken = Boolean(userStore.user?.token)

  if (hasToken && to.path === '/login') {
    const returnUrl =
      typeof to.query.returnUrl === 'string'
        ? to.query.returnUrl
        : defaultHomePath
    return returnUrl
  }

  if (!hasToken && !WHITE_LIST.includes(to.path)) {
    return {
      path: '/login',
      query: {
        returnUrl: to.fullPath
      }
    }
  }
})

router.afterEach((to) => {
  NProgress.done()
  const title = typeof to.meta.title === 'string' ? to.meta.title : undefined
  document.title = documentTitle(title)
})
