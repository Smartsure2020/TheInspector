import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { query } from "./db";
import { sha256 } from "./crypto";

export const OTP_COOKIE_HOURS = 8;
export const otpCookieName = (token: string) => `inspector.otp.${token}`;

/**
 * True only if the client holds a valid OTP cookie for this link token: the cookie
 * value must equal sha256(token + id) of a challenge that was really verified in
 * the last OTP_COOKIE_HOURS. (Previously any non-empty cookie of the right name
 * passed, so the OTP step could be skipped by setting the cookie by hand.)
 */
export async function isOtpVerified(token: string): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(otpCookieName(token))?.value;
  if (!value) return false;

  const cutoff = new Date(Date.now() - OTP_COOKIE_HOURS * 3600_000)
    .toISOString().replace("T", " ").slice(0, 19);
  const rows = await query.all<{ id: string }>(
    "SELECT id FROM otp_challenges WHERE link_token=? AND verified_at IS NOT NULL AND verified_at >= ?",
    token, cutoff,
  );

  const given = Buffer.from(value);
  return rows.some((r) => {
    const expected = Buffer.from(sha256(token + r.id));
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
}
