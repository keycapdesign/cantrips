import { Hono } from "hono";

const webhooks = new Hono();

// Example: GitHub webhook
webhooks.post("/github", async (c) => {
  const payload = await c.req.json();
  const event = c.req.header("x-github-event");
  console.log(`📨 GitHub event: ${event}`);
  // Handle the event here
  return c.json({ received: true });
});

// Add more webhook endpoints as needed:
// webhooks.post("/stripe", async (c) => { ... })
// webhooks.post("/cheapshark", async (c) => { ... })

export default webhooks;