import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/middleware';
import type { InviteCode } from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
	const session = await requireAuth(event);
	const db = event.locals.db;
	const { code } = (await event.request.json()) as { code?: string };

	if (!code) {
		return json({ error: 'code is required' }, { status: 400 });
	}

	if (session.user.role === 'admin') {
		return json({ success: true });
	}

	const existing = await db
		.prepare('SELECT id FROM invite_codes WHERE redeemed_by = ?')
		.bind(session.user.id)
		.first();
	if (existing) {
		return json({ success: true });
	}

	const invite = await db
		.prepare('SELECT id FROM invite_codes WHERE code = ? AND redeemed_by IS NULL')
		.bind(code)
		.first<InviteCode>();

	if (!invite) {
		return json({ error: 'Invalid or already used invite code' }, { status: 400 });
	}

	await db
		.prepare("UPDATE invite_codes SET redeemed_by = ?, redeemed_at = datetime('now') WHERE id = ?")
		.bind(session.user.id, invite.id)
		.run();

	return json({ success: true });
};
