# Remove Broken Pets and Menu Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two visually broken Live2D model entries and the compact menu's bottom action buttons while keeping the four remaining pets and their existing runtime behavior intact.

**Architecture:** Keep the manifest as the single source of visible pet entries. Remove `hiyori` and `haru-greeter` from the manifest only, preserving their assets for possible future reuse. Simplify `PetCompanion.svelte` so the menu renders model selection only; retain the internal action mapping used when a model is tapped.

**Tech Stack:** Astro 5, Svelte, `l2d-widget`, JSON manifest, Node's built-in test runner, TypeScript checks, pnpm.

---

## File map

- Modify `public/pets/manifest.json`: expose only `pio`, `shizuku`, `koharu`, and `haru`; leave removed model files untouched.
- Modify `src/components/fun/PetCompanion.svelte`: remove bottom action controls, their styling, and the now-unused `primaryAction` selection path; keep tap-to-action internals.
- Modify `scripts/test/pet-manifest.test.mjs`: assert the four visible IDs, assert the two removed IDs are absent from the manifest, and assert the component no longer contains the deleted menu control classes.
- Create `docs/superpowers/specs/2026-08-11-remove-broken-pets-and-actions-design.md`: approved design record (already committed).

### Task 1: Make manifest and menu expectations fail first

**Files:**
- Modify: `scripts/test/pet-manifest.test.mjs:10-45`

- [ ] **Step 1: Update the expected visible model IDs and local resource IDs.**

Change the constants to:

~~~js
const expectedIds = ["pio", "shizuku", "koharu", "haru"];
const localIds = ["koharu", "haru"];
~~~

Replace the existing assertions that look up `hiyori` and `haru-greeter` with an explicit absence check:

~~~js
for (const removedId of [
	"wanko",
	"nito",
	"senko",
	"tororo",
	"hijiki",
	"miku",
	"hiyori",
	"haru-greeter",
]) {
	assert.equal(
		manifest.pets.some((pet) => pet.id === removedId),
		false,
	);
}
~~~

Rename the test to `pet manifest contains the four visible models in order`.

- [ ] **Step 2: Add a regression assertion for the removed menu controls.**

Read the component source beside `footerSource`:

~~~js
const petComponentSource = await readFile(
	resolve(repoRoot, "src/components/fun/PetCompanion.svelte"),
	"utf8",
);
~~~

Add this test:

~~~js
test("pet menu only exposes model selection controls", () => {
	assert.doesNotMatch(petComponentSource, /pet-action-strip/);
	assert.doesNotMatch(petComponentSource, /pet-action-chip/);
	assert.doesNotMatch(petComponentSource, /pet-primary-action/);
});
~~~

- [ ] **Step 3: Run the focused test and confirm it fails for the old implementation.**

Run:

~~~bash
node --test scripts/test/pet-manifest.test.mjs
~~~

Expected: FAIL because the manifest still contains `hiyori`/`haru-greeter` and `PetCompanion.svelte` still contains the action-control classes. Do not change implementation code until this failure is observed.

### Task 2: Remove the two model entries without deleting assets

**Files:**
- Modify: `public/pets/manifest.json:64-134`

- [ ] **Step 1: Delete only the two JSON objects with IDs `hiyori` and `haru-greeter`.**

The resulting manifest ID sequence must be exactly:

~~~json
["pio", "shizuku", "koharu", "haru"]
~~~

Keep the existing `koharu` object immediately after `shizuku`, keep the existing `haru` object last, and do not remove or rename any files under `public/pets/models/hiyori/` or `public/pets/models/haru-greeter/`.

- [ ] **Step 2: Verify the JSON and run the manifest test.**

Run:

~~~bash
node --input-type=module -e 'import { readFileSync } from "node:fs"; const m = JSON.parse(readFileSync("./public/pets/manifest.json", "utf8")); console.log(m.pets.map((p) => p.id).join(","))'
node --test scripts/test/pet-manifest.test.mjs
~~~

Expected: the first command prints `pio,shizuku,koharu,haru`; the test still fails only because the component action classes have not been removed yet.

### Task 3: Remove bottom menu actions and dead primary-action state

**Files:**
- Modify: `src/components/fun/PetCompanion.svelte:1-25,180-205,480-525,745-925`

- [ ] **Step 1: Remove the unused primary-action import and state.**

Change the import to keep only `getAvailableActionEntries`:

~~~js
import { getAvailableActionEntries } from "../../scripts/pet-actions.mjs";
~~~

Delete `let primaryAction = null;`.

In `refreshActionEntries()`, remove every `primaryAction = ...` assignment, while keeping the `actionEntries` reset, static-pet mapping, and `getAvailableActionEntries` call. The function must still populate `actionEntries` for `playCuteAction()`.

- [ ] **Step 2: Remove the menu's bottom action markup.**

After the closing `{/each}` for `.pet-item`, end the menu directly. Delete the conditional block that renders either `.pet-action-strip`/`.pet-action-chip` or `.pet-primary-action`.

The menu body must retain this structure:

~~~svelte
<div class="pet-menu-head">...</div>
<div class="pet-pet-strip" aria-label="切换形象">
	{#each pets as pet, i (pet.id)}
		<!-- existing model item button -->
	{/each}
</div>
~~~

with no action-control block after the strip.

- [ ] **Step 3: Remove only CSS that belongs to the deleted controls.**

Delete the style rules for:

~~~css
.pet-primary-action { ... }
.pet-action-strip { ... }
.pet-action-strip::-webkit-scrollbar { ... }
.pet-action-chip { ... }
.pet-action-chip:hover,
.pet-action-chip:focus-visible { ... }
.pet-primary-action:hover,
.pet-primary-action:focus-visible { ... }
:root.dark .pet-primary-action { ... }
:root.dark .pet-primary-action:hover,
:root.dark .pet-primary-action:focus-visible { ... }
~~~

Also remove `.pet-primary-action` from the `prefers-reduced-motion` selector. Keep all model, bubble, load-status, and menu-strip styles.

- [ ] **Step 4: Run the focused test to verify the implementation passes.**

Run:

~~~bash
node --test scripts/test/pet-manifest.test.mjs
~~~

Expected: PASS, including the four-model order, absent removed entries, remaining local resource graphs, and absence of the deleted menu-control classes.

### Task 4: Run full static validation

**Files:**
- No additional files; inspect the changes above.

- [ ] **Step 1: Check formatting and type/content validation.**

Run:

~~~bash
git diff --check
pnpm check
pnpm test
~~~

Expected: all commands exit with code 0. `pnpm test` must include the focused pet manifest test and the existing music/splash tests.

- [ ] **Step 2: Build the production site.**

Run:

~~~bash
pnpm build
~~~

Expected: Astro generates `dist/` and Pagefind completes without errors. The removed model directories may still exist in `public/`, but the manifest and generated application code must no longer expose them as selectable pets.

### Task 5: Browser acceptance of the changed behavior

**Files:**
- No additional files.

- [ ] **Step 1: Open the dev page and open the pet context menu.**

Use the running Astro dev server at `http://localhost:4321/`. Right-click the remaining pet and verify that the menu contains only `Pio`, `静香`, `小春`, and `Haru`.

- [ ] **Step 2: Verify the bottom action row is gone at desktop and narrow viewport sizes.**

Check the default desktop viewport and a `414×337` viewport. The menu must end after the model strip; no `问候`, `回应`, `卖萌`, `撒娇`, `开心`, `休息`, or other action chips may appear below it.

- [ ] **Step 3: Switch through the four remaining models.**

Select each remaining model once. Expected: each model loads or displays using its existing behavior, no removed model entry appears, and the browser console has no new pet-switch error.

## Verification checklist

- [ ] `node --test scripts/test/pet-manifest.test.mjs`
- [ ] `git diff --check`
- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Desktop and `414×337` browser menu acceptance

No code commit is planned in this run because the target source files already contain unrelated user-owned uncommitted work; stage only the requested diff if the user later asks for a commit.
