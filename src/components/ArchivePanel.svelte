<script lang="ts">
	import { onMount } from "svelte";
	import I18nKey from "../i18n/i18nKey";
	import { i18n } from "../i18n/translation";
	import { getPostUrlBySlug, url } from "../utils/url-utils";

	interface Post {
		slug: string;
		data: {
			title: string;
			tags: string[];
			category?: string | null;
			published: Date;
		};
	}

	interface Group {
		year: number;
		posts: Post[];
	}

	export let tags: string[] = [];
	export let categories: string[] = [];
	export let sortedPosts: Post[] = [];

	let uncategorized = false;
	let groups: Group[] = [];
	let filteredPosts: Post[] = [];
	let hasFilters = false;

	function formatDate(date: Date) {
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		return `${month}-${day}`;
	}

	function formatTag(tagList: string[]) {
		return tagList.map((tag) => `#${tag}`).join(" ");
	}

	function groupPosts(posts: Post[]): Group[] {
		const grouped = posts.reduce(
			(acc, post) => {
				const year = new Date(post.data.published).getFullYear();
				if (!acc[year]) acc[year] = [];
				acc[year].push(post);
				return acc;
			},
			{} as Record<number, Post[]>,
		);

		return Object.keys(grouped)
			.map((year) => ({ year: Number.parseInt(year, 10), posts: grouped[Number(year)] }))
			.sort((a, b) => b.year - a.year);
	}

	$: filteredPosts = sortedPosts.filter((post) => {
		const matchesTags =
			tags.length === 0 ||
			(Array.isArray(post.data.tags) && post.data.tags.some((tag) => tags.includes(tag)));
		const matchesCategories =
			categories.length === 0 ||
			Boolean(post.data.category && categories.includes(post.data.category));
		const matchesUncategorized = !uncategorized || !post.data.category;
		return matchesTags && matchesCategories && matchesUncategorized;
	});
	$: groups = groupPosts(filteredPosts);
	$: hasFilters = tags.length > 0 || categories.length > 0 || uncategorized;

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		tags = params.getAll("tag");
		categories = params.getAll("category");
		uncategorized = params.get("uncategorized") === "true";
	});
</script>

<div class="card-base archive-panel px-4 sm:px-8 py-6">
	{#if hasFilters}
		<div class="archive-filters" aria-label="当前筛选条件">
			{#each [...tags, ...categories, ...(uncategorized ? [i18n(I18nKey.uncategorized)] : [])] as filter}
				<span class="archive-filter">{filter}</span>
			{/each}
			<a class="archive-clear" href={url("/archive/")}>{i18n(I18nKey.clearFilters)}</a>
		</div>
	{/if}

	{#if groups.length > 0}
		{#each groups as group}
			<div>
				<div class="flex flex-row w-full items-center h-[3.75rem]">
					<div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
						{group.year}
					</div>
					<div class="w-[15%] md:w-[10%]">
						<div class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto -outline-offset-[2px] z-50 outline-3"></div>
					</div>
					<div class="w-[70%] md:w-[80%] transition text-left text-60">
						{group.posts.length} {i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
					</div>
				</div>

				{#each group.posts as post}
					<a
						href={getPostUrlBySlug(post.slug)}
						aria-label={post.data.title}
						class="group btn-plain !block min-h-10 w-full rounded-lg hover:text-[initial]"
					>
						<div class="flex flex-row justify-start items-center min-h-10">
							<div class="w-[15%] md:w-[10%] shrink-0 transition text-sm text-right text-60">
								{formatDate(post.data.published)}
							</div>
							<div class="w-[15%] md:w-[10%] shrink-0 relative dash-line h-10 flex items-center">
								<div class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5 bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)] outline outline-4 z-50 outline-[var(--card-bg)] group-hover:outline-[var(--btn-plain-bg-hover)] group-active:outline-[var(--btn-plain-bg-active)]"></div>
							</div>
							<div class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)] text-75 pr-3 sm:pr-8 whitespace-normal break-words leading-snug py-2">
								{post.data.title}
							</div>
							<div class="hidden md:block md:w-[15%] text-left text-sm transition whitespace-nowrap overflow-ellipsis overflow-hidden text-60">
								{formatTag(post.data.tags)}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/each}
	{:else}
		<div class="archive-empty" role="status">
			<p>{i18n(I18nKey.noPosts)}</p>
			<a href={url("/archive/")}>{i18n(I18nKey.clearFilters)}</a>
		</div>
	{/if}
</div>

<style>
	.archive-filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.archive-filter {
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		background: var(--btn-regular-bg);
		color: var(--btn-content);
		font-size: 0.8rem;
	}
	.archive-clear,
	.archive-empty a {
		color: var(--primary);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.archive-empty {
		padding: 2.5rem 1rem;
		text-align: center;
		color: var(--btn-content);
	}
	.archive-empty p {
		margin-bottom: 0.75rem;
	}
	.archive-clear:focus-visible,
	.archive-empty a:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 3px;
	}
</style>
