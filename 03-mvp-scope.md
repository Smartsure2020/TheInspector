# 03 — MVP Scope & Out of Scope

## 3.1 MVP definition

The MVP is the smallest version with which a real assessor can run a real virtual
assessment end to end — from job creation to an approved PDF report with a labelled
evidence pack — reliably enough to use on live claims. Nothing more.

**In scope:**

| # | Capability | MVP depth |
|---|-----------|-----------|
| 1 | Login & role-based access | Email/password + MFA for staff. Roles: Admin, Assessor, Manager. Clients never log in. |
| 2 | Assessment job creation | Single form: client, claim, policy/risk details, claim type (selects template), job type (assessment vs survey). |
| 3 | Assessor assignment | Admin assigns from user list; assessor sees jobs on their dashboard. No auto-routing. |
| 4 | Scheduling | Manual date/time pick; one active appointment per job; reschedule with reason. No calendar sync. |
| 5 | Client link, no login | Single-use tokenized URL, expires after the appointment window; re-issuable. Delivered by email + SMS (manual resend available). |
| 6 | Consent screen | Plain-language consent (recording/capture, POPIA notice); client must tick + confirm name; consent event stored with timestamp/IP. Decline path ends the session gracefully and notifies the assessor. |
| 7 | Camera/mic test | Pre-join device check: camera preview, mic level, connection quality hint; front/rear camera switch verified here. |
| 8 | Live assessment room | Browser-based (desktop for assessor, mobile browser for client). Two-way audio/video. Assessor sees checklist panel; client sees only video + simple instruction banner. |
| 9 | Guided checklist | Template loaded per claim type. Items grouped in sections; each item: prompt text, answer field (yes/no/choice/text/number), evidence-required flag, notes, red-flag toggle, skip-with-reason. |
| 10 | Labelled screenshot/photo capture | One-click frame capture from the client's video, auto-tagged to the active checklist item + timestamp; optional "request high-res photo" that triggers a capture/upload on the client's device. |
| 11 | Notes | Free-text notes per checklist item + general session notes. |
| 12 | Missing evidence flags | Any item markable as missing with reason; drives Awaiting-evidence status and the follow-up upload link. |
| 13 | Evidence gallery | Per-job gallery: thumbnail grid, filter by checklist section, edit label, discard (soft-delete, audited), reorder for the report. |
| 14 | PDF report generation | Report builder pre-filled from template + answers + evidence; assessor edits findings/conclusion; output = branded PDF. One layout per job type (assessment, survey). |
| 15 | Evidence pack | ZIP (or appendix PDF) of all evidence images with label, timestamp, checklist reference and index sheet. |
| 16 | Basic audit trail | Append-only log: job events, status changes, link issue/open, consent, session start/end, captures, edits, report versions, approvals, downloads. Viewable per job by Manager/Admin. |
| 17 | Basic dashboard | Admin: pipeline by status with ageing. Assessor: my jobs today/this week. Manager: review queue. Counts only — no charts needed. |

**MVP also includes (implied, easy to forget):**
- Follow-up **upload link** for missing evidence (workflow 2.4 upload mode).
- **No-show marking + reschedule** (workflow 2.3) — this happens from week one.
- Manager **approve / return-for-correction** with comments (workflow 2.5).
- Job **cancellation** with reason.
- Seed **templates** for the six claim types + two survey types (doc 04/05), loaded
  as data, editable only by developers/config in MVP (no template builder UI).

## 3.2 Explicitly OUT of scope for MVP

| Excluded | Why / when |
|----------|------------|
| AI damage estimation, image analysis, auto-transcription | Unproven value until evidence pipeline is solid. Phase 5 candidate. |
| Automatic claim approval / settlement recommendations logic | The Inspector informs decisions; it must not make them. Possibly never. |
| Integrations with any insurer/broker/claims systems (incl. all existing Acorn tools) | Standalone by mandate. Revisit after MVP proves the workflow. Design the API cleanly so this is possible later. |
| Full client portal (claim tracking, history, messaging) | Client touchpoints stay: notification → join link → follow-up upload link. Nothing else. |
| Native mobile app (assessor or client) | Mobile web must be good enough; an app is a maintenance tax. Reassess Phase 5. |
| Advanced analytics / BI dashboards | Counts and queues only in MVP. Phase 4 adds operational dashboards; BI later. |
| Payment workflows (assessor fees, invoicing) | Different problem. Keep out. |
| Template builder UI | Templates ship as configuration. A drag-and-drop builder is a project in itself; only build once template churn proves the need (Phase 3 gets a simple admin editor at most). |
| Full session video recording | Storage, cost, POPIA and review burden are large. MVP records *screenshots + structured data + audit log*, not continuous video. Revisit as an option per-job in Phase 5. (Decision point — see doc 12.) |
| Calendar sync (Outlook/Google), availability engines | Manual scheduling first. |
| WhatsApp Business channel | Attractive in SA but requires BSP setup and template approval; MVP uses SMS + email. Phase 4. |
| Multi-language client UI | English first; Afrikaans/isiZulu etc. once flows stabilise. |
| Offline capture / poor-connectivity fallback modes | Note as risk (doc 12); MVP requires a live connection. |
| E-signature on reports by insured | Not needed — the insured doesn't sign assessment reports. Assessor/manager sign-off is internal. |
| Client-side identity verification (ID document OCR, face match) | Assessor verbally confirms identity on camera; capture of ID shown on camera is a checklist item where relevant. |

**Guardrail:** any feature request during the build gets tested against one question —
*"does an assessor need this to complete one real assessment end to end?"* If not, it
goes to the Phase 3+ backlog.
