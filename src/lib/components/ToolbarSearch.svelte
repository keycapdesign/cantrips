<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		value: string;
		onValueChange: (value: string) => void;
	}

	let { value, onValueChange }: Props = $props();

	let expanded = $state(false);
	let inputRef = $state<HTMLInputElement | null>(null);

	async function expand() {
		expanded = true;
		await tick();
		inputRef?.focus();
	}

	function collapse() {
		onValueChange('');
		expanded = false;
	}

	function handleBlur() {
		if (!value) {
			expanded = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			collapse();
		}
	}
</script>

{#if expanded}
	<div class="flex items-center gap-1">
		<div class="relative">
			<Search class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:ref={inputRef}
				type="text"
				placeholder="Search games..."
				{value}
				oninput={(e) => onValueChange(e.currentTarget.value)}
				onblur={handleBlur}
				onkeydown={handleKeydown}
				class="h-8 w-36 sm:w-48 pl-7 text-sm"
			/>
		</div>
		{#if value}
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-6 w-6"
				onclick={() => {
					onValueChange('');
					inputRef?.focus();
				}}
			>
				<X class="h-3.5 w-3.5" />
			</Button>
		{/if}
	</div>
{:else}
	<Button variant="ghost" size="sm" onclick={expand}>
		<Search class="h-4 w-4" />
		<span class="hidden sm:inline">Search</span>
	</Button>
{/if}
