# Banner Poster Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a frame from the configured Banner video immediately on desktop and mobile, then fade the video over it only after the first frame is available.

**Architecture:** `BannerMedia.astro` will make the public video poster the static rendering source and keep that same URL on the native video element. The public and Astro poster files are generated from the source MP4 at the same timestamp. The media wrapper will use the page theme token only as a last-resort image-load fallback.

**Tech Stack:** Astro 5, TypeScript, Astro assets, Tailwind CSS, pnpm.

---

### Task 1: Align the static Banner source with the video poster

**Files:**
- Modify: `src/components/BannerMedia.astro:6-19`

- [ ] **Step 1: Confirm the two configured poster paths point at the intended video-frame assets**

Run: `ls -lh src/assets/images/banner-ocean-poster.jpg public/media/banner-ocean-poster.jpg`

Expected: both files exist and are non-empty.

- [ ] **Step 2: Select the configured public poster before the legacy static Banner image**

Declare `staticSrc` after `nativePoster` with `const staticSrc = nativePoster || banner.video?.poster || banner.src;`.

This makes the pre-video `ImageWrapper` request `/media/banner-ocean-poster.jpg`, exactly the same image used by the native `poster` attribute.

- [ ] **Step 3: Make the container fallback use only theme-aware tokens**

Replace the `.banner-media` background rules with `background: var(--page-bg);` in the base rule and remove the separate fixed-color dark-mode rule.

This removes the fixed low-chroma purple background and preserves a palette-compatible fallback if the image itself cannot load.

- [ ] **Step 4: Run Astro validation**

Run: `pnpm check`

Expected: exit code `0` with no Astro or TypeScript errors.

### Task 2: Verify visual loading states at desktop and mobile widths

**Files:**
- Verify: `src/components/BannerMedia.astro`

- [ ] **Step 1: Build the production site**

Run: `pnpm build`

Expected: Astro build and Pagefind indexing finish successfully.

- [ ] **Step 2: Manually verify the desktop fallback lifecycle**

Run: `pnpm dev -- --host 127.0.0.1 --port 4321`

Open the home page at a desktop viewport, reload with cache disabled, and observe the Banner.

Expected: the ocean poster is visible immediately; once video playback begins, it smoothly fades over the same scene with no blank or fixed-purple frame.

- [ ] **Step 3: Manually verify the mobile fallback lifecycle**

At a 390px-wide viewport, reload the home page with cache disabled and then block the request for `/media/banner-ocean.mp4`.

Expected: both normal and blocked-video cases keep the poster visible; the blocked case never exposes an empty Banner region.

- [ ] **Step 4: Commit the focused implementation**

Run: `git add src/components/BannerMedia.astro docs/superpowers/plans/2026-07-24-banner-poster-fallback.md && git commit -m "fix: use video poster as banner fallback"`

Expected: only the Banner component and its implementation plan are included; pre-existing user changes remain uncommitted.
