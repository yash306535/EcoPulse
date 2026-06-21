// SQLite layer via better-sqlite3. File auto-created on first run. No manual setup.
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Allow an override (used by tests, e.g. ":memory:") otherwise default to a file.
const dbPath = process.env.ECOPULSE_DB_PATH || path.join(__dirname, "ecopulse.sqlite");

const db = new Database(dbPath);
if (dbPath !== ":memory:") db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    clientId TEXT PRIMARY KEY,
    city TEXT,
    quiz_answers TEXT,
    breakdown TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId TEXT,
    date TEXT,
    category TEXT,
    action TEXT,
    delta_kg REAL
  );
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    payload TEXT,
    expires_at INTEGER
  );
`);

export const statements = {
  upsertProfile: db.prepare(`
    INSERT INTO profiles (clientId, city, quiz_answers, breakdown, created_at)
    VALUES (@clientId, @city, @quiz_answers, @breakdown, @created_at)
    ON CONFLICT(clientId) DO UPDATE SET
      city = excluded.city,
      quiz_answers = excluded.quiz_answers,
      breakdown = excluded.breakdown
  `),
  getProfile: db.prepare(`SELECT * FROM profiles WHERE clientId = ?`),
  insertLog: db.prepare(`
    INSERT INTO logs (clientId, date, category, action, delta_kg)
    VALUES (@clientId, @date, @category, @action, @delta_kg)
  `),
  getLogs: db.prepare(`
    SELECT * FROM logs WHERE clientId = ? ORDER BY date ASC, id ASC
  `),
  cacheGet: db.prepare(`SELECT * FROM cache WHERE key = ?`),
  cacheSet: db.prepare(`
    INSERT INTO cache (key, payload, expires_at)
    VALUES (@key, @payload, @expires_at)
    ON CONFLICT(key) DO UPDATE SET
      payload = excluded.payload,
      expires_at = excluded.expires_at
  `),
};

export default db;
