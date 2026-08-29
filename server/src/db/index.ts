import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

const rawPath = process.env.DB_PATH ?? join(__dirname, '../../data/oipms.db')
const DB_PATH = isAbsolute(rawPath) ? rawPath : resolve(__dirname, '../..', rawPath)
mkdirSync(dirname(DB_PATH), { recursive: true })

export const db: DatabaseSync = new DatabaseSync(DB_PATH)

export function migrate(): void {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  db.exec(schema)
}

// ===== کمک‌توابع دسترسی به انبار entities =====

export interface EntityRow {
  collection: string
  id: string
  company_id: string | null
  data: string
  updated_at: string
}

const nowIso = () => new Date().toISOString()

export function putEntity(collection: string, id: string, companyId: string | null, data: unknown): void {
  db.prepare(
    `INSERT INTO entities (collection, id, company_id, data, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(collection, id) DO UPDATE SET
       company_id = excluded.company_id,
       data = excluded.data,
       updated_at = excluded.updated_at`,
  ).run(collection, id, companyId, JSON.stringify(data), nowIso())
}

export function putEntities(
  collection: string,
  rows: Array<{ id: string; companyId?: string | null; data: unknown }>,
): void {
  const stmt = db.prepare(
    `INSERT INTO entities (collection, id, company_id, data, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(collection, id) DO UPDATE SET
       company_id = excluded.company_id, data = excluded.data, updated_at = excluded.updated_at`,
  )
  const ts = nowIso()
  const tx = db.prepare('BEGIN')
  tx.run()
  try {
    for (const r of rows) stmt.run(collection, r.id, r.companyId ?? null, JSON.stringify(r.data), ts)
    db.prepare('COMMIT').run()
  } catch (e) {
    db.prepare('ROLLBACK').run()
    throw e
  }
}

export function getEntity<T>(collection: string, id: string): T | null {
  const row = db.prepare('SELECT data FROM entities WHERE collection = ? AND id = ?').get(collection, id) as
    | { data: string }
    | undefined
  return row ? (JSON.parse(row.data) as T) : null
}

export function listEntities<T>(collection: string, companyId?: string): T[] {
  const rows = companyId
    ? (db
        .prepare('SELECT data FROM entities WHERE collection = ? AND company_id = ?')
        .all(collection, companyId) as Array<{ data: string }>)
    : (db.prepare('SELECT data FROM entities WHERE collection = ?').all(collection) as Array<{ data: string }>)
  return rows.map((r) => JSON.parse(r.data) as T)
}

export function deleteEntity(collection: string, id: string): void {
  db.prepare('DELETE FROM entities WHERE collection = ? AND id = ?').run(collection, id)
}

export function countEntities(collection: string): number {
  const row = db.prepare('SELECT COUNT(*) AS n FROM entities WHERE collection = ?').get(collection) as {
    n: number
  }
  return row.n
}

export function getMeta(key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setMeta(key: string, value: string): void {
  db.prepare(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value)
}

export function audit(entry: {
  userId?: string | null
  role?: string | null
  action: string
  target?: string | null
  meta?: unknown
}): void {
  db.prepare(
    'INSERT INTO audit_log (id, ts, user_id, role, action, target, meta) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    randomUUID(),
    nowIso(),
    entry.userId ?? null,
    entry.role ?? null,
    entry.action,
    entry.target ?? null,
    entry.meta === undefined ? null : JSON.stringify(entry.meta),
  )
}
