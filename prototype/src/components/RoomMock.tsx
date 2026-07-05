"use client";
// S12 (assessor view) — STATIC LAYOUT MOCK (1A UI, DB-fed since 1B).
// No video yet: real AV integration is Chunk 1D, gated on the spike verdict.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PrototypeBanner, PhotoTile } from "@/components/Chrome";
import { TemplateSection } from "@/lib/types";

interface MockCapture { id: number; label: string; hue: number; itemKey?: string }
let captureSeq = 0; // Date.now() collides on rapid captures — burst-friendly ids

export function RoomMock({ jobId, jobNumber, clientName, templateName, templateVersion, sections }: {
  jobId: string; jobNumber: string; clientName: string; templateName: string; templateVersion: string; sections: TemplateSection[];
}) {
  const [active, setActive] = useState<string | undefined>();
  const [captures, setCaptures] = useState<MockCapture[]>([]);
  const [flash, setFlash] = useState(false);
  const [banner, setBanner] = useState<string>("");

  const activeItem = useMemo(() => {
    if (!active) return undefined;
    for (const s of sections) for (const i of s.items) if (i.key === active) return { s, i };
    return undefined;
  }, [sections, active]);

  const capture = () => {
    const now = new Date().toTimeString().slice(0, 8);
    const label = activeItem ? `${activeItem.s.title} – ${activeItem.i.prompt.slice(0, 30)} – ${now}` : `UNFILED – ${now}`;
    setCaptures((c) => [{ id: ++captureSeq, label, hue: Math.floor(Math.random() * 360), itemKey: active }, ...c].slice(0, 30));
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      if (e.key.toLowerCase() === "c") capture();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sections]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <PrototypeBanner />
      <header className="px-4 py-2 flex items-center gap-3 text-slate-300 text-sm">
        <Link href={`/jobs/${jobId}`} className="hover:text-white">← {jobNumber}</Link>
        <span>{clientName}</span>
        <span className="text-xs bg-slate-700 rounded px-2 py-0.5">Session 00:00 (mock)</span>
        <span className="ml-auto text-xs text-amber-400">STATIC MOCK — live AV arrives in Chunk 1D after the spike verdict</span>
      </header>

      <div className="flex-1 grid grid-cols-[3fr_2fr] gap-2 px-2 pb-2 min-h-0">
        <div className={`relative rounded-xl bg-slate-800 flex items-center justify-center transition ${flash ? "ring-4 ring-white" : ""}`}>
          <div className="text-slate-500 text-center">
            <div className="text-6xl mb-2">📹</div>
            <p className="text-sm">Client video placeholder</p>
            {banner && <p className="mt-3 text-xs bg-blue-900/70 text-blue-200 rounded px-3 py-1">Client banner: “{banner}”</p>}
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            <button onClick={capture} className="bg-white text-slate-900 rounded-full px-5 py-2.5 text-sm font-bold shadow hover:bg-slate-100" title="Hotkey: C">
              ● Capture
            </button>
            <button
              disabled={!activeItem}
              onClick={() => alert("High-res request round-trip builds in Chunk 1F.")}
              className="bg-violet-600 disabled:opacity-40 text-white rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-violet-500"
            >
              Request photo
            </button>
            <button onClick={() => setBanner("Please switch to your back camera")} className="bg-slate-700 text-slate-200 rounded-full px-3 py-2.5 text-xs hover:bg-slate-600">Flip prompt</button>
            <button onClick={() => setBanner("Please switch your torch on")} className="bg-slate-700 text-slate-200 rounded-full px-3 py-2.5 text-xs hover:bg-slate-600">Torch prompt</button>
            <button onClick={() => alert("End-session summary builds in Chunk 1E.")} className="bg-rose-700 text-white rounded-full px-4 py-2.5 text-xs hover:bg-rose-600">End</button>
          </div>
        </div>

        <div className="rounded-xl bg-slate-100 overflow-y-auto p-3">
          <div className="text-xs text-slate-500 mb-2">
            {templateName} v{templateVersion} — tap an item to make it active, then Capture (or press C).
          </div>
          {sections.map((s) => (
            <div key={s.key} className="mb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">{s.title}</h3>
              <ul className="mt-1 space-y-1">
                {s.items.map((i) => {
                  const isActive = active === i.key;
                  const count = captures.filter((c) => c.itemKey === i.key).length;
                  return (
                    <li key={i.key}>
                      <button
                        onClick={() => { setActive(i.key); if (i.clientInstruction) setBanner(i.clientInstruction); }}
                        className={`w-full text-left text-xs rounded-lg px-2 py-1.5 border ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"}`}
                      >
                        {i.prompt}
                        <span className="float-right flex gap-1 items-center">
                          {i.highRes && <span className={isActive ? "text-violet-200" : "text-violet-500"}>HI-RES</span>}
                          {count > 0 && <span className={`rounded-full px-1.5 ${isActive ? "bg-white/20" : "bg-emerald-100 text-emerald-700"}`}>{count}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="h-24 bg-slate-800 px-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-slate-500 text-xs whitespace-nowrap">Capture tray ({captures.length})</span>
        {captures.slice(0, 8).map((c) => (
          <div key={c.id} className="flex-shrink-0" title={c.label}>
            <PhotoTile hue={c.hue} small />
            <div className="text-[9px] text-slate-400 w-24 truncate">{c.label}</div>
          </div>
        ))}
        {captures.length === 0 && <span className="text-slate-600 text-xs">— select an item and press Capture / C —</span>}
      </div>
    </div>
  );
}
