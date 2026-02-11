<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import DealBadge from '$lib/components/DealBadge.svelte';
	import PriceChart from '$lib/components/PriceChart.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Users from '@lucide/svelte/icons/users';
	import { releaseStatus, parseTags as parseTagsUtil } from '$lib/utils/game';

	let game = $state<any>(null);
	let history = $state<any[]>([]);
	let loading = $state(true);
	let error = $state('');
	let removing = $state(false);
	let confirmRemoveOpen = $state(false);
	let gameStatus = $derived(game ? releaseStatus(game.release_date, game.early_access) : null);

	$effect(() => {
		loadGame();
	});

	async function loadGame() {
		loading = true;
		error = '';
		try {
			const id = page.params.id!;
			const [gameData, historyData] = await Promise.all([
				api.games.get(id),
				api.games.history(id).catch(() => [])
			]);
			game = gameData;
			history = historyData as any[];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load game';
		} finally {
			loading = false;
		}
	}

	async function removeGame() {
		if (!game) return;
		removing = true;
		try {
			await api.games.remove(game.id);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove game';
			removing = false;
		}
	}

	function parseTags(tags: string | null): string[] {
		return parseTagsUtil(tags);
	}

	function parsePlatforms(platforms: string | null): string {
		if (!platforms) return '';
		try {
			return JSON.parse(platforms).join(', ');
		} catch {
			return platforms;
		}
	}
</script>

{#if loading}
	<div class="space-y-6">
		<Skeleton class="h-8 w-48" />
		<div class="flex gap-6">
			<Skeleton class="w-64 h-36 hidden md:block rounded-lg" />
			<div class="flex-1 space-y-3">
				<Skeleton class="h-10 w-3/4" />
				<Skeleton class="h-4 w-1/2" />
				<Skeleton class="h-4 w-1/3" />
			</div>
		</div>
	</div>
{:else if error}
	<p class="text-destructive text-center py-12">{error}</p>
{:else if game}
	<div class="space-y-8 max-w-4xl mx-auto">
		<div>
			<Button variant="ghost" href="/" size="sm">
				<ArrowLeft class="h-4 w-4" />
				Back to Watchlist
			</Button>
		</div>

		<!-- Header -->
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex gap-6">
					{#if game.banner_url}
						<img
							src={game.banner_url}
							alt={game.title}
							class="w-64 h-36 object-cover rounded-lg hidden md:block"
						/>
					{/if}
					<div class="flex-1 space-y-3">
						<div class="flex items-start justify-between">
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<h1 class="text-3xl font-bold">{game.title}</h1>
									{#if gameStatus && gameStatus.label !== 'Released'}
										<Badge variant="secondary" class={gameStatus.class}>
											{gameStatus.label}
										</Badge>
									{/if}
								</div>
								<p class="text-muted-foreground text-sm">
									{game.game_type || 'Game'}
									{#if game.release_date}
										&middot; {game.early_access ? 'Early Access since' : 'Released'} {game.release_date}
									{/if}
									{#if game.review_score != null}
										&middot; Score: {game.review_score}%
									{/if}
								</p>
								{#if game.players_recent != null || game.players_peak != null}
									<p class="text-muted-foreground text-sm flex items-center gap-1">
										<Users class="h-3.5 w-3.5" />
										{#if game.players_recent != null}
											{game.players_recent.toLocaleString()} recent
										{/if}
										{#if game.players_peak != null}
											&middot; {game.players_peak.toLocaleString()} peak
										{/if}
									</p>
								{/if}
							</div>
							<Button
								variant="destructive"
								size="sm"
								onclick={() => (confirmRemoveOpen = true)}
								disabled={removing}
							>
								<Trash2 class="h-4 w-4" />
								{removing ? 'Removing...' : 'Remove'}
							</Button>
						</div>

						{#if game.history_low != null}
							<p class="text-sm text-muted-foreground">
								All-time low: <span class="text-primary font-medium">
									${game.history_low.toFixed(2)}
								</span>
								{#if game.history_low_store}
									at {game.history_low_store}
								{/if}
							</p>
						{/if}

						{#if parseTags(game.tags).length > 0}
							<div class="flex flex-wrap gap-2">
								{#each parseTags(game.tags) as tag}
									<Badge variant="secondary">{tag}</Badge>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Price History Chart -->
		{#if history.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title>Price History</Card.Title>
				</Card.Header>
				<Card.Content>
					<PriceChart {history} />
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Current Deals -->
		{#if game.deals && game.deals.length > 0}
			<Card.Root>
				<Card.Header>
					<Card.Title>Current Deals</Card.Title>
				</Card.Header>
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Shop</Table.Head>
								<Table.Head>DRM</Table.Head>
								<Table.Head>Platforms</Table.Head>
								<Table.Head>Discount</Table.Head>
								<Table.Head class="text-right">Price</Table.Head>
								<Table.Head></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each game.deals as deal (deal.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{deal.shop_name}</Table.Cell>
									<Table.Cell class="text-muted-foreground">
										{deal.drm || 'Unknown'}
									</Table.Cell>
									<Table.Cell class="text-muted-foreground">
										{parsePlatforms(deal.platforms) || '--'}
									</Table.Cell>
									<Table.Cell>
										<DealBadge cut={deal.cut_percent} flag={deal.flag} />
									</Table.Cell>
									<Table.Cell class="text-right">
										<span class="font-bold text-primary">
											${deal.sale_price.toFixed(2)}
										</span>
										{#if deal.regular_price !== deal.sale_price}
											<span class="text-sm text-muted-foreground line-through ml-2">
												${deal.regular_price.toFixed(2)}
											</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										{#if deal.deal_url}
											<Button size="sm" href={deal.deal_url} target="_blank">
												<ExternalLink class="h-4 w-4" />
												Buy
											</Button>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>

	<AlertDialog.Root bind:open={confirmRemoveOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Remove Game</AlertDialog.Title>
				<AlertDialog.Description>
					Remove "{game.title}" from your watchlist? This cannot be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action onclick={removeGame}>Remove</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
