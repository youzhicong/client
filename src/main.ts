import { createApp } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './style/global.scss'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './permission'
import pinia from './stores'
import { useTheme } from './composables/useTheme'
import 'virtual:svg-icons-register'
;(window as Window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL =
  '/cesium/node_modules/cesium/Build/Cesium/'

useTheme().initTheme()

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(pinia)
app.use(router)
app.mount('#app')
