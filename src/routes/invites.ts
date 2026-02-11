import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth";
import db from "../db";
import type { AppVariables } from "../types";
import type { InviteCode } from "../db/schema";

const invites = new Hono<{ Variables: AppVariables }>();

// Validate a code (public — used before OAuth on login page)
invites.get("/validate/:code", async (c) => {
  const code = c.req.param("code");
  const invite = db
    .query("SELECT id FROM invite_codes WHERE code = ? AND redeemed_by IS NULL")
    .get(code) as InviteCode | null;

  return c.json({ valid: !!invite });
});

// Redeem a code (requires auth — called after OAuth)
invites.post("/redeem", requireAuth, async (c) => {
  const user = c.get("user");
  const { code } = await c.req.json();

  if (!code) {
    return c.json({ error: "code is required" }, 400);
  }

  // Admins don't need invite codes
  if (user.role === "admin") {
    return c.json({ success: true });
  }

  // Check if already approved
  const existing = db
    .query("SELECT id FROM invite_codes WHERE redeemed_by = ?")
    .get(user.id);
  if (existing) {
    return c.json({ success: true });
  }

  const invite = db
    .query("SELECT id FROM invite_codes WHERE code = ? AND redeemed_by IS NULL")
    .get(code) as InviteCode | null;

  if (!invite) {
    return c.json({ error: "Invalid or already used invite code" }, 400);
  }

  db.query(
    "UPDATE invite_codes SET redeemed_by = ?, redeemed_at = datetime('now') WHERE id = ?"
  ).run(user.id, invite.id);

  return c.json({ success: true });
});

// Check if current user is approved
invites.get("/status", requireAuth, async (c) => {
  const user = c.get("user");

  if (user.role === "admin") {
    return c.json({ approved: true });
  }

  const invite = db
    .query("SELECT id FROM invite_codes WHERE redeemed_by = ?")
    .get(user.id);

  return c.json({ approved: !!invite });
});

// --- Admin routes below ---

// List all invite codes
invites.get("/", requireAdmin, async (c) => {
  const codes = db
    .query(`
      SELECT ic.*,
        creator.name as created_by_name,
        redeemer.name as redeemed_by_name
      FROM invite_codes ic
      LEFT JOIN user creator ON ic.created_by = creator.id
      LEFT JOIN user redeemer ON ic.redeemed_by = redeemer.id
      ORDER BY ic.created_at DESC
    `)
    .all();

  return c.json(codes);
});

// Generate new invite code(s)
invites.post("/", requireAdmin, async (c) => {
  const user = c.get("user");
  const { count = 1 } = await c.req.json().catch(() => ({ count: 1 }));

  const codes: string[] = [];
  const insert = db.query(
    "INSERT INTO invite_codes (code, created_by) VALUES (?, ?)"
  );

  for (let i = 0; i < Math.min(count, 20); i++) {
    const code = generateCode();
    insert.run(code, user.id);
    codes.push(code);
  }

  return c.json({ codes });
});

// Delete an unused invite code
invites.delete("/:id", requireAdmin, async (c) => {
  const id = c.req.param("id");

  const result = db
    .query("DELETE FROM invite_codes WHERE id = ? AND redeemed_by IS NULL")
    .run(id);

  if (result.changes === 0) {
    return c.json({ error: "Code not found or already redeemed" }, 400);
  }

  return c.json({ success: true });
});

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default invites;
