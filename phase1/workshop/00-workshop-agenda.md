# Assessor template-validation workshop — agenda

**Purpose:** Validate the v0.1-1F templates against real assessment practice. Get sign-off or concrete corrections. Assign template owners (D-07). Identify pilot volunteers (D-08).

**Duration:** 90 minutes  
**Attendees:** 3–5 assessors/surveyors, 1 coordinator, 1 manager, 1 facilitator, 1 note-taker  
**Materials:** This pack, the prototype on screen, printed review sheets per template, pens

**Source guide:** `phase0/03-assessor-workshop-guide.md` (full facilitation notes)

---

## Session plan

| Time | Activity | Materials |
|---|---|---|
| 0–10 min | **Frame the concept** — guided video assessment, not a video call; placeholder access, not a gap; templates are the product | Prototype role picker on screen |
| 10–30 min | **Live walk-through** — show the full flow using demo jobs (see demo path below); pause at each step for feedback | Prototype + `phase0/06-assessor-ux-walkthrough.md` |
| 30–55 min | **Template review** — hand out printed review workbook; assessors mark corrections per template | `01-review-workbook.md` (one per assessor) |
| 55–70 min | **Survey templates** — residential and commercial review | Survey review sheets |
| 70–80 min | **Template ownership** — assign one named owner per claim type (D-07); identify 2–3 pilot volunteers (D-08) | Decision capture sheet |
| 80–90 min | **Wrap-up** — review action items; confirm what changes are approved | |

---

## Demo path (using seeded demo jobs)

Use these routes during the walk-through. ALL DATA IS FAKE.

| Step | What to show | Route | As role |
|---|---|---|---|
| 1 | Role picker + positioning | `/` | — |
| 2 | Admin pipeline (18 jobs) | `/admin` | Lerato |
| 3 | Template picker — fire disabled, commercial limited | `/jobs/new` | Lerato |
| 4 | Storm job detail + client link | `/jobs/j3` | Lerato |
| 5 | Client link journey (early state) | `/c/demo-storm` | — |
| 6 | Live room + checklist + capture | `/jobs/j5/room` + `/c/demo-live` | Sipho |
| 7 | Missing evidence upload | `/c/demo-upload/upload` | — |
| 8 | Report builder (storm) | `/jobs/j7/report` | Anje |
| 9 | Manager review + approve + lock | `/jobs/j7/report` | Craig |
| 10 | Survey report builder | `/jobs/j13/report` | Anje |
| 11 | Evidence pack download | `/jobs/j10/report/final` | Any |

---

## Templates to review

| # | Template | Type | Version | Heritage |
|---|---|---|---|---|
| 1 | Geyser / Water Damage | Claim | v0.2 | Phase 0 assessor-reviewed |
| 2 | Accidental Damage | Claim | v0.2 | Phase 0 assessor-reviewed |
| 3 | Storm Damage | Claim | v0.1-1F | New in 1F — needs first sign-off |
| 4 | Theft / Burglary | Claim | v0.1-1F | New in 1F — needs first sign-off |
| 5 | Power Surge | Claim | v0.1-1F | New in 1F — needs first sign-off |
| 6 | Burst Pipe | Claim | v0.1-1F | New in 1F — needs first sign-off |
| 7 | General Non-Motor | Claim | v0.1-1F | New in 1F — flexible peril selector |
| 8 | Residential Risk Survey | Survey | v0.1-1F | New in 1F — COPE + grading |
| 9 | Commercial Property Survey | Survey | v0.1-1F-limited | Deliberately shallow |

All templates reviewed using the consolidated **`01-review-workbook.md`** — print one copy per assessor.

**Fire** is reference-only (physical-first policy T4) — confirm this is still correct.

---

## Decision capture sheet

### Per-template verdict

| Template | Verdict | Changes needed (list) | Named owner (D-07) |
|---|---|---|---|
| Geyser / Water Damage | Signed off / Changes needed | | |
| Accidental Damage | Signed off / Changes needed | | |
| Storm Damage | Signed off / Changes needed | | |
| Theft / Burglary | Signed off / Changes needed | | |
| Power Surge | Signed off / Changes needed | | |
| Burst Pipe | Signed off / Changes needed | | |
| General Non-Motor | Signed off / Changes needed | | |
| Residential Risk Survey | Signed off / Changes needed | | |
| Commercial Property Survey | Signed off / Changes needed | | |
| Fire (reference-only) | Physical-first confirmed / Revisit | | |

### Overall template custodian (D-07)

Name: _______________

### Pilot volunteers (D-08)

| Name | Role | Willing? |
|---|---|---|
| | | |
| | | |
| | | |

### Other decisions / feedback captured

| Item | Decision / Action | Owner | Date |
|---|---|---|---|
| | | | |

---

## Rules for this workshop

1. **Collect feedback, don't build during the workshop.** Changes are applied in Phase C.
2. **New perils or features go to the decision register**, not the codebase.
3. **Template content is code** — there is no template builder. Wording changes are applied in `prototype/src/lib/templates.ts` after the workshop.
4. **Every change gets a version bump** and the approver's name in the commit.
