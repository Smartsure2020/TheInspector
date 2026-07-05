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

export function db(): Database.Database {
  if (globalThis.__inspectorDb) return globalThis.__inspectorDb;
  const dir = path.join(process.cwd(), "db");
  fs.mkdirSync(dir, { recursive: true });
  const conn = new Database(path.join(dir, "inspector.db"));
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
