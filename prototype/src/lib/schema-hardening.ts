// Production hardening schema additions (Phase H, Gate G6–G10).
// Additive only — does NOT modify SCHEMA_SQL in schema.ts.
// All DDL is SQLite-compatible; Postgres-only rules applied conditionally.
import type { QueryRunner } from "./db";
import { sha256 } from "./crypto";

const NEW_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS staff_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON staff_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_user ON staff_sessions(user_id);

CREATE TABLE IF NOT EXISTS user_template_mandates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  template_id TEXT NOT NULL REFERENCES checklist_templates(id),
  assigned_by TEXT REFERENCES users(id),
  assigned_at TEXT NOT NULL,
  UNIQUE (user_id, template_id)
);

CREATE TABLE IF NOT EXISTS otp_challenges (
  id TEXT PRIMARY KEY,
  link_token TEXT NOT NULL,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_otp_token ON otp_challenges(link_token);

CREATE TABLE IF NOT EXISTS access_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_access_log_resource ON access_log(resource_type, resource_id);
`;

const USER_COLUMNS = [
  { name: "email", ddl: "TEXT" },
  { name: "password_hash", ddl: "TEXT" },
  { name: "is_active", ddl: "INTEGER NOT NULL DEFAULT 1" },
  { name: "created_at", ddl: "TEXT" },
  { name: "last_login_at", ddl: "TEXT" },
] as const;

const JOB_COLUMNS = [
  { name: "retention_until", ddl: "TEXT" },
] as const;

const APPOINTMENT_COLUMNS = [
  { name: "link_token_hash", ddl: "TEXT" },
] as const;

const UPLOAD_REQUEST_COLUMNS = [
  { name: "link_token_hash", ddl: "TEXT" },
] as const;

async function addColumnIfMissing(
  q: QueryRunner,
  table: string,
  col: { name: string; ddl: string },
  provider: "sqlite" | "postgres",
) {
  if (provider === "sqlite") {
    const exists = await q.get<{ name: string }>(
      `SELECT name FROM pragma_table_info('${table}') WHERE name=?`, col.name,
    );
    if (!exists) await q.exec(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.ddl}`);
  } else {
    await q.exec(`
      DO $$ BEGIN
        ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.ddl};
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
  }
}

export async function applyHardening(q: QueryRunner, provider: "sqlite" | "postgres") {
  for (const col of USER_COLUMNS)
    await addColumnIfMissing(q, "users", col, provider);
  for (const col of JOB_COLUMNS)
    await addColumnIfMissing(q, "jobs", col, provider);
  for (const col of APPOINTMENT_COLUMNS)
    await addColumnIfMissing(q, "appointments", col, provider);
  for (const col of UPLOAD_REQUEST_COLUMNS)
    await addColumnIfMissing(q, "client_upload_requests", col, provider);

  await q.exec(NEW_TABLES_SQL);

  await q.exec("CREATE INDEX IF NOT EXISTS idx_appt_token_hash ON appointments(link_token_hash)");
  await q.exec("CREATE INDEX IF NOT EXISTS idx_upr_token_hash ON client_upload_requests(link_token_hash)");

  // Backfill link_token_hash for existing rows missing it
  const unhashed = await q.all<{ id: string; link_token: string }>(
    "SELECT id, link_token FROM appointments WHERE link_token IS NOT NULL AND link_token_hash IS NULL");
  for (const r of unhashed)
    await q.run("UPDATE appointments SET link_token_hash=? WHERE id=?", sha256(r.link_token), r.id);

  const unhashedUpr = await q.all<{ id: string; link_token: string }>(
    "SELECT id, link_token FROM client_upload_requests WHERE link_token IS NOT NULL AND link_token_hash IS NULL");
  for (const r of unhashedUpr)
    await q.run("UPDATE client_upload_requests SET link_token_hash=? WHERE id=?", sha256(r.link_token), r.id);

  if (provider === "postgres") {
    await q.exec(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_rules WHERE rulename = 'no_update_event_log') THEN
          CREATE RULE no_update_event_log AS ON UPDATE TO event_log DO INSTEAD NOTHING;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_rules WHERE rulename = 'no_delete_event_log') THEN
          CREATE RULE no_delete_event_log AS ON DELETE TO event_log DO INSTEAD NOTHING;
        END IF;
      END $$;
    `);
  }
}
