<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import 'chartjs-adapter-date-fns';

	Chart.register(...registerables);

	interface Props {
		history: Array<{
			shop: { id: number; name: string };
			price: Array<{ amount: number; timestamp: number }>;
		}>;
	}

	let { history }: Props = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		renderChart();
		return () => chart?.destroy();
	});

	$effect(() => {
		if (history && canvas) {
			renderChart();
		}
	});

	function getCssVar(name: string): string {
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	}

	function renderChart() {
		chart?.destroy();

		// Read chart colors from CSS custom properties
		const colors = [
			getCssVar('--chart-1'),
			getCssVar('--chart-2'),
			getCssVar('--chart-3'),
			getCssVar('--chart-4'),
			getCssVar('--chart-5')
		].map((c) => (c.startsWith('oklch') ? c : `oklch(${c})`));

		const mutedFg = getCssVar('--muted-foreground');
		const tickColor = mutedFg.startsWith('oklch') ? mutedFg : `oklch(${mutedFg})`;
		const borderColor = getCssVar('--border');
		const gridColor = borderColor.startsWith('oklch') ? borderColor : `oklch(${borderColor})`;
		const fgColor = getCssVar('--foreground');
		const legendColor = fgColor.startsWith('oklch') ? fgColor : `oklch(${fgColor})`;

		const datasets = history.map((shopData, i) => ({
			label: shopData.shop.name,
			data: shopData.price.map((p) => ({
				x: p.timestamp * 1000,
				y: p.amount
			})),
			borderColor: colors[i % colors.length],
			backgroundColor: 'transparent',
			pointRadius: 0,
			borderWidth: 2,
			tension: 0.1
		}));

		chart = new Chart(canvas, {
			type: 'line',
			data: { datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						type: 'time',
						time: { unit: 'month' },
						ticks: { color: tickColor },
						grid: { color: gridColor }
					},
					y: {
						ticks: {
							color: tickColor,
							callback: (val) => `$${val}`
						},
						grid: { color: gridColor }
					}
				},
				plugins: {
					legend: {
						labels: { color: legendColor }
					},
					tooltip: {
						callbacks: {
							label: (ctx) =>
								`${ctx.dataset.label}: $${ctx.parsed.y?.toFixed(2) ?? 'N/A'}`
						}
					}
				}
			}
		});
	}
</script>

<div class="w-full h-64">
	<canvas bind:this={canvas}></canvas>
</div>
