# 01 — Product Scope Recap

## What Phase 1 is

A **workflow prototype / demo MVP** that proves one thing end to end:

> A real assessor can complete a virtual non-motor claims assessment —
> job creation → schedule → client link → client joins → live assessment →
> labelled evidence capture → high-res photo request → missing-evidence flow →
> evidence review → report generation → evidence pack → manager review —
> without facilitator help, at conversation speed.

It is built for **role-played assessments and anonymised historical claims**. It is
not the system of record for anything. Its success is measured by the acceptance
criteria in doc 09, which mirror phase0 exit expectations (three assessors per claim
type, unaided, capture loop under 3 seconds, client joins unaided from a phone).

**Claim types:** geyser/water damage and accidental damage, seeded from the Phase 0
signed-off templates (v0.2 review-sheet content from `..\phase0\04-claims-review-sheets.md`,
sheets 1 and 5). The other four templates load as reference data only — visible in a
template list if trivially easy, but never wired into acceptance tests and never
blocking.

**Access model:** a role-picker entry page (Admin/Coordinator, Assessor–Surveyor,
Manager–Reviewer). No passwords. The client enters only via an assessment link.
Role choice is remembered per browser for convenience — that is the entire "auth"
system in Phase 1.

## What Phase 1 is NOT

| Not in Phase 1 | Where it lives instead |
|----------------|------------------------|
| Real login, MFA, permission engine | Production hardening (phase0 doc 02 Tier B) |
| POPIA hardening, retention, operator agreements, download controls | Production hardening |
| Secure storage hardening, hashing/integrity chain, production audit | Production hardening (prototype keeps an event log shaped for later upgrade) |
| Surveys (residential/commercial) | Deferred per D-03 |
| Fire claims (and storm/theft/general as active types) | Fire: physical-first, excluded per D-02 note; others: later prototype waves |
| AI features, integrations, full video recording, template-builder UI, WhatsApp, advanced dashboards | Later phases (phase0 doc 02 Tier C) |
| Automated SMS/email sending | Manual link handover is acceptable in Phase 1 (copy-link button + message text to paste); automated delivery is Tier B/Phase 4 |
| Real client data | Prohibited until live-data safeguard gate (D-09) approved |

## Standing design rules carried into every chunk

1. The capture loop hard requirement (doc 00) outranks all other UI concerns.
2. The client never sees: concern flags, assessor notes, checklist contents,
   claim-decision language, policy concerns, or any internal screen.
3. Assessor-facing UI says **"Concern flag"**; templates keep the internal red-flag
   concept.
4. Nothing built may make production hardening harder: UUIDs everywhere, server
   timestamps authoritative, event log follows the blueprint audit_logs shape,
   file keys stable and storage behind one interface.
5. "Recommend physical assessment" is a first-class outcome (trigger matrix,
   phase0 doc 08), wired into checklist and report from the start.
