"use client";
// Interactive parts of the staff shell: mobile navigation drawer, role switch
// explanation, sign out. Kept separate so `Chrome.tsx` (and therefore every
// staff page) stays a server component.
import Link from "next/link";
import { useState, useTransition } from "react";
import { logoutAction } from "@/lib/auth-actions";
import { Icon } from "@/components/ui/Icon";
import { Button, InlineAlert } from "@/components/ui/primitives";
import { ConfirmDialog, Drawer } from "@/components/ui/Overlay";
import { navLinkClass, type NavItem } from "@/components/ui/nav";

export function MobileNav({ items, workspace }: { items: NavItem[]; workspace: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        icon="menu"
        className="lg:hidden"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Menu
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="The Inspector"
        description={`${workspace} · prototype`}
      >
        <nav aria-label="Main navigation (mobile)">
          <ul className="space-y-0.5">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  aria-current={it.current ? "page" : undefined}
                  className={navLinkClass(it.current, false)}
                >
                  <Icon name={it.icon} size={16} />
                  <span className="min-w-0">
                    <span className="block">{it.label}</span>
                    <span className="block text-xs font-normal text-muted-light">{it.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <InlineAlert tone="warning" className="mt-4" title="Prototype build">
          Every record is role-play data. Nothing here is a real claim, client or policy.
        </InlineAlert>
      </Drawer>
    </>
  );
}

export function SignOutButton() {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  return (
    <>
      <Button variant="quiet" size="sm" icon="signOut" onClick={() => setOpen(true)}>
        <span className="hidden sm:inline">Sign out</span>
        <span className="sm:hidden sr-only">Sign out</span>
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => new Promise<void>((resolve) => { startTransition(() => { void logoutAction(); resolve(); }); })}
        title="Sign out of the prototype?"
        consequence="Your session ends and you return to the sign-in screen. Nothing in the demo book changes."
        confirmLabel="Sign out"
        busyLabel="Signing out"
      />
    </>
  );
}
