import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

const roleHome: Record<string, string> = {
  admin: "/admin",
  assessor: "/assessor",
  manager: "/manager",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSession();
  if (user) redirect(roleHome[user.role] ?? "/admin");

  const { next } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">The Inspector</h1>
          <p className="text-xs text-slate-400 mt-1">(codename)</p>
          <p className="text-sm text-slate-500 mt-2">Sign in to continue</p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
