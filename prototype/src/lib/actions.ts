"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, nowIso, uuid } from "./db";
import { Actor, changeStatus, durationForClaimType, getJob, getUser, logEvent, nextJobNumber } from "./data";
import { JobStatus, JobType } from "./types";
import { requireRole, requireSession } from "./auth";
import { sha256 } from "./crypto";
import { uploadTooLargeMessage } from "./limits";
import { checkClientAccess } from "./client-access";

const CLIENT_ACTOR: Actor = { id: "client_link", name: "client_link", role: "client" };

async function checkMandate(assessorId: string, templateId: string) {
  const mandate = await query.get(
    "SELECT 1 FROM user_template_mandates WHERE user_id=? AND template_id=?",
    assessorId, templateId,
  );
  if (!mandate) throw new Error("Assessor does not have a mandate for this template.");
}

export async function createJobAction(formData: FormData) {
  const a = await requireRole("admin");
  const clientId = uuid();
  const jobId = uuid();
  const templateId = String(formData.get("template_id"));
  const tpl = await query.get<{ claim_type: string; job_type: JobType; version: string; is_reference_only: number }>(
    "SELECT claim_type, job_type, version, is_reference_only FROM checklist_templates WHERE id=?", templateId);
  if (!tpl || tpl.is_reference_only)
    throw new Error("This template is reference-only / physical-first — it cannot be booked as a virtual job in the prototype.");
  const assessorId = String(formData.get("assessor_id") || "");
  if (assessorId) await checkMandate(assessorId, templateId);
  const now = nowIso();

  await query.run(
    "INSERT INTO clients (id,full_name,phone,email,language,created_at) VALUES (?,?,?,?,?,?)",
    clientId, String(formData.get("client_name") || "Unnamed Test Insured"),
    String(formData.get("client_phone") || ""), String(formData.get("client_email") || ""),
    "English", now);

  const jobNum = await nextJobNumber(tpl.job_type);
  await query.run(
    `INSERT INTO jobs (id,job_number,job_type,claim_type,template_id,template_version,client_id,assessor_id,priority,
      claim_number,policy_number,date_of_loss,description,special_conditions,status,attempt_count,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)`,
    jobId, jobNum, tpl.job_type, tpl.claim_type, templateId, tpl.version, clientId,
    assessorId || null, String(formData.get("priority") || "Normal"),
    String(formData.get("claim_number") || ""), String(formData.get("policy_number") || ""),
    String(formData.get("date_of_loss") || ""), String(formData.get("description") || ""),
    String(formData.get("special_conditions") || "") || null,
    assessorId ? "Assigned" : "New", now, now);

  await logEvent(jobId, a, "job_created", { claim_number: String(formData.get("claim_number")) });
  if (assessorId) await logEvent(jobId, a, "job_assigned", { assessor: (await getUser(assessorId))?.name });
  revalidatePath("/admin");
  redirect(`/jobs/${jobId}`);
}

export async function assignAction(jobId: string, assessorId: string) {
  const a = await requireRole("admin");
  const job = await query.get<{ template_id: string }>("SELECT template_id FROM jobs WHERE id=?", jobId);
  if (!job) throw new Error("Unknown job");
  await checkMandate(assessorId, job.template_id);
  await query.run("UPDATE jobs SET assessor_id=?, updated_at=? WHERE id=?", assessorId, nowIso(), jobId);
  await changeStatus(jobId, "Assigned", a, "job_assigned", { assessor: (await getUser(assessorId))?.name });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

export async function scheduleAction(jobId: string, formData: FormData) {
  const a = await requireRole("admin", "assessor");
  const job = await getJob(jobId);
  if (!job) throw new Error("Unknown job");
  const when = `${formData.get("date")} ${formData.get("time")}`;
  const duration = durationForClaimType(job.claim_type);
  const token = `tok-${uuid().slice(0, 12)}`;
  const now = nowIso();

  const prev = await query.get<{ id: string }>(
    "SELECT id FROM appointments WHERE job_id=? AND status='scheduled' AND link_revoked_at IS NULL", jobId);
  if (prev)
    await query.run("UPDATE appointments SET status='rescheduled', link_revoked_at=? WHERE id=?", now, prev.id);

  const attempt = job.attempt_count + 1;
  const exp = new Date(new Date(when.replace(" ", "T")).getTime() + 24 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  const expires = `${exp.getFullYear()}-${p(exp.getMonth() + 1)}-${p(exp.getDate())} ${p(exp.getHours())}:${p(exp.getMinutes())}`;
  const tokenHash = sha256(token);
  await query.run(
    `INSERT INTO appointments (id,job_id,attempt_number,scheduled_start,duration_minutes,status,link_token,link_token_hash,link_expires_at,created_at)
    VALUES (?,?,?,?,?, 'scheduled', ?,?,?,?)`,
    uuid(), jobId, attempt, when, duration, token, tokenHash, expires, now);
  await query.run("UPDATE jobs SET attempt_count=?, updated_at=? WHERE id=?", attempt, now, jobId);

  if (job.status === "Assigned" || job.status === "No-show")
    await changeStatus(jobId, "Scheduled", a, "appointment_scheduled", { when, attempt, link: prev ? "reissued" : "issued" });
  else
    await logEvent(jobId, a, "appointment_scheduled", { when, attempt, note: "reschedule", link: "reissued" });

  revalidatePath(`/jobs/${jobId}`); revalidatePath(`/jobs/${jobId}/schedule`); revalidatePath("/admin"); revalidatePath("/assessor");
  redirect(`/jobs/${jobId}/schedule?done=1`);
}

export async function noShowAction(jobId: string, reason: string) {
  const a = await requireRole("admin", "assessor");
  const now = nowIso();
  await query.run(
    "UPDATE appointments SET status='no_show', no_show_reason=?, link_revoked_at=? WHERE job_id=? AND status='scheduled'",
    reason, now, jobId);
  await changeStatus(jobId, "No-show", a, "no_show_marked", { reason });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

export async function cancelAction(jobId: string, reason: string) {
  const a = await requireRole("admin");
  const now = nowIso();
  await query.run("UPDATE appointments SET link_revoked_at=? WHERE job_id=? AND link_revoked_at IS NULL", now, jobId);
  await query.run("UPDATE jobs SET outcome='cancelled', outcome_reason=? WHERE id=?", reason, jobId);
  await changeStatus(jobId, "Cancelled", a, "job_cancelled", { reason });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

export async function transitionAction(jobId: string, to: JobStatus) {
  const a = await requireSession();
  await changeStatus(jobId, to, a);
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor"); revalidatePath("/manager");
}

// ---------- report lifecycle (Chunk 1E — draft, submit, review) ----------

export async function saveReportDraftAction(jobId: string, narrative: Record<string, string>) {
  const a = await requireRole("assessor");
  const draft = await query.get<{ id: string }>(
    "SELECT id FROM reports WHERE job_id=? AND status='draft' ORDER BY version DESC LIMIT 1", jobId);
  const content = JSON.stringify({ narrative });
  if (draft) {
    await query.run("UPDATE reports SET content=? WHERE id=?", content, draft.id);
  } else {
    const maxV = (await query.get<{ v: number }>("SELECT COALESCE(MAX(version),0) AS v FROM reports WHERE job_id=?", jobId))!.v;
    await query.run(
      "INSERT INTO reports (id,job_id,version,status,content) VALUES (?,?,?,?,?)",
      uuid(), jobId, maxV + 1, "draft", content);
    await logEvent(jobId, a, "report_draft_started", { version: maxV + 1 });
  }
}

export async function submitReportAction(jobId: string, narrative?: Record<string, string>) {
  const a = await requireRole("assessor");
  const job = await getJob(jobId);
  if (!job) throw new Error("Unknown job");
  const { buildReportModel } = await import("./report");
  const model = (await buildReportModel(jobId))!;
  const finalNarrative = { ...model.prefill, ...(narrative ?? {}) };

  const draft = await query.get<{ id: string; version: number; content: string | null }>(
    "SELECT id, version, content FROM reports WHERE job_id=? AND status='draft' ORDER BY version DESC LIMIT 1", jobId);
  if (!narrative && draft?.content) {
    try { Object.assign(finalNarrative, (JSON.parse(draft.content) as { narrative?: object }).narrative ?? {}); } catch { /* prefill stands */ }
  }
  const content = JSON.stringify({
    narrative: finalNarrative,
    auto: {
      cover: model.cover, particulars: model.particulars, limitations: model.limitations,
      evidenceIndex: model.evidenceIndex, stats: model.stats,
    },
  });

  const now = nowIso();
  let version: number;
  if (draft) {
    await query.run(
      "UPDATE reports SET status='submitted', content=?, submitted_at=?, submitted_by=? WHERE id=?",
      content, now, a.id, draft.id);
    version = draft.version;
  } else {
    const maxV = (await query.get<{ v: number }>("SELECT COALESCE(MAX(version),0) AS v FROM reports WHERE job_id=?", jobId))!.v;
    version = maxV + 1;
    await query.run(
      "INSERT INTO reports (id,job_id,version,status,content,submitted_at,submitted_by) VALUES (?,?,?,?,?,?,?)",
      uuid(), jobId, version, "submitted", content, now, a.id);
  }

  if (job.status === "Returned for correction") await changeStatus(jobId, "Awaiting report", a, "report_revision_started", { version });
  await changeStatus(jobId, "Report submitted", a, "report_submitted", { version });
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/manager"); revalidatePath(`/jobs/${jobId}/report`); revalidatePath(`/jobs/${jobId}/report/final`);
  redirect(`/jobs/${jobId}/report/final`);
}

export async function reviewReportAction(jobId: string, verdict: "approve" | "return", comments: string) {
  const a = await requireRole("manager");
  const submitted = await query.get<{ id: string; version: number }>(
    "SELECT id, version FROM reports WHERE job_id=? AND status='submitted' ORDER BY version DESC LIMIT 1", jobId);
  if (!submitted) throw new Error("No submitted report to review.");
  const now = nowIso();
  if (verdict === "approve") {
    await query.run(
      "UPDATE reports SET status='approved', reviewed_at=?, reviewed_by=?, review_comments=? WHERE id=?",
      now, a.id, comments ? JSON.stringify({ general: comments }) : null, submitted.id);
    await changeStatus(jobId, "Report completed", a, "report_approved", { version: submitted.version });
  } else {
    if (!comments.trim()) throw new Error("Return requires comments for the assessor.");
    await query.run(
      "UPDATE reports SET status='returned', reviewed_at=?, reviewed_by=?, review_comments=? WHERE id=?",
      now, a.id, JSON.stringify({ general: comments }), submitted.id);
    await changeStatus(jobId, "Returned for correction", a, "report_returned", { version: submitted.version });
  }
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/manager"); revalidatePath("/assessor"); revalidatePath(`/jobs/${jobId}/report/final`);
}

// ---------- evidence curation (Chunk 1E — relabel / refile / feature) ----------
export async function updateEvidenceAction(
  jobId: string,
  evidenceId: string,
  patch: { label?: string; itemKey?: string | null; featured?: boolean }
) {
  const a = await requireRole("assessor", "admin");
  const job = await getJob(jobId);
  if (!job) throw new Error("Unknown job");
  if (job.status === "Report completed" || job.status === "Cancelled")
    throw new Error(`Job is ${job.status.toLowerCase()} — evidence is locked.`);
  const row = await query.get<{ id: string; item_key: string | null; label: string }>(
    "SELECT id, item_key, label FROM evidence_items WHERE id=? AND job_id=?", evidenceId, jobId);
  if (!row) throw new Error("Unknown evidence item");

  if (patch.label !== undefined && patch.label.trim() && patch.label !== row.label) {
    await query.run("UPDATE evidence_items SET label=? WHERE id=?", patch.label.trim(), evidenceId);
    await logEvent(jobId, a, "evidence_relabelled", { evidence_id: evidenceId, from: row.label, to: patch.label.trim() });
  }
  if (patch.itemKey !== undefined && patch.itemKey !== row.item_key) {
    await query.run("UPDATE evidence_items SET item_key=? WHERE id=?", patch.itemKey, evidenceId);
    await logEvent(jobId, a, "evidence_refiled", { evidence_id: evidenceId, from: row.item_key ?? "UNFILED", to: patch.itemKey ?? "UNFILED" });
  }
  if (patch.featured !== undefined) {
    await query.run("UPDATE evidence_items SET is_featured=? WHERE id=?", patch.featured ? 1 : 0, evidenceId);
    await logEvent(jobId, a, patch.featured ? "evidence_featured" : "evidence_unfeatured", { evidence_id: evidenceId });
  }
  revalidatePath(`/jobs/${jobId}/evidence`); revalidatePath(`/jobs/${jobId}/report`); revalidatePath(`/jobs/${jobId}/report/final`);
}

const jobIdForToken = async (token: string) => {
  const h = sha256(token);
  return (await query.get<{ job_id: string }>(
    `SELECT job_id FROM appointments WHERE link_token_hash=?
     UNION SELECT job_id FROM client_upload_requests WHERE link_token_hash=? LIMIT 1`,
    h, h))?.job_id;
};

// ---------- client link actions (F16) ----------
// Every client action is its own HTTP endpoint, so page gating alone is not enough:
// each one re-checks link validity (not revoked/expired/cancelled), the exact link's
// purpose, and OTP verification for that exact link (checkClientAccess).
const PRE_SESSION_STATES = ["valid", "too_early"] as const;

export async function consentAction(token: string, name: string) {
  const acc = await checkClientAccess(token, { allowedStates: [...PRE_SESSION_STATES], purposes: ["join"] });
  if (!acc.ok) redirect(acc.reason === "otp" ? `/c/${token}/verify` : `/c/${token}`);
  await logEvent(acc.jobId, CLIENT_ACTOR, "consent_accepted", { name, text_version: "draft-1" });
  redirect(`/c/${token}/check`);
}

export async function consentDeclineAction(token: string) {
  const acc = await checkClientAccess(token, { allowedStates: [...PRE_SESSION_STATES], purposes: ["join"] });
  if (!acc.ok) redirect(acc.reason === "otp" ? `/c/${token}/verify` : `/c/${token}`);
  await logEvent(acc.jobId, CLIENT_ACTOR, "consent_declined", {});
  revalidatePath(`/jobs/${acc.jobId}`);
}

export async function cannotAttendAction(token: string) {
  const acc = await checkClientAccess(token, { allowedStates: [...PRE_SESSION_STATES], purposes: ["join"] });
  if (!acc.ok) redirect(acc.reason === "otp" ? `/c/${token}/verify` : `/c/${token}`);
  await logEvent(acc.jobId, CLIENT_ACTOR, "client_requested_reschedule", {});
}

/** Best-effort readiness telemetry: unauthorised callers are ignored (nothing is written). */
export async function clientPingAction(token: string, kind: "link_opened" | "device_check_passed" | "client_waiting", data?: Record<string, unknown>) {
  if (!["link_opened", "device_check_passed", "client_waiting"].includes(kind)) return;
  const acc = await checkClientAccess(token, { allowedStates: [...PRE_SESSION_STATES], purposes: ["join"] });
  if (!acc.ok) return;
  const seen = await query.get("SELECT 1 FROM event_log WHERE job_id=? AND event_type=? LIMIT 1", acc.jobId, kind);
  if (!seen) await logEvent(acc.jobId, CLIENT_ACTOR, kind, data ?? {});
}

/**
 * Deliberate exception: this is how a client with an EXPIRED or REVOKED link asks for a new
 * one, so OTP/active-state cannot be required. It still needs a link token that resolves to
 * a real job, and only writes one audit event.
 */
export async function requestNewLinkAction(token: string) {
  const jobId = await jobIdForToken(token);
  if (jobId) await logEvent(jobId, CLIENT_ACTOR, "client_requested_new_link", {});
}

// ---------- live session actions (Chunk 1D) ----------

export async function admitClientAction(jobId: string): Promise<{ sessionId: string }> {
  const a = await requireRole("assessor");
  const { getActiveSession, getJob: gj } = await import("./data");
  let session = await getActiveSession(jobId);
  const job = await gj(jobId);
  if (!job) throw new Error("Unknown job");
  const now = nowIso();
  if (!session) {
    const id = uuid();
    await query.run(
      `INSERT INTO sessions (id, job_id, assessor_id, started_at, client_joined_at, reconnect_count)
      VALUES (?,?,?,?,?,?)`,
      id, jobId, a.id === "system" ? null : a.id, now, now, 0);
    session = (await getActiveSession(jobId))!;
    await logEvent(jobId, a, "session_started", { session_id: id });
  } else if (!session.client_joined_at) {
    await query.run("UPDATE sessions SET client_joined_at=? WHERE id=?", now, session.id);
  }
  if (job.status === "Scheduled") await changeStatus(jobId, "In progress", a);
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
  return { sessionId: session.id };
}

export async function endSessionAction(jobId: string, outcome: "Awaiting evidence" | "Awaiting report") {
  const a = await requireRole("assessor");
  const { getActiveSession, getJob } = await import("./data");
  const session = await getActiveSession(jobId);
  const now = nowIso();
  if (session) await query.run("UPDATE sessions SET ended_at=? WHERE id=?", now, session.id);
  await logEvent(jobId, a, "session_ended", { session_id: session?.id, outcome });
  const job = await getJob(jobId);
  if (job?.status === "Scheduled") await changeStatus(jobId, "In progress", a);
  await changeStatus(jobId, outcome, a);
  revalidatePath(`/jobs/${jobId}`); revalidatePath("/admin"); revalidatePath("/assessor");
}

export async function sessionNetworkEventAction(jobId: string, kind: "client_disconnected" | "client_reconnected") {
  const a = await requireRole("assessor");
  const { getActiveSession } = await import("./data");
  const session = await getActiveSession(jobId);
  if (kind === "client_reconnected" && session)
    await query.run("UPDATE sessions SET reconnect_count = reconnect_count + 1 WHERE id=?", session.id);
  await logEvent(jobId, a, kind, { session_id: session?.id });
}

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
  const a = await requireRole("assessor");
  const { getActiveSession } = await import("./data");
  const session = await getActiveSession(jobId);
  const now = nowIso();
  const existing = await query.get<{ id: string; state: string }>(
    "SELECT id, state FROM checklist_responses WHERE job_id=? AND item_key=?", jobId, itemKey);
  const id = existing?.id ?? uuid();
  if (!existing)
    await query.run(
      "INSERT INTO checklist_responses (id, job_id, item_key, state, updated_at) VALUES (?,?,?,?,?)",
      id, jobId, itemKey, "pending", now);

  if (patch.answer !== undefined) {
    await query.run(
      "UPDATE checklist_responses SET answer=?, state=CASE WHEN state IN ('pending','answered') THEN 'answered' ELSE state END, session_id=?, updated_at=? WHERE id=?",
      JSON.stringify(patch.answer), session?.id ?? null, now, id);
    await logEvent(jobId, a, "response_recorded", { item_key: itemKey });
  }
  if (patch.note !== undefined)
    await query.run("UPDATE checklist_responses SET note=?, updated_at=? WHERE id=?", patch.note, now, id);
  if (patch.concernFlag !== undefined) {
    await query.run(
      "UPDATE checklist_responses SET concern_flag=?, concern_note=?, updated_at=? WHERE id=?",
      patch.concernFlag ? 1 : 0, patch.concernNote ?? null, now, id);
    await logEvent(jobId, a, patch.concernFlag ? "concern_flagged" : "concern_cleared", { item_key: itemKey });
  }
  if (patch.missing !== undefined) {
    await query.run(
      "UPDATE checklist_responses SET state=?, missing_reason=?, updated_at=? WHERE id=?",
      patch.missing.flag ? "missing" : "pending", patch.missing.flag ? (patch.missing.reason ?? "not available") : null, now, id);
    await logEvent(jobId, a, patch.missing.flag ? "item_flagged_missing" : "item_missing_cleared",
      { item_key: itemKey, reason: patch.missing.reason });
  }
}

export async function saveCaptureAction(jobId: string, itemKey: string | null, label: string, formData: FormData): Promise<{ id: string }> {
  const a = await requireRole("assessor");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Empty capture");
  const { getActiveSession } = await import("./data");
  const { saveUpload } = await import("./storage");
  const session = await getActiveSession(jobId);
  const id = uuid();
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  const fileKey = await saveUpload(id, mime, bytes);
  const hash = sha256(bytes);
  const now = nowIso();
  const metadata = JSON.stringify({ filename: file.name, size: file.size, mime, captured_at: now });
  await query.run(
    `INSERT INTO evidence_items
      (id, job_id, session_id, item_key, kind, file_key, mime_type, byte_size, label, captured_at, is_featured, sort_order, sha256, original_metadata)
    VALUES (?,?,?,?,?,?,?,?,?,?,0,0,?,?)`,
    id, jobId, session?.id ?? null, itemKey, "frame_capture", fileKey, mime, file.size, label, now, hash, metadata);
  await logEvent(jobId, a, "evidence_captured", { evidence_id: id, item_key: itemKey ?? "UNFILED", sha256: hash });
  revalidatePath(`/jobs/${jobId}/evidence`);
  return { id };
}

export async function uploadEvidenceAction(
  token: string,
  itemKey: string,
  formData: FormData,
  kind: "client_upload" | "highres_client_photo" = "client_upload"
): Promise<{ id: string } | { error: string; needsOtp?: boolean }> {
  // F16: link must be active (valid — NOT expired/revoked/cancelled) and OTP-verified for this exact link.
  // Expected failures are RETURNED (production hides thrown messages from the browser).
  const acc = await checkClientAccess(token, { allowedStates: ["valid"] });
  if (!acc.ok)
    return acc.reason === "otp"
      ? { error: "Please verify your phone number to continue.", needsOtp: true }
      : { error: "This link is no longer active. Please ask for a new one." };
  const info = { job: acc.job };
  if (kind !== "client_upload" && kind !== "highres_client_photo") return { error: "That upload type isn’t supported." };
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file was received. Please try again." };
  const { ALLOWED_UPLOAD_MIMES, MAX_UPLOAD_BYTES, saveUpload } = await import("./storage");
  if (file.size > MAX_UPLOAD_BYTES) return { error: uploadTooLargeMessage() };
  if (!ALLOWED_UPLOAD_MIMES.includes(file.type)) return { error: "Please upload a photo or PDF." };

  const id = uuid();
  const bytes = Buffer.from(await file.arrayBuffer());
  const fileKey = await saveUpload(id, file.type, bytes);
  const hash = sha256(bytes);
  const now = nowIso();
  const metadata = JSON.stringify({ filename: file.name, size: file.size, mime: file.type, captured_at: now });
  const labelPrefix = kind === "highres_client_photo" ? "High-res client photo" : "Client upload";
  await query.run(
    `INSERT INTO evidence_items
      (id, job_id, item_key, kind, file_key, mime_type, byte_size, label, captured_at, is_featured, sort_order, sha256, original_metadata)
    VALUES (?,?,?,?,?,?,?,?,?,0,0,?,?)`,
    id, info.job.id, itemKey, kind, fileKey, file.type, file.size,
    `${labelPrefix} – ${itemKey} – ${now.slice(11)}`, now, hash, metadata);
  await logEvent(info.job.id, CLIENT_ACTOR,
    kind === "highres_client_photo" ? "highres_photo_received" : "upload_received",
    { evidence_id: id, item_key: itemKey, bytes: file.size, mime: file.type, sha256: hash });
  const resolved = await query.run(
    "UPDATE checklist_responses SET state='resolved', updated_at=? WHERE job_id=? AND item_key=? AND state='missing'",
    nowIso(), info.job.id, itemKey);
  if (resolved.changes > 0)
    await logEvent(info.job.id, CLIENT_ACTOR, "missing_item_resolved", { item_key: itemKey, evidence_id: id });
  revalidatePath(`/c/${token}/upload`);
  revalidatePath(`/jobs/${info.job.id}/evidence`);
  revalidatePath(`/jobs/${info.job.id}`);
  return { id };
}
