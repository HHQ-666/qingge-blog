<script>
	import { onDestroy, onMount } from "svelte";
	import {
		getAvailableActionEntries,
		getPrimaryActionEntry,
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
	let primaryAction = null;
	let loadStatus = "正在准备";
	let nativeStatusBar = null;
	let bubble = "";
	let bubbleTimer;
	let pressTimer;
	let menuEl;
	let menuX = 0;
	let menuY = 0;
	let cleanupCanvasEvents = () => {};
	let mounted = true;

	function setNativeStatusLoading(isLoading) {
		if (!nativeStatusBar) return;
		nativeStatusBar.classList.toggle("pet-native-status-loading", isLoading);
	}

	function showBubble(message) {
		clearTimeout(bubbleTimer);
		bubble = message;
		bubbleTimer = setTimeout(() => {
			bubble = "";
		}, 3200);
	}

	function openMenuAt(x, y) {
		menuX = Math.max(8, Math.min(x, window.innerWidth - 256));
		menuY = Math.max(8, Math.min(y + 8, window.innerHeight - 180));
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
		if (menuEl?.contains(event.target)) return;
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
			primaryAction = null;
			return;
		}
		const availableMotions = widget.l2d.getMotions();
		actionEntries = getAvailableActionEntries(pets[currentIdx], availableMotions);
		primaryAction = getPrimaryActionEntry(pets[currentIdx], availableMotions);
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
		loadStatus = "";
		setNativeStatusLoading(false);
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
		loadStatus = "切换中";
		setNativeStatusLoading(true);
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
			loadStatus = "";
			setNativeStatusLoading(false);
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
				loadStatus = "";
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
				nativeStatusBar = [...document.body.children].find(
					(element) => element.style.zIndex === "9998",
				) ?? null;
				setNativeStatusLoading(true);
			} catch (error) {
				console.warn("[pet] l2d-widget 初始化失败,功能已静默关闭", error);
				loadStatus = "";
				setNativeStatusLoading(false);
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

{#if loadStatus}
	<div class="pet-load-status" aria-live="polite">
		<span class="pet-load-spinner" aria-hidden="true"></span>
		{loadStatus}
	</div>
{/if}

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
		<div class="pet-menu-head">
			<div class="pet-menu-title">{pets[currentIdx]?.name ?? "伙伴"}</div>
			<button
				type="button"
				class="pet-hide-button"
				role="menuitem"
				on:click={hidePet}
				aria-label="隐藏宠物"
			>
				×
			</button>
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
			<button
				type="button"
				class="pet-primary-action"
				role="menuitem"
				on:click={() => playAction(primaryAction)}
			>
				✨ {primaryAction.label}
			</button>
		{/if}
	</div>
{/if}

<style>
	.pet-load-status {
		position: fixed;
		left: 62px;
		bottom: 286px;
		z-index: 10002;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 9px;
		border: 1px solid rgba(255, 255, 255, 0.72);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.94);
		box-shadow: 0 8px 20px rgba(31, 38, 47, 0.14);
		color: #666;
		font-size: 0.68rem;
		line-height: 1;
		pointer-events: none;
		animation: pet-status-in 0.2s ease-out both;
	}
	.pet-load-spinner {
		width: 9px;
		height: 9px;
		border: 1.5px solid rgba(232, 163, 92, 0.28);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: pet-spin 0.75s linear infinite;
	}
	:global(.pet-native-status-loading) {
		display: none !important;
	}
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
		width: min(248px, calc(100vw - 16px));
		padding: 8px;
		border: 1px solid rgba(255, 255, 255, 0.65);
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		box-shadow: 0 12px 32px rgba(31, 38, 47, 0.18);
		color: #555;
		animation: pet-menu-in 0.18s ease-out both;
	}
	.pet-menu-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 0 2px 6px 4px;
	}
	.pet-menu-title {
		color: #333;
		font-size: 0.76rem;
		font-weight: 700;
	}
	.pet-hide-button {
		width: 22px;
		height: 22px;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: #999;
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.pet-hide-button:hover,
	.pet-hide-button:focus-visible {
		background: rgba(0, 0, 0, 0.06);
		color: #555;
	}
	.pet-pet-strip {
		display: flex;
		gap: 4px;
		overflow-x: auto;
		padding: 1px 1px 3px;
		scrollbar-width: none;
	}
	.pet-pet-strip::-webkit-scrollbar {
		display: none;
	}
	.pet-item {
		position: relative;
		display: flex;
		width: 42px;
		min-width: 42px;
		min-height: 64px;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 2px;
		padding: 4px 2px;
		border: 1px solid transparent;
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.56);
		color: #666;
		font-size: 0.56rem;
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
		width: 38px;
		height: 44px;
		flex-shrink: 0;
		border-radius: 9px;
		background: rgba(242, 238, 232, 0.72);
		object-fit: contain;
	}
	.pet-item-placeholder {
		display: grid;
		place-items: center;
		font-size: 1rem;
	}
	.pet-item-name {
		max-width: 40px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pet-check {
		position: absolute;
		top: 1px;
		right: 2px;
		color: var(--primary);
		font-size: 0.62rem;
		font-weight: 700;
	}
	.pet-primary-action {
		width: 100%;
		min-height: 27px;
		margin-top: 6px;
		padding: 4px 6px;
		border: 1px solid rgba(0, 0, 0, 0.05);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.62);
		color: #555;
		font-size: 0.64rem;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.15s ease;
	}
	.pet-primary-action:hover,
	.pet-primary-action:focus-visible {
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
	:root.dark .pet-load-status,
	:root.dark .pet-item,
	:root.dark .pet-hide-button,
	:root.dark .pet-primary-action {
		border-color: rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.08);
		color: #ccc;
	}
	:root.dark .pet-item.is-active,
	:root.dark .pet-item:hover,
	:root.dark .pet-hide-button:hover,
	:root.dark .pet-primary-action:hover,
	:root.dark .pet-primary-action:focus-visible {
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
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
	@keyframes pet-status-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes pet-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 520px) {
		.pet-bubble {
			left: 50px;
			bottom: 258px;
		}
		.pet-load-status {
			left: 52px;
			bottom: 246px;
		}
		.pet-menu {
			width: min(250px, calc(100vw - 16px));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pet-bubble,
		.pet-load-status,
		.pet-menu,
		.pet-item,
		.pet-primary-action,
		.pet-load-spinner {
			animation: none !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
