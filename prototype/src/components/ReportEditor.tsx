"use client";
// Report editor (Chunk 1E). Five editable narrative sections autosave to the
// draft on blur; everything else (cover, particulars, limitations, evidence
// index, sign-off) is auto-generated server-side and shown read-only — the
// Limitations section has no edit control by design (non-removable).
import { useRef, useState, useTransition } from "react";
import { saveReportDraftAction, submitReportAction } from "@/lib/actions";

interface SectionDef { key: string; title: string }

export function ReportEditor(props: {
  jobId: string;
  sections: SectionDef[];
  initial: Record<string, string>;
  canSubmit: boolean;
  submitLabel: string;
  returnedComments?: string;
  readOnly: boolean;
}) {
  const { jobId, sections, initial, canSubmit, readOnly } = props;
  const narrative = useRef<Record<string, string>>({ ...initial });
  const [savedAt, setSavedAt] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setErr("");
      try {
        await saveReportDraftAction(jobId, narrative.current);
        setSavedAt(new Date().toTimeString().slice(0, 8));
      } catch (x) { setErr(x instanceof Error ? x.message : "Save failed"); }
    });

  const submit = () =>
    start(async () => {
      setErr("");
      try { await submitReportAction(jobId, narrative.current); }
      catch (x) {
        // Next.js redirect() rejects with a control-flow error — let it through.
        const digest = (x as { digest?: string })?.digest ?? "";
        if (digest.startsWith("NEXT_REDIRECT") || (x instanceof Error && x.message.includes("NEXT_REDIRECT"))) throw x;
        setErr(x instanceof Error ? x.message : "Submit failed");
      }
    });

  return (
    <div className="space-y-3">
      {props.returnedComments && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-rose-800">Returned by the manager — comments</h3>
          <p className="text-xs text-rose-700 mt-1 whitespace-pre-wrap">{props.returnedComments}</p>
        </div>
      )}

      {sections.map((s) => (
        <div key={s.key} className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="flex items-center mb-1.5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{s.title}</h3>
            <span className="ml-auto text-[10px] bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">editable — prefilled from checklist</span>
          </div>
          <textarea
            defaultValue={initial[s.key] ?? ""}
            readOnly={readOnly}
            rows={s.key === "findings" ? 10 : 3}
            onChange={(e) => { narrative.current[s.key] = e.target.value; }}
            onBlur={save}
            className={`w-full text-xs border rounded-lg px-2 py-1.5 leading-relaxed ${readOnly ? "bg-slate-50 text-slate-500 border-slate-100" : "border-slate-300"}`}
          />
        </div>
      ))}

      <div className="flex items-center gap-3">
        {canSubmit && !readOnly && (
          <button
            disabled={pending}
            onClick={submit}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold"
          >
            {props.submitLabel}
          </button>
        )}
        {savedAt && <span className="text-[11px] text-slate-400">Draft saved {savedAt}</span>}
        {pending && <span className="text-[11px] text-slate-400">…</span>}
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </div>
    </div>
  );
}
