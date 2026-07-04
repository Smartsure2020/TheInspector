"use client";
// S8 — Client landing page. VISIBILITY RULE: no internal data, ever (phase1/01 rule 2).
import { useParams, useRouter } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { jobByToken, clientById, userById, templateById } from "@/lib/fixtures";

export default function ClientLanding() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const job = jobByToken(token);

  if (!job)
    return (
      <ClientShell>
        <div className="text-center mt-16">
          <h1 className="text-lg font-semibold text-slate-800">This link is no longer active</h1>
          <p className="text-sm text-slate-500 mt-2">Please contact your claims coordinator for a new link.</p>
          <button className="mt-4 bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-semibold w-full" onClick={() => alert("Coordinator notified (mock).")}>
            Request a new link
          </button>
        </div>
      </ClientShell>
    );

  const client = clientById(job.clientId);
  const assessor = userById(job.assessorId);
  const prep =
    job.claimType === "geyser_water"
      ? ["Access to the geyser (cupboard or roof access point)", "Your plumber's invoice, if you have it", "The rooms with water damage"]
      : ["The damaged item", "Its receipt or box, if you have it"];
  void templateById;

  return (
    <ClientShell>
      <div className="mt-6">
        <div className="text-xs tracking-widest text-slate-400 font-semibold">ACORN</div>
        <h1 className="text-xl font-bold text-slate-800 mt-1">Your video assessment</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-4 text-sm">
          <p className="text-slate-700">Hello <b>{client?.name}</b></p>
          <p className="text-slate-600 mt-2">
            <b>{assessor?.name ?? "Your assessor"}</b> will meet you on video on
            <br />
            <span className="text-lg font-semibold text-slate-800">{job.scheduledStart ?? "your scheduled time"}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Claim reference: {job.claimNumber}</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 mt-3">
          <h2 className="text-sm font-semibold text-blue-900">Please have ready:</h2>
          <ul className="text-sm text-blue-800 mt-1 space-y-1">
            {prep.map((p) => <li key={p}>• {p}</li>)}
          </ul>
        </div>

        <button className="mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-semibold" onClick={() => router.push(`/c/${token}/consent`)}>
          I&apos;m ready — continue
        </button>
        <button className="mt-2 w-full text-slate-500 text-sm py-2" onClick={() => alert("Your coordinator has been notified and will contact you to rebook (mock).")}>
          I can&apos;t make it
        </button>
      </div>
    </ClientShell>
  );
}
