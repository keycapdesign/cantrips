export interface Game {
	id: number;
	title: string;
	itad_id: string | null;
	slug: string | null;
	game_type: string | null;
	boxart_url: string | null;
	banner_url: string | null;
	release_date: string | null;
	tags: string | null;
	review_score: number | null;
	early_access: number;
	players_recent: number | null;
	players_peak: number | null;
	history_low: number | null;
	history_low_store: string | null;
	price_threshold: number;
	added_by: string | null;
	needs_review: number;
	created_at: string;
	updated_at: string;
}

export interface Deal {
	id: number;
	game_id: number;
	sale_price: number;
	regular_price: number;
	cut_percent: number;
	shop_name: string;
	shop_id: number | null;
	deal_url: string | null;
	drm: string | null;
	platforms: string | null;
	flag: string | null;
	expires_at: string | null;
	source: string;
	received_at: string;
}

export interface InviteCode {
	id: number;
	code: string;
	created_by: string;
	redeemed_by: string | null;
	redeemed_at: string | null;
	created_at: string;
}
