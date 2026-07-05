// S11 — Waiting room (DB-backed names, Chunk 1B). Real admit flow arrives in 1D.
import Link from "next/link";
import { ClientShell } from "@/components/Chrome";
import { getJobByToken, getClient } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function WaitingRoom({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = getJobByToken(token);
  const first = job ? getClient(job.client_id)?.full_name.split(" ")[0] : "there";
  const assessor = job?.assessor_name ?? "your assessor";

  return (
    <ClientShell>
      <div className="mt-20 text-center">
        <div className="animate-pulse text-5xl">🟢</div>
        <h1 className="text-xl font-bold text-slate-800 mt-4">Thanks, {first}</h1>
        <p className="text-slate-600 mt-2 text-sm">{assessor} will let you in shortly.<br />Please keep this screen open.</p>
        <Link href={`/c/${token}/session`} className="inline-block mt-10 text-xs text-blue-600 underline">
          (prototype shortcut: enter session view)
        </Link>
      </div>
    </ClientShell>
  );
}
