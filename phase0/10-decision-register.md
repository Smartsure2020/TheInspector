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
| D-06 | **Who reviews reports? And do reports carry quantum figures?** | Reviewer: manager / senior assessor peer / claims-side reviewer. Quantum: figures vs observations-only | Manager–Reviewer role reviews all pilot reports; quantum per workshop W4 outcome | Workshop W4 + mgmt | **Pending workshop (Phase B).** Manager–Reviewer flow built; quantum question deferred to W4. |
| D-07 | **Who owns templates?** | Named senior assessor per claim type (from workshop W2) vs one central owner | One named owner per claim type + one overall template custodian; changes versioned | Workshop W2 | **Pending workshop (Phase B).** Ownership to be assigned at W2. |
| D-08 | **Pilot assessor group** | 2–3 named volunteers from workshop W6 | Volunteers over conscripts — adoption risk is the biggest project risk | Workshop W6 + mgmt | **Pending workshop (Phase B).** Volunteers to be identified at W6. |
| D-09 | **Pilot claim volume & mode** | Volume target and shadow vs live mode | ≥10 claims in **shadow mode** (virtual alongside existing process, outputs compared); geyser-only for the first 2 weeks. Staged data rule: role-played + anonymised historical claims first; **real-client shadow testing only after the live-data safeguard gate below is approved** | Mgmt demo / 2026-07-07 | **Shadow mode confirmed.** ≥10 claims, virtual alongside physical. Live-data safeguard gate (G4) still required before real-client data. |
| D-10 | **What counts as a successful pilot** | Define pass/fail now, not after | Proposed: ≥8/10 assessments completed end-to-end without facilitator help; ≥8/10 reports accepted by reviewer with ≤1 correction round; capture loop <3s in real sessions; ≥2 of 3 pilot assessors say they'd choose it over the current method; client join unaided ≥80% of attempts | Mgmt demo / 2026-07-07 | **Proposed criteria accepted in principle.** Final metrics to be confirmed after workshop feedback. |

| D-11 | **Video provider direction** | (a) Stay P2P only; (b) evaluate LiveKit + Daily.co, pick one; (c) commit to a single provider now | (b) Evaluate both, pick one — behind SessionAdapter only | Mgmt demo / 2026-07-07 | **(b) Evaluate LiveKit and Daily.co.** Previous Daily.co exclusion (paid) overridden by management. Build both adapters behind SessionAdapter, test side by side on the device matrix, recommend one winner based on cost/quality/POPIA/data residency. No provider code outside the adapter file. |

## Supporting notes

- **D-02:** fire is deliberately NOT recommended for the prototype — it is
  physical-first by nature (doc 08 T4) and would generate misleading early failure
  data. Theft is second-wave: valuable but the most sensitive to fraud-handling
  process.
- **D-04:** if (b) or (c) is chosen, consent wording, storage costs and the video
  provider shortlist all change — this decision must precede the technical spike.
- **D-11:** Daily.co was previously excluded (paid) during Phase 1 planning. Management
  overrode that exclusion at the 2026-07-07 demo. Both LiveKit and Daily.co are now
  approved for evaluation. The evaluation must stay behind the `SessionAdapter` interface
  — one adapter file per provider, zero room-component changes.
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

## Decisions explicitly NOT being taken now (parked to production hardening)

Authentication approach, MFA policy, retention periods, download controls, operator
agreements, final consent wording, data-residency stance, hosting choice. These are
documented in the blueprint (docs 09–10) and in the scope split (doc 02 Tier B); they
are scheduled for the production-hardening gate, not Phase 0.
