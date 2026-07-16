import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const roleHome: Record<string, string> = {
  admin: "/admin",
  assessor: "/assessor",
  manager: "/manager",
};

export default async function Home() {
  const user = await getSession();
  redirect(user ? (roleHome[user.role] ?? "/admin") : "/login");
}
