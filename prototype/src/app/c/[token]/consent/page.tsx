// S9 — Consent PLACEHOLDER (draft wording; final legal text = production hardening).
// Acceptance now logs a consent_accepted event against the job (Chunk 1B).
import { ClientShell } from "@/components/Chrome";
import { ConsentForm } from "@/components/ClientBits";

export const dynamic = "force-dynamic";

export default async function Consent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <ClientShell>
      <div className="mt-6">
        <h1 className="text-xl font-bold text-slate-800">Before we start</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-4 text-sm text-slate-600 space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-amber-600 font-semibold">Draft consent wording — placeholder for prototype</p>
          <p>• You&apos;ll be on a video call with your assessor. Nobody else joins.</p>
          <p>• The assessor will take <b>photos of what you show</b> — you&apos;ll see a note each time a photo is taken.</p>
          <p>• The photos and your answers are used <b>only for your claim</b>.</p>
          <p>• You can ask questions at any time, and you can stop the call at any time.</p>
        </div>
        <ConsentForm token={token} />
      </div>
    </ClientShell>
  );
}
