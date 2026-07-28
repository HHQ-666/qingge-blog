# 交互可靠性修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 稳定评论区、完成首页/加载器已有修复，并为电台加入歌手去重曲库和三种播放模式。

**Architecture:** 让 `twikoo-bootstrap.mjs` 独占 Twikoo 脚本单次加载和过期挂载保护；让 `music-playback-mode.mjs` 独占纯粹的下一曲算法。Astro 组件只负责 DOM、事件和样式，现有未提交的首页、加载器、探歌脚本先审查后纳入提交。

**Tech Stack:** Astro 5、客户端 JavaScript、Node built-in test runner、Twikoo、Meting、localStorage。

---

## 文件边界

- `src/components/HomeHero.astro`：保留已完成的桌面一言隐藏和 72ms 打字速度。
- `src/components/fun/PageLoader.astro`：保留已完成的非空元素初始化。
- `src/scripts/twikoo-bootstrap.mjs`：单次加载 Twikoo，维护宿主挂载 token。
- `src/components/Comment.astro`：渲染加载态并调用 Twikoo 模块。
- `src/scripts/music-playback-mode.mjs`：导出模式标签和下一曲索引。
- `src/components/fun/MusicPlayer.astro`：将控件、结束事件接到播放模式模块。
- `scripts/probe-songs.mjs` 和 `src/config.ts`：生成并保存可播放、歌手唯一的曲库。
- `scripts/test/twikoo-bootstrap.test.mjs`、`scripts/test/music-playback-mode.test.mjs`：Node 单元测试。

### Task 1: 审查并提交已有首页与加载器修复

**Files:**
- Modify: `src/components/HomeHero.astro:187-242, 346-365`
- Modify: `src/components/fun/PageLoader.astro:29-93`

- [ ] **Step 1: 审查现有本地 diff**

Run: `git diff -- src/components/HomeHero.astro src/components/fun/PageLoader.astro`

Expected: HomeHero 为 72ms、`isNarrow()` 和 `@media (min-width: 640px)` 显式隐藏；PageLoader 仅将已判空的 `HTMLElement` 传入 `bootPageLoader`。

- [ ] **Step 2: 先验证再提交**

Run: `pnpm astro check && pnpm build`

Expected: `0 errors` 且构建完成。

- [ ] **Step 3: 只提交这两个已审查文件**

```bash
git add src/components/HomeHero.astro src/components/fun/PageLoader.astro
git commit -m "fix: 稳定首页一言与页面加载器"
```

Expected: `scripts/probe-songs.mjs`、`.pnpm-store/`、`.tmp-screens/` 均不在提交中。

### Task 2: 用挂载 token 消除 Twikoo 重复初始化

**Files:**
- Create: `src/scripts/twikoo-bootstrap.mjs`
- Create: `scripts/test/twikoo-bootstrap.test.mjs`
- Modify: `src/components/Comment.astro:22-91, 211-232`

- [ ] **Step 1: 写出会失败的 token 测试**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { claimMount, isCurrentMount } from "../../src/scripts/twikoo-bootstrap.mjs";

test("新挂载使旧异步回调失效", () => {
  const host = { dataset: {}, isConnected: true };
  const first = claimMount(host);
  const second = claimMount(host);
  assert.equal(isCurrentMount(host, first), false);
  assert.equal(isCurrentMount(host, second), true);
});

test("已离开页面的宿主不得初始化", () => {
  const host = { dataset: {}, isConnected: true };
  const token = claimMount(host);
  host.isConnected = false;
  assert.equal(isCurrentMount(host, token), false);
});
```

- [ ] **Step 2: 运行测试确认缺失模块**

Run: `node --test scripts/test/twikoo-bootstrap.test.mjs`

Expected: FAIL，错误为找不到 `twikoo-bootstrap.mjs`。

- [ ] **Step 3: 实现纯 token 和单次脚本加载接口**

Create `src/scripts/twikoo-bootstrap.mjs`:

```js
const SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.min.js";
let scriptPromise;

export function claimMount(host) {
  const token = String(Number(host.dataset.twikooMountToken || "0") + 1);
  host.dataset.twikooMountToken = token;
  return token;
}

export function isCurrentMount(host, token) {
  return Boolean(host?.isConnected) && host.dataset.twikooMountToken === String(token);
}

export function loadTwikoo(documentRef = document) {
  const windowRef = documentRef.defaultView || window;
  if (windowRef.twikoo) return Promise.resolve(windowRef.twikoo);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = documentRef.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.dataset.qinggeTwikoo = "1";
    script.onload = () => windowRef.twikoo ? resolve(windowRef.twikoo) : reject(new Error("Twikoo global missing"));
    script.onerror = () => reject(new Error("Twikoo script failed"));
    documentRef.head.appendChild(script);
  });
  return scriptPromise;
}
```

Add `mountTwikoo(host, options)`: claim a token, render `评论加载中…`, await `loadTwikoo()`, check `isCurrentMount(host, token)`, and only then invoke `twikoo.init({ el: "#tcomment", envId, path, region, lang: "zh-CN" })`. On a rejected load, only the current host receives the failure message.

- [ ] **Step 4: 让 Comment.astro 只拥有一个路由监听器**

Put `envId`、`region`、`pathMode` onto `#tcomment` as data attributes. Replace the inline `booted`/`theme()`/new-script logic with a bundled client script:

```js
function bootComment() {
  const host = document.getElementById("tcomment");
  if (!host || host.dataset.twikooMountedPath === location.pathname) return;
  mountTwikoo(host, {
    envId: host.dataset.envId || "",
    region: host.dataset.region || undefined,
    path: host.dataset.pathMode === "url" ? location.href : location.pathname,
  });
}

if (!window.__qinggeTwikooListenerBound) {
  window.__qinggeTwikooListenerBound = true;
  document.addEventListener("swup:page:view", bootComment);
}
bootComment();
```

Do not listen to `theme-change`. Add `aria-busy` while loading plus:

```css
.twikoo-host { min-height: 5rem; display: grid; align-items: center; }
.comment-section :global(.tk-avatar),
.comment-section :global(.tk-avatar img) {
  width: 2.5rem !important;
  height: 2.5rem !important;
  max-width: 100%;
  object-fit: cover;
}
```

- [ ] **Step 5: 验证与提交评论修复**

Run: `node --test scripts/test/twikoo-bootstrap.test.mjs && pnpm astro check && pnpm build`

Expected: 测试、检查、构建通过。再以 390px 宽度完成首次进入、刷新、Swup 来回、主题切换四次手测；每次只显示一个正常评论表单。

```bash
git add src/components/Comment.astro src/scripts/twikoo-bootstrap.mjs scripts/test/twikoo-bootstrap.test.mjs
git commit -m "fix: 防止评论区重复初始化"
```

### Task 3: 用纯函数实现并测试三种播放模式

**Files:**
- Create: `src/scripts/music-playback-mode.mjs`
- Create: `scripts/test/music-playback-mode.test.mjs`
- Modify: `src/components/fun/MusicPlayer.astro:71-86, 140-270, 447-515, 894-930`

- [ ] **Step 1: 写会失败的模式测试**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { getNextIndex, nextPlaybackMode } from "../../src/scripts/music-playback-mode.mjs";

test("顺序播放在末尾回到第一首", () => assert.equal(getNextIndex("sequence", 2, 3, () => 0), 0));
test("单曲循环保留当前歌曲", () => assert.equal(getNextIndex("single", 1, 3, () => 0), 1));
test("随机播放不重复当前歌曲", () => assert.equal(getNextIndex("random", 1, 3, () => 0), 2));
test("模式按顺序循环", () => {
  assert.equal(nextPlaybackMode("sequence"), "random");
  assert.equal(nextPlaybackMode("random"), "single");
  assert.equal(nextPlaybackMode("single"), "sequence");
});
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test scripts/test/music-playback-mode.test.mjs`

Expected: FAIL，错误为找不到模块。

- [ ] **Step 3: 实现模式模块**

```js
export const PLAYBACK_MODES = ["sequence", "random", "single"];
export const PLAYBACK_MODE_LABELS = { sequence: "顺序", random: "随机", single: "单曲循环" };

export function nextPlaybackMode(mode) {
  const index = PLAYBACK_MODES.indexOf(mode);
  return PLAYBACK_MODES[(index + 1) % PLAYBACK_MODES.length];
}

export function getNextIndex(mode, index, length, random = Math.random) {
  if (length <= 0) return -1;
  if (length === 1 || mode === "single") return index;
  if (mode === "random") return (index + Math.floor(random() * (length - 1)) + 1) % length;
  return (index + 1) % length;
}
```

- [ ] **Step 4: 接入播放器 UI 与 ended 事件**

Add `#qm-playback-mode` beside `#qm-compact`, use `PLAYBACK_MODE_KEY = "qingge-music-playback-mode"` (not the existing UI layout key), restore only valid modes, and update text/title after every click. Replace the ended callback with:

```js
audio.addEventListener("ended", function () {
  const next = getNextIndex(playbackMode, index, loaded.length);
  if (next >= 0) playIndex(next, true);
});
```

Manual previous/next remains sequential. Remove the existing unused `setOpen` helper. Add a compact touch-safe mode-button style based on `.qm__compact-btn`.

- [ ] **Step 5: 验证并提交播放模式**

Run: `node --test scripts/test/music-playback-mode.test.mjs && pnpm astro check && pnpm build`

Expected: 全部通过；刷新页面后模式保留；三种模式都能按规则续播。

```bash
git add src/components/fun/MusicPlayer.astro src/scripts/music-playback-mode.mjs scripts/test/music-playback-mode.test.mjs
git commit -m "feat: 增加电台播放模式"
```

### Task 4: 生成经过验证且歌手唯一的曲库

**Files:**
- Modify: `scripts/probe-songs.mjs` only if probe evidence reveals a validation bug
- Modify: `src/config.ts:funConfig.musicPlayer.songs`

- [ ] **Step 1: 保留并运行已有探歌脚本**

Run: `git diff -- scripts/probe-songs.mjs && node scripts/probe-songs.mjs`

Expected: 输出按候选固定顺序排列的可播放、歌手唯一条目；脚本不写入任何源文件。

- [ ] **Step 2: 确定写入规则**

每位现有歌手只保留一首代表作；随后从脚本输出中按候选顺序取前 12 首新增、唯一的 80/90 年代歌曲。不得写入 `搜索无匹配`、`html-redirect`、`too-small` 或已见歌手。把脚本输出的精确 `{ id, title, artist }` 行直接粘到 `funConfig.musicPlayer.songs`。

- [ ] **Step 3: 验证缓存与实际播放后提交**

Run: `pnpm astro check && pnpm build`

Expected: 配置类型通过，修改后的 id 列表自动改变 `songIdsFingerprint()`，旧 localStorage 歌单不会复用。手测一首旧歌和三首新增歌曲后执行：

```bash
git add src/config.ts scripts/probe-songs.mjs
git commit -m "feat: 更新华语经典电台曲库"
```
