import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import db from "../db";

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

export const requireApproved = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Admins are always approved
  if (session.user.role !== "admin") {
    const invite = db
      .query("SELECT id FROM invite_codes WHERE redeemed_by = ?")
      .get(session.user.id);
    if (!invite) {
      return c.json({ error: "Invite code required" }, 403);
    }
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

export const requireAdmin = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (session.user.role !== "admin") {
    return c.json({ error: "Forbidden: admin access required" }, 403);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});
