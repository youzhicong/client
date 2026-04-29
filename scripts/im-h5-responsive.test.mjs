import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/views/im/index.vue', import.meta.url),
  'utf8'
)

const mobileMediaIndex = source.indexOf('@media (max-width: 680px)')
assert.notEqual(mobileMediaIndex, -1, 'IM page should define H5 styles at 680px')

const mobileBlock = source.slice(mobileMediaIndex)

for (const expected of [
  'height: calc(100dvh - 12px)',
  'grid-template-rows: minmax(0, 34dvh) minmax(0, 1fr)',
  'overflow: hidden',
  '.conversation-list',
  'min-height: 0',
  '.chat-body',
  'padding: 12px',
  '.composer',
  'padding: 10px',
  '.members',
  'display: none'
]) {
  assert.equal(
    mobileBlock.includes(expected),
    true,
    `H5 IM styles should include ${expected}`
  )
}

assert.match(
  mobileBlock,
  /:deep\(\.composer \.el-textarea__inner\)[\s\S]*max-height: 96px/,
  'H5 composer textarea should keep a bounded height'
)

console.log('im-h5-responsive tests passed')
