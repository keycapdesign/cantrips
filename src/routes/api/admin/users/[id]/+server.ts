import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/middleware';

export const DELETE: RequestHandler = async (event) => {
	const session = await requireAdmin(event);
	const userId = event.params.id;

	if (userId === session.user.id) {
		return json({ error: 'Cannot delete yourself' }, { status: 400 });
	}

	await event.locals.auth.api.removeUser({
		body: { userId },
		headers: event.request.headers
	});

	return json({ success: true });
};
