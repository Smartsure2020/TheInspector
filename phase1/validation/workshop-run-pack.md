# Workshop run pack — assessor template validation

**Purpose:** Everything a facilitator needs to run the assessor workshop (Phase B).
This pack consolidates references, prerequisites, and the run-of-show into one
document. It does NOT replace the detailed materials — it tells you where they are
and what order to use them.

**Gate:** G3 (Assessor template sign-off)
**Decisions fed:** D-06 (report review/quantum), D-07 (template ownership), D-08 (pilot volunteers)

---

## Prerequisites — confirm before scheduling

| # | Item | Status | How to verify |
|---|------|--------|---------------|
| 1 | Prototype runs clean on the demo laptop | | `npm run reset:demo` then `npm run qa:smoke` → 22/22 PASS |
| 2 | Printed review workbooks (1 per assessor) | | Print `phase1/workshop/01-review-workbook.md` |
| 3 | Workshop agenda printed (facilitator copy) | | Print `phase1/workshop/00-workshop-agenda.md` |
| 4 | Projector / screen for live walk-through | | Test before the session |
| 5 | 3–5 assessors/surveyors confirmed | | Names: _______________ |
| 6 | 1 manager/reviewer confirmed | | Name: _______________ |
| 7 | Facilitator + note-taker assigned | | Names: _______________ |
| 8 | Pens for every assessor | | |
| 9 | Demo data is FAKE — confirmed no real client data | | Visual check: names like "Thandi Mokoena", "James van der Berg" |

---

## Materials index

| Material | Location | Print? |
|----------|----------|--------|
| Workshop agenda + demo path | `phase1/workshop/00-workshop-agenda.md` | Yes (facilitator) |
| Review workbook (9 templates) | `phase1/workshop/01-review-workbook.md` | Yes (1 per assessor) |
| Decision capture sheet | Embedded in `00-workshop-agenda.md` (bottom) | Yes (1 copy) |
| Assessor UX walkthrough | `phase0/06-assessor-ux-walkthrough.md` | Optional |
| Full facilitation guide | `phase0/03-assessor-workshop-guide.md` | Optional |
| Acceptance criteria | `phase1/09-acceptance-criteria.md` | No (reference) |

---

## Run-of-show (90 minutes)

### 0–10 min: Frame the concept

- Open the prototype on the projector at `/` (role picker)
- Key messages:
  - This is a **guided video assessment**, not a video call
  - The placeholder access (role picker) is intentional — no login yet
  - **Templates are the product** — this workshop validates them
  - All data on screen is fake
- Do NOT demo features yet — that's the next block

### 10–30 min: Live walk-through

Follow the demo path in `00-workshop-agenda.md` (11 steps, j3→j13 demo jobs).
Pause at each step for questions. The facilitator drives; assessors watch and ask.

Key stops:
- `/jobs/j5/room` — the live room. Show checklist-driven capture, prompts, high-res request
- `/c/demo-storm` — the client journey. Show what the CLIENT sees (and what they don't)
- `/jobs/j7/report` — the report builder. Show auto-populated sections, limitations, evidence figures

### 30–55 min: Template review (claims)

- Hand out printed review workbooks
- Assessors work through templates 1–7 (claims), marking each item ✓/✗/+/−
- Facilitator walks the room; note-taker captures verbal feedback
- For each template, open the relevant demo job so assessors can see it live

### 55–70 min: Survey templates

- Templates 8–9 (residential + commercial survey)
- Same review process
- Key question for commercial: "Is the current depth right for light commercial?"

### 70–80 min: Template ownership + pilot volunteers

- Fill the decision capture sheet (in `00-workshop-agenda.md`):
  - Per-template verdict (signed off / changes needed)
  - Named owner per claim type (D-07)
  - Overall template custodian (D-07)
  - 2–3 pilot volunteers (D-08)
- Fire policy: confirm physical-first is still correct

### 80–90 min: Wrap-up

- Read back all action items
- Confirm what is signed off vs what needs changes
- Confirm next step: changes applied in code (Phase C), then re-validated
- Thank assessors — their time is the most valuable input in this project

---

## After the workshop

1. **Photograph or scan** every marked-up review sheet
2. **Transcribe** all corrections into a single feedback document
3. **File** photos/scans in `phase1/workshop/evidence/`
4. **Do NOT modify code** during or immediately after the workshop — collect first, change after (Phase C)
5. **Record decisions** in `phase0/10-decision-register.md`:
   - D-06: report review process + quantum question
   - D-07: template owners + custodian
   - D-08: pilot volunteer names
6. Hand the feedback document to the person who will execute Phase C
   (see `phase1/validation/post-workshop-update-plan.md`)

---

## Rules (binding)

1. **Collect feedback, don't build during the workshop.** Changes are Phase C.
2. **New perils or features go to the decision register**, not the codebase.
3. **Template content is code** — there is no template builder. Wording changes are applied in `prototype/src/lib/templates.ts` after the workshop.
4. **Every change gets a version bump** and the approver's name in the commit.
5. **No real client data.** All demo data is fake. If an assessor brings a real case for reference, do not enter it into the prototype.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Prototype won't start | `cd prototype && npm run reset:demo && npm run dev` |
| Smoke tests fail | Check `npm run qa:smoke` output; fix before proceeding |
| Demo data looks wrong | `npm run reset:demo` wipes and reseeds with fake data |
| Assessor asks about login/security | "Planned and documented; deliberately deferred until the workflow is validated. Gate G6." |
| Assessor asks about recording | "Decision D-04: excluded from prototype. Revisit post-pilot." |
| Someone wants to test on their phone | "We need HTTPS for that — it's a separate testing phase (G1). Today is templates only." |
