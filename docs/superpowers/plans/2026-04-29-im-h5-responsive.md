# IM H5 Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put `智能沟通` first and make `/im` usable on phone-width screens.

**Architecture:** Keep route and store logic unchanged. Update sidebar menu ordering and CSS media queries. Add static tests that protect the menu order and mobile CSS contract.

**Tech Stack:** Vue 3 SFC, SCSS, Node script tests, `vue-tsc`.

---

### Task 1: Static Tests

**Files:**
- Modify: `scripts/side-menu-smart-communication.test.mjs`
- Create: `scripts/im-h5-responsive.test.mjs`

- [ ] **Step 1: Extend the menu test**

Assert that `smart-communication` is the first section and that the fixed sidebar is hidden at `max-width: 820px`.

- [ ] **Step 2: Add the IM H5 CSS test**

Assert that the `max-width: 680px` media block contains dynamic viewport height, capped conversation list, scrollable chat body, compact composer, and hidden members panel.

- [ ] **Step 3: Run tests and see them fail**

Run:

```bash
node scripts/side-menu-smart-communication.test.mjs
node scripts/im-h5-responsive.test.mjs
```

Expected: both fail before implementation.

### Task 2: Implement CSS And Order

**Files:**
- Modify: `src/components/sideMenu.vue`
- Modify: `src/views/im/index.vue`

- [ ] **Step 1: Move smart communication first**

Move the `smart-communication` section to the first item in `menuSections`.

- [ ] **Step 2: Hide fixed sidebar on phone widths**

Add `display: none` for `.app-sidebar` inside the existing `@media (max-width: 820px)` block.

- [ ] **Step 3: Add H5 chat CSS**

At `max-width: 680px`, make `.im-page` a bounded `100dvh` surface, make `.im-shell` a two-row grid, cap `.sidebar`, keep `.chat-body` scrollable, compact `.composer`, and hide `.members`.

### Task 3: Verification

Run:

```bash
node scripts/side-menu-smart-communication.test.mjs
node scripts/im-h5-responsive.test.mjs
pnpm exec jiti scripts/im-ai-fallback.test.mjs
pnpm type-check
```

Expected: all pass.
