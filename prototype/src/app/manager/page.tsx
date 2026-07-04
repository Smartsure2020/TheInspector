"use client";
// S4 — Manager dashboard: review queue + team counts (mock, 1A; review view in 1I).
import Link from "next/link";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { jobs, clientById, userById, users } from "@/lib/fixtures";

export default function ManagerDashboard() {
  const queue = jobs.filter((j) => j.status === "Report submitted");
  const assessors = users.filter((u) => u.role === "assessor");

  return (
    <StaffShell title="Manager dashboard">
      <h1 className="text-xl font-semibold text-slate-800 mb-3">Review queue</h1>
      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        {queue.map((j) => (
          <div key={j.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
            <div className="flex-1">
              <Link href={`/jobs/${j.id}/report/final`} className="text-blue-700 font-medium hover:underline">
                {j.jobNumber}
              </Link>
              <div className="text-xs text-slate-500">
                {clientById(j.clientId)?.name} · {userById(j.assessorId)?.name} · submitted {j.events.at(-1)?.at}
              </div>
            </div>
            <span className="text-xs bg-violet-100 text-violet-800 rounded-full px-2 py-0.5">v1 · waiting 0d</span>
            <Link href={`/jobs/${j.id}/report/final`} className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm">
              Review
            </Link>
          </div>
        ))}
        {queue.length === 0 && <div className="p-4 text-sm text-slate-500">Queue empty.</div>}
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-2">Team pipeline</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {assessors.map((a) => {
          const theirs = jobs.filter((j) => j.assessorId === a.id);
          return (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="font-medium text-slate-800">{a.name}</div>
              <div className="text-xs text-slate-400 mb-2">{theirs.length} active jobs</div>
              <div className="flex flex-wrap gap-1.5">
                {theirs.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.id}`} title={j.jobNumber}>
                    <StatusChip status={j.status} />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </StaffShell>
  );
}
