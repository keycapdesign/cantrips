-- App tables
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

-- better-auth tables
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  role TEXT,
  banned INTEGER,
  banReason TEXT,
  banExpires INTEGER
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id),
  impersonatedBy TEXT
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id),
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
