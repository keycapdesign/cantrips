import { ITADClient } from './itad';
import { sendDealNotification } from './discord';
import type { Game, Deal } from './db';

export async function priceRefreshJob(db: D1Database, apiKey: string, webhookUrl: string) {
	console.log('Starting price refresh...');

	const { results: games } = await db
		.prepare('SELECT * FROM games WHERE itad_id IS NOT NULL')
		.all<Game>();

	if (games.length === 0) {
		console.log('No games to refresh.');
		return;
	}

	const itad = new ITADClient(apiKey);
	const itadIds = games.map((g) => g.itad_id!);
	const gameByItadId = new Map(games.map((g) => [g.itad_id, g]));

	const priceData = await itad.getPrices(itadIds);

	// Snapshot previous best prices so we only notify on price drops
	const { results: prevBestRows } = await db
		.prepare('SELECT game_id, MIN(sale_price) as best_price FROM deals GROUP BY game_id')
		.all<{ game_id: number; best_price: number }>();
	const prevBestPrice = new Map(prevBestRows.map((r) => [r.game_id, r.best_price]));

	// Delete existing deals for all refreshed games before inserting fresh data
	const deleteStmts = games.map((g) =>
		db.prepare('DELETE FROM deals WHERE game_id = ?').bind(g.id)
	);
	for (let i = 0; i < deleteStmts.length; i += 100) {
		await db.batch(deleteStmts.slice(i, i + 100));
	}

	const stmts: D1PreparedStatement[] = [];

	for (const priceItem of priceData) {
		const game = gameByItadId.get(priceItem.id);
		if (!game) continue;

		for (const deal of priceItem.deals) {
			stmts.push(
				db
					.prepare(
						`INSERT INTO deals (game_id, sale_price, regular_price, cut_percent,
					shop_name, shop_id, deal_url, drm, platforms, flag, expires_at, received_at, source)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'poll')`
					)
					.bind(
						game.id,
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
		}
	}

	// Execute in batches of 100 (D1 batch limit)
	for (let i = 0; i < stmts.length; i += 100) {
		await db.batch(stmts.slice(i, i + 100));
	}

	// Find best deals per game for notifications
	const bestPerGame = new Map<number, { game: Game; price: number; deal: any }>();
	for (const priceItem of priceData) {
		const game = gameByItadId.get(priceItem.id);
		if (!game) continue;

		for (const deal of priceItem.deals) {
			const meetsThreshold =
				game.price_threshold === 0 || deal.price.amount <= game.price_threshold;

			if (meetsThreshold && deal.cut >= 10) {
				const existing = bestPerGame.get(game.id);
				if (!existing || deal.price.amount < existing.price) {
					bestPerGame.set(game.id, {
						game,
						price: deal.price.amount,
						deal: {
							sale_price: deal.price.amount,
							regular_price: deal.regular.amount,
							cut_percent: deal.cut,
							shop_name: deal.shop.name,
							deal_url: deal.url,
							flag: deal.flag,
							drm: deal.drm?.length
								? deal.drm.map((d) => (typeof d === 'string' ? d : d.name)).join(', ')
								: null,
							expires_at: deal.expiry
						} as Partial<Deal>
					});
				}
			}
		}
	}

	let notified = 0;
	for (const { game, price, deal } of bestPerGame.values()) {
		const prev = prevBestPrice.get(game.id);
		// Only notify if this is a new deal (no previous data) or the price dropped
		if (prev === undefined || price < prev) {
			await sendDealNotification(webhookUrl, game, deal as Deal);
			notified++;
		}
	}

	// Backfill missing banner URLs
	const missingBanners = games.filter((g) => !g.banner_url && g.itad_id);
	let bannersUpdated = 0;
	for (const game of missingBanners) {
		try {
			const info = await itad.getGameInfo(game.itad_id!);
			const banner = info.assets?.banner || null;
			if (banner) {
				await db
					.prepare('UPDATE games SET banner_url = ? WHERE id = ?')
					.bind(banner, game.id)
					.run();
				bannersUpdated++;
			}
		} catch {
			// Skip failures silently -- will retry next refresh
		}
	}

	console.log(
		`Price refresh complete. ${priceData.length} games processed, ${notified} notifications sent, ${bannersUpdated} banners backfilled.`
	);
}
