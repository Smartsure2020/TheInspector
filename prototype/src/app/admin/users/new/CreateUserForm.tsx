"use client";
import { useActionState } from "react";
import { createUserAction } from "@/lib/admin-actions";
import { Icon } from "@/components/ui/Icon";
import { Button, FieldGroup, FormField, InlineAlert, LinkButton } from "@/components/ui/primitives";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createUserAction(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <InlineAlert tone="danger" role="alert" title="This account wasn’t created">
          {state.error}
        </InlineAlert>
      )}

      <FieldGroup legend="Who they are">
        <div className="space-y-4">
          <FormField id="name" label="Full name" required>
            <input id="name" name="name" required autoComplete="off" className="w-full" />
          </FormField>
          <FormField id="email" label="Email" required hint="This is what they sign in with.">
            <input id="email" name="email" type="email" required autoComplete="off" className="w-full" />
          </FormField>
          <FormField id="title" label="Job title" required hint="Appears in the app header and on reports.">
            <input id="title" name="title" required autoComplete="off" className="w-full" />
          </FormField>
        </div>
      </FieldGroup>

      <FieldGroup legend="What they can do" hint="Assessors get template mandates on their profile after the account exists.">
        <FormField id="role" label="Role" required>
          <select id="role" name="role" required className="w-full">
            <option value="assessor">Assessor / surveyor — runs sessions and writes reports</option>
            <option value="manager">Manager / reviewer — approves or returns reports</option>
            <option value="admin">Admin / coordinator — creates and books jobs</option>
          </select>
        </FormField>
      </FieldGroup>

      <FieldGroup
        legend="First password"
        hint="Prototype-grade credentials — production authentication and password policy are deferred to hardening."
      >
        <FormField id="password" label="Password" required hint="At least 8 characters.">
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full" />
        </FormField>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
          <Icon name="info" size={13} className="mt-0.5 shrink-0" />
          Nothing is emailed. Share the password with the person through your normal
          internal channel.
        </p>
      </FieldGroup>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" icon="plus" busy={pending} busyLabel="Creating">
          Create user
        </Button>
        <LinkButton href="/admin/users" variant="secondary">Cancel</LinkButton>
      </div>
    </form>
  );
}
