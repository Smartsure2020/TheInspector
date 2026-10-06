# Management demo guide — Phase 1 prototype (post-1F)

**Codename only — Acorn. Role-play / anonymised data only; no real client data.**
All claim and survey templates are **v0.1-1F demo content pending assessor
workshop sign-off** (geyser and accidental carry the Phase 0 v0.2 review-sheet
content). Say this up front in the demo.

## Before the demo

1. Stop the dev server if it is running.
2. `cd prototype && npm run reset:demo` — returns the app to the pristine
   seeded demo book (18 jobs across perils and surveys).
3. `npm run dev` — first request re-seeds automatically.
4. Optional sanity check: `npm run qa:smoke` (all checks must pass).
5. Open two browser windows side by side if you want to show the live room
   with a real client connection (one staff, one client link).

## Recommended demo order

### 1. Positioning (2 min) — entry screen `/`
Open `http://localhost:3000`; `/` sends you to the sign-in screen. Point out the
"Read this before you demo" panel: every record is role-play data, "The
Inspector" is an internal codename, reports carry a non-removable limitations
section and are positioned as pending assessor sign-off, and access control is
prototype-grade (production auth/MFA/POPIA deferred by decision). The four demo
accounts and the workspace each one lands in are listed alongside; the shared
demo password is in the handover pack, not on screen. Clients never sign in —
they open a one-off appointment link.

Then mention the multi-peril + survey positioning (storm, theft, accidental,
power surge, general non-motor, surveys) that the pipeline shows next.

### 2. The book of work (3 min) — enter as **Lerato Demo (Admin)**
The pipeline shows 18 seeded jobs covering every status in the workflow —
storm, accidental, theft, power surge, burst pipe, geyser, residential and
commercial surveys. **Proves:** one workflow engine carries claims AND surveys.

### 3. Job creation + template picker (3 min) — Admin → New job
Open the template dropdown. Show:
- every active peril template with a live section/evidence preview;
- **Fire is greyed out** — "physical-first (virtual triage only, not bookable)";
- **Commercial survey flagged "limited / prototype"**.
Create a job or cancel out. **Proves:** governed template catalogue, not a
free-for-all; fire policy enforced in UI *and* server.

### 4. Primary storm demo (8 min) — job INS-2026-0003 + `/c/demo-storm`
- Open the job as admin: template v0.1-1F, schedule, client link, timeline.
- Open `/c/demo-storm` (client view): "you're a little early" state and the
  storm prep list — note the **"do NOT climb on the roof or a ladder"** safety
  wording (standing safety rule T3).
- Walk the client flow (preview override): consent → camera check (graceful
  fallback if no camera) → waiting room.
- Switch to **Sipho Demo (Assessor)**: the schedule shows client readiness as
  four **labelled** steps (link opened → consent accepted → device check passed →
  in waiting room) filling in live, and the primary action changes with it —
  "Join & admit client" only once the client is actually in the waiting room,
  otherwise "Open job" with a note saying why.
**Proves:** client needs nothing but a link; consent is logged; staff see
readiness in real time and are told what to do about it.

### 5. Live room + checklist (5 min) — job INS-2026-0005 (Power Surge)
Join the room as Sipho. It is a three-zone workstation: video stage with the
capture bar, checklist panel, evidence tray, and a status strip along the top
(session clock, connection state in words, client presence, complete / missing /
concern / capture counts). Show:

- **The capture control and its target.** Capture is the largest control in the
  room and always says what the next frame will be filed against — "Capturing
  for: <section> — <item>", or an explicit warning that it will be saved
  **unfiled**. Selecting a checklist item marks it "Active capture target" and
  pushes that item's instruction to the client.
- One click **or** the C / Space hotkey, no modal, thumbnail in the tray
  immediately, then "Saving 1" → "All captures saved". A failed upload says
  "Not saved" on the thumbnail and adds a "need recapturing" count.
- HI-RES tags on serial-plate items and **Request high-res photo**, which is
  filed against the selected item.
- **Guide the client** — one labelled toolbar (Framing / Their device); whatever
  you push is echoed back on the stage as *"Client is reading: …"*, so you always
  know what they are looking at.
- The **"Can't capture this"** reason flow, and the End-session review dialog:
  counts, the missing list with reasons, warnings about uploads still in flight,
  and two outcomes labelled with their consequence ("items outstanding →
  Awaiting evidence" is unavailable when nothing is missing).
- The adapter name in the status strip — no video provider is selected yet, by
  decision, and the room only ever talks to `SessionAdapter`.

With a second window on `/c/demo-live` you can show real video + frame capture on
desktop. **Proves:** the capture loop and checklist discipline work per peril;
video layer stays swappable.

> Verified desktop/laptop/tablet-landscape only. The mobile live room is still
> unverified (L1, gate G1) — do not claim phone support.

### 6. Missing evidence loop (3 min) — job INS-2026-0006 + `/c/demo-upload/upload`
Geyser job in "Awaiting evidence" with two flagged items. Open the upload page as
the client: the items are numbered, named in **plain language with a reason**
("Photo of the sticker on the geyser — the silver sticker or plate with the make,
size and serial number"), never as raw checklist keys, and the allowed types and
15 MB cap are stated before you start. Upload a photo/PDF — the item resolves
instantly and the evidence lands in the gallery tagged to the checklist item and
labelled as a client upload. On the staff side, note that the gallery puts
**unfiled captures first as a work queue**. **Proves:** no-show of documents
doesn't stall the claim; the loop closes itself.

### 7. Report generation — claims (5 min) — job INS-2026-0007 (Storm, Awaiting report)
Open Report builder as **Anje Demo**. Show: narrative prefilled from checklist
answers (SAWS weather corroboration, maintenance separation with concern flag,
roof safe-vantage/hybrid wording in the cause section), featured evidence as
report figures, **auto non-removable Limitations**, evidence index. Submit for
review. **Proves:** the report writes itself from session data; limitations are
honest and cannot be deleted.

### 8. Manager review cycle (5 min) — enter as **Craig Demo (Manager)**
The review queue is oldest-first and holds claim AND survey reports, each with
its version, author, submission time and a "Resubmission" flag if it has been
back before. On the storm report: **Return for correction** — decide first, then
type the (required) comments in the dialog → switch to assessor, show the
comment panel at the top of the builder, edit, resubmit (v2) → back to manager,
**Approve & lock**. The approval dialog spells out the consequences: this version
becomes final, narrative editing stops, evidence labels/filing/figures freeze,
and Report completed has no onward transitions. Then show the locked job: report
builder read-only, evidence gallery read-only with the reason stated, server
rejects any further transitions. **Proves:** four-eyes review with version
history and a hard lock the user is warned about before it happens.

### 9. Survey variant (5 min) — jobs SRV-2026-0013 and SRV-2026-0016
Open SRV-2026-0013's report builder: **Risk description / COPE findings /
Recommendations register (Requirement vs Improvement + timelines) / A–E risk
grading — and no cause-of-loss section**. Open SRV-2026-0016's submitted report:
grade C and the auto limitation "**NOT adequately surveyable virtually — a
physical survey is recommended**". **Proves:** same engine, honest survey
output that knows its own limits.

### 10. Evidence pack (2 min) — any completed job
On an approved report, click **Evidence pack (.zip)**: extract → evidence files
named by section/item + `index.csv` + README. (Seeded demo tiles have no real
image files and say so in the index; a job with real uploads, e.g. after step 6,
shows actual files.) **Proves:** insurer-ready handoff artifact.

### 11. Wrap: peril adaptivity (2 min, optional)
Show a General Non-Motor job's report where the cause section adapts to the
selected peril (e.g. Glass), and the theft template's neutral-wording
assessment items (no "staged" language; STOP→ESCALATE discipline).

## Which role for which step

| Step | Role |
|---|---|
| 1, 4 (client view), 6 | No role — client links |
| 2, 3 | Lerato Demo (Admin) |
| 4 (readiness), 5, 7, 8 (revise) | Sipho / Anje Demo (Assessor) |
| 8, 9 (review), 10 | Craig Demo (Manager) |

## Honest limitations to state in the demo

- Templates are **v0.1-1F demo content pending assessor sign-off** (geyser +
  accidental derive from the Phase 0 v0.2 signed-off sheets).
- No video provider selected yet — the room runs a **P2P WebRTC adapter** behind
  a provider-agnostic interface; provider selection is a later decision.
  P2P has no TURN relay: some corporate/CGNAT networks won't connect.
- **Mobile live-room verification is deferred, not cancelled** (needs HTTPS on
  a phone; work-laptop policy blocks local certificates).
- SQLite + local file storage — prototype only; Postgres migration is a gate
  before any real-client shadow mode.
- PDF = browser print-to-PDF; no server-side PDF generation yet. The report page
  says so on screen.
- Commercial survey template is deliberately **limited depth**.
- No production auth/MFA/permissions, no POPIA hardening, no recording, no AI,
  no integrations, no WhatsApp — all deferred by scope decision, not oversight.
- The 2026-07-30 UX/UI pass changed **presentation only**. It did not close any
  gate: the status machine, server actions, event logging, templates, report
  generation, evidence rules and the `SessionAdapter` boundary are untouched, and
  the mobile live room is still unverified.
- Full register: `known-limitations.md`.

## After the demo

Stop the server, `npm run reset:demo`, restart — pristine book restored.
