import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/middleware';

export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);
	const db = event.locals.db;
	const users = await event.locals.auth.api.listUsers({
		query: { limit: 100 },
		headers: event.request.headers
	});

	// Find which users have redeemed an invite code
	const { results: redeemed } = await db
		.prepare('SELECT DISTINCT redeemed_by FROM invite_codes WHERE redeemed_by IS NOT NULL')
		.all<{ redeemed_by: string }>();
	const redeemedSet = new Set(redeemed.map((r) => r.redeemed_by));

	const usersWithStatus = (users.users || []).map((u: any) => ({
		...u,
		approved: u.role === 'admin' || redeemedSet.has(u.id)
	}));

	return json({ users: usersWithStatus });
};
