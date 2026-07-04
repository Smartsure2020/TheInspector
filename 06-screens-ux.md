# 06 — Screen List & UX Requirements

Design north star: **during a live session the assessor's hands stay on the
conversation, not the software.** Every capture action must be ≤ 2 clicks, and nothing
the assessor does may interrupt the video or make the client wait.

## Screen inventory

### S1. Login (staff only)
- Email + password + MFA. Password reset. No client-facing login exists anywhere.
- Post-login routing by role: Admin → S2, Assessor → S3, Manager → S12.

### S2. Admin dashboard
- Pipeline board/table: jobs grouped by status with counts and ageing (days in status).
- Exception strips at top: **Unassigned**, **Unscheduled**, **No-shows to reschedule**,
  **Awaiting evidence > 3 days**, **Awaiting report > 3 days**.
- Filters: job type (assessment/survey), assessor, claim type, date range. Search by
  client name / claim number.
- Row click → S5 Assessment detail. Primary button: **+ New job** → S4.

### S3. Assessor dashboard
- "Today" strip: today's appointments in time order with **Join room** buttons and
  client-readiness indicator (link opened? device test passed? in waiting room?).
- "My jobs" list grouped by actionable state: to schedule / upcoming / awaiting
  evidence (with what's outstanding) / reports to write / returned for correction.
- Deliberately minimal — an assessor should know their next action within 5 seconds.

### S4. Create assessment job
- One page, four blocks: **Client** (name, contact number, email, preferred language),
  **Claim** (claim number, insurer/broker reference, claim type → template picker,
  date of loss, loss description), **Policy/Risk** (policy number, risk address,
  relevant sums insured, special conditions/warranties to verify — free text in MVP),
  **Assignment** (job type: assessment/survey; assessor; priority; internal notes).
- Claim-type choice previews the template sections so admin can sanity-check fit.
- Save → status New/Assigned depending on whether assessor chosen.
- Survey jobs: claim block replaced by survey context block (reason for survey,
  underwriter requirements).

### S5. Assessment detail (the job hub)
- Header: client, claim number, claim type, status chip, assigned assessor, age.
- Tabs: **Overview** (details + timeline of events from audit trail), **Appointments**
  (history incl. no-shows, reschedule action), **Checklist** (read-only outside
  session; shows completeness), **Evidence** (→ S10), **Report** (→ S11/S13),
  **Audit** (manager/admin only).
- Context actions by status: Assign, Schedule, Send link, Mark no-show, Create
  follow-up link, Cancel job (reason).

### S6. Scheduling
- Simple date/time picker + duration (default 45 min assessment / 60 min survey) +
  assessor confirmation. Timezone fixed to SAST in MVP.
- On save: generates client link, queues notification (shows exactly what SMS/email
  the client will get, editable intro line), sets status Scheduled → Client notified
  on send.
- Reschedule keeps history; old link invalidated visibly ("Link v2 active").

### S7. Client join page (mobile-first, zero-login)
- Opens from SMS/email link. Shows: Acorn branding, assessor name and photo,
  appointment time, claim reference (partial), "what you'll need" list from template
  (e.g. "access to the geyser", "your plumber's invoice if you have it").
- Single button: **Continue**. If too early: shows countdown; if link
  expired/invalid: friendly message + "request new link" (notifies admin).
- Absolute requirements: works on iOS Safari + Android Chrome; total page weight
  small; large type; no jargon.

### S8. Consent screen (client)
- Plain-language: who is on the call, that photos/screenshots will be captured and
  stored for claim/survey purposes, POPIA processing notice, retention statement,
  right to decline (and what declining means for the process).
- Client types their full name + ticks consent → logged (timestamp, IP, link token).
- Decline path: polite exit + assessor/admin notified.

### S9a. Camera/mic test (client) → Waiting room
- Camera preview with front/rear switch test, mic level bar, connection quality
  indicator, torch toggle check where supported.
- Then waiting room: "Your assessor will let you in shortly", assessor notified of
  arrival. Client never sees the checklist, other jobs, or any internal data — ever.

### S9b. Live assessment room — **the most important screen**

**Assessor layout (desktop, three zones):**
- **Left 60%: client video** — large, this is what he's inspecting. Overlaid controls:
  capture button (also hotkey, e.g. spacebar), request-high-res-photo, ask-client-to-
  switch-camera prompt, torch request prompt, mute/cam, end session.
- **Right 40%: checklist panel** — current section expanded; each item shows prompt,
  answer control, captured-evidence thumbnails (count badge), notes icon, red-flag
  toggle, skip/missing action. Progress bar for the whole template. Free jump between
  sections.
- **Bottom strip: capture tray** — last 5 captures as thumbnails; click to relabel or
  discard instantly without leaving the flow.

**Capture interaction (the core loop, must be < 3 seconds):**
1. Assessor selects/has selected a checklist item (or none → capture goes to
   "unfiled" for later filing).
2. Presses capture → frame grabbed from client video → thumbnail appears in tray,
   auto-labelled `{section} – {item} – {timestamp}` → soft shutter confirmation.
3. Stays on the video. No modal, no dialog, no interruption. Relabelling is optional
   and deferred.

**Client layout (mobile):** their own camera view (what they're showing), tiny
assessor thumbnail, an **instruction banner** the assessor can push from checklist
prompts ("Please show the bottom of the geyser"), camera flip + torch buttons,
leave button. Nothing else. When the assessor captures, the client sees a brief
"photo taken" flash — transparency builds trust and is a consent courtesy.

**Resilience:** if the client drops, the room holds state and the same link rejoins;
captures and answers already taken are safe. Assessor sees connection quality of both
sides.

### S10. Evidence review (post-session)
- Grid gallery grouped by checklist section; unfiled captures highlighted for filing.
- Per item: view full size, edit label, reassign to another checklist item, add note,
  soft-delete with reason (audited), mark as "report-featured" and drag to order.
- Missing-evidence panel: outstanding items list → generate follow-up upload link
  (choose items to include) → link/message preview → send.
- Post-session uploads arrive here flagged "client upload" with received timestamp.

### S11. Report builder
- Left: report sections (from template) — pre-populated with checklist answers,
  notes, and featured evidence placed in context. Right: live PDF-style preview.
- Assessor edits narrative sections (circumstances, findings, cause, quantum comment,
  conclusion, recommendations). Auto-included and non-removable: limitations &
  outstanding evidence section, evidence index, consent/audit summary.
- Save draft anytime; **Submit for review** locks editing and notifies manager.
- Returned-for-correction mode shows manager comments inline next to sections.

### S12. Manager dashboard
- Review queue (oldest first, age badges) → opens report review view: report preview +
  checklist + evidence side by side, comment on any section, **Approve** or
  **Return with comments**.
- Team view: jobs by status per assessor, no-show counts, awaiting-evidence ageing.
  Counts and lists only in MVP — no charts.

### S13. Completed report page
- Locked final report: view PDF inline, download PDF, download evidence pack,
  email to a recipient (logged). Version history (v1 returned, v2 approved…).
- Immutable: any post-approval change requires manager reopen (audited, creates new
  version).

## Cross-cutting UX requirements
- Every status change and destructive action confirms with one click max and is
  reversible where possible (soft-delete pattern).
- All staff screens usable on a laptop at 1366×768 (assessors' field laptops);
  client screens designed at 360px width first.
- Empty states teach: a new assessor should learn the flow from the screens alone.
- Latency budget: capture-to-thumbnail < 1s perceived; room join < 5s on 4G.
- Language: client-facing copy at plain-language reading level, no insurance jargon.
