import { createAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

export async function handle({ event, resolve }) {
	if (building) {
		return resolve(event);
	}

	if (!event.platform?.env) {
		console.error('event.platform.env is not available — check wrangler.jsonc');
		return resolve(event);
	}

	const env = event.platform.env;
	const db = env.DB;

	event.locals.db = db;
	event.locals.auth = createAuth(db, env);

	return svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
}
