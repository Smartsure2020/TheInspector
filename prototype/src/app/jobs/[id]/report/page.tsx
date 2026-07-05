// S15 — Report builder (DB-backed reads + real submit action, Chunk 1B).
// Content editing/PDF generation arrive in Chunk 1H.
import Link from "next/link";
import { StaffShell, PhotoTile } from "@/components/Chrome";
import { getJob, getClient, listEvidence, listReports, missingItems } from "@/lib/data";
import { submitReportAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

const sections = [
  ["Summary", "editable"], ["Claim particulars", "auto"], ["Circumstances of loss", "pre-filled + editable"],
  ["Assessment findings", "pre-filled + editable"], ["Cause of loss", "editable"],
  ["Limitations & outstanding items", "AUTO — non-removable"], ["Conclusion & recommendation", "editable"],
  ["Evidence index", "auto"], ["Sign-off block", "auto"],
] as const;

export default async function ReportBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return <StaffShell title="Report"><p className="text-sm text-slate-500">Unknown job.</p></StaffShell>;
  const client = getClient(job.client_id);
  const featured = listEvidence(id).filter((e) => e.is_featured);
  const missing = missingItems(id);
  const reports = listReports(id);
  const submitWithId = submitReportAction.bind(null, id);

  return (
    <StaffShell title={`Report builder — ${job.job_number}`}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 mb-3">
            Report builder <span className="text-xs font-normal text-amber-700">(narrative editing + PDF arrive in Chunk 1H)</span>
          </h1>
          <div className="space-y-2">
            {sections.map(([name, mode]) => (
              <div key={name} className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center">
                <span className="text-sm text-slate-700">{name}</span>
                <span className={`ml-auto text-[10px] rounded px-1.5 py-0.5 ${mode.startsWith("AUTO") ? "bg-slate-800 text-white" : mode === "auto" ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700"}`}>{mode}</span>
              </div>
            ))}
          </div>

          {reports.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3">
              <h3 className="text-xs font-semibold text-slate-600 mb-1">Versions</h3>
              {reports.map((r) => (
                <div key={r.id} className="text-xs text-slate-500">
                  v{r.version} — {r.status}{r.submitted_at ? ` · submitted ${r.submitted_at} by ${r.submitted_by}` : ""}{r.reviewed_by ? ` · reviewed by ${r.reviewed_by}` : ""}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-4 items-center">
            {job.status === "Awaiting report" ? (
              <form action={submitWithId}>
                <button type="submit" className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">Submit for review</button>
              </form>
            ) : (
              <span className="text-xs text-slate-500">Submit available when status is <b>Awaiting report</b> (currently {job.status}).</span>
            )}
            <Link href={`/jobs/${job.id}/report/final`} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm">View report page →</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 text-sm">
          <div className="text-center border-b border-slate-200 pb-4 mb-4">
            <div className="text-[10px] tracking-widest text-slate-400">ACORN — PLACEHOLDER BRANDING · PROTOTYPE</div>
            <h2 className="text-lg font-bold text-slate-800 mt-1">Virtual Assessment Report</h2>
            <p className="text-xs text-slate-500">{job.claim_number} · {client?.full_name} · {job.date_of_loss}</p>
          </div>
          <h3 className="font-semibold text-slate-700 text-xs uppercase">Summary</h3>
          <p className="text-xs text-slate-600 mt-1 mb-3">
            {job.claim_type === "geyser_water"
              ? "Virtual assessment of reported geyser failure and resultant water damage. [Assessor summary text…]"
              : "Virtual assessment of reported accidental damage. [Assessor summary text…]"}
          </p>
          <h3 className="font-semibold text-slate-700 text-xs uppercase">Findings (featured evidence)</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {featured.map((e, i) => (
              <div key={e.id}>
                <PhotoTile hue={e.hue ?? 200} />
                <p className="text-[10px] text-slate-500 mt-0.5">Fig {i + 1} — {e.label}</p>
              </div>
            ))}
            {featured.length === 0 && <p className="text-xs text-slate-400 col-span-2">No featured evidence on this job.</p>}
          </div>
          <h3 className="font-semibold text-slate-700 text-xs uppercase mt-3">Limitations & outstanding items</h3>
          {missing.length ? (
            <ul className="text-[11px] text-slate-500 mt-1 list-disc ml-4">
              {missing.map((m) => <li key={m.item_key}>{m.item_key} — {m.missing_reason}</li>)}
            </ul>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1">Auto-generated from skipped/missing/triggered items. Non-removable.</p>
          )}
          <p className="text-[10px] text-slate-400 mt-4">Assessor: {job.assessor_name ?? "—"} · Reviewed by: ______ · PROTOTYPE</p>
        </div>
      </div>
    </StaffShell>
  );
}
