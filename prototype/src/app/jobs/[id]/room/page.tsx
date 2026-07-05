// S12 wrapper — DB-fed since 1B; UI remains the 1A static mock until Chunk 1D.
import { RoomMock } from "@/components/RoomMock";
import { getJob, getTemplate, getClient } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LiveRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return <div className="p-8 text-slate-500">Unknown job.</div>;
  const tpl = getTemplate(job.template_id)!;
  const client = getClient(job.client_id);

  return (
    <RoomMock
      jobId={job.id}
      jobNumber={job.job_number}
      clientName={client?.full_name ?? "—"}
      templateName={tpl.name}
      templateVersion={job.template_version}
      sections={tpl.sections}
    />
  );
}
