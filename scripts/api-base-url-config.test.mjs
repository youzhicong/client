import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { loadEnv } from 'vite'

const devEnv = loadEnv('development', process.cwd(), '')
const prodEnv = loadEnv('production', process.cwd(), '')
const requestSource = readFileSync(
  new URL('../src/utils/request.ts', import.meta.url),
  'utf8'
)

assert.equal(
  devEnv.VITE_API_BASE_URL,
  '/api',
  '开发环境下前端必须统一请求 /api，由 Vite 代理转发到后端'
)

assert.equal(
  prodEnv.VITE_API_BASE_URL,
  '/api',
  '生产环境下前端也必须统一请求 /api，由服务器反向代理转发到后端'
)

assert.match(
  requestSource,
  /VITE_API_BASE_URL/,
  '请求封装必须使用 VITE_API_BASE_URL，避免只在开发环境生效'
)

console.log('api-base-url-config tests passed')
