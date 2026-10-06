// S12 assessor wrapper — feeds the provider-agnostic AssessorRoom from the DB.
import Link from "next/link";
import { AssessorRoom } from "@/components/AssessorRoom";
import { Icon } from "@/components/ui/Icon";
import { getJob, getTemplate, getClient, listResponses, evidenceCountByItem, getActiveSession } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LiveRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-page p-8 text-center">
        <Icon name="search" size={26} className="text-muted-light" />
        <p className="text-base font-semibold text-foreground">We can’t find that job</p>
        <p className="max-w-sm text-sm text-muted">
          The live room needs a job that exists. Everything in this build is seeded
          demo data.
        </p>
        <Link href="/assessor" className="text-sm text-accent underline">Back to my dashboard</Link>
      </div>
    );

  const tpl = (await getTemplate(job.template_id))!;
  const client = await getClient(job.client_id);

  const initialResponses = Object.fromEntries(
    (await listResponses(id)).map((r) => [
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
      initialCounts={await evidenceCountByItem(id)}
      hasActiveSession={!!(await getActiveSession(id))}
      jobStatus={job.status}
    />
  );
}
