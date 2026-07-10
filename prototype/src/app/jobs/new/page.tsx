// S5 — Create job (DB-backed via server action, Chunk 1B).
import { StaffShell } from "@/components/Chrome";
import { listTemplates, listUsers } from "@/lib/data";
import { CreateJobForm } from "@/components/CreateJobForm";

export const dynamic = "force-dynamic";

export default async function CreateJob() {
  const templates = await listTemplates();
  const assessors = await listUsers("assessor");
  return (
    <StaffShell title="Create job">
      <CreateJobForm
        templates={templates.map((t) => ({ id: t.id, name: t.name, version: t.version, job_type: t.job_type, is_reference_only: t.is_reference_only, is_limited: t.is_limited, sections: t.sections }))}
        assessors={assessors}
      />
    </StaffShell>
  );
}
