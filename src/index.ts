import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { scheduledJobs } from "./scheduler";
import db from "./db";
import { initSchema } from "./db/schema";
import { runAuthMigrations } from "./lib/auth";
import webhooks from "./routes/webhooks";
import health from "./routes/health";
import authRoutes from "./routes/auth";
import games from "./routes/games";
import deals from "./routes/deals";
import adminRoutes from "./routes/admin";
import invites from "./routes/invites";
import { allowedOrigins } from "./lib/cors";
import { requireApproved } from "./middleware/auth";

const app = new Hono();

const apiCors = cors({
  origin: allowedOrigins,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  maxAge: 600,
});

// CORS for non-auth API routes (auth handles its own CORS)
app.use("/api/games/*", apiCors);
app.use("/api/deals/*", apiCors);
app.use("/api/admin/*", apiCors);
app.use("/api/invites/*", apiCors);

// Require approved invite for main app routes
app.use("/api/games/*", requireApproved);
app.use("/api/deals/*", requireApproved);

// Middleware
app.use("*", logger());

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/games", games);
app.route("/api/deals", deals);
app.route("/api/admin", adminRoutes);
app.route("/api/invites", invites);
app.route("/webhooks", webhooks);
app.route("/", health);

// Initialize database and start jobs
initSchema(db);
await runAuthMigrations();
scheduledJobs();

console.log("cantrips running on port 3000");

export default {
  port: 3000,
  fetch: app.fetch,
};
