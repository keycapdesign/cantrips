import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import db from "../db";
import type { AppVariables } from "../types";

const deals = new Hono<{ Variables: AppVariables }>();

deals.use("/*", requireAuth);

// Latest best deal per game
deals.get("/latest", async (c) => {
  const rows = db
    .query(
      `
    SELECT g.id as game_id, g.title, g.boxart_url, g.itad_id,
           d.sale_price, d.regular_price, d.cut_percent, d.shop_name,
           d.deal_url, d.flag, d.received_at
    FROM games g
    INNER JOIN deals d ON d.id = (
      SELECT id FROM deals
      WHERE game_id = g.id
      ORDER BY sale_price ASC
      LIMIT 1
    )
    ORDER BY d.cut_percent DESC
  `
    )
    .all();
  return c.json(rows);
});

export default deals;
