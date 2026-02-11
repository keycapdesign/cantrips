import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";

const dataDir = process.env.DATA_DIR || "./data";
mkdirSync(dataDir, { recursive: true });

const db = new Database(`${dataDir}/cantrips.db`, { create: true });

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 5000");

export default db;
