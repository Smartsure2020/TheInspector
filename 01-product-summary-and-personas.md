# 01 — Product Summary & User Personas

## 1. Product summary

### What The Inspector is

The Inspector is a web-based platform for conducting **virtual non-motor insurance
claims assessments and risk surveys**. It lets an appointed assessor or surveyor:

1. Receive a job (claim assessment or risk survey) with client, claim and policy details.
2. Schedule a virtual appointment with the insured.
3. Send the insured a simple link — no app, no account, no password.
4. Conduct a live video session in which the assessor **guides** the insured to show
   specific areas, items and documents.
5. Capture screenshots/photos at each required point, **labelled and tied to a
   checklist item** at the moment of capture.
6. Record structured answers, notes and red flags against a claim-type-specific checklist.
7. Flag missing evidence and follow up without a repeat full appointment.
8. Generate a professional PDF report plus a complete, auditable evidence pack.

The unit of work is the **assessment job**, not the meeting. The video call is one step
inside a controlled workflow that starts at appointment and ends at a signed-off report.

### What problem it solves

- **Dependency on a third-party tool** (theinspector.co.za) that is no longer suitable —
  Acorn has no control over features, data, branding, cost or continuity.
- **Travel cost and turnaround time** of physical assessments for claims that can be
  validated remotely (geysers, storm damage, theft scene verification, contents, etc.).
- **Unstructured evidence**: WhatsApp photos, emailed pictures and ad-hoc video calls
  produce evidence that is unlabelled, unverifiable, scattered across inboxes and
  useless in a dispute.
- **Inconsistent assessments**: quality depends entirely on the individual assessor's
  memory of what to check. A checklist-driven flow enforces a minimum standard per
  claim type.
- **Slow reporting**: assessors re-type findings into Word templates. The Inspector
  generates the report from data already captured during the session.
- **Weak audit trail**: today it is hard to prove what the insured showed, when, and
  that they consented. The Inspector timestamps and logs everything.

### Who it is for

- Acorn's internal and panel **assessors and surveyors** (primary daily users).
- **Insured clients** who join a session once via a link (zero-friction participants).
- **Admin/claims coordinators** who create jobs, assign assessors and chase schedules.
- **Managers/reviewers** who QA reports before release and monitor throughput.

### Why Acorn should build it

- **Control**: own the workflow, templates, data, and branding end to end.
- **Cost**: a virtual-first assessment triages which claims genuinely need a physical
  visit; each avoided visit saves travel time and money.
- **Speed**: same-day or next-day assessments become possible; faster claims decisions
  improve client experience and reduce claim leakage from delays.
- **Defensibility**: structured, timestamped, consented evidence strengthens Acorn's
  position on repudiations and disputes.
- **Reusability**: the same engine serves claims assessment AND pre-inception /
  renewal risk surveys — two business functions, one platform.

### What success looks like

Measurable, 6–12 months after MVP launch:

- ≥ 60% of eligible non-motor claims assessed virtually instead of (or before) a
  physical visit.
- Average time from assessor assignment → completed report reduced to ≤ 3 working days.
- ≥ 90% of virtual sessions produce a complete evidence set (no missing-evidence
  follow-up needed) by month 6, as templates mature.
- Reports pass manager review first time ≥ 80% of the time.
- Assessors choose to use it without being forced (session count per assessor grows).
- Zero evidence-integrity challenges lost due to missing consent/audit records.

---

## 2. User personas

### Persona A — Assessor / Surveyor ("Sipho", 15 years in loss adjusting)

Works claims in the field and remotely. Handles 5–15 active jobs at a time. Technically
competent but impatient with software; on the road half the day, often on a laptop with
mobile data.

**Goals**
- Get through assessments quickly without missing anything the insurer will ask about.
- Capture evidence that stands up if the claim is disputed.
- Produce the report with minimal re-typing.
- Keep control of the conversation with the insured — the tool must follow him, not
  the other way around.

**Frustrations (today)**
- Insureds who can't work out how to join a call or share photos.
- Evidence arriving as 40 unlabelled WhatsApp images he must sort and rename.
- Writing reports at 9pm from memory and scribbled notes.
- Being blamed for gaps ("why didn't you photograph the geyser plate?") with no
  checklist to prove what was and wasn't accessible.
- Rescheduling no-shows by phone tag.

**Required features**
- Today/this-week job list with statuses at a glance.
- One-tap capture during the live session: click → screenshot → auto-labelled from the
  current checklist item → next.
- Checklist visible only to him, alongside the video, with progress indicator.
- Quick notes (typed or short dictation later) attached to checklist items.
- "Mark as unavailable / flag missing" on any checklist item, with reason.
- Report pre-populated from checklist answers, notes and evidence.
- Ability to run the session from a laptop on average bandwidth.

### Persona B — Insured / Client ("Mrs Naidoo", claiming for a burst geyser)

Stressed, possibly dealing with water damage right now. Any age, any tech ability.
Joins exactly once, from a phone. Must never need to install anything or create an
account.

**Goals**
- Get the claim moving as fast as possible.
- Understand what she must show and why.
- Feel the process is fair and professional.

**Frustrations (today)**
- Waiting days for someone to come out.
- Being asked repeatedly for the same photos by different people.
- Not knowing what's happening with her claim.
- Confusing apps and logins.

**Required features**
- SMS/email link → tap → consent → camera check → in the session. Nothing else.
- Works in the phone browser (iOS Safari and Android Chrome) — no app install.
- Clear consent screen in plain language before anything is recorded/captured.
- On-screen guidance ("please show the bottom of the geyser") driven by the assessor.
- Ability to switch to the rear camera and turn on the torch/flashlight.
- A polite waiting room if she joins early; a reschedule path if she can't make it.

### Persona C — Admin / Claims Coordinator ("Lerato", claims operations)

Creates jobs from incoming assessor appointments, assigns assessors, keeps the pipeline
moving. Lives in the dashboard all day. Success measured in turnaround times and
nothing falling through the cracks.

**Goals**
- Capture a new job in under 3 minutes from an appointment instruction.
- See instantly which jobs are stuck (unscheduled, no-show, awaiting evidence,
  awaiting report).
- Handle client communication (links, reminders, reschedules) without leaving the tool.

**Frustrations (today)**
- Chasing assessors by phone/email for status.
- Re-typing the same client details in multiple places.
- No single view of the assessment pipeline.
- Finding out about no-shows days later.

**Required features**
- Job creation form with claim/policy/client details and claim-type template selection.
- Assignment to an assessor with visibility of their current load.
- Scheduling on behalf of assessors, with automatic client link + confirmation message.
- Pipeline dashboard filtered by status, age, assessor.
- Resend/regenerate client links; trigger reminders; record no-shows and reschedules.
- Exception queues: overdue, no-show, awaiting evidence > X days.

### Persona D — Manager / Reviewer ("Craig", assessing services manager)

Accountable for report quality and throughput. Reviews and signs off reports before
they are released to the claims decision-maker. Also monitors workload and template
effectiveness.

**Goals**
- Release only reports that are complete, consistent and defensible.
- Spot problem patterns (assessor gaps, template gaps, fraud indicators) early.
- Balance workload across assessors.

**Frustrations (today)**
- Reviewing Word documents with evidence in separate email attachments.
- No way to see *how* a conclusion was reached (what was shown, what was skipped).
- Corrections handled by email ping-pong.

**Required features**
- Review queue of reports awaiting sign-off.
- Report view with checklist responses and evidence inline — click any photo to see
  its label, timestamp and which checklist item it satisfies.
- Return-for-correction with structured comments attached to specific sections.
- Approve/release action that locks the report (immutable version).
- Basic team dashboard: jobs per status, per assessor, ageing, no-show rate,
  missing-evidence rate per template.
