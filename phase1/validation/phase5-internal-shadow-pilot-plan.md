# Phase 5 — Internal Shadow Pilot Plan

**Date:** 2026-07-16  
**Scope:** Staff-only internal dry run — no real clients, no production deployment  
**Duration:** 1–2 weeks (3 dry-run scenarios)  
**Prerequisite:** Phase 4 Pilot Readiness Pack approved (GO for shadow pilot)

---

## 1  Objective

Validate the full Inspector workflow end-to-end using staff members as mock clients. Confirm that hardening controls (auth, RBAC, evidence integrity, access logging, token security) function correctly under realistic usage before any real client data enters the system.

---

## 2  Staff Accounts

Three named accounts provisioned in the seeded database:

| Account | Name | Role | Email | Purpose |
|---------|------|------|-------|---------|
| Pilot Admin | Lerato Molefe | admin | lerato@acorn.demo | Creates jobs, assigns assessors, manages users |
| Pilot Assessor | Sipho Dlamini | assessor | sipho@acorn.demo | Conducts sessions, captures evidence, drafts reports |
| Pilot Manager | Craig Bennett | manager | craig@acorn.demo | Reviews and approves/returns reports |

**Mock clients:** Staff members use personal phones to receive OTP codes and complete the client flow. Anje Pretorius (assessor, anje@acorn.demo) can act as a second assessor or mock client.

**Password:** `inspector-dev-2026` (dev seed default — change before any staging deployment).

---

## 3  Dry-Run Scenarios

### Scenario 1: Storm Damage Claim

| Step | Actor | Action | Validates |
|------|-------|--------|-----------|
| 1 | Admin (Lerato) | Log in → create storm job → assign to Sipho | Staff login, RBAC, job creation |
| 2 | Admin (Lerato) | Schedule appointment → copy client link | Token generation, link_token_hash |
| 3 | Mock client (Anje) | Open link → receive OTP → verify → consent → device check | OTP flow, consent logging, token expiry window |
| 4 | Assessor (Sipho) | Admit client → conduct live session → capture evidence | Session management, evidence SHA-256, metadata |
| 5 | Assessor (Sipho) | End session → review evidence gallery → curate labels | Evidence curation, event logging |
| 6 | Assessor (Sipho) | Draft report → submit | Report lifecycle, actor IDs in events |
| 7 | Manager (Craig) | Review report → return with comments | Manager review, return flow |
| 8 | Assessor (Sipho) | Revise → resubmit | Revision cycle |
| 9 | Manager (Craig) | Approve report | Approval, status lock |
| 10 | Admin (Lerato) | Download evidence pack → verify CSV hashes | Pack access, SHA-256 verification |

### Scenario 2: Accidental Damage Claim

| Step | Actor | Action | Validates |
|------|-------|--------|-----------|
| 1 | Admin | Create accidental damage job → assign | Different template type |
| 2 | Admin | Schedule → send link | Token generation |
| 3 | Mock client | Open link with expired token | Expired token rejection |
| 4 | Admin | Reschedule → issue new link | Token revocation, new token |
| 5 | Mock client | Open new link → complete OTP → consent | Rescheduled flow |
| 6 | Assessor | Conduct session → capture high-res client photos | Client upload path, mime validation |
| 7 | Assessor | Flag missing items → send upload request | Missing-item workflow |
| 8 | Mock client | Upload requested evidence | Client upload, hash computation |
| 9 | Assessor | Submit report | Direct approval path |
| 10 | Manager | Approve on first submission | Clean approval |

### Scenario 3: Residential Survey

| Step | Actor | Action | Validates |
|------|-------|--------|-----------|
| 1 | Admin | Create residential survey job | Survey job type, template selection |
| 2 | Admin | Schedule → mark no-show | No-show flow, status transitions |
| 3 | Admin | Reschedule | Re-attempt flow |
| 4 | Mock client | Complete the flow | Second-attempt link |
| 5 | Assessor | Conduct survey session | Survey-specific checklist items |
| 6 | Assessor | Submit survey report (COPE, risk grading) | Survey report format |
| 7 | Manager | Review survey report | Survey review |
| 8 | Admin | Cancel a separate test job | Cancellation flow, link revocation |

---

## 4  Security Controls to Validate

Each dry run must explicitly confirm:

1. **Staff login** — email + password, redirect to role-appropriate dashboard
2. **RBAC** — assessor cannot create jobs; manager cannot capture evidence
3. **Client link** — valid token resolves; invalid token shows error
4. **OTP** — code delivered (console in dev), verified, attempt limit enforced
5. **Expired/revoked tokens** — rejected with appropriate message
6. **Evidence SHA-256** — hash recorded in DB and event log at capture time
7. **Original metadata** — JSON with filename, size, mime, captured_at stored
8. **Event actor IDs** — all events have correct actor.id and actor.role
9. **Access logging** — file and pack downloads logged in access_log table
10. **File access 401** — unauthenticated request to /api/files/[id] returns 401
11. **Pack access 401** — unauthenticated request to /api/pack/[id] returns 401
12. **Pack CSV hash column** — index.csv includes sha256 per evidence item
13. **Manager return/approve** — full review cycle with comments

---

## 5  Out of Scope

- No real client data
- No real client contact or phone numbers
- No production deployment
- No template or report wording changes (unless captured as workshop feedback)
- No video provider selection (awaiting mobile testing evidence)
- No POPIA consent wording finalization (awaiting legal review)

---

## 6  Success Criteria

The internal shadow pilot is complete when:

1. All 3 scenarios have been executed end-to-end
2. All 13 security controls have been validated
3. All findings are logged in phase5-findings-log
4. No critical or high-severity issues remain unresolved
5. The system is confirmed GO for staging environment buildout
