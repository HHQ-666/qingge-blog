# Admin Native Loader Centering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Sveltia's native `Loading Site Data…` screen centered at every viewport size and wait for that screen to disappear before treating the CMS as ready.

**Architecture:** Both admin entry pages will identify the native loader by its visible `Loading Site Data` text and center its nearest `.container` element. The custom boot mask will not be removed while the native loader exists; observers stop only after the loader disappears and an interactive CMS element is present.

**Tech Stack:** Astro, browser DOM APIs, MutationObserver, Sveltia CMS, pnpm.

---

### Task 1: Track and center the native Sveltia loader

**Files:**
- Modify: `src/pages/admin/index.astro:249-344`
- Modify: `public/admin/index.html:240-333`

- [x] **Step 1: Find the native loading container by text**

Add `nativeLoaderContainer()` that scans `.sui.app-shell p, .sui.app-shell div, .sui.app-shell span` for a leaf element whose trimmed text contains `Loading Site Data`, then returns its nearest `.container` ancestor.

- [x] **Step 2: Center only that container**

Make `scanCenter()` call `forceCenter(nativeLoaderContainer())` instead of the broad container selector. Remove the `data-centered` early return so Sveltia style rewrites are corrected while this native loader remains visible.

- [x] **Step 3: Delay readiness until native loading is gone**

Make `cmsReady()` return `false` while `nativeLoaderContainer()` exists. In `hideBoot()`, clear only the failure and readiness timers; keep the mutation observer and centering timer alive until `cmsReady()` is true after the native loader disappears.

### Task 2: Verify the generated pages and commit

**Files:**
- Verify: `src/pages/admin/index.astro`
- Verify: `public/admin/index.html`

- [x] **Step 1: Check both source pages**

Run: `git diff --check && rg -n "nativeLoaderContainer|Loading Site Data|data\.centered" src/pages/admin/index.astro public/admin/index.html`

Expected: both pages contain `nativeLoaderContainer`; neither contains the prior `data.centered` guard.

- [ ] **Step 2: Build the production site**

Run: `./node_modules/.bin/astro build`

Expected: exit code `0` and generated `dist/admin/index.html`.

- [ ] **Step 3: Verify generated loader logic**

Run: `rg -n "nativeLoaderContainer|Loading Site Data" dist/admin/index.html`

Expected: both the function name and native loader text occur.

- [x] **Step 4: Commit the focused centering fix**

Run: `git add src/pages/admin/index.astro public/admin/index.html docs/superpowers/plans/2026-07-27-admin-native-loader-centering.md && git commit -m "fix: center native admin loader"`

Expected: only the admin-loader files and plan are included.
