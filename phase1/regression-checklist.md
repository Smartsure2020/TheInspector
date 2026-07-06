# Regression checklist — run after every future chunk

Precondition: dev server stopped → `npm run reset:demo` → `npm run dev`.
Automated render-level net first: `npm run qa:smoke` (all PASS required).
Then walk the manual items below. Last full pass: **2026-07-06 (post-1F)** — all items PASS.

## Core navigation & access
- [ ] Role picker `/` — three role cards + demo client links; entering each role sets the acting user shown in the header.
- [ ] Admin dashboard — full 18-job seeded book with correct types/statuses; SURVEY badge on survey jobs.
- [ ] Assessor dashboard — "Today" cards with readiness dots; grouped queues (Awaiting evidence / Reports to write / Returned / No-shows).
- [ ] Manager dashboard — review queue (incl. "(survey report)" label) + team pipeline.

## Job lifecycle
- [ ] Job creation `/jobs/new` — create an accidental job with client + assessor; lands on job page as **Assigned** with timeline entries.
- [ ] Template picker — all active templates listed with section preview; **fire disabled ("not bookable")**; **commercial survey tagged "limited / prototype"**.
- [ ] Fire not bookable server-side — `createJobAction` rejects reference-only templates (code guard; cannot be reached via UI).
- [ ] Scheduling — book date/time on an Assigned job → status **Scheduled**, client link + paste-ready SMS text generated; rescheduling revokes the old link.
- [ ] Status machine — illegal transitions rejected (e.g. mock-start only from Scheduled; approve only from Report submitted).

## Client link states (`/c/<token>`)
- [ ] Early (before window): "You're a little early" + peril-specific prep list (storm shows **do-NOT-climb** safety wording).
- [ ] Active: "I'm ready — continue" flow.
- [ ] Invalid/unknown token: "This link isn't recognised".
- [ ] Consent page — name + tick required; accept logs `consent_accepted` (check job timeline); decline and "I can't make it" paths render.
- [ ] Camera check — graceful fallback wording when no camera; "Continue anyway" proceeds.
- [ ] Waiting room — greets by first name; readiness dots light up on the assessor dashboard (link opened / consent / camera / waiting).

## Live room (`/jobs/<id>/room`)
- [ ] Room renders: P2P adapter banner, checklist with template name + version, progress counter, tray, guidance chips.
- [ ] Capture loop — with a connected client (two windows, desktop): select item → banner on client, Capture/C/Space stores a frame tagged to the item; without client video the button reports "No client video to capture yet".
- [ ] High-res photo request — HI-RES tagged items show on serial/plate/document items; Request photo sends the client prompt (needs connected client).
- [ ] Checklist answers — yes/no, choice chips, text (saves on blur), note, concern flag all persist (verify via report prefill or DB).
- [ ] "Can't capture now…" — reason chips flag the item missing; undo works.
- [ ] End session — summary modal (complete/missing/concerns/captures) → **Awaiting evidence** or **Awaiting report**.
- [ ] Admit client — button enabled only when the client is live in the waiting room; "Start session (mock)" on the job page covers demos without a second window.

## Evidence
- [ ] Evidence gallery — items grouped by checklist section, UNFILED bucket, relabel/refile/feature controls work on an unlocked job.
- [ ] Missing-evidence upload `/c/demo-upload/upload` — outstanding items listed; photo/PDF upload resolves the item live and lands in the gallery tagged to the item; "Nothing outstanding" state when done.
- [ ] Consent logging — timeline shows consent + upload events with client actor.

## Reports
- [ ] Claim report builder — 5 narrative sections prefilled from checklist (answers, concern notes); storm shows weather-corroboration + maintenance-separation + roof safe-vantage wording in cause.
- [ ] Peril adaptivity — General Non-Motor job with a selected peril (e.g. Glass) adapts summary + cause wording.
- [ ] Survey report builder — Risk description / COPE findings / Recommendations register / A–E grading; **no cause-of-loss section**; survey limitations wording; surveyable=No adds the physical-survey limitation.
- [ ] Auto sections — particulars, featured figures, **non-removable limitations**, evidence index render on builder preview and final page.
- [ ] Submit for review — creates version, status **Report submitted**, lands on final page.

## Manager review & locking
- [ ] Return for correction — requires comments; job → **Returned for correction**; assessor sees the comment banner in the builder.
- [ ] Revise/resubmit — edits persist, resubmits as v2; version history lists all versions with statuses.
- [ ] Approve — locks job (**Report completed**); report builder read-only, evidence gallery shows "locked".
- [ ] Server-side lock — evidence curation and further status transitions rejected after approval (`updateEvidenceAction` guard + empty `EDGES["Report completed"]`).
- [ ] Manager-only review — `reviewReportAction` rejects non-manager roles.

## Evidence pack
- [ ] Download `.zip` for: a storm claim, an accidental claim, a residential survey.
- [ ] ZIP extracts; contains `index.csv` (full evidence index + notes) and `README.txt`; real uploaded files appear under `evidence/` named by fig-section-label; seeded placeholder tiles annotated "no file".

## Regression anchors
- [ ] Geyser still works (j6 upload flow, j10 approved/locked report) but is not the primary demo.
- [ ] Fire appears nowhere as a bookable virtual assessment.
- [ ] No-show (j12) and Cancelled (j11) render correctly; No-show can be rescheduled.
- [ ] `npm run build` and `npx tsc --noEmit` pass clean.

## After the pass
Stop server → `npm run reset:demo` → restart, so the demo book is pristine.
