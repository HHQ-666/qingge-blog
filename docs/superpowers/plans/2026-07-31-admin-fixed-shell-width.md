# Admin Fixed Shell Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Keep the Sveltia CMS workspace at a stable approximately 1000 px desktop width when switching article categories, without adding a horizontal scrollbar or affecting public pages.

**Architecture:** Both admin entry documents will share the same admin-only shell width rule. The ready CMS root will use `min(100%, var(--admin-shell-width))` and be centered, while the fullscreen rules will target only the runtime loading/sign-in element marked by `qingge-center-target`. A source-level regression test will enforce parity between the Astro route and static fallback entry.

**Tech Stack:** Astro, static HTML, CSS, browser DOM APIs, Node.js built-in test runner, pnpm.

---

### Task 1: Add a failing regression test for the isolated fixed-width rules

**Files:**
- Modify: `scripts/test/admin-style-isolation.test.mjs`

- [ ] **Step 1: Read both admin entry documents in the test setup**

Keep the existing Astro `source` binding for the current tests, and read the static fallback beside it:

```js
const [source, staticSource] = await Promise.all([
	readFile(new URL("../../src/pages/admin/index.astro", import.meta.url), "utf8"),
	readFile(new URL("../../public/admin/index.html", import.meta.url), "utf8"),
]);
const adminSources = [source, staticSource];
```

Keep the existing tests focused on the Astro source, because they assert the route-specific `admin-page` marker and Astro isolation boundary.

- [ ] **Step 2: Add assertions for the fixed shell and loader-only fullscreen selector**

Add this test after the existing viewport test:

```js
test("both admin entries keep a fixed CMS shell and isolate loader fullscreen styles", () => {
	for (const source of adminSources) {
		assert.match(source, /--admin-shell-width:\s*1000px/);
		assert.match(source, /width:\s*min\(100%,\s*var\(--admin-shell-width\)\)\s*!important/);
		assert.match(source, /max-width:\s*var\(--admin-shell-width\)\s*!important/);
		assert.match(source, /\.qingge-center-target\s*\{/);
		assert.doesNotMatch(source, /\.sui\.app-shell\s*>\s*\.container\s*,/);
		assert.doesNotMatch(source, /div\.container\[role="none"\]\s*,/);
		assert.doesNotMatch(source, /\.sui\.app-shell \.container:has\(button\)\s*,/);
		assert.doesNotMatch(source, /\.sui\.app-shell\s*>\s*\.container\s*>\s*\.inner\s*,/);
		assert.doesNotMatch(source, /div\.container\[role="none"\]\s*>\s*\.inner\s*\{/);
	}
});
```

- [ ] **Step 3: Run the focused test and verify it fails for the current broad selectors**

Run:

```bash
node --test scripts/test/admin-style-isolation.test.mjs
```

Expected: the existing tests pass, and the new test fails because neither entry defines `--admin-shell-width` and both still contain the broad `.container` selectors.

### Task 2: Apply the fixed-width shell and limit fullscreen rules to the loader target

**Files:**
- Modify: `src/pages/admin/index.astro:25-96, 562-571`
- Modify: `public/admin/index.html:10-81, 554-563`

- [ ] **Step 1: Add the admin-only shell width variable**

Add this declaration to the existing `html:has(body.admin-page), body.admin-page` rule in the Astro entry, and to the existing `html, body` rule in the static entry:

```css
--admin-shell-width: 1000px;
```

- [ ] **Step 2: Constrain only the CMS root chain to the stable width**

In the Astro entry, replace the root-chain width and add centering/minimum-width protection:

```css
body.admin-page > div:not(#admin-gate):not(#admin-boot),
body.admin-page #nc-root,
body.admin-page .sui.app-shell {
	position: relative !important;
	box-sizing: border-box !important;
	width: min(100%, var(--admin-shell-width)) !important;
	max-width: var(--admin-shell-width) !important;
	min-width: 0 !important;
	margin-inline: auto !important;
	min-height: 100% !important;
	min-height: 100dvh !important;
	height: 100% !important;
	height: 100dvh !important;
}
```

In the static entry, apply the same declarations to its existing unqualified selector list:

```css
body > div:not(#admin-gate):not(#admin-boot),
#nc-root,
.sui.app-shell {
	position: relative !important;
	box-sizing: border-box !important;
	width: min(100%, var(--admin-shell-width)) !important;
	max-width: var(--admin-shell-width) !important;
	min-width: 0 !important;
	margin-inline: auto !important;
	min-height: 100% !important;
	min-height: 100dvh !important;
	height: 100% !important;
	height: 100dvh !important;
}
```

- [ ] **Step 3: Make the fullscreen CSS match only explicitly marked loader/sign-in containers**

Replace the broad selector list with the single target selector in both entries:

```css
.qingge-center-target {
	position: fixed !important;
	inset: 0 !important;
	top: 0 !important;
	right: 0 !important;
	bottom: 0 !important;
	left: 0 !important;
	z-index: 100 !important;
	width: 100vw !important;
	width: 100dvw !important;
	height: 100vh !important;
	height: 100dvh !important;
	min-height: 100vh !important;
	min-height: 100dvh !important;
	max-height: none !important;
	display: flex !important;
	flex-direction: column !important;
	align-items: center !important;
	justify-content: center !important;
	box-sizing: border-box !important;
	margin: 0 !important;
	padding: 32px !important;
	transform: none !important;
}
```

Keep `.qingge-center-target` as the class added by `forceCenter`; this preserves the native loading/sign-in centering without matching normal collection containers.

- [ ] **Step 4: Limit the loader inner-container rule to the marked target**

Replace the existing two broad inner selectors with:

```css
.qingge-center-target > .inner {
	display: flex !important;
	flex-direction: column !important;
	align-items: center !important;
	justify-content: center !important;
	margin: 0 auto !important;
	transform: none !important;
}
```

- [ ] **Step 5: Keep runtime width correction consistent with the CSS shell**

In `scanCenter()` in both entries, change the root inline width correction from:

```js
r.style.setProperty("width", "100%", "important");
```

to:

```js
r.style.setProperty("width", "min(100%, var(--admin-shell-width))", "important");
```

This prevents the boot-time observer from overwriting the fixed shell rule while it is still watching for the native Sveltia loader.

### Task 3: Verify the scoped fix and project integrity

**Files:**
- Verify: `src/pages/admin/index.astro`
- Verify: `public/admin/index.html`
- Verify: `scripts/test/admin-style-isolation.test.mjs`

- [ ] **Step 1: Run the focused regression test**

Run:

```bash
node --test scripts/test/admin-style-isolation.test.mjs
```

Expected: all admin layout tests pass, including both-entry fixed-width assertions.

- [ ] **Step 2: Run the full automated test suite**

Run:

```bash
pnpm test
```

Expected: all repository tests pass with no changed behavior outside the admin entry test.

- [ ] **Step 3: Run Astro type and content checks**

Run:

```bash
pnpm check
```

Expected: Astro reports no new errors.

- [ ] **Step 4: Review the final diff for scope**

Run:

```bash
git diff --check
git diff --stat
git status --short
```

Expected: only the two admin entry documents, the admin regression test, and the already reviewed design/plan documents are changed; no public-site source or content files are modified.
