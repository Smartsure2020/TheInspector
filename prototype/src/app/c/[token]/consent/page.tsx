"use client";
// S9 — Consent PLACEHOLDER (draft wording; final legal text = production hardening).
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ClientShell } from "@/components/Chrome";

export default function Consent() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [tick, setTick] = useState(false);

  return (
    <ClientShell>
      <div className="mt-6">
        <h1 className="text-xl font-bold text-slate-800">Before we start</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-4 text-sm text-slate-600 space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-amber-600 font-semibold">Draft consent wording — placeholder for prototype</p>
          <p>• You&apos;ll be on a video call with your assessor. Nobody else joins.</p>
          <p>• The assessor will take <b>photos of what you show</b> — you&apos;ll see a note each time a photo is taken.</p>
          <p>• The photos and your answers are used <b>only for your claim</b>.</p>
          <p>• You can ask questions at any time, and you can stop the call at any time.</p>
        </div>
        <label className="block text-xs font-medium text-slate-500 mt-4 mb-1">Please type your full name</label>
        <input className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        <label className="flex items-start gap-2 mt-3 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={tick} onChange={(e) => setTick(e.target.checked)} />
          I understand and agree
        </label>
        <button
          disabled={!name || !tick}
          className="mt-5 w-full bg-blue-600 disabled:bg-slate-300 text-white rounded-xl py-3.5 font-semibold"
          onClick={() => router.push(`/c/${token}/check`)}
        >
          I agree — continue
        </button>
        <button className="mt-2 w-full text-slate-500 text-sm py-2" onClick={() => alert("No problem — a person will contact you about other options (mock; assessor notified).")}>
          I don&apos;t agree
        </button>
      </div>
    </ClientShell>
  );
}
