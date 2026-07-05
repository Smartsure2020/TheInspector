"use client";
import { useState } from "react";
import { createJobAction } from "@/lib/actions";
import { TemplateSection } from "@/lib/types";

interface Tpl { id: string; name: string; version: string; is_reference_only: number; sections: TemplateSection[] }
interface Assessor { id: string; name: string }

export function CreateJobForm({ templates, assessors }: { templates: Tpl[]; assessors: Assessor[] }) {
  const [templateId, setTemplateId] = useState(templates.find((t) => !t.is_reference_only)?.id ?? "");
  const tpl = templates.find((t) => t.id === templateId);

  const field = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white";
  const label = "block text-xs font-medium text-slate-500 mt-3 mb-1";

  return (
    <form action={createJobAction} className="grid md:grid-cols-[1fr_320px] gap-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">New assessment job</h1>

        <section className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
          <h2 className="font-medium text-slate-700">Client <span className="text-[10px] text-amber-600">(role-play data only)</span></h2>
          <label className={label}>Full name</label>
          <input name="client_name" required className={field} placeholder="Test Insured 13" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Phone</label><input name="client_phone" className={field} placeholder="082 555 0113" /></div>
            <div><label className={label}>Email</label><input name="client_email" className={field} placeholder="test13@example.invalid" /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
          <h2 className="font-medium text-slate-700">Claim</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Claim number</label><input name="claim_number" required className={field} placeholder="CLM-88113" /></div>
            <div><label className={label}>Policy number</label><input name="policy_number" className={field} placeholder="POL-0000" /></div>
          </div>
          <label className={label}>Claim type</label>
          <select name="template_id" className={field} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => (
              <option key={t.id} value={t.id} disabled={!!t.is_reference_only}>
                {t.name}{t.is_reference_only ? " — reference only, not in Phase 1" : ""}
              </option>
            ))}
          </select>
          <label className={label}>Date of loss</label>
          <input name="date_of_loss" type="date" className={field} />
          <label className={label}>Loss description</label>
          <textarea name="description" className={field} rows={2} />
          <label className={label}>Special conditions to verify</label>
          <textarea name="special_conditions" className={field} rows={2} placeholder="Policy warranties the assessor must check" />
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
          <h2 className="font-medium text-slate-700">Assignment</h2>
          <label className={label}>Assessor</label>
          <select name="assessor_id" className={field} defaultValue="">
            <option value="">— assign later —</option>
            {assessors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <label className={label}>Priority</label>
          <select name="priority" className={field}><option>Normal</option><option>High</option></select>
        </section>

        <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold">
          Create job
        </button>
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
    </form>
  );
}
