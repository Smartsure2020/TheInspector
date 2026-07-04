# 03 — Screen-by-Screen Build List

16 screens. Each entry: purpose, must-contain, and done-when. Staff screens target a
laptop at 1366×768; client screens are designed at 360 px width first. Build order
follows the chunks in doc 08.

| # | Screen | Chunk |
|---|--------|-------|
| S1 | Placeholder role entry | 1A |
| S2 | Admin dashboard | 1B |
| S3 | Assessor dashboard | 1B |
| S4 | Manager dashboard | 1B (shell) / 1I (review) |
| S5 | Create job | 1B |
| S6 | Job detail | 1B |
| S7 | Scheduling | 1B |
| S8 | Client landing page | 1C |
| S9 | Consent placeholder | 1C |
| S10 | Camera/mic check | 1C/1D |
| S11 | Waiting room | 1C/1D |
| S12 | Live assessment room (assessor + client views) | 1D/1E/1F |
| S13 | Evidence gallery | 1G |
| S14 | Missing evidence upload page | 1G |
| S15 | Report builder | 1H |
| S16 | Completed report page | 1H/1I |

---

### S1. Placeholder role entry
- Three big buttons: Admin/Coordinator, Assessor–Surveyor, Manager–Reviewer, plus a
  user-name picker per role (seeded demo users) so evidence/reports carry a name.
- Banner: "PROTOTYPE — placeholder access, no real client data."
- Done when: role choice routes to the right dashboard and persists per browser.

### S2. Admin dashboard
- Table of jobs grouped by status with age-in-status; exception strips: Unassigned /
  Unscheduled / No-shows / Awaiting evidence. Filters: status, assessor, claim type;
  search by client/claim number. "+ New job".
- Done when: every job state in the seed data is visible and reachable in ≤2 clicks.

### S3. Assessor dashboard
- "Today" strip: appointments in time order, client-readiness indicator (link opened /
  consent done / device check passed / waiting), Join room button.
- "My jobs" grouped: to schedule / upcoming / awaiting evidence (with outstanding
  items) / reports to write / returned.
- Done when: an assessor knows their next action within 5 seconds (usability check).

### S4. Manager dashboard
- Review queue oldest-first with age badges; team pipeline counts per assessor.
  Counts and lists only — no charts.
- Done when: queue reflects submissions in real time and opens the review view.

### S5. Create job
- One page, three blocks: Client (name, phone, email, language), Claim (claim number,
  type: geyser/accidental [others greyed "reference only"], date of loss,
  description, policy number, special conditions to verify), Assignment (assessor,
  priority, notes). Template preview on type selection.
- Done when: admin creates a complete job in under 3 minutes (timed in 1J).

### S6. Job detail (hub)
- Header: client, claim ref, type, status chip, assessor, attempt counter.
- Tabs: Overview (details + event timeline), Appointments (history + reschedule/
  no-show actions), Checklist (read-only completeness), Evidence (→S13),
  Report (→S15/16). Context actions per status incl. Cancel.
- Done when: every flow in doc 02 can be driven from here.

### S7. Scheduling
- Date/time picker + duration (default 45 min geyser / 20 min accidental), generates
  link, shows paste-ready SMS/email text with Copy buttons. Reschedule keeps history
  and shows "Link v2 active — v1 invalidated".
- Done when: link round-trip works (schedule → open link on a phone → correct job).

### S8. Client landing page
- Branding placeholder, assessor name, appointment time, "what you'll need" (from
  template), "I'm ready — continue" + "I can't make it". Early → countdown;
  expired/invalid → polite message + "request new link" (flags coordinator).
- Done when: loads fast on 4G, readable at 360 px, zero jargon (copy review).

### S9. Consent placeholder
- Placeholder consent text (marked DRAFT — production wording later), typed name,
  "I agree" (logged with timestamp + link token), decline path with human handoff
  message.
- Done when: consent event appears in the job event log; decline notifies assessor
  view.

### S10. Camera/mic check
- Camera preview → "switch to back camera" test → mic level bar → torch test where
  supported ("skip" if not). One instruction at a time, big buttons; each fail state
  has one plain fix + fallback message.
- Done when: passes on iOS Safari and Android Chrome test devices (spike-informed).

### S11. Waiting room
- "Thanks [name] — [assessor] will let you in shortly." Keeps screen awake, shows
  connection state, notifies the assessor of arrival.
- Done when: assessor sees arrival within 2 s and admits with one click.

### S12. Live assessment room — full spec in doc 04
- Done when: doc 04 spec passes its own checklist, capture loop <3 s / <1 s
  thumbnail, on both test phones.

### S13. Evidence gallery
- Grid grouped by checklist section; unfiled captures pinned to top for filing.
  Per item: full-size view, relabel, refile, note, discard (reason, soft delete),
  feature-for-report toggle, drag order. Missing panel with per-item reasons →
  "Create upload request".
- Done when: 30 captures from a session can be triaged in under 5 minutes.

### S14. Missing evidence upload page (client)
- Item list with plain-language names and per-item upload buttons (camera or
  gallery/file); progress + tick per item; "Done" confirmation. Works on 360 px,
  mobile data, no account.
- Done when: an uploaded plumber-invoice photo lands tagged to the right checklist
  item, flagged "client upload".

### S15. Report builder
- Left: report sections pre-filled from template + answers + notes + featured
  evidence; right: live preview. Editable narrative sections; auto-included
  non-removable Limitations & outstanding items. Save draft / Generate PDF /
  Submit for review. Returned mode shows manager comments inline.
- Done when: a submitted geyser report matches the doc 06 structure with zero manual
  re-typing of checklist data.

### S16. Completed report page
- Final PDF inline view + download; evidence pack download; version list (v1
  returned, v2 approved); "reopen" (manager only, reason logged).
- Done when: approve → files generated and downloadable; report locked from editing.
