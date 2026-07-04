"use client";
// S3 — Assessor dashboard: today strip + my-jobs groups (mock data, 1A).
import Link from "next/link";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { jobs, clientById } from "@/lib/fixtures";
import { useRole } from "@/lib/role";

export default function AssessorDashboard() {
  const { user } = useRole();
  const mine = jobs.filter((j) => !user || j.assessorId === user.id || j.assessorId === undefined);
  const today = mine.filter((j) => j.status === "Scheduled" || j.status === "In progress");
  const groups: [string, (s: string) => boolean, string][] = [
    ["Awaiting evidence", (s) => s === "Awaiting evidence", "Chase or verify outstanding items"],
    ["Reports to write", (s) => s === "Awaiting report", "Session done — build the report"],
    ["Returned for correction", (s) => s === "Returned for correction", "Manager comments waiting"],
    ["No-shows", (s) => s === "No-show", "Reschedule needed"],
  ];

  return (
    <StaffShell title="Assessor dashboard">
      <h1 className="text-xl font-semibold text-slate-800 mb-3">Today</h1>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {today.map((j) => (
          <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium text-slate-800">
                {j.scheduledStart?.split(" ")[1] ?? "now"} — {clientById(j.clientId)?.name}
              </div>
              <div className="text-xs text-slate-500">
                {j.jobNumber} · {j.claimType === "geyser_water" ? "Geyser / water" : "Accidental"} · attempt {j.attempt}
              </div>
              <div className="text-xs mt-1">
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${j.status === "In progress" ? "bg-emerald-500" : "bg-slate-300"}`} />
                {j.status === "In progress" ? "Client in session" : "Client not yet joined"}
              </div>
            </div>
            <Link href={`/jobs/${j.id}/room`} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-semibold">
              Join room
            </Link>
          </div>
        ))}
        {today.length === 0 && <div className="text-sm text-slate-500">No appointments today.</div>}
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-2">My jobs</h2>
      <div className="space-y-4">
        {groups.map(([title, test, hint]) => {
          const list = mine.filter((j) => test(j.status));
          if (list.length === 0) return null;
          return (
            <div key={title} className="bg-white rounded-xl border border-slate-200">
              <div className="px-4 py-2 border-b border-slate-100 flex items-baseline gap-2">
                <span className="font-medium text-slate-700">{title}</span>
                <span className="text-xs text-slate-400">{hint}</span>
              </div>
              {list.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-blue-50/50">
                  <span className="text-blue-700 text-sm font-medium">{j.jobNumber}</span>
                  <span className="text-sm text-slate-600">{clientById(j.clientId)?.name}</span>
                  <span className="ml-auto"><StatusChip status={j.status} /></span>
                  {j.missingItemKeys && <span className="text-xs text-amber-700">{j.missingItemKeys.length} items outstanding</span>}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </StaffShell>
  );
}
