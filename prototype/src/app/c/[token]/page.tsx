// S8 — Client landing page (DB-backed by token, Chunk 1B).
// VISIBILITY RULE: no internal data, ever (phase1/01 rule 2).
import Link from "next/link";
import { ClientShell } from "@/components/Chrome";
import { getJobByToken, getClient } from "@/lib/data";
import { CannotAttendButton } from "@/components/ClientBits";

export const dynamic = "force-dynamic";

export default async function ClientLanding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const job = getJobByToken(token);

  if (!job)
    return (
      <ClientShell>
        <div className="text-center mt-16">
          <h1 className="text-lg font-semibold text-slate-800">This link is no longer active</h1>
          <p className="text-sm text-slate-500 mt-2">Please contact your claims coordinator for a new link.</p>
        </div>
      </ClientShell>
    );

  const client = getClient(job.client_id);
  const prep =
    job.claim_type === "geyser_water"
      ? ["Access to the geyser (cupboard or roof access point)", "Your plumber's invoice, if you have it", "The rooms with water damage"]
      : ["The damaged item", "Its receipt or box, if you have it"];

  return (
    <ClientShell>
      <div className="mt-6">
        <div className="text-xs tracking-widest text-slate-400 font-semibold">ACORN</div>
        <h1 className="text-xl font-bold text-slate-800 mt-1">Your video assessment</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-4 text-sm">
          <p className="text-slate-700">Hello <b>{client?.full_name}</b></p>
          <p className="text-slate-600 mt-2">
            <b>{job.assessor_name ?? "Your assessor"}</b> will meet you on video on
            <br />
            <span className="text-lg font-semibold text-slate-800">{job.scheduled_start ?? "your scheduled time"}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Claim reference: {job.claim_number}</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 mt-3">
          <h2 className="text-sm font-semibold text-blue-900">Please have ready:</h2>
          <ul className="text-sm text-blue-800 mt-1 space-y-1">
            {prep.map((p) => <li key={p}>• {p}</li>)}
          </ul>
        </div>

        <Link href={`/c/${token}/consent`} className="block text-center mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-semibold">
          I&apos;m ready — continue
        </Link>
        <CannotAttendButton token={token} />
      </div>
    </ClientShell>
  );
}
