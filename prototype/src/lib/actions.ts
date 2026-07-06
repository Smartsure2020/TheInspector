"use server";
// Server actions (Chunk 1B). Actor comes from the placeholder-role cookie —
// this is mock access by design (AC9); real auth is production hardening.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db, nowIso, uuid } from "./db";
import { Actor, changeStatus, getJob, getUser, logEvent, nextJobNumber, SYSTEM_ACTOR } from "./data";
import { JobStatus } from "./types";

async function actor(): Promise<Actor> {
  const id = (await cookies()).get("inspector.demoUser")?.value;
  const u = id ? getUser(id) : undefined;
  return u ? { id: u.id, name: u.name, role: u.role } : SYSTEM_ACTOR;
}
const CLIENT_ACTOR: Actor = { id: "client_link", name: "client_link", role: "client" };

export async function createJobAction(formData: FormData) {
  const a = await actor();
  const clientId = uuid();
  const jobId = uuid();
  const templateId = String(formData.get("template_id"));
  const tpl = db().prepare("SELECT claim_type, version, is_reference_only FROM checklist_templates WHERE id=?").get(templateId) as
    { claim_type: string; version: string; is_reference_only: number } | undefined;
  if (!tpl || tpl.is_reference_only) throw new Error("Only geyser/water and accidental damage templates are active in Phase 1.");
  const assessorId = String(formData.get("assessor_id") || "");
  const now = nowIso();

  db().prepare("INSERT INTO clients (id,full_name,phone,email,language,created_at) VALUES (?,?,?,?,?,?)")
    .run(clientId, String(formData.get("client_name") || "Unnamed Test Insured"), String(formData.get("client_phone") || ""), String(formData.get("client_email") || ""), "English", now);

  db().prepare(`INSERT INTO jobs (id,job_number,claim_type,template_id,template_version,client_id,assessor_id,priority,
      claim_number,policy_number,date_of_loss,description,special_conditions,status,attempt_count,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)`)
    .run(jobId, nextJobNumber(), tpl.claim_type, templateId, tpl.version, clientId,
      assessorId || null, String(formData.get("priority") || "Normal"),
      String(formData.get("claim_number") || ""), String(formData.get("policy_number") || ""),
      String(formData.get("date_of_loss") || ""), String(formData.get("description") || ""),
      String(formData.get("special_conditions") || "") || null,
      assessorId ? "Assigned" : "New", now, now);

  logEvent(jobId, a, "job_created", { claim_number: String(formData.get("claim_number")) });
  if (assessorId) logEvent(jobId, a, "job_assigned", { assessor: getUser(assessorId)?.name });
  revalidatePath("/admin");
  redirect(`/jobs/${jobId}`);
}

export async function assignAction(jobId: string, assessorId: string) {
  const a = await actor();
  db().prepare("UPDATE jobs SET assessor_id=?, updated_at=? WHERE id=?").run(assessorId, nowIso(), jobId);
  changeStatus(jobId, "Assigned", a, "job_assigned", { assessor: getUser(assessorId)?.name });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

export async function scheduleAction(jobId: string, formData: FormData) {
  const a = await actor();
  const job = getJob(jobId);
  if (!job) throw new Error("Unknown job");
  const when = `${formData.get("date")} ${formData.get("time")}`;
  const duration = job.claim_type === "geyser_water" ? 45 : 20;
  const token = job.id.startsWith("j") && !job.link_token ? `tok-${uuid().slice(0, 12)}` : `tok-${uuid().slice(0, 12)}`;
  const now = nowIso();

  // Reschedule: revoke prior active link + mark old appointment.
  const prev = db().prepare("SELECT id FROM appointments WHERE job_id=? AND status='scheduled' AND link_revoked_at IS NULL").get(jobId) as { id: string } | undefined;
  if (prev)
    db().prepare("UPDATE appointments SET status='rescheduled', link_revoked_at=? WHERE id=?").run(now, prev.id);

  const attempt = job.attempt_count + 1;
  // Link validity: opens 2h before (resolveToken), expires 24h after the start.
  // Local wall-clock formatting throughout (prototype runs single-timezone SAST).
  const exp = new Date(new Date(when.replace(" ", "T")).getTime() + 24 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  const expires = `${exp.getFullYear()}-${p(exp.getMonth() + 1)}-${p(exp.getDate())} ${p(exp.getHours())}:${p(exp.getMinutes())}`;
  db().prepare(`INSERT INTO appointments (id,job_id,attempt_number,scheduled_start,duration_minutes,status,link_token,link_expires_at,created_at)
    VALUES (?,?,?,?,?, 'scheduled', ?,?,?)`)
    .run(uuid(), jobId, attempt, when, duration, token, expires, now);
  db().prepare("UPDATE jobs SET attempt_count=?, updated_at=? WHERE id=?").run(attempt, now, jobId);

  if (job.status === "Assigned" || job.status === "No-show")
    changeStatus(jobId, "Scheduled", a, "appointment_scheduled", { when, attempt, link: prev ? "reissued" : "issued" });
  else
    logEvent(jobId, a, "appointment_scheduled", { when, attempt, note: "reschedule", link: "reissued" });

  revalidatePath(`/jobs/${jobId}`); revalidatePath(`/jobs/${jobId}/schedule`); revalidatePath("/admin"); revalidatePath("/assessor");
  redirect(`/jobs/${jobId}/schedule?done=1`);
}

export async function noShowAction(jobId: string, reason: string) {
  const a = await actor();
  const now = nowIso();
  db().prepare("UPDATE appointments SET status='no_show', no_show_reason=?, link_revoked_at=? WHERE job_id=? AND status='scheduled'")
    .run(reason, now, jobId);
  changeStatus(jobId, "No-show", a, "no_show_marked", { reason });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

export async function cancelAction(jobId: string, reason: string) {
  const a = await actor();
  const now = nowIso();
  db().prepare("UPDATE appointments SET link_revoked_at=? WHERE job_id=? AND link_revoked_at IS NULL").run(now, jobId);
  db().prepare("UPDATE jobs SET outcome='cancelled', outcome_reason=? WHERE id=?").run(reason, jobId);
  changeStatus(jobId, "Cancelled", a, "job_cancelled", { reason });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

// Generic guarded move used for: Scheduled→In progress (mock start until 1D),
// In progress→Awaiting evidence / Awaiting report, Awaiting evidence→Awaiting report,
// Returned for correction→Awaiting report.
export async function transitionAction(jobId: string, to: JobStatus) {
  const a = await actor();
  changeStatus(jobId, to, a);
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor"); revalidatePath("/manager");
}

export async function submitReportAction(jobId: string) {
  const a = await actor();
  const maxV = (db().prepare("SELECT COALESCE(MAX(version),0) AS v FROM reports WHERE job_id=?").get(jobId) as { v: number }).v;
  db().prepare("INSERT INTO reports (id,job_id,version,status,submitted_at,submitted_by) VALUES (?,?,?,?,?,?)")
    .run(uuid(), jobId, maxV + 1, "submitted", nowIso(), a.name);
  changeStatus(jobId, "Report submitted", a, "report_submitted", { version: maxV + 1 });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/manager");
  redirect(`/jobs/${jobId}/report/final`);
}

// Client-side events (actor = client_link; identified by possession of the token).
const jobIdForToken = (token: string) =>
  (db().prepare(
    `SELECT job_id FROM appointments WHERE link_token=?
     UNION SELECT job_id FROM client_upload_requests WHERE link_token=? LIMIT 1`
  ).get(token, token) as { job_id: string } | undefined)?.job_id;

export async function consentAction(token: string, name: string) {
  const jobId = jobIdForToken(token);
  if (jobId) logEvent(jobId, CLIENT_ACTOR, "consent_accepted", { name, text_version: "draft-1" });
  redirect(`/c/${token}/check`);
}

export async function consentDeclineAction(token: string) {
  const jobId = jobIdForToken(token);
  if (jobId) logEvent(jobId, CLIENT_ACTOR, "consent_declined", {});
  revalidatePath(`/jobs/${jobId}`);
}

export async function cannotAttendAction(token: string) {
  const jobId = jobIdForToken(token);
  if (jobId) logEvent(jobId, CLIENT_ACTOR, "client_requested_reschedule", {});
}

// Pre-join telemetry (Chunk 1C) — powers staff readiness indicators.
export async function clientPingAction(token: string, kind: "link_opened" | "device_check_passed" | "client_waiting", data?: Record<string, unknown>) {
  const jobId = jobIdForToken(token);
  if (!jobId) return;
  // Dedupe per job+kind: readiness is boolean, repeated pings add noise only.
  const seen = db().prepare("SELECT 1 FROM event_log WHERE job_id=? AND event_type=? LIMIT 1").get(jobId, kind);
  if (!seen) logEvent(jobId, CLIENT_ACTOR, kind, data ?? {});
}

export async function requestNewLinkAction(token: string) {
  const jobId = jobIdForToken(token);
  if (jobId) logEvent(jobId, CLIENT_ACTOR, "client_requested_new_link", {});
}

// ---------- live session actions (Chunk 1D) ----------

/** Assessor admits the client: ensures a sessions row + In progress status. */
export async function admitClientAction(jobId: string): Promise<{ sessionId: string }> {
  const a = await actor();
  const { getActiveSession, getJob: gj } = await import("./data");
  let session = getActiveSession(jobId);
  const job = gj(jobId);
  if (!job) throw new Error("Unknown job");
  const now = nowIso();
  if (!session) {
    const id = uuid();
    db().prepare(`INSERT INTO sessions (id, job_id, assessor_id, started_at, client_joined_at, reconnect_count)
      VALUES (?,?,?,?,?,?)`).run(id, jobId, a.id === "system" ? null : a.id, now, now, 0);
    session = getActiveSession(jobId)!;
    logEvent(jobId, a, "session_started", { session_id: id });
  } else if (!session.client_joined_at) {
    db().prepare("UPDATE sessions SET client_joined_at=? WHERE id=?").run(now, session.id);
  }
  if (job.status === "Scheduled") changeStatus(jobId, "In progress", a);
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
  return { sessionId: session.id };
}

/** Assessor ends the session; outcome decides the next status. */
export async function endSessionAction(jobId: string, outcome: "Awaiting evidence" | "Awaiting report") {
  const a = await actor();
  const { getActiveSession } = await import("./data");
  const session = getActiveSession(jobId);
  const now = nowIso();
  if (session) db().prepare("UPDATE sessions SET ended_at=? WHERE id=?").run(now, session.id);
  logEvent(jobId, a, "session_ended", { session_id: session?.id, outcome });
  changeStatus(jobId, outcome, a);
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

/** Network events from the room (reconnect telemetry). */
export async function sessionNetworkEventAction(jobId: string, kind: "client_disconnected" | "client_reconnected") {
  const a = await actor();
  const { getActiveSession } = await import("./data");
  const session = getActiveSession(jobId);
  if (kind === "client_reconnected" && session)
    db().prepare("UPDATE sessions SET reconnect_count = reconnect_count + 1 WHERE id=?").run(session.id);
  logEvent(jobId, a, kind, { session_id: session?.id });
}

/** Upsert a checklist response field set (answer / note / concern / missing). */
export async function saveResponseAction(
  jobId: string,
  itemKey: string,
  patch: {
    answer?: unknown;
    note?: string;
    concernFlag?: boolean;
    concernNote?: string;
    missing?: { flag: boolean; reason?: string };
  }
) {
  const a = await actor();
  const { getActiveSession } = await import("./data");
  const session = getActiveSession(jobId);
  const now = nowIso();
  const existing = db().prepare("SELECT id, state FROM checklist_responses WHERE job_id=? AND item_key=?")
    .get(jobId, itemKey) as { id: string; state: string } | undefined;
  const id = existing?.id ?? uuid();
  if (!existing)
    db().prepare("INSERT INTO checklist_responses (id, job_id, item_key, state, updated_at) VALUES (?,?,?,?,?)")
      .run(id, jobId, itemKey, "pending", now);

  if (patch.answer !== undefined) {
    db().prepare("UPDATE checklist_responses SET answer=?, state=CASE WHEN state IN ('pending','answered') THEN 'answered' ELSE state END, session_id=?, updated_at=? WHERE id=?")
      .run(JSON.stringify(patch.answer), session?.id ?? null, now, id);
    logEvent(jobId, a, "response_recorded", { item_key: itemKey });
  }
  if (patch.note !== undefined)
    db().prepare("UPDATE checklist_responses SET note=?, updated_at=? WHERE id=?").run(patch.note, now, id);
  if (patch.concernFlag !== undefined) {
    db().prepare("UPDATE checklist_responses SET concern_flag=?, concern_note=?, updated_at=? WHERE id=?")
      .run(patch.concernFlag ? 1 : 0, patch.concernNote ?? null, now, id);
    logEvent(jobId, a, patch.concernFlag ? "concern_flagged" : "concern_cleared", { item_key: itemKey });
  }
  if (patch.missing !== undefined) {
    db().prepare("UPDATE checklist_responses SET state=?, missing_reason=?, updated_at=? WHERE id=?")
      .run(patch.missing.flag ? "missing" : "pending", patch.missing.flag ? (patch.missing.reason ?? "not available") : null, id ? now : now, id);
    logEvent(jobId, a, patch.missing.flag ? "item_flagged_missing" : "item_missing_cleared",
      { item_key: itemKey, reason: patch.missing.reason });
  }
}

/** Save a frame capture from the assessor's room (optimistic UI uploads here in background). */
export async function saveCaptureAction(jobId: string, itemKey: string | null, label: string, formData: FormData): Promise<{ id: string }> {
  const a = await actor();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Empty capture");
  const { getActiveSession } = await import("./data");
  const { saveUpload } = await import("./storage");
  const session = getActiveSession(jobId);
  const id = uuid();
  const fileKey = saveUpload(id, file.type || "image/jpeg", Buffer.from(await file.arrayBuffer()));
  db().prepare(`INSERT INTO evidence_items
      (id, job_id, session_id, item_key, kind, file_key, mime_type, byte_size, label, captured_at, is_featured, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,0,0)`)
    .run(id, jobId, session?.id ?? null, itemKey, "frame_capture", fileKey, file.type || "image/jpeg", file.size, label, nowIso());
  logEvent(jobId, a, "evidence_captured", { evidence_id: id, item_key: itemKey ?? "UNFILED" });
  revalidatePath(`/jobs/${jobId}/evidence`);
  return { id };
}

// Real client upload (moved into 1C by instruction; dedicated upload-request
// creation UI remains 1G). File → local storage → evidence_items row tagged to
// the checklist item. sha256/original_metadata stay empty (Tier B).
// `kind` added in 1D: the high-res photo flow reuses this with 'highres_client_photo'.
export async function uploadEvidenceAction(
  token: string,
  itemKey: string,
  formData: FormData,
  kind: "client_upload" | "highres_client_photo" = "client_upload"
) {
  const { resolveToken } = await import("./data");
  const info = resolveToken(token);
  if (!info.job || info.state === "revoked" || info.state === "invalid") throw new Error("This link is no longer active.");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file received.");
  const { ALLOWED_UPLOAD_MIMES, MAX_UPLOAD_BYTES, saveUpload } = await import("./storage");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 15 MB).");
  if (!ALLOWED_UPLOAD_MIMES.includes(file.type)) throw new Error("Please upload a photo or PDF.");

  const id = uuid();
  const fileKey = saveUpload(id, file.type, Buffer.from(await file.arrayBuffer()));
  const labelPrefix = kind === "highres_client_photo" ? "High-res client photo" : "Client upload";
  db().prepare(`INSERT INTO evidence_items
      (id, job_id, item_key, kind, file_key, mime_type, byte_size, label, captured_at, is_featured, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,0,0)`)
    .run(id, info.job.id, itemKey, kind, fileKey, file.type, file.size,
      `${labelPrefix} – ${itemKey} – ${nowIso().slice(11)}`, nowIso());
  logEvent(info.job.id, CLIENT_ACTOR,
    kind === "highres_client_photo" ? "highres_photo_received" : "upload_received",
    { evidence_id: id, item_key: itemKey, bytes: file.size, mime: file.type });
  revalidatePath(`/c/${token}/upload`);
  revalidatePath(`/jobs/${info.job.id}/evidence`);
  revalidatePath(`/jobs/${info.job.id}`);
  return { id };
}
