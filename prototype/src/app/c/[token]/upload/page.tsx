// S14 — Missing-evidence upload page (DB-backed item list, Chunk 1B).
// Real file uploads arrive in Chunk 1G; the uploader below is a visual mock.
import { ClientShell } from "@/components/Chrome";
import { getJobByToken, getTemplate, missingItems, templateItemByKey } from "@/lib/data";
import { MockUploader } from "@/components/MockUploader";

export const dynamic = "force-dynamic";

const plainNames: Record<string, string> = {
  "gey.docs.plumber": "Plumber's invoice — photo or PDF",
  "gey.unit.plate": "Photo of the sticker/plate on the geyser",
};

export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = getJobByToken(token);

  if (!job)
    return (
      <ClientShell>
        <div className="text-center mt-16">
          <h1 className="text-lg font-semibold text-slate-800">This link is no longer active</h1>
          <p className="text-sm text-slate-500 mt-2">Please contact your claims coordinator.</p>
        </div>
      </ClientShell>
    );

  const tpl = getTemplate(job.template_id)!;
  const items = missingItems(job.id).map((m) => ({
    key: m.item_key,
    label: plainNames[m.item_key] ?? templateItemByKey(tpl.sections, m.item_key)?.item.prompt ?? m.item_key,
  }));

  return (
    <ClientShell>
      <div className="mt-6">
        <div className="text-xs tracking-widest text-slate-400 font-semibold">ACORN</div>
        <h1 className="text-xl font-bold text-slate-800 mt-1">A few things still needed</h1>
        <p className="text-sm text-slate-600 mt-1">Upload these when you have them — takes a minute, no app needed.</p>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">Nothing outstanding — you&apos;re all set.</p>
        ) : (
          <MockUploader items={items} />
        )}
      </div>
    </ClientShell>
  );
}
