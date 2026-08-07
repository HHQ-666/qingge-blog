<script>
	import { onDestroy, onMount } from "svelte";
	import {
		getAvailableActionEntries,
		pickRandomMotion,
	} from "../../scripts/pet-actions.mjs";

	export let petConfig;

	let pets = [];
	let widget = null;
	let canvas = null;
	let ready = false;
	let menuOpen = false;
	let currentIdx = 0;
	let pendingInitialIdx = 0;
	let actionEntries = [];
	let bubble = "";
	let bubbleTimer;
	let pressTimer;
	let menuEl;
	let menuX = 0;
	let menuY = 0;
	let cleanupCanvasEvents = () => {};
	let mounted = true;

	const BUBBLE_FALLBACK = [
		"啾——你戳到我啦!",
		"今天也要元气满满哦~",
		"休息一下,再继续写代码吧~",
	];

	function showBubble(message) {
		clearTimeout(bubbleTimer);
		bubble = message;
		bubbleTimer = setTimeout(() => {
			bubble = "";
		}, 3200);
	}

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

	function onWindowPointerDown(event) {
		if (!menuOpen || event.button === 2) return;
		if (menuEl && menuEl.contains(event.target)) return;
		menuOpen = false;
	}

	function onKeydown(event) {
		if (event.key === "Escape") menuOpen = false;
	}

	function bindCanvasEvents(target) {
		const onPointerDown = (event) => {
			if (event.button === 2) event.stopPropagation();
		};
		const onContextMenu = (event) => {
			event.preventDefault();
			event.stopPropagation();
			openMenuAt(event.clientX, event.clientY);
		};
		const onTouchStart = (event) => {
			const touch = event.touches[0];
			if (!touch) return;
			clearTimeout(pressTimer);
			pressTimer = setTimeout(() => openMenuAt(touch.clientX, touch.clientY), 450);
		};
		const cancelLongPress = () => clearTimeout(pressTimer);

		target.addEventListener("pointerdown", onPointerDown, true);
		target.addEventListener("contextmenu", onContextMenu);
		target.addEventListener("touchstart", onTouchStart, { passive: true });
		target.addEventListener("touchend", cancelLongPress);
		target.addEventListener("touchmove", cancelLongPress);

		return () => {
			target.removeEventListener("pointerdown", onPointerDown, true);
			target.removeEventListener("contextmenu", onContextMenu);
			target.removeEventListener("touchstart", onTouchStart);
			target.removeEventListener("touchend", cancelLongPress);
			target.removeEventListener("touchmove", cancelLongPress);
			clearTimeout(pressTimer);
		};
	}

	function refreshActionEntries() {
		if (!widget || !pets[currentIdx]) {
			actionEntries = [];
			return;
		}
		actionEntries = getAvailableActionEntries(
			pets[currentIdx],
			widget.l2d.getMotions(),
		);
	}

	function handleModelLoaded() {
		if (!mounted || !widget || !pets[currentIdx]) return;
		if (pendingInitialIdx > 0) {
			const targetIdx = pendingInitialIdx;
			pendingInitialIdx = 0;
			void switchTo(targetIdx);
			return;
		}
		ready = true;
		refreshActionEntries();
		showBubble(`欢迎来到小屋,${pets[currentIdx].name}来啦~`);
	}

	function bindL2dEvents() {
		const l2d = widget?.l2d;
		if (!l2d) return;
		l2d.on("loaded", handleModelLoaded);
		l2d.on("tap", playCuteAction);
	}

	function syncCanvasEvents() {
		cleanupCanvasEvents();
		canvas = widget?.l2d?.getCanvas() ?? null;
		if (canvas) cleanupCanvasEvents = bindCanvasEvents(canvas);
	}

	async function switchTo(idx) {
		if (!widget || idx === currentIdx || !pets[idx]) return;
		menuOpen = false;
		ready = false;
		const previousIdx = currentIdx;
		currentIdx = idx;
		try {
			await widget.switchModel(idx);
			bindL2dEvents();
			syncCanvasEvents();
			if (Object.keys(widget.l2d.getMotions()).length === 0) {
				throw new Error("model has no loaded motions");
			}
			handleModelLoaded();
			refreshActionEntries();
		} catch (error) {
			currentIdx = previousIdx;
			ready = true;
			refreshActionEntries();
			showBubble("这个形象暂时加载失败,先陪我一会儿吧~");
			console.warn("[pet] model switch failed", error);
		}
	}

	function playAction(action) {
		if (!widget || !ready || !action) return;
		if (action.file) widget.l2d.playMotionByFile(action.file, 2);
		else widget.l2d.playMotion(action.group, action.index, 2);
		if (action.expression) widget.l2d.setExpression(action.expression);
		showBubble(action.message ?? `${pets[currentIdx].name}:${action.label}~`);
		menuOpen = false;
	}

	function playCuteAction() {
		const action = actionEntries.find((item) => item.id === "cute") ?? actionEntries[0];
		if (action) playAction(action);
	}

	function playRandomAction() {
		if (!widget || !ready) return;
		const motion = pickRandomMotion(widget.l2d.getMotions());
		if (!motion) {
			showBubble("这个形象还没有配置额外动作哦~");
			menuOpen = false;
			return;
		}
		widget.l2d.playMotion(motion.group, motion.index, 2);
		showBubble("随机卖个萌给你看~");
		menuOpen = false;
	}

	function sayRandom() {
		const messages = pets[currentIdx]?.quotes?.length
			? pets[currentIdx].quotes
			: BUBBLE_FALLBACK;
		showBubble(messages[Math.floor(Math.random() * messages.length)]);
		menuOpen = false;
	}

	function hidePet() {
		menuOpen = false;
		widget?.sleep();
	}

	onMount(() => {
		window.addEventListener("pointerdown", onWindowPointerDown);
		window.addEventListener("keydown", onKeydown);

		(async () => {
			try {
				const res = await fetch("/pets/manifest.json");
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				if (!Array.isArray(data?.pets) || data.pets.length === 0) {
					throw new Error("manifest pets is empty");
				}
				pets = data.pets.filter((pet) => pet?.id && pet?.name && pet?.model);
				if (pets.length === 0) throw new Error("manifest pets has no valid models");
			} catch (error) {
				console.warn("[pet] manifest 加载失败,功能已静默关闭", error);
				return;
			}

			if (!mounted) return;
			try {
				const { createWidget } = await import("l2d-widget");
				if (!mounted) return;

				const defaultIndex = pets.findIndex((pet) => pet.id === petConfig?.defaultPet);
				pendingInitialIdx = defaultIndex > 0 ? defaultIndex : 0;
				currentIdx = 0;

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
							padding: "6px 12px",
						},
					},
					model: pets.map((pet) => ({
						path: pet.model,
						scale: pet.scale ?? 1,
						volume: 0,
						tips: false,
					})),
				});

				bindL2dEvents();
				syncCanvasEvents();
			} catch (error) {
				console.warn("[pet] l2d-widget 初始化失败,功能已静默关闭", error);
			}
		})();
	});

	onDestroy(() => {
		mounted = false;
		menuOpen = false;
		clearTimeout(pressTimer);
		clearTimeout(bubbleTimer);
		cleanupCanvasEvents();
		window.removeEventListener("pointerdown", onWindowPointerDown);
		window.removeEventListener("keydown", onKeydown);
		void widget?.destroy();
	});
</script>

{#if bubble}
	<div class="pet-bubble" aria-live="polite">{bubble}</div>
{/if}

{#if menuOpen}
	<div
		class="pet-menu"
		style={`left:${menuX}px;top:${menuY}px`}
		bind:this={menuEl}
		role="menu"
		aria-label="宠物功能菜单"
	>
		<div class="pet-menu-title">{pets[currentIdx]?.name ?? "伙伴"}</div>
		<div class="pet-menu-label">切换形象</div>
		<div class="pet-pet-grid">
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
					<span class="pet-item-name">{pet.name}</span>
					{#if currentIdx === i}<span class="pet-check">✓</span>{/if}
				</button>
			{/each}
		</div>
		<div class="pet-menu-divider"></div>
		<div class="pet-menu-label">互动</div>
		<div class="pet-menu-actions">
			<button type="button" role="menuitem" on:click={sayRandom}>💬 聊天</button>
			{#each actionEntries as action (action.id)}
				<button type="button" role="menuitem" on:click={() => playAction(action)}>
					✨ {action.label}
				</button>
			{/each}
			<button type="button" role="menuitem" on:click={playRandomAction}>🎲 随机动作</button>
			<button type="button" role="menuitem" on:click={hidePet}>🙈 隐藏</button>
		</div>
	</div>
{/if}

<style>
	.pet-bubble {
		position: fixed;
		left: 58px;
		bottom: 304px;
		z-index: 10001;
		max-width: 180px;
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.72);
		border-radius: 13px;
		background: rgba(255, 255, 255, 0.94);
		box-shadow: 0 8px 22px rgba(31, 38, 47, 0.14);
		color: #555;
		font-size: 12px;
		line-height: 1.5;
		word-break: break-word;
		pointer-events: none;
		animation: pet-bubble-in 0.25s ease-out both;
	}
	.pet-bubble::after {
		content: "";
		position: absolute;
		left: 18px;
		bottom: -5px;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.94);
		transform: rotate(45deg);
	}
	.pet-menu {
		position: fixed;
		z-index: 10000;
		width: min(320px, calc(100vw - 16px));
		max-height: min(620px, calc(100vh - 16px));
		overflow-y: auto;
		padding: 10px;
		border: 1px solid rgba(255, 255, 255, 0.65);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		box-shadow: 0 12px 32px rgba(31, 38, 47, 0.18);
		color: #555;
		animation: pet-menu-in 0.18s ease-out both;
	}
	.pet-menu-title {
		padding: 0 4px 4px;
		color: #333;
		font-size: 0.82rem;
		font-weight: 700;
	}
	.pet-menu-label {
		padding: 3px 4px;
		color: #999;
		font-size: 0.64rem;
	}
	.pet-pet-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
	}
	.pet-item {
		position: relative;
		display: flex;
		min-width: 0;
		min-height: 116px;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 3px;
		padding: 7px 5px 5px;
		border: 1px solid transparent;
		border-radius: 11px;
		background: rgba(255, 255, 255, 0.56);
		color: #666;
		font-size: 0.64rem;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
	}
	.pet-item:hover {
		background: rgba(255, 255, 255, 0.95);
		transform: translateY(-1px);
	}
	.pet-item.is-active {
		border-color: var(--primary);
		background: rgba(255, 255, 255, 0.96);
		color: #333;
		font-weight: 600;
	}
	.pet-item-img,
	.pet-item-placeholder {
		width: 68px;
		height: 82px;
		flex-shrink: 0;
		border-radius: 13px;
		background: rgba(242, 238, 232, 0.72);
		object-fit: contain;
	}
	.pet-item-placeholder {
		display: grid;
		place-items: center;
		font-size: 1rem;
	}
	.pet-item-name {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pet-check {
		position: absolute;
		top: 3px;
		right: 5px;
		color: var(--primary);
		font-weight: 700;
	}
	.pet-menu-divider {
		height: 1px;
		margin: 7px 2px 4px;
		background: rgba(0, 0, 0, 0.07);
	}
	.pet-menu-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 5px;
	}
	.pet-menu-actions button {
		min-height: 30px;
		padding: 5px 6px;
		border: 1px solid rgba(0, 0, 0, 0.05);
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.62);
		color: #555;
		font-size: 0.68rem;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.15s ease;
	}
	.pet-menu-actions button:hover {
		background: rgba(255, 255, 255, 0.96);
		transform: translateY(-1px);
	}
	:root.dark .pet-bubble,
	:root.dark .pet-menu {
		border-color: rgba(255, 255, 255, 0.14);
		background: rgba(32, 32, 36, 0.9);
		color: #ddd;
	}
	:root.dark .pet-bubble::after {
		background: rgba(32, 32, 36, 0.9);
	}
	:root.dark .pet-menu-title {
		color: #f0f0f0;
	}
	:root.dark .pet-item,
	:root.dark .pet-menu-actions button {
		border-color: rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.08);
		color: #ccc;
	}
	:root.dark .pet-item.is-active,
	:root.dark .pet-item:hover,
	:root.dark .pet-menu-actions button:hover {
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
	}
	:root.dark .pet-menu-divider {
		background: rgba(255, 255, 255, 0.1);
	}
	@keyframes pet-bubble-in {
		from {
			opacity: 0;
			transform: translateY(7px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	@keyframes pet-menu-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	@media (max-width: 520px) {
		.pet-bubble {
			left: 50px;
			bottom: 258px;
		}
		.pet-menu {
			width: min(250px, calc(100vw - 16px));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pet-bubble,
		.pet-menu,
		.pet-item,
		.pet-menu-actions button {
			animation: none !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
