import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getClient } from "@/lib/data";
import { sendOtpAction, checkOtpVerified } from "@/lib/auth-actions";
import { Icon } from "@/components/ui/Icon";
import { VerifyOtpForm } from "./VerifyOtpForm";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const alreadyVerified = await checkOtpVerified(token);
  if (alreadyVerified) redirect(`/c/${token}`);

  const info = await resolveToken(token);
  if (info.state === "invalid") redirect(`/c/${token}`);

  const client = await getClient(info.job?.client_id ?? "");
  const phone = client?.phone;
  const masked = phone ? phone.slice(0, 3) + " *** " + phone.slice(-3) : null;

  await sendOtpAction(token);

  return (
    <ClientShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent">
            <Icon name="shield" size={26} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Let’s check it’s you
          </h1>
          <p className="mt-2.5 text-base leading-relaxed text-muted">
            {masked
              ? <>We’ve sent a 6-digit code to <strong className="text-foreground tnum">{masked}</strong>.</>
              : <>We’ve sent a 6-digit code to your phone.</>}
          </p>
        </div>

        <VerifyOtpForm token={token} />

        <p className="mt-5 text-center text-sm leading-relaxed text-muted">
          The code lasts 10 minutes. If it hasn’t arrived, check your SMS messages
          — or contact your claims coordinator and they’ll help.
        </p>
      </div>
    </ClientShell>
  );
}
