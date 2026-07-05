// S1 — Placeholder role entry (DB-backed users, Chunk 1B).
import { listUsers } from "@/lib/data";
import { RolePicker } from "@/components/RolePicker";

export const dynamic = "force-dynamic";

export default function RoleEntry() {
  return <RolePicker users={listUsers()} />;
}
