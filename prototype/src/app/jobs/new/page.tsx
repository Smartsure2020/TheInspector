import { StaffShell } from "@/components/Chrome";
import { listTemplates, listUsers } from "@/lib/data";
import { CreateJobForm } from "@/components/CreateJobForm";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CreateJob() {
  const user = await requireRole("admin");
  const templates = await listTemplates();
  const assessors = await listUsers("assessor");
  const allMandates = await query.all<{ user_id: string; template_id: string }>(
    "SELECT user_id, template_id FROM user_template_mandates",
  );
  const mandates: Record<string, string[]> = {};
  for (const m of allMandates) {
    (mandates[m.user_id] ??= []).push(m.template_id);
  }
  return (
    <StaffShell title="Create job" user={user}>
      <CreateJobForm
        templates={templates.map((t) => ({ id: t.id, name: t.name, version: t.version, job_type: t.job_type, is_reference_only: t.is_reference_only, is_limited: t.is_limited, sections: t.sections }))}
        assessors={assessors}
        mandates={mandates}
      />
    </StaffShell>
  );
}
