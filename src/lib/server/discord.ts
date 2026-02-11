import type { Game, Deal } from './db';

export async function sendDealNotification(webhookUrl: string, game: Game, deal: Deal) {
	if (!webhookUrl) return;

	const embed = {
		title: `${game.title} — ${deal.cut_percent}% off!`,
		description: `**$${deal.sale_price.toFixed(2)}** (was $${deal.regular_price.toFixed(2)}) at ${deal.shop_name}`,
		url: deal.deal_url || undefined,
		color: deal.flag === 'H' || deal.flag === 'N' ? 0xff4500 : 0x00b894,
		thumbnail: game.boxart_url ? { url: game.boxart_url } : undefined,
		fields: [
			deal.flag === 'H' || deal.flag === 'N'
				? { name: '\u{1F3C6}', value: 'New Historical Low!', inline: true }
				: null,
			deal.expires_at ? { name: 'Expires', value: deal.expires_at, inline: true } : null,
			{ name: 'DRM', value: deal.drm || 'Unknown', inline: true }
		].filter(Boolean),
		timestamp: new Date().toISOString()
	};

	await fetch(webhookUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ embeds: [embed] })
	});
}

export async function sendDealBatch(webhookUrl: string, games: Game[], deals: Deal[]) {
	if (!webhookUrl) return;

	const gameMap = new Map(games.map((g) => [g.id, g]));

	const embeds = deals
		.map((deal) => {
			const game = gameMap.get(deal.game_id);
			if (!game) return null;
			return {
				title: `${game.title} — ${deal.cut_percent}% off!`,
				description: `**$${deal.sale_price.toFixed(2)}** (was $${deal.regular_price.toFixed(2)}) at ${deal.shop_name}`,
				url: deal.deal_url || undefined,
				color: deal.flag === 'H' || deal.flag === 'N' ? 0xff4500 : 0x00b894,
				thumbnail: game.boxart_url ? { url: game.boxart_url } : undefined,
				timestamp: new Date().toISOString()
			};
		})
		.filter(Boolean);

	for (let i = 0; i < embeds.length; i += 10) {
		const batch = embeds.slice(i, i + 10);
		await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ embeds: batch })
		});
	}
}
