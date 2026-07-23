# Mobile Widget and Banner Clarity Design

## Goal

Make the homepage Banner remain crisp on desktop and mobile, and restore mobile access to the sidebar information without pushing the article list too far down the page.

## Context

- The current Banner video is H.264 at 960 × 540. It is enlarged with `object-fit: cover` to fill a tall Banner, which makes the source look soft on high-density displays and in mobile crops.
- `MainGridLayout.astro` currently applies `hidden lg:block` to `SideBar`, so every sidebar module is intentionally absent below 1024px.
- The desktop two-column sidebar remains useful and must stay unchanged.

## Chosen Layout

On viewports below `1024px`, render a dedicated compact navigation card immediately after `HomeHero` and before the post list.

1. **Categories** display in the first row: up to three category links and a `更多` control. The control reveals the remaining category links in place.
2. **Tags** display in the second row: up to five tag links and an `全部标签` control. The control reveals the remaining tags in place.
3. **Today’s quote** is visible by default, rather than hidden behind a click. It has a two-line maximum, attribution, and the existing manual refresh button.
4. **Quote motion** runs only when a new quote is shown: a 300–400 ms fade-and-rise for the text and a restrained pop for the quote icon. `prefers-reduced-motion: reduce` removes both transitions.
5. **Site days** remains a compact one-line summary (`小屋已亮灯 N 天`) with its current supporting details available through an in-place disclosure. It is not a separate full-height card on mobile.

The mobile card uses the existing card colors, radius, coral accent, and spacing tokens. It deliberately does not duplicate the profile card, which the mobile welcome card already covers.

## Banner Clarity

Replace the current 960 × 540 Banner source with a higher-resolution H.264 MP4 that preserves the existing scene, duration, mute/autoplay behavior, and aspect ratio. Target at least 1920 × 1080 at a web-appropriate bitrate. Keep the current poster/static-image fallback logic.

The media element continues to use `object-fit: cover`; use a mobile-specific object position only if verification shows the chosen high-resolution source crops the horizon poorly. Do not add filters, opacity overlays, or CSS scaling that would soften the video.

## Component Boundaries

- `MobileHomeWidgets.astro` owns the compact mobile-only card and disclosure state.
- Small display-only variants or props on the existing quote and site-days components may be used to avoid duplicating data fetching and day-count calculations.
- `MainGridLayout.astro` mounts the mobile component before its content slot and keeps the current desktop `SideBar` unchanged.
- `BannerMedia.astro` remains responsible for video playback/fallback only; source-asset replacement does not change its playback strategy.

## Accessibility and Interaction

- Category and tag items are normal links; expansion controls are semantic buttons with `aria-expanded`.
- The refresh action keeps an accessible label.
- Truncated quote text remains available in the DOM; no content is only conveyed by motion.
- The compact card must be keyboard operable and compatible with reduced-motion preferences.

## Verification

- At 375 px and 768 px widths, categories, tags, visible quote, and site-day summary are above the first post; the profile does not duplicate.
- The first post remains visible shortly after the compact card, without an oversized vertical gap.
- Expanded categories/tags display all existing links and work with keyboard navigation.
- Desktop at 1024 px and above retains the existing sidebar and does not render the mobile card.
- The quote animation is absent when reduced motion is enabled.
- The new Banner source is at least 1920 × 1080 and looks sharp at desktop and mobile device-pixel ratios.
- `pnpm check` and `pnpm build` succeed.
