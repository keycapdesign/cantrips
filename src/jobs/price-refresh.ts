import db from "../db";
import { itad } from "../lib/itad";
import { sendDealNotification } from "../lib/discord";
import type { Game, Deal } from "../db/schema";

export async function priceRefreshJob() {
  console.log("Starting price refresh...");

  const games = db.query("SELECT * FROM games WHERE itad_id IS NOT NULL").all() as Game[];

  if (games.length === 0) {
    console.log("No games to refresh.");
    return;
  }

  const itadIds = games.map((g) => g.itad_id!);
  const gameByItadId = new Map(games.map((g) => [g.itad_id, g]));

  try {
    const priceData = await itad.getPrices(itadIds);

    const insertDeal = db.query(`
      INSERT INTO deals (game_id, sale_price, regular_price, cut_percent,
        shop_name, shop_id, deal_url, drm, platforms, flag, expires_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'poll')
    `);

    const notifyQueue: { game: Game; deal: Deal }[] = [];

    const refreshTransaction = db.transaction(() => {
      for (const priceItem of priceData) {
        const game = gameByItadId.get(priceItem.id);
        if (!game) continue;

        for (const deal of priceItem.deals) {
          const result = insertDeal.run(
            game.id,
            deal.price.amount,
            deal.regular.amount,
            deal.cut,
            deal.shop.name,
            deal.shop.id,
            deal.url,
            deal.drm?.length ? deal.drm.join(", ") : null,
            deal.platforms?.length ? JSON.stringify(deal.platforms) : null,
            deal.flag || null,
            deal.expiry || null
          );

          // Check if deal meets notification threshold
          const meetsThreshold =
            game.price_threshold === 0 ||
            deal.price.amount <= game.price_threshold;

          if (meetsThreshold && deal.cut >= 10) {
            const savedDeal = db
              .query("SELECT * FROM deals WHERE id = ?")
              .get(result.lastInsertRowid) as Deal;
            notifyQueue.push({ game, deal: savedDeal });
          }
        }
      }
    });

    refreshTransaction();

    // Send Discord notifications (outside transaction)
    // Only notify for the best deal per game
    const bestPerGame = new Map<number, { game: Game; deal: Deal }>();
    for (const item of notifyQueue) {
      const existing = bestPerGame.get(item.game.id);
      if (!existing || item.deal.sale_price < existing.deal.sale_price) {
        bestPerGame.set(item.game.id, item);
      }
    }

    for (const { game, deal } of bestPerGame.values()) {
      await sendDealNotification(game, deal);
    }

    console.log(
      `Price refresh complete. ${priceData.length} games processed, ${bestPerGame.size} notifications sent.`
    );
  } catch (error) {
    console.error("Price refresh failed:", error);
    throw error;
  }
}
