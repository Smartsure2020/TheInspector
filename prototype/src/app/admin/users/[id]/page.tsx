import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { requireRole } from "@/lib/auth";
import { getStaffUser, getUserMandates } from "@/lib/admin-actions";
import { listTemplates } from "@/lib/data";
import { UserDetailClient } from "./UserDetailClient";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("admin");
  const { id } = await params;
  const user = await getStaffUser(id);
  if (!user) return <StaffShell title="User" user={admin}><p className="text-sm text-slate-500">Unknown user.</p></StaffShell>;

  const mandates = await getUserMandates(id);
  const templates = await listTemplates();
  const activeTemplates = templates
    .filter((t) => !t.is_reference_only)
    .map((t) => ({ id: t.id, name: t.name, jobType: t.job_type }));
  const mandateIds = new Set(mandates.map((m) => m.template_id));

  return (
    <StaffShell title={`User — ${user.name}`} user={admin}>
      <UserDetailClient
        user={user}
        activeTemplates={activeTemplates}
        mandateIds={[...mandateIds]}
      />
      <div className="mt-4">
        <Link href="/admin/users" className="text-sm text-blue-700 hover:underline">&larr; Back to users</Link>
      </div>
    </StaffShell>
  );
}
