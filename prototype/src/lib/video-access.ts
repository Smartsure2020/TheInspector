import "server-only";
import { getSession } from "./auth";
import { getJob, resolveToken } from "./data";
import { isOtpVerified } from "./client-access";

export type VideoPeer = "assessor" | "client" | "waiting";

export type VideoAccess =
  | { ok: true; jobId: string; role: "assessor" | "client"; peers: VideoPeer[] }
  | { ok: false; status: 401 | 403 | 404; error: string };

const ROOM_RE = /^job-([A-Za-z0-9_-]{1,64})$/;
const deny = (status: 401 | 403 | 404, error: string): VideoAccess => ({ ok: false, status, error });

/**
 * Gate for every video / signaling route (LiveKit token, Daily room, P2P rtc channel).
 *
 *  - Client: `?ct=<link token>` present → the link must be a join link for exactly
 *    this job, not revoked/expired, AND the OTP cookie must validate.
 *  - Staff: no `ct` → logged-in assessor who is assigned to exactly this job.
 *    Admin/manager do not join rooms.
 *
 * The role (and therefore the peer name / LiveKit identity) is decided here, never
 * taken from the request. `liveOnly` rejects the pre-window "too_early" link state
 * (used when minting provider tokens; the waiting room may still poll).
 */
export async function authorizeVideoAccess(
  req: Request,
  roomKey: string,
  opts: { liveOnly?: boolean } = {},
): Promise<VideoAccess> {
  const m = ROOM_RE.exec(roomKey);
  if (!m) return deny(404, "Unknown room");
  const jobId = m[1];

  const ct = new URL(req.url).searchParams.get("ct");
  if (ct) {
    const info = await resolveToken(ct);
    if (info.purpose !== "join" || !info.job || info.job.id !== jobId) return deny(403, "Forbidden");
    const okState = info.state === "valid" || (!opts.liveOnly && info.state === "too_early");
    if (!okState) return deny(403, "Forbidden");
    if (!(await isOtpVerified(ct))) return deny(401, "Verification required");
    return { ok: true, jobId, role: "client", peers: ["client", "waiting"] };
  }

  const user = await getSession();
  if (!user) return deny(401, "Unauthorized");
  const job = await getJob(jobId);
  if (!job) return deny(404, "Unknown room");
  if (user.role !== "assessor" || job.assessor_id !== user.id) return deny(403, "Forbidden");
  return { ok: true, jobId, role: "assessor", peers: ["assessor"] };
}

export const denyResponse = (a: Extract<VideoAccess, { ok: false }>) =>
  Response.json({ error: a.error }, { status: a.status });
