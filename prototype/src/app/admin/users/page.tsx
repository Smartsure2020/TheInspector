import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, DataTable, EmptyState, LinkButton, PageHeader, Td, Th, Tr,
} from "@/components/ui/primitives";
import { formatDateTime, formatRelative } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { listStaffUsers } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

const ROLE_TONE: Record<string, "neutral" | "accent" | "info" | "survey"> = {
  admin: "info",
  assessor: "accent",
  manager: "survey",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Coordinator / admin",
  assessor: "Assessor / surveyor",
  manager: "Reviewing manager",
};

export default async function UsersPage() {
  const user = await requireRole("admin");
  const users = await listStaffUsers();
  const active = users.filter((u) => u.is_active).length;

  return (
    <StaffShell title="User management" user={user} section="/admin/users">
      <PageHeader
        trail={[{ label: "Pipeline", href: "/admin" }, { label: "Users" }]}
        title="Staff users"
        lede="Who can sign in, what role they act as, and which templates each assessor is mandated for. Prototype-grade access control — production authentication is deferred by decision."
        meta={
          <>
            <Badge tone="neutral" icon="users">{users.length} accounts</Badge>
            <Badge tone="success" icon="check">{active} active</Badge>
          </>
        }
        actions={<LinkButton href="/admin/users/new" variant="primary" icon="plus">New user</LinkButton>}
      />

      {users.length === 0 ? (
        <EmptyState icon="users" title="No staff accounts yet" />
      ) : (
        <DataTable caption="Staff user accounts" minWidth="48rem">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th className="hidden md:table-cell">Email</Th>
              <Th>Role</Th>
              <Th className="hidden lg:table-cell">Job title</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Last sign-in</Th>
              <Th align="right"><span className="sr-only">Manage</span></Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-foreground hover:underline">
                    {u.name}
                  </Link>
                  <div className="mt-0.5 font-mono text-xs text-muted md:hidden">{u.email ?? "—"}</div>
                </Td>
                <Td className="hidden md:table-cell font-mono text-xs text-muted">{u.email ?? "—"}</Td>
                <Td>
                  <Badge tone={ROLE_TONE[u.role] ?? "neutral"}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                </Td>
                <Td className="hidden lg:table-cell text-sm">{u.title}</Td>
                <Td>
                  {u.is_active
                    ? <Badge tone="success" icon="check">Active</Badge>
                    : <Badge tone="danger" icon="lock">Deactivated</Badge>}
                </Td>
                <Td className="hidden sm:table-cell text-sm text-muted tnum">
                  {u.last_login_at
                    ? <span title={formatDateTime(u.last_login_at)}>{formatRelative(u.last_login_at)}</span>
                    : <span className="text-muted-light">Never</span>}
                </Td>
                <Td align="right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    aria-label={`Manage ${u.name}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
                  >
                    Manage <Icon name="chevronRight" size={13} />
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </StaffShell>
  );
}
