// Seeds the prototype DB from the 1A fixture data (Chunk 1B; widened in 1F to
// the multi-assessment + survey book of demo jobs).
// ALL DATA IS FAKE / ROLE-PLAY — no real client data permitted (phase0 D-09).
import type { QueryRunner } from "./db";
import { users, clients, templates, jobs, evidence, seedResponses, templateById } from "./fixtures";
import bcrypt from "bcryptjs";
import { sha256 } from "./crypto";

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

const DEV_PASSWORD = "inspector-dev-2026";
const DEMO_EMAILS: Record<string, string> = {
  "u-lerato": "lerato@acorn.demo",
  "u-sipho": "sipho@acorn.demo",
  "u-anje": "anje@acorn.demo",
  "u-craig": "craig@acorn.demo",
};

export async function runSeed(q: QueryRunner) {
  const passwordHash = bcrypt.hashSync(DEV_PASSWORD, 10);

  await q.transaction(async (tx) => {
    for (const u of users)
      await tx.run(
        "INSERT INTO users (id,name,role,title,email,password_hash,is_active,created_at) VALUES (?,?,?,?,?,?,1,?)",
        u.id, u.name, u.role, u.title, DEMO_EMAILS[u.id] ?? null, passwordHash, now(),
      );

    for (const c of clients)
      await tx.run(
        "INSERT INTO clients (id,full_name,phone,email,language,created_at) VALUES (?,?,?,?,?,?)",
        c.id, c.name, c.phone, c.email, c.language, now());

    for (const t of templates)
      await tx.run(
        "INSERT INTO checklist_templates (id,name,claim_type,job_type,version,is_active,is_reference_only,is_limited,structure) VALUES (?,?,?,?,?,?,?,?,?)",
        t.id, t.name, t.claimType, t.jobType, t.version, t.referenceOnly ? 0 : 1, t.referenceOnly ? 1 : 0, t.limited ? 1 : 0, JSON.stringify(t.sections));

    for (const j of jobs) {
      await tx.run(
        `INSERT INTO jobs
          (id,job_number,job_type,claim_type,template_id,template_version,client_id,assessor_id,priority,
           claim_number,policy_number,date_of_loss,description,special_conditions,status,outcome,
           attempt_count,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        j.id, j.jobNumber, j.jobType ?? "assessment", j.claimType, j.templateId,
        templateById(j.templateId)?.version ?? "0.2", j.clientId, j.assessorId ?? null,
        j.priority, j.claimNumber, j.policyNumber, j.dateOfLoss, j.description,
        j.specialConditions ?? null, j.status, j.outcome ?? null, j.attempt,
        now(), now());

      for (const e of j.events)
        await tx.run(
          "INSERT INTO event_log (id,job_id,actor,actor_role,event_type,data,occurred_at) VALUES (?,?,?,?,?,?,?)",
          crypto.randomUUID(), j.id, e.actor, null, "seed_history", JSON.stringify({ text: e.text }), e.at);

      if (j.token || j.status === "No-show") {
        const apptStatus =
          j.status === "No-show" ? "no_show"
          : j.status === "Awaiting evidence" || j.status === "In progress" ? "completed"
          : "scheduled";
        const tokenHash = j.token ? sha256(j.token) : null;
        await tx.run(
          `INSERT INTO appointments
            (id,job_id,attempt_number,scheduled_start,duration_minutes,status,no_show_reason,link_token,link_token_hash,link_expires_at,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          crypto.randomUUID(), j.id, Math.max(j.attempt, 1),
          j.scheduledStart ?? "2026-07-03 10:00", j.durationMin ?? 45,
          j.status === "In progress" ? "scheduled" : apptStatus,
          j.status === "No-show" ? "did_not_join" : null,
          j.token ?? null, tokenHash, "2026-12-31 23:59", now());
      }
    }

    // j6 gets an upload token so /c/demo-upload/upload resolves.
    await tx.run(
      `INSERT INTO appointments
        (id,job_id,attempt_number,scheduled_start,duration_minutes,status,no_show_reason,link_token,link_token_hash,link_expires_at,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      crypto.randomUUID(), "j6", 1, "2026-07-02 14:00", 45, "completed", null, "demo-upload", sha256("demo-upload"), "2026-12-31 23:59", now());

    for (const e of evidence)
      await tx.run(
        `INSERT INTO evidence_items
          (id,job_id,item_key,kind,label,captured_at,is_featured,sort_order,hue)
          VALUES (?,?,?,?,?,?,?,?,?)`,
        e.id, e.jobId, e.itemKey ?? null, e.kind, e.label, e.capturedAt, e.featured ? 1 : 0, 0, e.hue);

    for (const r of seedResponses)
      await tx.run(
        `INSERT INTO checklist_responses
          (id,job_id,item_key,answer,note,concern_flag,concern_note,state,missing_reason,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
        crypto.randomUUID(), r.jobId, r.itemKey,
        r.answer !== undefined ? JSON.stringify(r.answer) : null,
        r.note ?? null, r.concernFlag ? 1 : 0, r.concernNote ?? null,
        r.state ?? (r.answer !== undefined ? "answered" : "pending"),
        r.missingReason ?? null, now());

    // Report rows for jobs in report states.
    const insReport = async (...args: unknown[]) =>
      tx.run(
        `INSERT INTO reports
          (id,job_id,version,status,submitted_at,submitted_by,reviewed_at,reviewed_by,review_comments)
          VALUES (?,?,?,?,?,?,?,?,?)`,
        ...args);
    await insReport(crypto.randomUUID(), "j8", 1, "submitted", "2026-07-03 16:05", "u-sipho", null, null, null);
    await insReport(crypto.randomUUID(), "j9", 1, "returned", "2026-07-03 08:30", "u-anje", "2026-07-03 09:40", "u-craig",
      JSON.stringify({ cause: "State the mechanism basis for the cause finding." }));
    await insReport(crypto.randomUUID(), "j10", 1, "returned", "2026-07-02 09:00", "u-sipho", "2026-07-02 11:00", "u-craig",
      JSON.stringify({ summary: "Tighten the summary." }));
    await insReport(crypto.randomUUID(), "j10", 2, "approved", "2026-07-02 14:00", "u-sipho", "2026-07-02 15:30", "u-craig", null);
    await insReport(crypto.randomUUID(), "j16", 1, "submitted", "2026-07-04 10:15", "u-sipho", null, null, null);

    await tx.run(
      `INSERT INTO sessions (id,job_id,assessor_id,started_at,client_joined_at,consent_name,consent_accepted_at,consent_text_version)
        VALUES (?,?,?,?,?,?,?,?)`,
      crypto.randomUUID(), "j5", "u-sipho", "2026-07-04 09:02", "2026-07-04 09:01", "Test Insured 05", "2026-07-04 09:00", "draft-1");

    // Seed template mandates — assessors get all active templates
    const assessors = users.filter((u) => u.role === "assessor");
    const activeTemplates = templates.filter((t) => !t.referenceOnly);
    for (const u of assessors)
      for (const t of activeTemplates)
        await tx.run(
          "INSERT INTO user_template_mandates (id,user_id,template_id,assigned_by,assigned_at) VALUES (?,?,?,?,?)",
          crypto.randomUUID(), u.id, t.id, "u-lerato", now(),
        );
  });
}
