import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const db = event.locals.db;
	const code = event.params.code;

	const invite = await db
		.prepare('SELECT id FROM invite_codes WHERE code = ? AND redeemed_by IS NULL')
		.bind(code)
		.first();

	return json({ valid: !!invite });
};
