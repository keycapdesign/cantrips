import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const db = event.locals.db;
	const row = await db.prepare('SELECT COUNT(*) as count FROM user').first<{ count: number }>();
	return json({ needsSetup: !row || row.count === 0 });
};
