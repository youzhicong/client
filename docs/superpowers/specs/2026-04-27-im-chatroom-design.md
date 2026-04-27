# IM Chatroom Design

## Goal

Convert the existing `/im` module into a logged-in chatroom experience while continuing to use the current IM API contract documented in `docs/backend-api-spec.md`.

## Scope

The page remains available at `/im` and is protected by the existing route guard. A logged-in user can open the page, load conversations, read messages, send text and file messages, mark a conversation as read, and pin conversations. The implementation keeps the current service endpoints:

- `POST /im/session/connect`
- `POST /im/session/disconnect`
- `GET /im/bootstrap`
- `GET /im/conversations/{convId}/messages`
- `POST /im/conversations/{convId}/messages`
- `POST /im/conversations/{convId}/read`
- `POST /im/conversations/{convId}/pin`

## User Experience

The first viewport should read as a chatroom, not a generic collaboration message center. The header names the module as a chatroom, shows the connection state, and provides a reconnect action. The main layout keeps three operational areas:

- Left: conversation search, filters, unread count, and conversation list.
- Center: active conversation header, message timeline, new-message hint, and composer.
- Right: active participants with online status.

If there is no selected conversation, the center panel shows a clear empty state. If the API fails, the page shows an actionable retry state instead of silently staying blank.

## Data Flow

On mount, the page calls `imStore.connect()`. The store connects the session, loads bootstrap data, sets `currentUser`, populates conversations, selects an active conversation, and loads messages for that conversation.

Selecting a conversation sets `activeId`, lazily loads messages if needed, and marks the conversation as read. Sending a message creates a local temporary message with `sending` status, posts to the send-message endpoint, and replaces the temporary message with the backend message on success.

## Error Handling

Connection and bootstrap failures should be visible in the UI. The store should expose loading and error state so the page can show:

- loading state while bootstrap or conversation messages are being fetched;
- retry action when chat initialization fails;
- send failure state when a message cannot be sent.

The request interceptor already handles 401 by clearing the user and redirecting to login, so the chat module does not duplicate authentication handling.

## Component Boundaries

The implementation should stay close to the current project shape:

- `src/services/im.ts` keeps the endpoint wrappers and type definitions.
- `src/stores/modules/im.ts` owns IM state, API orchestration, optimistic send behavior, and error/loading state.
- `src/views/im/index.vue` owns layout, user interaction, rendering states, and scroll behavior.
- `src/views/im/avatarDisplay.ts` remains the avatar fallback helper.

No new chat protocol or WebSocket client is introduced in this pass; the existing session endpoints are treated as the current connection mechanism.

## Testing

Add focused automated coverage for store behavior that can be tested without rendering the full Element Plus page:

- bootstrap failure exposes an initialization error and leaves the page retryable;
- sending a message creates a temporary local message and replaces it after the API succeeds;
- sending failure marks the temporary message as failed.

Keep the existing avatar helper test passing. Finish with TypeScript build verification.

## Out Of Scope

This change does not add real-time push events, emoji picker menus, file upload transport, message deletion, group creation, or backend API changes.
