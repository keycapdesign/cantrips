const ITAD_BASE = 'https://api.isthereanydeal.com';

export interface ITADSearchResult {
	id: string;
	slug: string;
	title: string;
	type: string | null;
	mature: boolean;
	assets: {
		boxart: string;
		banner145: string;
		banner300: string;
		banner400: string;
		banner600: string;
	} | null;
}

export interface ITADGameInfo {
	id: string;
	slug: string;
	title: string;
	type: string | null;
	reviews: { score: number; count: number } | null;
	urls: { game: string } | null;
	assets: { boxart: string; banner: string } | null;
	earlyAccess: boolean;
	tags: string[];
	developers: string[];
	publishers: string[];
	releaseDate: string | null;
	players: { recent: number; day: number; week: number; peak: number } | null;
}

export interface ITADOverviewItem {
	id: string;
	current?: {
		price: { amount: number; currency: string };
		regular: { amount: number; currency: string };
		cut: number;
		shop: { id: number; name: string };
		url: string;
	};
	lowest?: {
		price: { amount: number; currency: string };
		regular: { amount: number; currency: string };
		cut: number;
		shop: { id: number; name: string };
		url: string;
	};
	bundled: number;
	urls?: { game: string };
}

export interface ITADPriceItem {
	id: string;
	deals: Array<{
		shop: { id: number; name: string };
		price: { amount: number; amountInt: number; currency: string };
		regular: { amount: number; amountInt: number; currency: string };
		cut: number;
		voucher: string | null;
		flag: string | null;
		drm: Array<string | { id: number; name: string }>;
		platforms: Array<string | { id: number; name: string }>;
		url: string;
		timestamp: string;
		expiry: string | null;
	}>;
}

export interface ITADHistoryEntry {
	timestamp: string;
	shop: { id: number; name: string };
	deal: {
		price: { amount: number; amountInt: number; currency: string };
		regular: { amount: number; amountInt: number; currency: string };
		cut: number;
	};
}

export class ITADClient {
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	private params(extra?: Record<string, string>): URLSearchParams {
		return new URLSearchParams({ key: this.apiKey, ...extra });
	}

	async searchGames(title: string, limit = 20): Promise<ITADSearchResult[]> {
		const params = this.params({ title, results: String(limit) });
		const res = await fetch(`${ITAD_BASE}/games/search/v1?${params}`);
		if (!res.ok) throw new Error(`ITAD search failed: ${res.status}`);
		return res.json();
	}

	async getGameInfo(itadId: string): Promise<ITADGameInfo> {
		const params = this.params({ id: itadId });
		const res = await fetch(`${ITAD_BASE}/games/info/v2?${params}`);
		if (!res.ok) throw new Error(`ITAD info failed: ${res.status}`);
		return res.json();
	}

	async getOverview(itadIds: string[]): Promise<ITADOverviewItem[]> {
		const results: ITADOverviewItem[] = [];
		for (const chunk of this.chunk(itadIds, 200)) {
			const params = this.params();
			const res = await fetch(`${ITAD_BASE}/games/overview/v2?${params}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(chunk)
			});
			if (!res.ok) throw new Error(`ITAD overview failed: ${res.status}`);
			const data = (await res.json()) as { prices?: ITADOverviewItem[] };
			results.push(...(data.prices || []));
		}
		return results;
	}

	async getPrices(itadIds: string[]): Promise<ITADPriceItem[]> {
		const results: ITADPriceItem[] = [];
		for (const chunk of this.chunk(itadIds, 200)) {
			const params = this.params();
			const res = await fetch(`${ITAD_BASE}/games/prices/v3?${params}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(chunk)
			});
			if (!res.ok) throw new Error(`ITAD prices failed: ${res.status}`);
			const data = (await res.json()) as ITADPriceItem[];
			results.push(...data);
		}
		return results;
	}

	async getHistory(itadId: string, since?: string, shops?: number[]): Promise<ITADHistoryEntry[]> {
		const extra: Record<string, string> = { id: itadId };
		if (since) extra.since = since;
		if (shops) extra.shops = shops.join(',');
		const params = this.params(extra);
		const res = await fetch(`${ITAD_BASE}/games/history/v2?${params}`);
		if (!res.ok) throw new Error(`ITAD history failed: ${res.status}`);
		return res.json();
	}

	private chunk<T>(array: T[], size: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < array.length; i += size) {
			chunks.push(array.slice(i, i + size));
		}
		return chunks;
	}
}
