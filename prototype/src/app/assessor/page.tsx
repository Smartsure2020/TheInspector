import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { Icon, IconName } from "@/components/ui/Icon";
import {
  Badge, EmptyState, JobTypeBadge, LinkButton, PageHeader, Panel, PriorityBadge,
  StatusBadge, SummaryStrip, SummaryTile,
} from "@/components/ui/primitives";
import {
  listJobs, clientReadiness, jobTypeLabel, durationForClaimType,
  type Readiness, type JobRow,
} from "@/lib/data";
import { formatDayHeading, formatDuration, formatTime } from "@/lib/format";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Client readiness as a labelled sequence, not four coloured dots. Each step
 * carries an icon and a text state so it survives greyscale and screen readers.
 */
function ReadinessTrail({ readiness }: { readiness: Readiness }) {
  const steps: { label: string; done: boolean; icon: IconName }[] = [
    { label: "Link opened", done: readiness.linkOpened, icon: "link" },
    { label: "Consent accepted", done: readiness.consent, icon: "checkCircle" },
    { label: "Device check passed", done: readiness.deviceCheck, icon: "camera" },
    { label: "In waiting room", done: readiness.waiting, icon: "user" },
  ];
  const reached = steps.filter((s) => s.done).length;

  return (
    <div>
      <p className="text-xs font-medium text-muted">
        Client readiness <span className="tnum">{reached} of {steps.length}</span>
      </p>
      <ol className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1.5">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1">
            {i > 0 && <Icon name="chevronRight" size={11} className="mr-0.5 text-muted-light" />}
            <span
              className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs ${
                s.done
                  ? "border-status-success-line bg-status-success-bg font-medium text-status-success"
                  : "border-border bg-surface text-muted-light"
              }`}
            >
              <Icon name={s.done ? "check" : s.icon} size={11} />
              {s.label}
              <span className="sr-only">{s.done ? " — done" : " — not yet"}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface Appointment { job: JobRow; readiness: Readiness }

/** One row of the operational schedule. The primary action follows readiness. */
function ScheduleRow({ job, readiness }: Appointment) {
  const live = job.status === "In progress";
  const ready = readiness.waiting;

  return (
    <li className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-start">
      {/* Time column */}
      <div className="flex w-full shrink-0 items-baseline gap-2 sm:w-24 sm:flex-col sm:gap-0.5">
        <span className="text-lg font-semibold tnum leading-none text-foreground">
          {job.scheduled_start ? formatTime(job.scheduled_start) : "Now"}
        </span>
        <span className="text-xs text-muted">{formatDuration(durationForClaimType(job.claim_type))}</span>
      </div>

      {/* Detail column */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-foreground hover:underline">
            {job.client_name}
          </Link>
          <span className="font-mono text-xs text-muted">{job.job_number}</span>
          {job.attempt_count > 1 && <Badge tone="warning" icon="refresh">Attempt {job.attempt_count}</Badge>}
          <PriorityBadge priority={job.priority} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{jobTypeLabel(job)}</span>
          <JobTypeBadge jobType={job.job_type} />
        </div>

        <div className="mt-2.5">
          {live ? (
            <p className="inline-flex items-center gap-1.5 rounded-sm border border-status-success-line bg-status-success-bg px-2 py-1 text-xs font-medium text-status-success">
              <Icon name="video" size={13} />
              Session running — client is in the room
            </p>
          ) : (
            <ReadinessTrail readiness={readiness} />
          )}
        </div>
      </div>

      {/* Action column — never the same button regardless of state */}
      <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:w-44">
        {live ? (
          <LinkButton href={`/jobs/${job.id}/room`} variant="accent" icon="video">Resume session</LinkButton>
        ) : ready ? (
          <>
            <LinkButton href={`/jobs/${job.id}/room`} variant="accent" icon="admit">Join &amp; admit client</LinkButton>
            <p className="text-center text-xs text-status-success">Client is waiting for you</p>
          </>
        ) : (
          <>
            <LinkButton href={`/jobs/${job.id}`} variant="secondary" icon="clipboard">Open job</LinkButton>
            <LinkButton href={`/jobs/${job.id}/room`} variant="quiet" size="sm" icon="video">
              Open room early
            </LinkButton>
            <p className="text-center text-xs text-muted">
              {readiness.linkOpened ? "Client hasn’t reached the waiting room yet" : "Client hasn’t opened the link yet"}
            </p>
          </>
        )}
      </div>
    </li>
  );
}

const QUEUES: { key: string; status: string; title: string; hint: string; action: string; icon: IconName; route: (id: string) => string; tone: "warning" | "danger" | "neutral" }[] = [
  { key: "evidence", status: "Awaiting evidence", title: "Awaiting evidence", hint: "Items are still outstanding from the client", action: "Review missing evidence", icon: "images", route: (id) => `/jobs/${id}/evidence`, tone: "warning" },
  { key: "write", status: "Awaiting report", title: "Reports to write", hint: "Session finished — the report needs drafting", action: "Write report", icon: "document", route: (id) => `/jobs/${id}/report`, tone: "warning" },
  { key: "returned", status: "Returned for correction", title: "Returned for correction", hint: "Your manager sent these back with comments", action: "Address comments", icon: "refresh", route: (id) => `/jobs/${id}/report`, tone: "danger" },
  { key: "noshow", status: "No-show", title: "No-shows", hint: "The client did not attend — rebooking needed", action: "Reschedule", icon: "calendar", route: (id) => `/jobs/${id}/schedule`, tone: "danger" },
];

export default async function AssessorDashboard() {
  const user = await requireRole("assessor");
  const all = await listJobs();
  const mine = all.filter((j) => j.assessor_id === user.id || !j.assessor_id);

  const upcoming = mine
    .filter((j) => j.status === "Scheduled" || j.status === "In progress")
    .sort((a, b) => (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? ""));

  const appointments: Appointment[] = await Promise.all(
    upcoming.map(async (job) => ({ job, readiness: await clientReadiness(job.id) })),
  );

  // Group the schedule by day so "Today" is genuinely today's work.
  const byDay = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const key = formatDayHeading(a.job.scheduled_start);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(a);
    else byDay.set(key, [a]);
  }

  // Precise counts: a client already in session is not "waiting to be admitted".
  const waitingToAdmit = appointments.filter((a) => a.readiness.waiting && a.job.status !== "In progress").length;
  const liveNow = appointments.filter((a) => a.job.status === "In progress").length;
  const queueCount = (status: string) => mine.filter((j) => j.status === status).length;

  return (
    <StaffShell title="Assessor dashboard" user={user} section="/assessor">
      <PageHeader
        title="Today"
        lede="Your appointments first, then everything waiting on you. Client readiness updates as the client works through their link."
        meta={
          <>
            <Badge tone="neutral" icon="user">{user.name}</Badge>
            <Badge tone="neutral" icon="calendar">
              {appointments.length} appointment{appointments.length === 1 ? "" : "s"} booked
            </Badge>
          </>
        }
      />

      <SummaryStrip className="mb-8">
        <SummaryTile
          label={liveNow > 0 && waitingToAdmit === 0 ? "In session now" : "Waiting to be admitted"}
          value={liveNow > 0 && waitingToAdmit === 0 ? liveNow : waitingToAdmit}
          meaning={liveNow > 0 && waitingToAdmit === 0 ? "Session running — rejoin from the schedule" : "In the waiting room, ready for you to let in"}
          tone="accent"
          icon={liveNow > 0 && waitingToAdmit === 0 ? "video" : "admit"}
        />
        <SummaryTile label="Awaiting evidence" value={queueCount("Awaiting evidence")} meaning="Chase or verify outstanding items" href="#queue-evidence" tone="warning" icon="images" />
        <SummaryTile label="Reports to write" value={queueCount("Awaiting report")} meaning="Sessions done, reports outstanding" href="#queue-write" tone="warning" icon="document" />
        <SummaryTile label="Returned to you" value={queueCount("Returned for correction")} meaning="Manager comments to address" href="#queue-returned" tone="danger" icon="refresh" />
      </SummaryStrip>

      {/* ---- Schedule ------------------------------------------------------ */}
      <h2 className="mb-3 text-base font-semibold text-foreground">Appointment schedule</h2>
      {appointments.length === 0 ? (
        <EmptyState icon="calendar" title="No appointments booked">
          Nothing is scheduled for you at the moment. Booked appointments appear
          here with live client readiness.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {[...byDay.entries()].map(([day, list]) => (
            <Panel key={day} title={day} subtitle={`${list.length} appointment${list.length === 1 ? "" : "s"}`} flush>
              <ul>
                {list.map((a) => <ScheduleRow key={a.job.id} {...a} />)}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      {/* ---- Work queues --------------------------------------------------- */}
      <h2 id="my-work" className="mb-3 mt-10 scroll-mt-4 text-base font-semibold text-foreground">My work</h2>
      <div className="space-y-4">
        {QUEUES.map((q) => {
          const list = mine.filter((j) => j.status === q.status);
          if (list.length === 0) return null;
          return (
            <Panel
              key={q.key}
              tone={q.tone === "neutral" ? undefined : q.tone}
              title={
                <span id={`queue-${q.key}`} className="scroll-mt-4">
                  {q.title} <span className="tnum font-normal text-muted">({list.length})</span>
                </span>
              }
              subtitle={q.hint}
              flush
            >
              <ul>
                {list.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${j.id}`} className="text-sm font-medium text-foreground hover:underline">
                        {j.client_name}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span className="font-mono">{j.job_number}</span>
                        <span>{jobTypeLabel(j)}</span>
                      </p>
                    </div>
                    <StatusBadge status={j.status} />
                    <LinkButton href={q.route(j.id)} variant="secondary" size="sm" icon={q.icon}>
                      {q.action}
                    </LinkButton>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
        {QUEUES.every((q) => mine.filter((j) => j.status === q.status).length === 0) && (
          <EmptyState icon="checkCircle" title="Nothing outstanding">
            No evidence to chase, no reports to write and nothing returned for
            correction. Your queue is clear.
          </EmptyState>
        )}
      </div>
    </StaffShell>
  );
}
