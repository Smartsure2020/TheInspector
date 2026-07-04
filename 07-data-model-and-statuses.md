# 07 — Data Model & Workflow Statuses

## 7.1 Core entities

Relational model (PostgreSQL assumed — see doc 10). All tables get `id` (uuid),
`created_at`, `updated_at`; soft-delete (`deleted_at`) on user-visible content.

### users
Staff only (clients are NOT users).
- `email` (unique), `password_hash` (or IdP subject), `mfa_enabled`
- `full_name`, `phone`, `title` (shown on client join page), `photo_url`
- `role` → roles; `active` (bool); `last_login_at`

### roles
- `name`: `admin` | `assessor` | `manager` (MVP fixed set; `surveyor` is the assessor
  role on survey jobs, not a separate role)
- `permissions` (json) — keep simple; enforce in code by role name in MVP.

### clients
The insured. Deliberately minimal (POPIA data-minimisation).
- `full_name`, `phone`, `email`, `preferred_language`
- `id_verified_in_session` (bool, set by assessor) — do NOT store ID numbers unless a
  concrete need is confirmed (doc 09).

### assessment_jobs
The central entity.
- `job_number` (human ref, e.g. INS-2026-00123), `job_type`: `assessment` | `survey`
- `client_id` → clients; `claim_detail_id` → claim_details (null for surveys)
- `risk_address` (street, suburb, city, province, geolocation optional)
- `template_id` → checklists (the template version attached at creation — pinning the
  version keeps completed jobs stable when templates evolve)
- `assigned_assessor_id` → users; `status` (see 7.2); `priority`
- `outcome`: `completed` | `escalated_to_physical` | `client_non_cooperation` |
  `cancelled` (set at closure); `outcome_reason`
- `internal_notes`; `special_conditions_to_verify` (text — policy warranties the
  assessor must check)

### claim_details
- `job_id` → assessment_jobs (1:1)
- `claim_number`, `insurer_reference`, `broker_reference`
- `claim_type`: geyser_water | storm | theft | fire | accidental | general
- `date_of_loss`, `date_reported`, `loss_description`
- `policy_number`, `policy_inception_date` (red-flag context), `sums_insured_summary`
  (text/json in MVP — no policy engine)

### appointments
Multiple per job (attempts are history, never overwritten).
- `job_id`, `attempt_number`, `scheduled_start`, `duration_minutes`
- `status`: `scheduled` | `completed` | `no_show` | `cancelled` | `rescheduled`
- `no_show_reason` (enum per workflow 2.3), `rescheduled_to` → appointments
- `client_link_id` → client_links

### client_links
Every URL a client ever receives — single-use, expiring, auditable.
- `job_id`, `appointment_id` (nullable for follow-up upload links)
- `purpose`: `join_session` | `evidence_upload`
- `token_hash` (store hash, not the token), `expires_at`, `max_uses`
- `first_opened_at`, `opened_count`, `revoked_at`, `revoked_reason`
- `scope` (json — for upload links: which checklist items are requested)

### assessment_sessions
One per actual live session (a job can have several: initial + mini-sessions).
- `job_id`, `appointment_id`, `assessor_id`
- `started_at`, `ended_at`, `client_joined_at`, `client_left_at`
- `consent_id` → consents; `connection_quality_notes`
- `video_provider_session_ref` (provider room id for reconciliation/billing)

### consents
- `session_id` (or `client_link_id` for upload consents), `client_name_entered`
- `consent_text_version` (points at the exact wording shown), `accepted_at`,
  `ip_address`, `user_agent`
- Never deleted; retained past evidence retention (proof of lawful processing).

### evidence_items
The heart of the system.
- `job_id`, `session_id` (nullable — uploads have no session), `checklist_item_id`
  (nullable = unfiled), `captured_by` → users (null for client uploads)
- `kind`: `frame_capture` | `client_photo_upload` | `document_upload`
- `file_key` (object storage), `thumb_key`, `mime_type`, `byte_size`
- `label` (auto-generated, editable), `note`
- `captured_at` (authoritative server timestamp), `client_device_time` (if available)
- `sha256` (integrity hash computed at ingest), `original_metadata` (json — EXIF etc.
  for uploads)
- `is_featured` (report inclusion), `sort_order`, `discarded_at` + `discard_reason`

### checklists  (templates)
- `name`, `job_type`, `claim_type` (nullable for surveys), `version`, `is_active`
- `structure` (json): sections → items with `prompt`, `answer_type`, `options`,
  `evidence_required`, `min_captures`, `allow_skip`, `red_flag_capable`,
  `client_instruction_text` (what gets pushed to the client banner)
- Versioning: publishing a change creates version n+1; existing jobs keep their
  pinned version.

### checklist_responses
- `job_id`, `checklist_item_ref` (section+item key within the pinned template version)
- `answer_value` (json), `note`, `red_flag` (bool) + `red_flag_note`
- `state`: `pending` | `answered` | `skipped` | `missing` | `resolved`
- `missing_reason`, `answered_in_session_id`, `answered_by`

### reports
- `job_id`, `version`, `status`: `draft` | `submitted` | `returned` | `approved`
- `content` (json per section: narrative text + evidence refs), `pdf_key` (generated
  file), `evidence_pack_key`
- `submitted_at/by`, `reviewed_at/by`, `review_comments` (json, per section)
- Approved versions immutable; new edits create the next version.

### audit_logs
Append-only. No updates, no deletes, ever.
- `job_id` (nullable for system events), `actor_type`: `user` | `client_link` |
  `system`; `actor_id`
- `event_type` (enum: job_created, status_changed, link_issued, link_opened,
  consent_accepted, session_started, evidence_captured, evidence_relabelled,
  evidence_discarded, response_recorded, report_submitted, report_returned,
  report_approved, report_downloaded, pack_downloaded, job_reopened, …)
- `event_data` (json diff/context), `occurred_at`, `ip_address`

### notifications
- `job_id`, `recipient_type`: `client` | `user`; `recipient_ref`
- `channel`: `sms` | `email`; `template_key`, `rendered_body_key` (what was actually
  sent — evidential value for no-show disputes)
- `status`: `queued` | `sent` | `delivered` | `failed`; `provider_message_id`,
  `sent_at`, `failure_reason`

## 7.2 Workflow statuses (assessment_jobs.status)

| Status | Meaning | Enters from | Exits to |
|--------|---------|-------------|----------|
| **New** | Job created, no assessor | — | Assigned, Cancelled |
| **Assigned** | Assessor allocated | New | Scheduled, Cancelled |
| **Scheduled** | Appointment booked, link generated | Assigned, No-show, Client notified (resched) | Client notified, No-show, Cancelled |
| **Client notified** | Link + confirmation sent | Scheduled | In progress, No-show, Scheduled (resched), Cancelled |
| **In progress** | Live session running | Client notified | Awaiting evidence, Awaiting report |
| **No-show** | Attempt failed (reason coded) | Scheduled, Client notified | Scheduled (new attempt), Closed (non-cooperation), Cancelled |
| **Awaiting evidence** | Session done, flagged items outstanding | In progress, Awaiting report (reviewer found gap) | Awaiting report, Cancelled |
| **Awaiting report** | Evidence complete, report not submitted | In progress, Awaiting evidence, Returned for correction | Report submitted |
| **Report submitted** | In manager review queue | Awaiting report | Report completed, Returned for correction |
| **Returned for correction** | Manager sent back with comments | Report submitted | Awaiting report (assessor revising) |
| **Report completed** | Approved & locked; PDF + pack generated | Report submitted | Closed |
| **Closed** | Delivered/filed; read-only | Report completed, No-show (non-cooperation) | (reopen: manager only, audited) |
| **Cancelled** | Job terminated pre-completion, reason mandatory | any pre-completion status | — |

Rules:
- Status transitions only via defined edges; every transition writes an audit event.
- Dashboards are driven purely off status + timestamps (age-in-status), so keep the
  set small and unambiguous — resist adding statuses that are really just flags
  (e.g. "priority" is a field, not a status).
