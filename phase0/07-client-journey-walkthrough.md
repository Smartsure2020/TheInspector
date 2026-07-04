# 07 — Client Journey Walkthrough (Insured)

Design rule: the client journey must survive a stressed, non-technical person on a
mid-range Android phone in average signal. Every step below is measured against that
person, not against us.

## Visibility rule (absolute)

> The client must NEVER see: internal concern flags, assessor notes, checklist contents,
> claim-decision language, policy concerns, quantum commentary, other jobs, or any
> internal screen. The client sees only: their own camera, a small assessor
> thumbnail, the instruction banner, and simple controls.
> This rule is testable: every client-facing screen in the prototype gets reviewed
> against this list before Phase 1 sign-off.

## Step-by-step journey

### 1. Receives link
SMS (and email) from Acorn: assessor's name, appointment date/time, the link, and a
one-line prep list ("Please have access to the geyser and your plumber's invoice if
you have it"). Plain language, no jargon, no login instructions — because there is no
login.

### 2. Opens on phone
Tap link → lightweight page loads fast on mobile data. Shows: Acorn branding
(placeholder in prototype), assessor's name (and photo, pending decision), appointment
time, what to have ready. If early: friendly countdown. If the link is expired or
used: a polite message with "request a new link" that alerts the coordinator.

### 3. Confirms appointment
One button: **"I'm ready — continue"**. (Optional prototype extra: "I can't make it"
→ notifies the coordinator to reschedule; cheap to include, big no-show payoff.)

### 4. Accepts consent placeholder
One screen, plain language placeholder (final legal wording comes in production
hardening): who is on the call, that photos will be taken of what they show, that it
is used for their claim, and that they can ask questions at any time. Client types
their name and taps **"I agree"** (logged with timestamp). Decline path: "I don't
agree" → polite exit + assessor/coordinator notified → handled by a person.

### 5. Tests camera/mic
Camera preview ("Can you see yourself?"), tap to switch to rear camera ("Now show the
room"), mic level indicator ("Say hello"), torch button test where supported.
Big buttons, one instruction at a time. Fail states give one plain fix each ("Allow
camera access in the pop-up") and a fallback: "having trouble? — your assessor will
call you" (coordinator alerted).

### 6. Joins waiting room
"Thanks, [name]. [Assessor] will let you in shortly." Calm screen, no spinner
anxiety, keeps the device awake. Assessor is notified of the arrival.

### 7. Follows assessor prompts
In session: client sees their own camera view large (what they're showing), assessor
thumbnail small, and the **instruction banner** when the assessor pushes one
("Please show the bottom of the geyser"). Verbal guidance carries the session; the
banner reinforces. When the assessor captures a screenshot, a brief "photo taken ✓"
flash appears — transparency, courtesy, trust.

### 8. Switches rear camera / torch
Two persistent, obvious buttons: flip camera, torch on/off. The assessor can also
send a prompt ("Please switch to your back camera") that highlights the button rather
than switching remotely — the client stays in control of their own device.

### 9. Takes high-resolution photo when requested
When the assessor requests a photo, the client's screen changes to a full camera view
with one big capture button and the instruction ("Photograph the sticker with the
serial number — hold steady, fill the screen"). Tap → preview → "Use photo" or
"Retake" → uploads with a progress bar → back to the video automatically.

### 10. Uploads missing items if needed (after the session)
If anything was flagged missing, the client later receives a short link: a page
listing exactly what is needed ("1. Plumber's invoice — photo or PDF. 2. Photo of the
geyser sticker"), each with an upload button that works from camera or gallery. Tick
appears per completed item. No account, no app, works over mobile data.

### 11. Receives completion message
At session end, the client sees: "Thank you — your assessment is complete.
[Assessor] has everything needed / will send you a link for the remaining items.
The claims team will be in touch about next steps." SMS confirmation optional.
**No findings, no outcomes, no promises about the claim decision** — next steps only.

## Prototype usability test (Phase 1 gate)
Three non-technical testers (real people, not staff — family members count) receive
the SMS cold and must reach the waiting room **unaided in under 3 minutes**, then
complete a rear-camera switch and one high-res photo on request. Any step that needs
a hint gets redesigned.
