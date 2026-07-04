# 06 — Live Assessment UX Walkthrough (Assessor Journey)

The end-to-end journey the prototype must support, step by step. Workshop attendees
walk this on paper (Part 2); the Phase 1 prototype is then built to match, and
usability-tested against it.

## The one hard requirement (non-negotiable)

> **Capture loop:** select checklist item → one click or hotkey → auto-labelled
> evidence thumbnail → **no modal, no dialog, no confirmation** → assessor stays in
> the video, conversation never pauses.
>
> Target: under 3 seconds perceived, capture-to-thumbnail under 1 second.
> If the prototype cannot do this smoothly, the product thesis fails — everything
> else is secondary.

## Step-by-step journey

### 1. Open job
Assessor dashboard shows today's appointments in time order. Client-readiness
indicator per appointment (link opened? camera test passed? waiting?). One click on
the job opens the job hub: client details, claim summary, template preview, past
attempts. **"Join room"** button is the only primary action.

### 2. Start session
Assessor enters the room first; sees the client in the waiting room when they arrive;
admits with one click. Session timer starts. Opening script prompts appear as the
first checklist section (identity confirmation, consent acknowledged, address anchor).

### 3. Select checklist item
Checklist panel sits beside the video (right 40%). Current section expanded; tapping
an item makes it *active* — its prompt is highlighted and its client instruction is
ready to push. Free navigation: the assessor can jump to any section at any time; the
checklist tracks completeness, never sequence.

### 4. Guide client
Assessor speaks naturally; optionally pushes the item's instruction to the client's
screen banner ("Please show the bottom of the geyser") with one tap. Camera-flip and
torch prompts available as one-tap client-side requests.

### 5. Capture screenshot
The hard-requirement loop above. Frame grabbed from the client's video stream,
auto-labelled `{section} – {item} – {time}`, thumbnail drops into the capture tray at
the bottom. Soft shutter sound/flash as feedback. Multiple rapid captures allowed —
shoot now, prune later.
*Capture with no item selected is allowed:* it lands as "unfiled" for filing during
evidence review. (Workshop question W7 decides how prominent this mode must be.)

### 6. Request high-resolution photo
For plates, serials, documents: assessor taps **"Request photo"** on the active item →
client's screen shows a full-resolution camera view with a capture button → client
takes the photo → it uploads into the same evidence flow, tagged to the item and
marked "high-res client capture". Assessor sees the thumbnail arrive and verbally
confirms legibility before moving on.

### 7. Add note
Note icon on any checklist item opens an inline text field (not a modal) — type,
enter, done. General session notes live in a collapsible drawer. The **Concern flag**
toggle sits next to the note icon: one tap + optional short reason. ("Concern flag"
is the assessor-facing UI term; the templates keep the underlying red-flag concept.)
**Concern flags and notes are never visible to the client.**

### 8. Flag missing item
Any item: **"Can't capture now"** → pick a reason (not available / client can't
access / will upload later / other) → item turns amber and joins the missing list.
No interruption to the call.

### 9. Continue without breaking the call
Explicit design tests for the prototype:
- Relabelling/discarding a capture from the tray takes ≤2 taps and never covers the video.
- Answering a checklist question (yes/no/choice) is a single tap.
- If the client drops, the room holds; same link rejoins; nothing captured is lost.
- The assessor can scroll the checklist while video and audio continue uninterrupted.

### 10. End session
**"End session"** → summary interstitial (the one acceptable full-screen moment):
items complete / skipped / missing / flagged with concerns, capture count. Assessor confirms →
closing script reminder ("explain next steps to the client") → session ends, client
sees the completion message.

### 11. Review evidence
Evidence gallery (immediately after, or later from the job hub): grid grouped by
checklist section; unfiled captures highlighted first. Relabel, refile to another
item, discard (with reason), mark best shots as report-featured, drag order. Missing
list on the side → **"Send upload request"** builds the client upload link listing
exactly what's outstanding.

### 12. Generate report
Report builder: sections pre-filled from checklist answers, notes and featured
evidence in place. Assessor writes/edits narrative (circumstances, findings, cause,
conclusion, recommendation). Limitations & outstanding-evidence section auto-included
and non-removable. **"Generate"** produces the PDF + evidence pack; in the prototype,
"submit for review" simply moves it to the Manager–Reviewer role's queue.

## Prototype usability test (Phase 1 gate)
An assessor who has had a 15-minute intro runs a role-played geyser assessment
against a colleague on a phone and completes steps 1–12 **without facilitator help**.
Three assessors, three passes. Measure: total session time, capture-loop timings,
points of hesitation, and whether anyone reaches for WhatsApp instead.
