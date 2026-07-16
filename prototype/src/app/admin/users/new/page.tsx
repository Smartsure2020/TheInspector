import { StaffShell } from "@/components/Chrome";
import { requireRole } from "@/lib/auth";
import { CreateUserForm } from "./CreateUserForm";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const user = await requireRole("admin");

  return (
    <StaffShell title="Create user" user={user}>
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Create user</h1>
        <CreateUserForm />
      </div>
    </StaffShell>
  );
}
