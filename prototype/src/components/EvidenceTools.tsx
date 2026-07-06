"use client";
// Evidence tile with curation controls (Chunk 1E): feature-for-report toggle,
// inline relabel, refile to another checklist item (incl. from UNFILED).
// Server action is the authority; the job locks after approval.
import { useState, useTransition } from "react";
import { updateEvidenceAction } from "@/lib/actions";
import { PhotoTile } from "@/components/Chrome";

export interface ItemOption { key: string; label: string }

export function EvidenceCard(props: {
  jobId: string;
  evidence: {
    id: string; label: string; kind: string; captured_at: string;
    is_featured: number; item_key: string | null; hue: number | null;
    file_key: string | null; mime_type: string | null;
  };
  itemOptions: ItemOption[]; // grouped "section — item" labels
  locked: boolean;
}) {
  const { jobId, evidence: e, itemOptions, locked } = props;
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");

  const run = (patch: { label?: string; itemKey?: string | null; featured?: boolean }) =>
    start(async () => {
      setErr("");
      try { await updateEvidenceAction(jobId, e.id, patch); }
      catch (x) { setErr(x instanceof Error ? x.message : "Update failed"); }
    });

  const kindChip =
    e.kind === "highres_client_photo" ? ["HIGH-RES", "bg-violet-100 text-violet-700"] :
    e.kind === "client_upload" ? ["UPLOAD", "bg-emerald-100 text-emerald-700"] :
    ["FRAME", "bg-slate-100 text-slate-600"];

  return (
    <div className={`bg-white rounded-lg border p-2 ${pending ? "opacity-60" : ""} ${e.is_featured ? "border-amber-400" : "border-slate-200"}`}>
      {e.file_key ? (
        e.mime_type === "application/pdf" ? (
          <a href={`/api/files/${e.id}`} target="_blank" className="h-32 w-full rounded-md bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-medium">
            📄 PDF — open
          </a>
        ) : (
          <a href={`/api/files/${e.id}`} target="_blank" title="Open full size">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/files/${e.id}`} alt={e.label} className="h-32 w-full object-cover rounded-md" />
          </a>
        )
      ) : (
        <PhotoTile hue={e.hue ?? 200} label={e.label} />
      )}

      {editing ? (
        <input
          autoFocus
          defaultValue={e.label}
          onBlur={(x) => { setEditing(false); if (x.target.value.trim() && x.target.value !== e.label) run({ label: x.target.value }); }}
          onKeyDown={(x) => { if (x.key === "Enter") (x.target as HTMLInputElement).blur(); if (x.key === "Escape") setEditing(false); }}
          className="w-full text-[11px] border border-blue-300 rounded px-1 py-0.5 mt-1"
        />
      ) : (
        <button
          disabled={locked}
          onClick={() => setEditing(true)}
          title={locked ? "Locked after approval" : "Click to relabel"}
          className="w-full text-left text-[11px] text-slate-600 mt-1 truncate hover:text-blue-700 disabled:hover:text-slate-600"
        >
          {e.label}
        </button>
      )}

      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
        <span className={`rounded px-1 ${kindChip[1]}`}>{kindChip[0]}</span>
        <span className="ml-auto">{e.captured_at.slice(0, 16)}</span>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5">
        <button
          disabled={locked || pending}
          onClick={() => run({ featured: !e.is_featured })}
          title={e.is_featured ? "Remove from report figures" : "Feature in the report"}
          className={`text-[10px] rounded px-1.5 py-0.5 font-medium disabled:opacity-50 ${e.is_featured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 hover:bg-amber-50"}`}
        >
          {e.is_featured ? "★ featured" : "☆ feature"}
        </button>
        <select
          disabled={locked || pending}
          value={e.item_key ?? ""}
          onChange={(x) => run({ itemKey: x.target.value || null })}
          title="Refile to a checklist item"
          className="flex-1 min-w-0 text-[10px] border border-slate-200 rounded px-1 py-0.5 text-slate-500 bg-white disabled:opacity-50"
        >
          <option value="">UNFILED</option>
          {itemOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>
      {err && <p className="text-[10px] text-rose-600 mt-1">{err}</p>}
    </div>
  );
}
