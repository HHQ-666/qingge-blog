# Pet Circular Avatar Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pet selection popover with a compact three-item circular avatar picker that has no visible text and marks the active pet with an outer border.

**Architecture:** Keep the existing right-click/long-press menu lifecycle, model switching, preloading, and keyboard/outside-click dismissal. Limit the manifest to the three approved visible pets, simplify the Svelte markup to accessible icon-only radio buttons, and isolate the visual change in the existing component CSS with light/dark glass variants.

**Tech Stack:** Astro 5, Svelte 5, JSON pet manifest, Node test runner, Sharp avatar metadata checks, `pnpm check`, `pnpm test`, and `pnpm build`.

---

## File Map

- Modify: `/Users/huangheqing/codding/player/qinggeVlog/public/pets/manifest.json` — remove the `haru` display entry while retaining its resource files.
- Modify: `/Users/huangheqing/codding/player/qinggeVlog/src/components/fun/PetCompanion.svelte` — remove visible menu title/labels/check/hide control and style the picker as three circular avatar buttons.
- Modify: `/Users/huangheqing/codding/player/qinggeVlog/scripts/test/pet-manifest.test.mjs` — assert the three-item visible list and icon-only picker structure.
- Verify: `/Users/huangheqing/codding/player/qinggeVlog/docs/superpowers/specs/2026-08-11-pet-avatar-menu-design.md` — use the approved design as the acceptance baseline; do not change it during implementation.

The worktree already contains unrelated user changes. Only the three implementation files above are in scope for code edits; do not stage or revert other files.

### Task 1: Make the focused test describe the new visible list and picker contract

**Files:**
- Modify: `/Users/huangheqing/codding/player/qinggeVlog/scripts/test/pet-manifest.test.mjs:17-57`

- [ ] **Step 1: Update the visible and local ID fixtures.**

Change the existing fixtures to make `haru` a removed display model and keep only the still-visible local model in the resource-graph test:

```js
const expectedIds = ["pio", "shizuku", "koharu"];
const localIds = ["koharu"];
```

Add `"haru"` to the removed-ID list in the manifest test, alongside the already-removed `hiyori` and `haru-greeter` IDs.

- [ ] **Step 2: Replace the broad menu assertion with the icon-only picker assertions.**

Keep the existing action-strip checks and add checks for every visible requirement:

```js
test("pet menu is an icon-only circular avatar picker", () => {
	assert.doesNotMatch(
		petComponentSource,
		/pet-menu-head|pet-menu-title|pet-hide-button|pet-item-name|pet-check|pet-action-strip/,
	);
	assert.match(petComponentSource, /class="pet-item-img"/);
	assert.match(petComponentSource, /role="menuitemradio"/);
});
```

The source assertion checks that visible labels and the old header controls cannot return accidentally; `aria-label` remains allowed because it is required for accessibility.

- [ ] **Step 3: Run the focused test before implementation.**

Run:

```bash
node --test scripts/test/pet-manifest.test.mjs
```

Expected: FAIL because `manifest.json` still exposes `haru` and `PetCompanion.svelte` still contains the old header/label/check markup. This confirms the test exercises the requested change.

### Task 2: Remove Haru from the visible pet manifest

**Files:**
- Modify: `/Users/huangheqing/codding/player/qinggeVlog/public/pets/manifest.json:87-112`

- [ ] **Step 1: Delete only the `haru` object from the `pets` array.**

After the `koharu` object, the manifest must end with the closing array/object delimiters. The visible IDs must become:

```json
[
	"pio",
	"shizuku",
	"koharu"
]
```

Do not delete `/Users/huangheqing/codding/player/qinggeVlog/public/pets/avatars/haru.webp` or `/Users/huangheqing/codding/player/qinggeVlog/public/pets/models/haru`; retaining those resources keeps rollback and cache behavior safe.

- [ ] **Step 2: Run the manifest test after the list change.**

Run:

```bash
node --test scripts/test/pet-manifest.test.mjs
```

Expected: the visible-ID assertions pass, while the picker-structure assertion remains failing until Task 3 removes the old markup.

### Task 3: Convert the Svelte popover to a circular icon-only picker

**Files:**
- Modify: `/Users/huangheqing/codding/player/qinggeVlog/src/components/fun/PetCompanion.svelte:11-145,445-715,827-830`

- [ ] **Step 1: Keep menu lifecycle behavior but update its initial bounds for the smaller popover.**

Add constants next to `MODEL_LOAD_TIMEOUT` and use them in `openMenuAt`:

```js
const MODEL_LOAD_TIMEOUT = 15000;
const PET_MENU_WIDTH = 184;
const PET_MENU_HEIGHT = 82;
```

Replace the initial position calculations with:

```js
function openMenuAt(x, y) {
	menuX = Math.max(8, Math.min(x, window.innerWidth - PET_MENU_WIDTH - 8));
	menuY = Math.max(8, Math.min(y + 8, window.innerHeight - PET_MENU_HEIGHT - 8));
	menuOpen = true;
	requestAnimationFrame(() => {
		if (!menuEl) return;
		const rect = menuEl.getBoundingClientRect();
		menuX = Math.max(8, Math.min(menuX, window.innerWidth - rect.width - 8));
		menuY = Math.max(8, Math.min(menuY, window.innerHeight - rect.height - 8));
	});
}
```

Leave `onWindowPointerDown`, `onKeydown`, right-click, long-press, and `switchTo` unchanged so outside-click/Escape dismissal and model switching remain stable.

- [ ] **Step 2: Replace the menu header and text-bearing item contents.**

The menu body should become this structure:

```svelte
{#if menuOpen}
	<div
		class="pet-menu"
		style={`left:${menuX}px;top:${menuY}px`}
		bind:this={menuEl}
		role="menu"
		aria-label="选择宠物形象"
	>
		<div class="pet-pet-strip" aria-label="切换形象">
			{#each pets as pet, i (pet.id)}
				<button
					type="button"
					class="pet-item"
					class:is-active={currentIdx === i}
					aria-label={`切换到${pet.name}`}
					aria-checked={currentIdx === i}
					role="menuitemradio"
					on:click={() => switchTo(i)}
					on:mouseenter={() => preloadModel(pet)}
					on:touchstart={() => preloadModel(pet)}
				>
					{#if pet.avatar}
						<img src={pet.avatar} alt="" class="pet-item-img" />
					{:else}
						<span class="pet-item-placeholder" aria-hidden="true">🐾</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}
```

Remove only the menu header markup and its `hidePet` button from this block. Keep the `petHidden`/static wake implementation outside the picker untouched because it is not part of the picker layout and changing it would expand the scope beyond the approved UI request.

- [ ] **Step 3: Replace the old rectangular-card CSS with the glass capsule and circular avatar styles.**

Replace the `.pet-menu` through `.pet-check` rules with:

```css
.pet-menu {
	--pet-accent: #9278ff;
	position: fixed;
	z-index: 10000;
	width: min(184px, calc(100vw - 16px));
	padding: 7px;
	border: 1px solid rgba(255, 255, 255, 0.78);
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.78);
	backdrop-filter: blur(18px);
	-webkit-backdrop-filter: blur(18px);
	box-shadow: 0 12px 30px rgba(31, 38, 47, 0.16);
	color: #555;
	animation: pet-menu-in 0.18s ease-out both;
}
.pet-pet-strip {
	display: flex;
	justify-content: center;
	gap: 4px;
	overflow-x: auto;
	padding: 0;
	scrollbar-width: none;
}
.pet-pet-strip::-webkit-scrollbar {
	display: none;
}
.pet-item {
	position: relative;
	display: grid;
	width: 52px;
	min-width: 52px;
	height: 52px;
	min-height: 52px;
	place-items: center;
	padding: 3px;
	border: 2px solid transparent;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.42);
	color: #666;
	cursor: pointer;
	overflow: hidden;
	transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.pet-item:hover,
.pet-item:focus-visible {
	background: rgba(255, 255, 255, 0.92);
	transform: translateY(-1px);
}
.pet-item.is-active {
	border-color: var(--pet-accent);
	background: rgba(255, 255, 255, 0.96);
	box-shadow: 0 3px 10px rgba(146, 120, 255, 0.2);
}
.pet-item-img,
.pet-item-placeholder {
	display: grid;
	width: 42px;
	height: 42px;
	place-items: center;
	border-radius: 50%;
	background: rgba(242, 238, 232, 0.72);
	object-fit: contain;
}
.pet-item-placeholder {
	font-size: 1rem;
}
```

Delete the unused `.pet-menu-head`, `.pet-menu-title`, `.pet-hide-button`, `.pet-item-name`, and `.pet-check` rules. Update the dark-theme override to keep the same geometry while changing only contrast-sensitive colors:

```css
:root.dark .pet-menu {
	--pet-accent: #b4a1ff;
	border-color: rgba(255, 255, 255, 0.14);
	background: rgba(32, 32, 36, 0.88);
	color: #ddd;
}
:root.dark .pet-item {
	border-color: transparent;
	background: rgba(255, 255, 255, 0.08);
	color: #ddd;
}
:root.dark .pet-item:hover,
:root.dark .pet-item:focus-visible,
:root.dark .pet-item.is-active {
	background: rgba(118, 95, 190, 0.34);
}
:root.dark .pet-item.is-active {
	border-color: var(--pet-accent);
}
```

Keep the existing reduced-motion rule and mobile width rule; change the mobile `.pet-menu` width to `min(184px, calc(100vw - 16px))` so the same three circles fit on narrow screens.

- [ ] **Step 4: Run the focused test after the component change.**

Run:

```bash
node --test scripts/test/pet-manifest.test.mjs
```

Expected: all pet-manifest tests pass, including the three visible IDs, absence of Haru, absence of visible menu text/header controls, local Koharu resource graph, and square avatar checks.

### Task 4: Run project verification and visually inspect both themes and viewport sizes

**Files:**
- Verify: `/Users/huangheqing/codding/player/qinggeVlog/public/pets/manifest.json`
- Verify: `/Users/huangheqing/codding/player/qinggeVlog/src/components/fun/PetCompanion.svelte`
- Verify: `/Users/huangheqing/codding/player/qinggeVlog/scripts/test/pet-manifest.test.mjs`

- [ ] **Step 1: Run formatting and static checks without rewriting unrelated files.**

Run:

```bash
git diff --check
pnpm check
```

Expected: `git diff --check` exits 0; `pnpm check` reports 0 errors. Existing non-blocking hints may remain.

- [ ] **Step 2: Run the complete automated test suite.**

Run:

```bash
pnpm test
```

Expected: all existing tests pass, including `scripts/test/pet-manifest.test.mjs`.

- [ ] **Step 3: Build the site.**

Run:

```bash
pnpm build
```

Expected: Astro and Pagefind complete successfully. Existing Browserslist, LaTeX unicode, chunk-size, or Pagefind Chinese-stemming warnings are acceptable if no new error appears.

- [ ] **Step 4: Verify the running site in the browser.**

With the existing dev server at `http://localhost:4321/`, open the pet picker by right-clicking the pet and confirm:

1. Exactly three circular avatars appear: Pio, 静香, 小春.
2. No title, names, check mark, or action strip is visible.
3. The active avatar has only the lavender outer border.
4. Clicking each of the other two avatars switches the model and closes the picker.
5. Clicking outside and pressing `Escape` close the picker.
6. At a 414px-wide viewport the capsule remains inside the viewport.
7. After enabling the dark theme, the capsule and active border remain readable.

Capture a screenshot after the final visual pass and check the browser console for new errors. Do not modify unrelated components while adjusting this picker.

## Handoff

After all checks pass, report the three changed files and verification results. Do not stage or commit the implementation files unless the user explicitly asks for a commit; the worktree contains unrelated user changes that must remain untouched.
