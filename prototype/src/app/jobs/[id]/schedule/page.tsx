"use client";
// S7 — Scheduling: date/time + link generation + paste-ready message (mock, 1A).
import { useParams } from "next/navigation";
import { useState } from "react";
import { StaffShell } from "@/components/Chrome";
import { jobById, clientById, userById } from "@/lib/fixtures";

export default function Schedule() {
  const { id } = useParams<{ id: string }>();
  const job = jobById(id);
  const [date, setDate] = useState("2026-07-06");
  const [time, setTime] = useState("10:00");
  const [generated, setGenerated] = useState(false);
  if (!job) return <StaffShell title="Schedule"><p>Unknown job.</p></StaffShell>;

  const client = clientById(job.clientId);
  const link = `https://inspector-prototype.local/c/${job.token ?? "new-token-" + job.id}`;
  const msg = `Hi ${client?.name}, your virtual assessment for claim ${job.claimNumber} is booked for ${date} at ${time} with ${userById(job.assessorId)?.name ?? "your assessor"}. Please open this link on your phone at that time: ${link} — you'll need access to the affected area. No app needed.`;

  return (
    <StaffShell title={`Schedule — ${job.jobNumber}`}>
      <div className="max-w-xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Schedule appointment</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Time (SAST)</label>
              <input type="time" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Duration default: {job.claimType === "geyser_water" ? "45 min (geyser)" : "20 min (accidental)"}
          </p>
          <button className="mt-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setGenerated(true)}>
            Generate client link
          </button>
        </div>

        {generated && (
          <div className="bg-white rounded-xl border border-emerald-300 p-4 mt-4">
            <h2 className="text-sm font-semibold text-emerald-700">Link generated (mock)</h2>
            <code className="block bg-slate-100 rounded p-2 text-xs mt-2 break-all">{link}</code>
            <h3 className="text-xs font-medium text-slate-500 mt-3 mb-1">Paste-ready SMS / email text (manual send in Phase 1):</h3>
            <textarea readOnly className="w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-600 bg-slate-50" rows={4} value={msg} />
            <button className="mt-2 text-xs bg-slate-800 text-white rounded-lg px-3 py-1.5" onClick={() => navigator.clipboard?.writeText(msg)}>
              Copy message
            </button>
            <p className="text-xs text-amber-700 mt-2">Prototype 1A: link/appointment persistence arrives in Chunk 1B; demo tokens work now (demo-geyser, demo-acc).</p>
          </div>
        )}
      </div>
    </StaffShell>
  );
}
