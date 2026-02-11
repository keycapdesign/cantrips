import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createAuth(db: D1Database, env: Env) {
	const d1Drizzle = drizzle(db, { schema });

	return betterAuth({
		database: drizzleAdapter(d1Drizzle, { provider: 'sqlite', schema }),
		basePath: '/api/auth',
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		socialProviders: {
			discord: {
				clientId: env.DISCORD_CLIENT_ID,
				clientSecret: env.DISCORD_CLIENT_SECRET
			}
		},
		plugins: [admin()],
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						const { results } = await db
							.prepare('SELECT COUNT(*) as count FROM user')
							.all<{ count: number }>();
						if (results[0]?.count === 1) {
							await db
								.prepare('UPDATE user SET role = ? WHERE id = ?')
								.bind('admin', user.id)
								.run();
							console.log(`First user ${user.name} auto-promoted to admin`);
						}
					}
				}
			}
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
