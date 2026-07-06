"use client";
// Manager review actions (Chunk 1E — real). Approve locks the job at
// Report completed; Return requires comments and sends it back to the
// assessor (Returned for correction). Role check is the placeholder
// role cookie — production auth is out of scope by instruction.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewReportAction } from "@/lib/actions";
import { useRole } from "@/lib/role";

export function ManagerReview({ jobId, jobStatus, version }: { jobId: string; jobStatus: string; version?: number }) {
  const { user } = useRole();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [comments, setComments] = useState("");
  const [returning, setReturning] = useState(false);
  const [err, setErr] = useState("");

  if (jobStatus !== "Report submitted") return null;
  if (user?.role !== "manager")
    return (
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-800">
        With the manager for review (v{version ?? "?"}). Switch to the Manager role on the home page to approve/return.
      </div>
    );

  const run = (verdict: "approve" | "return") =>
    start(async () => {
      setErr("");
      try {
        await reviewReportAction(jobId, verdict, comments);
        router.refresh();
      } catch (x) { setErr(x instanceof Error ? x.message : "Review failed"); }
    });

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-violet-800 mb-2">Manager review — v{version ?? "?"}</h2>
      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={3}
        placeholder={returning ? "Comments for the assessor (required to return)…" : "Optional comments…"}
        className="w-full text-xs border border-violet-200 rounded-lg px-2 py-1.5 bg-white"
      />
      <div className="flex gap-2 mt-2 items-center">
        <button
          disabled={pending}
          onClick={() => run("approve")}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Approve — lock &amp; complete
        </button>
        {!returning ? (
          <button disabled={pending} onClick={() => setReturning(true)} className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold">
            Return for correction…
          </button>
        ) : (
          <button
            disabled={pending || !comments.trim()}
            onClick={() => run("return")}
            title={comments.trim() ? "" : "Comments are required"}
            className="bg-rose-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Confirm return with comments
          </button>
        )}
        {pending && <span className="text-xs text-slate-400">…</span>}
      </div>
      {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
    </div>
  );
}
