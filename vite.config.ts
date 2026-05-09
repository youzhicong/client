import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import electron from 'vite-plugin-electron'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { viteMockServe } from 'vite-plugin-mock'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_USE_MOCK === 'true'
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080'
  const enableElectron = mode === 'electron'
  process.env.VITE_USE_BACKEND_FOR_CORE_APIS =
    env.VITE_USE_BACKEND_FOR_CORE_APIS || ''

  return {
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        dts: 'src/types/components.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/icons')]
      }),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/cesium/Build/Cesium/{Workers,Assets,ThirdParty,Widgets}',
            dest: 'cesium'
          }
        ]
      }),
      viteMockServe({
        mockPath: 'mock',
        enable: mode === 'development' && useMock
      }),
      enableElectron
        ? electron({
            entry: './src-electron/main.ts'
          })
        : undefined
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  }
})
