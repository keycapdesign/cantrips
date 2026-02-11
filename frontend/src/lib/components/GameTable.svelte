<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Table from '$lib/components/ui/table';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import DealBadge from './DealBadge.svelte';
	import { releaseStatus, parseTags } from '$lib/utils/game';

	interface Props {
		games: Array<{
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
		}>;
	}

	let { games }: Props = $props();
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12"></Table.Head>
			<Table.Head>Title</Table.Head>
			<Table.Head>Tags</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Head class="text-right">Sale Price</Table.Head>
			<Table.Head class="text-right">Regular</Table.Head>
			<Table.Head>Discount</Table.Head>
			<Table.Head>Shop</Table.Head>
			<Table.Head class="text-right">All-time Low</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each games as game (game.id)}
			{@const tags = parseTags(game.tags)}
			{@const status = releaseStatus(game.release_date, game.early_access)}
			<Table.Row class="cursor-pointer hover:bg-accent/50 transition-colors" onclick={() => goto(`/game/${game.id}`)}>
				<Table.Cell>
					<Avatar.Root class="h-10 w-10 rounded">
						{#if game.boxart_url}
							<Avatar.Image src={game.boxart_url} alt={game.title} />
						{/if}
						<Avatar.Fallback class="rounded">{game.title.slice(0, 2)}</Avatar.Fallback>
					</Avatar.Root>
				</Table.Cell>
				<Table.Cell class="font-medium">
					<a href="/game/{game.id}" class="hover:underline">{game.title}</a>
				</Table.Cell>
				<Table.Cell>
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
				</Table.Cell>
				<Table.Cell>
					{#if status.label !== 'Released'}
						<Badge variant="secondary" class="text-xs {status.class}">
							{status.label}
						</Badge>
					{:else}
						<span class="text-sm text-muted-foreground">{status.label}</span>
					{/if}
				</Table.Cell>
				<Table.Cell class="text-right">
					{#if game.sale_price != null}
						<span class="font-bold text-primary">${game.sale_price.toFixed(2)}</span>
					{:else}
						<span class="text-muted-foreground">--</span>
					{/if}
				</Table.Cell>
				<Table.Cell class="text-right">
					{#if game.regular_price != null && game.regular_price !== game.sale_price}
						<span class="text-muted-foreground line-through">
							${game.regular_price.toFixed(2)}
						</span>
					{:else if game.regular_price != null}
						<span class="text-muted-foreground">${game.regular_price.toFixed(2)}</span>
					{:else}
						<span class="text-muted-foreground">--</span>
					{/if}
				</Table.Cell>
				<Table.Cell>
					{#if game.cut_percent != null && game.cut_percent > 0}
						<DealBadge cut={game.cut_percent} />
					{:else}
						<span class="text-muted-foreground">--</span>
					{/if}
				</Table.Cell>
				<Table.Cell>
					{#if game.shop_name}
						<span class="text-sm">{game.shop_name}</span>
					{:else}
						<span class="text-muted-foreground">--</span>
					{/if}
				</Table.Cell>
				<Table.Cell class="text-right">
					{#if game.history_low != null}
						<span class="text-sm">${game.history_low.toFixed(2)}</span>
					{:else}
						<span class="text-muted-foreground">--</span>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
