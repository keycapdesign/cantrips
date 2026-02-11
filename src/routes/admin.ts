import { Hono } from "hono";
import { requireAdmin } from "../middleware/auth";
import { auth } from "../lib/auth";
import { priceRefreshJob } from "../jobs/price-refresh";
import type { AppVariables } from "../types";

const adminRoutes = new Hono<{ Variables: AppVariables }>();

adminRoutes.use("/*", requireAdmin);

// Trigger manual price refresh
adminRoutes.post("/refresh", async (c) => {
  try {
    await priceRefreshJob();
    return c.json({ status: "refresh complete" });
  } catch (error) {
    return c.json(
      { error: "Refresh failed", details: String(error) },
      500
    );
  }
});

// List users
adminRoutes.get("/users", async (c) => {
  const users = await auth.api.listUsers({
    query: { limit: 100 },
    headers: c.req.raw.headers,
  });
  return c.json(users);
});

// Change user role
adminRoutes.put("/users/:id/role", async (c) => {
  const userId = c.req.param("id");
  const { role } = await c.req.json();

  if (!role) {
    return c.json({ error: "role is required" }, 400);
  }

  await auth.api.setRole({
    body: { userId, role },
    headers: c.req.raw.headers,
  });
  return c.json({ success: true });
});

export default adminRoutes;
