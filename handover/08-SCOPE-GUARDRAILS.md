# Scope guardrails — The Inspector (BINDING)

This document exists because the biggest risk to this project is no longer
building the wrong thing — it is building **more** than was decided. Every
deferral below is a recorded decision, not a gap. Breaking these guardrails
undoes decisions that management, phase0 and the QA pass already locked in.

**Rule zero: if a task is not clearly allowed below, treat it as forbidden
until someone with authority says otherwise, and record that answer.**

## What is currently allowed (no new approval needed)

- Running demos and regression/smoke passes on the seeded fake book.
- Fixing genuine defects in existing behaviour (per
  [10-CODE-CHANGE-RULES.md](10-CODE-CHANGE-RULES.md)).
- Wording/content changes to existing templates and reports **when they come
  from recorded assessor/management feedback**, with version bumps.
- Documentation: handover updates, workshop prep, test plans, planning drafts
  for gated phases (plans, never the gated code).
- Demo-data adjustments that keep every record obviously fake.
- Extending the smoke suite / regression checklist (verification, not product).

## Explicitly forbidden before recorded approval

- Production auth, login, MFA, role permissions (placeholder roles are by
  design — AC9).
- POPIA / secure-storage / audit / retention / signed-URL hardening.
- Any AI feature (capture QA, narrative drafting, transcription — all of it).
- Any integration with other Acorn systems (Scout, Suri, Atlas, HRS,
  Smartsure, claims automation) or any insurer system.
- Video/audio recording of sessions (excluded by D-04).
- WhatsApp or any automated message-sending channel (link sending stays
  manual paste).
- **Daily.co anything** (excluded — paid) and **LiveKit implementation**
  (stub stays a stub until the provider decision, gate G2).
- Provider-specific video code anywhere outside a single `SessionAdapter`
  implementation file.
- Real client data in any form, any environment ("just one test record"
  included) — phase0 D-09 hard gate.
- A template builder UI (templates are code, by decision).
- Making fire bookable as a virtual assessment (policy T4).
- Public/always-on deployment (ephemeral HTTPS tunnel for device testing on
  fake data is the sole exception, torn down after use).
- Removing or softening: the PROTOTYPE banner, report Limitations, the
  "pending assessor sign-off" positioning, or entries in the limitations
  register.

## What requires a management decision (record it in phase0/10-decision-register.md)

- Client-facing product name (D-01)
- Adding/removing claim types or survey types from the active catalogue
- Video provider direction and any spend (G2)
- Pilot shape, volume, success criteria (D-09/D-10) and pilot assessors (D-08)
- Revisiting recording (D-04) or quantum-in-reports (D-06)
- Template owners and governance model (D-07/G13)
- Starting production hardening; any expansion-phase item (file 05, Phase I)

## What requires a technical spike first (time-boxed, throwaway, findings written up)

- Mobile live-room behaviour (G1 — SP1–SP10 on real phones over HTTPS)
- TURN relay viability / provider free-tier evaluation (G2)
- Server-generated PDF approach (G11 — only when hardening starts)
- Postgres + object-storage migration mechanics (G5 — dry run on fake data)
- Signaling durability beyond the in-memory single-process channel

## What requires live-data safeguard approval (gate G4 — hardest gate)

- Real-client shadow testing of any kind
- Entering any real name, phone number, address, policy/claim number, or real
  claim documents/photos into any environment
- "Anonymised" historical claims (re-identification risk — goes through the
  same gate)

## What requires production hardening (gates G6–G12) before it may exist

- Any internet-facing deployment holding non-throwaway data
- Any promise of evidential integrity (hashing/audit chain), retention,
  access control, or letterhead PDFs
- Client links with verification; signed evidence URLs; download controls

## How to prevent scope creep (working practices)

1. **One task, one scope.** Do exactly what the task says; list anything else
   you noticed as a note, never as an included change.
2. **Diff review against intent.** Before committing, re-read the diff and
   delete every change the task didn't require (drive-by refactors, renames,
   formatting).
3. **Feedback is not approval.** "An assessor asked for X" puts X into the
   decision register, not the codebase.
4. **Plans are welcome, code is gated.** For any gated area, writing the plan
   is allowed; writing the first line of implementation is not.
5. **Keep the docs load-bearing.** If behaviour changed, the handover pack,
   demo guide and limitations register change in the same commit — undocumented
   behaviour is how scope drifts.
6. **When unsure, stop and ask.** A stopped task costs an hour; un-deciding
   built code costs weeks.

## The "belongs now or later" test

Run any proposed change through these questions, in order. First "no" (or
first trigger) decides.

1. Is it fixing a defect in behaviour that already exists? → **Now** (rules
   in file 10 apply).
2. Is it wording/content in an existing template or report, backed by
   recorded feedback? → **Now**, with version bump.
3. Is it a document, plan, or test on fake data? → **Now.**
4. Does it appear in the forbidden list above, or require crossing any gate
   in [06-DEFERRED-GATES.md](06-DEFERRED-GATES.md)? → **Later.** Stop; write
   down what you would have done; surface it as a decision.
5. Does it add a capability the demo does not currently show? → **Later** —
   that is a new feature, and new features need a decision first.
6. Still genuinely ambiguous? → Treat as later; ask the human owner.
