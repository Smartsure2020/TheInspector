"use client";
// Client-page interactive bits (Chunk 1B): consent form + can't-attend button.
import { useState, useTransition } from "react";
import { cannotAttendAction, consentAction } from "@/lib/actions";

export function CannotAttendButton({ token }: { token: string }) {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  if (sent)
    return <p className="mt-3 text-center text-sm text-emerald-700">Thank you — your coordinator has been notified and will contact you to rebook.</p>;
  return (
    <button
      disabled={pending}
      className="mt-2 w-full text-slate-500 text-sm py-2"
      onClick={() => start(async () => { await cannotAttendAction(token); setSent(true); })}
    >
      I can&apos;t make it
    </button>
  );
}

export function ConsentForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [tick, setTick] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [pending, start] = useTransition();

  if (declined)
    return (
      <p className="mt-6 text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-4">
        No problem — a person will contact you about other options. You can close this page.
      </p>
    );

  return (
    <>
      <label className="block text-xs font-medium text-slate-500 mt-4 mb-1">Please type your full name</label>
      <input className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      <label className="flex items-start gap-2 mt-3 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={tick} onChange={(e) => setTick(e.target.checked)} />
        I understand and agree
      </label>
      <button
        disabled={!name || !tick || pending}
        className="mt-5 w-full bg-blue-600 disabled:bg-slate-300 text-white rounded-xl py-3.5 font-semibold"
        onClick={() => start(async () => { await consentAction(token, name); })}
      >
        I agree — continue
      </button>
      <button className="mt-2 w-full text-slate-500 text-sm py-2" onClick={() => setDeclined(true)}>
        I don&apos;t agree
      </button>
    </>
  );
}
