// S2 — Admin dashboard (DB-backed, Chunk 1B).
import Link from "next/link";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { jobTypeLabel, listJobs } from "@/lib/data";

export const dynamic = "force-dynamic";

const STATUSES = ["New", "Assigned", "Scheduled", "In progress", "Awaiting evidence", "Awaiting report", "Report submitted", "Returned for correction", "Report completed", "Cancelled", "No-show"];

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const all = listJobs();
  const active = status ? all.filter((j) => j.status === status) : all;

  const exceptions = [
    ["Unassigned", all.filter((j) => j.status === "New").length],
    ["No-shows to reschedule", all.filter((j) => j.status === "No-show").length],
    ["Awaiting evidence", all.filter((j) => j.status === "Awaiting evidence").length],
    ["In review", all.filter((j) => j.status === "Report submitted").length],
  ] as const;

  return (
    <StaffShell title="Admin dashboard">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Assessment &amp; survey pipeline</h1>
        <Link href="/jobs/new" className="ml-auto bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium">
          + New job
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {exceptions.map(([label, n]) => (
          <div key={label} className={`rounded-xl p-3 border ${n > 0 ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"}`}>
            <div className="text-2xl font-bold text-slate-800">{n}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
        <Link href="/admin" className={`rounded-full px-2.5 py-1 border ${!status ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-300 text-slate-600"}`}>All ({all.length})</Link>
        {STATUSES.map((s) => {
          const n = all.filter((j) => j.status === s).length;
          if (n === 0) return null;
          return (
            <Link key={s} href={`/admin?status=${encodeURIComponent(s)}`}
              className={`rounded-full px-2.5 py-1 border ${status === s ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-300 text-slate-600"}`}>
              {s} ({n})
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Job</th><th className="px-3 py-2">Client</th><th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Assessor</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Scheduled</th>
            </tr>
          </thead>
          <tbody>
            {active.map((j) => (
              <tr key={j.id} className="border-t border-slate-100 hover:bg-blue-50/50">
                <td className="px-3 py-2">
                  <Link href={`/jobs/${j.id}`} className="text-blue-700 font-medium hover:underline">{j.job_number}</Link>
                  <div className="text-xs text-slate-400">{j.claim_number}</div>
                </td>
                <td className="px-3 py-2">{j.client_name}</td>
                <td className="px-3 py-2 text-xs">
                  {jobTypeLabel(j)}
                  {j.job_type === "survey" && <span className="ml-1.5 text-[9px] font-semibold bg-teal-100 text-teal-800 rounded px-1 py-0.5 align-middle">SURVEY</span>}
                </td>
                <td className="px-3 py-2">{j.assessor_name ?? <span className="text-slate-400">—</span>}</td>
                <td className="px-3 py-2"><StatusChip status={j.status} /></td>
                <td className="px-3 py-2 text-xs text-slate-500">{j.scheduled_start ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
