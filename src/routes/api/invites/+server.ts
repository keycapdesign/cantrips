import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/middleware';

export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);
	const db = event.locals.db;

	const { results } = await db
		.prepare(
			`SELECT ic.*,
			creator.name as created_by_name,
			redeemer.name as redeemed_by_name
		FROM invite_codes ic
		LEFT JOIN user creator ON ic.created_by = creator.id
		LEFT JOIN user redeemer ON ic.redeemed_by = redeemer.id
		ORDER BY ic.created_at DESC`
		)
		.all();

	return json(results);
};

export const POST: RequestHandler = async (event) => {
	const session = await requireAdmin(event);
	const db = event.locals.db;
	const { count = 1 } = (await event.request.json().catch(() => ({ count: 1 }))) as {
		count: number;
	};

	const codes: string[] = [];
	const stmts: D1PreparedStatement[] = [];

	for (let i = 0; i < Math.min(count, 20); i++) {
		const code = generateCode();
		stmts.push(
			db
				.prepare('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)')
				.bind(code, session.user.id)
		);
		codes.push(code);
	}

	if (stmts.length > 0) {
		await db.batch(stmts);
	}

	return json({ codes });
};

function generateCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}
