import { Hono } from "hono";
import db from "../db";
import { sendDealNotification } from "../lib/discord";
import type { Game } from "../db/schema";

const webhooks = new Hono();

// Example: GitHub webhook
webhooks.post("/github", async (c) => {
  const payload = await c.req.json();
  const event = c.req.header("x-github-event");
  console.log(`GitHub event: ${event}`);
  return c.json({ received: true });
});

// ITAD Waitlist webhook
webhooks.post("/itad", async (c) => {
  const event = c.req.header("ITAD-Event");
  const hookId = c.req.header("ITAD-Hook-ID");

  console.log(`ITAD webhook: event=${event}, hookId=${hookId}`);

  if (event === "ping") {
    return c.json({ ok: true });
  }

  if (event === "notification-waitlist") {
    const payload = await c.req.json();

    // Look up the game by ITAD ID
    const game = db
      .query("SELECT * FROM games WHERE itad_id = ?")
      .get(payload.id) as Game | null;

    if (!game) {
      console.log(`ITAD webhook: unknown game ${payload.id}`);
      return c.json({ ok: true });
    }

    // Store deal snapshot
    const result = db
      .query(
        `
      INSERT INTO deals (game_id, sale_price, regular_price, cut_percent,
        shop_name, shop_id, deal_url, drm, platforms, flag, expires_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'webhook')
    `
      )
      .run(
        game.id,
        payload.price?.amount ?? 0,
        payload.regular?.amount ?? 0,
        payload.cut ?? 0,
        payload.shop?.name ?? "Unknown",
        payload.shop?.id ?? null,
        payload.url ?? null,
        payload.drm ? JSON.stringify(payload.drm) : null,
        payload.platforms ? JSON.stringify(payload.platforms) : null,
        payload.flag ?? null,
        payload.expiry ?? null
      );

    // Check threshold and send Discord notification
    const shouldNotify =
      game.price_threshold === 0 ||
      (payload.price?.amount ?? Infinity) <= game.price_threshold;

    if (shouldNotify) {
      const deal = db
        .query("SELECT * FROM deals WHERE id = ?")
        .get(result.lastInsertRowid);
      if (deal) {
        await sendDealNotification(game, deal as any);
      }
    }

    return c.json({ ok: true });
  }

  return c.json({ error: "Unknown event" }, 400);
});

export default webhooks;