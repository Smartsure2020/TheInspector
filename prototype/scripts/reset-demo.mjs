// Demo reset (Phase 1 QA pass): returns the prototype to the pristine seeded
// demo book. Deletes db/inspector.db* and clears db/uploads/; the DB self-seeds
// again on the next request. Run with the dev server STOPPED — on Windows the
// server holds the SQLite file open and the delete will fail while it runs.
//
//   npm run reset:demo
//
// ALL DATA IS FAKE / ROLE-PLAY — no real client data exists in this prototype
// (phase0 D-09 safeguard gate), so deleting the database is always safe.
import { rmSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dbDir = join(dirname(fileURLToPath(import.meta.url)), "..", "db");

let removed = 0;
try {
  if (existsSync(dbDir)) {
    for (const f of readdirSync(dbDir)) {
      if (f === "inspector.db" || f.startsWith("inspector.db")) {
        rmSync(join(dbDir, f));
        removed++;
      }
    }
    const uploads = join(dbDir, "uploads");
    if (existsSync(uploads)) {
      for (const f of readdirSync(uploads)) {
        rmSync(join(uploads, f), { recursive: true });
        removed++;
      }
    }
  }
} catch (err) {
  if (err.code === "EBUSY" || err.code === "EPERM") {
    console.error(
      "Reset failed: the database file is locked.\n" +
      "Stop the dev server (Ctrl+C in its terminal) and run `npm run reset:demo` again."
    );
    process.exit(1);
  }
  throw err;
}

console.log(
  removed === 0
    ? "Already pristine — no database or uploads found. Seed data loads on the next request."
    : `Reset complete (${removed} file(s)/folder(s) removed). Start the dev server; the seeded demo book loads on the first request.`
);
