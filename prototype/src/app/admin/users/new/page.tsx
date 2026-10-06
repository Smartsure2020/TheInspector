import { StaffShell } from "@/components/Chrome";
import { PageHeader } from "@/components/ui/primitives";
import { requireRole } from "@/lib/auth";
import { CreateUserForm } from "./CreateUserForm";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const user = await requireRole("admin");

  return (
    <StaffShell title="Create user" user={user} section="/admin/users">
      <div className="max-w-xl">
        <PageHeader
          trail={[{ label: "Pipeline", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: "New user" }]}
          title="Create a staff user"
          lede="Three short groups: who they are, what they can do, and their first password."
        />
        <CreateUserForm />
      </div>
    </StaffShell>
  );
}
