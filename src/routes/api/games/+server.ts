import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireApproved } from '$lib/server/middleware';
import { ITADClient } from '$lib/server/itad';
import type { Game } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	await requireApproved(event);
	const db = event.locals.db;

	const { results } = await db
		.prepare(
			`SELECT g.*, d.sale_price, d.regular_price, d.cut_percent, d.shop_name, d.deal_url
		FROM games g
		LEFT JOIN deals d ON d.id = (
			SELECT id FROM deals WHERE game_id = g.id ORDER BY received_at DESC LIMIT 1
		)
		ORDER BY g.title ASC`
		)
		.all();

	return json(results);
};

export const POST: RequestHandler = async (event) => {
	const session = await requireApproved(event);
	const db = event.locals.db;
	const env = (event.platform as App.Platform).env;
	const body = (await event.request.json()) as { itadId?: string; title?: string };
	const { itadId, title } = body;

	if (!itadId || !title) {
		return json({ error: 'itadId and title are required' }, { status: 400 });
	}

	const { results: existing } = await db
		.prepare('SELECT id FROM games WHERE itad_id = ?')
		.bind(itadId)
		.all();
	if (existing.length > 0) {
		return json({ error: 'Game already in watchlist' }, { status: 409 });
	}

	const itad = new ITADClient(env.ITAD_API_KEY);
	const [info, overview, prices, steamAppIds] = await Promise.all([
		itad.getGameInfo(itadId),
		itad.getOverview([itadId]),
		itad.getPrices([itadId]),
		itad.lookupSteamAppIds([itadId])
	]);

	const overviewData = overview[0];
	const priceData = prices[0];
	const steamAppId = steamAppIds.get(itadId) ?? null;

	const insertResult = await db
		.prepare(
			`INSERT INTO games (title, itad_id, slug, game_type, boxart_url, banner_url,
			release_date, tags, review_score, early_access, players_recent, players_peak,
			history_low, history_low_store, steam_app_id, added_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			info.title || title,
			itadId,
			info.slug || null,
			info.type || null,
			info.assets?.boxart || null,
			info.assets?.banner || null,
			info.releaseDate || null,
			info.tags ? JSON.stringify(info.tags) : null,
			info.reviews?.score ?? null,
			info.earlyAccess ? 1 : 0,
			info.players?.recent ?? null,
			info.players?.peak ?? null,
			overviewData?.lowest?.price?.amount ?? null,
			overviewData?.lowest?.shop?.name ?? null,
			steamAppId,
			session.user.id
		)
		.run();

	const gameId = insertResult.meta.last_row_id;

	if (priceData?.deals?.length) {
		const stmts = priceData.deals.map((deal) =>
			db
				.prepare(
					`INSERT INTO deals (game_id, sale_price, regular_price, cut_percent,
					shop_name, shop_id, deal_url, drm, platforms, flag, expires_at, received_at, source)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'poll')`
				)
				.bind(
					gameId,
					deal.price.amount,
					deal.regular.amount,
					deal.cut,
					deal.shop.name,
					deal.shop.id,
					deal.url,
					deal.drm?.length
						? deal.drm.map((d) => (typeof d === 'string' ? d : d.name)).join(', ')
						: null,
					deal.platforms?.length
						? deal.platforms.map((p) => (typeof p === 'string' ? p : p.name)).join(', ')
						: null,
					deal.flag || null,
					deal.expiry || null,
					deal.timestamp || null
				)
		);
		for (let i = 0; i < stmts.length; i += 100) {
			await db.batch(stmts.slice(i, i + 100));
		}
	}

	const game = await db
		.prepare('SELECT * FROM games WHERE id = ?')
		.bind(gameId)
		.first<Game>();

	return json({ success: true, game }, { status: 201 });
};
