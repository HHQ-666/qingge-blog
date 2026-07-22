# Mobile Banner Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose more of the homepage Banner video on mobile while leaving desktop composition unchanged.

**Architecture:** `MainGridLayout.astro` owns the absolute position of the main content. Add a mobile-only override so it starts at the Banner boundary (`48vh`) instead of overlapping it by `3.5rem`; preserve the existing desktop calculation. The existing configuration continues to suppress the video credit component.

**Tech Stack:** Astro, Tailwind CSS responsive utilities, TypeScript, pnpm.

---

### Task 1: Move the mobile homepage content below the Banner overlap

**Files:**
- Modify: `src/layouts/MainGridLayout.astro:34-38,68`
- Test: `pnpm check`

- [ ] **Step 1: Inspect the position calculation and responsive breakpoint**

Run `sed -n '30,90p' src/layouts/MainGridLayout.astro`.

Expected: `mainPanelTop` is `calc(48vh - 3.5rem)`.

- [ ] **Step 2: Apply the responsive position override**

Replace the main content wrapper attributes with:

```astro
class="absolute w-full z-30 pointer-events-none lg:top-[var(--main-panel-top)]"
style={`--main-panel-top: ${mainPanelTop}; top: 48vh`}
```

This starts mobile content at the bottom of the Banner and restores `mainPanelTop` at the `lg` breakpoint.

- [ ] **Step 3: Verify the credit remains disabled**

Run `rg -n "credit:|enable: false" src/config.ts`.

Expected: `siteConfig.banner.credit.enable` is `false`.

- [ ] **Step 4: Run the project check**

Run `pnpm check`.

Expected: exit code `0` and no Astro errors.

- [ ] **Step 5: Commit the implementation separately from existing worktree changes**

Run `git add src/layouts/MainGridLayout.astro docs/superpowers/plans/2026-07-22-mobile-banner-spacing.md` followed by `git commit -m "fix: reveal more banner video on mobile"`.

Expected: only the layout adjustment and plan are staged, leaving unrelated changes untouched.
