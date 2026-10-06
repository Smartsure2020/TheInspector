// S9 — Consent PLACEHOLDER (draft wording; final legal text = production hardening).
// Acceptance logs a consent_accepted event against the job (Chunk 1B).
// The disclosures below must not be softened or shortened.
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { ConsentForm } from "@/components/ClientBits";
import { ClientBullets, ClientCard, ClientStepHeader } from "@/components/ui/client";
import { Icon } from "@/components/ui/Icon";
import { resolveToken, getClient } from "@/lib/data";
import { checkOtpVerified } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default async function Consent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await checkOtpVerified(token))) redirect(`/c/${token}/verify`);
  const info = await resolveToken(token);
  if (info.state === "invalid" || info.state === "revoked" || info.state === "expired") redirect(`/c/${token}`);

  const client = info.job ? await getClient(info.job.client_id) : undefined;
  const assessor = info.job?.assessor_name ?? "your assessor";

  return (
    <ClientShell>
      <ClientStepHeader
        step="Permission"
        title="Before we start"
        lede="Please read these four points. They explain what happens on the call and what we do with what we see."
      />

      <p className="mb-3 flex items-center gap-2 rounded-md border border-proto-line bg-proto-bg px-3 py-2 text-sm font-medium text-proto">
        <Icon name="warning" size={15} />
        Draft consent wording — placeholder for the prototype
      </p>

      <ClientCard tone="plain">
        <ClientBullets
          items={[
            <>You’ll be on a video call with <strong className="text-foreground">{assessor}</strong>. Nobody else joins, and <strong className="text-foreground">the call is not recorded</strong>.</>,
            <>Your camera and microphone are used only for this call, so {assessor} can see what you show them and talk you through it.</>,
            <>{assessor} will take <strong className="text-foreground">photos of what you show</strong> — you’ll see a note on screen each time a photo is taken.</>,
            <>The photos and your answers are used <strong className="text-foreground">only for your claim</strong>.</>,
            <>You can ask questions at any time, and you can stop the call at any time.</>,
          ]}
        />
      </ClientCard>

      <ClientCard tone="plain" className="mt-3" icon="info" title="If you’d rather not">
        <p className="text-base leading-relaxed text-muted">
          That’s completely fine. Tap “I’d rather not do this on video” below and
          someone will contact you about other options, including an in-person
          visit. Nothing is held against your claim.
        </p>
      </ClientCard>

      <div className="mt-5">
        <ConsentForm token={token} clientName={client?.full_name} />
      </div>
    </ClientShell>
  );
}
