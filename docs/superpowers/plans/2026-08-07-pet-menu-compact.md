# 桌面宠物极简菜单 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task with verification checkpoints.

**Goal:** 将宠物右键菜单压缩为横向缩略图选择器，移除无效的聊天入口，保留真实 Live2D 动作和隐藏能力，并用紧凑横向加载提示替换竖向加载状态。

**Architecture:** `PetCompanion.svelte` 继续作为唯一交互层，负责菜单状态、动作触发、加载提示和右键/长按事件；`pet-actions.mjs` 提供可测试的“当前模型主要动作”选择逻辑；`manifest.json` 只维护模型资料和缩略图路径。由于 `l2d-widget@0.1.1` 的 status bar 同时承担休眠唤醒，保留其实例但只在加载/切换期间隐藏，并由 Svelte 显示自定义加载胶囊。

**Tech Stack:** Astro 5, Svelte, `l2d-widget@0.1.1`, Node test runner, WebP assets, pnpm.

---

### Task 1: 为极简动作入口增加可测试的主要动作选择器

**Files:**
- Modify: `src/scripts/pet-actions.mjs`
- Test: `scripts/test/pet-actions.test.mjs`

- [ ] **Step 1: 写失败测试，明确“卖萌优先、无动作返回 null”**

在现有测试文件的 import 中加入 `getPrimaryActionEntry`，追加：

```js
test("主要动作优先选择可用的 cute 动作", () => {
	const available = {
		"": ["motions/cute.mtn", "motions/other.mtn"],
		Dance: ["motions/dance.mtn"],
	};
	assert.deepEqual(getPrimaryActionEntry(pet, available), {
		id: "cute",
		label: "卖萌",
		file: "motions/cute.mtn",
	});
});

test("没有可播放动作时主要动作返回 null", () => {
	assert.equal(getPrimaryActionEntry({ actions: {} }, { idle: ["motions/idle.mtn"] }), null);
});
```

- [ ] **Step 2: 运行单测确认新增测试失败**

Run: `node --test scripts/test/pet-actions.test.mjs`

Expected: 新增测试因 `getPrimaryActionEntry` 未导出而失败，既有测试仍可执行。

- [ ] **Step 3: 实现最小选择逻辑**

在 `src/scripts/pet-actions.mjs` 中加入：

```js
function getPrimaryActionEntry(pet, available) {
	const actions = getAvailableActionEntries(pet, available);
	return actions.find((action) => action.id === "cute") ?? actions[0] ?? null;
}
```

并将其加入现有 export。该函数只决定菜单展示的主要动作，不改变随机动作工具的行为。

- [ ] **Step 4: 运行单测确认通过**

Run: `node --test scripts/test/pet-actions.test.mjs`

Expected: 7 个测试全部 PASS。

- [ ] **Step 5: 提交动作选择器**

```bash
git add src/scripts/pet-actions.mjs scripts/test/pet-actions.test.mjs
git commit -m "feat(pet): resolve primary model action"
```

### Task 2: 改造 PetCompanion 的状态与功能边界

**Files:**
- Modify: `src/components/fun/PetCompanion.svelte`

- [ ] **Step 1: 替换动作 import，并增加状态变量**

将 import 改为同时引入 `getPrimaryActionEntry`，并在状态区加入：

```js
let primaryAction = null;
let loadStatus = "正在准备";
let nativeStatusBar = null;

function setNativeStatusLoading(isLoading) {
	if (!nativeStatusBar) return;
	nativeStatusBar.classList.toggle("pet-native-status-loading", isLoading);
}
```

`loadStatus` 只允许 `"正在准备"`、`"切换中"` 或空字符串；`nativeStatusBar` 用于保留休眠唤醒能力，但加载时由 CSS 隐藏。

- [ ] **Step 2: 让动作列表同步主要动作**

在 `refreshActionEntries()` 完成赋值后追加：

```js
primaryAction = getPrimaryActionEntry(
		pets[currentIdx],
		widget.l2d.getMotions(),
);
```

在无 widget 或无当前宠物的分支中同时将 `primaryAction = null`。

- [ ] **Step 3: 统一初始化、切换、失败时的加载状态**

具体行为：

```js
function handleModelLoaded() {
	// 保留现有 pendingInitialIdx 分支
	ready = true;
	loadStatus = "";
	setNativeStatusLoading(false);
	refreshActionEntries();
	// 保留现有欢迎气泡
}
```

在 manifest 请求开始时保持 `loadStatus = "正在准备"`；manifest 失败时设为空。在创建 widget 后，找到刚创建的 z-index 为 `9998` 的 body 子元素并保存：

```js
nativeStatusBar = [...document.body.children].find(
		(element) => element.style.zIndex === "9998",
	) ?? null;
setNativeStatusLoading(true);
```

在 `switchTo()` 设置 `ready = false` 后设置 `loadStatus = "切换中"`、`setNativeStatusLoading(true)`；成功加载由 `handleModelLoaded()` 清除，失败分支设 `loadStatus = ""`、`setNativeStatusLoading(false)`。

- [ ] **Step 4: 移除纯文字聊天和常驻随机动作入口**

删除 `sayRandom()` 以及菜单中对应的 `💬 聊天` 按钮；删除 `playRandomAction()`，保留 `playAction()` 和点击模型触发的 `playCuteAction()`，避免菜单出现没有明确视觉反馈的功能。

将 `hidePet()` 保留为：

```js
function hidePet() {
	menuOpen = false;
	widget?.sleep();
}
```

这样“隐藏”仍可通过 l2d-widget 的休息状态条唤醒。

### Task 3: 重做极简菜单和自定义加载胶囊

**Files:**
- Modify: `src/components/fun/PetCompanion.svelte`

- [ ] **Step 1: 添加加载状态 DOM**

在气泡 DOM 之前加入：

```svelte
{#if loadStatus}
	<div class="pet-load-status" aria-live="polite">
		<span class="pet-load-spinner" aria-hidden="true"></span>
		{loadStatus}
	</div>
{/if}
```

加载胶囊固定在宠物画布左上方附近，使用 `pointer-events: none`，避免挡住模型点击。

- [ ] **Step 2: 用横向缩略图条替换两列大卡片**

将菜单内容替换为：

```svelte
<div class="pet-menu-head">
	<div class="pet-menu-title">{pets[currentIdx]?.name ?? "伙伴"}</div>
	<button type="button" class="pet-hide-button" role="menuitem" on:click={hidePet} aria-label="隐藏宠物">×</button>
</div>
<div class="pet-pet-strip" aria-label="切换形象">
	{#each pets as pet, i (pet.id)}
		<button
			type="button"
			class="pet-item"
			class:is-active={currentIdx === i}
			aria-label={`切换到${pet.name}`}
			aria-pressed={currentIdx === i}
			role="menuitem"
			on:click={() => switchTo(i)}
		>
			{#if pet.avatar}
				<img src={pet.avatar} alt={pet.name} class="pet-item-img" />
			{:else}
				<span class="pet-item-placeholder">🐾</span>
			{/if}
			<span class="pet-item-name">{pet.name.replace(/^[^·]+·/, "")}</span>
			{#if currentIdx === i}<span class="pet-check" aria-hidden="true">✓</span>{/if}
		</button>
	{/each}
</div>
{#if primaryAction}
	<button type="button" class="pet-primary-action" role="menuitem" on:click={() => playAction(primaryAction)}>
		✨ {primaryAction.label}
	</button>
{/if}
```

保留 `role="menu"`、按钮键盘行为和当前项语义；不再渲染“互动”标题、聊天、随机动作或动作列表。

- [ ] **Step 3: 应用极简尺寸和响应式样式**

替换旧菜单相关 CSS，核心约束为：

```css
.pet-menu {
	width: min(248px, calc(100vw - 16px));
	padding: 8px;
	border-radius: 14px;
}
.pet-pet-strip {
	display: flex;
	gap: 4px;
	overflow-x: auto;
	scrollbar-width: none;
}
.pet-item {
	width: 42px;
	min-width: 42px;
	min-height: 64px;
	padding: 4px 2px;
	gap: 2px;
}
.pet-item-img,
.pet-item-placeholder {
	width: 38px;
	height: 44px;
	border-radius: 9px;
}
.pet-item-name {
	max-width: 40px;
	font-size: 0.56rem;
}
.pet-primary-action {
	width: 100%;
	min-height: 27px;
	margin-top: 6px;
	border-radius: 8px;
}
.pet-load-status {
	position: fixed;
	left: 62px;
	bottom: 286px;
	padding: 5px 9px;
	border-radius: 999px;
	font-size: 0.68rem;
	pointer-events: none;
}
```

补齐浅色/暗色样式、横向滚动条隐藏、缩小屏幕位置和 `prefers-reduced-motion` 规则；给新增 `.pet-load-status`、`.pet-primary-action` 添加动画禁用规则。

- [ ] **Step 4: 隐藏库的加载状态但保留休息唤醒状态**

在组件 style 中加入全局选择器：

```css
:global(.pet-native-status-loading) {
	display: none !important;
}
```

只在 `loadStatus` 对应初始化/切换期间给库状态条加该 class；模型完成加载后移除 class，让休息状态条继续提供唤醒入口。

### Task 4: 生成并接入三张真实模型缩略图

**Files:**
- Create: `public/pets/avatars/senko.webp`
- Create: `public/pets/avatars/tororo.webp`
- Create: `public/pets/avatars/hijiki.webp`
- Modify: `public/pets/manifest.json`
- Delete: `public/pets/avatars/senko.svg`
- Delete: `public/pets/avatars/tororo.svg`
- Delete: `public/pets/avatars/hijiki.svg`

- [ ] **Step 1: 在临时干净预览页渲染三种真实模型**

使用临时预览页加载 manifest 中的 Senko、Tororo、Hijiki 模型；预览页只保留透明 canvas 和一个模型，避免站点布局、背景和全局 CSS 污染截图。分别截取角色完整正面/半身帧，主体不裁耳朵、头发或身体轮廓。

- [ ] **Step 2: 统一导出透明 WebP**

将三张截图统一处理为 `240x320`、透明背景、`contain` 视觉比例的 WebP；使用 `sips` 或项目已有的 `sharp` 处理，不重新绘制角色。检查：

```bash
file public/pets/avatars/senko.webp public/pets/avatars/tororo.webp public/pets/avatars/hijiki.webp
```

Expected: 三个文件均为有效 WebP，带 alpha，单个文件小于 200 KB。

- [ ] **Step 3: 更新 manifest 并删除旧 SVG**

将三个 avatar 改为对应 WebP 路径，确认没有其他引用后删除旧 SVG。运行：

```bash
rg -n "senko\.svg|tororo\.svg|hijiki\.svg" public src
```

Expected: 无结果。

### Task 5: 自动检查与浏览器验收

**Files:**
- Verify: `src/components/fun/PetCompanion.svelte`, `src/scripts/pet-actions.mjs`, `scripts/test/pet-actions.test.mjs`, `public/pets/manifest.json`, `public/pets/avatars/*.webp`

- [ ] **Step 1: 运行动作单测和完整测试**

```bash
node --test scripts/test/pet-actions.test.mjs
pnpm test
```

Expected: 单测 7 个 PASS，完整测试无失败。

- [ ] **Step 2: 运行静态检查和生产构建**

```bash
pnpm check
pnpm build
```

Expected: `pnpm check` 0 errors；构建成功。允许保留项目已有的非阻塞 warning。

- [ ] **Step 3: 进行浏览器视觉验收**

启动 `pnpm dev -- --host 127.0.0.1`，检查：

1. 初次加载显示小型横向“正在准备”胶囊，不显示左侧竖向加载条；加载完成后胶囊消失。
2. 右键宠物打开约 248px 宽菜单，五张缩略图一排显示，窄屏可横向滚动。
3. 切换到 Pio、静香或狐娘时，若存在可用动作，只显示一个主要动作入口并播放真实动作；聊天和大互动区域不存在。
4. 切换到黑猫/白猫时，不显示无效动作按钮。
5. 点击隐藏后仍能通过休息状态条唤醒，暗色模式和窄屏布局不破坏。

- [ ] **Step 4: 提交实现**

```bash
git add src/components/fun/PetCompanion.svelte src/scripts/pet-actions.mjs scripts/test/pet-actions.test.mjs public/pets/manifest.json public/pets/avatars docs/superpowers/specs/2026-08-07-pet-menu-compact-design.md docs/superpowers/plans/2026-08-07-pet-menu-compact.md
git commit -m "feat(pet): compact context menu and loading state"
```

