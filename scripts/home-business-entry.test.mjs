import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/views/home/index.vue', import.meta.url),
  'utf8'
)

assert.equal(
  source.includes('useRouter'),
  true,
  'home page should use router for business entry actions'
)
assert.equal(
  source.includes("router.push('/business-hub')"),
  true,
  'home page should navigate to business hub'
)
assert.equal(
  source.includes('进入业务中台'),
  true,
  'primary hero action should expose business hub'
)
assert.equal(
  source.includes('查看业务建议'),
  true,
  'secondary hero action should point to business suggestions'
)

assert.equal(
  source.includes(
    "router.push({ path: '/business-hub', hash: '#business-backlog' })"
  ),
  true,
  'secondary hero action should jump directly to the business backlog section'
)

console.log('home-business-entry tests passed')
