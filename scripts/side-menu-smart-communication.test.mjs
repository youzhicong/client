import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/components/sideMenu.vue', import.meta.url),
  'utf8'
)

const sectionBlock = (key) => {
  const keyIndex = source.indexOf(`key: '${key}'`)
  assert.notEqual(keyIndex, -1, `${key} section should exist`)

  const nextSectionIndex = source.indexOf('\n  {', keyIndex + 1)
  return source.slice(keyIndex, nextSectionIndex === -1 ? undefined : nextSectionIndex)
}

const smartSection = sectionBlock('smart-communication')
const commonSection = sectionBlock('common')
const menuStart = source.indexOf('const menuSections')
const firstSectionAfterMenuStart = source.indexOf('\n  {', menuStart)
const firstSectionBlock = source.slice(
  firstSectionAfterMenuStart,
  source.indexOf('\n  {', firstSectionAfterMenuStart + 1)
)

assert.equal(
  firstSectionBlock.includes("key: 'smart-communication'"),
  true,
  'smart communication should be the first sidebar section'
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

assert.match(
  source,
  /@media \(max-width: 820px\)[\s\S]*\.app-sidebar[\s\S]*display: none/,
  'fixed sidebar should be hidden on H5 widths so the chat page can use the full screen'
)

console.log('side-menu-smart-communication tests passed')
