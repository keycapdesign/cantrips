<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import Check from '@lucide/svelte/icons/check';

	interface Props {
		sortField: string;
		sortDesc: boolean;
		onSortChange: (field: string, desc: boolean) => void;
	}

	let { sortField, sortDesc, onSortChange }: Props = $props();

	let open = $state(false);

	const sortOptions = [
		{ field: 'title', label: 'Name', defaultDesc: false },
		{ field: 'sale_price', label: 'Price', defaultDesc: false },
		{ field: 'cut_percent', label: 'Discount', defaultDesc: true },
		{ field: 'created_at', label: 'Recently Added', defaultDesc: true },
		{ field: 'history_low', label: 'All-time Low', defaultDesc: false },
		{ field: 'shop_name', label: 'Shop', defaultDesc: false }
	];

	function handleSelect(opt: (typeof sortOptions)[0]) {
		if (sortField === opt.field) {
			onSortChange(opt.field, !sortDesc);
		} else {
			onSortChange(opt.field, opt.defaultDesc);
		}
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet children()}
			<Button variant="ghost" size="sm">
				<ArrowUpDown class="h-4 w-4" />
				Sort
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-48 p-0" align="end">
		<Command.Root>
			<Command.Input placeholder="Search sorts..." />
			<Command.List>
				<Command.Empty>No sort option found.</Command.Empty>
				<Command.Group heading="Sort by">
					{#each sortOptions as opt (opt.field)}
						<Command.Item value={opt.label} onSelect={() => handleSelect(opt)}>
							<Check class="h-4 w-4 {sortField === opt.field ? 'opacity-100' : 'opacity-0'}" />
							{opt.label}
							{#if sortField === opt.field}
								{#if sortDesc}
									<ArrowDown class="ml-auto h-3.5 w-3.5" />
								{:else}
									<ArrowUp class="ml-auto h-3.5 w-3.5" />
								{/if}
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
