// S6 — Job detail hub (DB-backed, Chunk 1B). Tabs via ?tab= links.
import Link from "next/link";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { JobActions } from "@/components/JobActions";
import { getJob, getTemplate, listAppointments, listEvents, listUsers, missingItems, getClient } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function JobDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const job = getJob(id);
  if (!job) return <StaffShell title="Job"><p className="text-sm text-slate-500">Unknown job.</p></StaffShell>;

  const client = getClient(job.client_id);
  const tpl = getTemplate(job.template_id)!;
  const events = listEvents(id);
  const appts = listAppointments(id);
  const missing = missingItems(id);
  const missingKeys = new Set(missing.map((m) => m.item_key));
  const tabs = ["overview", "appointments", "checklist"];

  return (
    <StaffShell title={`Job ${job.job_number}`}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h1 className="text-xl font-semibold text-slate-800">{job.job_number}</h1>
        <StatusChip status={job.status} />
        <span className="text-sm text-slate-500">{client?.full_name} · {client?.phone}</span>
        <span className="text-xs text-slate-400">attempt {job.attempt_count}</span>
        <div className="ml-auto flex gap-2">
          <Link href={`/jobs/${job.id}/room`} className="text-sm bg-emerald-600 text-white rounded-lg px-3 py-1.5 hover:bg-emerald-500">Open room</Link>
          <Link href={`/jobs/${job.id}/evidence`} className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">Evidence</Link>
          <Link href={`/jobs/${job.id}/report`} className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">Report</Link>
        </div>
      </div>

      <div className="mb-4">
        <JobActions jobId={job.id} status={job.status} assessors={listUsers("assessor")} hasAssessor={!!job.assessor_id} />
      </div>

      <div className="flex gap-1 mb-3">
        {tabs.map((t) => (
          <Link key={t} href={`/jobs/${job.id}?tab=${t}`}
            className={`px-3 py-1.5 text-sm rounded-t-lg capitalize ${tab === t ? "bg-white border border-b-white border-slate-200 font-medium text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
            {t}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm">
            <h2 className="font-medium text-slate-700 mb-2">{job.job_type === "survey" ? "Survey details" : "Claim details"}</h2>
            <dl className="grid grid-cols-[130px_1fr] gap-y-1.5 text-slate-600">
              <dt className="text-slate-400">{job.job_type === "survey" ? "Reference" : "Claim number"}</dt><dd>{job.claim_number}</dd>
              <dt className="text-slate-400">Policy</dt><dd>{job.policy_number}</dd>
              <dt className="text-slate-400">Type</dt><dd>{tpl.name} (v{job.template_version})</dd>
              <dt className="text-slate-400">Date of loss</dt><dd>{job.date_of_loss}</dd>
              <dt className="text-slate-400">Assessor</dt><dd>{job.assessor_name ?? "—"}</dd>
              <dt className="text-slate-400">Description</dt><dd>{job.description}</dd>
              {job.special_conditions && (<><dt className="text-amber-600">Verify</dt><dd className="text-amber-700">{job.special_conditions}</dd></>)}
              {job.outcome_reason && (<><dt className="text-rose-500">Outcome</dt><dd className="text-rose-600">{job.outcome} — {job.outcome_reason}</dd></>)}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-medium text-slate-700 mb-2 text-sm">Timeline (event log)</h2>
            <ol className="space-y-2 max-h-80 overflow-y-auto">
              {events.map((e) => {
                const d = e.data ? JSON.parse(e.data) : {};
                return (
                  <li key={e.id} className="text-xs text-slate-600 flex gap-2">
                    <span className="text-slate-400 whitespace-nowrap">{e.occurred_at}</span>
                    <span>
                      <span className="text-slate-500">{e.actor}:</span>{" "}
                      {e.event_type === "seed_history" ? d.text : (
                        <><b>{e.event_type}</b>{d.from ? ` (${d.from} → ${d.to})` : ""}{d.reason ? ` — ${d.reason}` : ""}{d.when ? ` — ${d.when}` : ""}{d.assessor ? ` — ${d.assessor}` : ""}{d.version ? ` — v${d.version}` : ""}</>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          {appts.length === 0 && <p>No appointments yet.</p>}
          <ul className="space-y-2">
            {appts.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-2 items-center border-b border-slate-50 last:border-0 pb-2">
                <span className="font-medium">Attempt {a.attempt_number}</span>
                <span>{a.scheduled_start} ({a.duration_minutes} min)</span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${a.status === "scheduled" ? "bg-blue-100 text-blue-800" : a.status === "no_show" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>{a.status}</span>
                {a.no_show_reason && <span className="text-xs text-red-600">({a.no_show_reason})</span>}
                {a.link_token && !a.link_revoked_at && <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/c/{a.link_token}</code>}
                {a.link_revoked_at && <span className="text-[10px] text-slate-400">link revoked {a.link_revoked_at}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "checklist" && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {tpl.sections.map((s) => (
            <div key={s.key} className="mb-3">
              <h3 className="text-sm font-medium text-slate-700">{s.title}</h3>
              <ul className="mt-1 space-y-0.5">
                {s.items.map((i) => (
                  <li key={i.key} className={`text-xs px-2 py-1 rounded ${missingKeys.has(i.key) ? "bg-amber-50 text-amber-800" : "text-slate-500"}`}>
                    {i.prompt}
                    {i.evidenceRequired && <span className="ml-1 text-[10px] text-blue-500">📷</span>}
                    {i.highRes && <span className="ml-1 text-[10px] text-violet-500">HI-RES</span>}
                    {missingKeys.has(i.key) && <span className="ml-2 font-medium">MISSING — {missing.find((m) => m.item_key === i.key)?.missing_reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </StaffShell>
  );
}
