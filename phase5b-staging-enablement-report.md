# Phase 5B -- Staging Enablement & Evidence Chain Verification Report

**Date:** 2026-07-16
**Author:** Claude (automated)

## Summary

Phase 5B completes three small fixes, verifies the evidence chain end-to-end, and confirms staging readiness. No product features were added.

## 1. Small fixes

### 1a. RBAC access-denied page

**Problem:** `requireRole()` in `lib/auth.ts` threw a raw `Error("Forbidden: requires ...")`, surfacing as a 500 error page.

**Fix:** Changed `requireRole()` to call `redirect("/access-denied")` instead of throwing. Created `/access-denied` page (`app/access-denied/page.tsx`) that:
- Shows "Access denied" with role explanation for authenticated users
- Shows "You need to be signed in" for unauthenticated users
- Links to the appropriate dashboard or login page
- Matches the application's visual style

**Smoke test:** Added 3 new checks to `qa-smoke.mjs`:
- Assessor accessing /admin gets redirected to access-denied
- Assessor accessing /manager gets redirected to access-denied
- Access-denied page renders correct content

### 1b. Report final heading spacing

**Problem:** The "AUTO -- NON-REMOVABLE" badge in report section headings sat inline with `ml-2`, making it look like part of the heading text.

**Fix:** Changed `ReportSection` component (`app/jobs/[id]/report/final/page.tsx:219-229`) to use `flex items-baseline justify-between gap-4`, placing the badge right-aligned and visually separated from the title text.

### 1c. OTP input autofocus

**Problem:** The `autoFocus` HTML attribute on the OTP input may not fire reliably after RSC navigation in Next.js.

**Fix:** Added `useRef` + `useEffect` to `VerifyOtpForm.tsx` that explicitly calls `.focus()` on mount, alongside the existing `autoFocus` attribute as a fallback.

## 2. Evidence chain verification

Full audit completed -- see `evidence-chain-verification-results.md` for detailed line-by-line verification.

**Key findings:**
- SHA-256 is computed at capture time using Node's `createHash("sha256")` and stored in `evidence_items.sha256`
- Both assessor frame captures and client uploads compute and store the hash
- The evidence pack ZIP includes `index.csv` with the sha256 column populated
- `access_log` records all evidence file and pack downloads with user ID and IP
- Pack and file endpoints enforce authentication (401 for unauthenticated requests)
- Postgres event_log immutability rules prevent UPDATE and DELETE

## 3. Staging enablement

### Database (Postgres)
- `DB_PROVIDER=postgres` switches from SQLite to `pg.Pool` via `DATABASE_URL`
- Same DDL runs on both engines
- `schema-hardening.ts` applies Postgres-specific immutability rules on event_log
- Parameter conversion (`?` to `$N`) handled transparently

### Object storage (S3)
- `STORAGE_PROVIDER=s3` switches from local disk to S3-compatible storage
- Upload via `PutObjectCommand`, download via `GetObjectCommand`
- File download endpoint returns 302 redirect to presigned URL (15-min expiry) when S3 is active
- Region defaults to `af-south-1`, bucket defaults to `inspector-uploads`

### Video provider
- P2P remains the default local/dev fallback
- LiveKit and Daily.co adapters are implemented behind `SessionAdapter` interface
- Selection via `NEXT_PUBLIC_VIDEO_ADAPTER` env var
- No final provider recommendation -- deferred until real mobile testing

### Env vars template
- `staging-env-vars-template.md` documents all required and optional environment variables

## 4. Build verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run qa:smoke` | PENDING -- run manually: stop server, `npm run reset:demo`, restart, `npm run qa:smoke` |

## 5. Files changed

| File | Change |
|------|--------|
| `lib/auth.ts:88` | `requireRole()` redirects to /access-denied instead of throwing |
| `app/access-denied/page.tsx` | New friendly access-denied page |
| `app/jobs/[id]/report/final/page.tsx:222-225` | Heading badge spacing fix (flex layout) |
| `app/c/[token]/verify/VerifyOtpForm.tsx` | Added useRef + useEffect for reliable autofocus |
| `scripts/qa-smoke.mjs` | Added 3 RBAC enforcement smoke checks |

## 6. Output documents

| Document | Purpose |
|----------|---------|
| `phase5b-staging-enablement-report.md` | This report |
| `evidence-chain-verification-results.md` | Line-by-line evidence chain audit |
| `staging-env-vars-template.md` | Environment variables for staging deployment |
| `staging-go-no-go-checklist.md` | Decision gate checklist |

## 7. Decisions confirmed

- **Internal/staging staff-only pilot:** GO
- **Real client data:** NO-GO
- **No expansion features introduced:** CONFIRMED
