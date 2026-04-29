# IM AI Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-page AI assistant conversation when `/im/bootstrap` reports no online human users besides the current logged-in user.

**Architecture:** Keep the existing IM API flow intact for human conversations. Add pure state helpers in `imState.ts`, then let the Pinia IM store create and handle a local AI conversation that calls the existing `chatWithAI()` adapter. The Vue page renders store-derived status instead of trusting stale conversation member status.

**Tech Stack:** Vue 3, Pinia, TypeScript, Element Plus, existing `src/services/ai.ts`, Node script tests, `vue-tsc`.

---

### Task 1: Pure State Helpers

**Files:**
- Modify: `src/stores/modules/imState.ts`
- Create: `scripts/im-ai-fallback.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/im-ai-fallback.test.mjs` that imports helper functions from `src/stores/modules/imState.ts` and asserts:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jiti scripts/im-ai-fallback.test.mjs`

Expected: FAIL because the helper exports do not exist.

- [ ] **Step 3: Write minimal helper implementation**

Add helpers to `src/stores/modules/imState.ts`:

```ts
export const AI_CONVERSATION_ID = 'local-ai-assistant'

export const getHumanOnlineUsers = (
  currentUser: ImUserProfile | null | undefined,
  onlineUsers: Array<ImUserProfile & { online?: boolean }>
) => {
  const currentUserId = currentUser?.id
  return onlineUsers.filter(
    (user) => user.id !== currentUserId && user.online !== false
  )
}

export const isAiFallbackActive = (
  currentUser: ImUserProfile | null | undefined,
  onlineUsers: Array<ImUserProfile & { online?: boolean }>
) => Boolean(currentUser) && getHumanOnlineUsers(currentUser, onlineUsers).length === 0

export const resolveMemberLiveStatus = (
  member: ImUserProfile,
  currentUser: ImUserProfile | null | undefined,
  onlineUsers: Array<ImUserProfile & { online?: boolean }>
) => {
  if (currentUser?.id === member.id) return 'online'
  return onlineUsers.some((user) => user.id === member.id && user.online !== false)
    ? 'online'
    : 'offline'
}

export const createAiConversation = (currentUser: ImUserProfile): ImConversationItem => ({
  id: AI_CONVERSATION_ID,
  title: 'AI 助手',
  avatar: '',
  mode: 'ai',
  members: [
    currentUser,
    {
      id: 'ai-assistant',
      name: 'AI 助手',
      avatar: '',
      status: 'online'
    }
  ],
  lastMessage: '当前暂无人工在线，可以先问 AI 助手',
  lastTime: Date.now(),
  unread: 0,
  pinned: true,
  typing: false
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jiti scripts/im-ai-fallback.test.mjs`

Expected: PASS with `im-ai-fallback tests passed`.

### Task 2: Store AI Fallback Flow

**Files:**
- Modify: `src/stores/modules/im.ts`

- [ ] **Step 1: Write a failing store behavior check**

Extend `scripts/im-ai-fallback.test.mjs` only if a light store test can be run without extra harness. Otherwise keep Task 1 as the RED guard and continue because the new behavior depends on Pinia runtime and existing API mocks are not in place.

- [ ] **Step 2: Implement store behavior**

In `src/stores/modules/im.ts`:

- import `chatWithAI` and the new helpers;
- expose `humanOnlineUsers`, `aiFallbackActive`, and `resolveLiveStatus`;
- after bootstrap, insert or update the AI conversation when fallback is active;
- skip `getConversationMessages`, `markConversationRead`, and `toggleConversationPin` for the AI conversation;
- branch `sendMessage()` so AI conversation sends append a user message, call `chatWithAI()`, append assistant reply, and mark the assistant reply failed if AI throws.

- [ ] **Step 3: Run helper test**

Run: `pnpm exec jiti scripts/im-ai-fallback.test.mjs`

Expected: PASS.

### Task 3: Vue Page Rendering

**Files:**
- Modify: `src/views/im/index.vue`

- [ ] **Step 1: Use store-derived online state**

Update status counters and member rows to use `onlineUsers`, `humanOnlineUsers`, and `resolveLiveStatus(member)`.

- [ ] **Step 2: Render AI fallback naturally**

Keep the existing three-column chat layout. The AI conversation should appear as a pinned list item with normal message bubbles. The header and empty state should make clear that AI is available when no human teammate is online.

- [ ] **Step 3: Avoid emoji-only tool labels**

Replace toolbar emoji icons with text or existing Element Plus icon components if touching those controls.

### Task 4: Verification

**Files:**
- Run verification commands only.

- [ ] **Step 1: Run AI fallback helper test**

Run: `pnpm exec jiti scripts/im-ai-fallback.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run existing avatar test**

Run: `node scripts/im-avatar-display.test.mjs`

Expected: PASS.

- [ ] **Step 3: Run TypeScript build check**

Run: `pnpm type-check`

Expected: PASS.
