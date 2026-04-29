import assert from 'node:assert/strict'

import {
  AI_CONVERSATION_ID,
  createAiConversation,
  getHumanOnlineUsers,
  isAiFallbackActive,
  resolveMemberLiveStatus
} from '../src/stores/modules/imState.ts'

const currentUser = {
  id: '18516358762',
  name: '我',
  avatar: '',
  status: 'online'
}

const onlineUsers = [
  { ...currentUser, online: true },
  {
    id: 'lianghuan',
    name: '梁欢',
    avatar: '',
    status: 'online',
    online: false
  }
]

assert.deepEqual(
  getHumanOnlineUsers(currentUser, onlineUsers),
  [],
  'human online users should exclude current user and users not flagged online'
)

assert.equal(
  isAiFallbackActive(currentUser, onlineUsers),
  true,
  'AI fallback should activate when only current user is online'
)

assert.equal(
  resolveMemberLiveStatus(
    { id: 'lianghuan', name: '梁欢', avatar: '', status: 'online' },
    currentUser,
    onlineUsers
  ),
  'offline',
  'member status should come from bootstrap onlineUsers instead of stale member status'
)

const aiConversation = createAiConversation(currentUser)

assert.equal(aiConversation.id, AI_CONVERSATION_ID)
assert.equal(aiConversation.pinned, true)
assert.equal(aiConversation.mode, 'ai')
assert.equal(aiConversation.members[0].id, currentUser.id)

console.log('im-ai-fallback tests passed')
