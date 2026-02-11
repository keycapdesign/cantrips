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

	const stmts: D1PreparedStatement[] = [];
	const notifyQueue: { game: Game; dealData: Parameters<typeof db.prepare> }[] = [];

	for (const priceItem of priceData) {
		const game = gameByItadId.get(priceItem.id);
		if (!game) continue;

		for (const deal of priceItem.deals) {
			stmts.push(
				db
					.prepare(
						`INSERT INTO deals (game_id, sale_price, regular_price, cut_percent,
					shop_name, shop_id, deal_url, drm, platforms, flag, expires_at, source)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'poll')`
					)
					.bind(
						game.id,
						deal.price.amount,
						deal.regular.amount,
						deal.cut,
						deal.shop.name,
						deal.shop.id,
						deal.url,
						deal.drm?.length ? deal.drm.join(', ') : null,
						deal.platforms?.length ? JSON.stringify(deal.platforms) : null,
						deal.flag || null,
						deal.expiry || null
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
							drm: deal.drm?.length ? deal.drm.join(', ') : null,
							expires_at: deal.expiry
						} as Partial<Deal>
					});
				}
			}
		}
	}

	for (const { game, deal } of bestPerGame.values()) {
		await sendDealNotification(webhookUrl, game, deal as Deal);
	}

	console.log(
		`Price refresh complete. ${priceData.length} games processed, ${bestPerGame.size} notifications sent.`
	);
}
