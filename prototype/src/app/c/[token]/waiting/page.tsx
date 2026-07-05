// S11 — Waiting room (Chunk 1C: calm state + client_waiting ping for staff
// readiness indicators). Real admit flow arrives in 1D.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getClient } from "@/lib/data";
import { ClientPing } from "@/components/ClientBits";

export const dynamic = "force-dynamic";

export default async function WaitingRoom({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = resolveToken(token);
  if (info.state === "invalid" || info.state === "revoked" || info.state === "expired") redirect(`/c/${token}`);
  const first = info.job ? getClient(info.job.client_id)?.full_name.split(" ")[0] : "there";
  const assessor = info.job?.assessor_name ?? "your assessor";

  return (
    <ClientShell>
      <ClientPing token={token} kind="client_waiting" />
      <div className="mt-20 text-center">
        <div className="animate-pulse text-5xl">🟢</div>
        <h1 className="text-xl font-bold text-slate-800 mt-4">Thanks, {first}</h1>
        <p className="text-slate-600 mt-2 text-sm">
          {assessor} will let you in shortly.
          <br />
          Please keep this screen open — you don&apos;t need to do anything.
        </p>
        <p className="text-xs text-slate-400 mt-6">Waiting quietly uses almost no data.</p>
        <Link href={`/c/${token}/session`} className="inline-block mt-10 text-[11px] text-slate-400 underline">
          (prototype shortcut: enter session view)
        </Link>
      </div>
    </ClientShell>
  );
}
