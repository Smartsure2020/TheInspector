import Link from "next/link";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { requireRole } from "@/lib/auth";
import { listStaffUsers } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireRole("admin");
  const users = await listStaffUsers();

  return (
    <StaffShell title="User management" user={user}>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Users</h1>
        <Link
          href="/admin/users/new"
          className="ml-auto bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          + New user
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-blue-50/50">
                <td className="px-3 py-2">
                  <Link href={`/admin/users/${u.id}`} className="text-blue-700 font-medium hover:underline">
                    {u.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{u.email ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.role === "admin" ? "bg-indigo-100 text-indigo-800" :
                    u.role === "assessor" ? "bg-emerald-100 text-emerald-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{u.title}</td>
                <td className="px-3 py-2">
                  {u.is_active ? (
                    <span className="text-emerald-600 text-xs font-medium">Active</span>
                  ) : (
                    <span className="text-red-600 text-xs font-medium">Deactivated</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">{u.last_login_at ?? "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Link href="/admin" className="text-sm text-blue-700 hover:underline">&larr; Back to dashboard</Link>
      </div>
    </StaffShell>
  );
}
