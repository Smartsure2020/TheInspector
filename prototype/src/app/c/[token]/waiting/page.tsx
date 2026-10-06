// S11 — Waiting room (Chunk 1C readiness ping + 1D admit listener).
// VISIBILITY RULE: client-facing information only.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getClient } from "@/lib/data";
import { ClientPing } from "@/components/ClientBits";
import { WaitingLive } from "@/components/WaitingLive";
import { ClientCard, ClientStepHeader } from "@/components/ui/client";
import { Icon } from "@/components/ui/Icon";
import { checkOtpVerified } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default async function WaitingRoom({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await checkOtpVerified(token))) redirect(`/c/${token}/verify`);
  const info = await resolveToken(token);
  if (info.state === "invalid" || info.state === "revoked" || info.state === "expired") redirect(`/c/${token}`);
  const first = info.job ? (await getClient(info.job.client_id))?.full_name.split(" ")[0] : "there";
  const assessor = info.job?.assessor_name ?? "Your assessor";

  return (
    <ClientShell>
      <ClientPing token={token} kind="client_waiting" />

      <ClientStepHeader
        step="Join"
        title={`Thanks, ${first} — you’re all set`}
        lede={`${assessor} will let you in shortly. There’s nothing else for you to do.`}
      />

      {info.job && <WaitingLive token={token} jobId={info.job.id} assessorName={assessor} />}

      <ClientCard title="Done so far" className="mt-3" icon="checkCircle" tone="plain">
        <ul className="space-y-2">
          {["You confirmed you’re happy to go ahead", "Your camera and microphone were checked", `${assessor} has been told you’re waiting`].map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-base leading-relaxed text-foreground/85">
              <Icon name="check" size={16} className="mt-1 shrink-0 text-status-success" />
              {t}
            </li>
          ))}
        </ul>
      </ClientCard>

      <p className="mt-6 text-center">
        <Link href={`/c/${token}/session`} className="text-sm text-muted-light underline">
          Prototype shortcut: enter the session view
        </Link>
      </p>
    </ClientShell>
  );
}
