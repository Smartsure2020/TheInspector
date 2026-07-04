# 02 — Revised Scope Split

Three tiers. Tier A is the only thing being built next. Tier B items are **documented
requirements that must exist before live client data at scale** — they are parked, not
cancelled. Tier C is the future backlog.

## A. Workflow prototype / demo MVP (build next — Phase 1/2)

Goal: prove the workflow with real assessors and role-played or shadow claims.
**Placeholder access only:** a simple role picker (Admin / Assessor–Surveyor /
Manager–Reviewer) with no real authentication; client enters via a plain assessment
link. Demo data, role-played assessments and anonymised historical claims only;
real-client shadow testing requires the live-data safeguard gate in decision D-09 —
and the prototype is never the system of record.

| # | Included | Prototype depth |
|---|----------|-----------------|
| 1 | Manual job creation | Single form: client, claim, claim type → template. No imports, no validation beyond required fields |
| 2 | Placeholder staff roles | Role picker on entry; UI adapts per role; no passwords, no permissions engine |
| 3 | Scheduling flow | Pick date/time, generate client link, show the message that would be sent (manual send acceptable in prototype) |
| 4 | Client link flow | Simple tokenized URL opens the client journey; expiry can be basic (date-based) |
| 5 | Consent placeholder screen | Plain-language placeholder text + name + tick; logged with timestamp. Final legal wording comes later |
| 6 | Camera/mic check concept | Camera preview, front/rear switch, mic indicator. Functional, not bulletproof |
| 7 | Live assessment room | Two-way video; assessor sees checklist panel; client sees video + instruction banner only |
| 8 | Guided checklist | Claim-type template with sections, answer fields, skip-with-reason, **Concern flag** toggle (assessor-only UI term; templates keep the underlying red-flag concept) |
| 9 | Labelled screenshot capture | **Hard requirement:** select item → one click/hotkey → auto-labelled thumbnail → no modal → assessor stays in the video |
| 10 | Assessor-triggered high-res photo request | Assessor taps "request photo" → client device captures full-resolution still → uploads into the same evidence flow |
| 11 | Notes | Per-item and general session notes |
| 12 | Missing evidence flag | Mark item missing with reason; produces the follow-up list and a simple client upload link |
| 13 | Evidence gallery | Grid by checklist section; relabel, refile, discard; client uploads land here flagged as uploads |
| 14 | Basic report generation | Pre-filled from checklist + evidence; assessor edits narrative; output a clean PDF (prototype layout) |
| 15 | Basic evidence pack | ZIP of labelled images + simple index (CSV or PDF page) |

Also in Tier A because the workflow breaks without them: mark no-show + reschedule,
cancel job with reason, simple status progression (New → Assigned → Scheduled → In
progress → Awaiting evidence → Awaiting report → Report completed), and a plain list
dashboard per role. A lightweight event log (who did what, when) is kept — as workflow
data, not as a hardened audit system.

## B. Production MVP (hardening — required before scaled live use)

Moved OUT of the prototype, by explicit direction. Each remains fully specified in the
blueprint (parent-folder docs 07, 09, 10) and gets implemented in the production-
hardening phase:

| Deferred item | Where specified |
|---------------|-----------------|
| Real login (email/password or IdP) | Blueprint doc 10.6 |
| MFA for staff | Blueprint docs 09.5, 10.6 |
| Advanced role permissions (assessors see only their jobs, download gating, manager-only reopen) | Blueprint doc 09.5 |
| Secure storage hardening (private buckets, signed URLs, encryption posture, object lock, hashing at ingest) | Blueprint docs 09.3, 10.3 |
| Full audit hardening (append-only enforcement, complete event coverage, audit extract) | Blueprint docs 07 audit_logs, 08.4, 09.6 |
| Retention rules + legal hold | Blueprint doc 09.7 |
| Download controls + watermarking | Blueprint doc 09.8 |
| Operator agreements / DPAs with providers | Blueprint doc 09.2 |
| Full POPIA implementation (final consent wording, data-subject rights handling, cross-border basis, breach runbook) | Blueprint docs 09.1–09.2 |
| Hardened single-use expiring links (hashed tokens, revocation) | Blueprint doc 09.4 |
| Automated SMS/email delivery with delivery receipts | Blueprint doc 10.5 |
| Immutable approved-report versioning | Blueprint doc 07 reports |

Rule of the prototype phase: these may not block, but nothing may be built that makes
them *harder* later (e.g. evidence files still get server timestamps and stable IDs;
the event log schema follows the blueprint's audit_logs shape).

## C. Later phases (unchanged from blueprint doc 11, Phase 3–5)

Full template coverage and report polish → automated reminders, WhatsApp channel,
operational dashboards → then the future backlog: optional session video recording,
AI assistance (labelling suggestions, photo-quality warnings, narrative drafting),
integration APIs, client self-scheduling, multi-language client UI, survey
recommendations compliance tracking, panel-firm onboarding/white-labelling.

**Surveys note:** risk surveys (residential + commercial) ride the same engine and are
**optional/deferred for the first prototype** unless management decides otherwise —
see decision D-03 in the Decision Register.
