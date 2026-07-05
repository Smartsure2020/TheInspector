"use client";
import { useRouter } from "next/navigation";
import { DemoUserLite, useRole } from "@/lib/role";
import { PrototypeBanner } from "@/components/Chrome";

const roleMeta = [
  { role: "admin", title: "Admin / Coordinator", desc: "Create jobs, assign assessors, schedule, send links", home: "/admin" },
  { role: "assessor", title: "Assessor / Surveyor", desc: "Run sessions, capture evidence, write reports", home: "/assessor" },
  { role: "manager", title: "Manager / Reviewer", desc: "Review and approve reports", home: "/manager" },
] as const;

export function RolePicker({ users }: { users: DemoUserLite[] }) {
  const { setUser } = useRole();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-900">
      <PrototypeBanner />
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-white text-3xl font-bold tracking-tight">
          The Inspector <span className="text-slate-400 text-base font-normal">working codename — Acorn</span>
        </h1>
        <p className="text-slate-300 mt-2 text-sm">
          Virtual assessment workflow prototype. Choose a role to enter — no login exists in Phase 1.
          Clients never use this page; they enter via an assessment link only.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {roleMeta.map((r) => (
            <div key={r.role} className="bg-slate-800 rounded-xl p-4 flex flex-col">
              <h2 className="text-white font-semibold">{r.title}</h2>
              <p className="text-slate-400 text-xs mt-1 flex-1">{r.desc}</p>
              <div className="mt-4 space-y-2">
                {users.filter((u) => u.role === r.role).map((u) => (
                  <button
                    key={u.id}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium"
                    onClick={() => { setUser(u); router.push(r.home); }}
                  >
                    Enter as {u.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-8">
          Demo client links: <a className="underline" href="/c/demo-geyser">/c/demo-geyser</a> ·{" "}
          <a className="underline" href="/c/demo-acc">/c/demo-acc</a> ·{" "}
          <a className="underline" href="/spike/device.html">device capability spike</a>
        </p>
      </div>
    </div>
  );
}
