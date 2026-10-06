// Client-facing building blocks (`/c/[token]/*`).
//
// Different rules from the staff workspace: bigger type, 48px touch targets,
// one action per screen, plain language, calm motion. Nothing internal is ever
// rendered by anything in this file.
import Link from "next/link";
import { Icon, IconName } from "./Icon";

/** The three steps a client walks before the call. Verification precedes them. */
export const CLIENT_STEPS = ["Permission", "Camera check", "Join"] as const;
export type ClientStep = (typeof CLIENT_STEPS)[number];

export function ClientStepHeader({
  step, title, lede,
}: { step?: ClientStep; title: React.ReactNode; lede?: React.ReactNode }) {
  const index = step ? CLIENT_STEPS.indexOf(step) : -1;
  return (
    <header className="mb-5">
      {index >= 0 && (
        <>
          <p className="text-sm font-medium text-muted">
            Step <span className="tnum">{index + 1}</span> of <span className="tnum">{CLIENT_STEPS.length}</span>
          </p>
          <ol className="mt-2 flex items-center gap-1.5" aria-label="Your progress">
            {CLIENT_STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-1.5">
                <span
                  aria-current={i === index ? "step" : undefined}
                  className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-accent" : i === index ? "bg-accent" : "bg-border"}`}
                />
                <span className="sr-only">
                  {s}{i < index ? " — done" : i === index ? " — you are here" : " — still to do"}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-light">{CLIENT_STEPS[index]}</p>
        </>
      )}
      <h1 className={`text-2xl font-semibold tracking-tight text-foreground ${index >= 0 ? "mt-3" : ""}`}>{title}</h1>
      {lede && <p className="mt-2 text-base leading-relaxed text-muted">{lede}</p>}
    </header>
  );
}

const CLIENT_BTN =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const CLIENT_TONE = {
  primary: "border-accent bg-accent text-accent-on hover:bg-accent-hover",
  secondary: "border-border-strong bg-background text-foreground hover:bg-surface",
  quiet: "border-transparent bg-transparent text-muted hover:bg-surface hover:text-foreground",
} as const;

export function clientButtonClass(tone: keyof typeof CLIENT_TONE = "primary", extra = "") {
  return `${CLIENT_BTN} ${CLIENT_TONE[tone]} ${extra}`;
}

export function ClientAction({
  tone = "primary", icon, children, className = "", type = "button", ...rest
}: { tone?: keyof typeof CLIENT_TONE; icon?: IconName } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={clientButtonClass(tone, className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function ClientLinkAction({
  href, tone = "primary", icon, children, className = "",
}: { href: string; tone?: keyof typeof CLIENT_TONE; icon?: IconName; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={clientButtonClass(tone, className)}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Link>
  );
}

export function ClientCard({
  title, icon, children, tone = "plain", className = "",
}: {
  title?: React.ReactNode;
  icon?: IconName;
  children: React.ReactNode;
  tone?: "plain" | "accent" | "warning" | "success" | "info";
  className?: string;
}) {
  const skin = {
    plain: "border-border bg-background",
    accent: "border-accent-line bg-accent-soft",
    warning: "border-status-warning-line bg-status-warning-bg",
    success: "border-status-success-line bg-status-success-bg",
    info: "border-status-info-line bg-status-info-bg",
  }[tone];
  return (
    <section className={`rounded-lg border p-4 ${skin} ${className}`}>
      {title && (
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {icon && <Icon name={icon} size={17} />}
          {title}
        </h2>
      )}
      <div className={title ? "mt-2.5" : ""}>{children}</div>
    </section>
  );
}

/** Bulleted list with real bullets, sized for reading on a phone. */
export function ClientBullets({
  items, tone = "plain",
}: { items: React.ReactNode[]; tone?: "plain" | "warning" }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-base leading-relaxed text-muted">
          <Icon
            name={tone === "warning" ? "warning" : "dot"}
            size={tone === "warning" ? 15 : 9}
            className={`mt-1.5 shrink-0 ${tone === "warning" ? "text-status-warning" : "text-accent"}`}
          />
          <span className="text-foreground/85">{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** Full-screen state for a link that can't be used, or a finished journey. */
export function ClientOutcome({
  icon, tone = "neutral", title, children, actions,
}: {
  icon: IconName;
  tone?: "neutral" | "success" | "warning";
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const skin = {
    neutral: "border-border-strong bg-surface text-muted",
    success: "border-status-success-line bg-status-success-bg text-status-success",
    warning: "border-status-warning-line bg-status-warning-bg text-status-warning",
  }[tone];
  return (
    <div className="flex flex-1 flex-col justify-center py-10 text-center">
      <span className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border ${skin}`}>
        <Icon name={icon} size={26} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {children && <div className="mt-3 text-base leading-relaxed text-muted">{children}</div>}
      {actions && <div className="mt-7 space-y-2.5 text-left">{actions}</div>}
    </div>
  );
}
