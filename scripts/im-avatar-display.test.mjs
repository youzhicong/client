import assert from 'node:assert/strict'

import {
  canRenderAvatarImage,
  getAvatarFallbackText
} from '../src/views/im/avatarDisplay.ts'

assert.equal(
  canRenderAvatarImage('https://example.com/group.png'),
  true,
  'http 图片地址应该被识别为可渲染图片源'
)

assert.equal(canRenderAvatarImage(''), false, '空字符串不应该被识别为图片源')

assert.equal(
  canRenderAvatarImage('not-an-image-value'),
  false,
  '普通文案不应该被识别为图片源'
)

assert.equal(
  getAvatarFallbackText('产品讨论组'),
  '产',
  '中文标题应该回退到首字'
)

assert.equal(getAvatarFallbackText(' Alice '), 'A', '英文名称应该回退到首字母')

console.log('im-avatar-display tests passed')
