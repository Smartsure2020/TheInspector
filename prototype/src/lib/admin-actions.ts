"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, nowIso, uuid } from "./db";
import { requireRole } from "./auth";
import bcrypt from "bcryptjs";

interface UserRow {
  id: string; name: string; role: string; title: string;
  email: string | null; is_active: number; created_at: string | null; last_login_at: string | null;
}

export async function listStaffUsers() {
  await requireRole("admin");
  return query.all<UserRow>(
    "SELECT id, name, role, title, email, is_active, created_at, last_login_at FROM users ORDER BY name",
  );
}

export async function getStaffUser(userId: string) {
  await requireRole("admin");
  return query.get<UserRow>(
    "SELECT id, name, role, title, email, is_active, created_at, last_login_at FROM users WHERE id=?",
    userId,
  );
}

export async function getUserMandates(userId: string) {
  await requireRole("admin");
  return query.all<{ template_id: string; template_name: string; assigned_at: string }>(
    `SELECT m.template_id, t.name AS template_name, m.assigned_at
     FROM user_template_mandates m
     JOIN checklist_templates t ON t.id = m.template_id
     WHERE m.user_id = ?
     ORDER BY t.name`,
    userId,
  );
}

export async function createUserAction(formData: FormData) {
  const admin = await requireRole("admin");
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as string;
  const title = (formData.get("title") as string)?.trim();
  const password = formData.get("password") as string;

  if (!name || !email || !role || !title || !password)
    return { error: "All fields are required." };
  if (!["admin", "assessor", "manager"].includes(role))
    return { error: "Invalid role." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const existing = await query.get("SELECT 1 FROM users WHERE email=?", email);
  if (existing) return { error: "A user with this email already exists." };

  const id = uuid();
  const passwordHash = await bcrypt.hash(password, 10);
  await query.run(
    "INSERT INTO users (id, name, role, title, email, password_hash, is_active, created_at) VALUES (?,?,?,?,?,?,1,?)",
    id, name, role, title, email, passwordHash, nowIso(),
  );

  revalidatePath("/admin/users");
  redirect(`/admin/users/${id}`);
}

export async function updateUserAction(userId: string, formData: FormData) {
  const admin = await requireRole("admin");
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as string;
  const title = (formData.get("title") as string)?.trim();

  if (!name || !email || !role || !title)
    return { error: "All fields are required." };

  const dup = await query.get<{ id: string }>("SELECT id FROM users WHERE email=? AND id!=?", email, userId);
  if (dup) return { error: "Another user already has this email." };

  await query.run(
    "UPDATE users SET name=?, email=?, role=?, title=? WHERE id=?",
    name, email, role, title, userId,
  );
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function toggleActiveAction(userId: string) {
  await requireRole("admin");
  const user = await query.get<{ is_active: number }>("SELECT is_active FROM users WHERE id=?", userId);
  if (!user) return;
  await query.run("UPDATE users SET is_active=? WHERE id=?", user.is_active ? 0 : 1, userId);
  if (user.is_active) {
    await query.run(
      "UPDATE staff_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL",
      nowIso(), userId,
    );
  }
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function resetPasswordAction(userId: string, formData: FormData) {
  await requireRole("admin");
  const password = formData.get("password") as string;
  if (!password || password.length < 8)
    return { error: "Password must be at least 8 characters." };
  const hash = await bcrypt.hash(password, 10);
  await query.run("UPDATE users SET password_hash=? WHERE id=?", hash, userId);
  await query.run(
    "UPDATE staff_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL",
    nowIso(), userId,
  );
  revalidatePath(`/admin/users/${userId}`);
}

export async function toggleMandateAction(userId: string, templateId: string) {
  const admin = await requireRole("admin");
  const existing = await query.get(
    "SELECT id FROM user_template_mandates WHERE user_id=? AND template_id=?",
    userId, templateId,
  );
  if (existing) {
    await query.run("DELETE FROM user_template_mandates WHERE user_id=? AND template_id=?", userId, templateId);
  } else {
    await query.run(
      "INSERT INTO user_template_mandates (id, user_id, template_id, assigned_by, assigned_at) VALUES (?,?,?,?,?)",
      uuid(), userId, templateId, admin.id, nowIso(),
    );
  }
  revalidatePath(`/admin/users/${userId}`);
}
