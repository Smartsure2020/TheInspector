// Data layer (Chunk 1B): reads, guarded status transitions, event logging.
// Event log is append-only by convention — this module exposes no update/delete
// for event_log rows. Production audit hardening is Tier B, not here.
import "server-only";
import { query, nowIso, uuid } from "./db";
import { sha256 } from "./crypto";
import { ClaimType, JobStatus, JobType, TemplateSection } from "./types";

// ---------- row shapes ----------
export interface JobRow {
  id: string; job_number: string; job_type: JobType; claim_type: ClaimType;
  template_id: string; template_version: string; client_id: string;
  assessor_id: string | null; priority: string; claim_number: string;
  policy_number: string | null; date_of_loss: string | null; description: string | null;
  special_conditions: string | null; status: JobStatus; outcome: string | null;
  outcome_reason: string | null; attempt_count: number; created_at: string; updated_at: string;
  client_name?: string; assessor_name?: string; template_name?: string;
  scheduled_start?: string | null; link_token?: string | null;
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
  file_key: string | null; mime_type: string | null;
}
export interface ReportRow {
  id: string; job_id: string; version: number; status: string; content: string | null; submitted_at: string | null;
  submitted_by: string | null; reviewed_at: string | null; reviewed_by: string | null; review_comments: string | null;
}
export interface TemplateRow {
  id: string; name: string; claim_type: string; job_type: JobType; version: string;
  is_reference_only: number; is_limited: number; structure: string;
}

// ---------- claim-type presentation + scheduling defaults (Chunk 1F) ----------
export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  geyser_water: "Geyser / water",
  accidental: "Accidental",
  storm: "Storm",
  theft: "Theft / burglary",
  fire: "Fire (triage)",
  general: "General non-motor",
  survey_residential: "Residential survey",
  survey_commercial: "Commercial survey",
};

const DURATIONS: Record<ClaimType, number> = {
  geyser_water: 45, accidental: 20, storm: 60, theft: 60, fire: 30, general: 45,
  survey_residential: 90, survey_commercial: 90,
};
export const durationForClaimType = (t: ClaimType) => DURATIONS[t] ?? 45;

export const jobTypeLabel = (j: Pick<JobRow, "claim_type" | "template_name">) =>
  j.template_name ?? CLAIM_TYPE_LABELS[j.claim_type] ?? j.claim_type;

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

export async function logEvent(jobId: string | null, actor: Actor, eventType: string, data?: object) {
  await query.run(
    "INSERT INTO event_log (id,job_id,actor,actor_role,event_type,data,occurred_at) VALUES (?,?,?,?,?,?,?)",
    uuid(), jobId, actor.id, actor.role, eventType, data ? JSON.stringify(data) : null, nowIso(),
  );
}

export async function changeStatus(jobId: string, to: JobStatus, actor: Actor, eventType = "status_changed", extra?: object) {
  const job = await query.get<{ id: string; status: JobStatus }>("SELECT id,status FROM jobs WHERE id=?", jobId);
  if (!job) throw new Error("Unknown job");
  if (!EDGES[job.status].includes(to))
    throw new Error(`Illegal transition: ${job.status} → ${to}`);
  await query.run("UPDATE jobs SET status=?, updated_at=? WHERE id=?", to, nowIso(), jobId);
  await logEvent(jobId, actor, eventType, { from: job.status, to, ...extra });
}

// ---------- reads ----------
const JOB_SELECT = `
  SELECT j.*, c.full_name AS client_name, u.name AS assessor_name, t.name AS template_name,
    (SELECT scheduled_start FROM appointments a WHERE a.job_id=j.id AND a.status IN ('scheduled') AND a.link_revoked_at IS NULL ORDER BY a.created_at DESC LIMIT 1) AS scheduled_start,
    (SELECT link_token FROM appointments a WHERE a.job_id=j.id AND a.link_revoked_at IS NULL ORDER BY a.created_at DESC LIMIT 1) AS link_token
  FROM jobs j
  JOIN clients c ON c.id = j.client_id
  JOIN checklist_templates t ON t.id = j.template_id
  LEFT JOIN users u ON u.id = j.assessor_id`;

export const listJobs = async (status?: string) =>
  query.all<JobRow>(`${JOB_SELECT} ${status ? "WHERE j.status=?" : ""} ORDER BY j.created_at`, ...(status ? [status] : []));

export const getJob = async (id: string) =>
  query.get<JobRow>(`${JOB_SELECT} WHERE j.id=?`, id);

export const getJobByToken = async (token: string) => {
  const h = sha256(token);
  return query.get<JobRow>(`${JOB_SELECT} WHERE j.id = (
    SELECT job_id FROM appointments WHERE link_token_hash=? AND link_revoked_at IS NULL
    UNION SELECT job_id FROM client_upload_requests WHERE link_token_hash=? AND revoked_at IS NULL LIMIT 1)`,
    h, h);
};

export const listEvents = async (jobId: string) =>
  query.all<EventRow>("SELECT * FROM event_log WHERE job_id=? ORDER BY occurred_at, id", jobId);

export const listAppointments = async (jobId: string) =>
  query.all<AppointmentRow>("SELECT * FROM appointments WHERE job_id=? ORDER BY created_at", jobId);

export const listEvidence = async (jobId: string) =>
  query.all<EvidenceRow>("SELECT * FROM evidence_items WHERE job_id=? AND discarded_at IS NULL ORDER BY sort_order, captured_at", jobId);

export const listReports = async (jobId: string) =>
  query.all<ReportRow>("SELECT * FROM reports WHERE job_id=? ORDER BY version", jobId);

export const missingItems = async (jobId: string) =>
  query.all<{ item_key: string; missing_reason: string | null }>(
    "SELECT item_key, missing_reason FROM checklist_responses WHERE job_id=? AND state='missing'", jobId);

export const getTemplate = async (id: string) => {
  const row = await query.get<TemplateRow>("SELECT * FROM checklist_templates WHERE id=?", id);
  return row ? { ...row, sections: JSON.parse(row.structure) as TemplateSection[] } : undefined;
};

export const listTemplates = async () =>
  (await query.all<TemplateRow>("SELECT * FROM checklist_templates ORDER BY is_reference_only, job_type, name"))
    .map((t) => ({ ...t, sections: JSON.parse(t.structure) as TemplateSection[] }));

export const listUsers = async (role?: string) =>
  query.all<{ id: string; name: string; role: string; title: string }>(
    `SELECT * FROM users ${role ? "WHERE role=?" : ""} ORDER BY name`, ...(role ? [role] : []));

export const listMandatedAssessors = async (templateId: string) =>
  query.all<{ id: string; name: string }>(
    `SELECT u.id, u.name FROM users u
     JOIN user_template_mandates m ON m.user_id = u.id
     WHERE u.role='assessor' AND u.is_active=1 AND m.template_id=?
     ORDER BY u.name`,
    templateId,
  );

export const getUser = async (id: string) =>
  query.get<{ id: string; name: string; role: string; title: string }>("SELECT * FROM users WHERE id=?", id);

export async function userNameMap(): Promise<Record<string, string>> {
  const rows = await query.all<{ id: string; name: string }>("SELECT id, name FROM users");
  const map: Record<string, string> = { system: "System", client_link: "Client" };
  for (const r of rows) map[r.id] = r.name;
  return map;
}

export const getClient = async (id: string) =>
  query.get<{ id: string; full_name: string; phone: string; email: string; language: string }>(
    "SELECT * FROM clients WHERE id=?", id);

export const templateItemByKey = (sections: TemplateSection[], key: string) => {
  for (const s of sections) for (const i of s.items) if (i.key === key) return { section: s, item: i };
  return undefined;
};

// ---------- link-state machine (Chunk 1C) ----------
export type LinkState = "valid" | "too_early" | "expired" | "revoked" | "invalid";
export interface TokenInfo {
  state: LinkState;
  purpose: "join" | "upload";
  job?: JobRow;
  appointment?: AppointmentRow;
  scheduledStart?: string;
}
const EARLY_WINDOW_MS = 2 * 60 * 60 * 1000;

export async function resolveToken(token: string): Promise<TokenInfo> {
  const tokenHash = sha256(token);
  const appt = await query.get<AppointmentRow>(
    "SELECT * FROM appointments WHERE link_token_hash=?", tokenHash);
  if (appt) {
    const job = await getJob(appt.job_id);
    const info: TokenInfo = { state: "valid", purpose: "join", job, appointment: appt, scheduledStart: appt.scheduled_start };
    if (appt.link_revoked_at || appt.status === "rescheduled" || appt.status === "cancelled") return { ...info, state: "revoked" };
    if (job?.status === "Cancelled") return { ...info, state: "revoked" };
    const expires = (appt as unknown as { link_expires_at: string | null }).link_expires_at;
    if (expires && Date.now() > new Date(expires.replace(" ", "T")).getTime()) return { ...info, state: "expired" };
    if (Date.now() < new Date(appt.scheduled_start.replace(" ", "T")).getTime() - EARLY_WINDOW_MS) return { ...info, state: "too_early" };
    return info;
  }
  const upr = await query.get<{ job_id: string; revoked_at: string | null; expires_at: string | null }>(
    "SELECT * FROM client_upload_requests WHERE link_token_hash=?", tokenHash);
  if (upr) {
    const job = await getJob(upr.job_id);
    const info: TokenInfo = { state: "valid", purpose: "upload", job };
    if (upr.revoked_at) return { ...info, state: "revoked" };
    if (upr.expires_at && Date.now() > new Date(upr.expires_at.replace(" ", "T")).getTime()) return { ...info, state: "expired" };
    return info;
  }
  return { state: "invalid", purpose: "join" };
}

// ---------- client readiness (Chunk 1C, staff-side indicators) ----------
export interface Readiness { linkOpened: boolean; consent: boolean; deviceCheck: boolean; waiting: boolean }
export async function clientReadiness(jobId: string): Promise<Readiness> {
  const has = async (type: string) =>
    !!(await query.get("SELECT 1 FROM event_log WHERE job_id=? AND event_type=? LIMIT 1", jobId, type));
  return {
    linkOpened: await has("link_opened"),
    consent: await has("consent_accepted"),
    deviceCheck: await has("device_check_passed"),
    waiting: await has("client_waiting"),
  };
}

export const uploadsByItem = async (jobId: string) => {
  const rows = await query.all<{ item_key: string; n: number }>(
    "SELECT item_key, COUNT(*) AS n FROM evidence_items WHERE job_id=? AND kind='client_upload' AND discarded_at IS NULL GROUP BY item_key",
    jobId);
  return new Map(rows.map((r) => [r.item_key, r.n]));
};

export const getEvidence = async (id: string) =>
  query.get<EvidenceRow & { file_key: string | null; mime_type: string | null }>(
    "SELECT * FROM evidence_items WHERE id=?", id);

// ---------- live session support (Chunk 1D) ----------
export interface SessionRow {
  id: string; job_id: string; assessor_id: string | null; started_at: string | null;
  ended_at: string | null; client_joined_at: string | null; reconnect_count: number;
  consent_name: string | null;
}
export const getActiveSession = async (jobId: string) =>
  query.get<SessionRow>("SELECT * FROM sessions WHERE job_id=? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1", jobId);

export interface ResponseRow {
  item_key: string; answer: string | null; note: string | null;
  concern_flag: number; concern_note: string | null;
  state: string; missing_reason: string | null;
}
export const listResponses = async (jobId: string) =>
  query.all<ResponseRow>(
    "SELECT item_key, answer, note, concern_flag, concern_note, state, missing_reason FROM checklist_responses WHERE job_id=?",
    jobId);

export const evidenceCountByItem = async (jobId: string) => {
  const rows = await query.all<{ item_key: string; n: number }>(
    "SELECT item_key, COUNT(*) AS n FROM evidence_items WHERE job_id=? AND discarded_at IS NULL AND item_key IS NOT NULL GROUP BY item_key",
    jobId);
  return Object.fromEntries(rows.map((r) => [r.item_key, r.n])) as Record<string, number>;
};

export const nextJobNumber = async (jobType: JobType = "assessment") => {
  const row = await query.get<{ n: number }>("SELECT COUNT(*) AS n FROM jobs");
  const n = (row?.n ?? 0) + 1;
  return `${jobType === "survey" ? "SRV" : "INS"}-2026-${String(n).padStart(4, "0")}`;
};
