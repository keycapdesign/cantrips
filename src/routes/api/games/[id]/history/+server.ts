import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireApproved } from '$lib/server/middleware';
import { ITADClient } from '$lib/server/itad';

export const GET: RequestHandler = async (event) => {
	await requireApproved(event);
	const db = event.locals.db;
	const env = (event.platform as App.Platform).env;
	const id = event.params.id;

	const game = await db
		.prepare('SELECT itad_id FROM games WHERE id = ?')
		.bind(id)
		.first<{ itad_id: string }>();

	if (!game?.itad_id) {
		return json({ error: 'Game not found' }, { status: 404 });
	}

	const itad = new ITADClient(env.ITAD_API_KEY);
	const since = event.url.searchParams.get('since') || undefined;
	const entries = await itad.getHistory(game.itad_id, since);

	const shopMap = new Map<
		number,
		{ shop: { id: number; name: string }; price: { amount: number; timestamp: number }[] }
	>();
	for (const entry of entries) {
		let group = shopMap.get(entry.shop.id);
		if (!group) {
			group = { shop: entry.shop, price: [] };
			shopMap.set(entry.shop.id, group);
		}
		group.price.push({
			amount: entry.deal.price.amount,
			timestamp: Math.floor(new Date(entry.timestamp).getTime() / 1000)
		});
	}

	const history = [...shopMap.values()];
	for (const group of history) {
		group.price.sort((a, b) => a.timestamp - b.timestamp);
	}

	return json(history);
};
