import "server-only";
import { query, nowIso, uuid } from "./db";

export async function logAccess(
  userId: string | null,
  resourceType: string,
  resourceId: string,
  action: string,
  ipAddress: string,
) {
  await query.run(
    "INSERT INTO access_log (id, user_id, resource_type, resource_id, action, ip_address, occurred_at) VALUES (?,?,?,?,?,?,?)",
    uuid(), userId, resourceType, resourceId, action, ipAddress, nowIso(),
  );
}
