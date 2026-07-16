"use client";
import { useActionState } from "react";
import { createUserAction } from "@/lib/admin-actions";
import Link from "next/link";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createUserAction(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      {state?.error && (
        <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{state.error}</div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
        <input id="name" name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input id="email" name="email" type="email" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
        <select id="role" name="role" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800">
          <option value="assessor">Assessor</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Job title</label>
        <input id="title" name="title" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input id="password" name="password" type="password" required minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={pending}
          className="bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
          {pending ? "Creating…" : "Create user"}
        </button>
        <Link href="/admin/users" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
