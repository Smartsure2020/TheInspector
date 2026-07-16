import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Not available" }, { status: 404 });

  const { email, password } = await req.json();
  const { query } = await import("@/lib/db");
  const { verifyPassword, createSession } = await import("@/lib/auth");

  const user = await query.get<{
    id: string; role: string; password_hash: string | null; is_active: number;
  }>("SELECT id, role, password_hash, is_active FROM users WHERE email = ?", email);

  if (!user?.password_hash) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  if (!user.is_active) return NextResponse.json({ error: "Inactive" }, { status: 403 });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
