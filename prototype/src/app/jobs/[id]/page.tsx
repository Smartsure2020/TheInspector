import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { JobActions } from "@/components/JobActions";
import { Icon, IconName } from "@/components/ui/Icon";
import {
  Badge, DetailList, EmptyState, InlineAlert, JobTypeBadge, LinkButton, LockedBadge,
  PageHeader, Panel, PriorityBadge, ProgressBar, StatusBadge, TabNav, Timeline,
  TimelineDayHeading, TimelineEntry,
} from "@/components/ui/primitives";
import {
  evidenceCountByItem, getClient, getJob, getTemplate, jobTypeLabel, listAppointments,
  listEvents, listMandatedAssessors, listReports, listResponses, missingItems, userNameMap,
} from "@/lib/data";
import {
  eventDetails, eventMeta, formatDate, formatDateTime, formatDayHeading, formatDuration,
  formatTime, isLockedStatus, STATUS_MEANING,
} from "@/lib/format";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The single most useful next step for the current status. No new transitions. */
function nextAction(status: string, jobId: string): { label: string; href: string; icon: IconName } | null {
  switch (status) {
    case "Assigned": return { label: "Book the appointment", href: `/jobs/${jobId}/schedule`, icon: "calendar" };
    case "Scheduled": return { label: "Open the live room", href: `/jobs/${jobId}/room`, icon: "video" };
    case "In progress": return { label: "Resume the session", href: `/jobs/${jobId}/room`, icon: "video" };
    case "Awaiting evidence": return { label: "Resolve missing evidence", href: `/jobs/${jobId}/evidence`, icon: "images" };
    case "Awaiting report": return { label: "Write the report", href: `/jobs/${jobId}/report`, icon: "document" };
    case "Returned for correction": return { label: "Revise the report", href: `/jobs/${jobId}/report`, icon: "pencil" };
    case "Report submitted": return { label: "Open the submitted report", href: `/jobs/${jobId}/report/final`, icon: "eye" };
    case "Report completed": return { label: "View the approved report", href: `/jobs/${jobId}/report/final`, icon: "eye" };
    case "No-show": return { label: "Rebook the appointment", href: `/jobs/${jobId}/schedule`, icon: "calendar" };
    default: return null;   // "New" is handled by the assign control below
  }
}

export default async function JobDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const job = await getJob(id);

  if (!job) {
    return (
      <StaffShell title="Job not found" user={user}>
        <EmptyState icon="search" title="We can’t find that job">
          The job may have been removed, or the link may be wrong. Everything in
          this build is seeded demo data.
        </EmptyState>
      </StaffShell>
    );
  }

  const client = await getClient(job.client_id);
  const tpl = (await getTemplate(job.template_id))!;
  const events = await listEvents(id);
  const appts = await listAppointments(id);
  const missing = await missingItems(id);
  const responses = await listResponses(id);
  const counts = await evidenceCountByItem(id);
  const reports = await listReports(id);
  const names = await userNameMap();

  const missingByKey = new Map(missing.map((m) => [m.item_key, m.missing_reason]));
  const responseByKey = new Map(responses.map((r) => [r.item_key, r]));
  const locked = isLockedStatus(job.status);
  const isSurvey = job.job_type === "survey";
  const activeAppt = appts.filter((a) => a.status === "scheduled" && !a.link_revoked_at).at(-1);
  const hasSubmittedReport = reports.some((r) => r.status !== "draft");
  const next = nextAction(job.status, job.id);

  const allItems = tpl.sections.flatMap((s) => s.items);
  const evidenceItems = allItems.filter((i) => i.evidenceRequired);
  const capturedRequired = evidenceItems.filter((i) => (counts[i.key] ?? 0) > 0).length;
  const concerns = responses.filter((r) => r.concern_flag).length;

  const tabs = [
    { key: "overview", href: `/jobs/${id}?tab=overview`, label: "Overview", icon: "clipboard" as IconName, current: tab === "overview" },
    { key: "appointments", href: `/jobs/${id}?tab=appointments`, label: "Appointments", icon: "calendar" as IconName, current: tab === "appointments" },
    { key: "checklist", href: `/jobs/${id}?tab=checklist`, label: "Checklist", icon: "list" as IconName, current: tab === "checklist" },
    { key: "room", href: `/jobs/${id}/room`, label: "Live room", icon: "video" as IconName, current: false },
    { key: "evidence", href: `/jobs/${id}/evidence`, label: "Evidence", icon: "images" as IconName, current: false },
    { key: "report", href: `/jobs/${id}/report`, label: "Report", icon: "document" as IconName, current: false },
    ...(hasSubmittedReport
      ? [{ key: "final", href: `/jobs/${id}/report/final`, label: "Final report", icon: "eye" as IconName, current: false }]
      : []),
  ];

  // Group timeline entries by day.
  const days: { day: string; rows: typeof events }[] = [];
  for (const e of events) {
    const day = formatDayHeading(e.occurred_at);
    const last = days.at(-1);
    if (last?.day === day) last.rows.push(e);
    else days.push({ day, rows: [e] });
  }

  return (
    <StaffShell title={`Job ${job.job_number}`} user={user}>
      <PageHeader
        trail={[
          { label: isSurvey ? "Risk surveys" : "Assessments" },
          { label: job.job_number },
        ]}
        title={<span className="tnum">{job.job_number}</span>}
        lede={STATUS_MEANING[job.status]}
        meta={
          <>
            <StatusBadge status={job.status} />
            <JobTypeBadge jobType={job.job_type} />
            <PriorityBadge priority={job.priority} />
            {job.attempt_count > 1 && <Badge tone="warning" icon="refresh">Attempt {job.attempt_count}</Badge>}
            {locked && <LockedBadge status={job.status} />}
          </>
        }
        actions={
          <>
            {next && (
              <LinkButton href={next.href} variant="primary" icon={next.icon}>{next.label}</LinkButton>
            )}
            {/* Secondary destinations only when they can say something useful. */}
            {!locked && job.status !== "New" && job.status !== "Assigned" && (
              <LinkButton href={`/jobs/${id}/evidence`} variant="secondary" icon="images">Evidence</LinkButton>
            )}
            {locked && (
              <LinkButton href={`/jobs/${id}/evidence`} variant="secondary" icon="images">Evidence (read-only)</LinkButton>
            )}
          </>
        }
      />

      {/* ---- Record summary strip ------------------------------------------ */}
      <dl className="mb-5 grid gap-x-6 gap-y-3 rounded-lg border border-border bg-background px-4 py-3.5 shadow-1 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Client</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">{client?.full_name}</dd>
          <dd className="font-mono text-xs text-muted">{client?.phone}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{isSurvey ? "Surveyor" : "Assessor"}</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">
            {job.assessor_name ?? <span className="text-status-error">Not assigned</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Appointment</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground tnum">
            {activeAppt ? formatDateTime(activeAppt.scheduled_start) : <span className="text-muted">Not booked</span>}
          </dd>
          {activeAppt && <dd className="text-xs text-muted">{formatDuration(activeAppt.duration_minutes)} · attempt {activeAppt.attempt_number}</dd>}
        </div>
        <div>
          <dt className="text-xs text-muted">Template</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">{tpl.name}</dd>
          <dd className="font-mono text-xs text-muted">v{job.template_version}</dd>
        </div>
      </dl>

      {locked && (
        <InlineAlert tone="locked" className="mb-5" title={`This record is locked — ${job.status}`}>
          {job.status === "Report completed"
            ? "The manager approved the report, which locks the job. Evidence and report content can be read but not changed."
            : "The job was cancelled, so it is read-only. Evidence and history remain available."}
        </InlineAlert>
      )}

      {job.special_conditions && (
        <InlineAlert tone="warning" className="mb-5" title={isSurvey ? "Special focus areas" : "Policy conditions to verify"}>
          {job.special_conditions}
        </InlineAlert>
      )}

      {missing.length > 0 && !locked && (
        <InlineAlert
          tone="warning"
          className="mb-5"
          title={`${missing.length} item${missing.length === 1 ? "" : "s"} flagged as missing`}
          actions={<LinkButton href={`/jobs/${id}/evidence`} variant="secondary" size="sm" icon="images">Resolve missing evidence</LinkButton>}
        >
          The assessor could not capture these during the session. They are listed
          on the Checklist tab with the reason given.
        </InlineAlert>
      )}

      <div className="mb-6">
        <JobActions
          jobId={job.id}
          jobNumber={job.job_number}
          clientName={client?.full_name ?? "the client"}
          status={job.status}
          assessors={await listMandatedAssessors(job.template_id)}
          hasAssessor={!!job.assessor_id}
          hasMissingItems={missing.length > 0}
          hasActiveLink={!!activeAppt?.link_token}
        />
      </div>

      <TabNav label="Job sections" tabs={tabs} className="mb-6" />

      {/* ================= OVERVIEW ======================================== */}
      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title={isSurvey ? "Survey details" : "Claim details"}>
            <DetailList
              rows={[
                { term: isSurvey ? "Reference" : "Claim number", value: <span className="font-mono">{job.claim_number}</span> },
                { term: "Policy", value: <span className="font-mono">{job.policy_number ?? "—"}</span> },
                { term: isSurvey ? "Survey type" : "Assessment type", value: <>{tpl.name} <span className="font-mono text-xs text-muted">v{job.template_version}</span></> },
                { term: isSurvey ? "Requested date" : "Date of loss", value: formatDate(job.date_of_loss, { long: true }) },
                { term: isSurvey ? "Surveyor" : "Assessor", value: job.assessor_name ?? "Not assigned" },
                { term: "Priority", value: job.priority },
                { term: isSurvey ? "Instructions" : "Loss description", value: job.description ?? "—" },
                ...(job.special_conditions ? [{ term: "Verify", value: job.special_conditions, tone: "warning" as const }] : []),
                ...(job.outcome_reason ? [{ term: "Outcome", value: `${job.outcome} — ${job.outcome_reason}`, tone: "danger" as const }] : []),
              ]}
            />
          </Panel>

          <Panel
            title="Activity"
            subtitle={`${events.length} recorded event${events.length === 1 ? "" : "s"} — every mutation is logged`}
          >
            {events.length === 0 ? (
              <EmptyState icon="list" title="No activity yet" />
            ) : (
              <div className="max-h-[28rem] overflow-y-auto pr-1">
                <Timeline>
                  {days.map((d) => (
                    <div key={d.day} className="contents">
                      <TimelineDayHeading>{d.day}</TimelineDayHeading>
                      {d.rows.map((e) => {
                        const data = (e.data ? JSON.parse(e.data) : {}) as Record<string, unknown>;
                        const meta = eventMeta(e.event_type);
                        // Seeded history rows carry prose; live rows are mapped.
                        const label = e.event_type === "seed_history" && typeof data.text === "string" ? data.text : meta.label;
                        return (
                          <TimelineEntry
                            key={e.id}
                            group={meta.group}
                            time={formatTime(e.occurred_at)}
                            actor={names[e.actor] ?? e.actor}
                            label={label}
                            details={e.event_type === "seed_history" ? undefined : eventDetails(e.event_type, data)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </Timeline>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* ================= APPOINTMENTS ==================================== */}
      {tab === "appointments" && (
        <Panel
          title="Appointment history"
          subtitle="Each attempt issues one client link. Rebooking revokes the previous link."
          actions={
            !locked && ["Assigned", "Scheduled", "No-show"].includes(job.status)
              ? <LinkButton href={`/jobs/${id}/schedule`} variant="primary" size="sm" icon="calendar">
                  {job.status === "Assigned" ? "Book appointment" : "Rebook"}
                </LinkButton>
              : undefined
          }
          flush
        >
          {appts.length === 0 ? (
            <div className="p-4">
              <EmptyState icon="calendar" title="No appointments yet">
                {job.status === "New"
                  ? "Assign an assessor first, then a booking can be made."
                  : "Book an appointment to generate the client’s link."}
              </EmptyState>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {[...appts].reverse().map((a) => {
                const revoked = !!a.link_revoked_at;
                return (
                  <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                    <div className="w-full shrink-0 sm:w-44">
                      <p className="text-sm font-semibold text-foreground tnum">{formatDateTime(a.scheduled_start)}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Attempt {a.attempt_number} · {formatDuration(a.duration_minutes)}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={a.status === "scheduled" ? "Scheduled" : a.status === "no_show" ? "No-show" : a.status} />
                        {a.link_token && !revoked && <Badge tone="success" icon="link">Client link active</Badge>}
                        {revoked && <Badge tone="locked" icon="linkOff">Link revoked</Badge>}
                      </div>
                      {a.no_show_reason && (
                        <p className="mt-1.5 text-sm text-status-error">Reason given: {a.no_show_reason}</p>
                      )}
                      {revoked && (
                        <p className="mt-1.5 text-xs text-muted">Revoked {formatDateTime(a.link_revoked_at)}</p>
                      )}
                      {a.link_token && !revoked && (
                        <p className="mt-1.5 break-all font-mono text-xs text-muted">
                          /c/{a.link_token.slice(0, 6)}…{a.link_token.slice(-4)}
                        </p>
                      )}
                    </div>
                    {a.link_token && !revoked && (
                      <LinkButton href={`/jobs/${id}/schedule`} variant="secondary" size="sm" icon="copy">
                        Link &amp; message
                      </LinkButton>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      {/* ================= CHECKLIST ======================================= */}
      {tab === "checklist" && (
        <div className="space-y-5">
          <Panel title="Checklist progress" subtitle={`${tpl.name} v${job.template_version} — read-only overview`}>
            <div className="grid gap-4 sm:grid-cols-3">
              <ProgressBar
                value={capturedRequired}
                max={evidenceItems.length}
                label="evidence-required items have a capture"
              />
              <div>
                <p className="text-2xl font-semibold tnum leading-none text-foreground">{missing.length}</p>
                <p className="mt-1 text-xs text-muted">flagged as missing</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tnum leading-none text-foreground">{concerns}</p>
                <p className="mt-1 text-xs text-muted">concern flags (staff-only)</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted">Legend:</span>
              <Badge tone="neutral" icon="camera">Photo required</Badge>
              <Badge tone="info" icon="hires">High-res needed</Badge>
              <Badge tone="success" icon="check">Answered</Badge>
              <Badge tone="warning" icon="warning">Missing</Badge>
              <Badge tone="danger" icon="flag">Concern</Badge>
            </div>
          </Panel>

          {tpl.sections.map((s) => (
            <Panel key={s.key} title={s.title} subtitle={`${s.items.length} items`} flush>
              <ul className="divide-y divide-border">
                {s.items.map((item) => {
                  const r = responseByKey.get(item.key);
                  const isMissing = missingByKey.has(item.key);
                  const n = counts[item.key] ?? 0;
                  const answered = !!r?.answer;
                  return (
                    <li
                      key={item.key}
                      className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 ${isMissing ? "bg-status-warning-bg" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{item.prompt}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {item.evidenceRequired && <Badge tone="neutral" icon="camera">Photo required</Badge>}
                          {item.highRes && <Badge tone="info" icon="hires">High-res</Badge>}
                          {n > 0 && <Badge tone="success" icon="image">{n} captured</Badge>}
                          {answered && <Badge tone="success" icon="check">Answered</Badge>}
                          {r?.concern_flag ? <Badge tone="danger" icon="flag">Concern flagged</Badge> : null}
                        </div>
                        {answered && (
                          <p className="mt-1.5 text-sm text-muted">
                            <span className="text-muted-light">Answer: </span>
                            {String(JSON.parse(r!.answer!))}
                          </p>
                        )}
                        {r?.note && (
                          <p className="mt-1 text-sm text-muted">
                            <span className="text-muted-light">Note: </span>{r.note}
                          </p>
                        )}
                        {r?.concern_note && (
                          <p className="mt-1 text-sm text-status-error">
                            <span className="opacity-70">Concern: </span>{r.concern_note}
                          </p>
                        )}
                      </div>
                      {isMissing && (
                        <p className="shrink-0 text-sm font-medium text-status-warning sm:w-56 sm:text-right">
                          <Icon name="warning" size={14} className="mr-1 inline align-[-2px]" />
                          Missing — {missingByKey.get(item.key) ?? "no reason recorded"}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
          <p className="text-xs text-muted">
            Concern flags and staff notes are internal. Nothing on this tab is
            visible to the client on their link.{" "}
            <Link href={`/jobs/${id}/evidence`} className="text-accent underline">Open the evidence gallery</Link>.
          </p>
        </div>
      )}
    </StaffShell>
  );
}
