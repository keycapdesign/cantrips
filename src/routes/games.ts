import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import db from "../db";
import { itad } from "../lib/itad";
import type { AppVariables } from "../types";
import type { Game } from "../db/schema";

const games = new Hono<{ Variables: AppVariables }>();

games.use("/*", requireAuth);

// Search ITAD (proxy to avoid exposing API key)
games.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "Query parameter 'q' is required" }, 400);
  const results = await itad.searchGames(q, 10);
  return c.json(results);
});

// List all tracked games with latest deal info
games.get("/", async (c) => {
  const rows = db
    .query(
      `
    SELECT g.*, d.sale_price, d.regular_price, d.cut_percent, d.shop_name, d.deal_url
    FROM games g
    LEFT JOIN deals d ON d.id = (
      SELECT id FROM deals WHERE game_id = g.id ORDER BY received_at DESC LIMIT 1
    )
    ORDER BY g.title ASC
  `
    )
    .all();
  return c.json(rows);
});

// Get single game with deal history
games.get("/:id", async (c) => {
  const id = c.req.param("id");
  const game = db.query("SELECT * FROM games WHERE id = ?").get(id) as Game | null;
  if (!game) return c.json({ error: "Game not found" }, 404);

  const deals = db
    .query("SELECT * FROM deals WHERE game_id = ? ORDER BY received_at DESC")
    .all(id);

  return c.json({ ...game, deals });
});

// Get price history from ITAD (proxied)
games.get("/:id/history", async (c) => {
  const id = c.req.param("id");
  const game = db.query("SELECT itad_id FROM games WHERE id = ?").get(id) as {
    itad_id: string;
  } | null;
  if (!game?.itad_id) return c.json({ error: "Game not found" }, 404);

  // ITAD defaults to 3 months — only pass since if explicitly requested
  const since = c.req.query("since");
  const entries = await itad.getHistory(game.itad_id, since);

  // Group flat entries by shop for the chart
  const shopMap = new Map<number, { shop: { id: number; name: string }; price: { amount: number; timestamp: number }[] }>();
  for (const entry of entries) {
    let group = shopMap.get(entry.shop.id);
    if (!group) {
      group = { shop: entry.shop, price: [] };
      shopMap.set(entry.shop.id, group);
    }
    group.price.push({
      amount: entry.deal.price.amount,
      timestamp: Math.floor(new Date(entry.timestamp).getTime() / 1000),
    });
  }

  // Sort prices chronologically within each shop
  const history = [...shopMap.values()];
  for (const group of history) {
    group.price.sort((a, b) => a.timestamp - b.timestamp);
  }

  return c.json(history);
});

// Add game to watchlist
games.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { itadId, title } = body;

  if (!itadId || !title) {
    return c.json({ error: "itadId and title are required" }, 400);
  }

  // Check if already tracked
  const existing = db
    .query("SELECT id FROM games WHERE itad_id = ?")
    .get(itadId);
  if (existing) {
    return c.json({ error: "Game already in watchlist" }, 409);
  }

  // Fetch game info from ITAD
  const [info, overview] = await Promise.all([
    itad.getGameInfo(itadId),
    itad.getOverview([itadId]),
  ]);

  const overviewData = overview[0];

  // Insert game
  const result = db
    .query(
      `
    INSERT INTO games (title, itad_id, slug, game_type, boxart_url, banner_url,
      release_date, tags, review_score, early_access, players_recent, players_peak,
      history_low, history_low_store, added_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
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
      user.id
    );

  const gameId = result.lastInsertRowid;

  // Store initial deal snapshot if there's a current price
  if (overviewData?.current) {
    const curr = overviewData.current;
    db.query(
      `
      INSERT INTO deals (game_id, sale_price, regular_price, cut_percent, shop_name, deal_url, source)
      VALUES (?, ?, ?, ?, ?, ?, 'poll')
    `
    ).run(
      gameId,
      curr.price.amount,
      curr.regular.amount,
      curr.cut,
      curr.shop.name,
      curr.url
    );
  }

  const game = db.query("SELECT * FROM games WHERE id = ?").get(gameId);
  return c.json({ success: true, game }, 201);
});

// Remove game from watchlist
games.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const result = db.query("DELETE FROM games WHERE id = ?").run(id);
  if (result.changes === 0) return c.json({ error: "Game not found" }, 404);
  return c.json({ success: true });
});

export default games;
