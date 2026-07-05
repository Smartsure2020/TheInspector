// S5 — Create job (DB-backed via server action, Chunk 1B).
import { StaffShell } from "@/components/Chrome";
import { listTemplates, listUsers } from "@/lib/data";
import { CreateJobForm } from "@/components/CreateJobForm";

export const dynamic = "force-dynamic";

export default function CreateJob() {
  return (
    <StaffShell title="Create assessment job">
      <CreateJobForm
        templates={listTemplates().map((t) => ({ id: t.id, name: t.name, version: t.version, is_reference_only: t.is_reference_only, sections: t.sections }))}
        assessors={listUsers("assessor")}
      />
    </StaffShell>
  );
}
