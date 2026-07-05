"use client";
// Manager review actions are Chunk 1I scope — stubbed cleanly per the 1B brief.
import { useRole } from "@/lib/role";

export function ManagerStub({ jobStatus, assessorName, clientName }: { jobStatus: string; assessorName: string; clientName: string }) {
  const { user } = useRole();
  if (user?.role !== "manager" || jobStatus !== "Report submitted") return null;
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-violet-800 mb-2">Manager review (wires up in Chunk 1I)</h2>
      <p className="text-xs text-slate-600 mb-3">Assessor: {assessorName} · Client: {clientName} · Side-by-side review view builds in 1I.</p>
      <div className="flex gap-2">
        <button className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => alert("Approve locks the version and finalises artefacts — Chunk 1I.")}>Approve</button>
        <button className="bg-rose-600 text-white rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => alert("Return with per-section comments — Chunk 1I.")}>Return with comments</button>
      </div>
    </div>
  );
}
