"use client";
// S12 (client view) — static mock, 1A. Own camera large, banner, flip/torch only.
// VISIBILITY RULE: nothing internal renders here, ever.
import { useState } from "react";
import { PrototypeBanner } from "@/components/Chrome";

export default function ClientSession() {
  const [flash, setFlash] = useState(false);
  const demoFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <PrototypeBanner client />
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
          <div className="text-center">
            <div className="text-6xl">🤳</div>
            <p className="text-xs mt-2">Your camera view (placeholder — live video in Chunk 1D)</p>
          </div>
        </div>
        {/* Instruction banner */}
        <div className="absolute top-3 left-3 right-3 bg-blue-600/90 text-white text-sm rounded-xl px-4 py-3 text-center">
          Please show the bottom of the geyser
        </div>
        {/* Assessor thumbnail */}
        <div className="absolute right-3 top-16 w-20 h-28 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center text-[10px] text-slate-400">
          Assessor
        </div>
        {flash && (
          <div className="absolute inset-x-0 top-1/3 text-center">
            <span className="bg-white/90 text-slate-900 text-sm font-semibold rounded-full px-4 py-2">📸 Photo taken ✓</span>
          </div>
        )}
      </div>
      <div className="bg-slate-900 p-4 flex gap-3 justify-center">
        <button className="bg-slate-700 text-white rounded-full w-14 h-14 text-xl" title="Flip camera">🔄</button>
        <button className="bg-slate-700 text-white rounded-full w-14 h-14 text-xl" title="Torch">🔦</button>
        <button className="bg-white text-slate-900 rounded-full px-5 text-xs font-semibold" onClick={demoFlash}>
          demo: photo-taken flash
        </button>
        <button className="bg-rose-800 text-white rounded-full w-14 h-14 text-xl" title="Leave" onClick={() => confirm("Leave the assessment?")}>✕</button>
      </div>
    </div>
  );
}
