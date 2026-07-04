# The Inspector — Phase 1 Implementation Plan

**Status:** Plan for review — coding starts only after this plan is approved
**Codename:** "The Inspector" — working codename only, not client-facing branding
**Scope authority:** `..\phase0\` circulation pack (where documents conflict, phase0 wins)
**Project:** Acorn only; standalone; separate from all other Acorn systems
**Date:** 2026-07-04

## Hard constraints (restated, binding on every build chunk)

- **No production security in Phase 1:** no real authentication, MFA, permission
  engine, POPIA hardening, secure-storage hardening, retention rules, operator
  agreements, or production audit hardening. Placeholder roles / mock access only.
- **No surveys. No fire claims.** Claim types: **geyser/water damage** and
  **accidental damage** only, using the Phase 0 signed-off templates. Other templates
  ship as reference data and must not block anything.
- **No** AI, integrations, full video recording, template-builder UI, WhatsApp
  Business, or advanced dashboards.
- **Data rule:** role-played assessments and anonymised historical claims only.
  Real-client data is prohibited until the live-data safeguard gate (phase0 doc 10,
  D-09) is approved.

## Plan contents

| Doc | Section(s) |
|-----|-----------|
| [01-scope-recap.md](01-scope-recap.md) | 1. What Phase 1 is / is not |
| [02-user-flows.md](02-user-flows.md) | 2. Seven user flows to build |
| [03-screen-build-list.md](03-screen-build-list.md) | 3. Screen-by-screen build list (16 screens) |
| [04-live-room-spec.md](04-live-room-spec.md) | 4. Live assessment room specification (the core) |
| [05-data-model-and-statuses.md](05-data-model-and-statuses.md) | 5–6. Prototype data model + status workflow |
| [06-report-and-evidence-pack.md](06-report-and-evidence-pack.md) | 7–8. Report output + evidence pack |
| [07-video-spike.md](07-video-spike.md) | 9. Mandatory video-provider spike (Daily.co vs LiveKit Cloud) |
| [08-build-chunks.md](08-build-chunks.md) | 10. Build chunks 1A–1J with exit checks |
| [09-acceptance-criteria.md](09-acceptance-criteria.md) | 11. Phase 1 pass/fail criteria |
| [10-risks-constraints.md](10-risks-constraints.md) | 12. Risks and constraints |

## Reading order for reviewers

1. 01 (2 min) — confirm scope.
2. 04 (10 min) — the live room is the product; most review attention here.
3. 07 (5 min) — spike plan; the provider decision gates the room build.
4. 08–09 (5 min) — sequencing and the definition of done.

## The one hard requirement (governs everything)

> **Capture loop:** select checklist item → one click or hotkey → auto-labelled
> evidence thumbnail → no modal → assessor stays in the video.
> Target < 3 seconds perceived, capture-to-thumbnail < 1 second.
