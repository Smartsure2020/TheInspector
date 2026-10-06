// The application frame: prototype banner, staff workspace shell, client shell.
//
// Server component by design — pages stay server-rendered and only the drawer /
// sign-out controls ship as client code (`ChromeClient.tsx`).
//
// The PROTOTYPE banner is permanent and unmissable on every surface (staff and
// client). Its wording is fixed by the scope guardrails; do not soften it.
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { MobileNav, SignOutButton } from "@/components/ChromeClient";
import { navLinkClass, type NavItem } from "@/components/ui/nav";

export function PrototypeBanner({ client = false }: { client?: boolean }) {
  return (
    <div
      role="note"
      aria-label="Prototype notice"
      className="shrink-0 flex items-center justify-center gap-2 border-b border-proto-line bg-proto-bg px-3 py-1.5 text-center text-xs font-semibold text-proto no-print"
    >
      <Icon name="warning" size={14} />
      <span>
        {client
          ? "PROTOTYPE — DEMONSTRATION ONLY"
          : "PROTOTYPE — ROLE-PLAY / ANONYMISED DATA ONLY · NO REAL CLIENT DATA"}
      </span>
    </div>
  );
}

export interface StaffUser {
  name: string;
  role: string;
  title: string;
}

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  assessor: "/assessor",
  manager: "/manager",
};

const WORKSPACE: Record<string, string> = {
  admin: "Coordination workspace",
  assessor: "Assessment workspace",
  manager: "Review workspace",
};

/** Role-aware navigation. Real routes and real in-page destinations only. */
function navFor(role: string, pathHint: string): NavItem[] {
  const is = (href: string) => pathHint === href || (href !== "/admin" && pathHint.startsWith(href));
  if (role === "admin") {
    return [
      { href: "/admin", label: "Pipeline", icon: "list", description: "The whole job book", current: pathHint === "/admin" },
      { href: "/jobs/new", label: "New job", icon: "plus", description: "Create an assessment or survey", current: is("/jobs/new") },
      { href: "/admin/users", label: "Users", icon: "users", description: "Staff accounts and mandates", current: is("/admin/users") },
    ];
  }
  if (role === "manager") {
    return [
      { href: "/manager", label: "Review queue", icon: "clipboard", description: "Reports awaiting your decision", current: pathHint === "/manager" },
      { href: "/manager#team-pipeline", label: "Team pipeline", icon: "users", description: "Work in progress per assessor" },
    ];
  }
  return [
    { href: "/assessor", label: "Today", icon: "calendar", description: "Appointments and client readiness", current: pathHint === "/assessor" },
    { href: "/assessor#my-work", label: "My work", icon: "list", description: "Evidence, reports and rebookings" },
  ];
}

export function StaffShell({
  children,
  title,
  user,
  /** Route family for the active nav state, e.g. "/admin" or "/jobs/new". */
  section,
}: {
  children: React.ReactNode;
  title: string;
  user: StaffUser;
  section?: string;
}) {
  const home = ROLE_HOME[user.role] ?? "/admin";
  const items = navFor(user.role, section ?? home);
  const workspace = WORKSPACE[user.role] ?? "Workspace";

  return (
    <div className="app-shell flex h-dvh flex-col bg-page">
      <a href="#main-content" className="sr-only-focusable">Skip to main content</a>
      <PrototypeBanner />

      <div className="flex min-h-0 flex-1">
        {/* ---- Desktop sidebar ------------------------------------------- */}
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto bg-foreground lg:flex no-print">
          <Link
            href={home}
            className="flex items-baseline gap-2 border-b border-white/10 px-4 py-4 text-on-dark hover:opacity-90"
          >
            <span className="text-sm font-semibold tracking-wide">THE INSPECTOR</span>
          </Link>

          <nav aria-label="Main navigation" className="flex-1 p-2">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-on-dark-muted/70">
              {workspace}
            </p>
            <ul className="space-y-0.5">
              {items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} aria-current={it.current ? "page" : undefined} className={navLinkClass(it.current, true)}>
                    <Icon name={it.icon} size={16} />
                    <span>{it.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/10 p-4 text-xs text-on-dark-muted">
            <p className="font-medium text-on-dark">{user.name}</p>
            <p className="mt-0.5">{user.title}</p>
            <p className="mt-2 leading-relaxed">
              “The Inspector” is an internal codename — the client-facing name is
              still an open decision.
            </p>
          </div>
        </aside>

        {/* ---- Content column ------------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-border bg-background px-4 py-2.5 no-print">
            <div className="mx-auto flex max-w-[80rem] flex-wrap items-center gap-x-4 gap-y-2">
              <MobileNav items={items} workspace={workspace} />
              <Link href={home} className="text-sm font-semibold tracking-wide text-foreground lg:hidden">
                THE INSPECTOR
              </Link>
              <p className="hidden min-w-0 truncate text-sm text-muted sm:block">{title}</p>

              <div className="ml-auto flex items-center gap-3">
                <span className="hidden items-center gap-2 text-xs text-muted sm:flex">
                  <Icon name="user" size={14} className="text-muted-light" />
                  <span className="font-medium text-foreground">{user.name}</span>
                  <Badge tone="neutral">{user.title}</Badge>
                </span>
                <SignOutButton />
              </div>
            </div>
          </header>

          <main id="main-content" className="app-scroll min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[80rem] px-4 py-6 sm:px-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Client-facing shell: one column, mobile-first, generous touch targets, safe
 * areas honoured. Nothing internal ever renders inside it.
 */
export function ClientShell({
  children,
  className = "",
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <PrototypeBanner client />
      <main className={`mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 safe-b ${className}`}>
        {children}
      </main>
      <footer className="mx-auto w-full max-w-md px-5 pb-4 text-center text-xs text-muted-light">
        Acorn · demonstration build
      </footer>
    </div>
  );
}

/**
 * Seeded evidence placeholder tile. Seed rows deliberately have no image files
 * (limitation 17) — the tile says so rather than pretending to be a photo.
 */
export function PhotoTile({
  hue, label, small = false, className = "",
}: { hue: number; label?: string; small?: boolean; className?: string }) {
  return (
    <div
      className={`relative flex items-end overflow-hidden rounded-sm border border-border ${small ? "h-16 w-24" : "h-36 w-full"} ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 14% 68%), hsl(${hue} 16% 38%))` }}
    >
      <span className="absolute left-1.5 top-1.5 rounded-sm bg-black/45 px-1.5 py-0.5 text-xs font-medium text-white">
        No file
      </span>
      {label && !small && (
        <span className="w-full truncate bg-black/55 px-2 py-1 text-xs leading-tight text-white">{label}</span>
      )}
    </div>
  );
}
