# Single Author Write Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep one author-only writing icon while removing the redundant text, menu, navigation-tap, and keyboard entrances.

**Architecture:** `Navbar.astro` owns the only visible entry and decides its visibility from the existing persisted `qingge-author` value. `HomeHero.astro` remains the sole unlock trigger and keeps its icon visually non-interactive. The configuration comments are aligned with the resulting behavior.

**Tech Stack:** Astro, TypeScript, browser localStorage, Tailwind CSS, pnpm.

---

### Task 1: Reduce Navbar to one conditional icon entry

**Files:**
- Modify: `src/components/Navbar.astro:22-221`

- [x] **Step 1: Remove the text and menu entry markup**

Delete the `author-write-link` anchor in the desktop link group and the `showEntries` code that creates `author-write-menu` in `#nav-menu-panel`.

- [x] **Step 2: Keep only the icon visibility state**

Replace `showEntries(on)` with:

```ts
function showEntry(on: boolean) {
	var icon = document.getElementById("author-write-icon");
	if (icon) icon.classList.toggle("hidden", !on);
}
```

Use `showEntry(unlocked())` for initial boot and listen for the `author:unlocked` browser event to reveal the icon immediately after the home-hero gesture.

- [x] **Step 3: Remove navigation-tap and keyboard entry listeners**

Delete the `site-brand` five-click listener and the `document` keydown listener for `Alt + Shift + W`. Retain `unlocked()`, `unlock()`, and `openAdmin()` only as needed for the icon display state.

- [x] **Step 4: Update the local development hint**

Change its message to state that only the home-hero cottage can unlock the writing icon, while preserving the localStorage command as a development alternative.

### Task 2: Preserve the hidden home-hero unlock gesture

**Files:**
- Modify: `src/components/HomeHero.astro:38-55`
- Modify: `src/config.ts:136-147`

- [x] **Step 1: Remove click affordances from the home-hero cottage**

From the `home-hero-cottage` class list, remove `cursor-pointer` and `active:scale-95`; keep the button semantic so the existing click listener continues to work. After persisting the author value, dispatch `new CustomEvent("author:unlocked")` so the Navbar reveals its icon without a refresh.

- [x] **Step 2: Align author-gate documentation with the single entry**

Update the `authorGate` comment to describe the home-hero five-click unlock and the single icon-only entry. Do not change the secret or `/admin/` path.

### Task 3: Verify and commit the focused change

**Files:**
- Verify: `src/components/Navbar.astro`
- Verify: `src/components/HomeHero.astro`
- Verify: `src/config.ts`

- [x] **Step 1: Run formatting diagnostics**

Run: `git diff --check`

Expected: no whitespace errors.

- [x] **Step 2: Build the production site**

Run: `./node_modules/.bin/astro build`

Expected: exit code `0`; static pages and optimized assets are generated.

- [x] **Step 3: Inspect the compiled entry behavior**

Run: `rg -n "author-write-link|author-write-menu|Alt \+ Shift \+ W|site-brand.*taps" src/components/Navbar.astro || true`

Expected: no result. `author-write-icon` and `home-hero-cottage` remain in their respective components.

- [x] **Step 4: Commit only the entry consolidation files and this plan**

Run: `git add src/components/Navbar.astro src/components/HomeHero.astro src/config.ts docs/superpowers/plans/2026-07-24-single-author-write-entry.md && git commit -m "refactor: keep one author write entry"`

Expected: the commit includes only this feature and its plan.
