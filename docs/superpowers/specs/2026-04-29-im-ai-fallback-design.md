# IM AI Fallback Design

## Goal

When the IM bootstrap data shows that no human teammate is online besides the current logged-in user, the `/im` page should offer an in-page AI reception conversation so the user can still ask questions.

## Online Source Of Truth

The page must treat `GET /im/bootstrap` response field `onlineUsers` as the only source of live online state. Conversation member `status` can be stale and must not decide whether support staff are online.

A human teammate is online when an item in `onlineUsers` has a different `id` from `currentUser.id`. If that filtered list is empty, the page is in AI fallback mode.

## User Experience

In AI fallback mode, the conversation list shows a pinned local conversation named `AI 助手`. The center panel behaves like a normal chat thread, but the send action calls the existing AI service instead of the IM message endpoint.

The current user card can still show the logged-in user as online. Other member badges should be derived from `onlineUsers`, so users not present in the online list display as offline even if a conversation member object says `online`.

If the AI request fails, the local AI message is marked failed and the user can send another message. Human conversations keep the existing send, read, pin, message loading, and session connect/disconnect flow.

## Data Flow

On mount, `imStore.connect()` still calls:

- `POST /im/session/connect`
- `GET /im/bootstrap`
- `GET /im/conversations/{convId}/messages` for the active human conversation

After bootstrap, the store computes `humanOnlineUsers`. If the list is empty, it creates a local AI conversation and selects it when no active human conversation should take focus.

Sending in the AI conversation appends a local user message, calls `chatWithAI()` with a short system prompt and the recent AI-local history, then appends the assistant reply. AI messages are stored only in local store state and do not call IM endpoints.

## Component Boundaries

- `src/stores/modules/imState.ts` owns small pure helpers for online-user derivation and AI conversation/message creation.
- `src/stores/modules/im.ts` owns AI fallback state, AI send orchestration, and the existing IM API orchestration.
- `src/views/im/index.vue` renders the AI conversation and shows online/offline status based on the store-derived online set.
- `src/services/ai.ts` remains the existing AI provider adapter and is reused without backend changes.

## Testing

Add focused script tests for pure IM state helpers before implementation:

- human online list excludes the current user;
- AI fallback is active when no other online users exist;
- member status is resolved from `onlineUsers` instead of stale member status;
- the AI local conversation is pinned and addressed to the current user.

Finish with the new helper test, the existing avatar helper test, and TypeScript build verification.
