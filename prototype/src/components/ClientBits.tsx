"use client";
// Client-page interactive bits (1B, polished in 1C).
// VISIBILITY RULE: these components render for the insured — no internal data.
import { useEffect, useState, useTransition } from "react";
import {
  cannotAttendAction, clientPingAction, consentAction, consentDeclineAction, requestNewLinkAction,
} from "@/lib/actions";

/** Fires one telemetry ping on mount (deduped per browser via sessionStorage). */
export function ClientPing({ token, kind }: { token: string; kind: "link_opened" | "client_waiting" }) {
  useEffect(() => {
    const key = `ping.${kind}.${token}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    clientPingAction(token, kind).catch(() => sessionStorage.removeItem(key));
  }, [token, kind]);
  return null;
}

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

export function RequestNewLinkButton({ token }: { token: string }) {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  if (sent)
    return <p className="mt-4 text-center text-sm text-emerald-700">Thank you — your coordinator has been notified and will send you a new link.</p>;
  return (
    <button
      disabled={pending}
      className="mt-4 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold"
      onClick={() => start(async () => { await requestNewLinkAction(token); setSent(true); })}
    >
      Request a new link
    </button>
  );
}

/** Live countdown for too-early links. */
export function Countdown({ target }: { target: string }) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(target.replace(" ", "T")).getTime() - Date.now();
      if (ms <= 0) { setTxt("It's time — please refresh this page."); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.ceil((ms % 3600000) / 60000);
      setTxt(h > 24 ? `${Math.floor(h / 24)} day(s) and ${h % 24} hour(s)` : h > 0 ? `${h}h ${m}m` : `${m} minutes`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [target]);
  return <span className="font-semibold text-slate-800">{txt}</span>;
}

export function ConsentForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [tick, setTick] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [pending, start] = useTransition();

  if (declined)
    return (
      <p className="mt-6 text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-4">
        No problem — your assessor has been notified and a person will contact you about
        other options. You can close this page.
      </p>
    );

  return (
    <>
      <label className="block text-xs font-medium text-slate-500 mt-4 mb-1" htmlFor="consent-name">Please type your full name</label>
      <input id="consent-name" className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" />
      <label className="flex items-start gap-2 mt-3 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={tick} onChange={(e) => setTick(e.target.checked)} />
        I understand and agree
      </label>
      <button
        disabled={!name.trim() || !tick || pending}
        className="mt-5 w-full bg-blue-600 disabled:bg-slate-300 text-white rounded-xl py-3.5 font-semibold"
        onClick={() => start(async () => { await consentAction(token, name.trim()); })}
      >
        I agree — continue
      </button>
      <button
        disabled={pending}
        className="mt-2 w-full text-slate-500 text-sm py-2"
        onClick={() => start(async () => { await consentDeclineAction(token); setDeclined(true); })}
      >
        I don&apos;t agree
      </button>
    </>
  );
}
