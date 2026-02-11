<script lang="ts">
	import { api } from '$lib/api';
	import GameCard from '$lib/components/GameCard.svelte';
	import GameTable from '$lib/components/GameTable.svelte';
	import SearchModal from '$lib/components/SearchModal.svelte';
	import SortPopover from '$lib/components/SortPopover.svelte';
	import FilterPopover from '$lib/components/FilterPopover.svelte';
	import ToolbarSearch from '$lib/components/ToolbarSearch.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { parseTags } from '$lib/utils/game';
	import type { SortingState } from '@tanstack/table-core';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import List from '@lucide/svelte/icons/list';
	import Plus from '@lucide/svelte/icons/plus';

	let games = $state<any[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchOpen = $state(false);
	let viewMode = $state<string>(
		typeof localStorage !== 'undefined'
			? (localStorage.getItem('viewMode') ?? 'gallery')
			: 'gallery'
	);

	// Unified sort state
	let sortField = $state<string>('title');
	let sortDesc = $state<boolean>(false);

	// Filter state
	let filterStatus = $state<string[]>([]);
	let filterShops = $state<string[]>([]);
	let filterTags = $state<string[]>([]);

	// Search state
	let searchQuery = $state<string>('');

	$effect(() => {
		localStorage.setItem('viewMode', viewMode);
	});

	async function loadGames() {
		loading = true;
		error = '';
		try {
			games = (await api.games.list()) as any[];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load games';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadGames();
	});

	// Derived filter options from game data
	let availableShops = $derived(
		[...new Set(games.map((g) => g.shop_name).filter(Boolean))].sort() as string[]
	);
	let availableTags = $derived(
		[...new Set(games.flatMap((g) => parseTags(g.tags)))].sort() as string[]
	);

	function getGameStatusCategory(game: any): string {
		if (game.early_access) return 'Early Access';
		if (!game.release_date) return 'Release TBA';
		if (new Date(game.release_date) > new Date()) return 'Upcoming';
		return 'Released';
	}

	// Filter + search pipeline
	let filteredGames = $derived.by(() => {
		let result = games;

		if (filterStatus.length > 0) {
			result = result.filter((g) => filterStatus.includes(getGameStatusCategory(g)));
		}
		if (filterShops.length > 0) {
			result = result.filter((g) => g.shop_name && filterShops.includes(g.shop_name));
		}
		if (filterTags.length > 0) {
			result = result.filter((g) => {
				const tags = parseTags(g.tags);
				return filterTags.some((t) => tags.includes(t));
			});
		}
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter((g) => g.title.toLowerCase().includes(q));
		}

		return result;
	});

	// Sorted games for gallery view
	let sortedGames = $derived.by(() => {
		const sorted = [...filteredGames];
		const dir = sortDesc ? -1 : 1;

		switch (sortField) {
			case 'title':
				sorted.sort((a, b) => dir * a.title.localeCompare(b.title));
				break;
			case 'cut_percent':
				sorted.sort((a, b) => dir * ((a.cut_percent ?? -1) - (b.cut_percent ?? -1)));
				break;
			case 'sale_price':
				sorted.sort((a, b) => dir * ((a.sale_price ?? Infinity) - (b.sale_price ?? Infinity)));
				break;
			case 'created_at':
				sorted.sort(
					(a, b) =>
						dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
				);
				break;
			case 'history_low':
				sorted.sort(
					(a, b) => dir * ((a.history_low ?? Infinity) - (b.history_low ?? Infinity))
				);
				break;
			case 'shop_name':
				sorted.sort((a, b) => dir * (a.shop_name ?? '').localeCompare(b.shop_name ?? ''));
				break;
			case 'regular_price':
				sorted.sort(
					(a, b) =>
						dir * ((a.regular_price ?? Infinity) - (b.regular_price ?? Infinity))
				);
				break;
		}
		return sorted;
	});

	// TanStack sorting state synced with unified sort
	let tableSorting = $derived<SortingState>([{ id: sortField, desc: sortDesc }]);

	function handleSortChange(field: string, desc: boolean) {
		sortField = field;
		sortDesc = desc;
	}

	function handleTableSortingChange(newSorting: SortingState) {
		if (newSorting.length > 0) {
			sortField = newSorting[0].id;
			sortDesc = newSorting[0].desc;
		}
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">Watchlist</h1>

	<div class="flex items-center justify-between">
		<ToggleGroup.Root
			type="single"
			value={viewMode}
			onValueChange={(v) => {
				if (v) viewMode = v;
			}}
			variant="outline"
		>
			<ToggleGroup.Item value="gallery" aria-label="Gallery view">
				<LayoutGrid class="h-4 w-4" />
			</ToggleGroup.Item>
			<ToggleGroup.Item value="table" aria-label="Table view">
				<List class="h-4 w-4" />
			</ToggleGroup.Item>
		</ToggleGroup.Root>

		<div class="flex items-center gap-1">
			<SortPopover {sortField} {sortDesc} onSortChange={handleSortChange} />
			<FilterPopover
				{filterStatus}
				{filterShops}
				{filterTags}
				{availableShops}
				{availableTags}
				onStatusChange={(v) => (filterStatus = v)}
				onShopsChange={(v) => (filterShops = v)}
				onTagsChange={(v) => (filterTags = v)}
			/>
			<ToolbarSearch value={searchQuery} onValueChange={(v) => (searchQuery = v)} />

			<div class="mx-1 h-6 w-px bg-border"></div>

			<Button onclick={() => (searchOpen = true)}>
				<Plus class="h-4 w-4" />
				Add Game
				<kbd
					class="pointer-events-none ml-1 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted/10 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex"
				>
					<span class="text-xs">⌘</span>K
				</kbd>
			</Button>
		</div>
	</div>

	{#if loading}
		{#if viewMode === 'gallery'}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{#each Array(8) as _, i (i)}
					<div class="space-y-3">
						<Skeleton class="h-48 w-full rounded-lg" />
						<Skeleton class="h-4 w-3/4" />
						<Skeleton class="h-4 w-1/2" />
					</div>
				{/each}
			</div>
		{:else}
			<div class="space-y-2">
				{#each Array(6) as _, i (i)}
					<Skeleton class="h-12 w-full" />
				{/each}
			</div>
		{/if}
	{:else if error}
		<p class="text-destructive text-center py-12">{error}</p>
	{:else if games.length === 0}
		<div class="text-center py-16 space-y-4">
			<p class="text-muted-foreground text-lg">No games in your watchlist yet</p>
			<Button onclick={() => (searchOpen = true)}>
				<Plus class="h-4 w-4" />
				Add your first game
			</Button>
		</div>
	{:else if filteredGames.length === 0}
		<div class="text-center py-16 space-y-4">
			<p class="text-muted-foreground text-lg">No games match your filters</p>
			<Button
				variant="outline"
				onclick={() => {
					filterStatus = [];
					filterShops = [];
					filterTags = [];
					searchQuery = '';
				}}
			>
				Clear filters
			</Button>
		</div>
	{:else if viewMode === 'gallery'}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
			{#each sortedGames as game (game.id)}
				<GameCard {game} />
			{/each}
		</div>
	{:else}
		<GameTable
			games={filteredGames}
			sorting={tableSorting}
			onSortingChange={handleTableSortingChange}
		/>
	{/if}
</div>

<SearchModal bind:open={searchOpen} onclose={() => (searchOpen = false)} onadd={loadGames} />
