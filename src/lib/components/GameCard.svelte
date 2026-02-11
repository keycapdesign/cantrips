<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio';
	import { Badge } from '$lib/components/ui/badge';
	import DealBadge from './DealBadge.svelte';
	import { releaseStatus, parseTags } from '$lib/utils/game';

	interface Props {
		game: {
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
			deal_url?: string | null;
			history_low?: number | null;
		};
	}

	let { game }: Props = $props();

	let tags = $derived(parseTags(game.tags));
	let status = $derived(releaseStatus(game.release_date, game.early_access));
</script>

<a href="/game/{game.id}" class="block group">
	<Card.Root class="overflow-hidden transition-all hover:ring-2 hover:ring-ring hover:bg-card/50 pt-0 bg-transparent border-none duration-300 rounded-lg">
		<div class="relative">
			<AspectRatio ratio={16 / 9}>
				{#if game.boxart_url}
					<img src={game.boxart_url} alt={game.title} class="h-full w-full object-cover rounded-lg" />
				{:else}
					<div
						class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
					>
						No image
					</div>
				{/if}
			</AspectRatio>
			{#if status.label !== 'Released'}
				<Badge
					variant="secondary"
					class="absolute top-2 left-2 {status.class}"
				>
					{status.label}
				</Badge>
			{/if}
		</div>
		<Card.Content class="space-y-2">
			<Card.Title class="truncate">{game.title}</Card.Title>

			{#if tags.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each tags.slice(0, 3) as tag (tag)}
						<Badge variant="outline" class="text-xs font-normal">{tag}</Badge>
					{/each}
					{#if tags.length > 3}
						<Badge variant="outline" class="text-xs font-normal text-muted-foreground">
							+{tags.length - 3}
						</Badge>
					{/if}
				</div>
			{/if}

			{#if game.sale_price != null}
				<div class="flex items-center gap-2">
					<span class="text-xl font-bold text-primary">${game.sale_price.toFixed(2)}</span>
					{#if game.regular_price != null && game.regular_price !== game.sale_price}
						<span class="text-sm text-muted-foreground line-through">
							${game.regular_price.toFixed(2)}
						</span>
					{/if}
					{#if game.cut_percent != null && game.cut_percent > 0}
						<DealBadge cut={game.cut_percent} />
					{/if}
				</div>
				{#if game.shop_name}
					<p class="text-sm text-muted-foreground">{game.shop_name}</p>
				{/if}
			{:else}
				<p class="text-sm text-muted-foreground">No deals found</p>
			{/if}

			{#if game.history_low != null}
				<p class="text-xs text-muted-foreground">
					All-time low: ${game.history_low.toFixed(2)}
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</a>
