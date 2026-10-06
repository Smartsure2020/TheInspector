# Regression checklist — run after every future chunk

Precondition: dev server stopped → `npm run reset:demo` → `npm run dev`.
Automated render-level net first: `npm run qa:smoke` (all PASS required).
Then walk the manual items below. Last full pass: **2026-07-06 (post-1F)** — all items PASS.

## Core navigation & access
- [ ] Entry screen `/` → sign-in; prototype/fake-data/codename panel present; four demo accounts listed **without** the password; signing in lands on the role's workspace.
- [ ] Staff shell — PROTOTYPE banner always visible; skip-to-content link works; role-aware sidebar with the current page marked; acting user + job title in the top bar; mobile (<1024px) shows the drawer menu instead, closing on Escape and returning focus.
- [ ] Admin dashboard — full 18-job seeded book with correct types/statuses; "Risk survey" badge on survey jobs; exception tiles link to the matching status filter; the status filter shows a no-results state.
- [ ] Assessor dashboard — schedule grouped by day with times and durations; client readiness shown as four **labelled** steps (not colour alone); the primary action differs by readiness ("Join & admit" only when the client is in the waiting room); grouped queues (Awaiting evidence / Reports to write / Returned / No-shows) each with their own next action.
- [ ] Manager dashboard — review queue oldest-first with version, author and submitted time (incl. "survey report" label); team pipeline reads as grouped stages per assessor, not a wall of status pills; no productivity/quality metrics anywhere.

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
- [ ] Consent page — step indicator ("Step 1 of 3"); the five disclosures incl. **"the call is not recorded"**; name + tick required with inline errors; accept logs `consent_accepted` (check job timeline); decline and "I can't make this time" paths render.
- [ ] Camera check — reads as a numbered readiness test (camera / back camera / microphone / torch), each step stating its state in words; browser-recovery steps shown when permission is denied; "Continue anyway" proceeds and is visually distinct from a pass without being alarming.
- [ ] Waiting room — greets by first name; "Connected and waiting" with a calm low-motion indicator (never an endless spinner); "Done so far" recap; a long-wait note appears after ~3 minutes; readiness steps light up on the assessor dashboard (link opened / consent / camera / waiting).
- [ ] Client controls carry **icons + text labels**, never emoji, and are ≥48px (flip camera / torch / leave).

## Live room (`/jobs/<id>/room`)
- [ ] Room renders three zones: video stage with capture bar, checklist panel (template name + version + progress), evidence tray. Session status strip shows clock, connection, client presence, complete/missing/concern/capture counts.
- [ ] **Capture is the clearest control in the room** (48px, largest label) and always states its target: "Capturing for: <section> — <item>", or an explicit warning that the next capture will be **unfiled**.
- [ ] Capture loop unchanged — with a connected client (two windows, desktop): select item → instruction pushed to the client, Capture/C/Space stores a frame tagged to the item, thumbnail appears immediately, **no modal**; hotkey with no client video still reports "No client video to capture yet".
- [ ] Save state visible in words — "Saving n" → "All captures saved", and failed captures show "Not saved" in the tray plus a "need recapturing" count.
- [ ] Connection states show text + icon (Not connected / Connecting / Live / Reconnecting / Ended); "Client camera unavailable" when connected with no video; changes announced once via the live region.
- [ ] Guidance — one "Guide the client" toolbar grouped Framing / Their device; the currently pushed instruction is echoed on the stage as "Client is reading: …"; it can be cleared.
- [ ] High-res photo request — HI-RES tagged items show on serial/plate/document items; Request photo sends the client prompt and the item shows "Photo requested" (needs connected client).
- [ ] Checklist answers — yes/no, choice, text/number (saves on blur), note, concern flag all persist (verify via report prefill or DB); the active item is unmistakable (accent border + "Active capture target").
- [ ] "Can't capture this" — reason buttons flag the item missing; undo works.
- [ ] End session — accessible dialog (focus moves in, Escape closes, focus returns) with complete/missing/concerns/captures, the missing list with reasons, in-flight/failed upload warnings, and two consequence-labelled outcomes → **Awaiting evidence** (disabled when nothing is missing) or **Awaiting report**.
- [ ] Admit client — button enabled only when the client is live in the waiting room; "Start session (demo)" on the job page covers demos without a second window and states that nobody is admitted.
- [ ] Low-viewport behaviour — at 1280×620 and 1024×700 nothing is clipped and there is no horizontal overflow. **Phones are still unverified (L1 / gate G1).**

## Evidence
- [ ] Evidence gallery — **unfiled captures appear first as an explicit work queue** with a count and filing instruction; the rest are grouped by checklist section; each card shows source, checklist location, time, featured state and a "Full size" affordance; controls sit below the image, not over it.
- [ ] Feature control is explained ("Feature as a report figure" / "Featured as a report figure"), not an unlabelled star; per-card save confirmation appears after a change.
- [ ] Locked job — controls disappear with "Read-only — the record is locked" and the page states that approval caused it; evidence stays readable.
- [ ] Missing-evidence upload `/c/demo-upload/upload` — outstanding items numbered with **client-facing names and reasons** (never raw checklist keys); allowed types and 15 MB cap stated up front; photo/PDF upload resolves the item live and lands in the gallery tagged to the item; failure says nothing was lost; "Nothing outstanding" state when done.
- [ ] Consent logging — timeline shows consent + upload events with client actor.

## Reports
- [ ] Claim report builder — 5 narrative sections prefilled from checklist (answers, concern notes); storm shows weather-corroboration + maintenance-separation + roof safe-vantage wording in cause.
- [ ] Peril adaptivity — General Non-Motor job with a selected peril (e.g. Glass) adapts summary + cause wording.
- [ ] Survey report builder — Risk description / COPE findings / Recommendations register / A–E grading; **no cause-of-loss section**; survey limitations wording; surveyable=No adds the physical-survey limitation.
- [ ] Auto sections — particulars, featured figures, **non-removable limitations**, evidence index render on builder preview and final page, each marked "Auto" / "Non-removable" and with **no edit control**.
- [ ] Autosave is trustworthy — typing shows "Unsaved changes", clicking out shows "Saving draft…" then "Draft saved at HH:MM"; a failure offers "Retry save"; state is announced to screen readers.
- [ ] Submit for review — confirmation dialog states that a version is snapshotted and the job moves to Report submitted (not completed); creates version, status **Report submitted**, lands on final page.
- [ ] Final report page — one `<h1>`, document title below it, numbered sections, figure captions, limitations prominent, sign-off block, and an honest note that print/save-as-PDF is the browser's own engine (no letterhead, no pagination control, no signature).
- [ ] Print preview — navigation, banner and controls hidden; report flows onto pages; headings stay with their content; the evidence index prints unclipped.

## Manager review & locking
- [ ] Return for correction — decide first, then write comments in a dialog; **comments required**; job → **Returned for correction**; assessor sees the comment panel at the top of the builder (styled as work to do, not a system error).
- [ ] Revise/resubmit — edits persist, resubmits as v2; version history lists all versions with statuses.
- [ ] Approve — confirmation dialog spells out the four consequences and that Report completed has no onward transitions; approve is styled as the commit action and return is not its equal; locks job (**Report completed**); report builder read-only, evidence gallery shows "locked".
- [ ] Server-side lock — evidence curation and further status transitions rejected after approval (`updateEvidenceAction` guard + empty `EDGES["Report completed"]`).
- [ ] Manager-only review — `reviewReportAction` rejects non-manager roles.

## Evidence pack
- [ ] Download `.zip` for: a storm claim, an accidental claim, a residential survey.
- [ ] ZIP extracts; contains `index.csv` (full evidence index + notes) and `README.txt`; real uploaded files appear under `evidence/` named by fig-section-label; seeded placeholder tiles annotated "no file".

## Job detail, timeline & actions
- [ ] Job header answers what/who/when/status/attempt/priority/locked at a glance, with **one** primary next action derived from the current status.
- [ ] Job tabs (Overview / Appointments / Checklist / Live room / Evidence / Report / Final report) are real links with a visible selected state and survive a page reload; Final report only appears once something has been submitted.
- [ ] Timeline is human-readable — labels like "Report submitted for review", grouped by day, with named detail rows (From/To, Reason, Attempt, Version). **No raw JSON and no raw event names on screen; stored `event_type` values unchanged.**
- [ ] Checklist tab — legend, per-item evidence/high-res/answered/missing/concern state, answers and notes shown, long prompts wrap, missing reasons not truncated.
- [ ] Destructive/consequential actions use the shared dialog and state their consequence: cancel, no-show, demo session start, both end-session outcomes, "all items resolved". **No `window.confirm` anywhere in the app.**
- [ ] Scheduling — booking/rebooking states the revocation consequence and link validity window; active vs revoked links are visually distinct; the page says nothing is sent automatically and offers copy-link / copy-message.

## Accessibility & shell
- [ ] Every route: exactly one `<h1>`, `<main>` landmark, skip link, visible focus rings.
- [ ] No control communicates state by colour alone; every icon-only control has an accessible name.
- [ ] Overlays (drawer, modals, confirmations) move focus in, trap Tab, close on Escape and return focus to the opener; body scroll is locked.
- [ ] `prefers-reduced-motion` suppresses the capture flash, drawer and dialog animations.

## Regression anchors
- [ ] Geyser still works (j6 upload flow, j10 approved/locked report) but is not the primary demo.
- [ ] Fire appears nowhere as a bookable virtual assessment.
- [ ] No-show (j12) and Cancelled (j11) render correctly; No-show can be rescheduled.
- [ ] `npm run build` and `npx tsc --noEmit` pass clean.

## After the pass
Stop server → `npm run reset:demo` → restart, so the demo book is pristine.
