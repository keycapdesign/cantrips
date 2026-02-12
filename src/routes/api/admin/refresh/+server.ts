import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin, requireApproved } from '$lib/server/middleware';
import { priceRefreshJob } from '$lib/server/price-refresh';

export const GET: RequestHandler = async (event) => {
	await requireApproved(event);
	const db = event.locals.db;

	const row = await db
		.prepare('SELECT MAX(price_updated_at) as last_refresh FROM games')
		.first<{ last_refresh: string | null }>();

	return json({ last_refresh: row?.last_refresh ?? null });
};

export const POST: RequestHandler = async (event) => {
	await requireAdmin(event);
	const db = event.locals.db;
	const env = (event.platform as App.Platform).env;

	try {
		await priceRefreshJob(db, env.ITAD_API_KEY, env.DISCORD_DEALS_WEBHOOK);
		return json({ status: 'refresh complete' });
	} catch (error) {
		return json({ error: 'Refresh failed', details: String(error) }, { status: 500 });
	}
};
