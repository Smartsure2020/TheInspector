// Shared, presentational building blocks for the whole prototype.
//
// Deliberately NOT a "use client" module: these render in server components
// (dashboards, job pages, reports) and are also pulled into client bundles by
// interactive components. No domain logic lives here — callers decide what a
// status means; this file only decides how it looks.
import Link from "next/link";
import { Icon, IconName } from "./Icon";

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export type ButtonVariant =
  | "primary"    // the one obvious next action
  | "accent"     // brand-positive commit (admit, approve, book)
  | "secondary"  // ordinary action
  | "quiet"      // low-emphasis / tertiary
  | "danger"     // destructive or negative-outcome
  | "warning";   // attention outcome (no-show, items outstanding)

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-on-dark border-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_86%,white)]",
  accent: "bg-accent text-accent-on border-accent hover:bg-accent-hover",
  secondary: "bg-background text-foreground border-border-strong hover:bg-surface",
  quiet: "bg-transparent text-muted border-transparent hover:bg-surface hover:text-foreground",
  danger: "bg-background text-status-error border-status-error-line hover:bg-status-error-bg",
  warning: "bg-background text-status-warning border-status-warning-line hover:bg-status-warning-bg",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra = "") {
  return [
    "inline-flex items-center justify-center whitespace-nowrap rounded-md border font-medium",
    "transition-colors duration-[110ms]",
    "disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-inherit",
    VARIANT[variant],
    SIZE[size],
    extra,
  ].join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconAfter?: IconName;
  /** Renders a spinner and disables the control. */
  busy?: boolean;
  busyLabel?: string;
};

/** Always declares an explicit `type` (defaults to "button"). */
export function Button({
  variant = "secondary", size = "md", icon, iconAfter, busy, busyLabel,
  className = "", children, type = "button", disabled, ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {busy ? <Icon name="spinner" size={size === "sm" ? 13 : 15} className="animate-spin" /> : icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      <span>{busy && busyLabel ? busyLabel : children}</span>
      {!busy && iconAfter && <Icon name={iconAfter} size={size === "sm" ? 13 : 15} />}
    </button>
  );
}

export function LinkButton({
  href, variant = "secondary", size = "md", icon, iconAfter, className = "", children, ...rest
}: { href: string; variant?: ButtonVariant; size?: ButtonSize; icon?: IconName; iconAfter?: IconName; className?: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 15} />}
      <span>{children}</span>
      {iconAfter && <Icon name={iconAfter} size={size === "sm" ? 13 : 15} />}
    </Link>
  );
}

/** Icon-only control. `label` is mandatory — it becomes the accessible name. */
export function IconButton({
  icon, label, variant = "quiet", size = "md", className = "", type = "button", ...rest
}: { icon: IconName; label: string; variant?: ButtonVariant; size?: ButtonSize } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const box = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-md border transition-colors duration-[110ms] disabled:opacity-45 disabled:cursor-not-allowed ${VARIANT[variant]} ${box} ${className}`}
      {...rest}
    >
      <Icon name={icon} size={size === "lg" ? 20 : 16} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export type Tone = "neutral" | "ink" | "accent" | "info" | "success" | "warning" | "danger" | "survey" | "locked";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface text-muted border-border-strong",
  ink: "bg-foreground text-on-dark border-foreground",
  accent: "bg-accent-soft text-accent border-accent-line",
  info: "bg-status-info-bg text-status-info border-status-info-line",
  success: "bg-status-success-bg text-status-success border-status-success-line",
  warning: "bg-status-warning-bg text-status-warning border-status-warning-line",
  danger: "bg-status-error-bg text-status-error border-status-error-line",
  survey: "bg-status-survey-bg text-status-survey border-status-survey-line",
  locked: "bg-status-locked-bg text-status-locked border-status-locked-line",
};

export function Badge({
  tone = "neutral", icon, children, className = "", title,
}: { tone?: Tone; icon?: IconName; children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap ${TONE[tone]} ${className}`}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/**
 * Job status. Every status carries an icon as well as a colour, so state is
 * never communicated by colour alone.
 */
const STATUS_STYLE: Record<string, { tone: Tone; icon: IconName }> = {
  "New": { tone: "neutral", icon: "dot" },
  "Assigned": { tone: "info", icon: "user" },
  "Scheduled": { tone: "info", icon: "calendar" },
  "In progress": { tone: "success", icon: "video" },
  "Awaiting evidence": { tone: "warning", icon: "images" },
  "Awaiting report": { tone: "warning", icon: "document" },
  "Report submitted": { tone: "info", icon: "clock" },
  "Returned for correction": { tone: "danger", icon: "refresh" },
  "Report completed": { tone: "success", icon: "lock" },
  "Cancelled": { tone: "locked", icon: "minus" },
  "No-show": { tone: "danger", icon: "alert" },
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const s = STATUS_STYLE[status] ?? { tone: "neutral" as Tone, icon: "dot" as IconName };
  return <Badge tone={s.tone} icon={s.icon} className={className}>{status}</Badge>;
}

/** Claim assessment vs risk survey — violet is reserved for this distinction. */
export function JobTypeBadge({ jobType, className = "" }: { jobType: string; className?: string }) {
  return jobType === "survey"
    ? <Badge tone="survey" icon="shield" className={className}>Risk survey</Badge>
    : <Badge tone="neutral" icon="clipboard" className={className}>Claim assessment</Badge>;
}

export function PriorityBadge({ priority, className = "" }: { priority?: string | null; className?: string }) {
  if (priority !== "High") return null;
  return <Badge tone="warning" icon="warning" className={className}>High priority</Badge>;
}

export function LockedBadge({ status, className = "" }: { status: string; className?: string }) {
  return (
    <Badge tone="locked" icon="lock" className={className} title={`Locked — ${status}`}>
      Locked · {status}
    </Badge>
  );
}

/** Evidence provenance: frame capture / client high-res / client upload. */
export function EvidenceKindBadge({ kind, className = "" }: { kind: string; className?: string }) {
  if (kind === "highres_client_photo") return <Badge tone="info" icon="hires" className={className}>High-res photo</Badge>;
  if (kind === "client_upload") return <Badge tone="accent" icon="upload" className={className}>Client upload</Badge>;
  return <Badge tone="neutral" icon="capture" className={className}>Live capture</Badge>;
}

// ---------------------------------------------------------------------------
// Page structure
// ---------------------------------------------------------------------------

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {trail.map((t, i) => (
          <li key={`${t.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <Icon name="chevronRight" size={12} className="text-muted-light" />}
            {t.href && i < trail.length - 1
              ? <Link href={t.href} className="hover:text-foreground hover:underline">{t.label}</Link>
              : <span className={i === trail.length - 1 ? "text-foreground font-medium" : ""} aria-current={i === trail.length - 1 ? "page" : undefined}>{t.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title, lede, meta, actions, trail, className = "",
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  trail?: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <header className={`mb-6 ${className}`}>
      {trail && <Breadcrumbs trail={trail} />}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {lede && <p className="mt-1 text-sm text-muted max-w-2xl">{lede}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div>}
      </div>
    </header>
  );
}

/** Working surface. `flush` removes padding for tables and lists. */
export function Panel({
  title, subtitle, actions, children, className = "", flush = false, tone,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
  tone?: "warning" | "danger" | "accent";
}) {
  const edge =
    tone === "warning" ? "border-status-warning-line" :
    tone === "danger" ? "border-status-error-line" :
    tone === "accent" ? "border-accent-line" : "border-border";
  return (
    <section className={`bg-background border ${edge} rounded-lg shadow-1 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/** Definition list for record detail — the pattern used across job/report pages. */
export function DetailList({
  rows, className = "", labelWidth = "9.5rem",
}: { rows: { term: React.ReactNode; value: React.ReactNode; tone?: "warning" | "danger" }[]; className?: string; labelWidth?: string }) {
  return (
    <dl className={`grid gap-y-2.5 text-sm ${className}`} style={{ gridTemplateColumns: `minmax(0,${labelWidth}) minmax(0,1fr)` }}>
      {rows.map((r, i) => (
        <div key={i} className="contents">
          <dt className={`text-xs pt-px ${r.tone === "danger" ? "text-status-error font-semibold" : r.tone === "warning" ? "text-status-warning font-semibold" : "text-muted"}`}>{r.term}</dt>
          <dd className={`min-w-0 break-words ${r.tone === "danger" ? "text-status-error" : r.tone === "warning" ? "text-status-warning" : "text-foreground"}`}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Feedback states
// ---------------------------------------------------------------------------

const ALERT: Record<string, { wrap: string; icon: IconName }> = {
  info: { wrap: "bg-status-info-bg border-status-info-line text-status-info", icon: "info" },
  success: { wrap: "bg-status-success-bg border-status-success-line text-status-success", icon: "checkCircle" },
  warning: { wrap: "bg-status-warning-bg border-status-warning-line text-status-warning", icon: "warning" },
  danger: { wrap: "bg-status-error-bg border-status-error-line text-status-error", icon: "alert" },
  neutral: { wrap: "bg-surface border-border text-muted", icon: "info" },
  locked: { wrap: "bg-status-locked-bg border-status-locked-line text-status-locked", icon: "lock" },
};

export function InlineAlert({
  tone = "info", title, children, actions, className = "", role,
}: {
  tone?: keyof typeof ALERT;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  const a = ALERT[tone];
  return (
    <div role={role} className={`flex gap-3 rounded-md border px-3.5 py-3 text-sm ${a.wrap} ${className}`}>
      <Icon name={a.icon} size={17} className="mt-px" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={`${title ? "mt-1" : ""} text-foreground/85`}>{children}</div>}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "list", title, children, actions, className = "",
}: { icon?: IconName; title: React.ReactNode; children?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-dashed border-border-strong bg-surface/60 px-6 py-10 text-center ${className}`}>
      <Icon name={icon} size={22} className="mx-auto text-muted-light" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      {children && <div className="mt-1.5 text-sm text-muted max-w-md mx-auto">{children}</div>}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

// Route-level skeletons are deliberately absent: `StaffShell` lives inside each
// page rather than in a layout, so a `loading.tsx` would flash an unshelled
// frame without the PROTOTYPE banner. Pending state is handled in place instead
// — busy buttons, inline save/upload state and `LiveRegion` announcements.

// ---------------------------------------------------------------------------
// Summary tiles — real counts only, each with an operational meaning + route
// ---------------------------------------------------------------------------

export function SummaryStrip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>{children}</div>
  );
}

export function SummaryTile({
  label, value, meaning, href, tone = "neutral", icon,
}: {
  label: string;
  value: number;
  meaning: string;
  href?: string;
  /** Applied only when value > 0 — zero must read as calm, not urgent. */
  tone?: "neutral" | "warning" | "danger" | "info" | "accent";
  icon?: IconName;
}) {
  const actionable = value > 0;
  const accentEdge = !actionable ? "border-border" :
    tone === "danger" ? "border-status-error-line" :
    tone === "warning" ? "border-status-warning-line" :
    tone === "info" ? "border-status-info-line" :
    tone === "accent" ? "border-accent-line" : "border-border-strong";
  const numberColour = !actionable ? "text-muted-light" :
    tone === "danger" ? "text-status-error" :
    tone === "warning" ? "text-status-warning" :
    tone === "info" ? "text-status-info" :
    tone === "accent" ? "text-accent" : "text-foreground";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {icon && <Icon name={icon} size={15} className="text-muted-light" />}
      </div>
      <div className={`mt-1.5 text-3xl font-semibold tnum leading-none ${numberColour}`}>{value}</div>
      <p className="mt-1.5 text-xs text-muted">{actionable ? meaning : "Nothing outstanding"}</p>
      {href && actionable && (
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
          View <Icon name="arrowRight" size={12} />
        </span>
      )}
    </>
  );

  const shell = `block rounded-lg border bg-background px-4 py-3.5 shadow-1 ${accentEdge} ${!actionable ? "bg-surface/50" : ""}`;
  return href && actionable
    ? <Link href={href} className={`${shell} transition-colors hover:border-foreground`}>{body}</Link>
    : <div className={shell}>{body}</div>;
}

// ---------------------------------------------------------------------------
// Tables — one operational pattern for every staff queue
// ---------------------------------------------------------------------------

export function DataTable({
  children, minWidth = "44rem", caption, className = "",
}: { children: React.ReactNode; minWidth?: string; caption?: string; className?: string }) {
  return (
    <div className={`scroll-x rounded-lg border border-border bg-background shadow-1 ${className}`}>
      <table className="w-full text-sm border-collapse" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function Th({
  children, className = "", scope = "col", align = "left", width,
}: { children?: React.ReactNode; className?: string; scope?: "col" | "row"; align?: "left" | "right" | "center"; width?: string }) {
  return (
    <th
      scope={scope}
      style={width ? { width } : undefined}
      className={`bg-surface border-b border-border-strong px-3 py-2.5 text-xs font-semibold text-muted ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children, className = "", align = "left", colSpan,
}: { children?: React.ReactNode; className?: string; align?: "left" | "right" | "center"; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2.5 align-middle ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""} ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tr className={`border-b border-border last:border-0 transition-colors hover:bg-surface/70 focus-within:bg-surface/70 ${className}`}>{children}</tr>;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function ProgressBar({
  value, max, label, tone = "accent", className = "", showText = true,
}: { value: number; max: number; label: string; tone?: "accent" | "ink"; className?: string; showText?: boolean }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        aria-valuetext={`${value} of ${max}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-[260ms] ${tone === "accent" ? "bg-accent" : "bg-foreground"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showText && <p className="mt-1 text-xs text-muted tnum">{value} of {max} {label}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline — compact operational activity list (never a conference schedule)
// ---------------------------------------------------------------------------

const TIMELINE_MARK: Record<string, { icon: IconName; className: string }> = {
  status: { icon: "arrowRight", className: "text-foreground bg-surface border-border-strong" },
  schedule: { icon: "calendar", className: "text-status-info bg-status-info-bg border-status-info-line" },
  client: { icon: "user", className: "text-accent bg-accent-soft border-accent-line" },
  session: { icon: "video", className: "text-status-success bg-status-success-bg border-status-success-line" },
  evidence: { icon: "image", className: "text-foreground bg-surface border-border-strong" },
  report: { icon: "document", className: "text-foreground bg-surface border-border-strong" },
  review: { icon: "shield", className: "text-status-survey bg-status-survey-bg border-status-survey-line" },
  warning: { icon: "warning", className: "text-status-warning bg-status-warning-bg border-status-warning-line" },
  cancel: { icon: "minus", className: "text-status-error bg-status-error-bg border-status-error-line" },
  other: { icon: "dot", className: "text-muted bg-surface border-border" },
};

export function TimelineEntry({
  group, time, actor, label, details,
}: {
  group: string;
  time: string;
  actor: string;
  label: string;
  details?: { term: string; value: string }[];
}) {
  const mark = TIMELINE_MARK[group] ?? TIMELINE_MARK.other;
  return (
    <li className="relative flex gap-3 pb-3 last:pb-0">
      <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${mark.className}`}>
        <Icon name={mark.icon} size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{label}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          <span className="tnum">{time}</span> · {actor}
        </p>
        {details && details.length > 0 && (
          <dl className="mt-1.5 grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-xs">
            {details.map((d, i) => (
              <div key={i} className="contents">
                <dt className="text-muted-light">{d.term}</dt>
                <dd className="text-muted break-words">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </li>
  );
}

export function Timeline({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <ol className={`relative space-y-0 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border ${className}`}>
      {children}
    </ol>
  );
}

export function TimelineDayHeading({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative z-10 flex items-center gap-2 pb-2.5 pt-1">
      <span className="h-6 w-6 shrink-0" aria-hidden />
      <span className="label bg-background pr-2">{children}</span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export function FieldGroup({
  legend, hint, children, className = "",
}: { legend: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={`bg-background border border-border rounded-lg shadow-1 p-4 sm:p-5 ${className}`}>
      <legend className="px-1 text-sm font-semibold text-foreground">{legend}</legend>
      {hint && <p className="mt-1 mb-3 text-xs text-muted">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </fieldset>
  );
}

export function FormField({
  id, label, hint, error, required, children, className = "",
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
        {label}
        {required
          ? <span className="ml-1 text-status-error" aria-hidden>*</span>
          : <span className="ml-1.5 text-xs font-normal text-muted-light">(optional)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="mb-1.5 text-xs text-muted">{hint}</p>}
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs font-medium text-status-error">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs (URL-driven — every tab is a real, linkable route/query)
// ---------------------------------------------------------------------------

export function TabNav({
  label, tabs, className = "",
}: {
  label: string;
  tabs: { key: string; href: string; label: string; icon?: IconName; badge?: React.ReactNode; current: boolean }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`scroll-x -mx-1 border-b border-border ${className}`}>
      <ul className="flex min-w-max items-end gap-0.5 px-1">
        {tabs.map((t) => (
          <li key={t.key}>
            <Link
              href={t.href}
              aria-current={t.current ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2.5 text-sm transition-colors ${
                t.current
                  ? "border-accent font-semibold text-foreground"
                  : "border-transparent text-muted hover:border-border-strong hover:text-foreground"
              }`}
            >
              {t.icon && <Icon name={t.icon} size={14} />}
              {t.label}
              {t.badge}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
