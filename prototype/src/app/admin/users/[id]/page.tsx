import { StaffShell } from "@/components/Chrome";
import { EmptyState, LinkButton } from "@/components/ui/primitives";
import { requireRole } from "@/lib/auth";
import { getStaffUser, getUserMandates } from "@/lib/admin-actions";
import { listTemplates } from "@/lib/data";
import { UserDetailClient } from "./UserDetailClient";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("admin");
  const { id } = await params;
  const user = await getStaffUser(id);

  if (!user) {
    return (
      <StaffShell title="User" user={admin} section="/admin/users">
        <EmptyState
          icon="search"
          title="We can’t find that user"
          actions={<LinkButton href="/admin/users" variant="secondary" icon="chevronLeft">Back to users</LinkButton>}
        />
      </StaffShell>
    );
  }

  const mandates = await getUserMandates(id);
  const templates = await listTemplates();
  const activeTemplates = templates
    .filter((t) => !t.is_reference_only)
    .map((t) => ({ id: t.id, name: t.name, jobType: t.job_type }));
  const mandateIds = new Set(mandates.map((m) => m.template_id));

  return (
    <StaffShell title={`User — ${user.name}`} user={admin} section="/admin/users">
      <UserDetailClient
        user={user}
        activeTemplates={activeTemplates}
        mandateIds={[...mandateIds]}
      />
    </StaffShell>
  );
}
