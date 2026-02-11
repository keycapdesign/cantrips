import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireApproved } from '$lib/server/middleware';

export const GET: RequestHandler = async (event) => {
	await requireApproved(event);
	const db = event.locals.db;

	const { results } = await db
		.prepare(
			`SELECT g.id as game_id, g.title, g.boxart_url, g.itad_id,
				d.sale_price, d.regular_price, d.cut_percent, d.shop_name,
				d.deal_url, d.flag, d.received_at
		FROM games g
		INNER JOIN deals d ON d.id = (
			SELECT id FROM deals
			WHERE game_id = g.id
			ORDER BY sale_price ASC
			LIMIT 1
		)
		ORDER BY d.cut_percent DESC`
		)
		.all();

	return json(results);
};
