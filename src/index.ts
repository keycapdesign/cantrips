import { Hono } from "hono";
import { logger } from "hono/logger";
import { scheduledJobs } from "./scheduler";
import webhooks from "./routes/webhooks";
import health from "./routes/health";

const app = new Hono();

// Middleware
app.use("*", logger());

// Routes
app.route("/webhooks", webhooks);
app.route("/", health);

// Start scheduled jobs
scheduledJobs();

console.log("🔮 cantrip running on port 3000");

export default {
  port: 3000,
  fetch: app.fetch,
};