// Repeatable QA/demo smoke suite (Phase 1 QA pass). Run against a RUNNING dev
// server with a freshly reset database (npm run reset:demo, then npm run dev):
//
//   npm run qa:smoke
//
// Checks every demo-critical route returns 200 and carries its marker wording.
// Auth: creates a session directly in SQLite for the admin user (lerato).
// Client routes (/c/*) are tested without staff auth — OTP-gated redirects
// are accepted as valid behavior.
import { createRequire } from "module";
import { createHash, randomBytes } from "crypto";
import { join } from "path";
import { existsSync } from "fs";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

// ---------- create a test session in SQLite ----------
const dbPath = join(process.cwd(), "db", "inspector.db");
function createSessionFor(userId) {
  if (!existsSync(dbPath)) {
    console.error("Database not found at", dbPath);
    console.error("Ensure the dev server has been started at least once to seed the database.");
    process.exit(1);
  }
  const require = createRequire(import.meta.url);
  const Database = require("better-sqlite3");
  const db = new Database(dbPath);

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const expires = new Date(Date.now() + 8 * 3600_000).toISOString().replace("T", " ").slice(0, 19);
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO staff_sessions (id, user_id, token_hash, ip_address, user_agent, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, tokenHash, "127.0.0.1", "qa-smoke", now, expires);

  db.close();
  return `inspector.session=${token}`;
}

const adminCookie = createSessionFor("u-lerato");
const assessorCookie = createSessionFor("u-sipho");
const managerCookie = createSessionFor("u-craig");
console.log("Sessions created: admin (lerato), assessor (sipho), manager (craig)\n");

const adminHeaders = { Cookie: adminCookie };
const assessorHeaders = { Cookie: assessorCookie };
const managerHeaders = { Cookie: managerCookie };

// [route, markers, description, headers]
// markers = string[] → check response body contains all strings (case-insensitive)
// markers = null → check response is a ZIP (PK header)
// markers = "expect-401" → check response is HTTP 401
// headers = object with Cookie, or false for unauthenticated
const CHECKS = [
  ["/", ["Sign in"], "login page renders for unauthenticated", false],
  ["/admin", ["INS-2026-0001", "SRV-2026-0014", "Burst Pipe", "Residential Risk Survey"], "admin pipeline shows multi-peril + survey book", adminHeaders],
  ["/assessor", ["Assessor dashboard"], "assessor dashboard renders", assessorHeaders],
  ["/manager", ["Review queue", "survey report"], "manager queue renders incl. survey variant", managerHeaders],
  ["/jobs/new", ["not bookable", "is_limited", "Storm Damage", "Residential Risk Survey"], "template picker: fire disabled server-side, limited flag delivered", adminHeaders],
  ["/jobs/j3", ["INS-2026-0003", "Storm Damage", "0.1-1F"], "primary storm demo job", adminHeaders],
  ["/jobs/j3/schedule", ["Reschedule"], "schedule page", adminHeaders],
  ["/jobs/j5/room", ["Power Surge"], "live room renders", adminHeaders],
  ["/jobs/j6/evidence", ["Evidence gallery"], "evidence gallery", adminHeaders],
  ["/jobs/j7/report", ["Report builder", "LIMITATIONS", "maintenance"], "storm report builder + limitations", assessorHeaders],
  ["/jobs/j8/report/final", ["Virtual Assessment Report", "Power Surge"], "submitted surge report", adminHeaders],
  ["/jobs/j10/report/final", ["approved", "Report completed"], "approved + locked geyser report", adminHeaders],
  ["/jobs/j13/report", ["COPE", "Recommendations register", "Risk grading", "SURVEY LIMITATIONS"], "survey report builder (no cause-of-loss)", assessorHeaders],
  ["/jobs/j16/report/final", ["Virtual Risk Survey Report", "NOT adequately surveyable"], "survey report: physical-survey limitation", adminHeaders],
  ["/jobs/j15", ["0.1-1F-limited"], "commercial survey flagged limited", adminHeaders],
  ["/c/demo-storm", ["storm"], "storm client link resolves", false],
  ["/c/demo-acc", ["verify", "code"], "accidental client link (OTP gate)", false],
  ["/c/demo-theft", ["theft"], "theft client link", false],
  ["/c/demo-survey", ["survey"], "survey client link", false],
  ["/c/demo-upload/upload", ["upload"], "upload page resolves", false],
  ["/c/not-a-real-token", ["isn't recognised"], "invalid link state", false],
  ["/api/pack/j7", null, "evidence pack endpoint (zip)", adminHeaders],
  // RBAC enforcement — wrong role gets redirected to /access-denied
  ["/admin", ["Access denied"], "assessor cannot access admin pages", assessorHeaders],
  ["/manager", ["Access denied"], "assessor cannot access manager pages", assessorHeaders],
  ["/access-denied", ["Access denied", "does not have permission"], "access-denied page renders for authenticated user", adminHeaders],
  // Auth enforcement — these MUST return 401 without credentials
  ["/api/pack/j7", "expect-401", "pack 401 when unauthenticated", false],
  ["/api/files/fake-id", "expect-401", "file 401 when unauthenticated", false],
];

let pass = 0, fail = 0;
for (const [path, markers, desc, headers] of CHECKS) {
  const url = BASE + path;
  try {
    const opts = { redirect: "manual" };
    if (headers) opts.headers = headers;
    const res = await fetch(url, opts);

    // --- expect-401 check ---
    if (markers === "expect-401") {
      if (res.status === 401) { console.log(`PASS  ${path}  — ${desc}`); pass++; }
      else throw new Error(`expected 401, got ${res.status}`);
      continue;
    }

    // --- unauthenticated staff routes redirect to /login ---
    if (!headers && !path.startsWith("/c/") && !path.startsWith("/api/") && res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") ?? "";
      if (loc.includes("/login")) {
        const loginRes = await fetch(BASE + new URL(loc, BASE).pathname + new URL(loc, BASE).search);
        if (loginRes.status !== 200) throw new Error(`HTTP ${loginRes.status} after redirect`);
        if (markers) {
          const text = await loginRes.text();
          const missing = markers.filter((m) => !text.toLowerCase().includes(m.toLowerCase()));
          if (missing.length) throw new Error(`missing marker(s): ${missing.join(" | ")}`);
        }
        console.log(`PASS  ${path}  — ${desc}`); pass++; continue;
      }
    }

    // --- RBAC redirect to /access-denied ---
    if (headers && res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") ?? "";
      if (loc.includes("/access-denied")) {
        const followUrl = loc.startsWith("http") ? loc : BASE + loc;
        const followRes = await fetch(followUrl, { headers });
        if (followRes.status !== 200) throw new Error(`HTTP ${followRes.status} after redirect to ${loc}`);
        if (markers) {
          const text = await followRes.text();
          const missing = markers.filter((m) => !text.toLowerCase().includes(m.toLowerCase()));
          if (missing.length) throw new Error(`missing marker(s) after RBAC redirect: ${missing.join(" | ")}`);
        }
        console.log(`PASS  ${path}  — ${desc}`); pass++; continue;
      }
    }

    // --- client routes may redirect to /verify or /consent ---
    if (path.startsWith("/c/") && path !== "/c/not-a-real-token" && res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") ?? "";
      if (loc.includes("/verify") || loc.includes("/consent") || loc.includes("/check")) {
        const followUrl = loc.startsWith("http") ? loc : BASE + loc;
        const followRes = await fetch(followUrl);
        if (followRes.status !== 200) throw new Error(`HTTP ${followRes.status} after redirect to ${loc}`);
        if (markers) {
          const text = await followRes.text();
          const missing = markers.filter((m) => !text.toLowerCase().includes(m.toLowerCase()));
          if (missing.length) throw new Error(`missing marker(s) after redirect: ${missing.join(" | ")}`);
        }
        console.log(`PASS  ${path}  — ${desc}`); pass++; continue;
      }
    }

    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

    if (markers) {
      const text = await res.text();
      const missing = markers.filter((m) => !text.toLowerCase().includes(m.toLowerCase()));
      if (missing.length) throw new Error(`missing marker(s): ${missing.join(" | ")}`);
    } else {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (!(buf[0] === 0x50 && buf[1] === 0x4b)) throw new Error("not a ZIP (no PK header)");
    }
    console.log(`PASS  ${path}  — ${desc}`);
    pass++;
  } catch (err) {
    console.error(`FAIL  ${path}  — ${desc}: ${err.message}`);
    fail++;
  }
}

console.log(`\n${pass} passed, ${fail} failed (of ${CHECKS.length}).`);
if (fail) {
  console.log("Note: this suite expects the pristine seeded book — run `npm run reset:demo` (server stopped) and restart the server first.");
  process.exit(1);
}
