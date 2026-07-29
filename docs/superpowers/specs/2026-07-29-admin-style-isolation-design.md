# Admin style isolation

## Goal

Prevent the `/admin/` page's Sveltia CMS layout styles from affecting the public site when the admin route is prefetched or visited through Swup.

## Scope

- Keep the existing full-viewport, centered loading and sign-in experience in `/admin/`.
- Keep the existing admin gate, token flow, and CMS behavior unchanged.
- Restore the public homepage's intended Banner, main-content, reading-progress, and music-player positioning.

## Design

The admin document body will carry an admin-only marker. Every rule that currently targets document-wide elements or top-level body children will be qualified by that marker. The rules will remain global enough to style Sveltia's runtime-generated DOM, but they will match only on the admin page.

This changes the selector boundary rather than the CMS layout behavior:

- Public pages cannot match the admin selectors, even if Vite or Swup preloads the admin stylesheet.
- The admin root and Sveltia containers keep their viewport dimensions and fixed centered loading/login layout.
- No changes are made to application data, authentication, navigation, or CMS scripts.

## Verification

1. Start the development server and load `/` at desktop width.
2. Confirm top-level public components retain their intended computed positions: the Banner/main layout uses its configured absolute positioning, and the reading progress and music player remain fixed.
3. Confirm homepage content is visible in the initial viewport rather than being displaced by stacked full-height containers.
4. Load `/admin/` and confirm its gate/loading surface still occupies and centers in the viewport.
5. Run `pnpm check` and `pnpm test`.
