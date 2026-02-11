import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/middleware';

export const PUT: RequestHandler = async (event) => {
	await requireAdmin(event);
	const userId = event.params.id;
	const { role } = (await event.request.json()) as { role?: 'admin' | 'user' };

	if (!role) {
		return json({ error: 'role is required' }, { status: 400 });
	}

	await event.locals.auth.api.setRole({
		body: { userId, role },
		headers: event.request.headers
	});

	return json({ success: true });
};
