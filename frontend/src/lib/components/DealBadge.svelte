<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';

	interface Props {
		cut: number;
		flag?: string | null;
	}

	let { cut, flag }: Props = $props();

	let colorClass = $derived.by(() => {
		if (flag === 'H' || flag === 'N') return 'bg-destructive/80 hover:bg-destructive/80';
		if (cut >= 75) return 'bg-primary hover:bg-primary';
		if (cut >= 50) return 'bg-primary/70 hover:bg-primary/70';
		if (cut >= 25) return 'bg-muted-foreground/70 hover:bg-muted-foreground/70';
		return 'bg-muted-foreground/50 hover:bg-muted-foreground/50';
	});
</script>

<Badge class={cn(colorClass, 'text-primary-foreground border-transparent')}>
	-{cut}%
	{#if flag === 'H' || flag === 'N'}
		<span title="Historical Low">*</span>
	{/if}
</Badge>
