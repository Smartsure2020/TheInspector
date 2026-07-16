// Dual-provider database abstraction. Dev uses SQLite (default), staging/prod
// uses Postgres via DB_PROVIDER=postgres + DATABASE_URL. The QueryRunner async
// interface works identically with both backends; the Postgres runner converts
// ?-style params to $N and the same SCHEMA_SQL DDL runs on both engines (kept
// Postgres-portable by design since Chunk 1B).
import { SCHEMA_SQL } from "./schema";
import { applyHardening } from "./schema-hardening";

export interface QueryRunner {
  run(sql: string, ...params: unknown[]): Promise<{ changes: number }>;
  get<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | undefined>;
  all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (runner: QueryRunner) => Promise<T>): Promise<T>;
}

export type DbProvider = "sqlite" | "postgres";
export const dbProvider: DbProvider =
  process.env.DB_PROVIDER === "postgres" ? "postgres" : "sqlite";

function convertParams(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ---- SQLite runner (better-sqlite3, sync wrapped as async) ----

class SqliteRunner implements QueryRunner {
  private conn: import("better-sqlite3").Database | undefined;
  private ready = false;
  private pending: Promise<void> | undefined;

  private async init() {
    if (this.ready) return;
    if (this.pending) { await this.pending; return; }
    this.pending = this.bootstrap();
    await this.pending;
  }

  private async bootstrap() {
    const BetterSqlite = (await import("better-sqlite3")).default;
    const fs = await import("fs");
    const path = await import("path");

    const dir = path.join(process.cwd(), "db");
    fs.mkdirSync(dir, { recursive: true });
    const conn = new BetterSqlite(path.join(dir, "inspector.db"));

    const hasTemplates = conn
      .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='checklist_templates'")
      .get();
    if (hasTemplates) {
      const col = conn
        .prepare("SELECT 1 FROM pragma_table_info('checklist_templates') WHERE name='job_type'")
        .get();
      if (!col) {
        conn.pragma("foreign_keys = OFF");
        const tables = conn
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
          .all() as { name: string }[];
        for (const t of tables) conn.exec(`DROP TABLE IF EXISTS "${t.name}"`);
      }
    }

    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    conn.exec(SCHEMA_SQL);
    this.conn = conn;
    this.ready = true;
    await applyHardening(this, "sqlite");

    const count = conn.prepare("SELECT COUNT(*) AS n FROM jobs").get() as { n: number };
    if (count.n === 0) {
      const { runSeed } = await import("./seed");
      await runSeed(this);
    }
  }

  async run(sql: string, ...params: unknown[]) {
    await this.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = this.conn!.prepare(sql).run(...(params as any[]));
    return { changes: result.changes };
  }

  async get<T>(sql: string, ...params: unknown[]) {
    await this.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.conn!.prepare(sql).get(...(params as any[])) as T | undefined;
  }

  async all<T>(sql: string, ...params: unknown[]) {
    await this.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.conn!.prepare(sql).all(...(params as any[])) as T[];
  }

  async exec(sql: string) {
    await this.init();
    this.conn!.exec(sql);
  }

  async transaction<T>(fn: (runner: QueryRunner) => Promise<T>): Promise<T> {
    await this.init();
    this.conn!.exec("BEGIN");
    try {
      const result = await fn(this);
      this.conn!.exec("COMMIT");
      return result;
    } catch (e) {
      this.conn!.exec("ROLLBACK");
      throw e;
    }
  }
}

// ---- Postgres runner (pg Pool, async-native) ----

class PgRunner implements QueryRunner {
  private pool: import("pg").Pool;
  private ready = false;
  private pending: Promise<void> | undefined;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pg = require("pg") as typeof import("pg");
    pg.types.setTypeParser(20, parseInt);     // BIGINT → number
    pg.types.setTypeParser(114, String);       // JSON → raw string
    pg.types.setTypeParser(3802, String);      // JSONB → raw string
    pg.types.setTypeParser(1114, String);      // TIMESTAMP → raw string
    pg.types.setTypeParser(1184, (v: string) => // TIMESTAMPTZ → local string
      v.replace("T", " ").slice(0, 19));
    this.pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  }

  private async init() {
    if (this.ready) return;
    if (this.pending) { await this.pending; return; }
    this.pending = this.bootstrap();
    await this.pending;
  }

  private async bootstrap() {
    await this.pool.query(SCHEMA_SQL);
    this.ready = true;
    await applyHardening(this, "postgres");
    const result = await this.pool.query("SELECT COUNT(*) AS n FROM jobs");
    if ((result.rows[0]?.n ?? 0) === 0) {
      const { runSeed } = await import("./seed");
      await runSeed(this);
    }
  }

  async run(sql: string, ...params: unknown[]) {
    await this.init();
    const result = await this.pool.query(convertParams(sql), params);
    return { changes: result.rowCount ?? 0 };
  }

  async get<T>(sql: string, ...params: unknown[]) {
    await this.init();
    const result = await this.pool.query(convertParams(sql), params);
    return result.rows[0] as T | undefined;
  }

  async all<T>(sql: string, ...params: unknown[]) {
    await this.init();
    const result = await this.pool.query(convertParams(sql), params);
    return result.rows as T[];
  }

  async exec(sql: string) {
    await this.init();
    await this.pool.query(sql);
  }

  async transaction<T>(fn: (runner: QueryRunner) => Promise<T>): Promise<T> {
    await this.init();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const txRunner: QueryRunner = {
        run: async (s, ...p) => {
          const r = await client.query(convertParams(s), p);
          return { changes: r.rowCount ?? 0 };
        },
        get: async <U,>(s: string, ...p: unknown[]) => {
          const r = await client.query(convertParams(s), p);
          return r.rows[0] as U | undefined;
        },
        all: async <U,>(s: string, ...p: unknown[]) => {
          const r = await client.query(convertParams(s), p);
          return r.rows as U[];
        },
        exec: async (s) => { await client.query(s); },
        transaction: async (innerFn) => {
          await client.query("SAVEPOINT nested");
          try {
            const r = await innerFn(txRunner);
            await client.query("RELEASE SAVEPOINT nested");
            return r;
          } catch (e) {
            await client.query("ROLLBACK TO SAVEPOINT nested");
            throw e;
          }
        },
      };
      const result = await fn(txRunner);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      try { await client.query("ROLLBACK"); } catch { /* connection may be dead */ }
      throw e;
    } finally {
      client.release();
    }
  }
}

// ---- singleton (survives HMR) ----

declare global {
  // eslint-disable-next-line no-var
  var __inspectorQuery: QueryRunner | undefined;
}

export const query: QueryRunner =
  globalThis.__inspectorQuery ??= (dbProvider === "postgres" ? new PgRunner() : new SqliteRunner());

export const nowIso = () => new Date().toISOString().replace("T", " ").slice(0, 19);
export const uuid = () => crypto.randomUUID();
