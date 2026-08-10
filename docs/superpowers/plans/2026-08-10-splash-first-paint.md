# Splash First-Paint Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage splash fully opaque on the first browser paint, hold it for 3 seconds, and fade it out over 0.8 seconds.

**Architecture:** Keep the existing server-rendered `Splash.astro` overlay and session behavior. Remove only the root opacity entrance, give the overlay an opaque fallback background, and pass the configured fade duration into CSS through a custom property so CSS and JavaScript share one timing source.

**Tech Stack:** Astro 5, TypeScript configuration, component-scoped CSS, Node.js built-in test runner, in-app browser QA.

---

## File map

- Create `scripts/test/splash-first-paint.test.mjs`: source-level regression tests for the configured timings, opaque first paint, and shared fade variable.
- Modify `src/config.ts`: set the approved 3000ms hold and 800ms fade values.
- Modify `src/components/Splash.astro`: remove the transparent root entrance, add the opaque fallback, and bind `fadeMs` to `--splash-fade`.

### Task 1: Lock the approved splash contract with a failing test

**Files:**
- Create: `scripts/test/splash-first-paint.test.mjs`
- Read: `src/config.ts`
- Read: `src/components/Splash.astro`

- [ ] **Step 1: Create the regression test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [configSource, splashSource] = await Promise.all([
	readFile(new URL("../../src/config.ts", import.meta.url), "utf8"),
	readFile(new URL("../../src/components/Splash.astro", import.meta.url), "utf8"),
]);

test("splash uses the approved three-second hold and 0.8-second fade", () => {
	assert.match(configSource, /splash:\s*\{[\s\S]*?durationMs:\s*3000,/);
	assert.match(configSource, /splash:\s*\{[\s\S]*?fadeMs:\s*800,/);
	assert.match(splashSource, /data-duration=\{splash\.durationMs\}/);
	assert.match(splashSource, /data-fade=\{splash\.fadeMs\}/);
});

test("splash is opaque on first paint and shares the configured fade duration with CSS", () => {
	assert.match(splashSource, /style=\{`--splash-fade: \$\{splash\.fadeMs\}ms`\}/);
	assert.match(splashSource, /\.site-splash\s*\{[\s\S]*?background:\s*#0c0804;/);
	assert.match(splashSource, /\.site-splash\s*\{[\s\S]*?opacity:\s*1;/);
	assert.doesNotMatch(splashSource, /animation:\s*splash-in/);
	assert.doesNotMatch(splashSource, /@keyframes\s+splash-in/);
	assert.match(
		splashSource,
		/\.site-splash\.is-leaving\s*\{[\s\S]*?animation:\s*splash-out var\(--splash-fade, 800ms\)/,
	);
});
```

- [ ] **Step 2: Run the focused test and verify that it fails**

Run:

```bash
node --test scripts/test/splash-first-paint.test.mjs
```

Expected: FAIL because `durationMs` is still `3200`, `fadeMs` is still `900`, and the root still uses `splash-in`.

### Task 2: Implement the minimal first-paint and timing fix

**Files:**
- Modify: `src/config.ts:205-212`
- Modify: `src/components/Splash.astro:12-21,62-63,100-111,188-195`
- Test: `scripts/test/splash-first-paint.test.mjs`

- [ ] **Step 1: Change only the approved configuration values**

Use this splash configuration:

```ts
	splash: {
		enable: true,
		durationMs: 3000,
		fadeMs: 800,
		oncePerSession: true,
		title: "清哥的小屋",
		subtitle: "愿每一次停留，都能遇见一点温柔。",
	},
```

Preserve the existing title and subtitle if their current text differs; only `durationMs` and `fadeMs` are behavior changes.

- [ ] **Step 2: Bind the CSS fade variable on the server-rendered overlay**

Add the `style` attribute to the existing splash root:

```astro
			<div
				id="site-splash"
				class="site-splash"
				role="dialog"
				aria-label="开场画面"
				aria-modal="true"
				data-duration={splash.durationMs}
				data-fade={splash.fadeMs}
				data-once={splash.oncePerSession ? "1" : "0"}
				style={`--splash-fade: ${splash.fadeMs}ms`}
			>
```

- [ ] **Step 3: Align JavaScript fallbacks with the approved values**

Replace the two fallback lines with:

```js
					const duration = Number(el.getAttribute("data-duration") || 3000);
					const fade = Number(el.getAttribute("data-fade") || 800);
```

- [ ] **Step 4: Make the root opaque without removing its internal motion**

Use this root CSS and leave `site-splash__img`, `site-splash__content`, `splash-kenburns`, and `splash-rise` unchanged:

```css
	.site-splash {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		background: #0c0804;
		opacity: 1;
	}
	.site-splash.is-leaving {
		animation: splash-out var(--splash-fade, 800ms) ease forwards;
		pointer-events: none;
	}
```

Delete the complete `@keyframes splash-in` block. Do not change the `splash-out` keyframes.

- [ ] **Step 5: Run the focused test**

Run:

```bash
node --test scripts/test/splash-first-paint.test.mjs
```

Expected: 2 tests pass.

- [ ] **Step 6: Run formatting and static checks without rewriting unrelated files**

Run:

```bash
pnpm exec biome check src/components/Splash.astro src/config.ts scripts/test/splash-first-paint.test.mjs
pnpm check
```

Expected: both commands exit 0. If `pnpm check` reports a pre-existing error outside these three files, record it separately and do not modify that unrelated file.

- [ ] **Step 7: Commit the splash fix without staging the existing import-order change**

```bash
git add scripts/test/splash-first-paint.test.mjs src/config.ts
git add -p src/components/Splash.astro
git diff --cached -- src/components/Splash.astro
git commit -m "fix: prevent homepage flash before splash"
```

Before committing, run `git diff --cached --name-only` and require exactly those three paths. In the cached diff for `Splash.astro`, require the fade variable, fallback timings, opaque background, and `splash-in` removal; reject the pre-existing import reorder from the staged patch.

### Task 3: Verify real browser timing and first paint

**Files:**
- Verify: `src/components/Splash.astro`
- Verify: `src/config.ts`

- [ ] **Step 1: Start or reuse the local Astro server**

Run:

```bash
pnpm dev --host 127.0.0.1
```

Expected: Astro reports a local URL and remains running.

- [ ] **Step 2: Inspect a fresh tab before the hold expires**

Use the in-app browser skill, open a new tab to the local homepage, and immediately read this state:

```js
await splashTab.playwright.evaluate(() => {
	const splash = document.querySelector("#site-splash");
	if (!splash) return { present: false };
	const style = getComputedStyle(splash);
	const rect = splash.getBoundingClientRect();
	return {
		present: true,
		opacity: style.opacity,
		backgroundColor: style.backgroundColor,
		coversViewport:
			rect.left === 0 &&
			rect.top === 0 &&
			rect.width === window.innerWidth &&
			rect.height === window.innerHeight,
	};
});
```

Expected within the first 3 seconds:

```js
{
	present: true,
	opacity: "1",
	backgroundColor: "rgb(12, 8, 4)",
	coversViewport: true,
}
```

- [ ] **Step 3: Verify the automatic close boundary**

Open another fresh tab. Check that `#site-splash` exists before 3000ms, has `is-leaving` shortly after 3000ms, and is absent after 3800ms plus a 150ms scheduling margin.

Expected: the node is absent by approximately 3950ms and `document.documentElement.classList.contains("splash-active")` is `false`.

- [ ] **Step 4: Verify the skip button uses the same 800ms fade**

Open another fresh tab, click the `进入小屋` button, confirm `is-leaving` is applied immediately, wait 850ms, and confirm the node is gone.

Expected: no homepage content is visible before the click; the splash is absent after the fade; no console warnings or errors are added.

- [ ] **Step 5: Run the production build**

Run:

```bash
pnpm build
```

Expected: Astro build and Pagefind indexing complete successfully.
