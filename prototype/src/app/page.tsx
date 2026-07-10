// S1 — Placeholder role entry (DB-backed users, Chunk 1B).
import { listUsers } from "@/lib/data";
import { RolePicker } from "@/components/RolePicker";

export const dynamic = "force-dynamic";

export default async function RoleEntry() {
  return <RolePicker users={await listUsers()} />;
}
