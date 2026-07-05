// S14 — Missing-evidence upload page (Chunk 1C: REAL uploads, link states,
// per-item complete/incomplete from the DB).
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getTemplate, missingItems, templateItemByKey, uploadsByItem } from "@/lib/data";
import { RequestNewLinkButton } from "@/components/ClientBits";
import { UploadItem } from "@/components/UploadItem";

export const dynamic = "force-dynamic";

const plainNames: Record<string, string> = {
  "gey.docs.plumber": "Plumber's invoice — photo or PDF",
  "gey.unit.plate": "Photo of the sticker/plate on the geyser",
};

export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = resolveToken(token);

  if (info.state === "invalid" || !info.job)
    return (
      <ClientShell>
        <div className="text-center mt-16">
          <div className="text-4xl mb-3">🔗</div>
          <h1 className="text-lg font-semibold text-slate-800">This link isn&apos;t recognised</h1>
          <p className="text-sm text-slate-500 mt-2">Please use the most recent link we sent you, or contact your claims coordinator.</p>
        </div>
      </ClientShell>
    );

  if (info.state === "revoked" || info.state === "expired")
    return (
      <ClientShell>
        <div className="text-center mt-16">
          <div className="text-4xl mb-3">⌛</div>
          <h1 className="text-lg font-semibold text-slate-800">
            {info.state === "expired" ? "This upload link has expired" : "This link has been replaced"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">No problem — request a fresh link below and your coordinator will send one.</p>
          <RequestNewLinkButton token={token} />
        </div>
      </ClientShell>
    );

  const tpl = getTemplate(info.job.template_id)!;
  const uploads = uploadsByItem(info.job.id);
  const items = missingItems(info.job.id).map((m) => ({
    key: m.item_key,
    label: plainNames[m.item_key] ?? templateItemByKey(tpl.sections, m.item_key)?.item.prompt ?? m.item_key,
    done: (uploads.get(m.item_key) ?? 0) > 0,
  }));
  const allDone = items.length > 0 && items.every((i) => i.done);

  return (
    <ClientShell>
      <div className="mt-6">
        <div className="text-xs tracking-widest text-slate-400 font-semibold">ACORN</div>
        <h1 className="text-xl font-bold text-slate-800 mt-1">A few things still needed</h1>
        <p className="text-sm text-slate-600 mt-1">Upload these when you have them — takes a minute, no app needed. Photos or PDF, up to 15&nbsp;MB.</p>

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            Nothing outstanding — you&apos;re all set. Thank you!
          </p>
        ) : (
          <div className="space-y-3 mt-4">
            {items.map((it, i) => (
              <UploadItem key={it.key} token={token} itemKey={it.key} label={`${i + 1}. ${it.label}`} done={it.done} />
            ))}
          </div>
        )}

        {allDone && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 text-center">
            All done — thank you! Your assessor has everything and will take it from here.
          </div>
        )}
      </div>
    </ClientShell>
  );
}
