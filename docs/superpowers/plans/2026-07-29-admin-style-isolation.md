# Admin Style Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Sveltia CMS's admin viewport layout while preventing its stylesheet from changing public-page layout when `/admin/` is prefetched.

**Architecture:** Mark the admin document body with `admin-page` and require that marker on document and top-level-container rules. Keep `is:global` because Sveltia creates runtime DOM, but ensure the global selectors can only match inside the admin document. Add a small source-level regression test because the failure is caused by a selector escaping route scope.

**Tech Stack:** Astro 5, global CSS in an Astro route, Node.js built-in test runner.

---

## File structure

- Modify: `src/pages/admin/index.astro` — add the admin body marker and qualify route-wide rules.
- Create: `scripts/test/admin-style-isolation.test.mjs` — prevent reintroducing unqualified top-level admin layout selectors.

### Task 1: Lock the selector boundary with a regression test

**Files:**
- Create: `scripts/test/admin-style-isolation.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../../src/pages/admin/index.astro", import.meta.url), "utf8");

test("admin viewport rules are constrained to the admin page", () => {
  assert.match(source, /<body class="admin-page">/);
  assert.match(source, /html:has\(body\.admin-page\),\s*body\.admin-page/);
  assert.match(source, /body\.admin-page > div:not\(#admin-gate\):not\(#admin-boot\)/);
  assert.doesNotMatch(source, /\n\s*body > div:not\(#admin-gate\):not\(#admin-boot\),/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/test/admin-style-isolation.test.mjs`

Expected: FAIL because `src/pages/admin/index.astro` has no `admin-page` body marker and uses the unqualified `body > div` selector.

### Task 2: Constrain the admin-only CSS

**Files:**
- Modify: `src/pages/admin/index.astro:21-51`

- [ ] **Step 1: Add the dedicated body marker**

Change the document body opening tag to:

```astro
<body class="admin-page">
```

- [ ] **Step 2: Qualify document and root-container selectors**

Replace the route-wide selectors with:

```css
html:has(body.admin-page),
body.admin-page {
	margin: 0;
	padding: 0;
	width: 100%;
	height: 100%;
	min-height: 100%;
	min-height: 100dvh;
	background: #f3f4f6;
	color: #3d342c;
	font-family:
		system-ui,
		-apple-system,
		"Segoe UI",
		Roboto,
		"PingFang SC",
		"Noto Sans SC",
		sans-serif;
}
body.admin-page {
	position: relative;
	overflow-x: hidden;
}
body.admin-page > div:not(#admin-gate):not(#admin-boot),
body.admin-page #nc-root,
body.admin-page .sui.app-shell {
	position: relative !important;
	box-sizing: border-box !important;
	width: 100% !important;
	min-height: 100% !important;
	min-height: 100dvh !important;
	height: 100% !important;
	height: 100dvh !important;
}
```

Keep the existing Sveltia runtime-container selectors unchanged: they do not match public UI because they require `.sui.app-shell`, `.container[role="none"]`, or `.qingge-center-target`.

- [ ] **Step 3: Run the regression test to verify it passes**

Run: `node --test scripts/test/admin-style-isolation.test.mjs`

Expected: PASS.

### Task 3: Verify the user-visible behavior

**Files:**
- Modify: none

- [ ] **Step 1: Run the full static checks**

Run: `pnpm check && pnpm test`

Expected: Astro reports zero errors and the complete Node test suite passes.

- [ ] **Step 2: Verify the development homepage and admin route**

Run: `pnpm exec astro dev --host 0.0.0.0 --port 4323`

Expected: on `/`, `#banner-wrapper` and `#main-content-wrapper` retain absolute positioning while `.reading-progress` and `#qingge-music` retain fixed positioning; homepage content appears in the viewport. On `/admin/`, the gate/loading experience still fills and centers in the viewport.

- [ ] **Step 3: Commit the implementation**

```bash
git add src/pages/admin/index.astro scripts/test/admin-style-isolation.test.mjs
git commit -m "fix: isolate admin viewport styles"
```
