import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import router from './router'
import { useUserStore } from './stores'

//前置路由守卫
router.beforeEach((to) => {
  //开启进度条
  NProgress.start()
  //获取token
  const store = useUserStore()
  //白名单
  const whiteList = ['/login']
  //判断是否登录且不在白名单中
  // if (!store.user?.token && !whiteList.includes(to.path)) {
  //   return '/login'
  // }
})
//后置路由守卫
router.afterEach((to) => {
  //关闭进度条
  NProgress.done()
  //修改页面标题
  // document.title = `${to.meta.title || ''}-优医问诊`
})
