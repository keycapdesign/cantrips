import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendDealNotification } from '$lib/server/discord';
import type { Game, Deal } from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
	const db = event.locals.db;
	const env = (event.platform as App.Platform).env;
	const itadEvent = event.request.headers.get('ITAD-Event');
	const hookId = event.request.headers.get('ITAD-Hook-ID');

	console.log(`ITAD webhook: event=${itadEvent}, hookId=${hookId}`);

	if (itadEvent === 'ping') {
		return json({ ok: true });
	}

	if (itadEvent === 'notification-waitlist') {
		const payload = (await event.request.json()) as {
			id: string;
			price?: { amount: number };
			regular?: { amount: number };
			cut?: number;
			shop?: { id: number; name: string };
			url?: string;
			drm?: Array<string | { id: number; name: string }>;
			platforms?: Array<string | { id: number; name: string }>;
			flag?: string;
			expiry?: string;
		};

		const game = await db
			.prepare('SELECT * FROM games WHERE itad_id = ?')
			.bind(payload.id)
			.first<Game>();

		if (!game) {
			console.log(`ITAD webhook: unknown game ${payload.id}`);
			return json({ ok: true });
		}

		const result = await db
			.prepare(
				`INSERT INTO deals (game_id, sale_price, regular_price, cut_percent,
				shop_name, shop_id, deal_url, drm, platforms, flag, expires_at, source)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'webhook')`
			)
			.bind(
				game.id,
				payload.price?.amount ?? 0,
				payload.regular?.amount ?? 0,
				payload.cut ?? 0,
				payload.shop?.name ?? 'Unknown',
				payload.shop?.id ?? null,
				payload.url ?? null,
				payload.drm?.length
					? payload.drm.map((d) => (typeof d === 'string' ? d : d.name)).join(', ')
					: null,
				payload.platforms?.length
					? payload.platforms.map((p) => (typeof p === 'string' ? p : p.name)).join(', ')
					: null,
				payload.flag ?? null,
				payload.expiry ?? null
			)
			.run();

		const shouldNotify =
			game.price_threshold === 0 || (payload.price?.amount ?? Infinity) <= game.price_threshold;

		if (shouldNotify) {
			const deal = await db
				.prepare('SELECT * FROM deals WHERE id = ?')
				.bind(result.meta.last_row_id)
				.first<Deal>();

			if (deal) {
				await sendDealNotification(env.DISCORD_DEALS_WEBHOOK, game, deal);
			}
		}

		return json({ ok: true });
	}

	return json({ error: 'Unknown event' }, { status: 400 });
};
