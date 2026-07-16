"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction, toggleActiveAction, resetPasswordAction, toggleMandateAction } from "@/lib/admin-actions";

interface UserData {
  id: string; name: string; role: string; title: string;
  email: string | null; is_active: number; created_at: string | null; last_login_at: string | null;
}

interface TemplateInfo { id: string; name: string; jobType: string }

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
  const [mandateIds, setMandateIds] = useState(new Set(initialMandateIds));

  const handleUpdate = (formData: FormData) =>
    startTransition(async () => {
      setErr("");
      const result = await updateUserAction(user.id, formData);
      if (result?.error) setErr(result.error);
      else router.refresh();
    });

  const handleToggleActive = () =>
    startTransition(async () => {
      await toggleActiveAction(user.id);
      router.refresh();
    });

  const handleResetPassword = (formData: FormData) =>
    startTransition(async () => {
      setErr("");
      const result = await resetPasswordAction(user.id, formData);
      if (result?.error) setErr(result.error);
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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-800">{user.name}</h1>
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          user.role === "admin" ? "bg-indigo-100 text-indigo-800" :
          user.role === "assessor" ? "bg-emerald-100 text-emerald-800" :
          "bg-amber-100 text-amber-800"
        }`}>
          {user.role}
        </span>
        {!user.is_active && <span className="text-xs text-red-600 font-medium">Deactivated</span>}
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

      {/* Edit user details */}
      <form action={handleUpdate} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input name="name" defaultValue={user.name} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input name="email" type="email" defaultValue={user.email ?? ""} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Role</label>
            <select name="role" defaultValue={user.role} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800">
              <option value="admin">Admin</option>
              <option value="assessor">Assessor</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Job title</label>
            <input name="title" defaultValue={user.title} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
          </div>
        </div>
        <button type="submit" disabled={pending}
          className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
          Save changes
        </button>
      </form>

      {/* Template mandates */}
      {user.role === "assessor" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Template mandates</h2>
          <p className="text-xs text-slate-500 mb-3">Select which assessment templates this assessor is authorised to perform.</p>
          <div className="space-y-2">
            {activeTemplates.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mandateIds.has(t.id)}
                  onChange={() => handleToggleMandate(t.id)}
                  disabled={pending}
                  className="rounded border-slate-300"
                />
                <span>{t.name}</span>
                {t.jobType === "survey" && <span className="text-[9px] bg-teal-100 text-teal-800 rounded px-1 py-0.5 font-semibold">SURVEY</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Password reset */}
      <form action={handleResetPassword} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Reset password</h2>
        <div>
          <input name="password" type="password" placeholder="New password (min 8 characters)" minLength={8} required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
        </div>
        <button type="submit" disabled={pending}
          className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-500 disabled:opacity-50">
          Reset password
        </button>
      </form>

      {/* Activate / deactivate */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-700">Account status</h2>
          <p className="text-xs text-slate-500">
            {user.is_active
              ? "Active — user can sign in. Deactivating revokes all sessions."
              : "Deactivated — user cannot sign in."}
          </p>
        </div>
        <button onClick={handleToggleActive} disabled={pending}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            user.is_active
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          } disabled:opacity-50`}>
          {user.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>

      <div className="text-xs text-slate-400">
        Created: {user.created_at ?? "—"} · Last login: {user.last_login_at ?? "Never"}
      </div>
    </div>
  );
}
