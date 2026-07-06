# Phase 1 end-to-end QA & demo readiness pass — 2026-07-06 (post-1F)

Scope: stabilise the multi-assessment/survey prototype for management/internal
review. No new product features. Excluded scope (auth/MFA/permissions, POPIA
hardening, AI, integrations, recording, WhatsApp, real-client data,
Daily.co/LiveKit, full template builder) — **not touched**.

Build gate: `npx tsc --noEmit` clean · `npm run build` clean (all 21 routes).
Automated net: `npm run qa:smoke` — **22/22 PASS** on the pristine seeded book.

## Results by flow

| # | Flow | Result | Notes |
|---|---|---|---|
| 1 | Storm primary demo (j3 + j7) | **PASS** | Seeded job opens with v0.1-1F template; client link walks early-state → consent → camera-check fallback → waiting room; readiness dots light on assessor dashboard; live-room checklist verified on the in-progress job; report prefills carry SAWS weather corroboration, maintenance-separation wording (with concern flag) and roof safe-vantage/hybrid wording; full submit → return → revise → resubmit (v2) → approve cycle run; evidence pack downloaded and extracted. |
| 2 | Accidental end-to-end (new job INS-2026-0019) | **PASS** | Created via UI, assigned, scheduled (link + paste-ready SMS), client pre-join walked, session run (mock start; admit button correctly requires a live client), checklist answers persisted, HI-RES tag on serial/model plate confirmed, report generated/submitted/approved, pack downloaded. |
| 3 | General non-motor / peril selector (new job INS-2026-0020, Glass) | **PASS** | Peril choice saved; report summary reads "reported glass (general non-motor)" and cause section adapts to the selected peril; dedicated Power Surge template wording verified on j5/j8; limitations list uncovered items correctly. |
| 4 | Survey workflow (j13, j14, j15, j16) | **PASS** | Residential survey report generated and approved: COPE findings, Requirement-vs-Improvement recommendations register with timelines, A–E grading (surveyor judgement), survey limitations wording — **no cause-of-loss section**; j16 renders "NOT adequately surveyable virtually — physical survey recommended"; survey client link uses survey prep wording; commercial survey bookable but flagged `0.1-1F-limited`. |
| 5 | Fire reference-only regression | **PASS** | Picker shows fire disabled with "not bookable" wording; `createJobAction` rejects reference-only templates server-side; triage-only scope documented in the stored template. |
| 6 | Geyser regression | **PASS** | j6 upload flow: both missing items (plumber invoice, rating plate) uploaded via client page, resolved live, files stored and tagged; j10 approved/locked report renders. Geyser no longer the hero demo — book leads with storm/multi-peril/surveys. |
| 7 | Manager review & locking | **PASS** | Return requires comments; comments shown to assessor; resubmit creates v2 with version history; approve → Report completed; builder read-only, gallery "locked"; server-side: `updateEvidenceAction` throws on completed jobs, status machine has no outgoing edges from Report completed (re-submit throws), `reviewReportAction` rejects non-manager roles. |
| 8 | Evidence pack regression | **PASS** | Packs for storm (j7), accidental (INS-2026-0019), residential survey (j13) + geyser (j6) all download and extract; `index.csv` + `README.txt` present; real uploads land under `evidence/` named fig-section-label; seeded placeholder tiles annotated "no file" in the index. |
| 9 | Demo reset | **PASS** | `npm run reset:demo` (server stopped) removed 11 files/folders; re-seed on first request; 22/22 smoke checks green afterwards. |

## Bugs found and fixed

No functional bugs found. Fixed in this pass:

1. **prototype/README.md was stale** — advertised the removed `/c/demo-geyser`
   link, omitted the new demo links (storm/theft/survey/live), and its scope
   guards still said "no surveys, no fire claims" (superseded by approved 1F).
   Corrected; reset instructions now point at `npm run reset:demo`.
2. **qa-smoke marker strings** (new script) adjusted for Next.js RSC payload
   chunking — test-side fix, no app change.

Observations logged as accepted (not bugs): raw event types in live timeline
entries (deliberate audit transparency); seeded evidence tiles have no image
files (annotated honestly in packs); admit button requires a live client on
the signalling channel (mock start covers single-window demos).

## Artifacts of this pass

- `prototype/scripts/reset-demo.mjs` + `npm run reset:demo` — safe demo reset.
- `prototype/scripts/qa-smoke.mjs` + `npm run qa:smoke` — repeatable 22-check suite.
- `phase1/demo-guide.md` — management demo runbook (order, roles, jobs, proofs, honest limitations).
- `phase1/known-limitations.md` — limitations register (L1–L14 + cosmetic).
- `phase1/regression-checklist.md` — manual checklist for future chunks.
- `prototype/README.md` — corrected entry points and scope guards.
