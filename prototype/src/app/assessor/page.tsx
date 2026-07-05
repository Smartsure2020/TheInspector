// S3 — Assessor dashboard (DB-backed, Chunk 1B). Acting user from role cookie.
import Link from "next/link";
import { cookies } from "next/headers";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { listJobs, getUser, clientReadiness } from "@/lib/data";

function ReadyDots({ jobId }: { jobId: string }) {
  const r = clientReadiness(jobId);
  const dots: [string, boolean][] = [
    ["link opened", r.linkOpened],
    ["consent accepted", r.consent],
    ["camera check passed", r.deviceCheck],
    ["in waiting room", r.waiting],
  ];
  return (
    <div className="flex items-center gap-2 mt-1">
      {dots.map(([label, on]) => (
        <span key={label} className="flex items-center gap-1 text-[10px] text-slate-500" title={label}>
          <span className={`inline-block w-2 h-2 rounded-full ${on ? "bg-emerald-500" : "bg-slate-300"}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function AssessorDashboard() {
  const id = (await cookies()).get("inspector.demoUser")?.value;
  const me = id ? getUser(id) : undefined;
  const all = listJobs();
  const mine = me ? all.filter((j) => j.assessor_id === me.id || !j.assessor_id) : all;
  const today = mine.filter((j) => j.status === "Scheduled" || j.status === "In progress");

  const groups: [string, string, string][] = [
    ["Awaiting evidence", "Awaiting evidence", "Chase or verify outstanding items"],
    ["Reports to write", "Awaiting report", "Session done — build the report"],
    ["Returned for correction", "Returned for correction", "Manager comments waiting"],
    ["No-shows", "No-show", "Reschedule needed"],
  ];

  return (
    <StaffShell title="Assessor dashboard">
      <h1 className="text-xl font-semibold text-slate-800 mb-3">Today</h1>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {today.map((j) => (
          <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium text-slate-800">{j.scheduled_start ?? "now"} — {j.client_name}</div>
              <div className="text-xs text-slate-500">{j.job_number} · {j.claim_type === "geyser_water" ? "Geyser / water" : "Accidental"} · attempt {j.attempt_count}</div>
              {j.status === "In progress" ? (
                <div className="text-xs mt-1">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-emerald-500" />
                  Client in session
                </div>
              ) : (
                <ReadyDots jobId={j.id} />
              )}
            </div>
            <Link href={`/jobs/${j.id}/room`} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-semibold">Join room</Link>
          </div>
        ))}
        {today.length === 0 && <div className="text-sm text-slate-500">No appointments today.</div>}
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-2">My jobs</h2>
      <div className="space-y-4">
        {groups.map(([title, st, hint]) => {
          const list = mine.filter((j) => j.status === st);
          if (list.length === 0) return null;
          return (
            <div key={title} className="bg-white rounded-xl border border-slate-200">
              <div className="px-4 py-2 border-b border-slate-100 flex items-baseline gap-2">
                <span className="font-medium text-slate-700">{title}</span>
                <span className="text-xs text-slate-400">{hint}</span>
              </div>
              {list.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-blue-50/50">
                  <span className="text-blue-700 text-sm font-medium">{j.job_number}</span>
                  <span className="text-sm text-slate-600">{j.client_name}</span>
                  <span className="ml-auto"><StatusChip status={j.status} /></span>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </StaffShell>
  );
}
