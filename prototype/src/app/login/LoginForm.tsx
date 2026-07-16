"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      if (next) formData.set("next", next);
      const result = await loginAction(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      {state?.error && (
        <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
