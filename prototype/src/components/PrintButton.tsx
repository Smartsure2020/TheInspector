"use client";
// Print / save-as-PDF via the browser (Chunk 1E). Prototype output only —
// server-side PDF generation is a later production decision.
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium"
      title="Browser print — choose 'Save as PDF'"
    >
      Print / save PDF
    </button>
  );
}
