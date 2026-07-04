"use client";
// S15 — Report builder (static mock, 1A): section list + live-preview concept.
import { useParams } from "next/navigation";
import Link from "next/link";
import { StaffShell, PhotoTile } from "@/components/Chrome";
import { jobById, clientById, userById, evidenceForJob } from "@/lib/fixtures";

const sections = [
  ["Summary", "editable"],
  ["Claim particulars", "auto"],
  ["Circumstances of loss", "pre-filled + editable"],
  ["Assessment findings", "pre-filled + editable"],
  ["Cause of loss", "editable"],
  ["Limitations & outstanding items", "AUTO — non-removable"],
  ["Conclusion & recommendation", "editable"],
  ["Evidence index", "auto"],
  ["Sign-off block", "auto"],
] as const;

export default function ReportBuilder() {
  const { id } = useParams<{ id: string }>();
  const job = jobById(id);
  if (!job) return <StaffShell title="Report"><p>Unknown job.</p></StaffShell>;
  const featured = evidenceForJob(job.id).filter((e) => e.featured);

  return (
    <StaffShell title={`Report builder — ${job.jobNumber}`}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 mb-3">Report builder <span className="text-xs font-normal text-amber-700">(static shell — generation in Chunk 1H)</span></h1>
          <div className="space-y-2">
            {sections.map(([name, mode]) => (
              <div key={name} className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center">
                <span className="text-sm text-slate-700">{name}</span>
                <span className={`ml-auto text-[10px] rounded px-1.5 py-0.5 ${mode.startsWith("AUTO") ? "bg-slate-800 text-white" : mode === "auto" ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700"}`}>{mode}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm" onClick={() => alert("Draft save arrives in Chunk 1H.")}>Save draft</button>
            <button className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => alert("PDF generation arrives in Chunk 1H.")}>Generate PDF</button>
            <Link href={`/jobs/${job.id}/report/final`} className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">Preview completed page →</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 text-sm">
          <div className="text-center border-b border-slate-200 pb-4 mb-4">
            <div className="text-[10px] tracking-widest text-slate-400">ACORN — PLACEHOLDER BRANDING · PROTOTYPE</div>
            <h2 className="text-lg font-bold text-slate-800 mt-1">Virtual Assessment Report</h2>
            <p className="text-xs text-slate-500">{job.claimNumber} · {clientById(job.clientId)?.name} · {job.dateOfLoss}</p>
          </div>
          <h3 className="font-semibold text-slate-700 text-xs uppercase">Summary</h3>
          <p className="text-xs text-slate-600 mt-1 mb-3">
            {job.claimType === "geyser_water"
              ? "Virtual assessment of reported geyser failure and resultant water damage. [Assessor summary text…]"
              : "Virtual assessment of reported accidental damage. [Assessor summary text…]"}
          </p>
          <h3 className="font-semibold text-slate-700 text-xs uppercase">Findings (featured evidence)</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {featured.map((e, i) => (
              <div key={e.id}>
                <PhotoTile hue={e.hue} />
                <p className="text-[10px] text-slate-500 mt-0.5">Fig {i + 1} — {e.label}</p>
              </div>
            ))}
            {featured.length === 0 && <p className="text-xs text-slate-400 col-span-2">No featured evidence on this job (see INS-2026-0006 / 0010).</p>}
          </div>
          <h3 className="font-semibold text-slate-700 text-xs uppercase mt-3">Limitations & outstanding items</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {job.missingItemKeys?.length
              ? `${job.missingItemKeys.length} item(s) outstanding — auto-listed here with reasons.`
              : "Auto-generated from skipped/missing/triggered items. Non-removable."}
          </p>
          <p className="text-[10px] text-slate-400 mt-4">Assessor: {userById(job.assessorId)?.name ?? "—"} · Reviewed by: ______ · v1 · PROTOTYPE</p>
        </div>
      </div>
    </StaffShell>
  );
}
