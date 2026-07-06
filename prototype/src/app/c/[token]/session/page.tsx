// S12 client wrapper — real live room (Chunk 1D). Link-state guarded; if the
// session already ended (job moved on), shows the completion state directly.
import { redirect } from "next/navigation";
import { PrototypeBanner } from "@/components/Chrome";
import { ClientRoom } from "@/components/ClientRoom";
import { resolveToken } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClientSession({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = resolveToken(token);
  if (info.state === "invalid" || info.state === "revoked" || info.state === "expired" || !info.job)
    redirect(`/c/${token}`);

  const post = ["Awaiting evidence", "Awaiting report", "Report submitted", "Returned for correction", "Report completed"];
  if (post.includes(info.job.status))
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <PrototypeBanner client />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-slate-800">Your assessment is complete</h1>
            <p className="text-sm text-slate-600 mt-3 max-w-sm">
              If anything else is needed we&apos;ll send you a simple upload link.
              The claims team will be in touch about next steps.
            </p>
          </div>
        </div>
      </div>
    );

  return <ClientRoom token={token} jobId={info.job.id} assessorName={info.job.assessor_name ?? "Your assessor"} />;
}
