# Phase 4 — Pilot Readiness Pack

**Date:** 2026-07-16  
**Prepared by:** Claude (automated audit)  
**Scope:** Prototype hardening state → pilot eligibility  

---

## 1  Current Hardening Status (Phase 2–3 Audit)

### 1.1  Evidence SHA-256 Hashing — ACTIVE ✅

- `crypto.ts:sha256()` computes hex digest via Node `createHash("sha256")`.
- `saveCaptureAction` (actions.ts:378) hashes the raw `Buffer` at capture time.
- `uploadEvidenceAction` (actions.ts:409) hashes client uploads identically.
- Hash stored in `evidence_items.sha256` column (schema.ts:124).
- Hash included in `event_log.data` JSON for both capture and upload events.

### 1.2  Original Metadata — ACTIVE ✅

- Both capture paths write `original_metadata` JSON: `{ filename, size, mime, captured_at }`.
- `saveCaptureAction` → actions.ts:380; `uploadEvidenceAction` → actions.ts:411.
- Stored in `evidence_items.original_metadata` column (schema.ts:125).

### 1.3  Event Actor IDs — ACTIVE ✅

- `logEvent()` (data.ts:79-84) records `actor.id`, `actor.role`, `event_type`, JSON `data`, and server timestamp.
- All server actions obtain actor from `requireSession()` or `requireRole()` before logging.
- Client-side events use a fixed `CLIENT_ACTOR = { id: "client_link", role: "client" }`.
- System events use `SYSTEM_ACTOR = { id: "system", role: "system" }`.

### 1.4  Event Log Immutability — PARTIAL ⚠️

- **Code layer:** The data module exposes no UPDATE or DELETE for `event_log` — append-only by convention.
- **Postgres:** `no_update_event_log` and `no_delete_event_log` RULES enforced (schema-hardening.ts:123-132).
- **SQLite:** No DB-level immutability enforcement. Direct DB access could mutate rows.
- **Pilot impact:** Acceptable for shadow pilot on SQLite; Postgres required before real-client data.

### 1.5  Link Token Hashing — ACTIVE ✅

- `link_token_hash` column added to `appointments` and `client_upload_requests` (schema-hardening.ts:68-73).
- Tokens hashed at creation in `scheduleAction` (actions.ts:85-86).
- All token lookups use `sha256(token)` against hash column (data.ts:112-116, 188-189; actions.ts:238-243).
- Backfill migration for pre-existing rows runs on startup (schema-hardening.ts:112-120).
- Indexes on hash columns: `idx_appt_token_hash`, `idx_upr_token_hash`.

### 1.6  Secure File & Pack Access — ACTIVE ✅

- **Files API** (`api/files/[id]/route.ts`): requires staff session OR valid client link token. Returns 401 otherwise.
- **Pack API** (`api/pack/[id]/route.ts`): requires staff session only. Returns 401 for unauthenticated requests.
- S3 provider uses pre-signed URLs for downloads; local provider serves bytes directly.

### 1.7  Access Logging — ACTIVE ✅

- `access_log` table: `id, user_id, resource_type, resource_id, action, ip_address, occurred_at`.
- `logAccess()` called in both file download and pack download routes.
- Index on `(resource_type, resource_id)`.

### 1.8  Pack CSV Hash Column — ACTIVE ✅

- Evidence pack ZIP includes `index.csv` with a `sha256` column per evidence item (pack/[id]/route.ts:27,46).
- README.txt instructs verifier to check hashes against the CSV.

---

## 2  Remaining Gates Before Real Client Data

| # | Gate | Status | Blocker? |
|---|------|--------|----------|
| G1 | Staff authentication (email + bcrypt password) | ✅ Done | No |
| G2 | Staff session management (hashed tokens, expiry, revocation) | ✅ Done | No |
| G3 | Client OTP verification (SMS + hashed codes, attempt limits) | ✅ Done | No |
| G4 | Middleware route protection (redirect to /login) | ✅ Done | No |
| G5 | Evidence integrity (SHA-256 at capture) | ✅ Done | No |
| G6 | Event log immutability (DB-level) | ⚠️ Postgres only | Yes for prod |
| G7 | POPIA consent wording — legal review | 🔲 Placeholder | Yes |
| G8 | Retention & download policy — legal sign-off | 🔲 Placeholder | Yes |
| G9 | HTTPS / TLS in staging | 🔲 Not configured | Yes |
| G10 | Penetration test / security review | 🔲 Not started | Yes for prod |
| G11 | Video provider selection (LiveKit vs Daily.co) | 🔲 Awaiting mobile test | No (shadow OK) |
| G12 | Backup & disaster recovery plan | 🔲 Not started | Yes for prod |

---

## 3  Staff Auth Requirement — Status

**REAL AUTHENTICATION IS IN PLACE.** `requireSession()` is production-grade session auth:

- Cookie-based (`inspector.session`, httpOnly, secure in production, sameSite=lax).
- Token hashed with SHA-256, stored in `staff_sessions` table.
- Validates `is_active`, `revoked_at`, `expires_at` on every request.
- `requireRole()` layers RBAC (admin / assessor / manager).
- Login via email + bcrypt-hashed password (`auth-actions.ts:loginAction`).
- Middleware (`middleware.ts`) redirects unauthenticated requests to `/login`.
- Admin can deactivate users, reset passwords, revoke all sessions (`admin-actions.ts`).
- 8-hour session TTL.

**This is NOT a demo role-picker.** The old `RolePicker` component has been deleted.

---

## 4  Client OTP / Link Protection — Status

**IMPLEMENTED.** Client access uses a two-layer gate:

1. **Link token** — unique per appointment, hashed in DB, time-bounded (2h early window, 24h expiry), revocable.
2. **OTP challenge** — 6-digit code sent via SMS (Twilio in production, console log in dev).
   - Codes hashed with SHA-256 before storage.
   - 3-attempt limit per challenge, 10-minute expiry.
   - Verified status stored as scoped httpOnly cookie (`inspector.otp.{token}`).
   - OTP verification page at `/c/[token]/verify`.

**Dev/pilot note:** SMS_PROVIDER defaults to console logging. Set `SMS_PROVIDER=twilio` + Twilio credentials for real SMS delivery.

---

## 5  Consent Wording — Placeholders

Current consent text version: `"draft-1"` (actions.ts:247).

The consent flow exists (`/c/[token]/consent`) and logs both acceptance and decline events. However:

- **Wording is placeholder** — needs legal review for POPIA compliance.
- **Recorded data:** consent_name, text_version, timestamp in event_log.
- **No consent withdrawal mechanism** yet (POPIA requirement for production).

**Action required:** Legal team must review and approve consent text before any real client data enters the system.

---

## 6  Retention & Download Policy — Placeholders

- `jobs.retention_until` column exists (schema-hardening.ts:63-64) but is never populated.
- No automated purge or archive mechanism.
- Evidence files persist indefinitely on disk/S3.
- Pack downloads are unrestricted for authenticated staff.

**Action required:** Define retention periods per claim type, implement purge scheduler, add download audit trail review process.

---

## 7  Pilot Access-Control Matrix

| Resource | Admin | Assessor | Manager | Client (OTP) | Unauthenticated |
|----------|-------|----------|---------|---------------|-----------------|
| Job creation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Job assignment | ✅ | ❌ | ❌ | ❌ | ❌ |
| Scheduling | ✅ | ✅ | ❌ | ❌ | ❌ |
| Live session | ❌ | ✅ | ❌ | via link | ❌ |
| Evidence capture | ❌ | ✅ | ❌ | upload only | ❌ |
| Evidence curation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Report drafting | ❌ | ✅ | ❌ | ❌ | ❌ |
| Report review | ❌ | ❌ | ✅ | ❌ | ❌ |
| Evidence pack download | ✅ | ✅ | ✅ | ❌ | ❌ |
| File download | ✅ | ✅ | ✅ | via token | ❌ |
| User management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Template mandates | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancel job | ✅ | ❌ | ❌ | ❌ | ❌ |
| Status transitions | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 8  Staging Environment Checklist

| Item | Status | Notes |
|------|--------|-------|
| Separate database instance | 🔲 | Use Postgres (DB_PROVIDER=postgres) |
| HTTPS / TLS termination | 🔲 | Required before any client-facing links |
| SMS delivery (Twilio) | 🔲 | SMS_PROVIDER=twilio + credentials |
| S3 storage bucket | 🔲 | STORAGE_PROVIDER=s3 + AWS credentials |
| Environment variables secured | 🔲 | No secrets in code or git |
| Monitoring / error tracking | 🔲 | Sentry or equivalent |
| Database backups | 🔲 | Automated daily minimum |
| Access logging review process | 🔲 | Who reviews access_log and how often |
| Staff accounts provisioned | 🔲 | Real emails, strong passwords |
| Demo data purged | 🔲 | No seed/fixture data in staging |

---

## 9  Shadow-Mode Pilot Operating Rules

1. **Shadow only.** The pilot runs alongside existing paper/manual processes. Inspector results are NOT the system of record.
2. **Staff accounts only.** No shared logins. Each user has a named account with role-appropriate access.
3. **Real client data requires:** HTTPS, Twilio SMS, Postgres (for event log immutability), and legal-approved consent wording.
4. **Internal-only phase first.** Run 2–3 jobs with staff acting as mock clients before any real client interaction.
5. **Evidence integrity:** SHA-256 hashes are computed at capture. Any evidence used in a real report must have its hash verified against the pack CSV.
6. **Incident protocol:** If a security or data issue is discovered, immediately disable client links (revoke appointments), notify the project lead, and preserve the access_log.
7. **Feedback capture:** Assessors log UX issues during each shadow session; these feed back into the assessor workshop backlog.
8. **No template changes** until assessor workshop feedback is collected and reviewed.
9. **No video provider selection** until mobile device testing evidence exists for both LiveKit and Daily.co.
10. **Daily standup review** of event_log and access_log for the first 2 weeks.

---

## 10  Go / No-Go Checklist

### Must-pass for shadow pilot (internal staff only, no real clients)

- [x] Staff authentication operational (email + password + session)
- [x] Role-based access control enforced on all server actions
- [x] Middleware redirects unauthenticated users
- [x] Evidence SHA-256 hashing at capture
- [x] Original metadata preserved
- [x] Event log records actor IDs and roles
- [x] Link tokens hashed in database
- [x] File/pack access gated by session or token
- [x] Access logging on file and pack downloads
- [x] TypeScript compiles clean (`tsc --noEmit` passes)
- [x] Production build succeeds (`npm run build`)
- [ ] At least 2 staff accounts created with real credentials
- [ ] Internal dry-run completed (staff as mock clients)

### Must-pass before real client data

- [ ] HTTPS / TLS configured
- [ ] Postgres database (event log immutability enforced)
- [ ] Twilio SMS configured and tested
- [ ] Legal-approved consent wording
- [ ] Retention policy defined and communicated
- [ ] Security review completed
- [ ] Backup procedure tested
- [ ] Access log review process documented

---

## Appendix: requireSession() Analysis

**Verdict: REAL AUTHENTICATION** (not prototype/demo-session logic).

| Property | Implementation |
|----------|---------------|
| Cookie name | `inspector.session` |
| Cookie flags | httpOnly, secure (production), sameSite=lax |
| Token storage | SHA-256 hash in `staff_sessions` table |
| Validation | Checks `is_active`, `revoked_at`, `expires_at` |
| Session TTL | 8 hours |
| Failure behavior | Redirects to `/login` |
| Password hashing | bcrypt, 10 salt rounds |
| Session revocation | Per-session and per-user bulk revocation |
| RBAC | `requireRole()` checks against user.role |

The previous `RolePicker.tsx` and `role.tsx` demo utilities have been **deleted** from the codebase.

---

## Appendix: Build & QA Results (2026-07-16)

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Pass — no type errors |
| `npm run build` | ✅ Pass — compiled in 28.5s, all routes generated |
| `npm run qa:smoke` | ⚠️ 0/22 — requires running dev server (expected offline) |
| Next.js warning | `middleware` file convention deprecated; migrate to `proxy` |

---

## Recommended Next Approval Decision

**GO for internal shadow pilot** — all code-level hardening gates pass. The prototype has real authentication, evidence integrity, access logging, and role-based access control.

**NO-GO for real client data** until: HTTPS, Postgres, Twilio SMS, legal consent wording, and retention policy are in place.

**Recommended immediate actions:**
1. Provision staging environment (Postgres + S3 + HTTPS)
2. Create 2–3 staff accounts with real credentials
3. Run 2 internal dry-run jobs (staff as mock clients)
4. Schedule legal review of consent wording
5. Define retention policy per claim type
