# 小屋宠物(Pet Companion)实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为清哥的小屋博客新增一个纯前端的养成系全站悬浮宠物(首个形象:皮卡丘),支持形象收养切换、时段姿势、抚摸涨亲密度、等级称号与说话气泡。

**Architecture:** Svelte 组件(`client:only="svelte"`)挂载于 `Layout.astro`;核心数值逻辑抽为纯函数模块 `src/scripts/pet-logic.mjs`(可单测);形象库为 `public/pets/manifest.json` + 图片素材(作者零代码维护);访客数据(收养/亲密度)存 localStorage。

**Tech Stack:** Astro 5 / Svelte 5 / Stylus(组件样式)/ node:test(单测)/ Biome(格式)/ ImageGen(素材)

**关联设计文档:** `docs/superpowers/specs/2026-08-06-pet-companion-design.md`

> 提交说明:每个 Task 末尾有 commit 步骤(遵循项目 Conventional Commits 规范)。如用户不希望自动提交,跳过这些步骤,最后统一确认。

---

## Task 1: 核心逻辑模块(TDD)

**Files:**
- Test: `scripts/test/pet-logic.test.mjs`(创建)
- Create: `src/scripts/pet-logic.mjs`

- [ ] **Step 1: 写失败测试**

创建 `scripts/test/pet-logic.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
	DAILY_LIMITS,
	PET_GAIN,
	ensureToday,
	getLevelInfo,
	getScheduledPose,
	getTodayKey,
	grantPet,
	grantStay,
	grantVisit,
	resolvePoseUrl,
} from "../../src/scripts/pet-logic.mjs";

const BASE_STATE = {
	adopted: null,
	intimacy: 0,
	lastVisit: "",
	todayPets: 0,
	todayStayRewards: 0,
};

test("getTodayKey 输出本地日期 YYYY-MM-DD", () => {
	assert.equal(getTodayKey(new Date(2026, 7, 6)), "2026-08-06");
});

test("姿势时刻表:23:00-6:00 睡觉,其余正常", () => {
	assert.equal(getScheduledPose(3), "sleep");
	assert.equal(getScheduledPose(23), "sleep");
	assert.equal(getScheduledPose(6), "idle");
	assert.equal(getScheduledPose(12), "idle");
	assert.equal(getScheduledPose(22), "idle");
});

test("等级阈值与称号", () => {
	assert.equal(getLevelInfo(0).title, "陌生");
	assert.equal(getLevelInfo(49).level, 1);
	assert.equal(getLevelInfo(50).title, "熟悉");
	assert.equal(getLevelInfo(150).title, "好友");
	assert.equal(getLevelInfo(300).title, "亲密");
	assert.equal(getLevelInfo(600).title, "挚爱");
	assert.equal(getLevelInfo(9999).nextThreshold, null);
});

test("等级进度按下一阈值计算", () => {
	const info = getLevelInfo(75);
	assert.equal(info.nextThreshold, 150);
	assert.ok(Math.abs(info.progress - 0.25) < 1e-9);
});

test("姿势缺失回退 idle,全缺失返回空串", () => {
	const pet = { poses: { idle: "pikachu/idle.png" } };
	assert.equal(resolvePoseUrl(pet, "sleep"), "/pets/pikachu/idle.png");
	assert.equal(resolvePoseUrl({ poses: {} }, "idle"), "");
});

test("每日首访发放回访奖励并重置计数", () => {
	const s = grantVisit(
		{ ...BASE_STATE, intimacy: 10, lastVisit: "2026-08-05", todayPets: 9 },
		"2026-08-06",
	);
	assert.equal(s.intimacy, 10 + PET_GAIN.visit);
	assert.equal(s.todayPets, 0);
	assert.equal(s.lastVisit, "2026-08-06");
});

test("同日二次访问不重复发放", () => {
	const s0 = { ...BASE_STATE, lastVisit: "2026-08-06", intimacy: 15 };
	assert.equal(grantVisit(s0, "2026-08-06").intimacy, 15);
});

test("抚摸涨亲密度且受每日上限约束", () => {
	let s = { ...BASE_STATE, lastVisit: "2026-08-06" };
	for (let i = 0; i < DAILY_LIMITS.pet + 3; i++) s = grantPet(s, "2026-08-06");
	assert.equal(s.todayPets, DAILY_LIMITS.pet);
	assert.equal(s.intimacy, PET_GAIN.pet * DAILY_LIMITS.pet);
});

test("阅读停留涨亲密度且受每日上限约束", () => {
	let s = { ...BASE_STATE, lastVisit: "2026-08-06" };
	for (let i = 0; i < DAILY_LIMITS.stay + 2; i++) s = grantStay(s, "2026-08-06");
	assert.equal(s.todayStayRewards, DAILY_LIMITS.stay);
	assert.equal(s.intimacy, PET_GAIN.stay * DAILY_LIMITS.stay);
});

test("跨天重置每日计数", () => {
	const s = ensureToday(
		{ ...BASE_STATE, lastVisit: "2026-08-05", todayPets: 8, todayStayRewards: 9 },
		"2026-08-06",
	);
	assert.equal(s.todayPets, 0);
	assert.equal(s.todayStayRewards, 0);
	assert.equal(s.lastVisit, "2026-08-06");
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test scripts/test/pet-logic.test.mjs`
Expected: FAIL,`Cannot find module '../../src/scripts/pet-logic.mjs'`

- [ ] **Step 3: 实现最小代码**

创建 `src/scripts/pet-logic.mjs`:

```js
/**
 * 小屋宠物核心逻辑(纯函数,便于单元测试)
 * - 等级称号、姿势时段、亲密度增长与每日上限
 */

export const LEVELS = [
	{ level: 1, title: "陌生", threshold: 0 },
	{ level: 2, title: "熟悉", threshold: 50 },
	{ level: 3, title: "好友", threshold: 150 },
	{ level: 4, title: "亲密", threshold: 300 },
	{ level: 5, title: "挚爱", threshold: 600 },
];

/** 单次亲密度增量 */
export const PET_GAIN = { pet: 2, stay: 3, visit: 5 };

/** 每日上限(次) */
export const DAILY_LIMITS = { pet: 10, stay: 15, visit: 1 };

/** 本地日期键 YYYY-MM-DD */
export function getTodayKey(date = new Date()) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/** 亲密度派生等级 / 称号 / 下一级阈值 / 进度 */
export function getLevelInfo(intimacy) {
	let current = LEVELS[0];
	for (const lv of LEVELS) {
		if (intimacy >= lv.threshold) current = lv;
	}
	const next = LEVELS.find((lv) => lv.level === current.level + 1) ?? null;
	const span = next ? next.threshold - current.threshold : 1;
	const progress = next
		? Math.min(1, (intimacy - current.threshold) / span)
		: 1;
	return {
		level: current.level,
		title: current.title,
		nextThreshold: next ? next.threshold : null,
		progress,
	};
}

/** 时段姿势:23:00–6:00 睡觉,其余正常 */
export function getScheduledPose(hour) {
	return hour >= 23 || hour < 6 ? "sleep" : "idle";
}

/** 解析姿势图路径;缺失姿势回退 idle,全缺失返回空串 */
export function resolvePoseUrl(pet, poseKey, base = "/pets/") {
	const poses = pet?.poses ?? {};
	const path = poses[poseKey] ?? poses.idle;
	return path ? `${base}${path}` : "";
}

/** 跨天时重置每日计数;同日返回原对象 */
export function ensureToday(state, todayKey) {
	if (state.lastVisit === todayKey) return state;
	return { ...state, lastVisit: todayKey, todayPets: 0, todayStayRewards: 0 };
}

/** 当日首次访问 +5(重复访问不发放) */
export function grantVisit(state, todayKey) {
	if (state.lastVisit === todayKey) return state;
	const fresh = ensureToday(state, todayKey);
	return { ...fresh, intimacy: fresh.intimacy + PET_GAIN.visit };
}

/** 抚摸 +2,每日上限 10 次 */
export function grantPet(state, todayKey) {
	const s = ensureToday(state, todayKey);
	if (s.todayPets >= DAILY_LIMITS.pet) return s;
	return {
		...s,
		intimacy: s.intimacy + PET_GAIN.pet,
		todayPets: s.todayPets + 1,
	};
}

/** 阅读停留 +3,每日上限 15 次 */
export function grantStay(state, todayKey) {
	const s = ensureToday(state, todayKey);
	if (s.todayStayRewards >= DAILY_LIMITS.stay) return s;
	return {
		...s,
		intimacy: s.intimacy + PET_GAIN.stay,
		todayStayRewards: s.todayStayRewards + 1,
	};
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test scripts/test/pet-logic.test.mjs`
Expected: PASS,10 个测试全部通过

- [ ] **Step 5: Commit**

```bash
git add src/scripts/pet-logic.mjs scripts/test/pet-logic.test.mjs
git commit -m "feat(pet): add core pet logic module with unit tests"
```

---

## Task 2: 配置开关与形象库清单

**Files:**
- Modify: `src/config.ts`(funConfig 末尾新增 pet)
- Create: `public/pets/manifest.json`

- [ ] **Step 1: funConfig 新增 pet 配置**

在 `src/config.ts` 的 `funConfig` 对象中,`musicPlayer` 配置项之后(对象末尾、闭合 `};` 之前)新增:

```ts
	/**
	 * 小屋宠物(全站悬浮养成伙伴)
	 * - 形象库:public/pets/manifest.json + public/pets/<id>/<姿势>.png
	 * - 访客可收养形象、抚摸涨亲密度,数据存浏览器 localStorage
	 */
	pet: {
		enable: true,
		/** 未收养 / 形象加载失败时回退的默认形象 id */
		defaultPet: "pikachu",
		panelTitle: "小屋宠物",
	},
```

- [ ] **Step 2: 创建形象库清单**

创建 `public/pets/manifest.json`:

```json
{
	"pets": [
		{
			"id": "pikachu",
			"name": "皮卡丘",
			"poses": {
				"idle": "pikachu/idle.png",
				"sleep": "pikachu/sleep.png",
				"happy": "pikachu/happy.png"
			},
			"quotes": [
				"皮卡~丘!",
				"十万伏特!今天也要元气满满",
				"想在屋里打个盹~",
				"一起看海吗?"
			]
		}
	]
}
```

- [ ] **Step 3: 验证配置不破坏构建**

Run: `pnpm check 2>&1 | tail -5`
Expected: 0 errors(新增对象字面量不影响类型)

- [ ] **Step 4: Commit**

```bash
git add src/config.ts public/pets/manifest.json
git commit -m "feat(pet): add pet config switch and pet manifest"
```

---

## Task 3: 生成皮卡丘素材(3 姿势)

**Files:**
- Create: `public/pets/pikachu/idle.png`
- Create: `public/pets/pikachu/sleep.png`
- Create: `public/pets/pikachu/happy.png`

- [ ] **Step 1: 创建素材目录**

Run: `mkdir -p public/pets/pikachu`

- [ ] **Step 2: 用 ImageGen 生成三张姿势图**

统一画风提示词基底(三条 prompt 共用前缀):
`Chubby cute Pikachu, flat vector cartoon style, soft cel shading, warm cream background, centered full body, sticker-like clean outline`

| 姿势 | 附加描述 | size |
|------|---------|------|
| idle | `standing upright, relaxed happy smile, tiny tail visible` | 1024x1024 |
| sleep | `curled up sleeping with eyes closed, a tiny snot bubble, zzz floating` | 1024x1024 |
| happy | `jumping with joy, electric sparks around cheeks, big open smile` | 1024x1024 |

若生成工具因版权拒绝 Pikachu,改用原创形象提示词:`cute round yellow electric mouse mascot, black-tipped ears, lightning-bolt tail, flat vector cartoon style...`(同一角色的三种姿势),并把 manifest.json 中 `name` 改为 `"皮丘"` 等原创名。

- [ ] **Step 3: 复制到素材目录**

将 ImageGen 返回的三个文件路径复制为:
`public/pets/pikachu/idle.png`、`public/pets/pikachu/sleep.png`、`public/pets/pikachu/happy.png`

Run: `ls -la public/pets/pikachu/`
Expected: 三个 png 文件存在

- [ ] **Step 4: Commit**

```bash
git add public/pets/pikachu/
git commit -m "feat(pet): add pikachu pose assets"
```

---

## Task 4: PetCompanion.svelte 组件

**Files:**
- Create: `src/components/fun/PetCompanion.svelte`

- [ ] **Step 1: 创建组件(script 部分)**

创建 `src/components/fun/PetCompanion.svelte`:

```svelte
<script lang="ts">
import { onDestroy, onMount } from "svelte";
import {
	getLevelInfo,
	getScheduledPose,
	getTodayKey,
	grantPet,
	grantStay,
	grantVisit,
	resolvePoseUrl,
} from "../../scripts/pet-logic.mjs";

export let petConfig: { defaultPet: string; panelTitle: string };

/** 形象未配置自定义语录时的兜底短句 */
const FALLBACK_QUOTES = [
	"代码如诗,贵在留白。",
	"今天也要慢慢进步呀。",
	"看看海,吹吹风,又长大了一点。",
	"别急,慢慢来,小屋一直在。",
	"种一棵树最好的时间是十年前,其次是现在。",
];

const REACTIONS = ["嘿嘿~", "好舒服呀!", "皮卡皮卡♪", "再摸摸我嘛"];

const STORAGE_KEY = "qingge-pet-v1";

type PetDef = {
	id: string;
	name: string;
	poses: Record<string, string>;
	quotes?: string[];
};

type PetState = {
	adopted: string | null;
	intimacy: number;
	lastVisit: string;
	todayPets: number;
	todayStayRewards: number;
};

const DEFAULT_STATE: PetState = {
	adopted: null,
	intimacy: 0,
	lastVisit: "",
	todayPets: 0,
	todayStayRewards: 0,
};

let pets: PetDef[] = [];
let ready = false;
let state: PetState = { ...DEFAULT_STATE };
let panelOpen = false;
let pose = "idle";
let bubble = "";
let imgFailed: Set<string> = new Set();
let hearts: number[] = [];
let heartSeq = 0;

let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
let bubbleHideTimer: ReturnType<typeof setTimeout> | undefined;
let stayTimer: ReturnType<typeof setInterval> | undefined;
let poseTimer: ReturnType<typeof setInterval> | undefined;
let happyTimer: ReturnType<typeof setTimeout> | undefined;

const reducedMotion =
	typeof window !== "undefined" &&
	Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

function loadState(): PetState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_STATE };
		return { ...DEFAULT_STATE, ...JSON.parse(raw) };
	} catch {
		return { ...DEFAULT_STATE };
	}
}

function saveState() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// 内存模式:忽略写入失败
	}
}

$: currentPet =
	pets.find((p) => p.id === state.adopted) ??
	pets.find((p) => p.id === petConfig.defaultPet) ??
	pets[0];

$: poseUrl = currentPet ? resolvePoseUrl(currentPet, pose) : "";
$: levelInfo = getLevelInfo(state.intimacy);
$: showFallback = !poseUrl || imgFailed.has(poseUrl);

function pick<T>(pool: T[]): T {
	return pool[Math.floor(Math.random() * pool.length)];
}

function say(text: string) {
	bubble = text;
	if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
	bubbleHideTimer = setTimeout(() => {
		bubble = "";
	}, 4000);
}

function scheduleBubble() {
	if (bubbleTimer) clearTimeout(bubbleTimer);
	const delay = (3 + Math.random() * 3) * 60_000; // 3–6 分钟
	bubbleTimer = setTimeout(() => {
		const pool = currentPet?.quotes?.length
			? currentPet.quotes
			: FALLBACK_QUOTES;
		say(pick(pool));
		scheduleBubble();
	}, delay);
}

function spawnHearts() {
	if (reducedMotion) return;
	for (let i = 0; i < 5; i++) {
		const id = ++heartSeq;
		hearts = [...hearts, id];
		setTimeout(() => {
			hearts = hearts.filter((h) => h !== id);
		}, 900);
	}
}

function petIt() {
	if (!currentPet) return;
	state = grantPet(state, getTodayKey());
	saveState();
	pose = "happy";
	say(pick(REACTIONS));
	spawnHearts();
	if (happyTimer) clearTimeout(happyTimer);
	happyTimer = setTimeout(() => {
		pose = getScheduledPose(new Date().getHours());
	}, 2500);
}

function adopt(id: string) {
	state = { ...state, adopted: id };
	imgFailed = new Set();
	saveState();
	say("请多指教呀!");
}

function onImgError(url: string) {
	const next = new Set(imgFailed);
	next.add(url);
	imgFailed = next;
}

onMount(async () => {
	state = loadState();
	try {
		const res = await fetch("/pets/manifest.json");
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		if (!Array.isArray(data?.pets) || data.pets.length === 0) {
			throw new Error("manifest pets is empty");
		}
		pets = data.pets;
	} catch (error) {
		console.warn("[pet] manifest 加载失败,功能已静默关闭", error);
		return;
	}
	state = grantVisit(state, getTodayKey());
	saveState();
	pose = getScheduledPose(new Date().getHours());
	ready = true;

	scheduleBubble();
	stayTimer = setInterval(() => {
		state = grantStay(state, getTodayKey());
		saveState();
	}, 120_000); // 每 2 分钟
	poseTimer = setInterval(() => {
		pose = getScheduledPose(new Date().getHours());
	}, 60_000);
});

onDestroy(() => {
	if (bubbleTimer) clearTimeout(bubbleTimer);
	if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
	if (stayTimer) clearInterval(stayTimer);
	if (poseTimer) clearInterval(poseTimer);
	if (happyTimer) clearTimeout(happyTimer);
});
</script>
```

- [ ] **Step 2: 模板部分**

在同一文件追加模板:

```svelte
{#if ready && currentPet}
	<div class="pet-wrap">
		{#if bubble}
			<div class="pet-bubble" role="status">{bubble}</div>
		{/if}

		<button
			type="button"
			class="pet-fab"
			aria-label="{petConfig.panelTitle}面板"
			aria-expanded={panelOpen}
			on:click={() => (panelOpen = !panelOpen)}
		>
			{#if showFallback}
				<span class="pet-fab-emoji" aria-hidden="true">🐾</span>
			{:else}
				<img src={poseUrl} alt={currentPet.name} on:error={() => onImgError(poseUrl)} />
			{/if}
		</button>

		{#if panelOpen}
			<div class="pet-panel" role="dialog" aria-label={petConfig.panelTitle}>
				<header class="pet-panel-head">
					<span class="pet-panel-title">{petConfig.panelTitle}</span>
					<button type="button" class="pet-close" aria-label="收起" on:click={() => (panelOpen = false)}>✕</button>
				</header>

				{#if state.adopted}
					<button type="button" class="pet-stage" aria-label="抚摸{currentPet.name}" on:click={petIt}>
						{#if showFallback}
							<span class="pet-stage-emoji" aria-hidden="true">🐾</span>
						{:else}
							<img src={poseUrl} alt={currentPet.name} on:error={() => onImgError(poseUrl)} />
						{/if}
						{#each hearts as id (id)}
							<span class="pet-heart" aria-hidden="true">💛</span>
						{/each}
					</button>
					<div class="pet-meta">
						<p class="pet-name">{currentPet.name} · {levelInfo.title}</p>
						<div class="pet-bar">
							<div class="pet-bar-fill" style="width: {Math.round(levelInfo.progress * 100)}%"></div>
						</div>
						<p class="pet-intimacy">
							{#if levelInfo.nextThreshold}
								亲密度 {state.intimacy} / {levelInfo.nextThreshold} · 点大图摸摸它
							{:else}
								亲密度 {state.intimacy} · 已满级!
							{/if}
						</p>
					</div>
				{:else}
					<p class="pet-guide">小屋里还没有小伙伴,来收养一只吧!</p>
				{/if}

				<div class="pet-grid">
					{#each pets as pet (pet.id)}
						<button
							type="button"
							class="pet-cell"
							class:is-active={state.adopted === pet.id}
							on:click={() => adopt(pet.id)}
						>
							<img src={resolvePoseUrl(pet, "idle")} alt={pet.name} />
							<span>{pet.name}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
```

- [ ] **Step 3: 样式部分**

继续追加(暗色模式选择器为 `:root.dark`,沿用项目约定):

```svelte
<style lang="stylus">
.pet-wrap
	position fixed
	left 1rem
	bottom 1.25rem
	z-index 55
	display flex
	flex-direction column
	align-items flex-start
	gap 0.5rem

.pet-fab
	width 56px
	height 56px
	border-radius 9999px
	border 1px solid rgba(120, 120, 120, 0.18)
	background rgba(255, 255, 255, 0.92)
	box-shadow 0 6px 18px rgba(0, 0, 0, 0.12)
	cursor pointer
	overflow hidden
	padding 6px
	transition transform 0.2s ease, box-shadow 0.2s ease

.pet-fab:hover
	transform translateY(-2px)
	box-shadow 0 8px 22px rgba(0, 0, 0, 0.18)

.pet-fab img
	width 100%
	height 100%
	object-fit contain

.pet-fab-emoji
	font-size 1.5rem
	line-height 1

.pet-bubble
	max-width 220px
	padding 0.5rem 0.75rem
	border-radius 0.75rem
	background rgba(255, 255, 255, 0.95)
	border 1px solid rgba(120, 120, 120, 0.18)
	box-shadow 0 4px 14px rgba(0, 0, 0, 0.1)
	font-size 0.8rem
	color #333

.pet-panel
	width min(320px, calc(100vw - 2rem))
	border-radius 1rem
	background rgba(255, 255, 255, 0.96)
	border 1px solid rgba(120, 120, 120, 0.18)
	box-shadow 0 12px 32px rgba(0, 0, 0, 0.16)
	padding 0.875rem

.pet-panel-head
	display flex
	align-items center
	justify-content space-between
	margin-bottom 0.5rem

.pet-panel-title
	font-weight 700
	font-size 0.95rem
	color #222

.pet-close
	border none
	background transparent
	cursor pointer
	font-size 0.9rem
	color #666
	padding 0.25rem 0.4rem
	border-radius 0.5rem

.pet-close:hover
	background rgba(120, 120, 120, 0.12)

.pet-stage
	position relative
	display block
	width 100%
	height 140px
	border none
	background transparent
	cursor pointer
	padding 0

.pet-stage img
	width 100%
	height 100%
	object-fit contain

.pet-stage-emoji
	font-size 3rem

.pet-heart
	position absolute
	top 20%
	left 50%
	font-size 1rem
	animation pet-heart-rise 0.9s ease-out forwards

.pet-heart:nth-child(odd)
	left 35%

.pet-heart:nth-child(3n)
	left 65%

@keyframes pet-heart-rise
	from
		opacity 1
		transform translateY(0)
	to
		opacity 0
		transform translateY(-42px)

.pet-meta
	margin-top 0.375rem

.pet-name
	font-size 0.85rem
	font-weight 600
	color #333
	margin 0 0 0.375rem

.pet-bar
	height 6px
	border-radius 9999px
	background rgba(120, 120, 120, 0.18)
	overflow hidden

.pet-bar-fill
	height 100%
	border-radius 9999px
	background var(--primary)
	transition width 0.4s ease

.pet-intimacy
	font-size 0.72rem
	color #777
	margin 0.375rem 0 0

.pet-guide
	font-size 0.85rem
	color #555
	text-align center
	padding 1rem 0

.pet-grid
	display grid
	grid-template-columns repeat(3, 1fr)
	gap 0.5rem
	margin-top 0.75rem

.pet-cell
	display flex
	flex-direction column
	align-items center
	gap 0.25rem
	padding 0.5rem 0.25rem
	border-radius 0.75rem
	border 1px solid transparent
	background rgba(120, 120, 120, 0.08)
	cursor pointer
	font-size 0.72rem
	color #444

.pet-cell img
	width 40px
	height 40px
	object-fit contain

.pet-cell.is-active
	border-color var(--primary)
	background rgba(255, 255, 255, 0.6)

:root.dark .pet-fab,
:root.dark .pet-bubble,
:root.dark .pet-panel
	background rgba(38, 38, 38, 0.94)
	border-color rgba(255, 255, 255, 0.1)

:root.dark .pet-bubble,
:root.dark .pet-panel-title,
:root.dark .pet-name
	color #e5e5e5

:root.dark .pet-intimacy,
:root.dark .pet-close
	color #aaa

:root.dark .pet-cell
	background rgba(255, 255, 255, 0.06)
	color #ccc

:root.dark .pet-cell.is-active
	background rgba(255, 255, 255, 0.12)

@media (prefers-reduced-motion: reduce)
	.pet-heart
		animation none
		display none
</style>
```

- [ ] **Step 4: 静态检查**

Run: `npx biome check src/components/fun/PetCompanion.svelte`
Expected: 无 error(格式不符时运行 `npx biome check --write` 该文件)

- [ ] **Step 5: Commit**

```bash
git add src/components/fun/PetCompanion.svelte
git commit -m "feat(pet): add PetCompanion svelte component"
```

---

## Task 5: 挂载到 Layout 并集成验证

**Files:**
- Modify: `src/layouts/Layout.astro`(import 区 + body 挂载点)

- [ ] **Step 1: 添加 import**

在 `src/layouts/Layout.astro` 顶部 import 区,`import Splash from "@components/Splash.astro";` 之后添加:

```astro
import PetCompanion from "@components/fun/PetCompanion.svelte";
```

并把 `import { profileConfig, siteConfig } from "@/config";` 改为：
`import { funConfig, profileConfig, siteConfig } from "@/config";`

- [ ] **Step 2: body 中挂载组件**

在 `<MusicPlayer />` 之后添加:

```astro
{funConfig.pet.enable && <PetCompanion client:only="svelte" petConfig={funConfig.pet} />}
```

- [ ] **Step 3: 全量静态检查**

Run: `pnpm check 2>&1 | tail -6 && npx biome check ./src 2>&1 | tail -4`
Expected: astro check 0 errors(既有 3 hints 可接受);biome 无 error

- [ ] **Step 4: 构建验证**

Run: `pnpm build 2>&1 | tail -6`
Expected: `[build] Complete!`,Pagefind 索引正常;`ls dist/pets/pikachu/` 有三个 png

- [ ] **Step 5: 手动验收(dev)**

Run: `pnpm dev`(后台),浏览器打开 http://localhost:4321/ 检查:
1. 左下角出现皮卡丘 FAB,点击打开面板
2. 面板内点大图:心心粒子 + 气泡反应 + 亲密度 +2
3. 形象网格点"皮卡丘"完成收养,刷新后保持已收养
4. localStorage 出现 `qingge-pet-v1`
5. 移动端视口(375px)FAB 不遮挡正文
6. 临时把 `funConfig.pet.enable` 设为 `false` 后刷新,组件完全消失;验证完改回 `true`

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(pet): mount PetCompanion in layout"
```

---

## Task 6: 文档更新与最终检查

**Files:**
- Modify: `README.md`(功能开关速查表)

- [ ] **Step 1: README 速查表加行**

在 `README.md` 的「功能开关速查」表格中,`| 站点天数 | `funConfig.siteDays` |` 之后添加:

```markdown
| 小屋宠物 | `funConfig.pet` |
```

并在「本站扩展」清单末尾添加:

```markdown
- [x] **小屋宠物**(全站悬浮养成:收养形象 / 抚摸涨亲密度 / 等级称号)
```

- [ ] **Step 2: 最终全量检查**

Run: `pnpm format && pnpm check 2>&1 | tail -4 && npx biome check ./src 2>&1 | tail -3 && node --test scripts/test/pet-logic.test.mjs`
Expected: format 无新增破坏;astro check 0 errors;biome 0 errors;10 个单测全部通过

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add pet feature to README"
```

---

## 验收清单(对照设计文档)

| 设计要点 | 实现位置 |
|---------|---------|
| 形象库 manifest + 素材目录 | Task 2 / Task 3 |
| 访客收养/切换(localStorage) | Task 4 `adopt()` / `saveState()` |
| 多姿势时段切换(idle/sleep/happy) | Task 1 `getScheduledPose` + Task 4 `poseTimer` |
| 亲密度:抚摸+2/停留+3/回访+5 带每日上限 | Task 1 `grantPet/grantStay/grantVisit` |
| 等级称号与进度条 | Task 1 `getLevelInfo` + Task 4 面板 |
| 气泡:形象 quotes 优先,兜底内置短句 | Task 4 `scheduleBubble` |
| 全站悬浮左下角 FAB | Task 4 样式 + Task 5 挂载 |
| manifest 失败静默关闭 / 图片回退 🐾 | Task 4 `onMount` catch / `onImgError` |
| prefers-reduced-motion | Task 4 `reducedMotion` + 样式媒体查询 |
| enable:false 完全不渲染 | Task 5 挂载条件 |
