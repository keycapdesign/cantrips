<script lang="ts">
	import { api } from '$lib/api';
	import * as Command from '$lib/components/ui/command';
	import * as Avatar from '$lib/components/ui/avatar';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		onclose: () => void;
		onadd: () => void;
	}

	let { open = $bindable(), onclose, onadd }: Props = $props();
	let inputValue = $state('');
	let results = $state<any[]>([]);
	let searching = $state(false);
	let adding = $state<string | null>(null);
	let error = $state('');
	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = !open;
		}
	}

	// Debounced search when input changes
	$effect(() => {
		const q = inputValue;
		clearTimeout(debounceTimer);
		error = '';
		if (q.length < 2) {
			results = [];
			return;
		}
		debounceTimer = setTimeout(() => doSearch(q), 300);
	});

	// Reset state when dialog closes
	$effect(() => {
		if (!open) {
			inputValue = '';
			results = [];
			error = '';
		}
	});

	async function doSearch(query: string) {
		searching = true;
		try {
			results = (await api.games.search(query)) as any[];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Search failed';
			results = [];
		} finally {
			searching = false;
		}
	}

	async function addGame(game: any) {
		adding = game.id;
		error = '';
		try {
			await api.games.add({ itadId: game.id, title: game.title });
			toast.success(`${game.title} added to watchlist`);
			onadd();
			open = false;
			onclose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add game';
		} finally {
			adding = null;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Command.Dialog
	bind:open
	shouldFilter={false}
	title="Add Game"
	description="Search IsThereAnyDeal to add games to your watchlist"
>
	<Command.Input placeholder="Search for a game..." bind:value={inputValue} />
	<Command.List class="max-h-[400px]">
		{#if searching}
			<div class="py-6 text-center text-sm text-muted-foreground">Searching...</div>
		{:else if error}
			<div class="py-6 text-center text-sm text-destructive">{error}</div>
		{:else if results.length > 0}
			<Command.Group>
				{#each results as game (game.id)}
					<Command.Item
						value={game.title}
						onSelect={() => addGame(game)}
						disabled={adding === game.id}
						class="gap-3"
					>
						<Avatar.Root class="h-8 w-8 shrink-0 rounded">
							{#if game.assets?.boxart}
								<Avatar.Image src={game.assets.boxart} alt={game.title} />
							{/if}
							<Avatar.Fallback class="rounded text-xs"
								>{game.title.slice(0, 2)}</Avatar.Fallback
							>
						</Avatar.Root>
						<div class="flex-1 min-w-0">
							<p class="truncate">{game.title}</p>
							<p class="text-xs text-muted-foreground truncate">
								{game.type || 'Game'}
							</p>
						</div>
						{#if adding === game.id}
							<span class="text-xs text-muted-foreground shrink-0">Adding...</span>
						{/if}
					</Command.Item>
				{/each}
			</Command.Group>
		{:else if inputValue.length >= 2}
			<Command.Empty>No results found</Command.Empty>
		{:else}
			<Command.Empty>Type to search for games...</Command.Empty>
		{/if}
	</Command.List>
</Command.Dialog>
