import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { query, nowIso, uuid } from "./db";
import { sha256, randomToken } from "./crypto";

const COOKIE_NAME = "inspector.session";
const SESSION_HOURS = 8;
const SALT_ROUNDS = 10;

export interface SessionUser {
  id: string;
  name: string;
  role: string;
  title: string;
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const tokenHash = sha256(token);
  const now = nowIso();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000)
    .toISOString().replace("T", " ").slice(0, 19);

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = h.get("user-agent") ?? "unknown";

  await query.run(
    `INSERT INTO staff_sessions (id, user_id, token_hash, ip_address, user_agent, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    uuid(), userId, tokenHash, ip, ua, now, expires,
  );

  await query.run("UPDATE users SET last_login_at=? WHERE id=?", now, userId);

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = sha256(token);
  const now = nowIso();

  const row = await query.get<SessionUser & { expires_at: string; revoked_at: string | null }>(
    `SELECT u.id, u.name, u.role, u.title, u.email, s.expires_at, s.revoked_at
     FROM staff_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND u.is_active = 1`,
    tokenHash,
  );

  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at < now) return null;

  return { id: row.id, name: row.name, role: row.role, title: row.title, email: row.email };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role))
    throw new Error(`Forbidden: requires ${roles.join(" or ")}`);
  return user;
}

export async function revokeSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = sha256(token);
    await query.run("UPDATE staff_sessions SET revoked_at=? WHERE token_hash=?", nowIso(), tokenHash);
  }
  jar.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await query.run(
    "UPDATE staff_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL",
    nowIso(), userId,
  );
}
