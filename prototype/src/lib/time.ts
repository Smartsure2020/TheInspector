// Time handling for stored timestamps (F24). Pure functions, no imports — safe in server AND client code.
//
// The database holds TWO different kinds of timestamp in the same text shape ("YYYY-MM-DD HH:MM[:SS]"):
//
//   UTC INSTANTS   written by the server via nowIso(): created_at, occurred_at, verified_at, captured_at,
//                  staff-session and OTP expiry, access_log, … Parse with parseUtcStamp().
//
//   WALL-CLOCK     typed by staff in the schedule form and meaning South African time, with no zone stored:
//                  appointments.scheduled_start, and link_expires_at / upload-request expires_at which are
//                  derived from it. Parse with parseWallStamp() (fixed business offset below).
//
// Before this, every parser used `new Date(s.replace(" ", "T"))` — i.e. "the server's local timezone" —
// which is right for wall-clock values only on a SAST server and right for UTC instants only on a UTC
// server, so local development (UTC+2) and Vercel (UTC) disagreed by two hours. Parsing is now explicit
// and independent of the process timezone.

/** Business timezone for wall-clock values: Africa/Johannesburg (SAST). */
export const BUSINESS_TZ = "Africa/Johannesburg";
/** SAST is UTC+2 all year (South Africa has no DST), so a fixed offset is exact. Change both if the business zone ever changes. */
const BUSINESS_OFFSET = "+02:00";
const BUSINESS_OFFSET_MS = 2 * 3600_000;

/** Normalise "YYYY-MM-DD HH:MM[:SS]" / "YYYY-MM-DDTHH:MM[:SS]" to "YYYY-MM-DDTHH:MM:SS" (null if not that shape). */
function normalise(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim().replace(" ", "T");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(t)) return null;
  return t.length === 16 ? `${t}:00` : t;
}

/** Epoch ms of a stored UTC instant; NaN if unparseable. */
export function parseUtcStamp(s: string | null | undefined): number {
  const n = normalise(s);
  return n ? new Date(`${n}Z`).getTime() : NaN;
}

/** Epoch ms of a stored wall-clock value (business time, SAST); NaN if unparseable. */
export function parseWallStamp(s: string | null | undefined): number {
  const n = normalise(s);
  return n ? new Date(`${n}${BUSINESS_OFFSET}`).getTime() : NaN;
}

/** "YYYY-MM-DD HH:MM:SS" for an instant, in UTC (matches nowIso()). */
export function utcStampFromMs(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19);
}

/** "YYYY-MM-DD HH:MM" for an instant, as wall-clock time in the business timezone. */
export function wallStampFromMs(ms: number): string {
  return new Date(ms + BUSINESS_OFFSET_MS).toISOString().replace("T", " ").slice(0, 16);
}

/** { date: "YYYY-MM-DD", time: "HH:MM" } for an instant in business time (form defaults). */
export function wallParts(ms: number): { date: string; time: string } {
  const [date, time] = wallStampFromMs(ms).split(" ");
  return { date, time };
}
