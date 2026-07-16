"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, uuid, nowIso } from "./db";
import { verifyPassword, createSession, revokeSession } from "./auth";
import { sha256, randomOtp } from "./crypto";
import { sendOtp } from "./sms";
import { resolveToken, getClient } from "./data";

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

export async function sendOtpAction(token: string) {
  const info = await resolveToken(token);
  if (info.state === "invalid" || !info.job) return { error: "Invalid link." };

  const client = await getClient(info.job.client_id);
  const phone = client?.phone;
  if (!phone) return { error: "No phone number on file for this appointment." };

  const unexpired = await query.get<{ id: string }>(
    "SELECT id FROM otp_challenges WHERE link_token=? AND verified_at IS NULL AND expires_at > ? AND attempts < max_attempts ORDER BY created_at DESC LIMIT 1",
    token, nowIso(),
  );
  if (unexpired) return { sent: true };

  const code = randomOtp();
  const codeHash = sha256(code);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString().replace("T", " ").slice(0, 19);

  await query.run(
    "INSERT INTO otp_challenges (id, link_token, phone, code_hash, attempts, max_attempts, expires_at, created_at) VALUES (?,?,?,?,0,3,?,?)",
    uuid(), token, phone, codeHash, expiresAt, now,
  );

  await sendOtp(phone, code);
  return { sent: true };
}

export async function verifyOtpAction(token: string, formData: FormData) {
  const code = (formData.get("code") as string)?.trim();
  if (!code || code.length !== 6) return { error: "Enter the 6-digit code." };

  const challenge = await query.get<{
    id: string; code_hash: string; attempts: number; max_attempts: number;
  }>(
    "SELECT id, code_hash, attempts, max_attempts FROM otp_challenges WHERE link_token=? AND verified_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1",
    token, nowIso(),
  );
  if (!challenge) return { error: "Code expired. Please request a new one." };
  if (challenge.attempts >= challenge.max_attempts)
    return { error: "Too many attempts. Please request a new code." };

  await query.run(
    "UPDATE otp_challenges SET attempts = attempts + 1 WHERE id=?",
    challenge.id,
  );

  if (sha256(code) !== challenge.code_hash)
    return { error: `Incorrect code. ${challenge.max_attempts - challenge.attempts - 1} attempts remaining.` };

  await query.run(
    "UPDATE otp_challenges SET verified_at=? WHERE id=?",
    nowIso(), challenge.id,
  );

  const jar = await cookies();
  jar.set(`inspector.otp.${token}`, sha256(token + challenge.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/c/${token}`,
    maxAge: 8 * 3600,
  });

  redirect(`/c/${token}`);
}

export async function checkOtpVerified(token: string): Promise<boolean> {
  const jar = await cookies();
  return !!jar.get(`inspector.otp.${token}`)?.value;
}
