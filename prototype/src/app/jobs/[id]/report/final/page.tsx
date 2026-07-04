"use client";
// S16 — Completed report page + manager review actions (static mock, 1A; real flow 1I).
import { useParams } from "next/navigation";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { jobById, clientById, userById } from "@/lib/fixtures";
import { useRole } from "@/lib/role";

export default function CompletedReport() {
  const { id } = useParams<{ id: string }>();
  const job = jobById(id);
  const { user } = useRole();
  if (!job) return <StaffShell title="Report"><p>Unknown job.</p></StaffShell>;

  const approved = job.status === "Report completed";

  return (
    <StaffShell title={`Report — ${job.jobNumber}`}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-semibold text-slate-800">Report {approved ? "v2 (approved)" : "v1 (submitted)"}</h1>
          <StatusChip status={job.status} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
            PDF preview placeholder — generation arrives in Chunk 1H
          </div>
          <div className="flex gap-2 mt-3">
            <button className="bg-slate-800 text-white rounded-lg px-4 py-2 text-sm" onClick={() => alert("PDF download arrives in Chunk 1H.")}>Download PDF</button>
            <button className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm" onClick={() => alert("Evidence pack (ZIP + appendix) arrives in Chunk 1H.")}>Download evidence pack</button>
          </div>
        </div>

        {user?.role === "manager" && !approved && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-violet-800 mb-2">Manager review (wires up in Chunk 1I)</h2>
            <p className="text-xs text-slate-600 mb-3">
              Assessor: {userById(job.assessorId)?.name} · Client: {clientById(job.clientId)?.name} · Side-by-side review view (report + checklist + evidence) builds in 1I.
            </p>
            <div className="flex gap-2">
              <button className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => alert("Approve locks the version and finalises artefacts — Chunk 1I.")}>Approve</button>
              <button className="bg-rose-600 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => alert("Return with per-section comments — Chunk 1I.")}>Return with comments</button>
            </div>
          </div>
        )}

        {approved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            Approved by {users_manager()} — report locked. Version history: v1 returned · v2 approved. Reopen (manager only, reason logged) arrives in 1I.
          </div>
        )}
      </div>
    </StaffShell>
  );
}

function users_manager() {
  return "Craig Demo";
}
