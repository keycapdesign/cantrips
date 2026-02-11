import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCronSecret } from '$lib/server/middleware';
import { priceRefreshJob } from '$lib/server/price-refresh';

export const POST: RequestHandler = async (event) => {
	requireCronSecret(event);
	const db = event.locals.db;
	const env = (event.platform as App.Platform).env;

	try {
		await priceRefreshJob(db, env.ITAD_API_KEY, env.DISCORD_DEALS_WEBHOOK);
		return json({ status: 'refresh complete' });
	} catch (error) {
		return json({ error: 'Refresh failed', details: String(error) }, { status: 500 });
	}
};
