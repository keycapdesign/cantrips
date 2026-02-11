<script lang="ts">
	import { api } from '$lib/api';
	import GameCard from '$lib/components/GameCard.svelte';
	import GameTable from '$lib/components/GameTable.svelte';
	import SearchModal from '$lib/components/SearchModal.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import List from '@lucide/svelte/icons/list';
	import Plus from '@lucide/svelte/icons/plus';

	let games = $state<any[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchOpen = $state(false);
	let sortBy = $state<string>('title');
	let viewMode = $state<string>(
		typeof localStorage !== 'undefined' ? (localStorage.getItem('viewMode') ?? 'gallery') : 'gallery'
	);

	$effect(() => {
		localStorage.setItem('viewMode', viewMode);
	});

	const sortOptions = [
		{ value: 'title', label: 'Name' },
		{ value: 'cut_percent', label: 'Discount' },
		{ value: 'sale_price', label: 'Price' },
		{ value: 'created_at', label: 'Recently Added' }
	];

	let sortLabel = $derived(sortOptions.find((o) => o.value === sortBy)?.label ?? 'Sort');

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

	let sortedGames = $derived.by(() => {
		const sorted = [...games];
		switch (sortBy) {
			case 'title':
				sorted.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case 'cut_percent':
				sorted.sort((a, b) => (b.cut_percent ?? 0) - (a.cut_percent ?? 0));
				break;
			case 'sale_price':
				sorted.sort((a, b) => (a.sale_price ?? Infinity) - (b.sale_price ?? Infinity));
				break;
			case 'created_at':
				sorted.sort(
					(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				);
				break;
		}
		return sorted;
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Watchlist</h1>
		<div class="flex items-center gap-3">
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

			{#if viewMode === 'gallery'}
				<Select.Root
					type="single"
					value={sortBy}
					onValueChange={(v) => {
						if (v) sortBy = v;
					}}
				>
					<Select.Trigger class="w-[160px]">
						{sortLabel}
					</Select.Trigger>
					<Select.Content>
						{#each sortOptions as opt (opt.value)}
							<Select.Item value={opt.value} label={opt.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}

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
	{:else if sortedGames.length === 0}
		<div class="text-center py-16 space-y-4">
			<p class="text-muted-foreground text-lg">No games in your watchlist yet</p>
			<Button onclick={() => (searchOpen = true)}>
				<Plus class="h-4 w-4" />
				Add your first game
			</Button>
		</div>
	{:else if viewMode === 'gallery'}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
			{#each sortedGames as game (game.id)}
				<GameCard {game} />
			{/each}
		</div>
	{:else}
		<GameTable {games} />
	{/if}
</div>

<SearchModal bind:open={searchOpen} onclose={() => (searchOpen = false)} onadd={loadGames} />
