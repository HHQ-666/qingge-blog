<script>
	import { onDestroy, onMount } from "svelte";
	import { getAvailableActionEntries } from "../../scripts/pet-actions.mjs";

	export let petConfig;

	let pets = [];
	let widget = null;
	let canvas = null;
	let ready = false;
	let menuOpen = false;
	let petHidden = false;
	let currentIdx = 0;
	let pendingInitialIdx = 0;
	let actionEntries = [];
	let loadStatus = "正在准备";
	let nativeStatusBar = null;
	let bubble = "";
	let staticAction = "";
	let bubbleTimer;
	let staticActionTimer;
	let pressTimer;
	let menuEl;
	let menuX = 0;
	let menuY = 0;
	let cleanupCanvasEvents = () => {};
	let loadTimer;
	let loadError = false;
	let switchInFlight = false;
	const MODEL_LOAD_TIMEOUT = 15000;
	const PET_MENU_WIDTH = 184;
	const PET_MENU_HEIGHT = 82;
	const preloadedModels = new Map();
	let mounted = true;

	function clearLoadTimer() {
		clearTimeout(loadTimer);
		loadTimer = undefined;
	}

	function showLoadError(message = "加载失败 · 点此选择") {
		clearLoadTimer();
		loadError = true;
		ready = false;
		loadStatus = message;
		setNativeStatusLoading(false);
		setCanvasVisible(false);
	}

	function startLoadWatch(status) {
		clearLoadTimer();
		loadError = false;
		loadStatus = status;
		setNativeStatusLoading(true);
		loadTimer = setTimeout(() => {
			if (!mounted || ready) return;
			showLoadError("加载超时 · 点此选择");
		}, MODEL_LOAD_TIMEOUT);
	}

	function setNativeStatusLoading(isLoading) {
		if (!nativeStatusBar) return;
		nativeStatusBar.classList.toggle("pet-native-status-loading", isLoading);
	}

	function isStaticPet(pet) {
		return pet?.renderMode === "image";
	}

	function setCanvasVisible(isVisible) {
		if (!canvas) return;
		canvas.style.visibility = isVisible ? "visible" : "hidden";
		canvas.style.pointerEvents = isVisible ? "auto" : "none";
	}

	function getPreloadAssetPaths(config, pet) {
		const fileReferences = config?.FileReferences ?? {};
		const paths = [
			fileReferences.Moc,
			...(fileReferences.Textures ?? []),
			fileReferences.Physics,
			fileReferences.Pose,
			fileReferences.UserData,
			config?.model,
			...(pet?.actions ? Object.values(pet.actions).flatMap((action) => [action?.file, action?.expression]) : []),
		];
		return [...new Set(paths.filter((path) => typeof path === "string" && path.length > 0))];
	}

	function preloadModel(pet) {
		if (!pet?.model || isStaticPet(pet)) return Promise.resolve();
		const existing = preloadedModels.get(pet.model);
		if (existing) return existing;
		const preload = fetch(pet.model, { cache: "force-cache", priority: "low" })
			.then(async (response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const config = await response.json();
				await Promise.all(
					getPreloadAssetPaths(config, pet).map((assetPath) => {
						try {
							return fetch(new URL(assetPath, pet.model).href, {
								cache: "force-cache",
								priority: "low",
							}).catch(() => null);
						} catch {
							return null;
						}
					}),
				);
			})
			.catch((error) => {
				preloadedModels.delete(pet.model);
				return null;
			});
		preloadedModels.set(pet.model, preload);
		return preload;
	}

	function showBubble(message) {
		clearTimeout(bubbleTimer);
		bubble = message;
		bubbleTimer = setTimeout(() => {
			bubble = "";
		}, 3200);
	}

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
			return;
		}
		if (isStaticPet(pets[currentIdx])) {
			actionEntries = Object.entries(pets[currentIdx].actions ?? {}).map(([id, action]) => ({
				id,
				label: action.label,
				message: action.message,
			}));
			return;
		}
		const availableMotions = widget.l2d.getMotions();
		actionEntries = getAvailableActionEntries(pets[currentIdx], availableMotions);
	}

	function handleModelLoaded() {
		if (!mounted || !widget || !pets[currentIdx]) return;
		clearLoadTimer();
		loadError = false;
		if (pendingInitialIdx > 0) {
			const targetIdx = pendingInitialIdx;
			pendingInitialIdx = 0;
			void switchTo(targetIdx);
			return;
		}
		ready = true;
		petHidden = false;
		loadStatus = "";
		setNativeStatusLoading(false);
		setCanvasVisible(true);
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
		if (!widget || idx === currentIdx || !pets[idx] || switchInFlight) return;
		switchInFlight = true;
		menuOpen = false;
		ready = false;
		startLoadWatch("切换中");
		const previousIdx = currentIdx;
		currentIdx = idx;
		petHidden = false;
		staticAction = "";
		clearTimeout(staticActionTimer);
		if (isStaticPet(pets[idx])) {
			clearLoadTimer();
			loadError = false;
			setCanvasVisible(false);
			ready = true;
			loadStatus = "";
			setNativeStatusLoading(false);
			refreshActionEntries();
			showBubble(`${pets[currentIdx].name}先用轻盈模式陪你~`);
			switchInFlight = false;
			return;
		}
		setCanvasVisible(false);
		void preloadModel(pets[idx]);
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
			clearLoadTimer();
			console.warn("[pet] model switch failed", error);
			try {
				await widget.switchModel(previousIdx);
				bindL2dEvents();
				syncCanvasEvents();
				if (Object.keys(widget.l2d.getMotions()).length === 0) {
					throw new Error("previous model has no loaded motions");
				}
				currentIdx = previousIdx;
				handleModelLoaded();
				showBubble("这个形象暂时加载失败,先陪我一会儿吧~");
			} catch (restoreError) {
				console.warn("[pet] previous model restore failed", restoreError);
				currentIdx = previousIdx;
				showLoadError("加载失败 · 点此选择");
			}
		} finally {
			switchInFlight = false;
		}
	}

	function playAction(action) {
		if (!ready || !action) return;
		if (isStaticPet(pets[currentIdx])) {
			clearTimeout(staticActionTimer);
			staticAction = action.id;
			staticActionTimer = setTimeout(() => {
				staticAction = "";
			}, 900);
			showBubble(action.message ?? `${pets[currentIdx].name}:${action.label}~`);
			menuOpen = false;
			return;
		}
		if (!widget) return;
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
					size: { width: 260, height: 290 },
					primaryColor: "rgba(232,163,92,0.92)",
					transitionDuration: 180,
					transitionType: "fade",
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
				setCanvasVisible(false);
				nativeStatusBar = [...document.body.children].find(
					(element) => element.style.zIndex === "9998",
				) ?? null;
				startLoadWatch("正在准备");
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
		clearTimeout(staticActionTimer);
		clearLoadTimer();
		cleanupCanvasEvents();
		window.removeEventListener("pointerdown", onWindowPointerDown);
		window.removeEventListener("keydown", onKeydown);
		void widget?.destroy();
	});
</script>

{#if loadStatus}
	{#if loadError}
		<button
			type="button"
			class="pet-load-status pet-load-status-button"
			aria-label="打开宠物菜单"
			on:click={(event) => openMenuAt(event.clientX, event.clientY)}
		>
			<span aria-hidden="true">!</span>
			{loadStatus}
		</button>
	{:else}
		<div class="pet-load-status" aria-live="polite">
			<span class="pet-load-spinner" aria-hidden="true"></span>
			{loadStatus}
		</div>
	{/if}
{/if}

{#if bubble}
	<div class="pet-bubble" aria-live="polite">{bubble}</div>
{/if}

{#if ready && !petHidden && isStaticPet(pets[currentIdx])}
	<button
		type="button"
		class="pet-static-stage"
		class:is-cute={staticAction === "cute" || staticAction === "tease"}
		class:is-dancing={staticAction === "dance"}
		aria-label={`和${pets[currentIdx].name}互动`}
		on:click={playCuteAction}
		on:contextmenu={(event) => {
			event.preventDefault();
			openMenuAt(event.clientX, event.clientY);
		}}
	>
		<img src={pets[currentIdx].avatar} alt={pets[currentIdx].name} class="pet-static-img" />
	</button>
{/if}

{#if ready && petHidden && isStaticPet(pets[currentIdx])}
	<button type="button" class="pet-static-wake" on:click={() => (petHidden = false)}>显示仙狐</button>
{/if}

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

<style>
	.pet-load-status {
		position: fixed;
		left: 12px;
		bottom: 12px;
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
	.pet-load-status-button {
		border-color: rgba(232, 163, 92, 0.35);
		color: #9a6a2f;
		cursor: pointer;
		pointer-events: auto;
	}
	.pet-load-status-button:hover,
	.pet-load-status-button:focus-visible {
		background: rgba(255, 250, 240, 0.98);
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
		bottom: 264px;
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
	.pet-static-stage {
		position: fixed;
		left: 0;
		bottom: 0;
		z-index: 9999;
		display: grid;
		width: 260px;
		height: 290px;
		align-items: end;
		justify-items: center;
		padding: 0 0 4px;
		border: 0;
		background: transparent;
		cursor: pointer;
		pointer-events: auto;
	}
	.pet-static-img {
		display: block;
		width: 154px;
		height: 194px;
		object-fit: contain;
		filter: drop-shadow(0 8px 8px rgba(31, 38, 47, 0.16));
		transform-origin: 50% 100%;
		animation: pet-static-idle 2.8s ease-in-out infinite;
	}
	.pet-static-wake {
		position: fixed;
		left: 8px;
		bottom: 8px;
		z-index: 9998;
		padding: 5px 8px;
		border: 1px solid rgba(255, 255, 255, 0.72);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.88);
		box-shadow: 0 6px 16px rgba(31, 38, 47, 0.14);
		color: #666;
		font-size: 0.64rem;
		cursor: pointer;
	}
	.pet-static-stage.is-cute .pet-static-img {
		animation: pet-static-cute 0.9s ease-in-out both;
	}
	.pet-static-stage.is-dancing .pet-static-img {
		animation: pet-static-dance 0.9s ease-in-out both;
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
	:root.dark .pet-bubble,
	:root.dark .pet-menu {
		border-color: rgba(255, 255, 255, 0.14);
		background: rgba(32, 32, 36, 0.88);
		color: #ddd;
	}
	:root.dark .pet-menu {
		--pet-accent: #b4a1ff;
	}
	:root.dark .pet-bubble::after {
		background: rgba(32, 32, 36, 0.9);
	}
	:root.dark .pet-load-status,
	:root.dark .pet-static-wake,
	:root.dark .pet-item {
		border-color: rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.08);
		color: #ccc;
	}
	:root.dark .pet-item.is-active,
	:root.dark .pet-item:hover,
	:root.dark .pet-item:focus-visible {
		background: rgba(118, 95, 190, 0.34);
		color: #fff;
	}
	:root.dark .pet-item.is-active {
		border-color: var(--pet-accent);
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
	@keyframes pet-static-idle {
		0%,
		100% {
			transform: translateY(0) rotate(-1deg) scale(0.99);
		}
		50% {
			transform: translateY(-6px) rotate(1deg) scale(1.01);
		}
	}
	@keyframes pet-static-cute {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
		}
		35% {
			transform: scale(1.06) rotate(-4deg);
		}
		70% {
			transform: scale(1.04) rotate(4deg);
		}
	}
	@keyframes pet-static-dance {
		0%,
		100% {
			transform: translateX(0) rotate(0deg);
		}
		25% {
			transform: translateX(-10px) rotate(-7deg);
		}
		75% {
			transform: translateX(10px) rotate(7deg);
		}
	}
	@media (max-width: 520px) {
		.pet-bubble {
			left: 50px;
			bottom: 228px;
		}
		.pet-static-stage {
			width: 220px;
			height: 250px;
		}
		.pet-static-img {
			width: 132px;
			height: 166px;
		}
		.pet-load-status {
			left: 8px;
			bottom: 8px;
		}
		.pet-menu {
			width: min(184px, calc(100vw - 16px));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pet-bubble,
		.pet-load-status,
		.pet-static-img,
		.pet-menu,
		.pet-item,
		.pet-load-spinner {
			animation: none !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
