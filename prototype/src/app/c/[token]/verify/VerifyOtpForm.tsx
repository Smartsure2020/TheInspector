"use client";
import { useActionState, useEffect, useRef } from "react";
import { verifyOtpAction } from "@/lib/auth-actions";
import { Icon } from "@/components/ui/Icon";
import { clientButtonClass } from "@/components/ui/client";

export function VerifyOtpForm({ token }: { token: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await verifyOtpAction(token, formData);
      return result ?? null;
    },
    null,
  );

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <form action={formAction} className="mt-6 space-y-3 text-left">
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
  );
}
