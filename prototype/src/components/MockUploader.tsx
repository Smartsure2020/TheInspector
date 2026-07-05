"use client";
// Visual upload mock (real uploads = Chunk 1G).
import { useState } from "react";

export function MockUploader({ items }: { items: { key: string; label: string }[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <>
      <div className="space-y-3 mt-4">
        {items.map((it, i) => (
          <div key={it.key} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-800">{i + 1}. {it.label}</div>
            {done[it.key] ? (
              <div className="mt-2 text-emerald-700 text-sm font-medium">✓ Received — thank you</div>
            ) : (
              <button className="mt-2 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold" onClick={() => setDone((d) => ({ ...d, [it.key]: true }))}>
                📷 Take photo or choose file
              </button>
            )}
          </div>
        ))}
      </div>
      {Object.keys(done).length === items.length && items.length > 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 text-center">
          All done — your assessor has been notified. (Real upload arrives in Chunk 1G.)
        </div>
      )}
    </>
  );
}
