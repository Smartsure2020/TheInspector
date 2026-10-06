import { getSession } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

const roleHome: Record<string, string> = {
  admin: "/admin",
  assessor: "/assessor",
  manager: "/manager",
};

const WORKSPACE: Record<string, string> = {
  admin: "the coordination workspace",
  assessor: "your assessment workspace",
  manager: "the review workspace",
};

export default async function AccessDeniedPage() {
  const user = await getSession();
  const home = user ? roleHome[user.role] ?? "/admin" : "/login";

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div
        role="note"
        aria-label="Prototype notice"
        className="flex items-center justify-center gap-2 border-b border-proto-line bg-proto-bg px-3 py-1.5 text-center text-xs font-semibold text-proto"
      >
        <Icon name="warning" size={14} />
        PROTOTYPE — ROLE-PLAY / ANONYMISED DATA ONLY · NO REAL CLIENT DATA
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <div className="rounded-lg border border-border bg-background p-6 shadow-1">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-status-locked-line bg-status-locked-bg text-status-locked">
            <Icon name="lock" size={20} />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Access denied</h1>
          <p className="mt-2 text-sm text-muted">
            {user
              ? <>Your role ({user.role}) does not have permission to view this page. Everything you need is in {WORKSPACE[user.role] ?? "your workspace"}.</>
              : <>You need to be signed in to view this page.</>}
          </p>
          <div className="mt-5">
            <LinkButton href={home} variant="primary" iconAfter="arrowRight">
              {user ? "Go to my workspace" : "Sign in"}
            </LinkButton>
          </div>
        </div>
      </main>
    </div>
  );
}
