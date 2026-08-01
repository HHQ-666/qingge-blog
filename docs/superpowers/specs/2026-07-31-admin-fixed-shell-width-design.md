# Admin fixed shell width

## Goal

Keep the visible Sveltia CMS workspace at a stable desktop width when an editor switches article categories. The workspace shown in the supplied screenshot will remain approximately 1000 px wide and centered; it will contract to the available viewport width on narrower screens. No horizontal scrollbar will be added.

## Scope and isolation

- Modify only the two duplicate CMS entry documents:
  - `src/pages/admin/index.astro`
  - `public/admin/index.html`
- Add a source-level regression test for the admin-only layout rules.
- Do not change public-site styles, content configuration, authentication, GitHub requests, collection definitions, or editor behavior.

## Root cause

The entry documents apply their full-screen loading and sign-in styles to broad Sveltia `.container` selectors. Those selectors can also match containers rendered by the ready CMS, letting collection content participate in sizing the visible workspace after a category switch.

## Design

1. Define one admin workspace width of 1000 px and apply it only to the mounted CMS root chain. The root is centered and uses the lesser of that width and the viewport width, so desktop width remains stable while small screens remain responsive without an overflow scrollbar.
2. Limit full-viewport positioning and centering to the runtime element explicitly marked as the loading/sign-in target (`.qingge-center-target`). The existing boot-time DOM detection continues to apply that marker only while Sveltia is showing its native loading or sign-in screen.
3. Keep the existing fullscreen custom gate and boot overlay untouched.
4. Assert in the existing admin layout test that both entry documents contain the fixed-shell rule and do not restore the broad full-screen container selectors.

## Verification

1. Run the admin layout regression test and the project checks.
2. At a desktop viewport wider than 1000 px, confirm the mounted CMS root reports a 1000 px width before and after switching among article categories.
3. At a viewport narrower than 1000 px, confirm the root equals the available viewport width and no horizontal scrollbar is introduced.
4. Confirm the login gate and Sveltia native loading screen still cover and center in the full viewport.
