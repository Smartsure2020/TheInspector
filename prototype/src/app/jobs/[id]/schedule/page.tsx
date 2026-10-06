import { StaffShell } from "@/components/Chrome";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, DetailList, EmptyState, FormField, InlineAlert, LinkButton, Panel, StatusBadge,
  PageHeader,
} from "@/components/ui/primitives";
import { durationForClaimType, getJob, getClient, jobTypeLabel, listAppointments } from "@/lib/data";
import { formatDateTime, formatDuration, isLockedStatus } from "@/lib/format";
import { scheduleAction } from "@/lib/actions";
import { CopyButton } from "@/components/CopyButton";
import { requireSession } from "@/lib/auth";
import { wallParts } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Schedule({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const { done } = await searchParams;
  const job = await getJob(id);

  if (!job) {
    return (
      <StaffShell title="Schedule" user={user}>
        <EmptyState icon="search" title="We can’t find that job" />
      </StaffShell>
    );
  }

  const client = await getClient(job.client_id);
  const appts = await listAppointments(id);
  const active = appts.filter((a) => a.status === "scheduled" && !a.link_revoked_at).at(-1);
  const history = [...appts].reverse().filter((a) => a.id !== active?.id);
  const canSchedule = ["Assigned", "Scheduled", "No-show"].includes(job.status);
  const isRebook = job.status !== "Assigned";
  const duration = durationForClaimType(job.claim_type);
  const isSurvey = job.job_type === "survey";

  const link = active ? `http://localhost:3000/c/${active.link_token}` : null;
  const msg = active
    ? isSurvey
      ? `Hi ${client?.full_name}, your virtual risk survey (ref ${job.claim_number}) is booked for ${active.scheduled_start} with ${job.assessor_name ?? "your surveyor"}. Please open this link on your phone at that time: ${link} — we'll walk around the property together on video. No app needed.`
      : `Hi ${client?.full_name}, your virtual assessment for claim ${job.claim_number} is booked for ${active.scheduled_start} with ${job.assessor_name ?? "your assessor"}. Please open this link on your phone at that time: ${link} — you'll need access to the affected area. No app needed.`
    : "";

  const scheduleWithId = scheduleAction.bind(null, id);

  // Defaults are business-time (SAST) wall-clock values, whatever timezone the server runs in.
  const { date: defDate, time: defTime } = wallParts(Date.now() + 30 * 60 * 1000);

  const heading =
    job.status === "No-show" ? `Rebook — attempt ${job.attempt_count + 1}`
    : job.status === "Scheduled" ? "Reschedule appointment"
    : "Book appointment";

  return (
    <StaffShell title={`Schedule — ${job.job_number}`} user={user}>
      <div className="max-w-3xl">
        <PageHeader
          trail={[{ label: job.job_number, href: `/jobs/${id}` }, { label: "Appointments" }]}
          title={heading}
          lede={`${isSurvey ? "Risk survey" : "Claim assessment"} for ${client?.full_name}. Booking issues a one-off client link — you send it yourself.`}
          meta={
            <>
              <StatusBadge status={job.status} />
              <Badge tone="neutral" icon="clipboard"><span className="tnum">{job.claim_number}</span></Badge>
              <Badge tone="neutral" icon="clock">{formatDuration(duration)} slot</Badge>
              {job.attempt_count > 1 && <Badge tone="warning" icon="refresh">Attempt {job.attempt_count}</Badge>}
            </>
          }
          actions={<LinkButton href={`/jobs/${id}`} variant="secondary" icon="chevronLeft">Back to job</LinkButton>}
        />

        {done && (
          <InlineAlert tone="success" role="status" className="mb-5" title="Appointment booked">
            A fresh client link is active below. It has not been sent — copy the
            message and send it to the client yourself.
          </InlineAlert>
        )}

        {isLockedStatus(job.status) ? (
          <InlineAlert tone="locked" title={`This job is ${job.status.toLowerCase()}`}>
            Scheduling is closed. The appointment history below remains available.
          </InlineAlert>
        ) : canSchedule ? (
          <Panel
            title={heading}
            subtitle={isRebook
              ? "Rebooking revokes the current client link immediately and issues a new one."
              : "The client’s link becomes usable from two hours before the appointment."}
            className="mb-5"
          >
            <form action={scheduleWithId} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="date" label="Date" required>
                  <input id="date" name="date" type="date" required defaultValue={defDate} className="w-full" />
                </FormField>
                <FormField id="time" label="Time (SAST)" required hint="Local South African time, as the client will read it.">
                  <input id="time" name="time" type="time" required defaultValue={defTime} className="w-full" />
                </FormField>
              </div>

              <DetailList
                className="rounded-md border border-border bg-surface/60 p-3"
                rows={[
                  { term: "Duration", value: <>{formatDuration(duration)} — the standard slot for {jobTypeLabel(job)}</> },
                  { term: isSurvey ? "Surveyor" : "Assessor", value: job.assessor_name ?? "Not assigned" },
                  { term: "Attempt", value: `${isRebook ? job.attempt_count + 1 : job.attempt_count} of this job` },
                  { term: "Link validity", value: "Opens two hours before the appointment, expires 24 hours after it." },
                ]}
              />

              {isRebook && (
                <InlineAlert tone="warning" title="The current link will stop working">
                  Anyone holding the old link sees “this link has been replaced”
                  and can request a new one. Send the new message below afterwards.
                </InlineAlert>
              )}

              <button
                type="submit"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-foreground bg-foreground px-5 text-sm font-medium text-on-dark transition-colors hover:opacity-90"
              >
                <Icon name="calendar" size={15} />
                {isRebook ? "Rebook & reissue client link" : "Book & generate client link"}
              </button>
            </form>
          </Panel>
        ) : (
          <InlineAlert tone="neutral" className="mb-5" title={`Scheduling isn’t available while this job is ${job.status}`}>
            {job.status === "New"
              ? "Assign an assessor on the job page first."
              : "The appointment for this job has already been used or closed."}
          </InlineAlert>
        )}

        {/* ---- The active link + what must be sent manually ---------------- */}
        {active && link && (
          <Panel
            title="Client link and message"
            subtitle={`Attempt ${active.attempt_number} · ${formatDateTime(active.scheduled_start)}`}
            tone="accent"
            className="mb-5"
            actions={<Badge tone="success" icon="link">Link active</Badge>}
          >
            <InlineAlert tone="info" className="mb-4" title="Nothing is sent automatically">
              This prototype does not send SMS, WhatsApp or email. Copy the
              message below and send it to the client through your normal channel.
            </InlineAlert>

            <label htmlFor="client-link" className="mb-1 block text-sm font-medium text-foreground">Client link</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="client-link"
                readOnly
                value={link}
                className="min-w-0 flex-1 font-mono text-xs"
              />
              <CopyButton text={link} label="Copy link" />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Points at the local development host in this build — the link only
              works on the machine running the prototype.
            </p>

            <label htmlFor="client-message" className="mb-1 mt-5 block text-sm font-medium text-foreground">
              Paste-ready message
            </label>
            <textarea
              id="client-message"
              readOnly
              rows={5}
              defaultValue={msg}
              className="w-full text-sm"
            />
            <div className="mt-2">
              <CopyButton text={msg} label="Copy message" variant="primary" />
            </div>
          </Panel>
        )}

        {/* ---- Previous attempts ------------------------------------------- */}
        {history.length > 0 && (
          <Panel title="Previous attempts" subtitle={`${history.length} earlier appointment${history.length === 1 ? "" : "s"}`} flush>
            <ul className="divide-y divide-border">
              {history.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="w-44 shrink-0 text-sm font-medium text-foreground tnum">
                    {formatDateTime(a.scheduled_start)}
                  </span>
                  <span className="text-xs text-muted">Attempt {a.attempt_number}</span>
                  <StatusBadge status={a.status === "scheduled" ? "Scheduled" : a.status === "no_show" ? "No-show" : a.status} />
                  {a.link_revoked_at
                    ? <Badge tone="locked" icon="linkOff">Link revoked</Badge>
                    : <Badge tone="neutral" icon="link">Link issued</Badge>}
                  {a.no_show_reason && <span className="text-xs text-status-error">{a.no_show_reason}</span>}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </StaffShell>
  );
}
