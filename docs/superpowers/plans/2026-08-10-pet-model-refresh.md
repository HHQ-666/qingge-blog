# Pet Model Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the broken fox and both cat entries, keep Pio and Shizuku, and add two locally hosted cute mascots plus two locally hosted Japanese-style characters.

**Architecture:** Preserve the current manifest-driven `PetCompanion.svelte` and `l2d-widget@0.1.1` switch flow. Vendor four pinned Cubism 2 packages under `public/pets/models`, validate every referenced file with a Node test, and keep model-specific presentation limited to manifest `scale`, actions, quotes, and avatars.

**Tech Stack:** Svelte 5, `l2d-widget`, Live2D Cubism 2 assets, JSON manifest, Node.js built-in test runner, Sharp, in-app browser QA.

---

## File map

- Create `scripts/test/pet-manifest.test.mjs`: validates the final six IDs, local resource graph, declared actions, avatar dimensions, and removal of old avatars.
- Modify `public/pets/manifest.json`: preserve Pio and Shizuku, remove Senko/Tororo/Hijiki, and add Wanko/Nito/Koharu/Miku.
- Create `public/pets/models/wanko/**`: pinned `live2d-widget-model-wanko@1.0.5` runtime assets.
- Create `public/pets/models/nito/**`: pinned `live2d-widget-model-nito@1.0.5` runtime assets.
- Create `public/pets/models/koharu/**`: pinned `live2d-widget-model-koharu@1.0.5` runtime assets.
- Create `public/pets/models/miku/**`: pinned `live2d-widget-model-miku@1.0.5` runtime assets.
- Create `public/pets/models/LICENSE`: upstream GPL-2.0 license text.
- Create `public/pets/models/THIRD_PARTY.md`: package versions, source repository, and redistribution notice.
- Create `public/pets/avatars/wanko.webp`, `nito.webp`, `koharu.webp`, and `miku.webp`: 160×160 transparent WebP portraits captured from the actual renderer.
- Delete `public/pets/avatars/senko.webp`, `tororo.webp`, and `hijiki.webp`.
- Preserve `src/components/fun/PetCompanion.svelte`: no behavior change is planned; its current uncommitted reliability work must not be overwritten.

### Task 1: Add a failing manifest and resource-graph test

**Files:**
- Create: `scripts/test/pet-manifest.test.mjs`
- Read: `public/pets/manifest.json`

- [ ] **Step 1: Create the contract test**

```js
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const manifestPath = resolve(repoRoot, "public/pets/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const expectedIds = ["pio", "shizuku", "wanko", "nito", "koharu", "miku"];
const localIds = ["wanko", "nito", "koharu", "miku"];

function publicFile(publicUrl) {
	return resolve(repoRoot, "public", publicUrl.replace(/^\//, ""));
}

test("pet manifest contains the approved six models in order", () => {
	assert.deepEqual(
		manifest.pets.map((pet) => pet.id),
		expectedIds,
	);
	for (const removedId of ["senko", "tororo", "hijiki"]) {
		assert.equal(manifest.pets.some((pet) => pet.id === removedId), false);
	}
});

test("new pets use complete local model resource graphs", async () => {
	for (const id of localIds) {
		const pet = manifest.pets.find((item) => item.id === id);
		assert.ok(pet, `missing manifest entry: ${id}`);
		assert.match(pet.model, new RegExp(`^/pets/models/${id}/`));

		const modelFile = publicFile(pet.model);
		const model = JSON.parse(await readFile(modelFile, "utf8"));
		const motionFiles = Object.values(model.motions ?? {})
			.flat()
			.map((motion) => motion.file);
		const references = [
			model.model,
			...(model.textures ?? []),
			model.physics,
			...(model.expressions ?? []).map((expression) => expression.file),
			...motionFiles,
		].filter(Boolean);

		for (const reference of references) {
			await assert.doesNotReject(
				access(resolve(dirname(modelFile), reference)),
				`${id} is missing ${reference}`,
			);
		}

		for (const action of Object.values(pet.actions ?? {})) {
			assert.ok(
				motionFiles.includes(action.file),
				`${id} action is not declared by its model: ${action.file}`,
			);
		}
	}
});
```

- [ ] **Step 2: Run the test and verify that it fails**

Run:

```bash
node --test scripts/test/pet-manifest.test.mjs
```

Expected: FAIL because the manifest still contains `senko`, `tororo`, and `hijiki`, and the local model directories do not exist.

### Task 2: Vendor four pinned models and update the manifest

**Files:**
- Create: `public/pets/models/wanko/**`
- Create: `public/pets/models/nito/**`
- Create: `public/pets/models/koharu/**`
- Create: `public/pets/models/miku/**`
- Create: `public/pets/models/LICENSE`
- Create: `public/pets/models/THIRD_PARTY.md`
- Modify: `public/pets/manifest.json:66-108`
- Test: `scripts/test/pet-manifest.test.mjs`

- [ ] **Step 1: Resolve exact download targets before writing**

Run:

```bash
npm view live2d-widget-model-wanko@1.0.5 dist.tarball license --json --cache /tmp/qinggevlog-npm-cache
npm view live2d-widget-model-nito@1.0.5 dist.tarball license --json --cache /tmp/qinggevlog-npm-cache
npm view live2d-widget-model-koharu@1.0.5 dist.tarball license --json --cache /tmp/qinggevlog-npm-cache
npm view live2d-widget-model-miku@1.0.5 dist.tarball license --json --cache /tmp/qinggevlog-npm-cache
```

Expected: each command reports version `1.0.5` metadata and license `GPL-2.0`.

- [ ] **Step 2: Download and unpack only the pinned package assets**

Run these commands from the repository root:

```bash
PET_MODEL_TMP=$(mktemp -d /tmp/qingge-pet-models.XXXXXX)
npm pack live2d-widget-model-wanko@1.0.5 --pack-destination "$PET_MODEL_TMP" --cache /tmp/qinggevlog-npm-cache
npm pack live2d-widget-model-nito@1.0.5 --pack-destination "$PET_MODEL_TMP" --cache /tmp/qinggevlog-npm-cache
npm pack live2d-widget-model-koharu@1.0.5 --pack-destination "$PET_MODEL_TMP" --cache /tmp/qinggevlog-npm-cache
npm pack live2d-widget-model-miku@1.0.5 --pack-destination "$PET_MODEL_TMP" --cache /tmp/qinggevlog-npm-cache

mkdir -p "$PET_MODEL_TMP/wanko" "$PET_MODEL_TMP/nito" "$PET_MODEL_TMP/koharu" "$PET_MODEL_TMP/miku"
tar -xzf "$PET_MODEL_TMP/live2d-widget-model-wanko-1.0.5.tgz" -C "$PET_MODEL_TMP/wanko"
tar -xzf "$PET_MODEL_TMP/live2d-widget-model-nito-1.0.5.tgz" -C "$PET_MODEL_TMP/nito"
tar -xzf "$PET_MODEL_TMP/live2d-widget-model-koharu-1.0.5.tgz" -C "$PET_MODEL_TMP/koharu"
tar -xzf "$PET_MODEL_TMP/live2d-widget-model-miku-1.0.5.tgz" -C "$PET_MODEL_TMP/miku"

mkdir -p public/pets/models/wanko public/pets/models/nito public/pets/models/koharu public/pets/models/miku
cp -R "$PET_MODEL_TMP/wanko/package/assets/." public/pets/models/wanko/
cp -R "$PET_MODEL_TMP/nito/package/assets/." public/pets/models/nito/
cp -R "$PET_MODEL_TMP/koharu/package/assets/." public/pets/models/koharu/
cp -R "$PET_MODEL_TMP/miku/package/assets/." public/pets/models/miku/
curl -L https://raw.githubusercontent.com/xiazeyu/live2d-widget-models/master/LICENSE -o public/pets/models/LICENSE
```

Expected model config files:

```text
public/pets/models/wanko/wanko.model.json
public/pets/models/nito/nito.model.json
public/pets/models/koharu/koharu.model.json
public/pets/models/miku/miku.model.json
```

- [ ] **Step 3: Add the third-party notice**

Create `public/pets/models/THIRD_PARTY.md` with exactly:

```markdown
# Third-party Live2D model assets

The following runtime assets are copied from the pinned npm packages published from [xiazeyu/live2d-widget-models](https://github.com/xiazeyu/live2d-widget-models):

| Local directory | npm package | Version | License |
| --- | --- | --- | --- |
| `wanko/` | `live2d-widget-model-wanko` | `1.0.5` | GPL-2.0 |
| `nito/` | `live2d-widget-model-nito` | `1.0.5` | GPL-2.0 |
| `koharu/` | `live2d-widget-model-koharu` | `1.0.5` | GPL-2.0 |
| `miku/` | `live2d-widget-model-miku` | `1.0.5` | GPL-2.0 |

The complete upstream GPL-2.0 text is stored beside this file as `LICENSE`. Model assets remain subject to their upstream terms.
```

- [ ] **Step 4: Replace only the three deprecated manifest objects**

Preserve the current Pio and Shizuku objects byte-for-byte. Replace `senko`, `tororo`, and `hijiki` with these four objects:

```json
		{
			"id": "wanko",
			"name": "萌宠·旺仔",
			"scale": 0.82,
			"model": "/pets/models/wanko/wanko.model.json",
			"avatar": "/pets/avatars/wanko.webp",
			"quotes": [
				"汪！今天也要开心呀~",
				"陪你坐一会儿，好不好？",
				"摇摇尾巴，把烦恼赶走！"
			],
			"actions": {
				"cute": {
					"label": "卖萌",
					"file": "mtn/touch_01.mtn",
					"message": "给你一个软乎乎的贴贴~"
				},
				"dance": {
					"label": "摇尾巴",
					"file": "mtn/shake_01.mtn",
					"message": "旺仔开心地摇起尾巴啦！"
				}
			}
		},
		{
			"id": "nito",
			"name": "萌宠·糯米",
			"scale": 0.82,
			"model": "/pets/models/nito/nito.model.json",
			"avatar": "/pets/avatars/nito.webp",
			"quotes": [
				"糯米团子滚过来陪你啦~",
				"今天也要软乎乎地加油！",
				"累了就和我一起发会儿呆吧。"
			],
			"actions": {
				"cute": {
					"label": "比心",
					"file": "mtn/06_love.mtn",
					"message": "送你一颗糯米味的心~"
				},
				"dance": {
					"label": "欢呼",
					"file": "mtn/10_yeah.mtn",
					"message": "耶！今天也做得很好！"
				},
				"sleep": {
					"label": "睡觉",
					"file": "mtn/20_sleep.mtn",
					"message": "糯米先眯一小会儿~"
				}
			}
		},
		{
			"id": "koharu",
			"name": "少女·小春",
			"scale": 0.72,
			"model": "/pets/models/koharu/koharu.model.json",
			"avatar": "/pets/avatars/koharu.webp",
			"quotes": [
				"小春来陪你写点东西啦~",
				"今天也请多多关照！",
				"休息一下，灵感会自己回来哦。"
			],
			"actions": {
				"cute": {
					"label": "互动",
					"file": "mtn/01.mtn",
					"message": "嘿嘿，被你发现啦~"
				},
				"dance": {
					"label": "开心",
					"file": "mtn/05.mtn",
					"message": "把今天的好心情分你一半！"
				}
			}
		},
		{
			"id": "miku",
			"name": "少女·Miku",
			"scale": 0.7,
			"model": "/pets/models/miku/miku.model.json",
			"avatar": "/pets/avatars/miku.webp",
			"quotes": [
				"想听一段轻快的旋律吗？",
				"让今天也闪闪发光吧~",
				"写累了就跟着节拍放松一下！"
			],
			"actions": {
				"cute": {
					"label": "互动",
					"file": "mtn/miku_m_01.mtn",
					"message": "收到你的招呼啦~"
				},
				"dance": {
					"label": "摇摆",
					"file": "mtn/miku_shake_01.mtn",
					"message": "跟着旋律一起摇摆吧！"
				}
			}
		}
```

- [ ] **Step 5: Run the focused resource test**

Run:

```bash
node --test scripts/test/pet-manifest.test.mjs
```

Expected: both tests pass. Avatar files are intentionally covered in the next task.

- [ ] **Step 6: Inspect repository size before committing**

Run:

```bash
du -sh public/pets/models/wanko public/pets/models/nito public/pets/models/koharu public/pets/models/miku
git status --short public/pets/models public/pets/manifest.json scripts/test/pet-manifest.test.mjs
```

Expected: only the four model directories, license/notice, manifest, and focused test are listed. Record the four directory sizes in the implementation handoff.

- [ ] **Step 7: Commit model resources and only the replacement manifest hunk**

```bash
git add scripts/test/pet-manifest.test.mjs public/pets/models
git add -p public/pets/manifest.json
git diff --cached -- public/pets/manifest.json
git commit -m "feat: replace pet model collection"
```

Before committing, run `git diff --cached --name-only` and confirm that no existing unrelated modified file is staged. The cached manifest diff must remove Senko/Tororo/Hijiki and add Wanko/Nito/Koharu/Miku; it must not stage the pre-existing Pio or Shizuku scale hunks.

### Task 3: Produce matching avatars and remove deprecated avatar files

**Files:**
- Modify: `scripts/test/pet-manifest.test.mjs`
- Create: `public/pets/avatars/wanko.webp`
- Create: `public/pets/avatars/nito.webp`
- Create: `public/pets/avatars/koharu.webp`
- Create: `public/pets/avatars/miku.webp`
- Delete: `public/pets/avatars/senko.webp`
- Delete: `public/pets/avatars/tororo.webp`
- Delete: `public/pets/avatars/hijiki.webp`

- [ ] **Step 1: Add the failing avatar contract test**

Add this import to `scripts/test/pet-manifest.test.mjs`:

```js
import sharp from "sharp";
```

Append this test:

```js
test("new avatars are square WebP files and deprecated avatars are removed", async () => {
	for (const id of localIds) {
		const pet = manifest.pets.find((item) => item.id === id);
		assert.match(pet.avatar, new RegExp(`^/pets/avatars/${id}\\.webp$`));
		const avatarFile = publicFile(pet.avatar);
		await assert.doesNotReject(access(avatarFile));
		const metadata = await sharp(avatarFile).metadata();
		assert.equal(metadata.format, "webp");
		assert.equal(metadata.width, 160);
		assert.equal(metadata.height, 160);
	}

	for (const removedId of ["senko", "tororo", "hijiki"]) {
		await assert.rejects(access(resolve(repoRoot, `public/pets/avatars/${removedId}.webp`)));
	}
});
```

- [ ] **Step 2: Run the focused test and verify that only the avatar contract fails**

Run:

```bash
node --test scripts/test/pet-manifest.test.mjs
```

Expected: manifest and model graph tests pass; avatar test fails because the four new images do not exist and the three deprecated images still exist.

- [ ] **Step 3: Capture the actual rendered canvases**

Start the local server, then use the in-app browser skill. Open the pet menu by right-clicking the canvas and execute the following model/capture loop through the browser Node session. Use fresh variable names if the session already contains these bindings.

```js
var avatarTargets = [
	{ id: "wanko", menuName: "切换到萌宠·旺仔" },
	{ id: "nito", menuName: "切换到萌宠·糯米" },
	{ id: "koharu", menuName: "切换到少女·小春" },
	{ id: "miku", menuName: "切换到少女·Miku" },
];
var avatarFs = await import("node:fs/promises");

for (var target of avatarTargets) {
	await avatarTab.playwright.locator("canvas").click({ button: "right" });
	await avatarTab.playwright
		.getByRole("menuitemradio", { name: target.menuName })
		.click();
	await avatarTab.playwright.waitForTimeout(2500);
	var dataUrl = await avatarTab.playwright.locator("canvas").evaluate((canvas) =>
		canvas.toDataURL("image/png"),
	);
	await avatarFs.writeFile(
		`/tmp/${target.id}-canvas.png`,
		Buffer.from(dataUrl.split(",")[1], "base64"),
	);
}
```

Expected: `/tmp/wanko-canvas.png`, `/tmp/nito-canvas.png`, `/tmp/koharu-canvas.png`, and `/tmp/miku-canvas.png` exist and each visibly contains the selected model.

If WebGL readback produces a blank PNG, capture the canvas rectangle with `avatarTab.screenshot({ clip })` instead. Use one consistent page position and theme for all four fallback captures so their backgrounds match.

- [ ] **Step 4: Normalize the captures to transparent 160×160 WebP avatars**

Run:

```bash
node --input-type=module -e '
import sharp from "sharp";
const ids = ["wanko", "nito", "koharu", "miku"];
for (const id of ids) {
  await sharp(`/tmp/${id}-canvas.png`)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(160, 160, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90 })
    .toFile(`public/pets/avatars/${id}.webp`);
}
'
```

Expected: four 160×160 WebP files with transparent backgrounds and recognizable faces/silhouettes.

- [ ] **Step 5: Delete only the three explicitly deprecated avatars**

Resolve the exact files first:

```bash
ls -l public/pets/avatars/senko.webp public/pets/avatars/tororo.webp public/pets/avatars/hijiki.webp
```

Then remove exactly those three files:

```bash
rm public/pets/avatars/senko.webp public/pets/avatars/tororo.webp public/pets/avatars/hijiki.webp
```

- [ ] **Step 6: Run the avatar contract test**

Run:

```bash
node --test scripts/test/pet-manifest.test.mjs
```

Expected: 3 tests pass.

- [ ] **Step 7: Visually inspect the four avatars**

Open the four WebP files together. Require a recognizable subject, no accidental page background, no clipped face, and similar visual scale. If a canvas capture contains page pixels rather than transparency, recapture with `canvas.toDataURL()`; do not synthesize unrelated portrait art.

- [ ] **Step 8: Commit avatar changes only**

```bash
git add scripts/test/pet-manifest.test.mjs public/pets/avatars/wanko.webp public/pets/avatars/nito.webp public/pets/avatars/koharu.webp public/pets/avatars/miku.webp public/pets/avatars/senko.webp public/pets/avatars/tororo.webp public/pets/avatars/hijiki.webp
git commit -m "feat: refresh pet avatars"
```

Before committing, run `git diff --cached --name-only` and require only the focused test plus seven avatar paths.

### Task 4: Validate six-model switching and presentation

**Files:**
- Verify: `public/pets/manifest.json`
- Verify: `public/pets/models/**`
- Verify without overwriting: `src/components/fun/PetCompanion.svelte`

- [ ] **Step 1: Run the existing action tests and the new manifest tests**

Run:

```bash
node --test scripts/test/pet-actions.test.mjs scripts/test/pet-manifest.test.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Confirm every local URL is served by Astro**

With the development server running, execute:

```bash
curl -I http://127.0.0.1:4321/pets/models/wanko/wanko.model.json
curl -I http://127.0.0.1:4321/pets/models/nito/nito.model.json
curl -I http://127.0.0.1:4321/pets/models/koharu/koharu.model.json
curl -I http://127.0.0.1:4321/pets/models/miku/miku.model.json
```

Expected: all four responses are HTTP 200.

- [ ] **Step 3: Switch through all six models in a fresh browser tab**

Use the in-app browser menu in this order:

```text
少女·Pio
少女·静香
萌宠·旺仔
萌宠·糯米
少女·小春
少女·Miku
```

After each click, wait for the loading capsule to disappear. Confirm the canvas is visible and the menu title matches the selected item. The four new models must be recognizable, remain substantially inside the 260×290 canvas, and have comparable display size.

- [ ] **Step 4: Validate each declared action**

For every new model, open the menu and click every visible action once. Require visible motion and the matching bubble text. Do not add a manifest action if the corresponding file is absent from the model configuration.

- [ ] **Step 5: Inspect runtime errors and network failures**

Read browser warnings/errors after the full switch sequence.

Expected: no `[pet] model switch failed`, no `加载超时`, no 404 for `/pets/models/`, and no failed restoration to a previous model.

- [ ] **Step 6: Check the compact menu at a narrow viewport**

Use a 390px-wide viewport, open the pet menu, and confirm the six-item avatar strip scrolls horizontally without clipping the hide button or action controls. Reset the temporary viewport override after the check.

- [ ] **Step 7: Correct scale only when the browser evidence fails the acceptance boundary**

The planned values are `0.82` for Wanko, `0.82` for Nito, `0.72` for Koharu, and `0.70` for Miku. If a model is materially clipped or unreadably small, change only that manifest `scale` in increments of `0.05`, rerun its switch check, and record the final value in the handoff. Do not add model-specific CSS or change `PetCompanion.svelte`.

- [ ] **Step 8: Commit a scale-only correction if one was necessary**

```bash
git add public/pets/manifest.json
git commit -m "fix: calibrate pet model scale"
```

Skip this commit when all four planned values pass visual QA.

### Task 5: Run final engineering checks

**Files:**
- Verify: all files changed by Tasks 1-4

- [ ] **Step 1: Run formatting checks on text files**

Run:

```bash
pnpm exec biome check public/pets/manifest.json scripts/test/pet-manifest.test.mjs
```

Expected: command exits 0 without rewriting unrelated files.

- [ ] **Step 2: Run the complete test suite**

Run:

```bash
pnpm test
```

Expected: all tests pass. If an unrelated pre-existing test fails, preserve its output and do not modify that subsystem as part of the pet refresh.

- [ ] **Step 3: Run Astro checks and the production build**

Run:

```bash
pnpm check
pnpm build
```

Expected: both commands exit 0 and all local pet assets are copied into the production output.

- [ ] **Step 4: Review the final diff for scope**

Run:

```bash
git status --short
git log --stat --oneline -4
```

Expected: the recent focused commits contain the manifest, four model directories, license/notice, four new avatars, three avatar deletions, and the focused test. Existing unrelated user modifications remain unstaged and unaltered.
