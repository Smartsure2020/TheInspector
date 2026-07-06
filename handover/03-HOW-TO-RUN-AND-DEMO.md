# How to run and demo — The Inspector prototype

## Prerequisites

- Node.js (project built and QA'd on the dev laptop's current Node LTS)
- Windows dev machine (paths below); nothing else — no Docker, no Postgres,
  no accounts, no API keys, no `.env` needed.

## Install and run

```bash
cd C:\Users\renault\Documents\AI\INSPECTOR\prototype
npm install
npm run dev        # → http://localhost:3000
```

The SQLite database **self-creates and self-seeds** at `prototype/db/inspector.db`
on the first request. First page load after a reset is slower (seeding) — this
is normal.

## Reset demo data (do this before every demo)

```bash
# 1. STOP the dev server first (Ctrl+C) — on Windows the server holds the
#    SQLite file open and the delete fails while it runs.
npm run reset:demo
# 2. Start again:
npm run dev
```

This deletes `db/inspector.db*` and clears `db/uploads/`, restoring the
pristine 18-job seeded book on the next request. All data is fake, so the
reset is always safe.

## Run the smoke QA (against a RUNNING server)

```bash
npm run qa:smoke   # expects http://localhost:3000; override with QA_BASE_URL
```

22 render-level checks; **all must PASS** on a freshly reset book. Deep
interaction flows (capture loop, review cycle, locking) are manual — see
`phase1/regression-checklist.md`.

Build sanity (used as the change gate, not needed for demos):

```bash
npx tsc --noEmit
npm run build
```

## Important local paths

| Path | What |
|---|---|
| `prototype/db/inspector.db` | SQLite DB (gitignored, disposable) |
| `prototype/db/uploads/` | Uploaded evidence files (gitignored) |
| `prototype/scripts/reset-demo.mjs` | Demo reset |
| `prototype/scripts/qa-smoke.mjs` | Smoke suite |
| `phase1/demo-guide.md` | Full demo runbook (source of truth) |
| `phase1/regression-checklist.md` | Manual regression checklist |

## Browser routes to open

| Route | What you see |
|---|---|
| `/` | Role picker + demo client links |
| `/admin`, `/assessor`, `/manager` | Dashboards per role |
| `/jobs/new` | Job creation + template picker |
| `/jobs/j3` | Primary storm demo job (INS-2026-0003) |
| `/jobs/j5/room` | Live room on the in-progress Power Surge job |
| `/jobs/j7/report` | Storm report builder (Awaiting report) |
| `/jobs/j13/report` | Residential survey report builder |
| `/c/demo-storm` | Storm client link (early state + safety wording) |
| `/c/demo-acc`, `/c/demo-theft`, `/c/demo-survey` | Other client links |
| `/c/demo-live` | Client side of the in-progress live job (j5) |
| `/c/demo-upload/upload` | Missing-evidence upload page (geyser job j6) |

## Which role to select

| Demo user | Role | Use for |
|---|---|---|
| **Lerato Demo** | Admin / Coordinator | Pipeline, job creation, scheduling |
| **Sipho Demo** | Assessor | Live room, readiness dots |
| **Anje Demo** | Assessor / Surveyor | Report writing, revise/resubmit, surveys |
| **Craig Demo** | Manager / Reviewer | Review queue, return/approve/lock |

Client links need **no role** — open them logged out (or in a second window).

## Demo jobs to use

| Job | Number | State | Demonstrates |
|---|---|---|---|
| j3 | INS-2026-0003 | Scheduled (storm) | Primary demo + `/c/demo-storm` pre-join |
| j5 | INS-2026-0005 | In progress (power surge) | Live room, checklist, capture; pair with `/c/demo-live` |
| j6 | INS-2026-0006 | Awaiting evidence (geyser) | Missing-evidence upload loop via `/c/demo-upload/upload` |
| j7 | INS-2026-0007 | Awaiting report (storm) | Report builder + full review cycle |
| j8 | INS-2026-0008 | Report submitted (power surge) | Submitted report / peril wording |
| j10 | INS-2026-0010 | Report completed (geyser) | Approved + locked report |
| j11 / j12 | — | Cancelled / No-show | Edge flows; no-show reschedulable |
| j13 | SRV-2026-0013 | Survey, awaiting report | Survey report builder (COPE, register, grading) |
| j15 | SRV-2026-0015 | Commercial survey | `v0.1-1F-limited` flag |
| j16 | SRV-2026-0016 | Survey, submitted | "NOT adequately surveyable virtually" limitation |

## Management demo order (summary — full script in file 04)

1. Role picker `/` — positioning (multi-peril + surveys, placeholder access)
2. Admin book of work — 18 jobs, one engine for claims AND surveys
3. `/jobs/new` — governed template picker; fire greyed out; commercial limited
4. **Storm** primary demo — j3 + `/c/demo-storm` client journey + readiness dots
5. Live room — j5 (+ `/c/demo-live` in a second window for real video)
6. Missing evidence loop — j6 + `/c/demo-upload/upload`
7. Report generation — j7 as Anje (prefill, auto Limitations)
8. Manager review cycle — Craig: return → revise → resubmit → approve → lock
9. **Survey** variant — j13 builder, j16 physical-survey limitation
10. Evidence pack ZIP — any completed job
11. Optional wrap — General non-motor peril adaptivity (Glass), theft wording

What each step proves is spelled out in `phase1/demo-guide.md` §§1–11.

## Troubleshooting

- **`reset:demo` fails with "database file is locked"** — the dev server is
  still running. Stop it, run the reset, restart.
- **Smoke checks fail immediately** — is the dev server running? Was the DB
  reset first? The suite assumes the pristine seeded book.
- **Live-room capture says "No client video to capture yet"** — expected with
  no connected client. Use a second browser window on `/c/demo-live`, or the
  test hooks `?media=fake` (canvas camera) / `?loopback=1` (single-window).
- **"Admit client" disabled** — it requires a live client in the waiting room
  on the signaling channel. For single-window demos use **Start session
  (mock)** on the job page instead.
- **Two windows won't connect via WebRTC** — same machine/network works; a
  strict corporate network may block P2P (no TURN relay — known limitation L2).
- **Phone testing doesn't work** — phones require HTTPS; the work laptop
  policy blocks local certificates. Deferred; see
  `phase1/spike-manual-test-guide.md` (Cloudflare quick tunnel or preview
  deployment) when it's time.
- **Stale/odd data mid-demo** — full reset (stop server → `reset:demo` → start).

## Known build/dev-server notes

- Dev server is single-process; the `/api/rtc` signaling store is in-memory,
  so restarting the server drops any live room connections.
- SQLite runs in WAL mode — `inspector.db-wal`/`-shm` sidecars are normal and
  gitignored.
- `npm run build` compiles all 21 routes clean as of 2026-07-06; keep it that
  way (`npx tsc --noEmit` too).
- Next.js splits server-rendered text into chunks; the smoke suite's marker
  strings were chosen to survive that — don't "fix" them to longer phrases.
- After the demo: stop server → `npm run reset:demo` → restart, so the book
  is pristine for the next person.
