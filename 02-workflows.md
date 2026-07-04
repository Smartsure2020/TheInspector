# 02 — End-to-End Workflows

Claims assessment and risk survey are **separate workflows** sharing the same engine
(jobs, scheduling, sessions, evidence, reports). They differ in template, report
output and downstream audience. Never merge them into one generic flow in the UI.

---

## 2.1 Non-motor claims assessment (primary workflow)

**Trigger:** An assessor is appointed on a claim (instruction received from insurer /
claims team).

| # | Step | Actor | System behaviour |
|---|------|-------|------------------|
| 1 | Create job | Admin | Capture client, claim, policy/risk details; select claim type → template auto-attached. Status: **New** |
| 2 | Assign assessor | Admin (or manager) | Assessor notified; job appears in their dashboard. Status: **Assigned** |
| 3 | Schedule appointment | Assessor or Admin | Pick date/time; system generates a single-use, expiring client link. Status: **Scheduled** |
| 4 | Notify client | System | SMS + email with date/time, the link, what to prepare (documents, access to damaged area), and a device/connection tip sheet. Status: **Client notified** |
| 5 | Reminder | System | Reminder 24h and 1h before (Phase 4; manual resend in MVP). |
| 6 | Client joins | Client | Opens link → identity confirmation (name + claim ref shown) → **consent screen** → camera/mic test → waiting room. |
| 7 | Session starts | Assessor | Assessor admits client. Session record starts; consent event logged. Status: **In progress** |
| 8 | Guided capture | Assessor | Works through the checklist: instructs client what to show; captures labelled screenshots per item; records answers, notes, red flags; requests high-res photo capture from client device where needed; asks client to hold up documents to camera (or flags them for upload follow-up). |
| 9 | Wrap-up | Assessor | Reviews checklist completeness in-session; tells the client what happens next; ends session. |
| 10 | Post-session triage | Assessor | Evidence gallery review: relabel/discard bad frames, mark items complete or **missing**. If anything is missing → Status: **Awaiting evidence** (see 2.4). Else → **Awaiting report** |
| 11 | Build report | Assessor | Report builder pre-filled from checklist + evidence; assessor writes findings, conclusion and recommendation. Submits for review. Status: **Report submitted** |
| 12 | Review | Manager | Approve → **Report completed** (locked, PDF + evidence pack generated) or return → **Returned for correction** (back to step 11). |
| 13 | Release & close | Admin/Manager | Report + evidence pack delivered to the claims decision-maker (download/email in MVP). Status: **Closed** |

**Branch — physical assessment needed:** at any point the assessor can conclude the
matter cannot be resolved virtually (structural complexity, suspected fraud needing
physical inspection, client unable to participate). The job is marked
"recommend physical assessment" with reasons; the virtual evidence captured so far
still forms part of the file. The job closes with outcome = *escalated to physical*.

## 2.2 Risk survey

**Trigger:** Underwriting/renewal requests a survey of a residential or commercial risk.

Same steps 1–13 as above with these differences:

- Job type = **Survey**; template = residential or commercial survey framework
  (see doc 05). No claim details; instead **risk address, sum insured bands, occupancy
  and cover context**.
- The guided walk-through is a structured **property tour**: exterior, roofline (as
  visible), electrical DB board, geyser installation, kitchen, security features,
  fire protection, surroundings/exposures.
- The report is a **survey report with risk grading and recommendations** (requirements
  vs. improvements, each with a due timeline), not a claims conclusion.
- Reviewer may be an underwriting reviewer rather than an assessing manager (same role
  mechanics, different person).
- Surveys are less time-critical: scheduling windows are wider, reminders matter more.

## 2.3 Missed appointment / no-show

**Trigger:** Client does not join within the grace period (suggest 15 minutes), or
cancels late, or joins but cannot proceed (no signal, wrong person, unsafe conditions).

1. Assessor waits the grace period in the room; system shows elapsed time.
2. Assessor (or admin) marks the appointment **No-show** with a reason code:
   *did not join / joined but failed tech check / cancelled late / wrong contact
   details / other*.
3. Job status → **No-show**. The appointment record is kept (attempt #1) — attempts
   are auditable and reportable.
4. System prompts the reschedule path immediately: admin/assessor books attempt #2;
   a fresh link is issued (old link invalidated); client re-notified. Status returns
   to **Scheduled**.
5. After a configurable number of failed attempts (suggest 2–3), the job is flagged
   **Client non-cooperation** for the claims team to handle outside the tool
   (letter of demand for cooperation, physical visit, or repudiation consideration).
   The attempt history and notification log are part of the audit trail — this is
   valuable evidence of the insurer's reasonable attempts.

## 2.4 Missing evidence follow-up

**Trigger:** During post-session triage (or manager review) one or more checklist items
are marked *missing/unresolved* — e.g. plumber's invoice not yet available, SAPS case
number pending, an area couldn't be shown.

1. Assessor flags each missing item with a reason and what is needed
   ("upload plumber invoice", "show geyser rating plate — was inaccessible").
2. Job status → **Awaiting evidence**. The dashboard ages these jobs visibly.
3. System generates a **follow-up link** for the client. Two modes:
   - **Upload mode** (documents/photos): client opens the link, sees a short list of
     exactly what is needed, uploads from their phone. No call required.
   - **Mini-session mode**: a short scheduled video call covering only the flagged
     items (same room, filtered checklist showing only outstanding items).
4. Uploaded items land in the evidence gallery tagged to their checklist items,
   flagged "post-session upload" (provenance matters for audit).
5. Assessor verifies, marks items resolved. When all flags clear → **Awaiting report**.
6. If evidence never arrives (configurable chase cadence, then cutoff), the assessor
   completes the report noting the outstanding items and their impact on the
   assessment — the report template must support an "outstanding evidence" section.

## 2.5 Report review and completion

1. Assessor submits report → **Report submitted**; it appears in the manager's
   review queue (oldest first, SLA age shown).
2. Manager reviews: report text, checklist responses, every evidence item inline,
   red flags raised, outstanding-evidence notes.
3. Outcomes:
   - **Approve** → report version locked; final PDF and evidence pack generated and
     stored immutably; status **Report completed**; audit event recorded (who, when).
   - **Return for correction** → structured comments (per section/item); status
     **Returned for correction**; assessor notified; resubmission creates version n+1.
     Prior versions retained.
4. Release: admin/manager downloads or emails the report + evidence pack to the
   claims handler / underwriter. Status **Closed**. Closed jobs are read-only for
   everyone; only audit-logged administrative reopening is possible (manager only,
   with reason).

**Cancellation:** at any pre-completion stage a job can be **Cancelled** (claim
withdrawn, settled without assessment, duplicate). Reason mandatory; evidence captured
to date is retained per the retention policy.
