// Seeds the prototype DB from the 1A fixture data (Chunk 1B; widened in 1F to
// the multi-assessment + survey book of demo jobs).
// ALL DATA IS FAKE / ROLE-PLAY — no real client data permitted (phase0 D-09).
import type { Database } from "better-sqlite3";
import { users, clients, templates, jobs, evidence, seedResponses, templateById } from "./fixtures";

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

export function runSeed(db: Database) {
  const tx = db.transaction(() => {
    for (const u of users)
      db.prepare("INSERT INTO users (id,name,role,title) VALUES (?,?,?,?)").run(u.id, u.name, u.role, u.title);

    for (const c of clients)
      db.prepare("INSERT INTO clients (id,full_name,phone,email,language,created_at) VALUES (?,?,?,?,?,?)")
        .run(c.id, c.name, c.phone, c.email, c.language, now());

    for (const t of templates)
      db.prepare(
        "INSERT INTO checklist_templates (id,name,claim_type,job_type,version,is_active,is_reference_only,is_limited,structure) VALUES (?,?,?,?,?,?,?,?,?)"
      ).run(t.id, t.name, t.claimType, t.jobType, t.version, t.referenceOnly ? 0 : 1, t.referenceOnly ? 1 : 0, t.limited ? 1 : 0, JSON.stringify(t.sections));

    const insJob = db.prepare(`INSERT INTO jobs
      (id,job_number,job_type,claim_type,template_id,template_version,client_id,assessor_id,priority,
       claim_number,policy_number,date_of_loss,description,special_conditions,status,outcome,
       attempt_count,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insEvent = db.prepare(
      "INSERT INTO event_log (id,job_id,actor,actor_role,event_type,data,occurred_at) VALUES (?,?,?,?,?,?,?)"
    );
    const insAppt = db.prepare(`INSERT INTO appointments
      (id,job_id,attempt_number,scheduled_start,duration_minutes,status,no_show_reason,link_token,link_expires_at,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`);

    for (const j of jobs) {
      insJob.run(
        j.id, j.jobNumber, j.jobType ?? "assessment", j.claimType, j.templateId,
        templateById(j.templateId)?.version ?? "0.2", j.clientId, j.assessorId ?? null,
        j.priority, j.claimNumber, j.policyNumber, j.dateOfLoss, j.description,
        j.specialConditions ?? null, j.status, j.outcome ?? null, j.attempt,
        now(), now()
      );
      // Seed timelines from fixture events (workflow history for the demo jobs).
      for (const e of j.events)
        insEvent.run(crypto.randomUUID(), j.id, e.actor, null, "seed_history", JSON.stringify({ text: e.text }), e.at);

      // Appointments for jobs whose status implies one.
      if (j.token || j.status === "No-show") {
        const apptStatus =
          j.status === "No-show" ? "no_show"
          : j.status === "Awaiting evidence" || j.status === "In progress" ? "completed"
          : "scheduled";
        insAppt.run(
          crypto.randomUUID(), j.id, Math.max(j.attempt, 1),
          j.scheduledStart ?? "2026-07-03 10:00", j.durationMin ?? 45,
          j.status === "In progress" ? "scheduled" : apptStatus,
          j.status === "No-show" ? "did_not_join" : null,
          j.token ?? null, "2026-12-31 23:59", now()
        );
      }
    }

    // j6 gets an upload token so /c/demo-upload/upload resolves.
    insAppt.run(crypto.randomUUID(), "j6", 1, "2026-07-02 14:00", 45, "completed", null, "demo-upload", "2026-12-31 23:59", now());

    for (const e of evidence)
      db.prepare(`INSERT INTO evidence_items
        (id,job_id,item_key,kind,label,captured_at,is_featured,sort_order,hue)
        VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(e.id, e.jobId, e.itemKey ?? null, e.kind, e.label, e.capturedAt, e.featured ? 1 : 0, 0, e.hue);

    // Checklist responses: answers/notes/concerns feed the report prefills;
    // 'missing' rows drive Awaiting evidence + the upload page.
    for (const r of seedResponses)
      db.prepare(`INSERT INTO checklist_responses
        (id,job_id,item_key,answer,note,concern_flag,concern_note,state,missing_reason,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(
          crypto.randomUUID(), r.jobId, r.itemKey,
          r.answer !== undefined ? JSON.stringify(r.answer) : null,
          r.note ?? null, r.concernFlag ? 1 : 0, r.concernNote ?? null,
          r.state ?? (r.answer !== undefined ? "answered" : "pending"),
          r.missingReason ?? null, now()
        );

    // Report rows for jobs in report states.
    const insReport = db.prepare(`INSERT INTO reports
      (id,job_id,version,status,submitted_at,submitted_by,reviewed_at,reviewed_by,review_comments)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    insReport.run(crypto.randomUUID(), "j8", 1, "submitted", "2026-07-03 16:05", "Sipho Demo", null, null, null);
    insReport.run(crypto.randomUUID(), "j9", 1, "returned", "2026-07-03 08:30", "Anje Demo", "2026-07-03 09:40", "Craig Demo",
      JSON.stringify({ cause: "State the mechanism basis for the cause finding." }));
    insReport.run(crypto.randomUUID(), "j10", 1, "returned", "2026-07-02 09:00", "Sipho Demo", "2026-07-02 11:00", "Craig Demo",
      JSON.stringify({ summary: "Tighten the summary." }));
    insReport.run(crypto.randomUUID(), "j10", 2, "approved", "2026-07-02 14:00", "Sipho Demo", "2026-07-02 15:30", "Craig Demo", null);
    // Survey report in the manager queue (report variant demo).
    insReport.run(crypto.randomUUID(), "j16", 1, "submitted", "2026-07-04 10:15", "Sipho Demo", null, null, null);

    // Live session row for j5 (In progress) — sessions table exercised for 1D/1E.
    db.prepare(`INSERT INTO sessions (id,job_id,assessor_id,started_at,client_joined_at,consent_name,consent_accepted_at,consent_text_version)
      VALUES (?,?,?,?,?,?,?,?)`)
      .run(crypto.randomUUID(), "j5", "u-sipho", "2026-07-04 09:02", "2026-07-04 09:01", "Test Insured 05", "2026-07-04 09:00", "draft-1");
  });
  tx();
}
