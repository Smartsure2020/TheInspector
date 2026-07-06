// SQLite connection singleton + bootstrap (Chunk 1B).
// File DB at prototype/db/inspector.db (gitignored). Schema created and seeded
// on first access so `npm run dev` stays one-command for reviewers.
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { SCHEMA_SQL } from "./schema";
import { runSeed } from "./seed";

declare global {
  // eslint-disable-next-line no-var
  var __inspectorDb: Database.Database | undefined; // survive HMR in dev
}

// Pre-1F databases lack the wider claim-type CHECK and template job_type
// column. The prototype DB is a disposable dev artefact (gitignored), so the
// migration is: detect old shape, recreate from seed. Keeps dev one-command.
function isPre1F(conn: Database.Database): boolean {
  const hasTemplates = conn
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='checklist_templates'")
    .get();
  if (!hasTemplates) return false; // fresh DB — schema below creates 1F shape
  const col = conn
    .prepare("SELECT 1 FROM pragma_table_info('checklist_templates') WHERE name='job_type'")
    .get();
  return !col;
}

export function db(): Database.Database {
  if (globalThis.__inspectorDb) return globalThis.__inspectorDb;
  const dir = path.join(process.cwd(), "db");
  fs.mkdirSync(dir, { recursive: true });
  const conn = new Database(path.join(dir, "inspector.db"));
  if (isPre1F(conn)) {
    // Drop in place (not file delete — Windows locks the file while another
    // dev server has it open). Schema + seed below rebuild the 1F shape.
    conn.pragma("foreign_keys = OFF");
    const tables = conn
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    for (const t of tables) conn.exec(`DROP TABLE IF EXISTS "${t.name}"`);
  }
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA_SQL);
  const jobCount = conn.prepare("SELECT COUNT(*) AS n FROM jobs").get() as { n: number };
  if (jobCount.n === 0) runSeed(conn);
  globalThis.__inspectorDb = conn;
  return conn;
}

export const nowIso = () => new Date().toISOString().replace("T", " ").slice(0, 19);
export const uuid = () => crypto.randomUUID();
