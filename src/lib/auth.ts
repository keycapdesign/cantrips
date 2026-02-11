import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { getMigrations } from "better-auth/db";
import db from "../db";

const isDev = process.env.NODE_ENV !== "production";

export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },
  plugins: [admin()],
  trustedOrigins: [
    "https://deals.spellslots.dev",
    ...(isDev ? ["http://localhost:5173"] : []),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-promote the first user to admin
          const count = db.query("SELECT COUNT(*) as count FROM user").get() as { count: number };
          if (count.count === 1) {
            db.query("UPDATE user SET role = 'admin' WHERE id = ?").run(user.id);
            console.log(`First user ${user.name} auto-promoted to admin`);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

export async function runAuthMigrations() {
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
  if (toBeCreated.length > 0 || toBeAdded.length > 0) {
    console.log("Running better-auth migrations...");
    await runMigrations();
    console.log("Migrations complete:", {
      tablesCreated: toBeCreated.map((t) => t.table),
      columnsAdded: toBeAdded.map((t) => t.table),
    });
  }
}
