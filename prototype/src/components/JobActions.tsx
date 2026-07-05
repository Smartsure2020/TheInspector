"use client";
// Working workflow actions (Chunk 1B). Buttons appear per legal transition;
// the server-side guard in data.ts remains the authority.
import Link from "next/link";
import { assignAction, cancelAction, noShowAction, submitReportAction, transitionAction } from "@/lib/actions";
import { JobStatus } from "@/lib/types";
import { useState, useTransition } from "react";

const NO_SHOW_REASONS = ["did not join", "joined but failed tech check", "cancelled late", "wrong contact details", "other"];
const CANCEL_REASONS = ["claim withdrawn", "settled without assessment", "duplicate job", "client non-cooperation", "other"];

export function JobActions({ jobId, status, assessors, hasAssessor }: {
  jobId: string; status: JobStatus; assessors: { id: string; name: string }[]; hasAssessor: boolean;
}) {
  const [pending, start] = useTransition();
  const [assessorId, setAssessorId] = useState(assessors[0]?.id ?? "");
  const [err, setErr] = useState("");

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setErr("");
      try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Action failed"); }
    });

  const btn = "text-xs rounded-lg px-3 py-1.5 font-medium disabled:opacity-50";
  const terminal = status === "Report completed" || status === "Cancelled";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "New" && (
          <>
            <select className="text-xs border border-slate-300 rounded-lg px-2 py-1.5" value={assessorId} onChange={(e) => setAssessorId(e.target.value)}>
              {assessors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button disabled={pending} className={`${btn} bg-blue-600 text-white`} onClick={() => run(() => assignAction(jobId, assessorId))}>
              Assign assessor
            </button>
          </>
        )}

        {(status === "Assigned" || status === "No-show") && (
          <Link href={`/jobs/${jobId}/schedule`} className={`${btn} bg-blue-600 text-white inline-block`}>
            {status === "No-show" ? "Reschedule (new attempt)" : "Schedule appointment"}
          </Link>
        )}

        {status === "Scheduled" && (
          <>
            <Link href={`/jobs/${jobId}/schedule`} className={`${btn} bg-white border border-slate-300 text-slate-700 inline-block`}>Reschedule</Link>
            <button disabled={pending} className={`${btn} bg-emerald-600 text-white`}
              onClick={() => run(() => transitionAction(jobId, "In progress"))}
              title="Mock session start — real room start arrives in Chunk 1D">
              Start session (mock)
            </button>
            <NoShow jobId={jobId} pending={pending} run={run} btn={btn} />
          </>
        )}

        {status === "In progress" && (
          <>
            <button disabled={pending} className={`${btn} bg-amber-500 text-white`} onClick={() => run(() => transitionAction(jobId, "Awaiting evidence"))}>
              End session — items missing → Awaiting evidence
            </button>
            <button disabled={pending} className={`${btn} bg-orange-600 text-white`} onClick={() => run(() => transitionAction(jobId, "Awaiting report"))}>
              End session — evidence complete → Awaiting report
            </button>
          </>
        )}

        {status === "Awaiting evidence" && (
          <button disabled={pending} className={`${btn} bg-orange-600 text-white`} onClick={() => run(() => transitionAction(jobId, "Awaiting report"))}>
            All items resolved → Awaiting report
          </button>
        )}

        {status === "Awaiting report" && (
          <button disabled={pending} className={`${btn} bg-violet-600 text-white`} onClick={() => run(() => submitReportAction(jobId))}>
            Submit report for review
          </button>
        )}

        {status === "Returned for correction" && (
          <button disabled={pending} className={`${btn} bg-orange-600 text-white`} onClick={() => run(() => transitionAction(jobId, "Awaiting report"))}>
            Resume editing → Awaiting report
          </button>
        )}

        {status === "Report submitted" && (
          <span className="text-xs text-slate-500">In manager review queue — approve/return arrives in Chunk 1I.</span>
        )}

        {!terminal && <Cancel jobId={jobId} pending={pending} run={run} btn={btn} />}
        {terminal && <span className="text-xs text-slate-400">Job is {status.toLowerCase()} — read-only.</span>}
        {!hasAssessor && status !== "New" && <span className="text-[10px] text-amber-600">No assessor on record</span>}
      </div>
      {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
    </div>
  );
}

function NoShow({ jobId, pending, run, btn }: { jobId: string; pending: boolean; run: (f: () => Promise<void>) => void; btn: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(NO_SHOW_REASONS[0]);
  if (!open)
    return <button disabled={pending} className={`${btn} bg-red-600 text-white`} onClick={() => setOpen(true)}>Mark no-show…</button>;
  return (
    <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
      <select className="text-xs border border-slate-300 rounded px-1 py-1" value={reason} onChange={(e) => setReason(e.target.value)}>
        {NO_SHOW_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button disabled={pending} className={`${btn} bg-red-600 text-white`} onClick={() => run(() => noShowAction(jobId, reason))}>Confirm</button>
      <button className="text-xs text-slate-500" onClick={() => setOpen(false)}>✕</button>
    </span>
  );
}

function Cancel({ jobId, pending, run, btn }: { jobId: string; pending: boolean; run: (f: () => Promise<void>) => void; btn: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  if (!open)
    return <button disabled={pending} className={`${btn} ml-auto text-rose-700 border border-rose-200 bg-white`} onClick={() => setOpen(true)}>Cancel job…</button>;
  return (
    <span className="ml-auto flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
      <select className="text-xs border border-slate-300 rounded px-1 py-1" value={reason} onChange={(e) => setReason(e.target.value)}>
        {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button disabled={pending} className={`${btn} bg-rose-700 text-white`} onClick={() => run(() => cancelAction(jobId, reason))}>Confirm cancel</button>
      <button className="text-xs text-slate-500" onClick={() => setOpen(false)}>✕</button>
    </span>
  );
}
