"use client";
// S5 — Create job. Static in 1A: form renders + template preview; save arrives in 1B.
import { useState } from "react";
import { StaffShell } from "@/components/Chrome";
import { templates, users } from "@/lib/fixtures";

export default function CreateJob() {
  const [claimType, setClaimType] = useState("tpl-geyser");
  const [saved, setSaved] = useState(false);
  const tpl = templates.find((t) => t.id === claimType);

  const field = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white";
  const label = "block text-xs font-medium text-slate-500 mt-3 mb-1";

  return (
    <StaffShell title="Create assessment job">
      <div className="grid md:grid-cols-[1fr_320px] gap-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">New assessment job</h1>

          <section className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
            <h2 className="font-medium text-slate-700">Client</h2>
            <label className={label}>Full name</label>
            <input className={field} placeholder="Test Insured 13 (role-play data only)" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Phone</label><input className={field} placeholder="082 555 0113" /></div>
              <div><label className={label}>Email</label><input className={field} placeholder="test13@example.invalid" /></div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
            <h2 className="font-medium text-slate-700">Claim</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Claim number</label><input className={field} placeholder="CLM-88113" /></div>
              <div><label className={label}>Policy number</label><input className={field} placeholder="POL-0000" /></div>
            </div>
            <label className={label}>Claim type</label>
            <select className={field} value={claimType} onChange={(e) => setClaimType(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id} disabled={t.referenceOnly}>
                  {t.name}{t.referenceOnly ? " — reference only, not in Phase 1" : ""}
                </option>
              ))}
            </select>
            <label className={label}>Date of loss</label>
            <input type="date" className={field} />
            <label className={label}>Loss description</label>
            <textarea className={field} rows={2} />
            <label className={label}>Special conditions to verify</label>
            <textarea className={field} rows={2} placeholder="Policy warranties the assessor must check" />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
            <h2 className="font-medium text-slate-700">Assignment</h2>
            <label className={label}>Assessor</label>
            <select className={field}>
              <option>— assign later —</option>
              {users.filter((u) => u.role === "assessor").map((u) => <option key={u.id}>{u.name}</option>)}
            </select>
            <label className={label}>Priority</label>
            <select className={field}><option>Normal</option><option>High</option></select>
          </section>

          <button
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
            onClick={() => setSaved(true)}
          >
            Create job
          </button>
          {saved && (
            <p className="text-sm text-amber-700 mt-2">
              Prototype 1A: form is a static shell — persistence arrives in Chunk 1B.
            </p>
          )}
        </div>

        <aside className="bg-slate-50 rounded-xl border border-slate-200 p-4 h-fit">
          <h3 className="text-sm font-semibold text-slate-700">Template preview</h3>
          <p className="text-xs text-slate-400 mb-2">{tpl?.name} · v{tpl?.version}</p>
          {tpl?.sections.length ? (
            <ol className="text-xs text-slate-600 space-y-2">
              {tpl.sections.map((s) => (
                <li key={s.key}>
                  <span className="font-medium">{s.title}</span>
                  <span className="text-slate-400"> — {s.items.length} items, {s.items.filter((i) => i.evidenceRequired).length} need evidence</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-slate-400">Reference-only template — no checklist wired in Phase 1.</p>
          )}
        </aside>
      </div>
    </StaffShell>
  );
}
