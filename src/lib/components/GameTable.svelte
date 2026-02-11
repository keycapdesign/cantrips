<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		createSvelteTable,
		FlexRender,
		renderSnippet
	} from '$lib/components/ui/data-table';
	import {
		type ColumnDef,
		getCoreRowModel,
		getSortedRowModel,
		type SortingState
	} from '@tanstack/table-core';
	import * as Table from '$lib/components/ui/table';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import DealBadge from './DealBadge.svelte';
	import { releaseStatus, parseTags } from '$lib/utils/game';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';

	type Game = {
		id: number;
		title: string;
		boxart_url?: string | null;
		tags?: string | null;
		release_date?: string | null;
		early_access?: number | null;
		sale_price?: number | null;
		regular_price?: number | null;
		cut_percent?: number | null;
		shop_name?: string | null;
		history_low?: number | null;
	};

	interface Props {
		games: Game[];
		sorting: SortingState;
		onSortingChange: (sorting: SortingState) => void;
	}

	let { games, sorting, onSortingChange }: Props = $props();

	const columns: ColumnDef<Game>[] = [
		{
			id: 'boxart',
			accessorKey: 'boxart_url',
			header: '',
			enableSorting: false,
			cell: ({ row }) => {
				return renderSnippet(avatarCell, row.original);
			}
		},
		{
			accessorKey: 'title',
			header: ({ column }) => renderSnippet(sortHeader, { label: 'Title', column }),
			cell: ({ row }) => renderSnippet(titleCell, row.original)
		},
		{
			id: 'tags',
			accessorKey: 'tags',
			header: 'Tags',
			enableSorting: false,
			cell: ({ row }) => renderSnippet(tagsCell, row.original)
		},
		{
			id: 'status',
			header: 'Status',
			enableSorting: false,
			cell: ({ row }) => renderSnippet(statusCell, row.original)
		},
		{
			accessorKey: 'sale_price',
			header: ({ column }) => renderSnippet(sortHeader, { label: 'Sale Price', column, align: 'right' }),
			cell: ({ row }) => renderSnippet(salePriceCell, row.original),
			sortUndefined: 'last'
		},
		{
			accessorKey: 'regular_price',
			header: ({ column }) => renderSnippet(sortHeader, { label: 'Regular', column, align: 'right' }),
			cell: ({ row }) => renderSnippet(regularPriceCell, row.original),
			sortUndefined: 'last'
		},
		{
			accessorKey: 'cut_percent',
			header: ({ column }) => renderSnippet(sortHeader, { label: 'Discount', column }),
			cell: ({ row }) => renderSnippet(discountCell, row.original),
			sortUndefined: 'last',
			sortDescFirst: true
		},
		{
			accessorKey: 'shop_name',
			header: ({ column }) => renderSnippet(sortHeader, { label: 'Shop', column }),
			cell: ({ row }) => renderSnippet(shopCell, row.original),
			sortUndefined: 'last'
		},
		{
			accessorKey: 'history_low',
			header: ({ column }) => renderSnippet(sortHeader, { label: 'All-time Low', column, align: 'right' }),
			cell: ({ row }) => renderSnippet(historyLowCell, row.original),
			sortUndefined: 'last'
		}
	];

	const table = createSvelteTable({
		get data() {
			return games;
		},
		columns,
		state: {
			get sorting() {
				return sorting;
			}
		},
		onSortingChange(updater) {
			const newSorting = updater instanceof Function ? updater(sorting) : updater;
			onSortingChange(newSorting);
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});
</script>

{#snippet sortHeader({ label, column, align }: { label: string; column: any; align?: string })}
	{@const sorted = column.getIsSorted()}
	<button
		class="inline-flex items-center gap-1 hover:text-foreground transition-colors {align === 'right' ? 'ml-auto' : ''}"
		onclick={() => {
			if (sorted) {
				column.toggleSorting(sorted === 'asc');
			} else {
				column.toggleSorting(column.columnDef.sortDescFirst ?? false);
			}
		}}
	>
		{label}
		{#if sorted === 'asc'}
			<ArrowUp class="h-3.5 w-3.5" />
		{:else if sorted === 'desc'}
			<ArrowDown class="h-3.5 w-3.5" />
		{:else}
			<ArrowUpDown class="h-3.5 w-3.5 opacity-40" />
		{/if}
	</button>
{/snippet}

{#snippet avatarCell(game: Game)}
	<Avatar.Root class="h-10 w-10 rounded">
		{#if game.boxart_url}
			<Avatar.Image src={game.boxart_url} alt={game.title} />
		{/if}
		<Avatar.Fallback class="rounded">{game.title.slice(0, 2)}</Avatar.Fallback>
	</Avatar.Root>
{/snippet}

{#snippet titleCell(game: Game)}
	<a href="/game/{game.id}" class="font-medium hover:underline">{game.title}</a>
{/snippet}

{#snippet tagsCell(game: Game)}
	{@const tags = parseTags(game.tags)}
	{#if tags.length > 0}
		<div class="flex flex-wrap gap-1">
			{#each tags.slice(0, 2) as tag (tag)}
				<Badge variant="outline" class="text-xs font-normal">{tag}</Badge>
			{/each}
			{#if tags.length > 2}
				<span class="text-xs text-muted-foreground">+{tags.length - 2}</span>
			{/if}
		</div>
	{:else}
		<span class="text-muted-foreground">--</span>
	{/if}
{/snippet}

{#snippet statusCell(game: Game)}
	{@const status = releaseStatus(game.release_date, game.early_access)}
	{#if status.label !== 'Released'}
		<Badge variant="secondary" class="text-xs {status.class}">
			{status.label}
		</Badge>
	{:else}
		<span class="text-sm text-muted-foreground">{status.label}</span>
	{/if}
{/snippet}

{#snippet salePriceCell(game: Game)}
	<div class="text-right">
		{#if game.sale_price != null}
			<span class="font-bold text-primary">${game.sale_price.toFixed(2)}</span>
		{:else}
			<span class="text-muted-foreground">--</span>
		{/if}
	</div>
{/snippet}

{#snippet regularPriceCell(game: Game)}
	<div class="text-right">
		{#if game.regular_price != null && game.regular_price !== game.sale_price}
			<span class="text-muted-foreground line-through">${game.regular_price.toFixed(2)}</span>
		{:else if game.regular_price != null}
			<span class="text-muted-foreground">${game.regular_price.toFixed(2)}</span>
		{:else}
			<span class="text-muted-foreground">--</span>
		{/if}
	</div>
{/snippet}

{#snippet discountCell(game: Game)}
	{#if game.cut_percent != null && game.cut_percent > 0}
		<DealBadge cut={game.cut_percent} />
	{:else}
		<span class="text-muted-foreground">--</span>
	{/if}
{/snippet}

{#snippet shopCell(game: Game)}
	{#if game.shop_name}
		<span class="text-sm">{game.shop_name}</span>
	{:else}
		<span class="text-muted-foreground">--</span>
	{/if}
{/snippet}

{#snippet historyLowCell(game: Game)}
	<div class="text-right">
		{#if game.history_low != null}
			<span class="text-sm">${game.history_low.toFixed(2)}</span>
		{:else}
			<span class="text-muted-foreground">--</span>
		{/if}
	</div>
{/snippet}

<Table.Root>
	<Table.Header>
		{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
			<Table.Row>
				{#each headerGroup.headers as header (header.id)}
					<Table.Head class={header.id === 'boxart' ? 'w-12' : ''}>
						{#if !header.isPlaceholder}
							<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
						{/if}
					</Table.Head>
				{/each}
			</Table.Row>
		{/each}
	</Table.Header>
	<Table.Body>
		{#each table.getRowModel().rows as row (row.id)}
			<Table.Row
				class="cursor-pointer hover:bg-accent/50 transition-colors"
				onclick={() => goto(`/game/${row.original.id}`)}
			>
				{#each row.getVisibleCells() as cell (cell.id)}
					<Table.Cell>
						<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
					</Table.Cell>
				{/each}
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
