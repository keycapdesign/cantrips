import { Hono } from "hono";
import { auth } from "../lib/auth";
import { isAllowedOrigin } from "../lib/cors";

const authRoutes = new Hono();

authRoutes.all("/*", async (c) => {
  const origin = c.req.header("origin");

  // Handle CORS preflight
  if (c.req.method === "OPTIONS") {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "600",
    };
    if (isAllowedOrigin(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
    return new Response(null, { status: 204, headers });
  }

  // Pass to better-auth handler
  const response = await auth.handler(c.req.raw);

  // Clone response with CORS headers (auth.handler returns immutable Response)
  if (isAllowedOrigin(origin)) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
    newResponse.headers.set("Access-Control-Allow-Credentials", "true");
    return newResponse;
  }

  return response;
});

export default authRoutes;
