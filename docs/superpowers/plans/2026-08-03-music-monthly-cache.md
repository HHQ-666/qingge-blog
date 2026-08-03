# Music Monthly Cache and Fallback Playlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load music sources only when the player is first opened, reuse the same month's validated sources, rotate the candidate order each calendar month, and replace incomplete sources with later playable candidates.

**Architecture:** Keep the curated song pool in `funConfig.musicPlayer.songs`, but select a deterministic month-specific candidate order in the pure playlist utility module. The browser loader lazily fetches candidates until the configured visible target is filled, renders only validated full-length sources, and stores the result under a cache key scoped to the music version and calendar month.

**Tech Stack:** Astro, browser `localStorage`, native `Audio` metadata probing, Node.js built-in tests, pnpm.

---

### Task 1: Define monthly candidate and cache behavior

**Files:**
- Modify: `src/scripts/music-playlist-utils.mjs`
- Test: `scripts/test/music-playlist.test.mjs`

- [ ] Add tests for calendar-month keys, deterministic monthly candidate rotation, and a cache version bump.
- [ ] Add pure helpers that normalize a bounded candidate pool, derive `YYYY-MM`, and rotate candidates without duplicating artists.
- [ ] Keep the visible playlist capped at 30 items while allowing a larger fallback candidate pool.

### Task 2: Make the browser loader lazy and replacement-based

**Files:**
- Modify: `src/components/fun/MusicPlayer.astro`
- Test: `scripts/test/music-playlist.test.mjs`

- [ ] Remove idle-time source fetching when the panel is collapsed; opening full or compact mode remains the load trigger.
- [ ] Scope `localStorage` to the current month and music version, with no six-hour expiry.
- [ ] Fetch candidates in order until the visible target is full, keep only `ready` results, and continue past short/failed sources.
- [ ] Render only complete-source rows and keep the existing playback recovery lock.

### Task 3: Supply a monthly-rotating source pool

**Files:**
- Modify: `src/config.ts`
- Modify: `README.md`

- [ ] Expand the curated pool with verified classic-song candidates and set the visible target to 25–30 songs.
- [ ] Remove the misleading six-hour cache setting and document first-open/monthly refresh behavior.

### Task 4: Verify and deploy

**Files:**
- Test: `scripts/test/music-playlist.test.mjs`

- [ ] Run focused music tests, the full test suite, `pnpm check`, and production build.
- [ ] Review the diff and commit the verified changes.
- [ ] Push `main` to trigger the production deployment.
