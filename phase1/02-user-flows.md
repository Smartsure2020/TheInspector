# 02 — User Flows to Build

Seven flows. Each lists its steps, the screens used (S-numbers from doc 03), and the
status transitions it drives (doc 05). Together they cover every path in the Phase 1
acceptance tests.

## F1. Admin / Coordinator flow

1. Enter as Admin via role picker (S1).
2. Dashboard (S2): see pipeline by status, exception strips (unassigned, unscheduled,
   no-shows, awaiting evidence).
3. Create job (S5): client + claim + claim type (geyser or accidental) → template
   attached; assign assessor now or later. Status: **New → Assigned**.
4. Schedule (S7): pick date/time → system generates client link → copy link + a
   pre-written SMS/email text to send manually. Status: **Assigned → Scheduled**.
5. Monitor: reschedule, resend link (regenerates, old link dies), cancel job.

## F2. Assessor flow (the core)

1. Enter as Assessor (S1) → dashboard (S3): today's appointments with client-readiness
   indicator + "my jobs" by actionable state.
2. Open job (S6): review claim details, template preview, prior attempts.
3. Join room (S12) before the client; admit client from waiting room.
   Status: **Scheduled → In progress**.
4. Run the session per the live-room spec (doc 04): guide, capture, high-res
   requests, notes, concern flags, missing flags.
5. End session → summary interstitial → decides: all evidence in? 
   Status: **In progress → Awaiting report** (complete) or **→ Awaiting evidence**
   (missing items).
6. Evidence gallery (S13): file unfiled captures, relabel, discard, feature.
7. Report builder (S15): edit pre-filled report → generate PDF → submit.
   Status: **Awaiting report → Report submitted**.
8. If returned: revise per manager comments. **Returned for correction → Awaiting
   report → Report submitted**.

## F3. Client link flow (no login, phone-first)

1. Receives link (manually sent in Phase 1) → opens on phone (S8): appointment
   details, what to prepare, "I'm ready — continue" (+ "I can't make it" → flags
   coordinator).
2. Consent placeholder (S9): plain-language text, type name, "I agree" (logged).
   Decline → polite exit + coordinator/assessor flagged.
3. Camera/mic check (S10): preview, rear-camera switch test, mic level, torch test
   where supported. Fail states give one plain fix each.
4. Waiting room (S11) → admitted by assessor → in-session client view (S12-C):
   own camera large, instruction banner, flip/torch buttons, "photo taken ✓" flash
   on captures.
5. High-res photo on request: full camera view → capture → preview → use/retake →
   auto-return to video.
6. Session ends → completion message. No findings, no outcomes.

## F4. Manager / Reviewer flow

1. Enter as Manager (S1) → dashboard (S4): review queue oldest-first + team pipeline
   counts.
2. Open submitted report: report preview + checklist responses + evidence side by
   side.
3. Either **Approve** → PDF + evidence pack finalised, job **Report submitted →
   Report completed** (report locked; later edits would need a new version — 
   prototype allows manager "reopen" with a logged reason), or **Return with
   comments** (per-section comments) → **Returned for correction**.
4. Completed report page (S16): view/download PDF + evidence pack.

## F5. Missing-evidence follow-up flow

1. During session or gallery review, assessor flags items missing with reason.
   Job lands in **Awaiting evidence** after the session.
2. Gallery (S13) missing panel → "Create upload request": select outstanding items →
   system generates upload link + paste-ready message text.
3. Client opens upload page (S14): sees exactly what's needed, item by item; uploads
   photos/PDFs from camera or gallery; per-item ticks. No account.
4. Uploads land in the gallery tagged to their checklist items, marked
   "client upload". Assessor verifies → marks items resolved.
5. All resolved → **Awaiting evidence → Awaiting report**. If evidence never comes,
   assessor proceeds to report; outstanding items auto-appear in the Limitations
   section.

## F6. No-show / reschedule flow

1. Client hasn't joined by grace period (15 min default, configurable constant).
   Room shows elapsed time to the assessor.
2. Assessor or admin marks **No-show** with reason code (did not join / failed tech
   check / cancelled late / wrong contact / other). Appointment record kept as
   attempt #n. Status: **Scheduled → No-show**.
3. Reschedule prompt immediately: new date/time → new link (old invalidated) →
   **No-show → Scheduled**. Attempt counter visible on the job.
4. After 3 failed attempts, job shows a "client non-cooperation" banner — admin
   decides cancel or keep trying (no automation in Phase 1).

## F7. Cancel job flow

1. From job detail (S6), Admin or Manager: **Cancel job** → mandatory reason
   (withdrawn / settled without assessment / duplicate / non-cooperation / other) →
   confirm.
2. Status: any pre-completion status **→ Cancelled**. Links invalidated. Evidence
   captured so far retained and viewable read-only.
3. Cancelled jobs drop out of active dashboards but remain findable via filter.

## Flow coverage check

Every acceptance criterion in doc 09 maps to at least one flow above; F2+F3 together
are the role-played assessment test; F5 is the missing-evidence test; F4 is the
approve/return test. F6/F7 have no acceptance test but are exercised at least once
during usability week (chunk 1J).
