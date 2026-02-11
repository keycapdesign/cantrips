import type { Auth } from '$lib/server/auth';

declare global {
	interface Env {
		DB: D1Database;
		BETTER_AUTH_SECRET: string;
		BETTER_AUTH_URL: string;
		DISCORD_CLIENT_ID: string;
		DISCORD_CLIENT_SECRET: string;
		DISCORD_DEALS_WEBHOOK: string;
		ITAD_API_KEY: string;
		CRON_SECRET: string;
	}

	namespace App {
		interface Locals {
			db: D1Database;
			auth: Auth;
		}
		interface Platform {
			env: Env;
		}
	}
}

export {};
