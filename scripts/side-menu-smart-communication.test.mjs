import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/components/sideMenu.vue', import.meta.url),
  'utf8'
)

const sectionBlock = (title) => {
  const titleIndex = source.indexOf(`title: '${title}'`)
  assert.notEqual(titleIndex, -1, `${title} section should exist`)

  const nextSectionIndex = source.indexOf('\n  {', titleIndex + 1)
  return source.slice(titleIndex, nextSectionIndex === -1 ? undefined : nextSectionIndex)
}

const commonSection = sectionBlock('常用功能')
const smartSection = sectionBlock('智能沟通')

assert.equal(
  source.includes("title: 'AI 模块'"),
  false,
  'old AI module section should be removed'
)

assert.equal(
  commonSection.includes("index: '/im'"),
  false,
  'IM should not remain in common section after moving to smart communication'
)

for (const path of ['/im', '/ai/chat', '/ai/settings', '/ai/workflow']) {
  assert.equal(
    smartSection.includes(`index: '${path}'`),
    true,
    `smart communication section should include ${path}`
  )
}

assert.match(
  source,
  /openedSections[\s\S]*'smart-communication'/,
  'smart communication section should be opened by default'
)

console.log('side-menu-smart-communication tests passed')
