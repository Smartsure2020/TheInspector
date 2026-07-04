# 12 — Risks, Assumptions & Open Questions

## 12.1 Major risks

| # | Risk | Impact | Mitigation |
|---|------|--------|-----------|
| R1 | **Client-side connectivity/device failure** — rural signal, old phones, load-shedding mid-session | Sessions fail; assessors abandon the tool | Device test before joining; rejoin-same-link resilience; graceful degradation (audio-only + client photo uploads); no-show/partial-session workflow treats this as normal, not exceptional; track failure rate from day one |
| R2 | **iOS Safari camera quirks** (rear camera selection, torch, permissions) | The single most common client device path breaks | Phase 0 spike is mandatory before provider commitment; Phase 1 live prototype tests on real iPhones; keep the upload-link path as universal fallback |
| R3 | **Assessor adoption failure** — tool slower than WhatsApp + Word habit | Product technically works, nobody uses it | Assessors co-design templates (Phase 0) and prototype (Phase 1); capture loop speed is a hard acceptance criterion; pilot in shadow mode so nobody's live claim depends on v1; measure time-per-assessment vs old way |
| R4 | **Evidence challenged in a dispute** (authenticity, consent, chain) | Undermines the core value proposition | Hashing at ingest, server timestamps, append-only audit, consent versioning (docs 08/09); get a legal opinion on the evidence bundle format in Phase 0 |
| R5 | **Virtual assessment misses what a physical visit would catch** — under-detection of fraud or damage extent | Claims leakage; credibility with insurers | Explicit scope-limitation sections in every report; "recommend physical" is a first-class outcome, not a failure; templates force context shots; monitor outcomes vs physical assessments during shadow pilot |
| R6 | **POPIA non-compliance** (offshore processing, over-capture, retention) | Regulatory exposure, reputational | Compliance review gate in Phase 0; operator DPAs; data-minimisation commitments in doc 09.9; prefer af-south-1 hosting |
| R7 | **Video provider dependency** (pricing change, EOL, outage) | Sessions unavailable | SessionService abstraction (doc 10.1); LiveKit path offers self-host escape hatch; provider status monitoring + a manual fallback procedure (phone call + upload link) |
| R8 | **Template quality gap** — wrong/missing checklist items produce weak assessments at scale | Systematised mediocrity | Templates are versioned, owned by a named senior assessor, reviewed after every 10 uses per type in the pilot; missing-evidence rate per template is the health metric |
| R9 | **Scope creep toward a claims platform** — pressure to add settlement, payments, policy data, integrations | MVP never ships | The doc 03.2 exclusion list is the contract; the Phase gates enforce it; product owner has explicit authority to say no |
| R10 | **Working name conflict** — "The Inspector" collides with theinspector.co.za (existing SA brand Acorn used) | Trademark/passing-off risk; confusion | Treat "The Inspector" strictly as internal codename; legal/naming decision before anything client-facing ships (D1) |

## 12.2 Assumptions (invalidate any of these and the plan changes)

- A1. Meaningful share (≥50%) of Acorn's non-motor claim assessments are virtually
  assessable (perils like geyser, storm, theft, accidental at household scale).
- A2. Insureds will accept and can complete a video assessment on their own phones.
- A3. Insurers/claims decision-makers will accept virtual-assessment reports as valid
  inputs (worth confirming in writing with key insurer partners during Phase 0).
- A4. Assessors are Acorn-controlled enough (staff or close panel) to mandate training
  and process compliance.
- A5. Volume in year one is modest (hundreds/month, not thousands/day) — architecture
  (doc 10) is sized to this.
- A6. English-only client flow is acceptable for launch.
- A7. Screenshots + structured data (no continuous video recording) meet evidential
  needs — supported by consent + audit trail (legal confirmation pending, D3).

## 12.3 Decisions required before build (owner: Acorn product sponsor)

| # | Decision | Needed by | Options / notes |
|---|----------|-----------|-----------------|
| D1 | Product name & branding (codename conflicts with theinspector.co.za) | Before Phase 1 client-facing screens | Legal search + rename |
| D2 | Who are the assessors: employees, panel firms, or both? | Phase 0 | Drives account model, access scoping, and whether firms need per-firm visibility walls |
| D3 | Record continuous session video: never / optional per job / always? | Phase 0 (affects consent text, storage, provider choice) | Recommendation: not in MVP (doc 03.2); get legal view on evidential sufficiency of stills+audit (A7) |
| D4 | Does the assessment report include quantum figures/reserve recommendations, or observations only? | Phase 0 (report structure §8.1.8) | Depends on assessor mandate from insurers |
| D5 | Evidence retention periods (active claims, closed, cancelled) + legal hold process | Before Phase 2 go-live | Proposal in doc 09.7 needs legal sign-off |
| D6 | Data residency stance: is SA-region hosting a hard requirement or a preference? | Before Phase 2 infra choice | Determines hosting option (a) vs (b) in doc 10.8 |
| D7 | Which insurer partners receive reports, and in what form (email PDF sufficient?) | Phase 0 | Confirms A3; shapes Phase 5 delivery API priority |
| D8 | Pilot cohort: which assessors, which claim types first? | End Phase 0 | Recommendation: geyser/water only for the first 2 weeks of pilot — highest volume, most standardisable |
| D9 | Success metrics sign-off (doc 01 targets) and who tracks them | Phase 0 | Baseline data needed from current process (current cycle times, assessment costs) |
| D10 | Budget envelope for per-session video minutes + SMS at projected volumes | Phase 0 | Get provider pricing against A5 volumes; sanity-check unit economics per assessment |
| D11 | Consent + privacy notice wording | Before Phase 2 pilot | Compliance/legal drafting against doc 09.1–9.2 |
| D12 | Surveys in MVP pilot or fast-follow? | End Phase 0 | Engine is shared; recommendation: pilot claims first, add surveys in week 3–4 of pilot once the room UX is proven |

## 12.4 Open questions (non-blocking, resolve during build)

- Grace period and attempt limits for no-shows (defaults proposed: 15 min, 3 attempts).
- Default appointment durations per claim type.
- Whether assessor photos/credentials appear on the client join page (recommended for
  trust; confirm assessor comfort).
- SMS sender ID and email domain for client comms.
- Internal SLA targets per status for the ageing dashboards.
- How historical theinspector.co.za data/files are handled, if at all (migration is
  currently assumed OUT of scope — confirm).
