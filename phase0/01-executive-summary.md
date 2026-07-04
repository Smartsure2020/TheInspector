# 01 — Executive Summary (one page)

**Project codename:** The Inspector *(working name only — final branding to be decided)*
**Sponsor:** Acorn | **Status:** Phase 0 — validation before any build

## What it is

An Acorn-owned digital platform for **virtual non-motor claims assessments and risk
surveys**. An appointed assessor schedules a video session with the insured, who joins
from their phone via a simple link — no app, no account. The assessor guides the
insured through a claim-type-specific checklist, capturing **labelled screenshots and
high-resolution photos at each required point**, records structured answers and notes,
flags anything missing, and generates a professional report with a complete evidence
pack.

It is **not a video meeting tool**. The video call is one step inside a controlled
evidence-capture workflow. The product is structured, labelled, auditable evidence.

## What problem it solves

- Replaces the discontinued dependence on a third-party tool (theinspector.co.za)
  with a platform Acorn owns and controls.
- Cuts travel cost and turnaround time on claims that can be validated remotely
  (geyser/water, storm, theft verification, accidental damage, contents).
- Ends unstructured evidence — unlabelled WhatsApp photos scattered across inboxes —
  in favour of evidence tied to checklist items with timestamps and labels.
- Enforces a consistent minimum standard per claim type via guided checklists.
- Generates the report from data captured during the session instead of late-night
  re-typing.

## Who uses it

| User | Access in prototype |
|------|--------------------|
| Assessor / Surveyor | Placeholder role — runs sessions, captures evidence, writes reports |
| Insured client | Simple assessment link on their phone — never logs in, never sees internal notes |
| Admin / Coordinator | Placeholder role — creates jobs, schedules, sends links |
| Manager / Reviewer | Placeholder role — reviews and approves reports |

Real authentication, MFA, permissions and full POPIA implementation are **deliberately
deferred to production hardening** — documented, not forgotten, but not allowed to
slow workflow validation.

## What the first working prototype must prove

1. **The capture loop works at conversation speed** — select checklist item → one
   click → auto-labelled evidence thumbnail → assessor never leaves the video.
2. **A real assessor can complete a realistic assessment end to end** — job →
   schedule → session → checklist → evidence → report → evidence pack — without a
   facilitator.
3. **A non-technical insured can join unaided** from an SMS/email link on an ordinary
   phone: confirm appointment, accept the consent placeholder, pass the camera check,
   follow prompts, switch to rear camera, provide a high-res photo on request.
4. **The templates match reality** — validated by working assessors against
   historical claim files before anything is built.
5. **The report is credible** — a claims handler would accept the prototype report
   and evidence pack without reformatting.

## What happens next

Phase 0 (this pack): assessor workshop, template validation, management decisions,
exit-criteria check. Then Phase 1: workflow prototype build against the revised scope —
still no production security, one goal: prove the workflow.
