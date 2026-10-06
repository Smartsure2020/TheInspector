"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, uuid, nowIso } from "./db";
import { verifyPassword, createSession, revokeSession } from "./auth";
import { sha256, randomOtp } from "./crypto";
import { sendOtp } from "./sms";
import { resolveToken, getClient, logEvent, type Actor } from "./data";
import { isOtpVerified, otpCookieName, otpCookieValue, hashLinkToken } from "./client-access";
import { parseUtcStamp, utcStampFromMs } from "./time";

const roleHome: Record<string, string> = {
  admin: "/admin",
  assessor: "/assessor",
  manager: "/manager",
};

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const user = await query.get<{
    id: string; role: string; password_hash: string | null; is_active: number;
  }>(
    "SELECT id, role, password_hash, is_active FROM users WHERE email = ?",
    email,
  );

  if (!user || !user.password_hash) return { error: "Invalid email or password." };
  if (!user.is_active) return { error: "Account is deactivated. Contact your administrator." };

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return { error: "Invalid email or password." };

  await createSession(user.id);
  redirect(roleHome[user.role] ?? "/admin");
}

export async function logoutAction() {
  await revokeSession();
  redirect("/login");
}

// ---------- OTP issuance with rate limits (F19) ----------
// Every row in otp_challenges is one SMS. Limits are per link (hash), not per phone:
//  - cooldown: at least OTP_RESEND_COOLDOWN_SECONDS (default 60) between sends
//  - window:   at most OTP_MAX_SENDS_PER_HOUR (default 5) sends in any rolling 60 minutes
//  - the existing 3-attempts-per-code limit is unchanged
// Worst case for an attacker holding a link: 5 sends/hour and 15 guesses/hour (of 1,000,000).
const envInt = (name: string, dflt: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt;
};
const OTP_COOLDOWN_S = envInt("OTP_RESEND_COOLDOWN_SECONDS", 60);
const OTP_MAX_SENDS = envInt("OTP_MAX_SENDS_PER_HOUR", 5);
const OTP_WINDOW_MS = 60 * 60_000;
const RATE_LIMIT_EVENT_DEDUPE_MS = 10 * 60_000;
const CLIENT_ACTOR: Actor = { id: "client_link", name: "client_link", role: "client" };

// DB timestamps are UTC strings "YYYY-MM-DD HH:MM:SS"
const utcMs = parseUtcStamp;
const fmtUtc = utcStampFromMs;

export type OtpStatus =
  | { state: "sent"; retryAfterSeconds: number }       // a usable code exists; seconds until a new one may be requested
  | { state: "cooldown"; retryAfterSeconds: number }   // too soon after the last send
  | { state: "limit"; retryAfterSeconds: number }      // too many sends in the last hour
  | { state: "error"; error: string };

/** Audit rate-limited attempts, but at most once per job+reason per 10 minutes (the log is append-only). */
async function auditRateLimited(jobId: string, reason: "cooldown" | "limit", retryAfterSeconds: number) {
  const since = fmtUtc(Date.now() - RATE_LIMIT_EVENT_DEDUPE_MS);
  const seen = await query.get(
    "SELECT 1 FROM event_log WHERE job_id=? AND event_type='otp_rate_limited' AND occurred_at >= ? AND data LIKE ? LIMIT 1",
    jobId, since, `%"reason":"${reason}"%`,
  );
  if (!seen) await logEvent(jobId, CLIENT_ACTOR, "otp_rate_limited", { reason, retry_after_s: retryAfterSeconds });
}

async function issueOtp(token: string, force: boolean): Promise<OtpStatus> {
  const info = await resolveToken(token);
  if (info.state === "invalid" || !info.job) return { state: "error", error: "Invalid link." };
  // No SMS for revoked / expired links (an old link must not be able to text the client).
  if (info.state !== "valid" && info.state !== "too_early") return { state: "error", error: "This link is no longer active." };
  const tokenHash = hashLinkToken(token);

  const client = await getClient(info.job.client_id);
  const phone = client?.phone;
  if (!phone) return { state: "error", error: "We don’t have a phone number for this appointment. Please contact your claims coordinator." };

  const nowMs = Date.now();
  const recent = await query.all<{ created_at: string }>(
    "SELECT created_at FROM otp_challenges WHERE link_token_hash=? AND created_at >= ? ORDER BY created_at ASC",
    tokenHash, fmtUtc(nowMs - OTP_WINDOW_MS),
  );
  const lastSentMs = recent.length ? utcMs(recent[recent.length - 1].created_at) : 0;
  const cooldownLeft = lastSentMs ? Math.max(0, Math.ceil((OTP_COOLDOWN_S * 1000 - (nowMs - lastSentMs)) / 1000)) : 0;

  const usable = await query.get<{ id: string }>(
    "SELECT id FROM otp_challenges WHERE link_token_hash=? AND verified_at IS NULL AND expires_at > ? AND attempts < max_attempts ORDER BY created_at DESC LIMIT 1",
    tokenHash, fmtUtc(nowMs),
  );
  // A code the client can still use: no SMS needed (page refreshes must not re-send).
  if (usable && !force) return { state: "sent", retryAfterSeconds: cooldownLeft };

  if (recent.length >= OTP_MAX_SENDS) {
    const freesAtMs = utcMs(recent[recent.length - OTP_MAX_SENDS].created_at) + OTP_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil((freesAtMs - nowMs) / 1000));
    await auditRateLimited(info.job.id, "limit", retryAfterSeconds);
    return { state: "limit", retryAfterSeconds };
  }
  if (cooldownLeft > 0) {
    await auditRateLimited(info.job.id, "cooldown", cooldownLeft);
    return { state: "cooldown", retryAfterSeconds: cooldownLeft };
  }

  // Explicit resend replaces any still-usable code (only the newest code is ever checked).
  if (usable) await query.run("UPDATE otp_challenges SET attempts = max_attempts WHERE id=?", usable.id);

  const code = randomOtp();
  const challengeId = uuid();
  const expiresAt = fmtUtc(nowMs + 10 * 60_000);
  await query.run(
    "INSERT INTO otp_challenges (id, link_token_hash, phone, code_hash, attempts, max_attempts, expires_at, created_at) VALUES (?,?,?,?,0,3,?,?)",
    challengeId, tokenHash, phone, sha256(code), expiresAt, fmtUtc(nowMs),
  );

  try {
    await sendOtp(phone, code);
  } catch {
    // The row stays (it counts toward the limits, so a broken provider cannot be hammered);
    // nothing sensitive is logged — only that a send failed.
    await query.run("UPDATE otp_challenges SET attempts = max_attempts WHERE id=?", challengeId);
    await logEvent(info.job.id, CLIENT_ACTOR, "otp_send_failed", { sends_in_window: recent.length + 1 });
    return { state: "error", error: "We couldn’t send a code just now. Please try again in a minute, or contact your claims coordinator." };
  }
  await logEvent(info.job.id, CLIENT_ACTOR, "otp_sent", { sends_in_window: recent.length + 1, resend: force });
  return { state: "sent", retryAfterSeconds: OTP_COOLDOWN_S };
}

/** Called when the verify page renders: sends the first code, never re-sends while a usable code exists. */
export async function sendOtpAction(token: string): Promise<OtpStatus> {
  return issueOtp(token, false);
}

/** Explicit "send me a new code" (subject to the same cooldown and hourly limit). */
export async function resendOtpAction(token: string): Promise<OtpStatus> {
  return issueOtp(token, true);
}

export async function verifyOtpAction(token: string, formData: FormData) {
  const code = (formData.get("code") as string)?.trim();
  if (!code || code.length !== 6) return { error: "Enter the 6-digit code." };

  // Only an active link can be verified (revoked / expired / invalid links cannot mint a session).
  const info = await resolveToken(token);
  if (!info.job || (info.state !== "valid" && info.state !== "too_early"))
    return { error: "This link is no longer active." };

  const challenge = await query.get<{
    id: string; code_hash: string; attempts: number; max_attempts: number;
  }>(
    "SELECT id, code_hash, attempts, max_attempts FROM otp_challenges WHERE link_token_hash=? AND verified_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1",
    hashLinkToken(token), nowIso(),
  );
  if (!challenge) return { error: "Code expired. Please request a new one." };
  if (challenge.attempts >= challenge.max_attempts)
    return { error: "There are no attempts left on that code. Please ask for a new code." };

  await query.run(
    "UPDATE otp_challenges SET attempts = attempts + 1 WHERE id=?",
    challenge.id,
  );

  if (sha256(code) !== challenge.code_hash) {
    const left = challenge.max_attempts - challenge.attempts - 1;
    if (left <= 0) {
      await logEvent(info.job.id, CLIENT_ACTOR, "otp_attempts_exhausted", {});
      return { error: "That code wasn’t right and there are no attempts left. Please ask for a new code." };
    }
    return { error: `That code wasn’t right. You have ${left} ${left === 1 ? "attempt" : "attempts"} left.` };
  }

  await query.run(
    "UPDATE otp_challenges SET verified_at=? WHERE id=?",
    nowIso(), challenge.id,
  );

  const jar = await cookies();
  jar.set(otpCookieName(token), otpCookieValue(token, challenge.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/", // must reach /api/* (video routes), not only /c/<token>
    maxAge: 8 * 3600,
  });

  redirect(`/c/${token}`);
}

export async function checkOtpVerified(token: string): Promise<boolean> {
  return isOtpVerified(token);
}
