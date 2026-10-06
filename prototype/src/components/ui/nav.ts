// Navigation shape + link styling, shared by the server-rendered sidebar
// (`Chrome.tsx`) and the client-rendered mobile drawer (`ChromeClient.tsx`).
//
// Deliberately NOT in a "use client" module: a plain function exported from a
// client module cannot be *called* from a server component, only rendered.
import type { IconName } from "./Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  description: string;
  current?: boolean;
}

/** `dark` selects the ink sidebar palette; otherwise the light drawer palette. */
export function navLinkClass(current: boolean | undefined, dark: boolean) {
  if (dark) {
    return [
      "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
      current
        ? "border-accent bg-white/10 font-semibold text-on-dark"
        : "border-transparent text-on-dark-muted hover:bg-white/5 hover:text-on-dark",
    ].join(" ");
  }
  return [
    "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors",
    current
      ? "border-accent bg-accent-soft font-semibold text-foreground"
      : "border-transparent text-muted hover:bg-surface hover:text-foreground",
  ].join(" ");
}
