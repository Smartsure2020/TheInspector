# Phase 5 — Dry-Run Checklist

Use this checklist during each scenario run. Mark each item pass/fail with the date, scenario, and any notes.

---

## A  Staff Authentication & RBAC

| # | Control | How to test | Pass? | Notes |
|---|---------|-------------|-------|-------|
| A1 | Staff login | Log in with email + password for each role (admin, assessor, manager) | | |
| A2 | Redirect to role dashboard | After login, user lands on /admin, /assessor, or /manager as appropriate | | |
| A3 | Admin cannot access /assessor | Navigate to /assessor while logged in as admin → expect error or redirect | | |
| A4 | Assessor cannot create jobs | Attempt to reach /jobs/new as assessor → expect error | | |
| A5 | Manager cannot capture evidence | Attempt evidence upload as manager → expect error | | |
| A6 | Session expiry | Wait 8+ hours (or manually expire in DB) → next request redirects to login | | |
| A7 | Logout | Click logout → session cookie cleared, redirects to /login | | |

## B  Client Link & OTP

| # | Control | How to test | Pass? | Notes |
|---|---------|-------------|-------|-------|
| B1 | Valid link resolves | Open a scheduled client link → redirected to OTP page | | |
| B2 | OTP delivered | Check console log (dev) or SMS (staging) for 6-digit code | | |
| B3 | Correct OTP accepted | Enter correct code → redirected to consent page | | |
| B4 | Wrong OTP rejected | Enter wrong code → error with remaining attempts | | |
| B5 | OTP attempt limit | Enter wrong code 3 times → locked out, request new code | | |
| B6 | OTP expiry | Wait 10+ minutes → code expired message | | |
| B7 | Invalid link | Open /c/not-a-real-token → "isn't recognised" error | | |
| B8 | Expired link | Open link after appointment + 24h → expired message | | |
| B9 | Revoked link | Reschedule appointment, then open old link → revoked message | | |
| B10 | Cancelled job link | Cancel job, then open link → revoked message | | |

## C  Evidence Integrity

| # | Control | How to test | Pass? | Notes |
|---|---------|-------------|-------|-------|
| C1 | SHA-256 at capture | Capture evidence → check evidence_items.sha256 is populated | | |
| C2 | SHA-256 in event log | Check event_log entry for evidence_captured includes sha256 in data | | |
| C3 | Original metadata | Check evidence_items.original_metadata JSON: filename, size, mime, captured_at | | |
| C4 | Client upload hash | Upload as client → same checks as C1–C3 | | |
| C5 | Pack CSV hash | Download evidence pack → open index.csv → sha256 column populated | | |
| C6 | Hash verification | Compute SHA-256 of a downloaded file → matches CSV value | | |

## D  Event Log & Access Log

| # | Control | How to test | Pass? | Notes |
|---|---------|-------------|-------|-------|
| D1 | Actor ID in events | Query event_log → actor column has user ID, not "system" | | |
| D2 | Actor role in events | Query event_log → actor_role column matches user's role | | |
| D3 | Status change events | Transition a job → event_log records from/to statuses | | |
| D4 | File download logged | Download an evidence file → check access_log for the entry | | |
| D5 | Pack download logged | Download evidence pack → check access_log entry | | |
| D6 | IP address captured | Check access_log.ip_address is populated | | |

## E  Access Control Enforcement

| # | Control | How to test | Pass? | Notes |
|---|---------|-------------|-------|-------|
| E1 | File 401 unauthenticated | curl /api/files/{id} without cookie → 401 | | |
| E2 | Pack 401 unauthenticated | curl /api/pack/{id} without cookie → 401 | | |
| E3 | Client file access via token | Append ?token=... to file URL → file served | | |
| E4 | Client file access invalid token | Append ?token=fake to file URL → 401 | | |
| E5 | Middleware redirect | Visit /admin without cookie → redirect to /login | | |

## F  Report Lifecycle

| # | Control | How to test | Pass? | Notes |
|---|---------|-------------|-------|-------|
| F1 | Draft report | Assessor starts report → draft saved | | |
| F2 | Submit report | Assessor submits → status changes to "Report submitted" | | |
| F3 | Manager return | Manager returns with comments → status "Returned for correction" | | |
| F4 | Revision cycle | Assessor revises and resubmits → new version | | |
| F5 | Manager approve | Manager approves → status "Report completed" | | |
| F6 | Locked after approval | Evidence curation blocked on completed job | | |

---

## Sign-off

| Scenario | Date | Run by | Result | Blockers |
|----------|------|--------|--------|----------|
| 1: Storm | | | | |
| 2: Accidental | | | | |
| 3: Survey | | | | |
