// Data layer (Chunk 1B): reads, guarded status transitions, event logging.
// Event log is append-only by convention — this module exposes no update/delete
// for event_log rows. Production audit hardening is Tier B, not here.
import "server-only";
import { db, nowIso, uuid } from "./db";
import { JobStatus, TemplateSection } from "./types";

// ---------- row shapes ----------
export interface JobRow {
  id: string; job_number: string; claim_type: "geyser_water" | "accidental";
  template_id: string; template_version: string; client_id: string;
  assessor_id: string | null; priority: string; claim_number: string;
  policy_number: string | null; date_of_loss: string | null; description: string | null;
  special_conditions: string | null; status: JobStatus; outcome: string | null;
  outcome_reason: string | null; attempt_count: number; created_at: string; updated_at: string;
  client_name?: string; assessor_name?: string; scheduled_start?: string | null; link_token?: string | null;
}
export interface AppointmentRow {
  id: string; job_id: string; attempt_number: number; scheduled_start: string;
  duration_minutes: number; status: string; no_show_reason: string | null;
  link_token: string | null; link_revoked_at: string | null; created_at: string;
}
export interface EventRow { id: string; job_id: string; actor: string; actor_role: string | null; event_type: string; data: string | null; occurred_at: string }
export interface EvidenceRow {
  id: string; job_id: string; item_key: string | null; kind: string; label: string;
  captured_at: string; is_featured: number; hue: number | null; discarded_at: string | null;
}
export interface ReportRow {
  id: string; job_id: string; version: number; status: string; submitted_at: string | null;
  submitted_by: string | null; reviewed_at: string | null; reviewed_by: string | null; review_comments: string | null;
}
export interface TemplateRow { id: string; name: string; claim_type: string; version: string; is_reference_only: number; structure: string }

// ---------- status machine (phase1/05 §5.3 — exact edges) ----------
export const EDGES: Record<JobStatus, JobStatus[]> = {
  "New": ["Assigned", "Cancelled"],
  "Assigned": ["Scheduled", "Cancelled"],
  "Scheduled": ["In progress", "No-show", "Cancelled"],
  "In progress": ["Awaiting evidence", "Awaiting report"],
  "Awaiting evidence": ["Awaiting report", "Cancelled"],
  "Awaiting report": ["Report submitted"],
  "Report submitted": ["Report completed", "Returned for correction"],
  "Returned for correction": ["Awaiting report"],
  "Report completed": [],
  "Cancelled": [],
  "No-show": ["Scheduled", "Cancelled"],
};

export interface Actor { id: string; name: string; role: string }
export const SYSTEM_ACTOR: Actor = { id: "system", name: "system", role: "system" };

export function logEvent(jobId: string | null, actor: Actor, eventType: string, data?: object) {
  db().prepare(
    "INSERT INTO event_log (id,job_id,actor,actor_role,event_type,data,occurred_at) VALUES (?,?,?,?,?,?,?)"
  ).run(uuid(), jobId, actor.name, actor.role, eventType, data ? JSON.stringify(data) : null, nowIso());
}

export function changeStatus(jobId: string, to: JobStatus, actor: Actor, eventType = "status_changed", extra?: object) {
  const job = db().prepare("SELECT id,status FROM jobs WHERE id=?").get(jobId) as { id: string; status: JobStatus } | undefined;
  if (!job) throw new Error("Unknown job");
  if (!EDGES[job.status].includes(to))
    throw new Error(`Illegal transition: ${job.status} → ${to}`);
  db().prepare("UPDATE jobs SET status=?, updated_at=? WHERE id=?").run(to, nowIso(), jobId);
  logEvent(jobId, actor, eventType, { from: job.status, to, ...extra });
}

// ---------- reads ----------
const JOB_SELECT = `
  SELECT j.*, c.full_name AS client_name, u.name AS assessor_name,
    (SELECT scheduled_start FROM appointments a WHERE a.job_id=j.id AND a.status IN ('scheduled') AND a.link_revoked_at IS NULL ORDER BY a.created_at DESC LIMIT 1) AS scheduled_start,
    (SELECT link_token FROM appointments a WHERE a.job_id=j.id AND a.link_revoked_at IS NULL ORDER BY a.created_at DESC LIMIT 1) AS link_token
  FROM jobs j
  JOIN clients c ON c.id = j.client_id
  LEFT JOIN users u ON u.id = j.assessor_id`;

export const listJobs = (status?: string) =>
  db().prepare(`${JOB_SELECT} ${status ? "WHERE j.status=?" : ""} ORDER BY j.created_at`).all(...(status ? [status] : [])) as JobRow[];

export const getJob = (id: string) => db().prepare(`${JOB_SELECT} WHERE j.id=?`).get(id) as JobRow | undefined;

export const getJobByToken = (token: string) =>
  db().prepare(`${JOB_SELECT} WHERE j.id = (
    SELECT job_id FROM appointments WHERE link_token=? AND link_revoked_at IS NULL
    UNION SELECT job_id FROM client_upload_requests WHERE link_token=? AND revoked_at IS NULL LIMIT 1)`)
    .get(token, token) as JobRow | undefined;

export const listEvents = (jobId: string) =>
  db().prepare("SELECT * FROM event_log WHERE job_id=? ORDER BY occurred_at, rowid").all(jobId) as EventRow[];

export const listAppointments = (jobId: string) =>
  db().prepare("SELECT * FROM appointments WHERE job_id=? ORDER BY created_at").all(jobId) as AppointmentRow[];

export const listEvidence = (jobId: string) =>
  db().prepare("SELECT * FROM evidence_items WHERE job_id=? AND discarded_at IS NULL ORDER BY sort_order, captured_at").all(jobId) as EvidenceRow[];

export const listReports = (jobId: string) =>
  db().prepare("SELECT * FROM reports WHERE job_id=? ORDER BY version").all(jobId) as ReportRow[];

export const missingItems = (jobId: string) =>
  db().prepare("SELECT item_key, missing_reason FROM checklist_responses WHERE job_id=? AND state='missing'").all(jobId) as { item_key: string; missing_reason: string | null }[];

export const getTemplate = (id: string) => {
  const row = db().prepare("SELECT * FROM checklist_templates WHERE id=?").get(id) as TemplateRow | undefined;
  return row ? { ...row, sections: JSON.parse(row.structure) as TemplateSection[] } : undefined;
};

export const listTemplates = () =>
  (db().prepare("SELECT * FROM checklist_templates ORDER BY is_reference_only, name").all() as TemplateRow[])
    .map((t) => ({ ...t, sections: JSON.parse(t.structure) as TemplateSection[] }));

export const listUsers = (role?: string) =>
  db().prepare(`SELECT * FROM users ${role ? "WHERE role=?" : ""} ORDER BY name`).all(...(role ? [role] : [])) as { id: string; name: string; role: string; title: string }[];

export const getUser = (id: string) =>
  db().prepare("SELECT * FROM users WHERE id=?").get(id) as { id: string; name: string; role: string; title: string } | undefined;

export const getClient = (id: string) =>
  db().prepare("SELECT * FROM clients WHERE id=?").get(id) as { id: string; full_name: string; phone: string; email: string; language: string } | undefined;

export const templateItemByKey = (sections: TemplateSection[], key: string) => {
  for (const s of sections) for (const i of s.items) if (i.key === key) return { section: s, item: i };
  return undefined;
};

// ---------- link-state machine (Chunk 1C) ----------
// States: valid | too_early | expired | revoked | invalid.
// Prototype windows: join links open 2h before the appointment; expiry is the
// explicit link_expires_at only (new bookings set start + 24h; demo seeds are
// long-dated so walkthroughs keep working).
export type LinkState = "valid" | "too_early" | "expired" | "revoked" | "invalid";
export interface TokenInfo {
  state: LinkState;
  purpose: "join" | "upload";
  job?: JobRow;
  appointment?: AppointmentRow;
  scheduledStart?: string;
}
const EARLY_WINDOW_MS = 2 * 60 * 60 * 1000;

export function resolveToken(token: string): TokenInfo {
  const appt = db().prepare("SELECT * FROM appointments WHERE link_token=?").get(token) as AppointmentRow | undefined;
  if (appt) {
    const job = getJob(appt.job_id);
    const info: TokenInfo = { state: "valid", purpose: "join", job, appointment: appt, scheduledStart: appt.scheduled_start };
    if (appt.link_revoked_at || appt.status === "rescheduled" || appt.status === "cancelled") return { ...info, state: "revoked" };
    if (job?.status === "Cancelled") return { ...info, state: "revoked" };
    const expires = (appt as unknown as { link_expires_at: string | null }).link_expires_at;
    if (expires && Date.now() > new Date(expires.replace(" ", "T")).getTime()) return { ...info, state: "expired" };
    if (Date.now() < new Date(appt.scheduled_start.replace(" ", "T")).getTime() - EARLY_WINDOW_MS) return { ...info, state: "too_early" };
    return info;
  }
  const upr = db().prepare("SELECT * FROM client_upload_requests WHERE link_token=?").get(token) as
    { job_id: string; revoked_at: string | null; expires_at: string | null } | undefined;
  if (upr) {
    const job = getJob(upr.job_id);
    const info: TokenInfo = { state: "valid", purpose: "upload", job };
    if (upr.revoked_at) return { ...info, state: "revoked" };
    if (upr.expires_at && Date.now() > new Date(upr.expires_at.replace(" ", "T")).getTime()) return { ...info, state: "expired" };
    return info;
  }
  return { state: "invalid", purpose: "join" };
}

// ---------- client readiness (Chunk 1C, staff-side indicators) ----------
export interface Readiness { linkOpened: boolean; consent: boolean; deviceCheck: boolean; waiting: boolean }
export function clientReadiness(jobId: string): Readiness {
  const has = (type: string) =>
    !!db().prepare("SELECT 1 FROM event_log WHERE job_id=? AND event_type=? LIMIT 1").get(jobId, type);
  return {
    linkOpened: has("link_opened"),
    consent: has("consent_accepted"),
    deviceCheck: has("device_check_passed"),
    waiting: has("client_waiting"),
  };
}

// Uploads present per checklist item (drives client-side complete ticks).
export const uploadsByItem = (jobId: string) => {
  const rows = db().prepare(
    "SELECT item_key, COUNT(*) AS n FROM evidence_items WHERE job_id=? AND kind='client_upload' AND discarded_at IS NULL GROUP BY item_key"
  ).all(jobId) as { item_key: string; n: number }[];
  return new Map(rows.map((r) => [r.item_key, r.n]));
};

export const getEvidence = (id: string) =>
  db().prepare("SELECT * FROM evidence_items WHERE id=?").get(id) as
    (EvidenceRow & { file_key: string | null; mime_type: string | null }) | undefined;

// ---------- live session support (Chunk 1D) ----------
export interface SessionRow {
  id: string; job_id: string; assessor_id: string | null; started_at: string | null;
  ended_at: string | null; client_joined_at: string | null; reconnect_count: number;
  consent_name: string | null;
}
export const getActiveSession = (jobId: string) =>
  db().prepare("SELECT * FROM sessions WHERE job_id=? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1")
    .get(jobId) as SessionRow | undefined;

export interface ResponseRow {
  item_key: string; answer: string | null; note: string | null;
  concern_flag: number; concern_note: string | null;
  state: string; missing_reason: string | null;
}
export const listResponses = (jobId: string) =>
  db().prepare("SELECT item_key, answer, note, concern_flag, concern_note, state, missing_reason FROM checklist_responses WHERE job_id=?")
    .all(jobId) as ResponseRow[];

export const evidenceCountByItem = (jobId: string) => {
  const rows = db().prepare(
    "SELECT item_key, COUNT(*) AS n FROM evidence_items WHERE job_id=? AND discarded_at IS NULL AND item_key IS NOT NULL GROUP BY item_key"
  ).all(jobId) as { item_key: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.item_key, r.n])) as Record<string, number>;
};

export const nextJobNumber = () => {
  const n = (db().prepare("SELECT COUNT(*) AS n FROM jobs").get() as { n: number }).n + 1;
  return `INS-2026-${String(n).padStart(4, "0")}`;
};
