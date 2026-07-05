// S16 — Report page with version history (DB-backed, Chunk 1B).
// Manager approve/return remains a clean stub until Chunk 1I.
import { StaffShell, StatusChip } from "@/components/Chrome";
import { getJob, getClient, listReports } from "@/lib/data";
import { ManagerStub } from "@/components/ManagerStub";

export const dynamic = "force-dynamic";

export default async function CompletedReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return <StaffShell title="Report"><p className="text-sm text-slate-500">Unknown job.</p></StaffShell>;
  const client = getClient(job.client_id);
  const reports = listReports(id);
  const latest = reports.at(-1);

  return (
    <StaffShell title={`Report — ${job.job_number}`}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-semibold text-slate-800">
            {latest ? `Report v${latest.version} (${latest.status})` : "No report yet"}
          </h1>
          <StatusChip status={job.status} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
            PDF preview placeholder — generation arrives in Chunk 1H
          </div>
          <div className="flex gap-2 mt-3">
            <button disabled className="bg-slate-300 text-white rounded-lg px-4 py-2 text-sm cursor-not-allowed" title="Chunk 1H">Download PDF</button>
            <button disabled className="bg-white border border-slate-200 text-slate-400 rounded-lg px-4 py-2 text-sm cursor-not-allowed" title="Chunk 1H">Download evidence pack</button>
          </div>
        </div>

        {reports.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Version history</h2>
            {reports.map((r) => (
              <div key={r.id} className="text-xs text-slate-600 flex gap-2 py-1 border-b border-slate-50 last:border-0">
                <span className="font-medium">v{r.version}</span>
                <span className={`rounded-full px-2 ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "returned" ? "bg-rose-100 text-rose-800" : "bg-violet-100 text-violet-800"}`}>{r.status}</span>
                {r.submitted_at && <span>submitted {r.submitted_at} by {r.submitted_by}</span>}
                {r.reviewed_by && <span>· reviewed by {r.reviewed_by}</span>}
                {r.review_comments && <span className="text-rose-600">· comments: {Object.values(JSON.parse(r.review_comments)).join(" ")}</span>}
              </div>
            ))}
          </div>
        )}

        <ManagerStub jobStatus={job.status} assessorName={job.assessor_name ?? "—"} clientName={client?.full_name ?? "—"} />
      </div>
    </StaffShell>
  );
}
