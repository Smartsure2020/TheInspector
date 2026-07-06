# Handover pack — The Inspector prototype

**Date:** 2026-07-06 · **Prepared at the end of the Phase 1 build (post-1F + QA pass)**
**Codename only — Acorn internal. All data in the prototype is fake / role-play.**

## What this pack is

This folder is the complete handover for The Inspector prototype. It was written
so that lower-capability AI models and developers can safely continue the
project **without losing context, overbuilding, or breaking scope**. The model
that built Phases 1A–1F is being retired; everything a successor needs to know
that is not obvious from the code is written down here.

If you are an AI model or developer picking this project up: **read this pack
before touching anything.** The single most common failure mode this pack
guards against is doing *more* than was asked — adding auth, security,
integrations, or features that are deliberately deferred behind gates.

## Project status in plain English

Acorn is building a virtual claims-assessment and risk-survey platform
(codename "The Inspector"). Instead of driving to a property, an assessor sends
the client a link; the client joins a guided video session on their phone; the
assessor works through a peril-specific checklist, captures evidence frames,
and the system generates a structured report that a manager reviews, returns or
approves. The product is the **structured, auditable evidence workflow** — the
video is just transport.

Where we are right now:

- A working end-to-end prototype exists in [`prototype/`](../prototype/) —
  job creation → scheduling → client link → pre-join (consent, camera check,
  waiting room) → live room with checklist and frame capture → evidence
  curation → auto-drafted report → manager review/return/approve with lock →
  evidence pack ZIP download.
- It covers **multiple claim perils** (storm, accidental, theft, power surge,
  burst pipe, geyser, general non-motor) **and risk surveys** (residential,
  limited commercial). Fire is reference-only and cannot be booked.
- The prototype is **demo-ready on pristine seeded fake data** (18 jobs). A QA
  pass on 2026-07-06 ran 22/22 automated smoke checks plus the full manual
  regression checklist — all PASS.
- A **management demo is scheduled for tomorrow morning** (2026-07-07). The
  script is in [04-DEMO-SCRIPT-FOR-MANAGEMENT.md](04-DEMO-SCRIPT-FOR-MANAGEMENT.md).
- It is a **prototype, not a product**: SQLite, local file storage, placeholder
  roles instead of login, browser print-to-PDF, no video provider selected
  (a provider-agnostic P2P WebRTC adapter fills the slot), mobile live-room
  testing deferred (HTTPS constraint on the dev laptop).

## Recommended reading order

| Order | File | Read it when |
|---|---|---|
| 1 | `00-HANDOVER-README.md` (this file) | Always, first |
| 2 | [08-SCOPE-GUARDRAILS.md](08-SCOPE-GUARDRAILS.md) | Always, second — before any work |
| 3 | [01-PROJECT-SNAPSHOT.md](01-PROJECT-SNAPSHOT.md) | To understand what exists and why |
| 4 | [03-HOW-TO-RUN-AND-DEMO.md](03-HOW-TO-RUN-AND-DEMO.md) | Before running anything |
| 5 | [02-CODEBASE-STRUCTURE.md](02-CODEBASE-STRUCTURE.md) | Before reading or changing code |
| 6 | [10-CODE-CHANGE-RULES.md](10-CODE-CHANGE-RULES.md) | Before changing code |
| 7 | [09-ISSUES-AND-LIMITATIONS.md](09-ISSUES-AND-LIMITATIONS.md) | Before claiming anything "works" or "is missing" |
| 8 | [06-DEFERRED-GATES.md](06-DEFERRED-GATES.md) | Before proposing any new capability |
| 9 | [05-NEXT-STEPS-ROADMAP.md](05-NEXT-STEPS-ROADMAP.md) | When planning the next piece of work |
| 10 | [07-LOWER-MODEL-PROMPTS.md](07-LOWER-MODEL-PROMPTS.md) | When delegating a task to a model |
| 11 | [04-DEMO-SCRIPT-FOR-MANAGEMENT.md](04-DEMO-SCRIPT-FOR-MANAGEMENT.md) | Before the management demo |
| 12 | [11-CURRENT-GIT-STATE.md](11-CURRENT-GIT-STATE.md) | Before committing or tagging |

Deeper background (already in the repo, referenced throughout):

- `phase0/` — **scope authority**. Where anything conflicts, phase0 wins.
  Especially `phase0/10-decision-register.md` (decisions D-01…D-10) and
  `phase0/02-revised-scope-split.md`.
- `phase1/` — the implementation plan and the QA-pass artefacts
  (`demo-guide.md`, `known-limitations.md`, `regression-checklist.md`,
  `qa-report-1f.md`, `spike-report.md`).
- Root docs `01–12` — the long-term blueprint. Subject to the scope
  correction in the root [README.md](../README.md): auth/POPIA/etc. are
  documented there but **deferred to production hardening**.

## What is safe to do next

- Run the demo (see files 03 and 04).
- Fix genuine bugs inside the existing feature set, following
  [10-CODE-CHANGE-RULES.md](10-CODE-CHANGE-RULES.md).
- Adjust template wording / checklist content when assessors give feedback
  (templates live in `prototype/src/lib/templates.ts`; reseed after edits).
- Adjust report wording (`prototype/src/lib/report.ts`) — as long as the
  auto Limitations section stays non-removable and honest.
- Prepare documents/plans for the deferred gates (workshop prep, mobile-test
  plan, provider comparison, hardening plan) — **documents, not code**.
- Update these handover docs when behaviour changes.

## What must NOT be touched yet

Do not build any of the following without an explicit, recorded approval
(details and triggers in [06-DEFERRED-GATES.md](06-DEFERRED-GATES.md) and
[08-SCOPE-GUARDRAILS.md](08-SCOPE-GUARDRAILS.md)):

- Production auth, login, MFA, role permissions
- POPIA / secure-storage / audit / retention hardening, signed URLs
- Any AI features, any integrations with other Acorn systems, WhatsApp
- Video recording of sessions
- A specific video provider (Daily.co is **excluded** — paid; LiveKit is a
  stub only) or any provider-specific code outside the `SessionAdapter`
  interface
- Real client data of any kind (phase0 gate D-09 — hard block)
- A template builder UI
- Making fire bookable as a virtual assessment
- Postgres migration / deployment (planned, but gated — see file 06)
