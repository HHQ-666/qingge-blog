# Music Complete Sources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide incomplete music sources and expand the playlist with candidates that pass the existing full-length verification.

**Architecture:** Keep configured songs as metadata candidates. Resolve each candidate through the primary and fallback APIs, probe the returned audio duration in the browser, and expose only ready states through one pure filtering helper. Bump the cache version so old results cannot bypass the new visibility rule.

**Tech Stack:** Astro, browser `Audio` metadata loading, native Node test runner, pnpm.

---

### Task 1: Add the ready-state boundary and failing tests

**Files:**
- Modify: `src/scripts/music-playlist-utils.mjs`
- Modify: `scripts/test/music-playlist.test.mjs`

- [x] **Step 1: Add a pure ready-state filter test**

Add a test with loading, short, failed, and ready states. Assert that only states with `status: "ready"` and a non-null `item` are returned, preserving their order.

```js
test("keeps only complete ready states for the visible playlist", () => {
	const states = [
		{ status: "loading", item: null },
		{ status: "short", item: null },
		{ status: "ready", item: { id: "ready-1" } },
		{ status: "failed", item: null },
		{ status: "ready", item: null },
		{ status: "ready", item: { id: "ready-2" } },
	];

	assert.deepEqual(
		getPlayableSongStates(states).map((state) => state.item.id),
		["ready-1", "ready-2"],
	);
});
```

- [x] **Step 2: Run the focused test and confirm the helper is missing**

Run: `node --test scripts/test/music-playlist.test.mjs`

Expected: the new test fails because `getPlayableSongStates` is not exported yet.

- [x] **Step 3: Implement the minimal pure helper and cache version bump**

Export:

```js
export function getPlayableSongStates(states) {
	return (Array.isArray(states) ? states : []).filter(
		(state) => state?.status === "ready" && state?.item,
	);
}
```

Change `MUSIC_CACHE_VERSION` from `"v3"` to `"v4"`.

- [x] **Step 4: Run the focused playlist tests**

Run: `node --test scripts/test/music-playlist.test.mjs`

Expected: all playlist tests pass.

### Task 2: Render only complete songs

**Files:**
- Modify: `src/components/fun/MusicPlayer.astro`
- Modify: `scripts/test/music-playlist.test.mjs`

- [x] **Step 1: Import the ready-state helper**

Add `getPlayableSongStates` to the existing import from `music-playlist-utils.mjs`.

- [x] **Step 2: Use the helper for loaded items and list rows**

Replace the `syncLoaded()` state filter with `getPlayableSongStates(songStates)`. In `buildList()`, iterate over the helper result rather than all `songStates`; number rows from the visible index, set the playable index to that same index, and remove retry click handlers for unavailable rows.

The resulting row boundary must be equivalent to:

```js
var visibleStates = getPlayableSongStates(songStates);
for (var i = 0; i < visibleStates.length; i++) {
	var state = visibleStates[i];
	var s = state.item;
	var playableIndex = i;
	// render only this ready state
}
```

Remove the unused unavailable `stateLabel()` and `readyIndexForState()` branches once the list no longer renders non-ready states.

- [x] **Step 3: Update summary text for the visible playlist**

Use the ready count in the final summary:

```js
if (pendingCount) {
	tipEl.textContent = "正在获取完整音源 · 已找到 " + readyCount + " 首";
} else if (!readyCount) {
	tipEl.textContent = "暂无完整音源";
} else {
	tipEl.textContent = "共 " + readyCount + " 首完整音源";
}
```

Keep the existing progress bar and loading title behavior otherwise unchanged.

- [x] **Step 4: Update the source-level regression test**

Replace assertions that require visible “非完整音源 · 重试” rows with assertions that the player imports `getPlayableSongStates`, filters `songStates` through it, and contains the “完整音源” summary text. Assert that the unavailable-row text is absent.

- [x] **Step 5: Run focused admin and playlist tests**

Run: `node --test scripts/test/admin-style-isolation.test.mjs scripts/test/music-playlist.test.mjs`

Expected: all focused tests pass.

### Task 3: Add only verified candidate songs

**Files:**
- Modify: `src/config.ts`
- Verify: `scripts/probe-songs.mjs`

- [x] **Step 1: Run the existing candidate probe**

Run: `node scripts/probe-songs.mjs`

Use only candidates reported as passed. Do not invent IDs or add candidates that fail artist matching, URL validation, or the script’s completeness checks.

- [x] **Step 2: Extend the configured song list with passed candidates**

Add passed candidates to `funConfig.musicPlayer.songs` while preserving unique artists and the `MAX_PLAYLIST_SIZE` limit. Keep the existing configured order first, then append verified additions.

- [x] **Step 3: Verify configuration invariants**

Run: `node --test scripts/test/music-playlist.test.mjs`

Expected: the configuration contains between 20 and 30 entries with unique artists.

### Task 4: Run full validation and review the scoped diff

**Files:**
- Verify: all files changed in Tasks 1–3

- [x] **Step 1: Run formatting checks on changed source files**

Run: `pnpm exec biome check src/scripts/music-playlist-utils.mjs src/components/fun/MusicPlayer.astro src/config.ts`

Expected: no new diagnostics for the changed files.

- [ ] **Step 2: Run the complete test suite**

Run: `pnpm test`

Expected: all repository tests pass. Existing unrelated failures must be resolved or explicitly reported before completion.

Observed: 29/31 passed; two pre-existing failures remain in `scripts/test/admin-content-covers.test.mjs` for the YAML anchor regex and the draft test post without a cover.

- [x] **Step 3: Run Astro diagnostics and production build**

Run: `pnpm check`

Expected: zero errors.

Run: `ASTRO_TELEMETRY_DISABLED=1 pnpm build`

Expected: static pages and Pagefind index complete successfully.

- [x] **Step 4: Review Git status and diff scope**

Run: `git diff --check` and `git status --short --branch`.

Confirm that only the music feature files and its design/plan records were added to the current pre-existing worktree changes.
