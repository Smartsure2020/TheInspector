import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getClient } from "@/lib/data";
import { sendOtpAction, checkOtpVerified } from "@/lib/auth-actions";
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
      <div className="mt-10 text-center max-w-sm mx-auto">
        <div className="text-4xl mb-3">🔐</div>
        <h1 className="text-xl font-bold text-slate-800">Verify your identity</h1>
        <p className="text-sm text-slate-600 mt-3">
          {masked
            ? <>We sent a 6-digit code to <b>{masked}</b>.</>
            : <>A verification code has been sent to your phone.</>
          }
        </p>
        <VerifyOtpForm token={token} />
        <p className="text-xs text-slate-400 mt-4">
          The code is valid for 10 minutes. Didn&apos;t receive it? Check your SMS messages or contact your coordinator.
        </p>
      </div>
    </ClientShell>
  );
}
