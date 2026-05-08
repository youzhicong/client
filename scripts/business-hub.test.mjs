import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const router = readFileSync(
  new URL('../src/router/index.ts', import.meta.url),
  'utf8'
)
const menu = readFileSync(
  new URL('../src/components/sideMenu.vue', import.meta.url),
  'utf8'
)
const page = readFileSync(
  new URL('../src/views/business-hub/index.vue', import.meta.url),
  'utf8'
)
const data = readFileSync(
  new URL('../src/views/business-hub/data.ts', import.meta.url),
  'utf8'
)
const aiWorkflowDetail = readFileSync(
  new URL('../src/views/ai-workflow/detail.vue', import.meta.url),
  'utf8'
)
const aiWorkflowSettings = readFileSync(
  new URL('../src/views/ai-workflow/settings.vue', import.meta.url),
  'utf8'
)
const game2048 = readFileSync(
  new URL('../src/views/game-center/components/Game2048.vue', import.meta.url),
  'utf8'
)
const campus3d = readFileSync(
  new URL('../src/views/campus-3d/index.vue', import.meta.url),
  'utf8'
)

assert.match(
  router,
  /path: '\/business-hub'/,
  'business hub route should exist'
)
assert.match(
  router,
  /meta: \{ title: '业务中台' \}/,
  'business hub route should have a title'
)
assert.match(
  menu,
  /index: '\/business-hub'[\s\S]*label: '业务中台'/,
  'sidebar should expose business hub'
)

for (const title of [
  '客户沟通闭环',
  '审批合同链路',
  '零售设备运营',
  '直播转化运营'
]) {
  assert.equal(
    data.includes(title),
    true,
    `${title} should be represented in business modules`
  )
}

assert.equal(
  page.includes('businessModules'),
  true,
  'business hub page should render module cards'
)
assert.equal(
  page.includes('businessTasks'),
  true,
  'business hub page should render follow-up tasks'
)
assert.equal(
  page.includes('businessBacklog'),
  true,
  'business hub page should render suggested business additions'
)

for (const title of ['客户档案', '工单中心', '订单履约', '经营报表']) {
  assert.equal(
    data.includes(title),
    true,
    `${title} should be listed as a suggested business addition`
  )
}

assert.match(
  page,
  /href=['"]#business-follow-up['"]/,
  'business hub hero should link to the follow-up section'
)
assert.match(
  page,
  /href=['"]#business-backlog['"]/,
  'business hub hero should link to the backlog section'
)
assert.equal(
  page.includes('业务中台'),
  true,
  'business hub page should render a readable Chinese title'
)
assert.equal(
  page.includes('待跟进事项'),
  true,
  'business hub page should render a readable follow-up action label'
)
assert.equal(
  page.includes('业务建议'),
  true,
  'business hub page should render a readable backlog action label'
)
assert.equal(
  /\?\/a|\?\/span|\?\/h2/.test(page),
  false,
  'business hub page should not contain broken closing tags'
)
assert.equal(
  page.includes('scroll-behavior: smooth'),
  true,
  'business hub page should enable smooth anchor scrolling'
)
assert.equal(
  page.includes('scroll-margin-top: 96px'),
  true,
  'business hub anchor sections should offset the fixed app header'
)

assert.equal(
  aiWorkflowDetail.includes('返回列表'),
  true,
  'ai workflow detail page should render readable action text'
)
assert.equal(
  aiWorkflowSettings.includes('AI 设置'),
  true,
  'ai workflow settings page should render a readable title'
)
assert.equal(
  game2048.includes('重新开始'),
  true,
  'game 2048 should render a readable restart action'
)
assert.equal(
  game2048.includes('aria-label="向上移动"'),
  true,
  'game 2048 should label the up control for accessibility'
)
assert.equal(
  game2048.includes('aria-label="向左移动"'),
  true,
  'game 2048 should label the left control for accessibility'
)
assert.equal(
  game2048.includes('aria-label="重新开始"'),
  true,
  'game 2048 should label the restart control for accessibility'
)
assert.equal(
  game2048.includes('aria-label="向右移动"'),
  true,
  'game 2048 should label the right control for accessibility'
)
assert.equal(
  game2048.includes('aria-label="向下移动"'),
  true,
  'game 2048 should label the down control for accessibility'
)
assert.equal(
  campus3d.includes('校园全景'),
  true,
  'campus page should render a readable Chinese title'
)
assert.equal(
  campus3d.includes('紫金港数字校园导览'),
  true,
  'campus page should describe the experience as a readable digital campus guide'
)
assert.equal(
  campus3d.includes('自动旋转'),
  true,
  'campus page should expose readable control text'
)
assert.equal(
  campus3d.includes('Cesium 实景引擎'),
  true,
  'campus page should surface the Cesium engine'
)
assert.equal(
  campus3d.includes("import 'cesium/Build/Cesium/Widgets/widgets.css'"),
  true,
  'campus page should import the Cesium widget stylesheet'
)
assert.equal(
  campus3d.includes('实景影像'),
  true,
  'campus page should expose a readable realistic imagery mode'
)
assert.equal(
  campus3d.includes('导览路线'),
  true,
  'campus page should expose a readable guided tour label'
)
assert.equal(
  campus3d.includes('南门到图书馆'),
  true,
  'campus page should surface a readable guided campus route'
)
assert.equal(
  campus3d.includes('启真湖'),
  true,
  'campus page should contain key Zhejiang University campus landmarks'
)
assert.equal(
  campus3d.includes('图书馆'),
  true,
  'campus page should contain a readable library landmark'
)
assert.equal(
  /\?\/a|\?\/span|\?\/h2/.test(campus3d),
  false,
  'campus page should not contain broken closing tags'
)
assert.equal(
  /\?\/a|\?\/span|\?\/h2/.test(aiWorkflowDetail),
  false,
  'ai workflow detail page should not contain broken closing tags'
)
assert.equal(
  /\?\/a|\?\/span|\?\/h2/.test(aiWorkflowSettings),
  false,
  'ai workflow settings page should not contain broken closing tags'
)
assert.equal(
  /\?\/a|\?\/span|\?\/h2/.test(game2048),
  false,
  'game 2048 should not contain broken closing tags'
)

console.log('business-hub tests passed')
