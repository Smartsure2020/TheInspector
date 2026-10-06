# Staging evidence-chain results

**Status:** staging **NOT RUN** (not provisioned). Local Postgres run completed 2026-10-06.
Fake data only.

## A. Local Postgres run (2026-10-06) — PASS

Environment: throwaway `postgres:16-alpine` (Docker, localhost only, random password,
removed afterwards) · production build · `DB_PROVIDER=postgres` · local-disk storage ·
fake media (`?media=fake&loopback=1`) · job j5, assessor `u-sipho`.

| Check | Result |
|---|---|
| DDL + seed on Postgres | **Pass** — 15 tables created, seeded book loaded on first request |
| Staff login (assessor) | **Pass** |
| RBAC: assessor → `/admin` | **Pass** — redirected to `/access-denied` |
| Frame capture stores `sha256` | **Pass** (`1a1cd2a4…dc385a27`) |
| Hash equals SHA-256 of stored file | **Pass** |
| Pack `index.csv` carries same hash | **Pass** |
| `access_log` row for pack download | **Pass** (`evidence_pack` / `j5` / `download` / `u-sipho`) |
| event_log UPDATE blocked | **Pass** — `UPDATE 0` (rule `no_update_event_log`) |
| event_log DELETE blocked | **Pass** — `DELETE 0` (rule `no_delete_event_log`) |

Caveats: RULES are droppable by the table owner and the app connects as owner (F9);
client-upload path and S3 not exercised; client OTP not re-run on Postgres.

## B. Staging run — NOT RUN

Run after deploy, as staff via the protected staging URL, using staff-owned phones only.

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Login as assessor, manager, admin | Role-appropriate dashboards | ⏳ |
| 2 | Assessor → `/admin`, `/manager` | `/access-denied` | ⏳ |
| 3 | Client link → OTP via Twilio to staff phone | SMS arrives, code accepted, wrong code rejected (3 tries) | ⏳ |
| 4 | Live room capture (LiveKit), item-tagged | Capture saved; `evidence_items.sha256` set | ⏳ |
| 5 | Client hi-res photo upload via link | Saved to S3 (size limit F2!), hash set | ⏳ |
| 6 | Object exists in S3 (SSE on, private) | Present, no public access | ⏳ |
| 7 | `/api/files/<id>` authenticated | 302 → presigned URL (15 min), file opens | ⏳ |
| 8 | `/api/files/<id>` and `/api/pack/<id>` unauthenticated | 401 | ⏳ |
| 9 | Presigned URL after expiry | 403 | ⏳ |
| 10 | Download pack; `index.csv` hash == recomputed file hash | Match | ⏳ |
| 11 | `access_log` rows for file + pack downloads | Present with user/IP | ⏳ |
| 12 | event_log UPDATE/DELETE attempt | 0 rows (and note owner caveat) | ⏳ |
