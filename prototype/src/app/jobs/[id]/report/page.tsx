// S15 — Report builder (Chunk 1E): narratives prefilled from checklist
// answers/notes/concerns, editable + autosaved; auto sections rendered
// read-only (Limitations non-removable). Submit snapshots the version.
import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { ReportEditor } from "@/components/ReportEditor";
import { getJob, listReports } from "@/lib/data";
import { Fragment } from "react";
import { buildReportModel, initialNarrative } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function ReportBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return <StaffShell title="Report"><p className="text-sm text-slate-500">Unknown job.</p></StaffShell>;
  const model = buildReportModel(id)!;
  const reports = listReports(id);
  const latest = reports.at(-1);
  const { narrative } = initialNarrative(id, model);

  const canSubmit = job.status === "Awaiting report" || job.status === "Returned for correction";
  const readOnly = job.status === "Report completed" || job.status === "Report submitted" || job.status === "Cancelled";
  const returnedComments =
    latest?.status === "returned" && latest.review_comments
      ? (Object.values(JSON.parse(latest.review_comments)) as string[]).join("\n")
      : undefined;

  return (
    <StaffShell title={`Report builder — ${job.job_number}`}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-xl font-semibold text-slate-800">Report builder</h1>
            <span className="text-xs text-slate-400">{job.status}</span>
            <Link href={`/jobs/${id}/report/final`} className="ml-auto text-xs text-blue-700 hover:underline">View report page →</Link>
          </div>

          {!canSubmit && !readOnly && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              Submit becomes available at status <b>Awaiting report</b> (currently {job.status}). You can draft now.
            </p>
          )}
          {job.status === "Report submitted" && (
            <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2 mb-3">
              Version {latest?.version} is with the manager — editing reopens if it is returned.
            </p>
          )}
          {job.status === "Report completed" && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mb-3">
              Approved and locked — see the <Link href={`/jobs/${id}/report/final`} className="underline">report page</Link>.
            </p>
          )}

          <ReportEditor
            jobId={id}
            sections={model.sections.map((s) => ({ key: s.key, title: s.title }))}
            initial={{ ...narrative }}
            canSubmit={canSubmit}
            submitLabel={job.status === "Returned for correction" ? "Resubmit for review" : "Submit for review"}
            returnedComments={returnedComments}
            readOnly={readOnly}
          />

          {reports.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3">
              <h3 className="text-xs font-semibold text-slate-600 mb-1">Versions</h3>
              {reports.map((r) => (
                <div key={r.id} className="text-xs text-slate-500 py-0.5">
                  v{r.version} — {r.status}
                  {r.submitted_at ? ` · submitted ${r.submitted_at} by ${r.submitted_by}` : ""}
                  {r.reviewed_by ? ` · reviewed by ${r.reviewed_by}` : ""}
                  {r.status === "returned" && r.review_comments ? ` · "${(Object.values(JSON.parse(r.review_comments)) as string[]).join(" ")}"` : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live preview of the auto sections the submit will lock in */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 text-sm h-fit">
          <div className="text-center border-b border-slate-200 pb-4 mb-4">
            <div className="text-[10px] tracking-widest text-slate-400">ACORN — PLACEHOLDER BRANDING · PROTOTYPE OUTPUT ONLY</div>
            <h2 className="text-lg font-bold text-slate-800 mt-1">{model.docTitle}</h2>
            <p className="text-xs text-slate-500">{model.cover.claimNumber} · {model.cover.clientName} · {model.cover.dateOfLoss}</p>
            <p className="text-[10px] text-slate-400 mt-1">{model.cover.templateName} v{model.cover.templateVersion} · {model.cover.jobNumber}</p>
          </div>

          <h3 className="font-semibold text-slate-700 text-xs uppercase">{model.jobType === "survey" ? "Survey particulars" : "Claim particulars"} <span className="text-slate-400 font-normal normal-case">(auto)</span></h3>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-600 mt-1 mb-3">
            {model.particulars.map(([k, v]) => (<Fragment key={k}><dt className="text-slate-400">{k}</dt><dd>{v}</dd></Fragment>))}
          </dl>

          <h3 className="font-semibold text-slate-700 text-xs uppercase">Featured evidence → report figures</h3>
          <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
            {model.featured.map((e, i) => (
              <div key={e.id}>
                {e.hasFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/files/${e.id}`} alt={e.label} className="h-20 w-full object-cover rounded-md" />
                ) : (
                  <div className="h-20 rounded-md" style={{ background: `linear-gradient(135deg, hsl(${e.hue ?? 200} 45% 55%), hsl(${e.hue ?? 200} 45% 30%))` }} />
                )}
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">Fig {i + 1} — {e.label}</p>
              </div>
            ))}
            {model.featured.length === 0 && (
              <p className="text-xs text-slate-400 col-span-3">No featured evidence — star items in the <Link href={`/jobs/${id}/evidence`} className="underline">gallery</Link>.</p>
            )}
          </div>

          <h3 className="font-semibold text-slate-700 text-xs uppercase">{model.jobType === "survey" ? "Survey limitations" : "Limitations & outstanding items"} <span className="bg-slate-800 text-white rounded px-1 normal-case font-normal">AUTO — non-removable</span></h3>
          <ul className="text-[11px] text-slate-600 mt-1 mb-3 list-disc ml-4 space-y-0.5">
            {model.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>

          <h3 className="font-semibold text-slate-700 text-xs uppercase">Evidence index <span className="text-slate-400 font-normal normal-case">(auto — {model.evidenceIndex.length} items)</span></h3>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">Every evidence item is indexed with section, checklist item and timestamp; the full table renders on the report page.</p>

          <h3 className="font-semibold text-slate-700 text-xs uppercase">Sign-off <span className="text-slate-400 font-normal normal-case">(auto)</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">Assessor: {model.cover.assessorName} · Reviewed by: {latest?.reviewed_by ?? "______"} · PROTOTYPE</p>
        </div>
      </div>
    </StaffShell>
  );
}
