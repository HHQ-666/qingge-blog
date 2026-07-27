# Admin Loader State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the custom CMS loading mask when Sveltia becomes interactive and show a retry action when it does not load within 30 seconds.

**Architecture:** The bootstrap mask will consider only Sveltia's own mounted application tree, never the page-level mask text. A shared script pattern in the Astro route and static fallback page observes the CMS tree, clears timers on readiness, and swaps the mask into an explicit failed state after the timeout.

**Tech Stack:** Astro, browser DOM APIs, MutationObserver, Sveltia CMS, pnpm.

---

### Task 1: Fix the loader state machine in both admin entry pages

**Files:**
- Modify: `src/pages/admin/index.astro:214-338`
- Modify: `public/admin/index.html:205-329`

- [x] **Step 1: Add explicit status and retry elements to the mask**

Give the loading text `id="admin-boot-status"`; add a hidden retry anchor with `id="admin-boot-retry"`, `href="/admin/"`, and label `重试`.

- [x] **Step 2: Remove body-text loading detection**

Delete `pageText()` and `stillLoading()`. Make `cmsReady()` require `.sui.app-shell` and then query that shell for `button`, `[role='button']`, `input`, `.toolbar`, or `[role='main']`.

- [x] **Step 3: Add a bounded failure state**

After 30 seconds without readiness, stop observation and polling, replace the status text with `写作台加载失败，请检查网络后重试。`, hide the dots, and reveal the retry anchor. Clear this timeout in `hideBoot()`.

### Task 2: Verify production output and commit

**Files:**
- Verify: `src/pages/admin/index.astro`
- Verify: `public/admin/index.html`

- [x] **Step 1: Run whitespace and selector checks**

Run: `git diff --check && rg -n "pageText|stillLoading|admin-boot-status|admin-boot-retry|sui\.app-shell" src/pages/admin/index.astro public/admin/index.html`

Expected: no whitespace errors; old body-text functions are absent; both pages contain the new status, retry, and Sveltia-scoped selector.

- [x] **Step 2: Build the production site**

Run: `./node_modules/.bin/astro build`

Expected: exit code `0`; `dist/admin/index.html` is generated.

- [x] **Step 3: Inspect the generated admin page**

Run: `rg -n "admin-boot-status|admin-boot-retry|写作台加载失败" dist/admin/index.html`

Expected: all three strings occur in the generated page.

- [x] **Step 4: Commit the focused fix**

Run: `git add src/pages/admin/index.astro public/admin/index.html docs/superpowers/plans/2026-07-24-admin-loader-state.md && git commit -m "fix: recover admin loader state"`

Expected: the commit contains the loader-state behavior and implementation plan only.
