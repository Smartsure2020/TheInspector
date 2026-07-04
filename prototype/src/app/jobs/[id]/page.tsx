"use client";
// S6 — Job detail hub: overview + timeline + tab links (mock, 1A).
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { jobById, clientById, userById, templateById, itemByKey } from "@/lib/fixtures";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const job = jobById(id);
  const [tab, setTab] = useState<"overview" | "appointments" | "checklist">("overview");
  if (!job) return <StaffShell title="Job"><p>Unknown job.</p></StaffShell>;

  const client = clientById(job.clientId);
  const tpl = templateById(job.templateId)!;
  const tabs = ["overview", "appointments", "checklist"] as const;

  return (
    <StaffShell title={`Job ${job.jobNumber}`}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold text-slate-800">{job.jobNumber}</h1>
        <StatusChip status={job.status} />
        <span className="text-sm text-slate-500">{client?.name} · {client?.phone}</span>
        <span className="text-xs text-slate-400">attempt {job.attempt}</span>
        <div className="ml-auto flex gap-2">
          <Link href={`/jobs/${job.id}/schedule`} className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">Schedule</Link>
          <Link href={`/jobs/${job.id}/room`} className="text-sm bg-emerald-600 text-white rounded-lg px-3 py-1.5 hover:bg-emerald-500">Open room</Link>
          <Link href={`/jobs/${job.id}/evidence`} className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">Evidence</Link>
          <Link href={`/jobs/${job.id}/report`} className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">Report</Link>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-t-lg capitalize ${tab === t ? "bg-white border border-b-white border-slate-200 font-medium text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm">
            <h2 className="font-medium text-slate-700 mb-2">Claim details</h2>
            <dl className="grid grid-cols-[130px_1fr] gap-y-1.5 text-slate-600">
              <dt className="text-slate-400">Claim number</dt><dd>{job.claimNumber}</dd>
              <dt className="text-slate-400">Policy</dt><dd>{job.policyNumber}</dd>
              <dt className="text-slate-400">Type</dt><dd>{tpl.name} (v{tpl.version})</dd>
              <dt className="text-slate-400">Date of loss</dt><dd>{job.dateOfLoss}</dd>
              <dt className="text-slate-400">Assessor</dt><dd>{userById(job.assessorId)?.name ?? "—"}</dd>
              <dt className="text-slate-400">Description</dt><dd>{job.description}</dd>
              {job.specialConditions && (<><dt className="text-amber-600">Verify</dt><dd className="text-amber-700">{job.specialConditions}</dd></>)}
            </dl>
            <div className="mt-4 flex gap-2">
              <button className="text-xs text-rose-700 border border-rose-200 rounded-lg px-2 py-1 hover:bg-rose-50" onClick={() => alert("Cancel flow wires up in Chunk 1B (status engine).")}>Cancel job…</button>
              <button className="text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50" onClick={() => alert("No-show marking wires up in Chunk 1B.")}>Mark no-show…</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-medium text-slate-700 mb-2 text-sm">Timeline (event log)</h2>
            <ol className="space-y-2">
              {job.events.map((e, i) => (
                <li key={i} className="text-xs text-slate-600 flex gap-2">
                  <span className="text-slate-400 whitespace-nowrap">{e.at}</span>
                  <span><span className="text-slate-500">{e.actor}:</span> {e.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          {job.scheduledStart ? (
            <p>Attempt {job.attempt}: <b>{job.scheduledStart}</b> ({job.durationMin} min) — link token <code className="bg-slate-100 px-1 rounded">{job.token}</code></p>
          ) : (
            <p>No appointment yet. <Link className="text-blue-700 underline" href={`/jobs/${job.id}/schedule`}>Schedule one</Link>.</p>
          )}
        </div>
      )}

      {tab === "checklist" && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {tpl.sections.map((s) => (
            <div key={s.key} className="mb-3">
              <h3 className="text-sm font-medium text-slate-700">{s.title}</h3>
              <ul className="mt-1 space-y-0.5">
                {s.items.map((i) => {
                  const missing = job.missingItemKeys?.includes(i.key);
                  return (
                    <li key={i.key} className={`text-xs px-2 py-1 rounded ${missing ? "bg-amber-50 text-amber-800" : "text-slate-500"}`}>
                      {i.prompt}
                      {i.evidenceRequired && <span className="ml-1 text-[10px] text-blue-500">📷</span>}
                      {i.highRes && <span className="ml-1 text-[10px] text-violet-500">HI-RES</span>}
                      {missing && <span className="ml-2 font-medium">MISSING — {itemByKey(tpl, i.key) ? "awaiting client upload" : ""}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </StaffShell>
  );
}
