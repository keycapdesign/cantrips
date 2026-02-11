<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import Check from '@lucide/svelte/icons/check';

	interface Props {
		filterStatus: string[];
		filterShops: string[];
		filterTags: string[];
		availableShops: string[];
		availableTags: string[];
		onStatusChange: (statuses: string[]) => void;
		onShopsChange: (shops: string[]) => void;
		onTagsChange: (tags: string[]) => void;
	}

	let {
		filterStatus,
		filterShops,
		filterTags,
		availableShops,
		availableTags,
		onStatusChange,
		onShopsChange,
		onTagsChange
	}: Props = $props();

	const statusOptions = ['Released', 'Early Access', 'Upcoming', 'Release TBA'];

	let activeCount = $derived(filterStatus.length + filterShops.length + filterTags.length);

	function toggleStatus(status: string) {
		if (filterStatus.includes(status)) {
			onStatusChange(filterStatus.filter((s) => s !== status));
		} else {
			onStatusChange([...filterStatus, status]);
		}
	}

	function toggleShop(shop: string) {
		if (filterShops.includes(shop)) {
			onShopsChange(filterShops.filter((s) => s !== shop));
		} else {
			onShopsChange([...filterShops, shop]);
		}
	}

	function toggleTag(tag: string) {
		if (filterTags.includes(tag)) {
			onTagsChange(filterTags.filter((t) => t !== tag));
		} else {
			onTagsChange([...filterTags, tag]);
		}
	}

	function clearAll() {
		onStatusChange([]);
		onShopsChange([]);
		onTagsChange([]);
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet children()}
			<Button variant="ghost" size="sm">
				<ListFilter class="h-4 w-4" />
				Filter
				{#if activeCount > 0}
					<Badge variant="secondary" class="ml-0.5 h-5 px-1.5 text-xs">{activeCount}</Badge>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-56 p-0" align="end">
		<Command.Root>
			<Command.Input placeholder="Search filters..." />
			<Command.List>
				<Command.Empty>No filter found.</Command.Empty>
				<Command.Group heading="Status">
					{#each statusOptions as status (status)}
						<Command.Item value={status} onSelect={() => toggleStatus(status)}>
							<Check
								class="h-4 w-4 {filterStatus.includes(status) ? 'opacity-100' : 'opacity-0'}"
							/>
							{status}
						</Command.Item>
					{/each}
				</Command.Group>

				{#if availableShops.length > 0}
					<Command.Separator />
					<Command.Group heading="Shop">
						{#each availableShops as shop (shop)}
							<Command.Item value={shop} onSelect={() => toggleShop(shop)}>
								<Check
									class="h-4 w-4 {filterShops.includes(shop) ? 'opacity-100' : 'opacity-0'}"
								/>
								{shop}
							</Command.Item>
						{/each}
					</Command.Group>
				{/if}

				{#if availableTags.length > 0}
					<Command.Separator />
					<Command.Group heading="Tags">
						{#each availableTags as tag (tag)}
							<Command.Item value={tag} onSelect={() => toggleTag(tag)}>
								<Check
									class="h-4 w-4 {filterTags.includes(tag) ? 'opacity-100' : 'opacity-0'}"
								/>
								{tag}
							</Command.Item>
						{/each}
					</Command.Group>
				{/if}
			</Command.List>

			{#if activeCount > 0}
				<div class="border-t p-1">
					<Button variant="ghost" size="sm" class="w-full" onclick={clearAll}>
						Clear all filters
					</Button>
				</div>
			{/if}
		</Command.Root>
	</Popover.Content>
</Popover.Root>
