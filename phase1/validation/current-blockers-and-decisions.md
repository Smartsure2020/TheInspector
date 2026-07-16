# Current blockers and decisions — The Inspector

**As of:** 2026-07-13
**Prototype version:** Post-Step 6 (dual-provider database + S3 storage)
**Last commit:** `3c3f79a` — feat: dual-provider database (SQLite/Postgres) + S3 storage abstraction

---

## What is complete

| Step | Description | Status | Evidence |
|------|-------------|--------|----------|
| 0 | Housekeeping (dark-mode fix, decision register) | Done | Commits `6baa865`, `cf80c8b` |
| 1 | Adapter factory + LiveKit + Daily.co adapters | Done | Commit `936a2bf` |
| 2 | Mobile verification plan (document only) | Done | `phase1/mobile-verification-plan.md` |
| 3 | Workshop prep docs | Done | `phase1/workshop/00-workshop-agenda.md`, `01-review-workbook.md` |
| 6 | Postgres + S3 dual-provider migration | Done | Commit `3c3f79a`. tsc clean, build clean, 22/22 smoke |

All code changes verified: TypeScript clean, Next.js build clean, 22/22 smoke tests pass.

---

## What is blocked and why

### Step 4: Apply workshop feedback (Phase C)

**Blocked on:** Workshop has not been run yet.
**Unblocks:** Template validation (G3), template ownership (D-07), pilot volunteers (D-08).
**Action required:** A human must schedule and run the assessor workshop using
the materials in `phase1/validation/workshop-run-pack.md`.
**Cannot be worked around.** Template feedback does not exist until assessors provide it.

### Step 5: Video provider decision (Phase E)

**Blocked on:** Real-device mobile testing has not been done.
**Unblocks:** Provider selection (G2, D-11), mobile verification (G1).
**Action required:** A human must run SP1–SP10 on real phones with each adapter
using `phase1/validation/provider-mobile-test-pack.md`.
**Cannot be worked around.** Standing rule: no provider recommendation without real-device evidence.

### Step 7: Production hardening (Phase H)

**Blocked on:** Explicit user approval to begin production hardening.
**Unblocks:** Auth (G6), secure storage (G7), audit (G8), retention (G9), POPIA (G10), PDF (G11), deployment (G12).
**Current standing instruction:** "No production code yet." This is a deliberate
deferral, not an oversight.
**Also blocked on:** Pilot evidence (Phase G) that justifies the hardening investment.

### Step 8: Expansion (Phase I)

**Blocked on:** Each item needs its own decision and scope document.
**No items approved for implementation.**

---

## Pending decisions (not yet made)

| ID | Decision | Waiting on | Who decides |
|----|----------|-----------|-------------|
| D-06 | Report review process + quantum figures | Workshop (W4) | Management + assessors |
| D-07 | Template ownership — named owner per claim type | Workshop (W2) | Assessors + management |
| D-08 | Pilot assessor volunteers | Workshop (W6) | Assessors (volunteers, not conscripts) |
| D-11 | Final video provider choice | Mobile test results | Management (recommendation from tester) |

---

## Decisions already made (for reference)

| ID | Decision | Outcome | Date |
|----|----------|---------|------|
| D-01 | Product name | Codename "The Inspector"; legal check before client use | 2026-07-07 |
| D-02 | Claim types | All 8 perils built; workshop to validate | 2026-07-07 |
| D-03 | Surveys | Both types built; commercial flagged limited | 2026-07-07 |
| D-04 | Video recording | Excluded from prototype and pilot | 2026-07-07 |
| D-05 | High-res photo | Mandatory; built in 1D | 2026-07-07 |
| D-09 | Pilot mode | Shadow mode; ≥10 claims; G4 gate before real data | 2026-07-07 |
| D-10 | Pilot success criteria | Proposed metrics accepted in principle | 2026-07-07 |
| D-11 | Provider direction | Evaluate LiveKit + Daily.co; pick one winner | 2026-07-07 |

---

## Gates status

| Gate | Description | Status | Blocker |
|------|-------------|--------|---------|
| G1 | Mobile live-room verification | **Not passed** | Needs real-device testing |
| G2 | Video provider decision | **Not passed** | Needs G1 results + management decision |
| G3 | Assessor template sign-off | **Not passed** | Needs workshop |
| G4 | Minimum live-data safeguards | **Not approved** | Needs management/compliance sign-off on checklist |
| G5 | Postgres + object storage | **Code complete** | Needs deployment + provisioning for pilot |
| G6 | Production auth | **Not started** | Blocked on Step 7 approval |
| G7 | Secure storage | **Not started** | Blocked on Step 7 approval |
| G8 | Audit hardening | **Not started** | Blocked on Step 7 approval |
| G9 | Retention controls | **Not started** | Blocked on Step 7 approval |
| G10 | POPIA finalisation | **Not started** | Blocked on Step 7 approval |
| G11 | Server PDF | **Not started** | Blocked on Step 7 approval |
| G12 | Real deployment | **Not started** | Blocked on Step 7 approval |
| G13 | Template governance | **Not passed** | Needs workshop (D-07) |

---

## What can happen now (no code changes needed)

These activities are unblocked and can run in parallel:

1. **Schedule the assessor workshop** — all materials are ready
   - Use: `phase1/validation/workshop-run-pack.md`
2. **Run mobile/provider testing** — all adapters are built, test plans exist
   - Use: `phase1/validation/provider-mobile-test-pack.md`
   - Prerequisite: `cloudflared` installed or Render deployment set up
3. **Review the pre-pilot safeguard checklist** with management/compliance
   - Use: `phase1/validation/pre-pilot-safeguard-checklist.md`
   - This is definition and approval only — no code

---

## What CANNOT happen yet

| Activity | Why not | Gate |
|----------|---------|------|
| Real client data in any environment | G4 not approved; safeguards not implemented | G4 |
| Production hardening code | User has not approved; pilot evidence needed first | G6–G12 |
| New features or perils | Each needs a decision + scope doc | Phase I |
| Template changes | Workshop feedback doesn't exist yet | G3 |
| Default video provider selection | Mobile testing not done | G2 |
| Internet-facing deployment (persistent) | No auth, no encryption, no access control | G6, G12 |
| Claiming "clients can join from their phone" | Mobile verification not done | G1 |

---

## Recommended next actions (human)

1. **This week:** Schedule the workshop. Book 90 minutes with 3–5 assessors.
2. **This week:** Install `cloudflared` and test the tunnel works (5 minutes).
3. **Next available block:** Run the mobile/provider test session (2–3 hours).
4. **After workshop + testing:** Bring results to management for D-07, D-08, D-11 decisions.
5. **When ready:** Review pre-pilot safeguard checklist with compliance.
