import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireApproved } from '$lib/server/middleware';
import type { Game } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	await requireApproved(event);
	const db = event.locals.db;
	const id = event.params.id;

	const game = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first<Game>();
	if (!game) {
		return json({ error: 'Game not found' }, { status: 404 });
	}

	const { results: deals } = await db
		.prepare('SELECT * FROM deals WHERE game_id = ? ORDER BY received_at DESC')
		.bind(id)
		.all();

	return json({ ...game, deals });
};

export const DELETE: RequestHandler = async (event) => {
	await requireApproved(event);
	const db = event.locals.db;
	const id = event.params.id;

	const result = await db.prepare('DELETE FROM games WHERE id = ?').bind(id).run();

	if (result.meta.changes === 0) {
		return json({ error: 'Game not found' }, { status: 404 });
	}

	return json({ success: true });
};
