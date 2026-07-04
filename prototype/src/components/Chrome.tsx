"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role";

export function PrototypeBanner({ client = false }: { client?: boolean }) {
  return (
    <div className="bg-amber-400 text-amber-950 text-center text-xs font-semibold tracking-wide py-1 px-2">
      {client
        ? "PROTOTYPE — demonstration only"
        : "PROTOTYPE — placeholder access · role-play / anonymised data only · no real client data"}
    </div>
  );
}

const roleHome: Record<string, string> = {
  admin: "/admin",
  assessor: "/assessor",
  manager: "/manager",
};

export function StaffShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, setUser, ready } = useRole();
  const router = useRouter();

  if (!ready) return null;
  if (!user)
    return (
      <div className="min-h-screen bg-slate-100">
        <PrototypeBanner />
        <div className="p-10 text-center text-slate-600">
          No role selected.{" "}
          <Link className="text-blue-700 underline" href="/">
            Choose a role
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100">
      <PrototypeBanner />
      <header className="bg-slate-900 text-white px-4 py-2 flex items-center gap-4">
        <Link href={roleHome[user.role]} className="font-bold tracking-tight">
          The Inspector <span className="text-slate-400 font-normal text-xs">(codename)</span>
        </Link>
        <span className="text-slate-300 text-sm">{title}</span>
        <span className="ml-auto text-sm text-slate-300">
          {user.name} · {user.title}
        </span>
        <button
          className="text-xs bg-slate-700 hover:bg-slate-600 rounded px-2 py-1"
          onClick={() => {
            setUser(null);
            router.push("/");
          }}
        >
          Switch role
        </button>
      </header>
      <main className="p-4 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PrototypeBanner client />
      <main className="flex-1 w-full max-w-md mx-auto p-4">{children}</main>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  New: "bg-slate-200 text-slate-800",
  Assigned: "bg-sky-100 text-sky-800",
  Scheduled: "bg-blue-100 text-blue-800",
  "In progress": "bg-emerald-100 text-emerald-800",
  "Awaiting evidence": "bg-amber-100 text-amber-800",
  "Awaiting report": "bg-orange-100 text-orange-800",
  "Report submitted": "bg-violet-100 text-violet-800",
  "Returned for correction": "bg-rose-100 text-rose-800",
  "Report completed": "bg-green-100 text-green-800",
  Cancelled: "bg-slate-100 text-slate-500 line-through",
  "No-show": "bg-red-100 text-red-800",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusStyles[status] ?? "bg-slate-200"}`}>
      {status}
    </span>
  );
}

export function PhotoTile({ hue, label, small = false }: { hue: number; label?: string; small?: boolean }) {
  return (
    <div
      className={`rounded-md flex items-end overflow-hidden ${small ? "h-16 w-24" : "h-32 w-full"}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 55%), hsl(${hue} 45% 30%))` }}
      title={label}
    >
      {label && !small && (
        <span className="text-[10px] leading-tight text-white/90 bg-black/40 px-1.5 py-0.5 w-full truncate">{label}</span>
      )}
    </div>
  );
}
