import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/middleware';

export const DELETE: RequestHandler = async (event) => {
	await requireAdmin(event);
	const db = event.locals.db;
	const id = event.params.id;

	const result = await db
		.prepare('DELETE FROM invite_codes WHERE id = ? AND redeemed_by IS NULL')
		.bind(id)
		.run();

	if (result.meta.changes === 0) {
		return json({ error: 'Code not found or already redeemed' }, { status: 400 });
	}

	return json({ success: true });
};
