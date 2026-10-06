// Presentation-layer formatting ONLY.
//
// Stored values are never touched: timestamps stay ISO-8601 ("YYYY-MM-DD
// HH:MM:SS"), event types stay exactly as `actions.ts` writes them, statuses
// stay exactly as the status machine in `data.ts` defines them. Everything here
// maps a stored value to something a human can read.
//
// Parsing note (F24): DISPLAY below shows the stored digits as they are (parseStamp reads
// "YYYY-MM-DD HH:MM" without a zone and prints the same clock digits), so what is shown does not
// depend on the server timezone. Time CALCULATIONS (link expiry, early-join window, countdown,
// "x minutes ago") live in `lib/time.ts` and are explicit about UTC instants vs wall-clock values.
// Known gap, recorded as F25: UTC instants (created_at, occurred_at, …) are displayed as their UTC
// digits, i.e. two hours behind South African time; converting them is a product decision because
// seeded demo values are literal wall-clock strings.

import { parseUtcStamp } from "./time";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseStamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today, 10:30" · "Yesterday, 16:05" · "7 Jul 2026, 10:30" */
export function formatDateTime(value: string | null | undefined, opts: { long?: boolean } = {}): string {
  const d = parseStamp(value);
  if (!d) return "—";
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (sameDay(d, now)) return `Today, ${hhmm(d)}`;
  if (sameDay(d, yesterday)) return `Yesterday, ${hhmm(d)}`;
  if (sameDay(d, tomorrow)) return `Tomorrow, ${hhmm(d)}`;
  const month = opts.long ? MONTHS[d.getMonth()] : MONTHS_SHORT[d.getMonth()];
  return `${d.getDate()} ${month} ${d.getFullYear()}, ${hhmm(d)}`;
}

/** "7 Jul 2026" — no time component. */
export function formatDate(value: string | null | undefined, opts: { long?: boolean } = {}): string {
  const d = parseStamp(value);
  if (!d) return "—";
  const month = opts.long ? MONTHS[d.getMonth()] : MONTHS_SHORT[d.getMonth()];
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

/** "Today" · "Tomorrow" · "Mon 7 Jul" — date heading for grouped lists. */
export function formatDayHeading(value: string | null | undefined): string {
  const d = parseStamp(value);
  if (!d) return "Undated";
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (sameDay(d, now)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  if (sameDay(d, tomorrow)) return "Tomorrow";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "10:30" — time only. */
export function formatTime(value: string | null | undefined): string {
  const d = parseStamp(value);
  return d ? hhmm(d) : "—";
}

/**
 * "35 minutes ago" · "in 2 hours" · "just now". Exact time stays available.
 * `value` must be a stored UTC instant (submitted_at, last_login_at, …); it is compared with the real
 * current time, so the result no longer depends on the server's timezone (F24).
 */
export function formatRelative(value: string | null | undefined, from = Date.now()): string {
  const ms = parseUtcStamp(value);
  if (Number.isNaN(ms)) return "—";
  const diff = ms - from;
  const future = diff > 0;
  const mins = Math.round(Math.abs(diff) / 60000);
  if (mins < 1) return "just now";
  const said =
    mins < 60 ? `${mins} minute${mins === 1 ? "" : "s"}`
    : mins < 60 * 36 ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? "" : "s"}`
    : `${Math.round(mins / 1440)} day${Math.round(mins / 1440) === 1 ? "" : "s"}`;
  return future ? `in ${said}` : `${said} ago`;
}

/** Whole minutes as "45 min" / "1 h 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Session clock, mm:ss — used by the live room header. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

// ---------------------------------------------------------------------------
// Event log → readable timeline
// ---------------------------------------------------------------------------

export type EventGroup =
  | "status"    // workflow movement
  | "schedule"  // booking / links
  | "client"    // client-side activity
  | "session"   // live session
  | "evidence"  // capture / filing / uploads
  | "report"    // drafting / submission
  | "review"    // manager decisions
  | "warning"   // no-show, declines, missing items
  | "cancel"    // cancellation
  | "other";

interface EventMeta { label: string; group: EventGroup }

/**
 * Stored event_type → human label. The stored type is NEVER changed; this is a
 * display mapping only (handover 09, cosmetic item 16).
 */
const EVENT_LABELS: Record<string, EventMeta> = {
  job_created:                { label: "Job created", group: "status" },
  job_assigned:               { label: "Assessor assigned", group: "status" },
  status_changed:             { label: "Status changed", group: "status" },
  appointment_scheduled:      { label: "Appointment booked", group: "schedule" },
  no_show_marked:             { label: "Marked as no-show", group: "warning" },
  job_cancelled:              { label: "Job cancelled", group: "cancel" },

  link_opened:                { label: "Client opened the link", group: "client" },
  consent_accepted:           { label: "Client accepted consent", group: "client" },
  consent_declined:           { label: "Client declined consent", group: "warning" },
  device_check_passed:        { label: "Client passed the device check", group: "client" },
  client_waiting:             { label: "Client entered the waiting room", group: "client" },
  client_requested_reschedule:{ label: "Client can’t attend — rebook requested", group: "warning" },
  client_requested_new_link:  { label: "Client requested a new link", group: "warning" },

  session_started:            { label: "Client admitted — session started", group: "session" },
  session_ended:              { label: "Session ended", group: "session" },
  client_disconnected:        { label: "Client connection lost", group: "warning" },
  client_reconnected:         { label: "Client reconnected", group: "session" },

  response_recorded:          { label: "Checklist answer recorded", group: "evidence" },
  concern_flagged:            { label: "Concern flagged", group: "warning" },
  concern_cleared:            { label: "Concern cleared", group: "evidence" },
  item_flagged_missing:       { label: "Item flagged as missing", group: "warning" },
  item_missing_cleared:       { label: "Missing flag removed", group: "evidence" },
  evidence_captured:          { label: "Evidence captured", group: "evidence" },
  evidence_relabelled:        { label: "Evidence relabelled", group: "evidence" },
  evidence_refiled:           { label: "Evidence refiled", group: "evidence" },
  evidence_featured:          { label: "Evidence featured in the report", group: "evidence" },
  evidence_unfeatured:        { label: "Evidence removed from report figures", group: "evidence" },
  evidence_uploaded:          { label: "Client uploaded evidence", group: "evidence" },
  missing_item_resolved:      { label: "Missing item resolved by upload", group: "evidence" },

  report_draft_started:       { label: "Report draft started", group: "report" },
  report_revision_started:    { label: "Report revision started", group: "report" },
  report_submitted:           { label: "Report submitted for review", group: "report" },
  report_approved:            { label: "Report approved and locked", group: "review" },
  report_returned:            { label: "Report returned for correction", group: "review" },

  seed_history:               { label: "Recorded history", group: "other" },
};

export function eventMeta(eventType: string): EventMeta {
  return (
    EVENT_LABELS[eventType] ?? {
      // Unknown type: humanise rather than dump the raw token.
      label: eventType.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
      group: "other",
    }
  );
}

/** Detail lines built from the event payload — never raw JSON. */
export function eventDetails(eventType: string, data: Record<string, unknown>): { term: string; value: string }[] {
  const out: { term: string; value: string }[] = [];
  const push = (term: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    out.push({ term, value: String(value) });
  };

  if (typeof data.from === "string" && typeof data.to === "string") {
    // evidence_refiled / evidence_relabelled reuse from→to for non-status moves
    const isStatusMove = eventType === "status_changed" || eventType.startsWith("report_") || eventType === "session_ended" || eventType === "no_show_marked" || eventType === "job_cancelled";
    push(isStatusMove ? "From" : "Was", data.from);
    push(isStatusMove ? "To" : "Now", data.to);
  }
  push("Reason", data.reason);
  push("Outcome", data.outcome);
  push("Appointment", typeof data.when === "string" ? formatDateTime(data.when) : undefined);
  push("Attempt", data.attempt);
  push("Assessor", data.assessor);
  push("Version", typeof data.version === "number" ? `v${data.version}` : undefined);
  push("Checklist item", data.item_key);
  push("Reference", data.claim_number);
  push("Name given", data.name);
  push("Client link", data.link === "reissued" ? "Reissued — previous link revoked" : data.link);
  if (data.camera !== undefined) {
    const bits = [
      data.camera ? "camera OK" : "no camera",
      data.rear_tried ? "rear camera tried" : null,
      data.mic ? "microphone OK" : "microphone not detected",
      data.torch === "on" ? "torch OK" : data.torch === "unsupported" ? "torch unsupported" : null,
    ].filter(Boolean);
    push("Device check", bits.join(" · "));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Status presentation
// ---------------------------------------------------------------------------

/**
 * Plain-language explanation of what a status means operationally. Domain
 * terminology is preserved exactly ("Awaiting evidence", "Returned for
 * correction", "Report completed", "No-show", …).
 */
export const STATUS_MEANING: Record<string, string> = {
  "New": "Not yet assigned to an assessor.",
  "Assigned": "Has an assessor — needs an appointment.",
  "Scheduled": "Booked. The client has a link for the appointment time.",
  "In progress": "Live session running now.",
  "Awaiting evidence": "Session done, items still outstanding from the client.",
  "Awaiting report": "Evidence complete — the report needs writing.",
  "Report submitted": "With the manager for review.",
  "Returned for correction": "The manager sent it back with comments.",
  "Report completed": "Approved. The record is locked.",
  "Cancelled": "Closed without an assessment.",
  "No-show": "The client did not attend — needs rebooking.",
};

/** A record is locked (read-only) in these statuses — mirrors `EDGES` having no exits. */
export const isLockedStatus = (status: string) => status === "Report completed" || status === "Cancelled";
