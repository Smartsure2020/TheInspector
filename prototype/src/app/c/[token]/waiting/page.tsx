"use client";
// S11 — Waiting room (mock, 1A). Real admit flow arrives with the room in 1D.
import { useParams, useRouter } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { jobByToken, userById, clientById } from "@/lib/fixtures";

export default function WaitingRoom() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const job = jobByToken(token);
  const first = job ? clientById(job.clientId)?.name.split(" ")[0] : "there";
  const assessor = job ? userById(job.assessorId)?.name : "your assessor";

  return (
    <ClientShell>
      <div className="mt-20 text-center">
        <div className="animate-pulse text-5xl">🟢</div>
        <h1 className="text-xl font-bold text-slate-800 mt-4">Thanks, {first}</h1>
        <p className="text-slate-600 mt-2 text-sm">{assessor} will let you in shortly.<br />Please keep this screen open.</p>
        <button className="mt-10 text-xs text-blue-600 underline" onClick={() => router.push(`/c/${token}/session`)}>
          (prototype shortcut: enter session view)
        </button>
      </div>
    </ClientShell>
  );
}
