// S12 assessor wrapper — feeds the provider-agnostic AssessorRoom from the DB.
import { AssessorRoom } from "@/components/AssessorRoom";
import { getJob, getTemplate, getClient, listResponses, evidenceCountByItem, getActiveSession } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LiveRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return <div className="p-8 text-slate-500">Unknown job.</div>;
  const tpl = getTemplate(job.template_id)!;
  const client = getClient(job.client_id);

  const initialResponses = Object.fromEntries(
    listResponses(id).map((r) => [
      r.item_key,
      {
        answer: r.answer ? JSON.parse(r.answer) : undefined,
        note: r.note ?? undefined,
        concernFlag: !!r.concern_flag,
        concernNote: r.concern_note ?? undefined,
        missing: r.state === "missing",
        missingReason: r.missing_reason ?? undefined,
      },
    ])
  );

  return (
    <AssessorRoom
      jobId={job.id}
      jobNumber={job.job_number}
      clientName={client?.full_name ?? "—"}
      templateName={tpl.name}
      templateVersion={job.template_version}
      sections={tpl.sections}
      initialResponses={initialResponses}
      initialCounts={evidenceCountByItem(id)}
      hasActiveSession={!!getActiveSession(id)}
      jobStatus={job.status}
    />
  );
}
