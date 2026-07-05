# 05 — Prototype Data Model & Status Workflow

Simplified from the blueprint (parent doc 07) for prototype speed, but **shape-
compatible with production hardening**: UUID keys, server timestamps authoritative,
event log mirrors the future audit_logs schema, files behind one storage interface
with stable keys. What we skip: hashing, immutability enforcement, permission
scoping, retention fields. What we never skip: anything that would force a data
migration to harden later.

## 5.1 Tables (10)

### jobs
- `id` uuid · `job_number` (INS-YYYY-NNNN) · `job_type` = 'assessment' (fixed in P1)
- `claim_type`: 'geyser_water' | 'accidental' (others seed as reference templates only)
- `client_id` → clients · `assigned_assessor` (demo user name/id) · `priority`
- `claim_number`, `policy_number`, `date_of_loss`, `loss_description`,
  `special_conditions` (text)
- `template_id` + `template_version` (pinned at creation)
- `status` (see 5.3) · `outcome` ('completed'|'escalated_to_physical'|'cancelled'|null)
  + `outcome_reason` · `attempt_count`
- `created_at/updated_at`

### clients
- `id` · `full_name` · `phone` · `email` · `preferred_language`
- Deliberately nothing else (data-minimisation habit starts now). Role-play/anonymised
  data only in Phase 1.

### appointments
- `id` · `job_id` · `attempt_number` · `scheduled_start` · `duration_minutes`
- `status`: scheduled | completed | no_show | cancelled | rescheduled
- `no_show_reason` · `rescheduled_to` (self-ref)
- `link_token` (random, unique; **prototype stores plaintext + TODO-hash comment** —
  hashing is a Tier B swap, column named `link_token` now, `token_hash` migration
  later) · `link_expires_at` · `link_revoked_at`

### sessions
- `id` · `job_id` · `appointment_id` · `assessor` · `provider_room_ref`
- `started_at` · `ended_at` · `client_joined_at` · consent fields inline for
  prototype: `consent_name`, `consent_accepted_at`, `consent_text_version`
  (split into a consents table at hardening)
- `reconnect_count` · `notes` (general session notes)

### checklist_templates
- `id` · `name` · `claim_type` · `version` · `is_active` · `is_reference_only` (bool —
  true for storm/theft/fire/general)
- `structure` JSON: sections[] → items[] with `key`, `prompt`, `answer_type`
  (yes_no|choice|text|number|evidence_only), `options`, `evidence_required`,
  `allow_skip`, `concern_capable`, `client_instruction_text`
- Seeded from phase0 v0.2 sheets 1 (geyser) and 5 (accidental); loaded from JSON
  fixture files — editing = editing fixtures, no builder UI.

### checklist_responses
- `id` · `job_id` · `item_key` (section.item within pinned template version)
- `answer` JSON · `note` · `concern_flag` bool + `concern_note`
- `state`: pending | answered | skipped | missing | resolved
- `missing_reason` · `session_id` (where answered) · `updated_at`

### evidence_items
- `id` · `job_id` · `session_id` (null for uploads) · `item_key` (null = UNFILED)
- `kind`: frame_capture | highres_client_photo | client_upload
- `file_key` · `thumb_key` · `mime_type` · `byte_size`
- `label` (auto, editable) · `note` · `captured_at` (server) ·
  `is_featured` · `sort_order` · `discarded_at` + `discard_reason` (soft delete)
- Reserved-but-null in P1: `sha256`, `original_metadata` (columns exist so hardening
  is an UPDATE job, not a migration)

### reports
- `id` · `job_id` · `version` · `status`: draft | submitted | returned | approved
- `content` JSON (per-section narrative + featured evidence refs)
- `pdf_key` · `pack_key` · `submitted_at/by` · `reviewed_at/by`
- `review_comments` JSON (per-section)
- Prototype rule: approved report locks editing in the UI; DB-level immutability is
  Tier B.

### event_log
Append-only by convention (no update/delete code paths written).
- `id` · `job_id` · `actor` (demo user or 'client_link' or 'system') · `event_type`
  (same enum family as blueprint audit_logs: job_created, status_changed,
  link_issued, link_opened, consent_accepted, session_started, evidence_captured,
  evidence_discarded, response_recorded, report_submitted, report_returned,
  report_approved, upload_received, …)
- `data` JSON · `occurred_at` (server)
- Rendered as the job timeline on S6; becomes the audit substrate at hardening.

### client_upload_requests
- `id` · `job_id` · `link_token` · `expires_at` · `revoked_at`
- `requested_items` JSON (item_keys + plain-language names)
- `message_text` (the paste-ready text shown to admin/assessor)
- `completed_at` · per-item completion derived from evidence_items

## 5.2 Storage & infra notes (prototype)

- ~~Postgres from day one~~ **Amended during 1B (approved):** the prototype runs
  SQLite (better-sqlite3) because the dev machine has no Postgres/Docker and the
  demo must stay one-command. Schema is kept Postgres-portable (TEXT uuid PKs,
  ISO UTC timestamps, JSON-in-TEXT columns).
  **⚠ Migration to Postgres is REQUIRED before real-client shadow mode or any
  production hardening begins** — it is a gate item alongside the live-data
  safeguard gate (phase0 doc 10, D-09), not an optional improvement.
- Files via one `Storage` interface: local disk in dev, S3-compatible bucket for the
  shared prototype environment. Keys: `jobs/{job_id}/evidence/{evidence_id}.jpg` —
  stable forever.
- No queues; PDF generation synchronous or simple background task in-process.

## 5.3 Status workflow (jobs.status)

Exactly eleven statuses:

```
New → Assigned → Scheduled → In progress → Awaiting report → Report submitted → Report completed
                     │             │              ▲                  │
                     │             └→ Awaiting evidence ─┘           └→ Returned for correction
                     │                                                        │ (→ Awaiting report)
                     └→ No-show (→ Scheduled on reschedule)
Any pre-completion status → Cancelled
```

| Status | Set when |
|--------|----------|
| New | Job created, no assessor |
| Assigned | Assessor allocated |
| Scheduled | Appointment booked + link generated (covers "client notified" — link handover is manual in P1) |
| In progress | Assessor admits client / session starts |
| Awaiting evidence | Session ended with missing-flagged items |
| Awaiting report | Evidence complete, report not yet submitted |
| Report submitted | Assessor submitted; in manager queue |
| Returned for correction | Manager returned with comments |
| Report completed | Manager approved; PDF + pack generated; locked |
| Cancelled | Terminated pre-completion, reason mandatory |
| No-show | Attempt failed, reason coded |

Transitions only via defined edges; every transition writes a `status_changed` event.
No "Closed" status in the prototype — "Report completed" is terminal (Closed returns
at production when delivery workflows exist).
