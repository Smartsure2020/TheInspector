# 10 — Decision Register for Acorn Management

Each decision: options, recommendation, owner and date fields to be completed.
Sources: this pack + the assessor workshop outputs (W1–W7 in doc 03). All decisions
must be **Decided** or **Deferred (with named owner + date)** before Phase 0 exit.

| ID | Decision | Options | Recommendation | Decided by / Date | Decision |
|----|----------|---------|----------------|-------------------|----------|
| D-01 | **Product name / codename** | (a) Keep "The Inspector" internally, decide client-facing name before anything client-visible ships (conflicts with theinspector.co.za); (b) rename now | (a) — codename only, legal/name search before Phase 2 client pilot | __________ | __________ |
| D-02 | **Claim types for first prototype** | Any subset of the six templates | Geyser/water + accidental damage (highest volume + fastest sessions); add storm in pilot week 3 | Workshop W1 + mgmt | __________ |
| D-03 | **Surveys in first prototype?** | (a) Deferred — claims only; (b) residential survey included; (c) both survey types | (a) Deferred. Engine is shared; add surveys once the room UX is proven | Workshop W5 + mgmt | __________ |
| D-04 | **Full video recording excluded from MVP?** | (a) Excluded — screenshots + structured data only; (b) optional per job; (c) always record | (a) Excluded. Cuts storage, cost and privacy exposure; revisit with dispute experience. Needs a sanity check that stills + event log satisfy evidential needs | __________ | __________ |
| D-05 | **High-res photo capture mandatory?** | (a) Mandatory prototype feature — templates rely on it for plates/serials/documents; (b) nice-to-have | (a) Mandatory. Video frames (~720p) cannot read a rating plate; without this the geyser and theft templates fail | __________ | __________ |
| D-06 | **Who reviews reports? And do reports carry quantum figures?** | Reviewer: manager / senior assessor peer / claims-side reviewer. Quantum: figures vs observations-only | Manager–Reviewer role reviews all pilot reports; quantum per workshop W4 outcome | Workshop W4 + mgmt | __________ |
| D-07 | **Who owns templates?** | Named senior assessor per claim type (from workshop W2) vs one central owner | One named owner per claim type + one overall template custodian; changes versioned | Workshop W2 | __________ |
| D-08 | **Pilot assessor group** | 2–3 named volunteers from workshop W6 | Volunteers over conscripts — adoption risk is the biggest project risk | Workshop W6 + mgmt | __________ |
| D-09 | **Pilot claim volume & mode** | Volume target and shadow vs live mode | ≥10 claims in **shadow mode** (virtual alongside existing process, outputs compared); geyser-only for the first 2 weeks. Staged data rule: role-played + anonymised historical claims first; **real-client shadow testing only after the live-data safeguard gate below is approved** | __________ | __________ |
| D-10 | **What counts as a successful pilot** | Define pass/fail now, not after | Proposed: ≥8/10 assessments completed end-to-end without facilitator help; ≥8/10 reports accepted by reviewer with ≤1 correction round; capture loop <3s in real sessions; ≥2 of 3 pilot assessors say they'd choose it over the current method; client join unaided ≥80% of attempts | __________ | __________ |

## Supporting notes

- **D-02:** fire is deliberately NOT recommended for the prototype — it is
  physical-first by nature (doc 08 T4) and would generate misleading early failure
  data. Theft is second-wave: valuable but the most sensitive to fraud-handling
  process.
- **D-04:** if (b) or (c) is chosen, consent wording, storage costs and the video
  provider shortlist all change — this decision must precede the technical spike.
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
