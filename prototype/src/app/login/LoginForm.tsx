"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";
import { Button, FormField, InlineAlert } from "@/components/ui/primitives";

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
    <form action={formAction} className="mt-6 space-y-4 rounded-lg border border-border bg-background p-5 shadow-1">
      {state?.error && (
        <InlineAlert tone="danger" role="alert" title="Couldn’t sign in">
          {state.error}
        </InlineAlert>
      )}

      <FormField id="email" label="Email" required>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full"
        />
      </FormField>

      <FormField id="password" label="Password" required>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full"
        />
      </FormField>

      <Button type="submit" variant="primary" size="lg" className="w-full" busy={pending} busyLabel="Signing in">
        Sign in
      </Button>
    </form>
  );
}
