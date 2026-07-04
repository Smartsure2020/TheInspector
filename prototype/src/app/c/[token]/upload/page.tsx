"use client";
// S14 — Missing-evidence upload page (mock, 1A; real uploads in 1G).
import { useParams } from "next/navigation";
import { useState } from "react";
import { ClientShell } from "@/components/Chrome";
import { jobByToken, templateById, itemByKey } from "@/lib/fixtures";

const plainNames: Record<string, string> = {
  "gey.docs.plumber": "Plumber's invoice — photo or PDF",
  "gey.unit.plate": "Photo of the sticker/plate on the geyser",
};

export default function UploadPage() {
  const { token } = useParams<{ token: string }>();
  const job = jobByToken(token);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const items = job?.missingItemKeys ?? ["gey.docs.plumber", "gey.unit.plate"];
  const tpl = job ? templateById(job.templateId) : undefined;

  return (
    <ClientShell>
      <div className="mt-6">
        <div className="text-xs tracking-widest text-slate-400 font-semibold">ACORN</div>
        <h1 className="text-xl font-bold text-slate-800 mt-1">A few things still needed</h1>
        <p className="text-sm text-slate-600 mt-1">Upload these when you have them — takes a minute, no app needed.</p>
        <div className="space-y-3 mt-4">
          {items.map((k, i) => (
            <div key={k} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-800">
                {i + 1}. {plainNames[k] ?? (tpl && itemByKey(tpl, k)?.prompt) ?? k}
              </div>
              {done[k] ? (
                <div className="mt-2 text-emerald-700 text-sm font-medium">✓ Received — thank you</div>
              ) : (
                <button className="mt-2 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold" onClick={() => setDone((d) => ({ ...d, [k]: true }))}>
                  📷 Take photo or choose file
                </button>
              )}
            </div>
          ))}
        </div>
        {Object.keys(done).length === items.length && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 text-center">
            All done — your assessor has been notified. (Real upload arrives in Chunk 1G.)
          </div>
        )}
      </div>
    </ClientShell>
  );
}
