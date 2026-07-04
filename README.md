# The Inspector — Product Framework & Implementation Blueprint

**Status:** Draft for review — no build work has started
**Working name:** The Inspector — internal codename ONLY, not final client-facing branding (see naming risk in doc 12)
**Owner:** Acorn (standalone project — separate from all other Acorn systems and tools)
**Date:** 2026-07-04

> **⚠ Scope correction (2026-07-04):** login, authentication, MFA, role permissions,
> secure-storage/audit hardening, retention rules, download controls, operator
> agreements and full POPIA implementation are **deferred to production hardening**.
> They remain documented requirements (docs 07, 09, 10) but must NOT block the first
> workflow prototype, which uses placeholder roles and a simple client assessment
> link. The authoritative current scope is the **Phase 0 Validation Pack** in
> [`phase0/`](phase0/00-README.md) — where it conflicts with docs 01–12 below,
> the Phase 0 pack wins.

## What this is

A complete planning pack for The Inspector: a standalone digital non-motor claims
assessment and risk survey platform. This project is deliberately independent of all
existing Acorn systems (Scout, Suri, Atlas, HRS, Smartsure, claims automation) and must
not reference or integrate with them unless explicitly decided later.

**Core principle:** The Inspector is NOT a video meeting tool. It is a guided
evidence-capture and reporting workflow for insurance assessors and surveyors. Video is
just the transport; the product is structured, labelled, auditable evidence.

## Document index

**Current working pack:** [`phase1/` — Phase 1 Implementation Plan](phase1/00-README.md)
(scope recap, user flows, screen build list, live-room spec, prototype data model,
report/pack build, video spike, build chunks 1A–1J, acceptance criteria, risks).
Coding starts only after this plan is approved; claim types are geyser/water +
accidental damage on placeholder roles.

**Scope authority:** [`phase0/` — Phase 0 Validation Pack](phase0/00-README.md)
(executive summary, revised scope split, workshop guide, template review sheets,
UX walkthroughs, physical-trigger matrix, prototype report structure, decision
register, exit criteria). Where phase1 and phase0 conflict, phase0 wins.

**Reference blueprint (long-term view, subject to the scope correction above):**

| Doc | Contents |
|-----|----------|
| [01-product-summary-and-personas.md](01-product-summary-and-personas.md) | Product summary, problem, success criteria; four user personas |
| [02-workflows.md](02-workflows.md) | End-to-end workflows: claims assessment, risk survey, no-show, missing evidence, report review |
| [03-mvp-scope.md](03-mvp-scope.md) | MVP definition and explicit out-of-scope list |
| [04-claim-templates.md](04-claim-templates.md) | Checklist templates: geyser/water, storm, theft, fire, accidental, general |
| [05-survey-templates.md](05-survey-templates.md) | Risk survey frameworks: residential and commercial (COPE+) with risk grading |
| [06-screens-ux.md](06-screens-ux.md) | Full screen list and UX requirements, with emphasis on the live assessment room |
| [07-data-model-and-statuses.md](07-data-model-and-statuses.md) | Core entities/fields and the workflow status model |
| [08-reports.md](08-reports.md) | Assessment report, survey report, and evidence pack structures |
| [09-security-compliance.md](09-security-compliance.md) | Consent, POPIA, evidence integrity, retention, access control |
| [10-architecture.md](10-architecture.md) | Technology options and recommendations (video, capture, storage, PDF, auth, hosting) |
| [11-build-phases.md](11-build-phases.md) | Phases 0–5 with objectives, deliverables, acceptance criteria |
| [12-risks-open-questions.md](12-risks-open-questions.md) | Risks, assumptions, and decisions required before build |

## How to review

1. Read docs 01–03 first — they define what we are building and, just as importantly,
   what we are not building in v1.
2. Docs 04–05 need review by working assessors/surveyors — the templates are the product.
3. Doc 12 lists the decisions that must be made before Phase 1 starts.
