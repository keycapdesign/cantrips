import { error, type RequestEvent } from '@sveltejs/kit';

export async function requireAuth(event: RequestEvent) {
	const session = await event.locals.auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) {
		error(401, 'Unauthorized');
	}

	return session;
}

export async function requireApproved(event: RequestEvent) {
	const session = await requireAuth(event);

	if (session.user.role !== 'admin') {
		const { results } = await event.locals.db
			.prepare('SELECT id FROM invite_codes WHERE redeemed_by = ?')
			.bind(session.user.id)
			.all();
		if (results.length === 0) {
			error(403, 'Invite code required');
		}
	}

	return session;
}

export async function requireAdmin(event: RequestEvent) {
	const session = await requireAuth(event);

	if (session.user.role !== 'admin') {
		error(403, 'Forbidden: admin access required');
	}

	return session;
}

export function requireCronSecret(event: RequestEvent) {
	const secret = event.request.headers.get('x-cron-secret');
	const expected = (event.platform as App.Platform).env.CRON_SECRET;

	if (!secret || secret !== expected) {
		error(401, 'Invalid cron secret');
	}
}
