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
  db().prepare(`INSERT INTO appointments (id,job_id,attempt_number,scheduled_start,duration_minutes,status,link_token,link_expires_at,created_at)
    VALUES (?,?,?,?,?, 'scheduled', ?,?,?)`)
    .run(uuid(), jobId, attempt, when, duration, token, "2026-12-31 23:59", now);
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
export async function consentAction(token: string, name: string) {
  const job = db().prepare("SELECT job_id FROM appointments WHERE link_token=? AND link_revoked_at IS NULL").get(token) as { job_id: string } | undefined;
  if (job) logEvent(job.job_id, CLIENT_ACTOR, "consent_accepted", { name, text_version: "draft-1" });
  redirect(`/c/${token}/check`);
}

export async function cannotAttendAction(token: string) {
  const job = db().prepare("SELECT job_id FROM appointments WHERE link_token=? AND link_revoked_at IS NULL").get(token) as { job_id: string } | undefined;
  if (job) logEvent(job.job_id, CLIENT_ACTOR, "client_requested_reschedule", {});
}
