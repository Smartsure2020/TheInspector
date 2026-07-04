"use client";
// S2 — Admin dashboard: pipeline table + exception strips (mock data, 1A).
import Link from "next/link";
import { useState } from "react";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { jobs, clientById, userById } from "@/lib/fixtures";
import { JobStatus } from "@/lib/types";

const exceptions = [
  { label: "Unassigned", test: (s: JobStatus) => s === "New" },
  { label: "No-shows to reschedule", test: (s: JobStatus) => s === "No-show" },
  { label: "Awaiting evidence", test: (s: JobStatus) => s === "Awaiting evidence" },
  { label: "In review", test: (s: JobStatus) => s === "Report submitted" },
];

export default function AdminDashboard() {
  const [filter, setFilter] = useState<string>("all");
  const active = jobs.filter((j) => filter === "all" || j.status === filter);

  return (
    <StaffShell title="Admin dashboard">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Assessment pipeline</h1>
        <Link href="/jobs/new" className="ml-auto bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium">
          + New job
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {exceptions.map((e) => {
          const n = jobs.filter((j) => e.test(j.status)).length;
          return (
            <button key={e.label} onClick={() => setFilter("all")} className={`rounded-xl p-3 text-left border ${n > 0 ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"}`}>
              <div className="text-2xl font-bold text-slate-800">{n}</div>
              <div className="text-xs text-slate-500">{e.label}</div>
            </button>
          );
        })}
      </div>

      <div className="mb-3">
        <select className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {[...new Set(jobs.map((j) => j.status))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Job</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Assessor</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Scheduled</th>
            </tr>
          </thead>
          <tbody>
            {active.map((j) => (
              <tr key={j.id} className="border-t border-slate-100 hover:bg-blue-50/50">
                <td className="px-3 py-2">
                  <Link href={`/jobs/${j.id}`} className="text-blue-700 font-medium hover:underline">
                    {j.jobNumber}
                  </Link>
                  <div className="text-xs text-slate-400">{j.claimNumber}</div>
                </td>
                <td className="px-3 py-2">{clientById(j.clientId)?.name}</td>
                <td className="px-3 py-2 text-xs">{j.claimType === "geyser_water" ? "Geyser / water" : "Accidental"}</td>
                <td className="px-3 py-2">{userById(j.assessorId)?.name ?? <span className="text-slate-400">—</span>}</td>
                <td className="px-3 py-2"><StatusChip status={j.status} /></td>
                <td className="px-3 py-2 text-xs text-slate-500">{j.scheduledStart ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
