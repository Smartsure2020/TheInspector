// S13 — Evidence gallery (DB-backed reads, Chunk 1B; edit actions arrive in 1G).
import Link from "next/link";
import { StaffShell, PhotoTile } from "@/components/Chrome";
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

  return (
    <StaffShell title={`Evidence — ${job.job_number}`}>
      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 mb-3">Evidence gallery</h1>

          {unfiled.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4">
              <h2 className="text-sm font-semibold text-amber-800 mb-2">Unfiled captures — file these first</h2>
              <div className="flex gap-3 flex-wrap">
                {unfiled.map((e) => (
                  <div key={e.id} className="w-40">
                    <PhotoTile hue={e.hue ?? 200} label={e.label} />
                    <span className="text-[10px] text-slate-400">Refile action arrives in Chunk 1G</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tpl.sections.map((s) => {
            const inSection = items.filter((e) => e.item_key && s.items.some((i) => i.key === e.item_key));
            if (inSection.length === 0) return null;
            return (
              <div key={s.key} className="mb-5">
                <h2 className="text-sm font-semibold text-slate-600 mb-2">{s.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {inSection.map((e) => (
                    <div key={e.id} className="bg-white rounded-lg border border-slate-200 p-2">
                      {(e as unknown as { file_key: string | null }).file_key ? (
                        (e as unknown as { mime_type: string | null }).mime_type === "application/pdf" ? (
                          <a href={`/api/files/${e.id}`} target="_blank" className="h-32 w-full rounded-md bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-medium">
                            📄 PDF — open
                          </a>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/files/${e.id}`} alt={e.label} className="h-32 w-full object-cover rounded-md" />
                        )
                      ) : (
                        <PhotoTile hue={e.hue ?? 200} label={e.label} />
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                        <span className={`rounded px-1 ${e.kind === "highres_client_photo" ? "bg-violet-100 text-violet-700" : e.kind === "client_upload" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>
                          {e.kind === "highres_client_photo" ? "HIGH-RES" : e.kind === "client_upload" ? "UPLOAD" : "FRAME"}
                        </span>
                        {!!e.is_featured && <span className="text-amber-600 font-medium">★ featured</span>}
                        <span className="ml-auto">{e.captured_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-slate-500">No evidence on this job yet (captures arrive with the live room, Chunk 1E; see INS-2026-0006 / 0010 for seeded examples).</p>}
        </div>

        <aside className="h-fit">
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
                <p className="text-[10px] text-slate-400 mt-2">Upload-request creation + real uploads arrive in Chunk 1G.</p>
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
