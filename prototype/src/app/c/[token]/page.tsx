// S8 — Client landing page with link-state handling (Chunk 1C).
// States: valid | too_early | expired | revoked | invalid (+ upload links route on).
// VISIBILITY RULE: no internal data, ever (phase1/01 rule 2).
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getClient } from "@/lib/data";
import { CannotAttendButton, ClientPing, Countdown, RequestNewLinkButton } from "@/components/ClientBits";

export const dynamic = "force-dynamic";

function LinkProblem({ title, body, token, offerNewLink }: { title: string; body: string; token: string; offerNewLink: boolean }) {
  return (
    <ClientShell>
      <div className="text-center mt-16">
        <div className="text-4xl mb-3">🔗</div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500 mt-2">{body}</p>
        {offerNewLink && <RequestNewLinkButton token={token} />}
      </div>
    </ClientShell>
  );
}

export default async function ClientLanding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = resolveToken(token);

  if (info.purpose === "upload" && info.state === "valid") redirect(`/c/${token}/upload`);

  if (info.state === "invalid")
    return <LinkProblem token={token} offerNewLink={false} title="This link isn't recognised"
      body="Please check you tapped the most recent link in your SMS or email, or contact your claims coordinator." />;
  if (info.state === "revoked")
    return <LinkProblem token={token} offerNewLink={true} title="This link has been replaced"
      body="Your appointment was rebooked, so this older link no longer works. Please use the newest link we sent you — or request a fresh one below." />;
  if (info.state === "expired")
    return <LinkProblem token={token} offerNewLink={true} title="This link has expired"
      body="No problem — these links only work around your appointment time. Request a new one below and your coordinator will sort it out." />;

  const job = info.job!;
  const client = getClient(job.client_id);
  const claimRef = job.claim_number.length > 5 ? `…${job.claim_number.slice(-5)}` : job.claim_number;
  const prep =
    job.claim_type === "geyser_water"
      ? ["Access to the geyser (cupboard or roof access point)", "Your plumber's invoice, if you have it", "The rooms with water damage"]
      : ["The damaged item", "Its receipt or box, if you have it"];

  if (info.state === "too_early")
    return (
      <ClientShell>
        <ClientPing token={token} kind="link_opened" />
        <div className="mt-10 text-center">
          <div className="text-4xl mb-3">⏰</div>
          <h1 className="text-xl font-bold text-slate-800">You&apos;re a little early</h1>
          <p className="text-sm text-slate-600 mt-3">
            Hello <b>{client?.full_name}</b> — your video assessment with {job.assessor_name ?? "your assessor"} starts in{" "}
            <Countdown target={info.scheduledStart!} />.
          </p>
          <p className="text-sm text-slate-500 mt-2">Come back to this same link at <b>{info.scheduledStart}</b>.</p>
          <div className="bg-blue-50 rounded-2xl p-4 mt-5 text-left">
            <h2 className="text-sm font-semibold text-blue-900">Please have ready:</h2>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">{prep.map((p) => <li key={p}>• {p}</li>)}</ul>
          </div>
          <CannotAttendButton token={token} />
          <p className="mt-6"><Link href={`/c/${token}/consent`} className="text-[11px] text-slate-400 underline">Prototype preview: continue anyway</Link></p>
        </div>
      </ClientShell>
    );

  return (
    <ClientShell>
      <ClientPing token={token} kind="link_opened" />
      <div className="mt-6">
        <div className="text-xs tracking-widest text-slate-400 font-semibold">ACORN</div>
        <h1 className="text-xl font-bold text-slate-800 mt-1">Your video assessment</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-4 text-sm">
          <p className="text-slate-700">Hello <b>{client?.full_name}</b></p>
          <p className="text-slate-600 mt-2">
            <b>{job.assessor_name ?? "Your assessor"}</b> will meet you on video on
            <br />
            <span className="text-lg font-semibold text-slate-800">{info.scheduledStart ?? "your scheduled time"}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Claim reference: {claimRef}</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 mt-3">
          <h2 className="text-sm font-semibold text-blue-900">Please have ready:</h2>
          <ul className="text-sm text-blue-800 mt-1 space-y-1">{prep.map((p) => <li key={p}>• {p}</li>)}</ul>
        </div>

        <Link href={`/c/${token}/consent`} className="block text-center mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-semibold">
          I&apos;m ready — continue
        </Link>
        <CannotAttendButton token={token} />
      </div>
    </ClientShell>
  );
}
