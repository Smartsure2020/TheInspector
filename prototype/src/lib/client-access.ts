import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { query } from "./db";
import { sha256 } from "./crypto";
import { resolveToken, type JobRow, type LinkState } from "./data";

export const OTP_COOKIE_HOURS = 8;

/** Link tokens are stored/looked up only as sha256(token); the raw token never reaches the DB. */
export const hashLinkToken = (token: string) => sha256(token);

/** Cookie name uses a hash prefix, not the raw token (the cookie is sent on every request path). */
export const otpCookieName = (token: string) => `inspector.otp.${hashLinkToken(token).slice(0, 16)}`;
/** Cookie value proves a specific verified challenge for this link; derived from hashes only. */
export const otpCookieValue = (token: string, challengeId: string) =>
  sha256(`${hashLinkToken(token)}:${challengeId}`);

/**
 * True only if the client holds a valid OTP cookie for this link token: the cookie value
 * must equal otpCookieValue() of a challenge that was really verified in the last
 * OTP_COOKIE_HOURS. A forged or stale cookie never passes.
 */
export async function isOtpVerified(token: string): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(otpCookieName(token))?.value;
  if (!value) return false;

  const cutoff = new Date(Date.now() - OTP_COOKIE_HOURS * 3600_000)
    .toISOString().replace("T", " ").slice(0, 19);
  const rows = await query.all<{ id: string }>(
    "SELECT id FROM otp_challenges WHERE link_token_hash=? AND verified_at IS NOT NULL AND verified_at >= ?",
    hashLinkToken(token), cutoff,
  );

  const given = Buffer.from(value);
  return rows.some((r) => {
    const expected = Buffer.from(otpCookieValue(token, r.id));
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
}

export type ClientAccess =
  | { ok: true; job: JobRow; jobId: string; purpose: "join" | "upload"; state: LinkState }
  | { ok: false; reason: "link" | "otp" };

/**
 * Gate for every client-facing server action. Checks, in order:
 *  1. the link resolves to a real job and its state is one of `allowedStates`
 *     (so revoked / expired / invalid / cancelled links are refused),
 *  2. the link's purpose is allowed (default: any),
 *  3. OTP is verified for exactly this link (cookie validated against a verified challenge).
 * Pages gate with checkOtpVerified; actions are separate endpoints and must gate themselves.
 */
export async function checkClientAccess(
  token: string,
  opts: { allowedStates?: LinkState[]; purposes?: Array<"join" | "upload"> } = {},
): Promise<ClientAccess> {
  const allowedStates = opts.allowedStates ?? ["valid"];
  const info = await resolveToken(token);
  if (!info.job) return { ok: false, reason: "link" };
  if (!(allowedStates as string[]).includes(info.state)) return { ok: false, reason: "link" };
  if (opts.purposes && !opts.purposes.includes(info.purpose)) return { ok: false, reason: "link" };
  if (!(await isOtpVerified(token))) return { ok: false, reason: "otp" };
  return { ok: true, job: info.job, jobId: info.job.id, purpose: info.purpose, state: info.state };
}
