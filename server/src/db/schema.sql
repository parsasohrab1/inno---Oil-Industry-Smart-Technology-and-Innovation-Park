PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  company_id    TEXT,
  created_at    TEXT NOT NULL
);

-- انبار عمومی موجودیت‌ها: هر ردیف یک رکورد دامنه به‌صورت JSON
CREATE TABLE IF NOT EXISTS entities (
  collection TEXT NOT NULL,
  id         TEXT NOT NULL,
  company_id TEXT,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (collection, id)
);
CREATE INDEX IF NOT EXISTS idx_entities_coll_company ON entities (collection, company_id);

-- ثبت رویداد تغییرناپذیر (زنجیره هش) برای قراردادهای هوشمند
CREATE TABLE IF NOT EXISTS contract_events (
  id          TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  seq         INTEGER NOT NULL,
  type        TEXT NOT NULL,
  payload     TEXT NOT NULL,
  actor       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  prev_hash   TEXT NOT NULL,
  hash        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contract_events_cid ON contract_events (contract_id, seq);

CREATE TABLE IF NOT EXISTS audit_log (
  id      TEXT PRIMARY KEY,
  ts      TEXT NOT NULL,
  user_id TEXT,
  role    TEXT,
  action  TEXT NOT NULL,
  target  TEXT,
  meta    TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
