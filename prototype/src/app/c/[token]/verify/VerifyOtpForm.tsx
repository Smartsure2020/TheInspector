"use client";
import { useActionState } from "react";
import { verifyOtpAction } from "@/lib/auth-actions";

export function VerifyOtpForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await verifyOtpAction(token, formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-3">
      {state?.error && (
        <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{state.error}</div>
      )}
      <input
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        pattern="[0-9]{6}"
        placeholder="000000"
        required
        className="w-full text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-slate-300 px-4 py-3 text-slate-800"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
