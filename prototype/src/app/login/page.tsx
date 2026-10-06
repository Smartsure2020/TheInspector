// Prototype entry screen. Deliberately not dressed up as a production sign-in:
// it states that this is a prototype, that every record is role-play data, that
// "The Inspector" is a codename, and that clients never enter through here.
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

const roleHome: Record<string, string> = {
  admin: "/admin",
  assessor: "/assessor",
  manager: "/manager",
};

const DEMO_ACCOUNTS = [
  { name: "Lerato Demo", title: "Claims Coordinator", email: "lerato@acorn.demo", workspace: "Coordination — the whole job book" },
  { name: "Sipho Demo", title: "Senior Assessor", email: "sipho@acorn.demo", workspace: "Assessment — today’s appointments, live room" },
  { name: "Anje Demo", title: "Assessor / Surveyor", email: "anje@acorn.demo", workspace: "Assessment — includes risk surveys" },
  { name: "Craig Demo", title: "Assessing Services Manager", email: "craig@acorn.demo", workspace: "Review — approve or return reports" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSession();
  if (user) redirect(roleHome[user.role] ?? "/admin");

  const { next } = await searchParams;

  return (
    <div className="min-h-dvh bg-page">
      <div
        role="note"
        aria-label="Prototype notice"
        className="flex items-center justify-center gap-2 border-b border-proto-line bg-proto-bg px-3 py-2 text-center text-xs font-semibold text-proto"
      >
        <Icon name="warning" size={14} />
        PROTOTYPE — ROLE-PLAY / ANONYMISED DATA ONLY · NO REAL CLIENT DATA
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:py-16">
        {/* ---- Enter the prototype ---------------------------------------- */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">The Inspector</h1>
          <p className="mt-1 text-sm text-muted">
            Virtual claims assessment &amp; risk survey — internal prototype
          </p>

          <LoginForm next={next} />

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Staff only. Clients never sign in — they open a one-off appointment
            link sent to them by their coordinator.
          </p>
        </div>

        {/* ---- What this build is ----------------------------------------- */}
        <div className="space-y-4">
          <section className="rounded-lg border border-proto-line bg-proto-bg/50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-proto">
              <Icon name="warning" size={15} />
              Read this before you demo
            </h2>
            <ul className="mt-2.5 space-y-1.5 text-sm text-foreground/85">
              <li className="flex gap-2">
                <Icon name="dot" size={9} className="mt-1.5 text-proto" />
                <span>Every client, claim, policy and photo in this build is <strong>role-play data</strong>. No real client information may be entered, ever.</span>
              </li>
              <li className="flex gap-2">
                <Icon name="dot" size={9} className="mt-1.5 text-proto" />
                <span><strong>“The Inspector” is an internal codename.</strong> The client-facing product name is still an open decision.</span>
              </li>
              <li className="flex gap-2">
                <Icon name="dot" size={9} className="mt-1.5 text-proto" />
                <span>Reports carry a non-removable limitations section and are positioned as <strong>pending assessor sign-off</strong> — they are not production documents.</span>
              </li>
              <li className="flex gap-2">
                <Icon name="dot" size={9} className="mt-1.5 text-proto" />
                <span>Access control here is <strong>prototype-grade</strong>. Production authentication, MFA and POPIA hardening are deferred by decision, not missing by accident.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-background p-4 shadow-1">
            <h2 className="text-sm font-semibold text-foreground">Demo accounts</h2>
            <p className="mt-1 text-xs text-muted">
              Four seeded staff accounts, one per workspace. The shared demo
              password is in the handover pack — it is not printed on screen.
            </p>
            <ul className="mt-3 divide-y divide-border">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium text-foreground">{a.name}</span>
                    <span className="text-xs text-muted">{a.title}</span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted">{a.email}</p>
                  <p className="mt-0.5 text-xs text-muted-light">{a.workspace}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
