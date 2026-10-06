"use client";
// Staff account management. Same four actions (`updateUserAction`,
// `toggleActiveAction`, `resetPasswordAction`, `toggleMandateAction`) — the UX
// pass groups them, labels every field, and puts a consequence-based
// confirmation on deactivation and password resets.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction, toggleActiveAction, resetPasswordAction, toggleMandateAction } from "@/lib/admin-actions";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, Button, FieldGroup, FormField, InlineAlert, JobTypeBadge, PageHeader,
} from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/Overlay";
import { formatDateTime, formatRelative } from "@/lib/format";

interface UserData {
  id: string; name: string; role: string; title: string;
  email: string | null; is_active: number; created_at: string | null; last_login_at: string | null;
}

interface TemplateInfo { id: string; name: string; jobType: string }

const ROLE_TONE: Record<string, "neutral" | "accent" | "info" | "survey"> = {
  admin: "info",
  assessor: "accent",
  manager: "survey",
};

export function UserDetailClient({
  user,
  activeTemplates,
  mandateIds: initialMandateIds,
}: {
  user: UserData;
  activeTemplates: TemplateInfo[];
  mandateIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState("");
  const [mandateIds, setMandateIds] = useState(new Set(initialMandateIds));
  const [confirmActive, setConfirmActive] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleUpdate = (formData: FormData) =>
    startTransition(async () => {
      setErr(""); setSaved("");
      const result = await updateUserAction(user.id, formData);
      if (result?.error) setErr(result.error);
      else { setSaved("Details saved."); router.refresh(); }
    });

  const handleToggleActive = () =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await toggleActiveAction(user.id);
          setConfirmActive(false);
          router.refresh();
          resolve();
        } catch (e) {
          reject(e instanceof Error ? e : new Error("That didn’t work."));
        }
      });
    });

  const handleResetPassword = () =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        setErr(""); setSaved("");
        const fd = new FormData();
        fd.set("password", newPassword);
        const result = await resetPasswordAction(user.id, fd);
        if (result?.error) { setErr(result.error); reject(new Error(result.error)); return; }
        setSaved("Password reset. Give it to the user through your normal channel.");
        setNewPassword("");
        setResetOpen(false);
        resolve();
      });
    });

  const handleToggleMandate = (templateId: string) =>
    startTransition(async () => {
      await toggleMandateAction(user.id, templateId);
      setMandateIds((prev) => {
        const next = new Set(prev);
        if (next.has(templateId)) next.delete(templateId);
        else next.add(templateId);
        return next;
      });
    });

  return (
    <div className="max-w-2xl">
      <PageHeader
        trail={[{ label: "Pipeline", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: user.name }]}
        title={user.name}
        meta={
          <>
            <Badge tone={ROLE_TONE[user.role] ?? "neutral"}>{user.role}</Badge>
            {user.is_active
              ? <Badge tone="success" icon="check">Active</Badge>
              : <Badge tone="danger" icon="lock">Deactivated</Badge>}
          </>
        }
        lede={
          <>
            {user.last_login_at
              ? <>Last signed in {formatRelative(user.last_login_at)} ({formatDateTime(user.last_login_at)}).</>
              : <>Has never signed in.</>}
            {user.created_at ? <> Account created {formatDateTime(user.created_at)}.</> : null}
          </>
        }
      />

      {err && <InlineAlert tone="danger" role="alert" className="mb-4" title="That didn’t save">{err}</InlineAlert>}
      {saved && <InlineAlert tone="success" role="status" className="mb-4">{saved}</InlineAlert>}

      <div className="space-y-4">
        <form action={handleUpdate}>
          <FieldGroup legend="Account details">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="name" label="Full name" required>
                <input id="name" name="name" defaultValue={user.name} required className="w-full" />
              </FormField>
              <FormField id="email" label="Email" required hint="Used to sign in.">
                <input id="email" name="email" type="email" defaultValue={user.email ?? ""} required className="w-full" />
              </FormField>
              <FormField id="role" label="Role" required hint="Decides which workspace they land in.">
                <select id="role" name="role" defaultValue={user.role} className="w-full">
                  <option value="admin">Admin / coordinator</option>
                  <option value="assessor">Assessor / surveyor</option>
                  <option value="manager">Manager / reviewer</option>
                </select>
              </FormField>
              <FormField id="title" label="Job title" required hint="Shown on reports and in the header.">
                <input id="title" name="title" defaultValue={user.title} required className="w-full" />
              </FormField>
            </div>
            <div className="mt-4">
              <Button type="submit" variant="primary" icon="check" busy={pending} busyLabel="Saving">
                Save changes
              </Button>
            </div>
          </FieldGroup>
        </form>

        {user.role === "assessor" && (
          <FieldGroup
            legend="Template mandates"
            hint="Which assessments and surveys this person is authorised to carry out. Only mandated assessors can be assigned to a job."
          >
            {activeTemplates.length === 0 ? (
              <p className="text-sm text-muted">No bookable templates are available.</p>
            ) : (
              <ul className="space-y-1">
                {activeTemplates.map((t) => (
                  <li key={t.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={mandateIds.has(t.id)}
                        onChange={() => handleToggleMandate(t.id)}
                        disabled={pending}
                        className="shrink-0"
                      />
                      <span className="min-w-0 flex-1 text-sm text-foreground">{t.name}</span>
                      <JobTypeBadge jobType={t.jobType} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">Each tick saves immediately.</p>
          </FieldGroup>
        )}

        <FieldGroup
          legend="Sign-in and access"
          hint="Prototype-grade credentials. Production authentication, MFA and password policy are deferred to hardening."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="mt-0.5 text-xs text-muted">
                  Setting a new one signs the user out everywhere.
                </p>
              </div>
              <Button variant="warning" icon="lock" onClick={() => setResetOpen(true)} disabled={pending}>
                Reset password
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Account status</p>
                <p className="mt-0.5 text-xs text-muted">
                  {user.is_active
                    ? "Active — this person can sign in."
                    : "Deactivated — this person cannot sign in."}
                </p>
              </div>
              <Button
                variant={user.is_active ? "danger" : "accent"}
                icon={user.is_active ? "lock" : "unlock"}
                onClick={() => setConfirmActive(true)}
                disabled={pending}
              >
                {user.is_active ? "Deactivate" : "Reactivate"}
              </Button>
            </div>
          </div>
        </FieldGroup>
      </div>

      <ConfirmDialog
        open={confirmActive}
        onClose={() => setConfirmActive(false)}
        onConfirm={handleToggleActive}
        title={user.is_active ? `Deactivate ${user.name}?` : `Reactivate ${user.name}?`}
        consequence={user.is_active
          ? "They can no longer sign in, and every active session of theirs is revoked immediately. Jobs already assigned to them stay assigned."
          : "They can sign in again straight away with their existing password."}
        confirmLabel={user.is_active ? "Deactivate" : "Reactivate"}
        confirmVariant={user.is_active ? "danger" : "accent"}
        busyLabel="Updating"
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => { setResetOpen(false); setNewPassword(""); }}
        onConfirm={handleResetPassword}
        title={`Reset the password for ${user.name}?`}
        consequence="Their current password stops working and all their sessions are revoked. You will need to give them the new one yourself — the prototype does not email it."
        confirmLabel="Reset password"
        confirmVariant="warning"
        busyLabel="Resetting"
      >
        <div>
          <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-foreground">
            New password <span className="text-status-error" aria-hidden>*</span>
          </label>
          <input
            id="new-password"
            data-autofocus
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full"
            aria-describedby="new-password-hint"
          />
          <p id="new-password-hint" className="mt-1 text-xs text-muted">
            At least 8 characters.
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            Share it through your normal internal channel, not on this screen.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
