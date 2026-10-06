"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { verifyOtpAction, resendOtpAction, type OtpStatus } from "@/lib/auth-actions";
import { Icon } from "@/components/ui/Icon";
import { clientButtonClass } from "@/components/ui/client";

const minutes = (s: number) => Math.max(1, Math.ceil(s / 60));

/** Client-facing wording for each situation (no internal terms). */
function statusMessage(s: OtpStatus, justResent: boolean): { tone: "info" | "warn" | "error"; text: string } | null {
  if (s.state === "error") return { tone: "error", text: s.error };
  if (s.state === "limit")
    return {
      tone: "warn",
      text: `We’ve sent several codes to your phone recently, so new codes are paused for your security. Please try again in about ${minutes(s.retryAfterSeconds)} ${minutes(s.retryAfterSeconds) === 1 ? "minute" : "minutes"}, or contact your claims coordinator and they’ll help.`,
    };
  if (s.state === "cooldown")
    return { tone: "info", text: "We’ve just sent you a code, so please give it a moment to arrive. You can ask for another one shortly." };
  if (justResent) return { tone: "info", text: "A new code is on its way. Use the newest code you receive." };
  return null;
}

export function VerifyOtpForm({ token, initialStatus }: { token: string; initialStatus: OtpStatus }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<OtpStatus>(initialStatus);
  const [justResent, setJustResent] = useState(false);
  const [wait, setWait] = useState(status.state === "error" ? 0 : status.retryAfterSeconds);
  const [resending, startResend] = useTransition();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await verifyOtpAction(token, formData);
      return result ?? null;
    },
    null,
  );

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Countdown until the next code may be requested (server remains the authority).
  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, [wait]);

  const message = statusMessage(status, justResent);
  const canResend = status.state !== "limit" && wait <= 0 && !resending;

  const resend = () =>
    startResend(async () => {
      const next = await resendOtpAction(token);
      setStatus(next);
      setJustResent(next.state === "sent");
      setWait(next.state === "error" ? 0 : next.retryAfterSeconds);
    });

  return (
    <>
      <form action={formAction} className="mt-6 space-y-3 text-left">
        {message && (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            data-testid="otp-status"
            className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-base font-medium ${
              message.tone === "error"
                ? "border-status-error-line bg-status-error-bg text-status-error"
                : message.tone === "warn"
                  ? "border-status-warning-line bg-status-warning-bg text-status-warning"
                  : "border-accent-line bg-accent-soft text-foreground"
            }`}
          >
            <Icon name={message.tone === "info" ? "info" : "alert"} size={16} className="mt-0.5 shrink-0" />
            {message.text}
          </p>
        )}

        {state?.error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-status-error-line bg-status-error-bg px-3 py-2.5 text-base font-medium text-status-error"
          >
            <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
            {state.error}
          </p>
        )}

        <label htmlFor="otp-code" className="block text-base font-medium text-foreground">
          Enter your 6-digit code
        </label>
        <input
          ref={inputRef}
          id="otp-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="000000"
          required
          aria-invalid={state?.error ? true : undefined}
          className="w-full text-center font-mono text-2xl tracking-[0.4em]"
          style={{ minHeight: "3.25rem" }}
        />

        <button type="submit" disabled={pending} className={clientButtonClass("primary")}>
          <Icon name={pending ? "spinner" : "arrowRight"} size={18} className={pending ? "animate-spin" : ""} />
          {pending ? "Checking…" : "Verify"}
        </button>
      </form>

      {status.state !== "limit" && (
        <button
          type="button"
          onClick={resend}
          disabled={!canResend}
          className={`${clientButtonClass("quiet")} mt-3`}
        >
          {resending ? "Sending…" : wait > 0 ? `Send a new code in ${wait}s` : "Send me a new code"}
        </button>
      )}
    </>
  );
}
