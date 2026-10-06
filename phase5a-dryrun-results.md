# Phase 5A — Internal Shadow Pilot Dry Run Results

**Date**: 2026-07-16
**Environment**: Production build (`next build` + `next start`), Next.js 16.2.10 (Turbopack)
**Database**: SQLite (pristine seeded book — 18 fake jobs, 4 demo staff)
**Real client data**: NO (confirmed — all data is obviously fake role-play)

---

## Scenarios executed

### Scenario 1: Storm damage claim (j7 — INS-2026-0007)
- Logged in as Lerato (admin) — viewed pipeline ✓
- Navigated to j3 storm job detail — event log with actor IDs ✓
- Client link `/c/demo-storm` — OTP sent, phone masked (`082 *** 103`) ✓
- OTP verified — redirected to client landing page with safety wording ✓
- Logged in as Anje (assessor) — report builder with prefilled narrative ✓
- Report v1 submitted — status changed to "Report submitted" ✓
- Logged in as Craig (manager) — review queue shows j7 ✓
- Returned report with comments — status "Returned for correction" ✓
- Logged in as Anje — return comments displayed, resubmitted as v2 ✓
- Logged in as Craig — approved v2 — status "Report completed", locked ✓
- Evidence pack ZIP downloaded (1633 bytes) ✓
- Full version history: v1 submitted → returned → v2 submitted → approved ✓

### Scenario 2: Accidental damage claim (j9 — INS-2026-0009)
- Pre-existing "Returned for correction" state ✓
- Manager return comments displayed to assessor ✓
- Accidental damage template v0.2 — peril-adaptive wording ✓
- Resubmitted as v2 — status changed correctly ✓
- Version history shows full chain ✓

### Scenario 3: Residential risk survey (j13 — SRV-2026-0013)
- Survey report builder with correct structure: Risk description, COPE findings, Recommendations register, Risk grading ✓
- No "Cause of loss" section (correct for surveys) ✓
- Survey-specific limitations wording ✓
- SRV- job numbering ✓
- Submitted v1 — status changed correctly ✓

---

## Checklist results

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Login works | **PASS** | Email+password, bcrypt hash, httpOnly session cookie, 8-hour expiry |
| 2 | RBAC works | **PASS** | Admin blocked from `/manager` (server-side `requireRole`). `createJobAction` requires admin, `submitReportAction` requires assessor, `reviewReportAction` requires manager |
| 3 | OTP flow works | **PASS** | Code sent to console (dev mode), phone masked, 6-digit entry, 10-min expiry. Wrong code rejected with "2 attempts remaining" — rate limiting enforced (max 3) |
| 4 | Expired/revoked token handling | **PASS** | Sign-out sets `revoked_at` on server, clears cookie. Revoked sessions cannot access protected routes. All 5 sessions created during dry run correctly tracked with create/expiry/revoke timestamps |
| 5 | Evidence hashing works | **PARTIAL** | `sha256(bytes)` computed at capture time in both `captureEvidenceAction` and `uploadEvidenceAction`. Hash stored in `evidence_items.sha256` and logged in event data. Seeded demo items are placeholders with no file bytes → sha256 is null. **Code path is correct; needs real capture to produce hashes** |
| 6 | Pack CSV includes SHA-256 | **PASS** (structural) | `index.csv` header: `fig,filename,label,kind,section,checklist_item,captured_at,featured,sha256,note`. Values empty for placeholder tiles; will populate on real captures |
| 7 | Unauthenticated file/pack access returns 401 | **PASS** | `/api/files/[id]` → 401. `/api/pack/[id]` → 401. Both tested with `credentials: 'omit'` |
| 8 | access_log records downloads | **PASS** | Pack download by `u-craig` logged: `evidence_pack | j7 | download | 2026-07-16 10:29:00`. File downloads also logged via `logAccess` |
| 9 | event_log records actor IDs | **PASS** | All events record `actor` (user ID) and `actor_role`. j7 chain: `report_submitted(u-anje/assessor) → report_returned(u-craig/manager) → report_revision_started(u-anje/assessor) → report_submitted(u-anje/assessor) → report_approved(u-craig/manager)` |
| 10 | Report return/approve cycle works | **PASS** | Full four-eyes cycle: submit → return with mandatory comments → revise → resubmit (v2) → approve → lock. Report locked in UI (no review panel after approval). Two-step confirmation on return. Version history shows full audit trail |

---

## Consolidated blocker list

### Blockers (must resolve before staging)

| # | Blocker | Severity | Detail |
|---|---|---|---|
| B1 | No real evidence capture in dry-run | Medium | Seeded evidence is placeholder tiles — SHA-256 hashes cannot be verified end-to-end until a real capture loop runs. The code path is verified correct in source, but the complete chain (capture → hash → CSV → verify) has not been exercised |
| B2 | Mobile live room not verified | High | Desktop↔desktop only. Phones require HTTPS; work laptop policy blocks local certs. Must verify before any real-client pilot |
| B3 | No TURN relay | High | P2P WebRTC only. Corporate NAT/CGNAT environments may fail silently. Affects real-world usability |
| B4 | In-memory signaling | Medium | Single-process signaling store. Server restart drops all live room connections. Not acceptable for staging |
| B5 | SQLite + local disk | Medium | No backups, no replication. Acceptable for dry-run but not for shadow pilot with even anonymised data retention |

### Non-blockers (known, acceptable for shadow pilot)

| # | Item | Detail |
|---|---|---|
| N1 | Browser print-to-PDF only | No server-side PDF generation. Acceptable for pilot |
| N2 | Templates v0.1-1F pending sign-off | Workshop required before production use |
| N3 | RBAC error is unhandled 500 | `requireRole` throws, surfaced as generic server error. Should show a friendly "Access denied" page |

---

## UX findings

| # | Finding | Severity | Location |
|---|---|---|---|
| U1 | RBAC denial shows raw "server error" page | Low | `/manager` as admin → "This page couldn't load. A server error occurred." Should show a role-specific access denied message |
| U2 | "Limitations & outstanding items" heading runs into "AUTO" tag | Cosmetic | Report final page — `heading "6. Limitations & outstanding itemsAUTO"` needs a space or line break before the badge |
| U3 | OTP entry field has no auto-focus | Low | `/c/[token]/verify` — user must click into the field. Should auto-focus for faster entry |
| U4 | Login form has no "forgot password" flow | Low | Expected for production but acceptable for pilot |
| U5 | Evidence pack is small for placeholder items | Info | 1633 bytes — correctly annotated as "placeholder tile (seeded demo item, no file)" in index.csv |
| U6 | Return button requires two clicks (confirmation step) | Neutral | Actually good UX — prevents accidental returns. Assessor sees it as "Return for correction…" → "Confirm return with comments" |

---

## Template/report feedback

| # | Item | Applies to | Detail |
|---|---|---|---|
| T1 | Storm report prefill is detailed and useful | Storm template | Summary, circumstances, findings all auto-populated from checklist. Good assessor time savings |
| T2 | Accidental damage wording is appropriate | Accidental template | "Glass hob cracked by dropped pot" — clear, mechanism-based. Cause section prompts for consistency check |
| T3 | Survey report structure is distinct and correct | Residential survey | COPE headings, recommendations register with Requirement/Improvement, A–E grading. No cause-of-loss section |
| T4 | Conclusion section defaults to placeholder | All templates | "Assessment complete. [Assessor recommendation.]" — assessors will need to replace the bracket text |
| T5 | "Not covered during the session" list is auto-generated | All templates | Correct — non-removable, lists all uncovered checklist items. Insurer transparency |
| T6 | Survey limitations wording includes physical-survey fallback | Survey template | "NOT adequately surveyable virtually" auto-added when surveyable=No. Verified on j16 in the seeded book |

---

## Recommendation

### **CONDITIONAL GO — proceed to staging with conditions**

The core workflow engine, authentication, RBAC, OTP, audit logging, report lifecycle, and evidence pack generation all work correctly in production build mode. No data integrity or security issues were found during the dry run.

**Conditions before staging**:

1. **Resolve B3+B4**: Deploy behind a TURN relay and move signaling to persistent storage (Redis or DB) before any session with assessors on different networks
2. **Resolve B5**: Migrate to Postgres + object storage (Step 6 already built — activate it)
3. **Exercise the capture→hash→CSV chain** (B1): Run at least one end-to-end session with real frame captures to verify SHA-256 hashes appear in the evidence pack CSV
4. **Fix U1**: Add a friendly access-denied page instead of raw 500 on role violations

**Can proceed to staging without**:
- Mobile verification (B2) — desktop-to-desktop is sufficient for the initial shadow pilot if assessors use laptops
- Server PDF — browser print-to-PDF is acceptable for pilot
- Template workshop sign-off — templates are marked as v0.1-1F, assessors understand they're draft

**Real client data remains NO-GO** until POPIA safeguards, retention policy, and production hardening (Gate G6–G10) are complete.
