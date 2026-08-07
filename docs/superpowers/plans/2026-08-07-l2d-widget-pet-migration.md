# Live2D Pet Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将博客宠物从旧版 `oh-my-live2d` 迁移到 `l2d-widget`，保留右键统一菜单，并接入真实模型缩略图、动作和表情。

**Architecture:** `PetCompanion.svelte` 继续作为唯一交互层，使用 `l2d-widget` 创建和销毁 Live2D canvas；`public/pets/manifest.json` 负责模型、语录和动作映射；`src/scripts/pet-actions.mjs` 提供可单测的动作清单解析与回退逻辑。库内置菜单和气泡关闭，由 Svelte 管理右键菜单、长按、气泡和动作按钮。

**Tech Stack:** Astro 5、Svelte 5、`l2d-widget@0.1.1`、Live2D Cubism 2/6、Node `node:test`、pnpm、Biome。

---

## Task 1: 替换 Live2D 运行库依赖

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 移除旧依赖**

Run:

```bash
pnpm remove oh-my-live2d
```

Expected: `package.json` 和 `pnpm-lock.yaml` 不再包含 `oh-my-live2d` importer 或 snapshot。

- [ ] **Step 2: 安装新版依赖**

Run:

```bash
pnpm add l2d-widget@^0.1.1
```

Expected: `package.json` 的 dependencies 包含 `"l2d-widget": "^0.1.1"`，lockfile 同时记录新版及其 `l2d` 运行时依赖。

- [ ] **Step 3: 确认包导出接口**

Run:

```bash
node -e "import('l2d-widget').then(m => console.log(typeof m.createWidget))"
```

Expected: 输出 `function`。

- [ ] **Step 4: 提交依赖迁移**

```bash
git add package.json pnpm-lock.yaml
git commit -m "refactor(pet): migrate to l2d-widget runtime"
```

## Task 2: 建立动作映射纯函数与测试

**Files:**
- Create: `src/scripts/pet-actions.mjs`
- Create: `scripts/test/pet-actions.test.mjs`

- [ ] **Step 1: 写动作解析失败测试**

Create `scripts/test/pet-actions.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
	getActionEntries,
	getAvailableActionEntries,
	pickRandomMotion,
} from "../../src/scripts/pet-actions.mjs";

const pet = {
	actions: {
		cute: { label: "卖萌", file: "motions/cute.mtn" },
		tease: { label: "撒娇", file: "motions/tease.mtn" },
		dance: { label: "跳舞", group: "Dance", index: 0 },
	},
};

test("动作映射按配置顺序转为带 id 的数组", () => {
	assert.deepEqual(getActionEntries(pet), [
		{ id: "cute", label: "卖萌", file: "motions/cute.mtn" },
		{ id: "tease", label: "撒娇", file: "motions/tease.mtn" },
		{ id: "dance", label: "跳舞", group: "Dance", index: 0 },
	]);
});

test("文件动作只保留运行时返回的可用文件", () => {
	const available = { idle: ["motions/idle.mtn"], "": ["motions/cute.mtn"] };
	const result = getAvailableActionEntries(pet, available);
	assert.deepEqual(result.map((item) => item.id), ["cute"]);
});

test("组动作按组和索引校验", () => {
	const available = { Dance: ["motions/dance.mtn"] };
	const result = getAvailableActionEntries(pet, available);
	assert.deepEqual(result.map((item) => item.id), ["dance"]);
});

test("随机动作排除 idle 组并返回可播放文件", () => {
	const available = {
		idle: ["motions/idle.mtn"],
		Tap: ["motions/tap.mtn"],
	};
	assert.deepEqual(pickRandomMotion(available, () => 0), {
		group: "Tap",
		index: 0,
		file: "motions/tap.mtn",
	});
});

test("没有非 idle 动作时返回 null", () => {
	assert.equal(pickRandomMotion({ idle: ["motions/idle.mtn"] }, () => 0), null);
});
```

- [ ] **Step 2: 运行测试确认模块尚不存在**

Run:

```bash
node --test scripts/test/pet-actions.test.mjs
```

Expected: FAIL with a module-not-found error for `src/scripts/pet-actions.mjs`。

- [ ] **Step 3: 实现最小纯函数模块**

Create `src/scripts/pet-actions.mjs` with these contracts:

```js
function getActionEntries(pet) {
	return Object.entries(pet?.actions ?? {}).flatMap(([id, config]) => {
		if (!config || typeof config.label !== "string") return [];
		return [{ id, ...config }];
	});
}

function hasFile(available, file) {
	return file && Object.values(available).some((files) =>
		files.some((item) => item === file || item.startsWith(`${file}.`)),
	);
}

function getAvailableActionEntries(pet, available) {
	return getActionEntries(pet).filter((action) =>
		action.file
			? hasFile(available, action.file)
			: Number.isInteger(action.index)
				&& Array.isArray(available[action.group])
				&& action.index >= 0
				&& action.index < available[action.group].length,
	);
}

function pickRandomMotion(available, random = Math.random) {
	const candidates = Object.entries(available)
		.filter(([group, files]) => group.toLowerCase() !== "idle" && files.length > 0)
		.flatMap(([group, files]) => files.map((file, index) => ({ group, index, file })));
	return candidates.length ? candidates[Math.floor(random() * candidates.length)] : null;
}

export { getActionEntries, getAvailableActionEntries, pickRandomMotion };
```

`hasFile`、组动作校验和随机动作必须保持纯函数，不读取 DOM 或运行时对象。

- [ ] **Step 4: 运行动作测试**

Run:

```bash
node --test scripts/test/pet-actions.test.mjs
```

Expected: 5 个测试全部 PASS。

- [ ] **Step 5: 提交动作解析模块**

```bash
git add src/scripts/pet-actions.mjs scripts/test/pet-actions.test.mjs
git commit -m "feat(pet): add model action mapping helpers"
```

## Task 3: 扩展模型清单和动作语义

**Files:**
- Modify: `public/pets/manifest.json`

- [ ] **Step 1: 为现有少女和狐娘补充动作映射**

保留已有模型 URL、名称和猫咪配置，为 Pio、Senko、静香增加以下 `actions`：

```json
{
	"pio": {
		"cute": { "label": "卖萌", "file": "motions/Touch Dere1.mtn" },
		"tease": { "label": "撒娇", "file": "motions/Touch Dere2.mtn" },
		"dance": { "label": "开心", "file": "motions/Success.mtn" },
		"sleep": { "label": "睡觉", "file": "motions/Sleeping.mtn" }
	},
	"senko": {
		"cute": { "label": "卖萌", "file": "motions/Anim_1.motion3.json" },
		"dance": { "label": "唱歌", "file": "motions/Singing.motion3.json" },
		"sleep": { "label": "睡觉", "file": "motions/Sleeping.motion3.json" }
	},
	"shizuku": {
		"cute": { "label": "卖萌", "file": "motions/tapBody_00.mtn" },
		"tease": { "label": "撒娇", "file": "motions/pinchIn_00.mtn" },
		"dance": { "label": "开心", "file": "motions/shake_00.mtn" }
	}
}
```

这些文件名已从当前 CDN 模型描述中核对。动作按钮必须经过运行时 `getMotions()` 再展示，避免 CDN 模型版本变化造成死按钮。

- [ ] **Step 2: 为模型补充语录和动作反馈**

将 `quotes` 保持为短句数组，并在新增动作配置旁增加组件可读取的 `message` 字段，例如：

```json
"cute": {
	"label": "卖萌",
	"file": "motions/Touch Dere1.mtn",
	"message": "再看我就要害羞啦~"
}
```

没有 `message` 时由组件根据动作 label 使用兜底句。

- [ ] **Step 3: 验证 manifest JSON**

Run:

```bash
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('public/pets/manifest.json','utf8')); console.log('manifest ok')"
```

Expected: 输出 `manifest ok`。

- [ ] **Step 4: 提交模型清单**

```bash
git add public/pets/manifest.json
git commit -m "feat(pet): map model motions to pet interactions"
```

## Task 4: 重写 PetCompanion 的运行库适配层

**Files:**
- Modify: `src/components/fun/PetCompanion.svelte`

- [ ] **Step 1: 替换 import 和运行时状态**

删除 `loadOml2d`、`oml2d`、旧 stage 轮询相关状态，改为：

```svelte
<script>
	import { createWidget } from "l2d-widget";
	import { onDestroy, onMount } from "svelte";
	import {
		getAvailableActionEntries,
		pickRandomMotion,
	} from "../../scripts/pet-actions.mjs";

	let widget = null;
	let canvas = null;
	let currentIdx = 0;
	let ready = false;
	let menuOpen = false;
	let bubble = "";
	let actionEntries = [];
	let bubbleTimer;
	let pressTimer;
	let menuEl;
	let menuX = 0;
	let menuY = 0;
	let cleanupCanvasEvents = () => {};
	let mounted = true;
</script>
```

Use `onDestroy` to set `mounted = false`, clear timers, call `cleanupCanvasEvents()`, remove window listeners, and await `widget?.destroy()`.

- [ ] **Step 2: 用 createWidget 替换旧初始化**

Map each manifest entry to the new model shape and initialize with:

```js
widget = createWidget({
	position: "bottom-left",
	size: { width: 300, height: 330 },
	primaryColor: "rgba(232,163,92,0.92)",
	transitionDuration: 700,
	menus: { items: [] },
	statusBar: {
		style: {
			background: "rgba(255,255,255,0.88)",
			color: "#555",
			borderRadius: "999px",
		},
	},
	model: pets.map((pet) => ({
		path: pet.model,
		scale: pet.scale ?? 1,
		volume: 0,
		tips: false,
	})),
});

widget.l2d.on("loaded", handleModelLoaded);
widget.l2d.on("tap", () => {
		playCuteAction();
});
canvas = widget.l2d.getCanvas();
cleanupCanvasEvents = bindCanvasEvents(canvas);
```

Do not bind `#oml2d-stage`; the canvas returned by `getCanvas()` is the only event target.

- [ ] **Step 3: 实现 loaded、模型切换和动作调用**

Implement these exact behaviors:

```js
function handleModelLoaded() {
	if (!mounted || !widget) return;
	ready = true;
	actionEntries = getAvailableActionEntries(
		pets[currentIdx],
		widget.l2d.getMotions(),
	);
	showBubble(`欢迎来到小屋，${pets[currentIdx].name}来啦~`);
}

async function switchTo(idx) {
	if (!widget || idx === currentIdx || !pets[idx]) return;
	menuOpen = false;
	ready = false;
	const previousIdx = currentIdx;
	currentIdx = idx;
	try {
		await widget.switchModel(idx);
	} catch (error) {
		currentIdx = previousIdx;
		ready = true;
		showBubble("这个形象暂时加载失败，先陪我一会儿吧~");
		console.warn("[pet] model switch failed", error);
	}
}

function playAction(action) {
	if (!widget || !ready || !action) return;
	if (action.file) widget.l2d.playMotionByFile(action.file, 2);
	else widget.l2d.playMotion(action.group, action.index, 2);
	if (action.expression) widget.l2d.setExpression(action.expression);
	showBubble(action.message ?? `${pets[currentIdx].name}：${action.label}~`);
	menuOpen = false;
}

function playRandomAction() {
	if (!widget || !ready) return;
	const motion = pickRandomMotion(widget.l2d.getMotions());
	if (!motion) {
		showBubble("这个形象还没有配置额外动作哦~");
		return;
	}
	widget.l2d.playMotion(motion.group, motion.index, 2);
	showBubble("随机卖个萌给你看~");
	menuOpen = false;
}

function playCuteAction() {
	const action = actionEntries.find((item) => item.id === "cute") ?? actionEntries[0];
	if (action) playAction(action);
}

function sayRandom() {
	const messages = pets[currentIdx]?.quotes?.length
		? pets[currentIdx].quotes
		: ["啾——你戳到我啦!", "今天也要元气满满哦~"];
	showBubble(messages[Math.floor(Math.random() * messages.length)]);
	menuOpen = false;
}

function hidePet() {
	menuOpen = false;
	widget?.sleep();
}

function showBubble(message) {
	clearTimeout(bubbleTimer);
	bubble = message;
	bubbleTimer = setTimeout(() => {
		bubble = "";
	}, 3200);
}
```

`switchTo` 必须在 `switchModel` 完成后重新读取 `getMotions()`，因为 `widget.l2d` 会被新版运行库替换底层模型状态。

- [ ] **Step 4: 实现右键、长按和气泡清理**

`bindCanvasEvents` 必须完成以下清理闭环：

```js
function bindCanvasEvents(target) {
	const onContextMenu = (event) => {
		event.preventDefault();
		event.stopPropagation();
		openMenuAt(event.clientX, event.clientY);
	};
	const onTouchStart = (event) => {
		const touch = event.touches[0];
		clearTimeout(pressTimer);
		pressTimer = setTimeout(() => openMenuAt(touch.clientX, touch.clientY), 450);
	};
	const cancelLongPress = () => clearTimeout(pressTimer);

	target.addEventListener("contextmenu", onContextMenu);
	target.addEventListener("touchstart", onTouchStart, { passive: true });
	target.addEventListener("touchend", cancelLongPress);
	target.addEventListener("touchmove", cancelLongPress);

	return () => {
		target.removeEventListener("contextmenu", onContextMenu);
		target.removeEventListener("touchstart", onTouchStart);
		target.removeEventListener("touchend", cancelLongPress);
		target.removeEventListener("touchmove", cancelLongPress);
		clearTimeout(pressTimer);
	};
}
```

`openMenuAt` 先用 `window.innerWidth/innerHeight` 夹紧初始位置，再在 `requestAnimationFrame` 中读取 `menuEl.getBoundingClientRect()` 纠正底部和右侧溢出。窗口监听和销毁代码使用：

```js
function openMenuAt(x, y) {
	menuX = Math.max(8, Math.min(x, window.innerWidth - 208));
	menuY = Math.max(8, Math.min(y + 8, window.innerHeight - 220));
	menuOpen = true;
	requestAnimationFrame(() => {
		if (!menuEl) return;
		const rect = menuEl.getBoundingClientRect();
		menuX = Math.max(8, Math.min(menuX, window.innerWidth - rect.width - 8));
		menuY = Math.max(8, Math.min(menuY, window.innerHeight - rect.height - 8));
	});
}

onDestroy(() => {
	mounted = false;
	clearTimeout(pressTimer);
	clearTimeout(bubbleTimer);
	cleanupCanvasEvents();
	window.removeEventListener("pointerdown", onWindowPointerDown);
	window.removeEventListener("keydown", onKeydown);
	void widget?.destroy();
});
```

`showBubble` 清除旧计时器后设置新计时器；`onMount` 中请求 manifest，验证成功后才执行 Task 4 Step 2 的 `createWidget` 初始化。

- [ ] **Step 5: 运行类型检查，修正迁移接口错误**

Run:

```bash
pnpm check
```

Expected: 0 errors。不得残留 `loadOml2d`、`stageSlideIn`、`stageSlideOut`、`tipsMessage` 或 `#oml2d-stage` 引用。

- [ ] **Step 6: 提交运行库适配层**

```bash
git add src/components/fun/PetCompanion.svelte
git commit -m "refactor(pet): adapt companion to l2d-widget API"
```

## Task 5: 重做右键菜单、动作按钮和气泡样式

**Files:**
- Modify: `src/components/fun/PetCompanion.svelte`

- [ ] **Step 1: 将菜单改成动态高度和动作分区**

菜单不再使用固定 `MENU_H = 268`；打开时先按视口宽度夹紧 X/Y，渲染后一帧通过 `menuEl.getBoundingClientRect()` 再次校正底部边界。菜单结构使用：

```svelte
{#if menuOpen}
	<div class="pet-menu" bind:this={menuEl} style={`left:${menuX}px;top:${menuY}px`} role="menu">
		<div class="pet-menu-title">{pets[currentIdx]?.name ?? "伙伴"}</div>
		<div class="pet-menu-label">切换形象</div>
		<div class="pet-pet-grid">
			{#each pets as pet, i (pet.id)}
				<button class:is-active={currentIdx === i} class="pet-item" on:click={() => switchTo(i)} type="button">
					<img src={pet.avatar} alt={pet.name} class="pet-item-img" />
					<span>{pet.name}</span>
				</button>
			{/each}
		</div>
		<div class="pet-menu-divider"></div>
		<div class="pet-menu-label">互动</div>
		<div class="pet-menu-actions">
			<button on:click={sayRandom} type="button">💬 聊天</button>
			{#each actionEntries as action (action.id)}
				<button on:click={() => playAction(action)} type="button">✨ {action.label}</button>
			{/each}
			<button on:click={playRandomAction} type="button">🎲 随机动作</button>
			<button on:click={hidePet} type="button">🙈 隐藏</button>
		</div>
	</div>
{/if}
```

`actionEntries` 只展示当前模型可用动作；按钮至少保持 `type="button"`、`role="menuitem"`、可键盘聚焦和中文 `aria-label`。

- [ ] **Step 2: 用非圆形竖向卡片展示模型缩略图**

更新 CSS：缩略图使用 `width: 42px; height: 56px; object-fit: contain; border-radius: 10px`，卡片采用 `grid-template-columns: repeat(3, minmax(0, 1fr))`，不再把少女图裁成圆头像。活动态同时显示主题边框和勾选标记。

- [ ] **Step 3: 添加气泡 DOM 和 reduced-motion 规则**

气泡使用单一 DOM 状态，固定在宠物画布上方，CSS 包含浅色、暗色和：

```css
@media (prefers-reduced-motion: reduce) {
	.pet-bubble,
	.pet-menu,
	.pet-item,
	.pet-menu-actions button {
		animation: none !important;
		transition-duration: 0.01ms !important;
	}
}
```

气泡不遮挡菜单点击，`pointer-events: none`，最大宽度 180px，长句自动换行。

- [ ] **Step 4: 运行 Svelte/Astro 检查**

Run:

```bash
pnpm check
```

Expected: 0 errors，无 a11y 事件错误或未使用变量。

- [ ] **Step 5: 提交菜单交互**

```bash
git add src/components/fun/PetCompanion.svelte
git commit -m "feat(pet): add right-click action menu and speech bubble"
```

## Task 6: 替换少女缩略图资源

**Files:**
- Create: `public/pets/avatars/pio.webp`
- Create: `public/pets/avatars/shizuku.webp`
- Modify: `public/pets/manifest.json`
- Delete: `public/pets/avatars/pio.svg`
- Delete: `public/pets/avatars/shizuku.svg`

- [ ] **Step 1: 从实际 Live2D 模型生成预览帧**

在开发页面加载 Pio 和静香模型，分别截取透明背景、完整上半身/全身可辨识的静止帧，裁剪为约 `240x320` 的竖向图。不要用 AI 重新绘制角色，也不要截取与实际模型不一致的头像。

预览帧需要满足：背景透明、角色主体完整、头发和服装轮廓不被裁切、缩小到菜单尺寸后仍能区分两个角色。

- [ ] **Step 2: 转为 WebP 并检查资源**

Run:

```bash
file public/pets/avatars/pio.webp public/pets/avatars/shizuku.webp
```

Expected: 两个文件均为有效 WebP，单个文件小于 200 KB。

- [ ] **Step 3: 更新 manifest 路径**

将 Pio 和静香的 `avatar` 分别改为 `/pets/avatars/pio.webp` 与 `/pets/avatars/shizuku.webp`，保留猫和狐娘现有头像，除非同样发现圆形裁切问题。

- [ ] **Step 4: 删除旧少女 SVG**

确认 manifest 不再引用两个 SVG 后删除旧文件，避免静态资源混淆。

- [ ] **Step 5: 提交缩略图资源**

```bash
git add public/pets/manifest.json public/pets/avatars/pio.webp public/pets/avatars/shizuku.webp
git rm public/pets/avatars/pio.svg public/pets/avatars/shizuku.svg
git commit -m "fix(pet): use model previews for girl thumbnails"
```

## Task 7: 完整自动检查和浏览器验收

**Files:**
- No new source files; verify all changed files.

- [ ] **Step 1: 运行现有测试集**

Run:

```bash
pnpm test
```

Expected: 所有现有测试和 `pet-actions.test.mjs` PASS。

- [ ] **Step 2: 运行 Astro 检查与生产构建**

Run:

```bash
pnpm check
pnpm build
```

Expected: `pnpm check` 无错误，Astro build 和 pagefind 均成功。

- [ ] **Step 3: 手动验证桌面端入口**

Run:

```bash
pnpm dev -- --host 127.0.0.1
```

在首页验证：右键打开菜单、菜单边缘定位、切换模型、动作按钮、聊天气泡、隐藏/唤醒、暗色模式和页面切换后只有一个宠物 canvas。

- [ ] **Step 4: 手动验证移动端入口**

在浏览器设备模拟器中验证：长按 450ms 打开菜单；普通点击不会打开；移动手指或抬起会取消；动作按钮可滚动和点击。

- [ ] **Step 5: 检查最终工作区状态**

```bash
git status --short
```

Expected: 本计划涉及的任务文件均已在前置任务中提交；如果浏览器验收产生了最终修正，只提交对应修正文件并使用 `fix(pet): ...` 提交信息，不重复创建空提交。
