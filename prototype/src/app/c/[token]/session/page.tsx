// S12 client wrapper — real live room (Chunk 1D). Link-state guarded; if the
// session already ended (the job has moved on), the completion state shows
// directly instead of dropping the client into an empty room.
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { ClientRoom } from "@/components/ClientRoom";
import { ClientOutcome } from "@/components/ui/client";
import { resolveToken } from "@/lib/data";
import { checkOtpVerified } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

/** Internal statuses are used only to pick the client-facing message. */
const POST_SESSION = ["Awaiting evidence", "Awaiting report", "Report submitted", "Returned for correction", "Report completed"];

export default async function ClientSession({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await checkOtpVerified(token))) redirect(`/c/${token}/verify`);
  const info = await resolveToken(token);
  if (info.state === "invalid" || info.state === "revoked" || info.state === "expired" || !info.job)
    redirect(`/c/${token}`);

  if (POST_SESSION.includes(info.job.status)) {
    const awaitingUpload = info.job.status === "Awaiting evidence";
    return (
      <ClientShell>
        <ClientOutcome icon="checkCircle" tone="success" title="Your assessment is complete">
          <p>
            Thank you — the video part is finished and nothing else is needed on
            this screen.
          </p>
          <p className="mt-3">
            {awaitingUpload
              ? "There are a couple of items still to send us. Use the upload link in your SMS whenever you have them."
              : "If anything else is needed we’ll send you a simple upload link. The claims team will be in touch about next steps."}
          </p>
          <p className="mt-3 text-sm">You can close this page.</p>
        </ClientOutcome>
      </ClientShell>
    );
  }

  return <ClientRoom token={token} jobId={info.job.id} assessorName={info.job.assessor_name ?? "Your assessor"} />;
}
