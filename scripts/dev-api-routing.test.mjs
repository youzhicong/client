import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), '')
const viteConfigSource = readFileSync(
  new URL('../vite.config.ts', import.meta.url),
  'utf8'
)

assert.equal(
  env.VITE_DEV_SERVER_URL,
  '/api',
  'Development requests should use /api so the browser does not bypass the Vite proxy.'
)

assert.notEqual(
  env.VITE_API_TARGET,
  'http://127.0.0.1:9000',
  'Development proxy target must not point at the temporary local SSH tunnel address.'
)

assert.match(
  viteConfigSource,
  /target:\s*apiTarget/,
  'Proxy target must come from VITE_API_TARGET so local development can switch environments safely.'
)

console.log('dev-api-routing tests passed')
