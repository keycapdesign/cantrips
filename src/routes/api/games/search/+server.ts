import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireApproved } from '$lib/server/middleware';
import { ITADClient } from '$lib/server/itad';

export const GET: RequestHandler = async (event) => {
	await requireApproved(event);
	const env = (event.platform as App.Platform).env;
	const q = event.url.searchParams.get('q');

	if (!q) {
		return json({ error: "Query parameter 'q' is required" }, { status: 400 });
	}

	const itad = new ITADClient(env.ITAD_API_KEY);
	const results = await itad.searchGames(q, 10);
	return json(results);
};
