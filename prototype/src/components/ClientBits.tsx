"use client";
// Client-page interactive bits (1B, polished in 1C).
// VISIBILITY RULE: these components render for the insured — no internal data.
import { useEffect, useState, useTransition } from "react";
import {
  cannotAttendAction, clientPingAction, consentAction, consentDeclineAction, requestNewLinkAction,
} from "@/lib/actions";
import { Icon } from "@/components/ui/Icon";
import { parseWallStamp } from "@/lib/time";
import { ClientAction, ClientCard } from "@/components/ui/client";

export function ClientPing({ token, kind }: { token: string; kind: "link_opened" | "client_waiting" }) {
  useEffect(() => {
    const key = `ping.${kind}.${token}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    clientPingAction(token, kind).catch(() => sessionStorage.removeItem(key));
  }, [token, kind]);
  return null;
}

function Acknowledged({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-start gap-2.5 rounded-lg border border-status-success-line bg-status-success-bg p-4 text-base leading-relaxed text-status-success"
    >
      <Icon name="checkCircle" size={19} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function CannotAttendButton({ token }: { token: string }) {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (sent)
    return (
      <Acknowledged>
        Thank you — we’ve let your coordinator know, and someone will contact you
        to arrange another time. You can close this page.
      </Acknowledged>
    );

  return (
    <ClientAction
      tone="quiet"
      icon="calendar"
      disabled={pending}
      onClick={() => start(async () => { await cannotAttendAction(token); setSent(true); })}
    >
      {pending ? "Letting them know…" : "I can’t make this time"}
    </ClientAction>
  );
}

export function RequestNewLinkButton({ token }: { token: string }) {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (sent)
    return (
      <Acknowledged>
        Thank you — your coordinator has been notified and will send you a new
        link. You can close this page.
      </Acknowledged>
    );

  return (
    <ClientAction
      icon="refresh"
      disabled={pending}
      onClick={() => start(async () => { await requestNewLinkAction(token); setSent(true); })}
    >
      {pending ? "Requesting…" : "Request a new link"}
    </ClientAction>
  );
}

export function Countdown({ target }: { target: string }) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = parseWallStamp(target) - Date.now();
      if (ms <= 0) { setTxt("It's time — please refresh this page."); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.ceil((ms % 3600000) / 60000);
      setTxt(h > 24 ? `${Math.floor(h / 24)} day(s) and ${h % 24} hour(s)` : h > 0 ? `${h}h ${m}m` : `${m} minutes`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [target]);
  return <strong className="text-foreground tnum">{txt}</strong>;
}

export function ConsentForm({ token, clientName }: { token: string; clientName?: string }) {
  const [name, setName] = useState("");
  const [tick, setTick] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [touched, setTouched] = useState(false);
  const [pending, start] = useTransition();

  if (declined)
    return (
      <ClientCard tone="plain" icon="info" title="That’s completely fine">
        <p className="text-base leading-relaxed text-muted">
          Your assessor has been told, and a person will contact you about other
          ways to deal with your claim — including an in-person visit. You can
          close this page.
        </p>
      </ClientCard>
    );

  const nameMissing = touched && !name.trim();
  const tickMissing = touched && !tick;
  const ready = !!name.trim() && tick;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="consent-name" className="block text-base font-medium text-foreground">
          Please type your full name
        </label>
        <p id="consent-name-hint" className="mt-1 text-sm text-muted">
          {clientName
            ? <>This confirms it’s you. We have you recorded as <strong className="text-foreground">{clientName}</strong>.</>
            : "This confirms it’s you."}
        </p>
        <input
          id="consent-name"
          className="mt-2 w-full text-base"
          style={{ minHeight: "3rem" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Your full name"
          autoComplete="name"
          required
          aria-describedby={nameMissing ? "consent-name-error" : "consent-name-hint"}
          aria-invalid={nameMissing || undefined}
        />
        {nameMissing && (
          <p id="consent-name-error" className="mt-1.5 text-sm font-medium text-status-error">
            Please type your name so we know it’s you.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="consent-tick" className="flex items-start gap-3 text-base leading-relaxed text-foreground">
          <input
            id="consent-tick"
            type="checkbox"
            className="mt-1 shrink-0"
            checked={tick}
            onChange={(e) => { setTick(e.target.checked); setTouched(true); }}
            aria-invalid={tickMissing || undefined}
            aria-describedby={tickMissing ? "consent-tick-error" : undefined}
          />
          <span>I’ve read the points above and I’m happy to go ahead.</span>
        </label>
        {tickMissing && (
          <p id="consent-tick-error" className="mt-1.5 text-sm font-medium text-status-error">
            Please tick the box to continue.
          </p>
        )}
      </div>

      <ClientAction
        icon="arrowRight"
        disabled={!ready || pending}
        onClick={() => start(async () => { await consentAction(token, name.trim()); })}
      >
        {pending ? "One moment…" : "I agree — continue"}
      </ClientAction>

      <ClientAction
        tone="quiet"
        disabled={pending}
        onClick={() => start(async () => { await consentDeclineAction(token); setDeclined(true); })}
      >
        I’d rather not do this on video
      </ClientAction>
    </div>
  );
}
