import type { Database } from "bun:sqlite";

export function initSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      itad_id TEXT UNIQUE,
      slug TEXT,
      game_type TEXT,
      boxart_url TEXT,
      banner_url TEXT,
      release_date TEXT,
      tags TEXT,
      review_score INTEGER,
      early_access INTEGER DEFAULT 0,
      players_recent INTEGER,
      players_peak INTEGER,
      history_low REAL,
      history_low_store TEXT,
      price_threshold REAL DEFAULT 0,
      added_by TEXT REFERENCES user(id),
      needs_review INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      sale_price REAL NOT NULL,
      regular_price REAL NOT NULL,
      cut_percent INTEGER NOT NULL,
      shop_name TEXT NOT NULL,
      shop_id INTEGER,
      deal_url TEXT,
      drm TEXT,
      platforms TEXT,
      flag TEXT,
      expires_at TEXT,
      source TEXT DEFAULT 'poll',
      received_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_deals_game_id ON deals(game_id);
    CREATE INDEX IF NOT EXISTS idx_deals_received_at ON deals(received_at);
    CREATE INDEX IF NOT EXISTS idx_games_itad_id ON games(itad_id);

    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      created_by TEXT NOT NULL REFERENCES user(id),
      redeemed_by TEXT REFERENCES user(id),
      redeemed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
  `);

  // Migrations for existing databases
  const columns = db.query("PRAGMA table_info(games)").all() as { name: string }[];
  const colNames = new Set(columns.map((c) => c.name));
  if (!colNames.has("early_access")) {
    db.exec("ALTER TABLE games ADD COLUMN early_access INTEGER DEFAULT 0");
  }
  if (!colNames.has("players_recent")) {
    db.exec("ALTER TABLE games ADD COLUMN players_recent INTEGER");
  }
  if (!colNames.has("players_peak")) {
    db.exec("ALTER TABLE games ADD COLUMN players_peak INTEGER");
  }
}

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

export interface InviteCode {
  id: number;
  code: string;
  created_by: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
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
