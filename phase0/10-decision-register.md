# 10 — Decision Register for Acorn Management

Each decision: options, recommendation, owner and date fields to be completed.
Sources: this pack + the assessor workshop outputs (W1–W7 in doc 03). All decisions
must be **Decided** or **Deferred (with named owner + date)** before Phase 0 exit.

| ID | Decision | Options | Recommendation | Decided by / Date | Decision |
|----|----------|---------|----------------|-------------------|----------|
| D-01 | **Product name / codename** | (a) Keep "The Inspector" internally, decide client-facing name before anything client-visible ships (conflicts with theinspector.co.za); (b) rename now | (a) — codename only, legal/name search before Phase 2 client pilot | Mgmt demo / 2026-07-07 | **(a) Codename only.** Keep "The Inspector" internally; legal/trademark check required before any client-facing use. |
| D-02 | **Claim types for first prototype** | Any subset of the six templates | Geyser/water + accidental damage (highest volume + fastest sessions); add storm in pilot week 3 | Workshop W1 + mgmt | **Superseded by 1F.** All eight claim perils built (storm/geyser/accidental/theft/power surge/burst pipe/general non-motor + fire reference-only). Assessor workshop (Phase B) to validate. |
| D-03 | **Surveys in first prototype?** | (a) Deferred — claims only; (b) residential survey included; (c) both survey types | (a) Deferred. Engine is shared; add surveys once the room UX is proven | Mgmt demo / 2026-07-07 | **(c) Both survey types built.** Residential active; commercial flagged v0.1-1F-limited. Assessor workshop to validate. |
| D-04 | **Full video recording excluded from MVP?** | (a) Excluded — screenshots + structured data only; (b) optional per job; (c) always record | (a) Excluded. Cuts storage, cost and privacy exposure; revisit with dispute experience. Needs a sanity check that stills + event log satisfy evidential needs | Mgmt demo / 2026-07-07 | **(a) Excluded.** No recording in prototype or pilot. Revisit post-pilot with dispute experience. |
| D-05 | **High-res photo capture mandatory?** | (a) Mandatory prototype feature — templates rely on it for plates/serials/documents; (b) nice-to-have | (a) Mandatory. Video frames (~720p) cannot read a rating plate; without this the geyser and theft templates fail | Mgmt demo / 2026-07-07 | **(a) Mandatory.** Built in 1D; verified desktop-to-desktop. |
| D-06 | **Who reviews reports? And do reports carry quantum figures?** | Reviewer: manager / senior assessor peer / claims-side reviewer. Quantum: figures vs observations-only | Manager–Reviewer role reviews all pilot reports; quantum per workshop W4 outcome | Workshop 2026-07-07 + mgmt | **Manager reviews all reports.** Manager–Reviewer flow confirmed. Quantum: observations-only for now; revisit post-pilot. |
| D-07 | **Who owns templates?** | Named senior assessor per claim type (from workshop W2) vs one central owner | One named owner per claim type + one overall template custodian; changes versioned | Workshop 2026-07-07 | **Template mandate via user management.** No individual template owners assigned. Instead: admin UI to manage users (admin/assessor/manager) and assign template mandates per user. Built as part of production hardening (G6). |
| D-08 | **Pilot assessor group** | 2–3 named volunteers from workshop W6 | Volunteers over conscripts — adoption risk is the biggest project risk | Workshop 2026-07-07 | **All in-house staff.** Full team participates — no separate volunteer group needed. |
| D-09 | **Pilot claim volume & mode** | Volume target and shadow vs live mode | ≥10 claims in **shadow mode** (virtual alongside existing process, outputs compared); geyser-only for the first 2 weeks. Staged data rule: role-played + anonymised historical claims first; **real-client shadow testing only after the live-data safeguard gate below is approved** | Mgmt demo / 2026-07-07 | **Shadow mode confirmed.** ≥10 claims, virtual alongside physical. Live-data safeguard gate (G4) still required before real-client data. |
| D-10 | **What counts as a successful pilot** | Define pass/fail now, not after | Proposed: ≥8/10 assessments completed end-to-end without facilitator help; ≥8/10 reports accepted by reviewer with ≤1 correction round; capture loop <3s in real sessions; ≥2 of 3 pilot assessors say they'd choose it over the current method; client join unaided ≥80% of attempts | Mgmt demo / 2026-07-07 | **Proposed criteria accepted in principle.** Final metrics to be confirmed after workshop feedback. |

| D-11 | **Video provider direction** | (a) Stay P2P only; (b) evaluate LiveKit + Daily.co, pick one; (c) commit to a single provider now | (b) Evaluate both, pick one — behind SessionAdapter only | Mgmt demo / 2026-07-07; testing completed 2026-07-13 | **LiveKit selected.** Both adapters built and tested on real devices. LiveKit wins: open-source SFU (self-hostable in af-south-1 for POPIA), TURN included, free cloud tier, strong mobile support. Daily.co adapter retained (one file, zero cost) as fallback. Set `NEXT_PUBLIC_VIDEO_ADAPTER=livekit` as default. |

## Supporting notes

- **D-02:** fire is deliberately NOT recommended for the prototype — it is
  physical-first by nature (doc 08 T4) and would generate misleading early failure
  data. Theft is second-wave: valuable but the most sensitive to fraud-handling
  process.
- **D-04:** if (b) or (c) is chosen, consent wording, storage costs and the video
  provider shortlist all change — this decision must precede the technical spike.
- **D-11:** Both adapters evaluated on real devices (2026-07-13). LiveKit selected for
  self-hosting capability (POPIA data residency), included TURN relay, and strong mobile
  performance. Daily.co adapter stays in the codebase (one file) as a tested fallback.
  P2P adapter also remains for local dev without provider credentials.
- **D-09:** shadow mode means no live claim depends on the prototype — which is what
  makes deferring login/security acceptable in this phase. Pilot data is staged:

  1. **Stage 1 — no live data:** role-played assessments and anonymised historical
     claims may be used freely before any production hardening.
  2. **Stage 2 — real-client shadow mode:** may only start once a **minimum
     live-data safeguard gate** is approved, covering:
     - approved consent wording shown to the real client (interim legal-reviewed
       text, not the placeholder);
     - a controlled storage location for evidence and reports (known, single,
       access-restricted — not developer machines or ad-hoc shares);
     - limited, named staff access to pilot data;
     - agreed deletion/retention handling for pilot data (including what happens
       to it when the pilot ends);
     - written confirmation that prototype output is **not the system of record** —
       the existing process remains authoritative for every shadowed claim.

  This gate is deliberately minimal: it does **not** pull real login, MFA, permission
  engines or full POPIA implementation back into the workflow prototype. It exists
  only to prevent accidental unsafe use of real client data during the pilot.
- **D-10:** whatever is agreed here becomes the Phase 2 pilot acceptance criteria
  verbatim. Resist vague success definitions.

## Decisions moved to production hardening (green-lighted 2026-07-13)

Authentication approach, MFA policy, retention periods, download controls, operator
agreements, final consent wording, data-residency stance, hosting choice. These were
parked during Phase 0/1 and are now approved for implementation as part of production
hardening (Phase H). Templates signed off as-is at the 2026-07-07 workshop (G3 passed).
All in-house staff participate in the pilot (D-08). LiveKit is the selected provider (D-11).

## Evidence status of recorded decisions (added 2026-10-06 — stabilisation pass)

The decisions above are recorded, but several rest on activities whose supporting
artefacts are **not in this repository**. Until the artefact is filed, the gate is
treated as **not formally passed**. Fields marked `TO COMPLETE` need the person who
ran or approved the activity — they have not been filled in on their behalf.

| Item | What the register claims | Evidence expected | Evidence in repo | Approved by | Remains conditional |
|---|---|---|---|---|---|
| G3 — template sign-off (workshop 2026-07-07) | Templates signed off as-is | Completed `phase1/workshop/01-review-workbook.md`, attendee list, per-template verdicts | None (workbook blank) | TO COMPLETE | Treat templates as v0.1-1F draft until filed |
| G1 — mobile verification (2026-07-13) | Tested on real devices | SP1–SP10 results, device/OS/browser matrix | Only 3 older Daily.co spike screenshots (`phase1/spike-evidence/`) | TO COMPLETE | Do not claim "clients can join from a phone" |
| G2 / D-11 — provider selection (LiveKit) | LiveKit selected | Filled `provider-comparison-template.md` / `provider-mobile-test-pack.md`; cost + POPIA residency notes | None (templates blank) | TO COMPLETE | LiveKit is the working direction, not a ratified decision; P2P remains the staging default |
| Phase H green-light (2026-07-13) | Production hardening approved | Dated approval note | Register note only | TO COMPLETE | — |

See `CURRENT-STATE.md` for the consolidated status.
