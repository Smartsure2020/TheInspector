# The Inspector — Phase 0 Validation Pack

**Status:** Ready for review and workshop use
**Codename:** "The Inspector" — internal working codename ONLY, not client-facing branding
**Scope:** Acorn only. Completely separate from all other Acorn systems and tools.
**Date:** 2026-07-04

## Scope correction applied in this pack

The original blueprint (docs 01–12 in the parent folder) put login, MFA, role
permissions, secure storage hardening, full audit hardening, retention, download
controls, operator agreements and full POPIA implementation inside the MVP.

**Corrected direction:** those items are now documented **production-hardening
requirements** and must NOT block the first workflow prototype. The prototype uses
placeholder roles (Admin / Assessor–Surveyor / Manager–Reviewer selected without real
authentication) and a simple assessment link for the client. See
[02-revised-scope-split.md](02-revised-scope-split.md) for the full A/B/C split.

Phase 0 exists to validate one thing: **does the guided evidence-capture workflow and
template set match how Acorn assessors actually work?** Everything in this pack serves
that question.

## Pack contents

| Doc | Purpose | Primary audience |
|-----|---------|------------------|
| [01-executive-summary.md](01-executive-summary.md) | One-page summary for management | Acorn management |
| [02-revised-scope-split.md](02-revised-scope-split.md) | Workflow prototype vs Production MVP vs Later | Management + build team |
| [03-assessor-workshop-guide.md](03-assessor-workshop-guide.md) | 60–90 min validation workshop agenda | Workshop facilitator |
| [04-claims-review-sheets.md](04-claims-review-sheets.md) | Six printable claim-template review sheets | Assessors (workshop) |
| [05-survey-review-sheets.md](05-survey-review-sheets.md) | Two survey review sheets — **optional/deferred** | Surveyors (if surveys included) |
| [06-assessor-ux-walkthrough.md](06-assessor-ux-walkthrough.md) | Step-by-step assessor journey incl. hard capture-loop requirement | Assessors + build team |
| [07-client-journey-walkthrough.md](07-client-journey-walkthrough.md) | Insured/client flow, with client-visibility rules | Everyone |
| [08-physical-trigger-matrix.md](08-physical-trigger-matrix.md) | When to stop/limit virtual and go physical | Assessors (workshop) |
| [09-prototype-report-structure.md](09-prototype-report-structure.md) | Simplified prototype report + evidence pack | Assessors + report consumers |
| [10-decision-register.md](10-decision-register.md) | Decisions Acorn management must take | Acorn management |
| [11-phase0-exit-criteria.md](11-phase0-exit-criteria.md) | What must be true before build starts | Everyone |

## How to run Phase 0 with this pack

1. Management reads 01, 02 and 10 (30 minutes) and pre-fills any decisions already made.
2. Facilitator schedules the assessor workshop using 03, printing 04, 06, 07, 08
   as handouts (and 05 only if surveys are in).
3. Workshop runs; review sheets and decision inputs are collected.
4. Decisions in 10 are taken and recorded.
5. Exit criteria in 11 are checked. When all pass → Phase 1 (UX prototype) may start.

**No production code is written in Phase 0.** The only technical work permitted is the
video-provider spike defined in 11.

## Next milestone

> **Get 2–3 assessors to validate the geyser and accidental-damage templates against
> historical claim files, decide the physical-assessment triggers (including rand
> thresholds), and confirm whether the live room should be checklist-first or
> capture-tray-first.**
>
> Everything else in Phase 0 hangs off that workshop. Handouts, in order of use:
> docs 03, 04, 06, 07, 08, 09, 10, 11.
