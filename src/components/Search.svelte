<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import Icon from "@iconify/svelte";
	import { url } from "@utils/url-utils.ts";
	import { onMount } from "svelte";
	import type { SearchResult } from "@/global";

	let keyword = "";
	let result: SearchResult[] = [];
	let isSearching = false;
	let pagefindLoaded = false;
	let initialized = false;
	let panelOpen = false;
	let hasSearched = false;
	let searchFailed = false;
	let searchSequence = 0;

	const fakeResult: SearchResult[] = [
		{
			url: url("/"),
			meta: {
				title: "This Is a Fake Search Result",
			},
			excerpt:
				"Because the search cannot work in the <mark>dev</mark> environment.",
		},
		{
			url: url("/"),
			meta: {
				title: "If You Want to Test the Search",
			},
			excerpt: "Try running <mark>npm build && npm preview</mark> instead.",
		},
	];

	function resetResults() {
		searchSequence += 1;
		result = [];
		isSearching = false;
		hasSearched = false;
		searchFailed = false;
	}

	function clearSearch() {
		keyword = "";
		panelOpen = false;
		resetResults();
	}

	function handleInput() {
		panelOpen = true;
		if (!keyword.trim()) resetResults();
	}

	function togglePanel() {
		panelOpen = !panelOpen;
		if (panelOpen) {
			requestAnimationFrame(() => {
				document.getElementById("search-input-mobile")?.focus();
			});
		}
	}

	async function search(keyword: string): Promise<void> {
		const normalizedKeyword = keyword.trim();
		if (!normalizedKeyword || !initialized) return;

		const request = ++searchSequence;
		panelOpen = true;
		isSearching = true;
		searchFailed = false;
		hasSearched = false;

		try {
			let searchResults: SearchResult[] = [];

			if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
				const response = await window.pagefind.search(normalizedKeyword);
				searchResults = await Promise.all(
					response.results.map((item) => item.data()),
				);
			} else if (import.meta.env.DEV) {
				searchResults = fakeResult;
			} else {
				throw new Error("Pagefind is not available");
			}

			if (request !== searchSequence) return;
			result = searchResults;
			hasSearched = true;
		} catch (error) {
			if (request !== searchSequence) return;
			console.error("Search error:", error);
			result = [];
			searchFailed = true;
			hasSearched = true;
		} finally {
			if (request === searchSequence) isSearching = false;
		}
	}

	onMount(() => {
		let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

		const initializeSearch = () => {
			initialized = true;
			pagefindLoaded =
				typeof window !== "undefined" &&
				!!window.pagefind &&
				typeof window.pagefind.search === "function";
			if (keyword) void search(keyword);
		};

		const onPagefindReady = () => initializeSearch();
		const onPagefindError = () => initializeSearch();
		const onDocumentPointerDown = (event: PointerEvent) => {
			if (!panelOpen) return;
			const target = event.target;
			if (!(target instanceof Node)) return;
			const panel = document.getElementById("search-panel");
			const desktopBar = document.getElementById("search-bar");
			const mobileButton = document.getElementById("search-switch");
			if (
				!panel?.contains(target) &&
				!desktopBar?.contains(target) &&
				!mobileButton?.contains(target)
			) {
				panelOpen = false;
			}
		};
		const onDocumentKeydown = (event: KeyboardEvent) => {
			if (event.key !== "Escape" || !panelOpen) return;
			panelOpen = false;
			if (window.matchMedia("(max-width: 1023px)").matches) {
				document.getElementById("search-switch")?.focus();
			}
		};
		const onNavigationClick = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const link = target.closest<HTMLAnchorElement>("a[href]");
			if (!link || link.target === "_blank") return;
			try {
				const destination = new URL(link.href, window.location.href);
				if (
					destination.origin === window.location.origin &&
					destination.pathname !== window.location.pathname
				) clearSearch();
			} catch {
				// Ignore invalid or non-navigation href values.
			}
		};

		if (import.meta.env.DEV) {
			initializeSearch();
		} else {
			document.addEventListener("pagefindready", onPagefindReady);
			document.addEventListener("pagefindloaderror", onPagefindError);
			fallbackTimer = setTimeout(initializeSearch, 2000);
		}

		document.addEventListener("pointerdown", onDocumentPointerDown);
		document.addEventListener("keydown", onDocumentKeydown);
		document.addEventListener("click", onNavigationClick, true);

		return () => {
			if (fallbackTimer) clearTimeout(fallbackTimer);
			document.removeEventListener("pagefindready", onPagefindReady);
			document.removeEventListener("pagefindloaderror", onPagefindError);
			document.removeEventListener("pointerdown", onDocumentPointerDown);
			document.removeEventListener("keydown", onDocumentKeydown);
			document.removeEventListener("click", onNavigationClick, true);
		};
	});

	$: if (initialized && keyword.trim()) void search(keyword);
</script>

<!-- search bar for desktop view -->
<div
	id="search-bar"
	class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10"
>
	<Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30" />
	<label class="sr-only" for="search-input-desktop">{i18n(I18nKey.search)}</label>
	<input
		id="search-input-desktop"
		type="search"
		name="q"
		autocomplete="off"
		placeholder={i18n(I18nKey.search)}
		bind:value={keyword}
		on:focus={() => (panelOpen = true)}
		on:input={handleInput}
		class="transition-all pl-10 text-sm bg-transparent h-full w-40 active:w-60 focus:w-60 text-black/70 dark:text-white/75 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] rounded-lg"
	/>
</div>

<!-- toggle btn for phone/tablet view -->
<button
	type="button"
	on:click={togglePanel}
	aria-label={i18n(I18nKey.search)}
	aria-expanded={panelOpen}
	aria-controls="search-panel"
	id="search-switch"
	class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
>
	<Icon icon="material-symbols:search" class="text-[1.25rem]" />
</button>

<!-- search panel -->
<div
	id="search-panel"
	class="float-panel search-panel absolute md:w-[30rem] left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2"
	class:float-panel-closed={!panelOpen}
	aria-hidden={!panelOpen}
	inert={!panelOpen}
	aria-busy={isSearching}
>
	<!-- search bar inside panel for phone/tablet -->
	<div
		id="search-bar-inside"
		class="flex relative lg:hidden transition-all items-center h-11 rounded-xl bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10"
	>
		<Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30" />
		<label class="sr-only" for="search-input-mobile">{i18n(I18nKey.search)}</label>
		<input
			id="search-input-mobile"
			type="search"
			name="q"
			autocomplete="off"
			placeholder={i18n(I18nKey.search)}
			bind:value={keyword}
			on:focus={() => (panelOpen = true)}
			on:input={handleInput}
			class="pl-10 absolute inset-0 text-sm bg-transparent text-black/70 dark:text-white/75 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] rounded-xl"
		/>
	</div>

	{#if isSearching}
		<p class="search-message" role="status" aria-live="polite">{i18n(I18nKey.searching)}</p>
	{:else if hasSearched && searchFailed}
		<p class="search-message" role="status" aria-live="polite">{i18n(I18nKey.searchUnavailable)}</p>
	{:else if hasSearched && result.length === 0}
		<p class="search-message" role="status" aria-live="polite">{i18n(I18nKey.noSearchResults)}</p>
	{/if}

	<!-- search results -->
	{#each result as item}
		<a
			href={item.url}
			class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
		>
			<div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
				{item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]" />
			</div>
			<div class="transition text-sm text-50">
				{@html item.excerpt}
			</div>
		</a>
	{/each}
</div>

<style>
	.search-panel {
		max-height: min(70vh, calc(100dvh - 6.5rem));
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.search-message {
		margin: 0.5rem 0.25rem 0;
		padding: 0.75rem;
		border-radius: 0.75rem;
		color: var(--btn-content);
		font-size: 0.875rem;
		background: var(--btn-plain-bg-hover);
	}
</style>
