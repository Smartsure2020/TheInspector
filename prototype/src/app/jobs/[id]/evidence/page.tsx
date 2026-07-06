// S13 — Evidence gallery (Chunk 1E polish): grouped by checklist section,
// relabel/refile/feature controls, missing panel, upload states.
import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { EvidenceCard, ItemOption } from "@/components/EvidenceTools";
import { getJob, getTemplate, listEvidence, missingItems, templateItemByKey } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EvidenceGallery({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return <StaffShell title="Evidence"><p className="text-sm text-slate-500">Unknown job.</p></StaffShell>;
  const tpl = getTemplate(job.template_id)!;
  const items = listEvidence(id);
  const unfiled = items.filter((e) => !e.item_key);
  const missing = missingItems(id);
  const locked = job.status === "Report completed" || job.status === "Cancelled";
  const featuredCount = items.filter((e) => e.is_featured).length;

  const itemOptions: ItemOption[] = tpl.sections.flatMap((s) =>
    s.items.map((i) => ({ key: i.key, label: `${s.title} — ${i.prompt.slice(0, 48)}` }))
  );

  return (
    <StaffShell title={`Evidence — ${job.job_number}`}>
      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-xl font-semibold text-slate-800">Evidence gallery</h1>
            <span className="text-xs text-slate-400">{items.length} items · {featuredCount} featured for report</span>
            {locked && <span className="text-xs bg-slate-800 text-white rounded-full px-2 py-0.5">locked — {job.status.toLowerCase()}</span>}
          </div>

          {unfiled.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4">
              <h2 className="text-sm font-semibold text-amber-800 mb-2">
                Unfiled captures — file these first <span className="font-normal text-amber-600">(use the item dropdown on each card)</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {unfiled.map((e) => (
                  <EvidenceCard key={e.id} jobId={id} evidence={e} itemOptions={itemOptions} locked={locked} />
                ))}
              </div>
            </div>
          )}

          {tpl.sections.map((s) => {
            const inSection = items.filter((e) => e.item_key && s.items.some((i) => i.key === e.item_key));
            if (inSection.length === 0) return null;
            return (
              <div key={s.key} className="mb-5">
                <h2 className="text-sm font-semibold text-slate-600 mb-2">
                  {s.title} <span className="font-normal text-slate-400">({inSection.length})</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {inSection.map((e) => (
                    <EvidenceCard key={e.id} jobId={id} evidence={e} itemOptions={itemOptions} locked={locked} />
                  ))}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-slate-500">No evidence on this job yet — captures land here live from the assessment room.</p>}
        </div>

        <aside className="h-fit space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Missing evidence</h2>
            {missing.length ? (
              <>
                <ul className="space-y-1.5 mb-3">
                  {missing.map((m) => (
                    <li key={m.item_key} className="text-xs bg-amber-50 text-amber-800 rounded px-2 py-1.5">
                      {templateItemByKey(tpl.sections, m.item_key)?.item.prompt ?? m.item_key}
                      {m.missing_reason && <span className="block text-[10px] text-amber-600">{m.missing_reason}</span>}
                    </li>
                  ))}
                </ul>
                {job.link_token && (
                  <Link href={`/c/${job.link_token}/upload`} className="block text-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-xs font-semibold">
                    Preview client upload page
                  </Link>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  Client uploads arriving against these items clear them on the checklist; they appear in the grid as UPLOAD.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Nothing flagged missing.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Report</h2>
            <p className="text-[11px] text-slate-500 mb-2">★ featured items appear as figures in the report; everything stays in the evidence index.</p>
            <Link href={`/jobs/${id}/report`} className="block text-center bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-3 py-2 text-xs font-semibold">
              Open report builder →
            </Link>
            <a href={`/api/pack/${id}`} className="block text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-xs font-semibold mt-2">
              Download evidence pack (.zip)
            </a>
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}
