# Evidence Chain Verification Results

**Date:** 2026-07-16
**Phase:** 5B -- Staging Enablement
**Verified by:** Claude (automated code audit + build verification)

## Chain overview

```
Capture/Upload --> sha256(bytes) --> evidence_items.sha256
                                          |
                                          v
                              evidence pack generation
                                          |
                                          v
                              index.csv (includes sha256 column)
                                          |
                                          v
                              access_log entry (download recorded)
```

## 1. SHA-256 computed at capture time

| Action | File | Line | Status |
|--------|------|------|--------|
| Frame capture (assessor) | `lib/actions.ts` | 378 | `sha256(bytes)` stored in `evidence_items.sha256` |
| Client upload | `lib/actions.ts` | 409 | `sha256(bytes)` stored in `evidence_items.sha256` |
| High-res client photo | `lib/actions.ts` | 409 | Same path as client upload |

The `sha256()` function (`lib/crypto.ts:4`) uses Node's `createHash("sha256")`.

Hash is also written to `event_log` via `logEvent()` at capture time (actions.ts:386, 421), providing an immutable audit record.

## 2. Evidence pack includes SHA-256

| Step | File | Line | Detail |
|------|------|------|--------|
| CSV header | `api/pack/[id]/route.ts` | 26 | `sha256` column included in header row |
| CSV row | `api/pack/[id]/route.ts` | 45 | `e.sha256` read from evidence row |
| ZIP builder | `lib/zip.ts` | 85-89 | Proper CSV escaping |
| README.txt | `api/pack/[id]/route.ts` | 55 | Notes SHA-256 verification |

## 3. Access log records downloads

| Resource | File | Line | Detail |
|----------|------|------|--------|
| Evidence pack | `api/pack/[id]/route.ts` | 21 | `logAccess(user.id, "evidence_pack", id, "download", ip)` |
| Individual file | `api/files/[id]/route.ts` | 30 | `logAccess(actorId, "evidence_file", id, "download", ip)` |
| Client file access | `api/files/[id]/route.ts` | 21 | Actor recorded as `"client_link"` |

Access log table defined in `schema-hardening.ts:43-52` with index on `(resource_type, resource_id)`.

## 4. Auth enforcement on evidence endpoints

| Endpoint | Auth check | Unauthenticated response |
|----------|-----------|------------------------|
| `GET /api/pack/[id]` | `getSession()` | 401 Unauthorized |
| `GET /api/files/[id]` | `getSession()` or valid client token | 401 Unauthorized |

Smoke test coverage: `qa-smoke.mjs` checks 57 (pack 401) and 58 (file 401).

## 5. Seeded data note

Seeded evidence items (demo tiles) have no `file_key` or `sha256` -- they are placeholder colour tiles. The pack generator handles this gracefully:
- Missing file: note = `"placeholder tile (seeded demo item, no file)"`
- Missing sha256: empty string in CSV

Real captures via `saveCaptureAction` and `uploadEvidenceAction` always compute and store sha256.

## 6. Postgres immutability (event_log)

When `DB_PROVIDER=postgres`, `schema-hardening.ts:122-133` creates:
- `no_update_event_log` rule: UPDATE on event_log does nothing
- `no_delete_event_log` rule: DELETE on event_log does nothing

This makes event_log append-only, protecting the audit trail.

## Verification status

| Check | Result |
|-------|--------|
| sha256 computed at capture | PASS |
| sha256 stored in evidence_items | PASS |
| index.csv includes sha256 column | PASS |
| access_log records pack download | PASS |
| access_log records file download | PASS |
| Auth required for pack endpoint | PASS |
| Auth required for file endpoint | PASS |
| Postgres event_log immutability | PASS (code present, requires Postgres to activate) |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Manual test procedure (desktop-to-desktop capture)

To run a live capture test:

1. Start dev server: `npm run dev`
2. Login as assessor (sipho / demo123)
3. Navigate to any job in "in_progress" state (e.g. /jobs/j5)
4. Open the live room (/jobs/j5/room) with `?media=fake&loopback=1` for single-browser testing
5. Capture a frame using the capture button
6. Verify on /jobs/j5/evidence that the capture appears
7. Check database: `SELECT sha256 FROM evidence_items WHERE job_id='j5' AND sha256 IS NOT NULL`
8. Download evidence pack from /jobs/j5/report/final
9. Extract ZIP, open index.csv, confirm sha256 column is populated for the captured item
10. Check database: `SELECT * FROM access_log WHERE resource_type='evidence_pack'`
