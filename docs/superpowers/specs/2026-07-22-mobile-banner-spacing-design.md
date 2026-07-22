# Mobile Banner Spacing

## Goal

Increase the visible video area above the homepage content on mobile devices and remove the video credit pill.

## Design

- On viewports below the desktop breakpoint (`1024px`), position the main content at the bottom edge of the standard Banner height (`48vh`) instead of overlapping it by `3.5rem`.
- Keep the existing desktop calculation (`48vh - 3.5rem`) unchanged.
- Keep `siteConfig.banner.credit.enable` set to `false`, so the Pexels credit pill is not rendered. Asset metadata remains intact.

## Verification

- At a mobile viewport, the welcome card begins approximately `3.5rem` lower than before and the Banner video has correspondingly more visible area.
- The credit pill is absent on mobile and desktop.
- `pnpm check` succeeds.
