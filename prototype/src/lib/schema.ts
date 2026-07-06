// Prototype schema (Chunk 1B) — mirrors phase1/05-data-model-and-statuses.md.
// SQLite for the single-machine prototype; kept Postgres-portable on purpose:
// TEXT uuid PKs, ISO-8601 UTC server timestamps, JSON stored in TEXT columns
// (become uuid/timestamptz/jsonb on the production port). Reserved hardening
// columns (sha256, original_metadata, token hashing) exist and stay empty.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','assessor','manager')),
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  language TEXT DEFAULT 'English',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checklist_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'assessment' CHECK (job_type IN ('assessment','survey')),
  version TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_reference_only INTEGER NOT NULL DEFAULT 0,
  is_limited INTEGER NOT NULL DEFAULT 0,   -- bookable but limited/prototype depth
  structure TEXT NOT NULL -- JSON: sections[] -> items[]
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  job_number TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL DEFAULT 'assessment' CHECK (job_type IN ('assessment','survey')),
  claim_type TEXT NOT NULL CHECK (claim_type IN
    ('geyser_water','accidental','storm','theft','fire','general','survey_residential','survey_commercial')),
  template_id TEXT NOT NULL REFERENCES checklist_templates(id),
  template_version TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id),
  assessor_id TEXT REFERENCES users(id),
  priority TEXT NOT NULL DEFAULT 'Normal',
  claim_number TEXT NOT NULL,
  policy_number TEXT,
  date_of_loss TEXT,
  description TEXT,
  special_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  outcome TEXT,
  outcome_reason TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  attempt_number INTEGER NOT NULL,
  scheduled_start TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','no_show','cancelled','rescheduled')),
  no_show_reason TEXT,
  rescheduled_to TEXT,
  link_token TEXT UNIQUE,        -- plaintext in prototype; hashed at hardening (Tier B)
  link_expires_at TEXT,
  link_revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  appointment_id TEXT REFERENCES appointments(id),
  assessor_id TEXT REFERENCES users(id),
  provider_room_ref TEXT,
  started_at TEXT,
  ended_at TEXT,
  client_joined_at TEXT,
  consent_name TEXT,
  consent_accepted_at TEXT,
  consent_text_version TEXT,
  reconnect_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS checklist_responses (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  item_key TEXT NOT NULL,
  answer TEXT,                  -- JSON
  note TEXT,
  concern_flag INTEGER NOT NULL DEFAULT 0,
  concern_note TEXT,
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','answered','skipped','missing','resolved')),
  missing_reason TEXT,
  session_id TEXT REFERENCES sessions(id),
  updated_at TEXT NOT NULL,
  UNIQUE (job_id, item_key)
);

CREATE TABLE IF NOT EXISTS evidence_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  session_id TEXT REFERENCES sessions(id),
  item_key TEXT,                -- NULL = UNFILED
  kind TEXT NOT NULL CHECK (kind IN ('frame_capture','highres_client_photo','client_upload')),
  file_key TEXT,
  thumb_key TEXT,
  mime_type TEXT,
  byte_size INTEGER,
  label TEXT NOT NULL,
  note TEXT,
  captured_at TEXT NOT NULL,    -- server timestamp, authoritative
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  discarded_at TEXT,
  discard_reason TEXT,
  sha256 TEXT,                  -- reserved, empty until hardening
  original_metadata TEXT,       -- reserved, empty until hardening
  hue INTEGER                   -- placeholder-tile colour until real files (1E)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','submitted','returned','approved')),
  content TEXT,                 -- JSON per-section
  pdf_key TEXT,
  pack_key TEXT,
  submitted_at TEXT,
  submitted_by TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  review_comments TEXT,         -- JSON
  UNIQUE (job_id, version)
);

CREATE TABLE IF NOT EXISTS event_log (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id),
  actor TEXT NOT NULL,          -- demo user name, 'client_link', or 'system'
  actor_role TEXT,
  event_type TEXT NOT NULL,
  data TEXT,                    -- JSON context
  occurred_at TEXT NOT NULL     -- server timestamp
);
-- Workflow event log (1B). Append-only BY CONVENTION: the data layer exposes no
-- update/delete for this table. DB-level enforcement is production hardening.

CREATE TABLE IF NOT EXISTS client_upload_requests (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  link_token TEXT UNIQUE,
  expires_at TEXT,
  revoked_at TEXT,
  requested_items TEXT,         -- JSON: item_keys + plain-language names
  message_text TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assessor ON jobs(assessor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_job ON appointments(job_id);
CREATE INDEX IF NOT EXISTS idx_events_job ON event_log(job_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_evidence_job ON evidence_items(job_id);
CREATE INDEX IF NOT EXISTS idx_responses_job ON checklist_responses(job_id);
`;
