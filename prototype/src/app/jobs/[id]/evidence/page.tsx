"use client";
// S13 — Evidence gallery (mock, 1A): grid by section, unfiled pinned, missing panel.
import { useParams } from "next/navigation";
import Link from "next/link";
import { StaffShell, PhotoTile } from "@/components/Chrome";
import { jobById, templateById, evidenceForJob, itemByKey } from "@/lib/fixtures";

export default function EvidenceGallery() {
  const { id } = useParams<{ id: string }>();
  const job = jobById(id);
  if (!job) return <StaffShell title="Evidence"><p>Unknown job.</p></StaffShell>;
  const tpl = templateById(job.templateId)!;
  const items = evidenceForJob(job.id);
  const unfiled = items.filter((e) => !e.itemKey);

  return (
    <StaffShell title={`Evidence — ${job.jobNumber}`}>
      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 mb-3">Evidence gallery</h1>

          {unfiled.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4">
              <h2 className="text-sm font-semibold text-amber-800 mb-2">Unfiled captures — file these first</h2>
              <div className="flex gap-3 flex-wrap">
                {unfiled.map((e) => (
                  <div key={e.id} className="w-40">
                    <PhotoTile hue={e.hue} label={e.label} />
                    <button className="text-xs text-blue-700 underline mt-1" onClick={() => alert("Refile action wires up in Chunk 1G.")}>File to item…</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tpl.sections.map((s) => {
            const sectionItems = items.filter((e) => e.itemKey?.startsWith(s.key.split(".")[0] + "." + s.key.split(".")[1]));
            const inSection = items.filter((e) => e.itemKey && s.items.some((i) => i.key === e.itemKey));
            if (inSection.length === 0) return null;
            void sectionItems;
            return (
              <div key={s.key} className="mb-5">
                <h2 className="text-sm font-semibold text-slate-600 mb-2">{s.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {inSection.map((e) => (
                    <div key={e.id} className="bg-white rounded-lg border border-slate-200 p-2">
                      <PhotoTile hue={e.hue} label={e.label} />
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                        <span className={`rounded px-1 ${e.kind === "highres_client_photo" ? "bg-violet-100 text-violet-700" : e.kind === "client_upload" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>
                          {e.kind === "highres_client_photo" ? "HIGH-RES" : e.kind === "client_upload" ? "UPLOAD" : "FRAME"}
                        </span>
                        {e.featured && <span className="text-amber-600 font-medium">★ featured</span>}
                        <span className="ml-auto">{e.capturedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-slate-500">No evidence yet for this job (try job INS-2026-0006 or 0010 in the seed data).</p>}
        </div>

        <aside className="h-fit">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Missing evidence</h2>
            {job.missingItemKeys?.length ? (
              <>
                <ul className="space-y-1.5 mb-3">
                  {job.missingItemKeys.map((k) => (
                    <li key={k} className="text-xs bg-amber-50 text-amber-800 rounded px-2 py-1.5">{itemByKey(tpl, k)?.prompt ?? k}</li>
                  ))}
                </ul>
                <Link href={`/c/${job.token ?? "demo-upload"}/upload`} className="block text-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-xs font-semibold">
                  Preview client upload page
                </Link>
                <p className="text-[10px] text-slate-400 mt-2">Upload-request creation wires up in Chunk 1G.</p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Nothing flagged missing.</p>
            )}
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}
