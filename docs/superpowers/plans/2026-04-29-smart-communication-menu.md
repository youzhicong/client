# Smart Communication Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move IM chat and AI entries into one new `智能沟通` sidebar section.

**Architecture:** This is a static menu-data change inside `src/components/sideMenu.vue`. A lightweight script test reads the Vue file as text and verifies the menu shape so the sidebar information architecture does not regress.

**Tech Stack:** Vue 3, Vue Router links, Element Plus icons, Node script tests, `vue-tsc`.

---

### Task 1: Sidebar Menu Static Test

**Files:**
- Create: `scripts/side-menu-smart-communication.test.mjs`

- [ ] **Step 1: Write the failing test**

Create a Node script that reads `src/components/sideMenu.vue`, extracts the `常用功能` and `智能沟通` section blocks, and asserts the intended route placement.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/side-menu-smart-communication.test.mjs`

Expected: FAIL because `智能沟通` does not exist yet.

### Task 2: Sidebar Menu Data

**Files:**
- Modify: `src/components/sideMenu.vue`

- [ ] **Step 1: Move menu entries**

Remove `/im` from the `常用功能` section. Replace the old `AI 模块` section with a new section:

- key: `smart-communication`
- title: `智能沟通`
- icon: `ChatDotRound`
- items: `/im`, `/ai/chat`, `/ai/settings`, `/ai/workflow`

- [ ] **Step 2: Open the new section by default**

Replace `ai-center` in `openedSections` with `smart-communication`.

- [ ] **Step 3: Run the static menu test**

Run: `node scripts/side-menu-smart-communication.test.mjs`

Expected: PASS.

### Task 3: Verification

**Files:**
- Run verification only.

- [ ] **Step 1: Run menu test**

Run: `node scripts/side-menu-smart-communication.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run TypeScript check**

Run: `pnpm type-check`

Expected: PASS.
