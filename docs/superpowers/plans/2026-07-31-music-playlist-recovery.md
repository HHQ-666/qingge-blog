# 音乐播放器 30 首在线曲库恢复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the music player as a 20–30 song online playlist, keep every configured song visible, and make source failures recoverable without falsely presenting preview clips as full tracks.

**Architecture:** Keep `funConfig.musicPlayer.songs` as the curated source of truth and add a small pure utility module for playlist limits, artist de-duplication, cache fingerprints, API normalization, and duration classification. Refactor the inline player loader to maintain one state record per configured song, fetch sources with bounded fallback/retry behavior, validate audio metadata through a temporary `Audio` element, and render both ready and failed rows in configured order.

**Tech Stack:** Astro 5, TypeScript config, browser-native `Audio`, localStorage, Node.js built-in test runner, pnpm.

---

## File structure

- Create: `src/scripts/music-playlist-utils.mjs` — pure playlist normalization, cache fingerprint, API payload normalization, and duration classification helpers shared by Astro and tests.
- Create: `scripts/test/music-playlist.test.mjs` — unit and source-level regression tests for the 30-song limit, unique artists, cache invalidation, payload normalization, and preview classification.
- Modify: `src/config.ts:238-279` — curate the final 30-song list, one representative song per artist, and retain the current online API settings.
- Modify: `src/components/fun/MusicPlayer.astro:10-13` — normalize the configured list and expose the minimum-duration rule to the client.
- Modify: `src/components/fun/MusicPlayer.astro:150-735` — replace success-only loading with per-song state, bounded fallback loading, metadata probing, partial-cache hydration, retry behavior, and complete-list rendering.
- Modify: `src/components/fun/MusicPlayer.astro:1200-1245` — style unavailable/loading rows and keep a 30-row list readable in the existing scroll area.
- Modify: `scripts/probe-songs.mjs:16-86` — make the probe’s candidate set match the final 30-song target and keep the output restricted to one verified song per artist.

## Task 1: Add pure playlist and source helpers with tests

**Files:**
- Create: `src/scripts/music-playlist-utils.mjs`
- Create: `scripts/test/music-playlist.test.mjs`

- [ ] **Step 1: Write the failing tests for playlist normalization and fingerprints**

Add tests that use small fixtures and assert the exact public behavior:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PLAYLIST_SIZE,
  classifyDuration,
  getApiFingerprint,
  getSongIdsFingerprint,
  normalizeApiSong,
  normalizeSongConfig,
} from "../../src/scripts/music-playlist-utils.mjs";

const song = (id, artist = `歌手${id}`) => ({
  id: String(id),
  title: `歌曲${id}`,
  artist,
});

test("normalizes to at most 30 songs and keeps the first song per artist", () => {
  const entries = [song(1, "甲"), song(2, "甲"), ...Array.from({ length: 35 }, (_, i) => song(i + 3))];
  const normalized = normalizeSongConfig(entries);

  assert.equal(MAX_PLAYLIST_SIZE, 30);
  assert.equal(normalized.length, 30);
  assert.equal(normalized.filter((item) => item.artist === "甲").length, 1);
  assert.equal(normalized[0].id, "1");
});

test("cache fingerprints change when songs or APIs change", () => {
  assert.notEqual(getSongIdsFingerprint([song(1)]), getSongIdsFingerprint([song(2)]));
  assert.notEqual(getApiFingerprint("https://a.test", ["https://b.test"]), getApiFingerprint("https://a.test", ["https://c.test"]));
  assert.equal(getApiFingerprint("https://a.test", ["https://a.test", "https://b.test"]), "https://a.test|https://b.test");
});

test("normalizes Meting payloads without trusting missing fields", () => {
  const normalized = normalizeApiSong(song(7, "歌手甲"), {
    url: "https://audio.test/7.mp3",
    pic: "https://image.test/7.jpg",
    title: "接口歌曲",
    author: "接口歌手",
  });

  assert.deepEqual(normalized, {
    id: "7",
    name: "歌曲7",
    artist: "歌手甲",
    url: "https://audio.test/7.mp3",
    cover: "https://image.test/7.jpg",
    duration: null,
  });
  assert.equal(normalizeApiSong(song(8), { title: "没有音源" }), null);
});

test("classifies full-length, preview, and unknown durations", () => {
  assert.equal(classifyDuration(180, 90), "ready");
  assert.equal(classifyDuration(45, 90), "short");
  assert.equal(classifyDuration(0, 90), "unknown");
  assert.equal(classifyDuration(Number.NaN, 90), "unknown");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test scripts/test/music-playlist.test.mjs`

Expected: FAIL because `src/scripts/music-playlist-utils.mjs` does not exist yet.

- [ ] **Step 3: Implement the minimal pure helpers**

Create `src/scripts/music-playlist-utils.mjs` with these stable interfaces:

```js
export const MAX_PLAYLIST_SIZE = 30;
export const MUSIC_CACHE_VERSION = "v3";

export function normalizeSongConfig(entries) {
  const seenArtists = new Set();
  const normalized = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    const id = String(entry?.id || "").trim();
    const title = String(entry?.title || entry?.name || "").trim();
    const artist = String(entry?.artist || "").trim();
    const artistKey = artist.toLocaleLowerCase();
    if (!id || !title || !artist || seenArtists.has(artistKey)) continue;
    seenArtists.add(artistKey);
    normalized.push({ id, title, artist });
    if (normalized.length === MAX_PLAYLIST_SIZE) break;
  }
  return normalized;
}

export function getSongIdsFingerprint(songs) {
  return songs.map((song) => String(song.id)).join(",");
}

export function getApiFingerprint(api, fallbackApis) {
  return [...new Set([api, ...(Array.isArray(fallbackApis) ? fallbackApis : [])].filter(Boolean))].join("|");
}

export function normalizeApiSong(meta, payload) {
  const source = Array.isArray(payload) ? payload[0] : payload;
  const url = String(source?.url || "").trim();
  if (!url) return null;
  const duration = Number(source?.duration);
  return {
    id: String(meta.id),
    name: meta.title || source.name || source.title || String(meta.id),
    artist: meta.artist || source.artist || source.author || "",
    url,
    cover: source.pic || source.cover || "",
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
  };
}

export function classifyDuration(duration, minDurationSec) {
  const value = Number(duration);
  const minimum = Number(minDurationSec);
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(minimum) || minimum <= 0) return "unknown";
  return value >= minimum ? "ready" : "short";
}
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --test scripts/test/music-playlist.test.mjs`

Expected: PASS with all playlist utility tests passing.

- [ ] **Step 5: Commit the pure helper boundary**

```bash
git add src/scripts/music-playlist-utils.mjs scripts/test/music-playlist.test.mjs
git commit -m "test: add music playlist source helpers"
```

## Task 2: Curate and validate the 30-song configuration

**Files:**
- Modify: `src/config.ts:238-279`
- Modify: `scripts/probe-songs.mjs:16-86`
- Test: `scripts/test/music-playlist.test.mjs`

- [ ] **Step 1: Define the exact candidate order**

Keep the existing 20 entries that already have stable IDs, then add these ten unique-artist candidates in this order:

```js
[
  ["朋友", "周华健"],
  ["千千阙歌", "陈慧娴"],
  ["忘情水", "刘德华"],
  ["领悟", "辛晓琪"],
  ["我期待", "张雨生"],
  ["恋曲1990", "罗大佑"],
  ["征服", "那英"],
  ["再回首", "姜育恒"],
  ["至少还有你", "林忆莲"],
  ["爱的代价", "张艾嘉"],
]
```

Add these candidates to `scripts/probe-songs.mjs`, before the broader fallback candidates, so the script resolves IDs from the active API instead of relying on guessed IDs.

- [ ] **Step 2: Probe the candidates and record only verified results**

Run: `node scripts/probe-songs.mjs`

Expected: the output contains one matching, playable result per selected artist. Copy the exact generated `{ id, title, artist }` lines into `src/config.ts`; do not copy a result whose title or artist does not match the candidate.

If the configured API cannot be reached, keep the existing 20 verified entries, record the blocked probe in the task notes, and do not invent IDs. The player changes in later tasks still support up to 30 entries and will display unavailable rows correctly.

- [ ] **Step 3: Add a source-level configuration test**

Extend `scripts/test/music-playlist.test.mjs` to read `src/config.ts`, isolate the `songs` array, and assert that it contains between 20 and 30 `{ id, title, artist }` entries with no repeated `artist` values. Use a narrow regular expression matching the existing object format so unrelated site configuration is not counted.

- [ ] **Step 4: Run the configuration tests**

Run: `node --test scripts/test/music-playlist.test.mjs`

Expected: PASS; the configured song count is between 20 and 30 and all configured artists are unique.

- [ ] **Step 5: Commit the curated configuration**

```bash
git add src/config.ts scripts/probe-songs.mjs scripts/test/music-playlist.test.mjs
git commit -m "feat: curate extended classic music playlist"
```

## Task 3: Normalize configuration and cache inputs in the Astro component

**Files:**
- Modify: `src/components/fun/MusicPlayer.astro:1-20,150-260`

- [ ] **Step 1: Import and apply the shared helpers in frontmatter**

Change the frontmatter to import `normalizeSongConfig`, compute `songs` from the configured list, and expose `minDurationSec` as a `data-min-duration` attribute:

```astro
import {
  normalizeSongConfig,
} from "../../scripts/music-playlist-utils.mjs";

const conf = funConfig.musicPlayer;
const songs = normalizeSongConfig(conf?.songs);
const enabled = Boolean(conf?.enable && songs.length);
const minDurationSec = String(conf?.minDurationSec ?? 90);
```

Add `data-min-duration={minDurationSec}` to `#qingge-music`.

- [ ] **Step 2: Replace the cache constants and fingerprints**

Inside the browser script, import `MUSIC_CACHE_VERSION`, `classifyDuration`, `getApiFingerprint`, `getSongIdsFingerprint`, and `normalizeApiSong`. Replace the hard-coded `qingge-music-playlist-v2` and duplicated fingerprint logic with:

```js
var CACHE_KEY = "qingge-music-playlist-" + MUSIC_CACHE_VERSION;
var apiFingerprint = getApiFingerprint(apiBases[0], apiBases.slice(1));
var songIdsFingerprint = function () { return getSongIdsFingerprint(songs); };
var minDurationSec = parseFloat(root.getAttribute("data-min-duration") || "90");
if (!isFinite(minDurationSec) || minDurationSec <= 0) minDurationSec = 90;
```

Keep the existing cache age check, require `data.version === MUSIC_CACHE_VERSION`, and allow a cache to contain a partial `items` array; later tasks will fetch every configured ID missing from that array.

- [ ] **Step 3: Run static checks before changing behavior**

Run: `pnpm check`

Expected: PASS or only pre-existing diagnostics; the new helper import and data attribute must not add errors.

## Task 4: Refactor loading to maintain one state per configured song

**Files:**
- Modify: `src/components/fun/MusicPlayer.astro:215-715`

- [ ] **Step 1: Add explicit per-song state and pure ordering helpers**

Replace success-only `loaded` assumptions with state records in configured order:

```js
var songStates = songs.map(function (meta) {
  return { meta: meta, status: "loading", item: null, reason: "" };
});
var loaded = [];

function syncLoaded() {
  loaded = songStates
    .filter(function (state) { return state.status === "ready" && state.item; })
    .map(function (state) { return state.item; });
  if (loaded.length && index >= loaded.length) index = 0;
}

function readyIndexForState(state) {
  var readyIndex = 0;
  for (var i = 0; i < songStates.length; i++) {
    if (songStates[i] === state) return state.status === "ready" ? readyIndex : -1;
    if (songStates[i].status === "ready") readyIndex++;
  }
  return -1;
}
```

Use `syncLoaded()` after every state update so playback order follows configuration order, not response completion order.

- [ ] **Step 2: Add bounded API requests and source normalization**

Update `fetchSongFromApi(meta, base)` to:

1. Abort the API request after 12 seconds.
2. Treat HTTP 429 as a 30–60 second cooldown for that base.
3. Normalize the JSON response with `normalizeApiSong(meta, data)`.
4. Stop using a browser `fetch()` with a `Range` header against the returned audio URL; that extra cross-origin probe can reject a playable URL before the media element sees it.
5. Return the normalized item to the audio metadata probe.

Add this browser-native probe:

```js
function probeAudio(item) {
  return new Promise(function (resolve) {
    var probe = new Audio();
    var timer = window.setTimeout(function () {
      probe.src = "";
      resolve({ status: "failed", reason: "metadata-timeout" });
    }, 12000);
    function finish(result) {
      window.clearTimeout(timer);
      probe.onloadedmetadata = null;
      probe.onerror = null;
      probe.src = "";
      resolve(result);
    }
    probe.preload = "metadata";
    probe.onloadedmetadata = function () {
      var duration = Number(probe.duration);
      var state = classifyDuration(duration, minDurationSec);
      if (state === "short") finish({ status: "short", reason: "duration-too-short", duration: duration });
      else if (state === "ready") finish({ status: "ready", duration: duration });
      else finish({ status: "failed", reason: "invalid-duration" });
    };
    probe.onerror = function () { finish({ status: "failed", reason: "audio-error" }); };
    probe.src = item.url;
    probe.load();
  });
}
```

Attach `duration` to ready items before writing them to cache.

- [ ] **Step 3: Make API fallback distinguish unavailable and short sources**

Update `fetchSong(meta)` so it tries every non-cooled API in order. A source that returns a preview shorter than `minDurationSec` must not stop the fallback chain; only a ready item ends the chain. If every source fails, return the last meaningful status (`short` if every source was short, otherwise `failed`).

- [ ] **Step 4: Update the loading loop to hydrate cached items and fetch missing items**

Implement these behaviors:

- `applyCachedItems(items)` marks matching records as `ready` only when the cached item has a URL and a stored duration classified as `ready`.
- Missing or invalid cached records remain `loading` and are fetched.
- `fetchAll()` runs at most two requests at a time, updates the matching `songStates[i]`, calls `syncLoaded()`, rebuilds the list, and updates the progress summary after each result.
- A failed item is marked with its reason but does not reject the whole `Promise.all`.
- Cache writes contain `{ version, ts, api, ids, items }` and write only ready items.

- [ ] **Step 5: Run the existing and focused tests**

Run: `pnpm test`

Expected: all existing playback-mode, worker, admin, and new playlist tests pass.

## Task 5: Render all song states and preserve playback controls

**Files:**
- Modify: `src/components/fun/MusicPlayer.astro:350-430,640-715`
- Modify: `src/components/fun/MusicPlayer.astro:1200-1245`

- [ ] **Step 1: Render configured rows instead of only successful rows**

Change `buildList()` to loop over `songStates`. Each row must retain the configured number and show the configured title/artist even before a source is available. Add a status span whose text is derived from the state:

```js
function stateLabel(state) {
  if (state.status === "ready") return "可播放";
  if (state.status === "short") return "非完整音源 · 重试";
  if (state.status === "failed") return "音源暂不可用 · 重试";
  return "正在获取音源";
}
```

Ready rows call `playIndex(readyIndex, true)`. Failed/short rows call `retrySong(stateIndex)`. Do not call `playIndex` with the configured index because `loaded` contains ready items only.

- [ ] **Step 2: Update active-row highlighting and summary text**

Highlight by `data-playable-index`, not by the raw list position. Update the tip text to show `共 N 首 · 当前可播放 M 首`; while loading, append the number of pending rows. The empty state must say `暂无可用音源，但歌单仍保留` and keep all configured rows visible.

- [ ] **Step 3: Add retry behavior for one row**

Implement `retrySong(stateIndex)` to mark that state as `loading`, fetch only its metadata, update the state, sync `loaded`, rebuild the list, and preserve the current playback item when possible. If the retried item becomes ready, keep the current index stable unless there was no playable song before.

- [ ] **Step 4: Keep all navigation paths on the ready-only index**

Verify that full-mode previous/next, compact-mode previous/next, media-session previous/next, automatic end handling, and random/single playback all use `loaded.length` and never target a failed row. A manual failed-row click must use `retrySong` instead.

- [ ] **Step 5: Style states without changing the existing visual language**

Add only focused styles:

```css
.qm__item { min-width: 0; }
.qm__item.is-unavailable { opacity: 0.62; }
.qm__item.is-unavailable:hover { background: rgba(255,255,255,0.06); }
.qm__item-status {
  margin-left: auto;
  flex: 0 0 auto;
  font-size: 0.62rem;
  opacity: 0.58;
  white-space: nowrap;
}
```

Keep `max-height` and scrolling so 30 rows do not expand the fixed player beyond the viewport. Add a mobile rule only if the status text collides with the title; in that case reduce status font size and allow it to wrap within the right edge.

- [ ] **Step 6: Run focused tests and source checks**

Run: `node --test scripts/test/music-playlist.test.mjs scripts/test/music-playback-mode.test.mjs`

Expected: PASS; the source-level assertions confirm the all-rows state labels, cache v3, max playlist limit, and retry handler are present.

## Task 6: Verify the full site and browser behavior

**Files:**
- Modify: none

- [ ] **Step 1: Run formatting and static checks**

Run: `pnpm exec biome check src/scripts/music-playlist-utils.mjs src/components/fun/MusicPlayer.astro src/config.ts`

Expected: no new formatting or lint diagnostics. Do not format unrelated files.

- [ ] **Step 2: Run the complete test suite**

Run: `pnpm test`

Expected: all Node tests pass, including the new playlist tests.

- [ ] **Step 3: Run Astro diagnostics and production build**

Run: `pnpm check`

Expected: Astro reports zero errors.

Run: `ASTRO_TELEMETRY_DISABLED=1 pnpm build`

Expected: production build and Pagefind indexing complete successfully.

- [ ] **Step 4: Verify desktop and mobile player behavior**

Run: `pnpm dev -- --host 127.0.0.1 --port 4323`

Verify in the browser:

1. Open the music panel and confirm all configured rows appear in configured order.
2. Confirm the summary reports total configured songs separately from ready songs.
3. Confirm a failed row remains visible and its retry action affects only that row.
4. Confirm a ready row plays, seeks, updates metadata, and advances according to the selected playback mode.
5. Confirm compact mode and media-session controls still operate on ready songs.
6. Confirm the 30-row list scrolls on desktop and mobile without covering the viewport.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/scripts/music-playlist-utils.mjs scripts/test/music-playlist.test.mjs src/config.ts scripts/probe-songs.mjs src/components/fun/MusicPlayer.astro
git commit -m "fix: restore resilient music playlist loading"
```

## Self-review checklist

- Spec coverage: the plan covers the 20–30 song cap, unique artists, online fallback, full-length validation, visible failed rows, retry, cache invalidation, playback modes, responsive list behavior, and all requested verification commands.
- Placeholder scan: no implementation step depends on an unfinished marker or unspecified external file; the only conditional branch is the explicit network-blocked probe behavior, which prevents inventing unverified song IDs.
- Type consistency: `normalizeSongConfig`, `getSongIdsFingerprint`, `getApiFingerprint`, `normalizeApiSong`, and `classifyDuration` are defined once in `music-playlist-utils.mjs` and imported by both the player and tests. Browser song states use `meta`, `status`, `item`, and `reason` consistently across loading, rendering, retry, and playback.
