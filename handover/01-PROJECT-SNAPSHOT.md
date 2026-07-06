# Project snapshot — The Inspector (as of 2026-07-06)

## What The Inspector is

A standalone digital **non-motor claims assessment and risk survey platform**
for Acorn. An assessor/surveyor runs a guided live video session with a client
(the client needs nothing but a link on their phone), works through a
peril-specific checklist, captures labelled evidence frames and high-res
photos, and the system turns the session into a structured report with an
auditable evidence pack.

Core principle (from the root blueprint): **The Inspector is NOT a video
meeting tool.** Video is just the transport. The product is structured,
labelled, auditable evidence and the report that writes itself from it.

"The Inspector" is an **internal codename only** — not client-facing branding
(name conflict risk with theinspector.co.za; decision D-01). The project is
deliberately independent of all other Acorn systems (Scout, Suri, Atlas, HRS,
Smartsure, claims automation) and must not reference or integrate with them
unless explicitly decided later.

## Why Acorn is building it

- Physical assessments are slow and expensive (travel, scheduling); many
  non-motor claims (geyser, storm, accidental, power surge) can be assessed
  virtually with equal or better evidence discipline.
- A guided checklist per peril standardises what junior/senior assessors
  capture, and the auto-generated report cuts report-writing time.
- Risk surveys (residential, and later commercial) share the same engine.
- Full rationale: `01-product-summary-and-personas.md` and
  `phase0/01-executive-summary.md`.

## What the current prototype proves

1. **One workflow engine carries claims AND surveys** — same statuses,
   same evidence flow, different templates and report variants.
2. **The client needs only a link** — early/active/invalid link states,
   consent with logging, camera check with graceful fallback, waiting room;
   staff see readiness (link opened / consent / camera / waiting) live.
3. **The capture loop works** — checklist item → client instruction banner →
   frame capture tagged to the item → guidance chips → missing-item flow →
   end-session summary (verified desktop↔desktop).
4. **The video layer is swappable** — the room depends only on a
   `SessionAdapter` interface; the current implementation is plain P2P WebRTC
   with no provider, and a LiveKit mapping is documented as a stub.
5. **The report writes itself** — narrative prefilled from checklist answers,
   featured evidence as figures, auto non-removable Limitations, evidence
   index; peril-adaptive wording (e.g. storm weather corroboration, glass).
6. **Four-eyes review with a hard lock** — submit → return with comments →
   revise → resubmit (v2) → approve → job locked in UI *and* server-side.
7. **The missing-evidence loop closes itself** — flagged items get a client
   upload page; uploads resolve items live and land tagged in the gallery.
8. **Insurer-ready handoff** — evidence pack ZIP with files named by
   section/item, `index.csv` and README.

## Current approved features (built, 1A–1F)

- Role-picker entry (placeholder access, no login — by design, AC9)
- Admin / Assessor / Manager dashboards with an 18-job seeded pipeline
- Job creation with a governed template picker (fire disabled, commercial
  survey flagged limited); assignment, scheduling, link generation with
  paste-ready SMS text; cancel / no-show / reschedule flows
- Status machine with server-enforced legal transitions
- Client link journey: landing (early/active/invalid), consent, device check,
  waiting room, live session view, missing-evidence upload page
- Live room: provider-agnostic adapter, checklist panel, capture loop,
  HI-RES photo request on serial/plate/document items, guidance prompts,
  can't-capture flow, end-session summary with outcome choice
- Evidence gallery: grouping by section, UNFILED bucket, relabel/refile/
  feature/discard, locked state after approval
- Report builder (claims + survey variants), submit/version cycle, manager
  review queue, return-with-comments, approve-and-lock, final report page,
  browser print-to-PDF
- Evidence pack ZIP download
- Append-only (by convention) event log shown as the job timeline
- Demo reset script and 22-check automated smoke suite

## Current active templates (all v0.1-1F unless noted)

Defined in `prototype/src/lib/templates.ts`; **all pending assessor workshop
sign-off**. Geyser and accidental carry Phase 0 v0.2 review-sheet content
(the only assessor-reviewed material so far).

| Template | Type | Status |
|---|---|---|
| Geyser / water damage | claim | Active (content from phase0 v0.2) |
| Accidental damage | claim | Active (content from phase0 v0.2) |
| Storm damage | claim | Active — primary demo |
| Theft / burglary | claim | Active (neutral wording, STOP→ESCALATE) |
| Power surge | claim | Active |
| Burst pipe | claim | Active |
| General non-motor | claim | Active — one flexible checklist with a peril selector (e.g. Glass); NOT a template builder |
| Fire | claim | **Reference-only / physical-first** — disabled in the picker AND rejected server-side (policy T4) |
| Residential risk survey | survey | Active — COPE findings, recommendations register, A–E grading |
| Commercial/property survey | survey | Active but flagged `v0.1-1F-limited` (deliberately shallow; heavy industrial routes physical per T8) |

## Current report outputs

- **Claims assessment report**: summary, circumstances, findings, cause of
  loss (peril-adaptive), conclusion + auto sections (particulars, featured
  figures, non-removable Limitations, evidence index, sign-off).
- **Survey report**: risk description, COPE-style findings, recommendations
  register (Requirement vs Improvement + timelines), A–E risk grading —
  **no cause-of-loss section**; survey-specific limitations including
  "NOT adequately surveyable virtually — a physical survey is recommended"
  when the surveyor answers surveyable = No.
- **Evidence pack**: store-only ZIP — evidence files named by
  section/item + `index.csv` + `README.txt`. No hashing/integrity chain yet
  (deferred hardening).
- PDF is **browser print-to-PDF** only.

## Current demo state

- Pristine seeded book: **18 fake jobs** across every status, all perils and
  both survey types; 4 demo staff users (Lerato/admin, Sipho/assessor,
  Anje/assessor-surveyor, Craig/manager).
- Long-dated demo client links: `/c/demo-storm`, `/c/demo-acc`,
  `/c/demo-theft`, `/c/demo-survey`, `/c/demo-live`, and
  `/c/demo-upload/upload` for the missing-evidence flow.
- `npm run reset:demo` restores the pristine book; `npm run qa:smoke` gives a
  22/22 render-level PASS on it (2026-07-06).
- Demo runbook: `phase1/demo-guide.md` and file 04 in this pack.

## Current limitations (summary — full register in file 09)

- Mobile live-room **not verified** (desktop↔desktop only; HTTPS constraint)
- P2P WebRTC only — no TURN relay; hostile corporate NAT/CGNAT may fail
- In-memory HTTP signaling (single dev-server process)
- SQLite + local disk storage; no backups, no integrity chain
- Browser print-to-PDF only
- Templates v0.1-1F pending assessor sign-off
- Placeholder access — anyone can act as any role
- Seeded evidence items are placeholder tiles without image files (honestly
  annotated in packs)

## Deferred gates (summary — full detail in file 06)

1. Assessor template sign-off (workshop)
2. Mobile live-room verification (device spike SP1–SP10 on phones)
3. Final video provider / TURN decision
4. Minimum live-data safeguards before ANY real-client use (phase0 D-09)
5. Postgres + object-storage migration before shadow mode
6. Production hardening (auth/MFA/permissions, POPIA, storage, audit,
   retention, server PDF, deployment)
7. Template ownership & versioning governance (D-07)

## What is NOT production-ready

Everything. This is a prototype for validation and demo. Nothing in
`prototype/` may be exposed to real clients, real claims data, or the public
internet in its current state. The path from here to production runs through
the gates above, in roughly the order given in
[05-NEXT-STEPS-ROADMAP.md](05-NEXT-STEPS-ROADMAP.md).
