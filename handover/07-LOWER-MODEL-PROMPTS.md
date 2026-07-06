# Ready-to-use prompts for lower-capability models

Copy a prompt verbatim, fill the `<placeholders>`, and give it to the model.
Every prompt assumes the working directory is
`C:\Users\renault\Documents\AI\INSPECTOR`. The **standing preamble** below
must be pasted at the top of EVERY prompt.

---

## Standing preamble (paste first, always)

```
You are working on The Inspector, Acorn's prototype virtual claims-assessment
platform. Before doing anything, read handover/00-HANDOVER-README.md and
handover/08-SCOPE-GUARDRAILS.md and follow them exactly.

Hard constraints (non-negotiable, apply to every task):
- Do NOT add production auth/login/MFA/permissions, POPIA/security/storage/
  audit hardening, AI features, integrations, recording, WhatsApp,
  Daily.co/LiveKit or any video-provider code, real client data, a template
  builder, or any new product feature unless the task explicitly says so.
- Do NOT refactor code beyond what the task requires.
- All data must remain obviously fake/role-play (phase0 gate D-09).
- Keep the PROTOTYPE banner, the non-removable report Limitations, and the
  fire-not-bookable policy intact.
- Verification for any code change: stop server → npm run reset:demo →
  npm run dev → npm run qa:smoke (22/22 PASS) → npx tsc --noEmit →
  npm run build. Report the results honestly.
- If the task seems to require crossing a deferred gate
  (handover/06-DEFERRED-GATES.md), STOP and report instead of building.
```

---

## 1. Fixing a bug safely

```
TASK: Fix this bug: <describe the bug, the route/page, and how to reproduce>.

CONTEXT: The prototype is demo-ready; handover/02-CODEBASE-STRUCTURE.md maps
the code. The bug is a defect in EXISTING behaviour, not a missing feature.

SCOPE: The smallest change that fixes the reproduction case.

FILES TO INSPECT FIRST: handover/02-CODEBASE-STRUCTURE.md (find the module
that owns the behaviour), then only the implicated files. For workflow bugs
start at prototype/src/lib/actions.ts and data.ts; for rendering bugs the
page under prototype/src/app/ and its components.

OUTPUT: (a) root cause in 2-3 sentences, (b) the diff, (c) verification
results (reset, smoke 22/22, tsc, build), (d) whether phase1/known-limitations.md
or the handover docs need updating (and the update if so).

DO NOT TOUCH: templates.ts content, report Limitations logic, the status
machine EDGES, seed data, or anything in the standing preamble's forbidden
list. If the "fix" requires any of those, stop and report why.
```

## 2. Small template change (existing template)

```
TASK: Apply this approved template change: <exact change, which template,
who approved it — e.g. "assessor workshop 2026-07-XX, signed off by <name>">.

CONTEXT: Templates are code-seeded in prototype/src/lib/templates.ts. All
templates are v0.1-1F pending assessor sign-off; changes must be traceable.

SCOPE: Wording/items/flags inside the named existing template only.

FILES TO INSPECT FIRST: prototype/src/lib/templates.ts (the template and the
shared opening/closing spines — do not edit the spines unless the change
says so), prototype/src/lib/types.ts (shapes), phase0/04-claims-review-sheets.md
or 05-survey-review-sheets.md (source content).

OUTPUT: (a) the diff, (b) the template's version string bumped (e.g.
v0.1-1F → v0.2-<reason>), (c) verification results after reset+reseed,
(d) a one-line changelog entry for the commit message naming the approver.

DO NOT TOUCH: other templates, fire's reference-only status, the general
non-motor peril-selector mechanism, report.ts. Do not add a new template
(that is prompt 9) or any template-builder machinery.
```

## 3. Updating report wording

```
TASK: Update report wording: <exact current wording → exact new wording,
which report variant (claims/survey), which section, who approved it>.

CONTEXT: All report text is generated in prototype/src/lib/report.ts; the
editor, the final page and the submit snapshot share one model.

SCOPE: Wording only. No structural changes to sections, no new sections.

FILES TO INSPECT FIRST: prototype/src/lib/report.ts (find the wording; note
claims vs survey variants), then check where it surfaces:
prototype/src/app/jobs/[id]/report/page.tsx and report/final/page.tsx.

OUTPUT: (a) the diff, (b) verification incl. one claims report and one
survey report opened after reseed (j7 and j13 builders, j8/j16 finals),
(c) confirmation the smoke suite still passes (it asserts report markers —
if a marker string changed, update scripts/qa-smoke.mjs to match and say so).

DO NOT TOUCH: the auto-section machinery (particulars/limitations/evidence
index must stay non-removable and DB-generated); never soften or remove
limitation wording — reports must stay honest about what was not seen.
```

## 4. Running regression checks

```
TASK: Run the full regression pass and report results. Change NOTHING.

CONTEXT: The manual checklist is phase1/regression-checklist.md; the
automated net is npm run qa:smoke.

SCOPE: Read-only verification. If you find a failure, report it — do not fix
it in this task.

STEPS: (1) stop any dev server, npm run reset:demo, npm run dev;
(2) npm run qa:smoke — record the 22 results; (3) walk every item in
phase1/regression-checklist.md, marking PASS/FAIL with a note per item;
(4) npx tsc --noEmit and npm run build; (5) stop server, reset:demo again.

OUTPUT: a dated results table (item → PASS/FAIL → note), an explicit list of
failures (or "none"), and whether the book was left pristine.

DO NOT TOUCH: any source file, any doc, the seed data.
```

## 5. Preparing the assessor workshop

```
TASK: Prepare the assessor template-validation workshop pack.

CONTEXT: The workshop validates the v0.1-1F templates (gate G3). Guides
already exist: phase0/03-assessor-workshop-guide.md, phase0/04-claims-review-
sheets.md, phase0/05-survey-review-sheets.md, phase0/06-assessor-ux-
walkthrough.md.

SCOPE: Documents only — no code changes.

FILES TO INSPECT FIRST: the four phase0 files above, prototype/src/lib/
templates.ts (current actual content), handover/01-PROJECT-SNAPSHOT.md.

OUTPUT: a new folder phase1/workshop/ containing (a) an updated review sheet
per ACTIVE template reflecting the real v0.1-1F content (storm, theft, power
surge, burst pipe, general non-motor, both surveys — geyser/accidental note
their v0.2 heritage), (b) a session agenda with timings, (c) a decision-
capture sheet (per-template verdict + owner per D-07), (d) a demo path for
the walkthrough using the seeded jobs from handover/03-HOW-TO-RUN-AND-DEMO.md.

DO NOT TOUCH: templates.ts or any code; do not pre-empt workshop outcomes by
editing template content.
```

## 6. Preparing mobile verification

```
TASK: Prepare (not execute) the mobile live-room verification plan.

CONTEXT: Gate G1. Phones need HTTPS; local certificates are blocked by
work-laptop policy. The approach (tunnel or preview deployment) is documented
in phase1/spike-manual-test-guide.md; the device checks are SP1–SP10 in
phase1/spike-report.md.

SCOPE: A written test plan only. No code, no deployment, no tunnel creation
in this task.

FILES TO INSPECT FIRST: phase1/spike-manual-test-guide.md,
phase1/spike-report.md, prototype/src/lib/video/p2p-adapter.ts (test hooks),
handover/09-ISSUES-AND-LIMITATIONS.md.

OUTPUT: phase1/mobile-verification-plan.md with (a) step-by-step HTTPS setup
options with trade-offs, (b) device/browser matrix to test, (c) SP1–SP10
mapped to concrete steps on this app's routes (/c/demo-storm etc., FAKE data
only), (d) pass/fail criteria per step, (e) a results-recording template,
(f) explicit warnings: ephemeral tunnel only, no real data, tear the tunnel
down afterwards.

DO NOT TOUCH: any source file; do not stand up any public URL in this task.
```

## 7. Preparing production hardening planning

```
TASK: Draft the production-hardening plan (planning document only).

CONTEXT: Gates G4–G13 in handover/06-DEFERRED-GATES.md list everything
deferred. Requirements live in 09-security-compliance.md, 07-data-model-and-
statuses.md and 10-architecture.md at the repo root.

SCOPE: A plan, not code. Nothing in this task changes the prototype.

FILES TO INSPECT FIRST: handover/06-DEFERRED-GATES.md, 09-security-
compliance.md, 10-architecture.md, prototype/src/lib/schema.ts (portability
notes + reserved hardening columns), prototype/src/lib/storage.ts.

OUTPUT: handover/hardening-plan-draft.md with (a) workstreams mapped to gates
G4–G13, (b) sequencing and dependencies (Postgres/storage before anything
touching real data), (c) per-workstream acceptance criteria, (d) open
decisions for management, (e) an explicit "not in hardening" list (AI,
integrations, WhatsApp, recording — separate decisions).

DO NOT TOUCH: any code. Mark every estimate as DRAFT — this plan needs
management review before anything is built.
```

## 8. Reviewing code without changing anything

```
TASK: Review <file(s) or area> and report findings. This is READ-ONLY.

CONTEXT: handover/02-CODEBASE-STRUCTURE.md maps the code; handover/09-ISSUES-
AND-LIMITATIONS.md lists KNOWN limitations — do not re-report those as
findings.

SCOPE: Analysis only. Zero edits, zero "quick fixes", zero formatting.

FILES TO INSPECT FIRST: handover/02-CODEBASE-STRUCTURE.md, handover/09-
ISSUES-AND-LIMITATIONS.md, then the target files.

OUTPUT: findings ranked by severity, each with file:line, what could go
wrong concretely, and a suggested (not applied) fix. Separate section for
"observations that are known limitations by design" so they are not
mistaken for defects. State clearly that nothing was changed.

DO NOT TOUCH: any file. If you believe something is urgent, say so in the
report — the decision to fix belongs to a separate task.
```

## 9. Adding a new assessment template

```
TASK: Add a new ACTIVE template: <peril/survey type> — approved by
<management/workshop decision reference, date>. Do not start without that
reference.

CONTEXT: Templates are code in prototype/src/lib/templates.ts, using shared
opening/closing spines and per-peril sections; the picker, seeding, room
checklist and report adapt from the template + job_type automatically.

SCOPE: One template + minimal seed/demo wiring. No engine changes.

FILES TO INSPECT FIRST: prototype/src/lib/templates.ts (copy the structure
of the closest existing peril), types.ts (ClaimType union — extend if
needed), schema.ts (claim-type CHECK constraint), fixtures.ts (add ONE
seeded demo job, obviously fake), report.ts (peril wording hooks if the new
peril needs cause-section wording), 04-claim-templates.md / 05-survey-
templates.md (source content), phase0/08-physical-trigger-matrix.md
(physical/hybrid triggers for this peril).

OUTPUT: (a) the diff, (b) version string v0.1-<chunk> and "pending assessor
sign-off" positioning, (c) verification: reset+reseed, template appears in
the picker with preview, a job can be created/scheduled/run/reported end to
end, smoke 22/22 (extend qa-smoke.mjs with a marker check for the new
template and say so), tsc + build clean, (d) updates to phase1/known-
limitations.md (L6 list) and handover files 01/03 job tables.

DO NOT TOUCH: fire (stays reference-only), existing templates, the status
machine, report auto-sections. NO template-builder UI — the template is code.
```

## 10. Creating a deployment plan (later)

```
TASK: Draft a deployment plan for <purpose: device-testing tunnel | pilot
environment | production>. Planning document only.

CONTEXT: Gate G12 (and G4/G5 for anything holding real data). Today the app
runs on one dev laptop: SQLite, local uploads, in-memory signaling
(single-process — note this constrains hosting), no auth.

SCOPE: A written plan. Do not deploy, do not create accounts, do not
provision anything in this task.

FILES TO INSPECT FIRST: handover/06-DEFERRED-GATES.md (G1, G4, G5, G12),
10-architecture.md, prototype/src/app/api/rtc/[room]/route.ts (in-memory
constraint), prototype/src/lib/{db,storage}.ts.

OUTPUT: a dated plan with (a) target environment and why, (b) what must
change in the app for that environment (e.g. signaling durability, DB,
storage) WITHOUT designing forbidden features, (c) TLS/domain approach,
(d) data rules for the environment (fake-only unless G4 passed), (e) rollback
/teardown steps, (f) explicit list of gates that must pass first.

DO NOT TOUCH: any code or infrastructure. If the purpose implies real data,
state that G4+G5 are unmet and the plan is contingent.
```
