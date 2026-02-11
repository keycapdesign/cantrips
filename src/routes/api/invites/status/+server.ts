import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/middleware';

export const GET: RequestHandler = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;

	if (session.user.role === 'admin') {
		return json({ approved: true });
	}

	const invite = await db
		.prepare('SELECT id FROM invite_codes WHERE redeemed_by = ?')
		.bind(session.user.id)
		.first();

	return json({ approved: !!invite });
};
