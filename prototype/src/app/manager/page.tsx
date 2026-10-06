import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, EmptyState, JobTypeBadge, LinkButton, PageHeader, Panel, PriorityBadge,
  StatusBadge, SummaryStrip, SummaryTile,
} from "@/components/ui/primitives";
import { jobTypeLabel, listJobs, listUsers, listReports, type JobRow, type ReportRow } from "@/lib/data";
import { formatDateTime, formatRelative } from "@/lib/format";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Stages the manager cares about, in workflow order. No invented metrics. */
const STAGES: { label: string; statuses: string[] }[] = [
  { label: "In the field", statuses: ["Scheduled", "In progress"] },
  { label: "Awaiting evidence", statuses: ["Awaiting evidence"] },
  { label: "Report outstanding", statuses: ["Awaiting report", "Returned for correction"] },
  { label: "With me for review", statuses: ["Report submitted"] },
  { label: "Completed", statuses: ["Report completed"] },
];

const OPEN_STATUSES = new Set(["New", "Assigned", "Scheduled", "In progress", "Awaiting evidence", "Awaiting report", "Report submitted", "Returned for correction"]);

export default async function ManagerDashboard() {
  const user = await requireRole("manager");
  const all = await listJobs();
  const queue = await Promise.all(
    all
      .filter((j) => j.status === "Report submitted")
      .map(async (job) => {
        const versions = await listReports(job.id);
        return {
          job,
          latest: versions.at(-1),
          /** Was an earlier version already sent back? Useful review context. */
          previouslyReturned: versions.some((v) => v.status === "returned"),
        };
      }),
  );

  // Oldest submission first — the manager works the back of the queue.
  queue.sort((a, b) => (a.latest?.submitted_at ?? "").localeCompare(b.latest?.submitted_at ?? ""));

  const assessors = await listUsers("assessor");
  const surveys = queue.filter((q) => q.job.job_type === "survey").length;
  const resubmissions = queue.filter((q) => q.previouslyReturned).length;
  const oldest = queue[0]?.latest?.submitted_at;

  return (
    <StaffShell title="Manager dashboard" user={user} section="/manager">
      <PageHeader
        title="Review queue"
        lede="Reports waiting on your decision, oldest first. Approving a report locks the job; returning it sends it back to the assessor with your comments."
        meta={
          <>
            <Badge tone="neutral" icon="clipboard">
              {queue.length} report{queue.length === 1 ? "" : "s"} awaiting review
            </Badge>
            {oldest && <Badge tone={queue.length ? "warning" : "neutral"} icon="clock">Oldest submitted {formatRelative(oldest)}</Badge>}
          </>
        }
      />

      <SummaryStrip className="mb-8">
        <SummaryTile label="Awaiting review" value={queue.length} meaning="Your decision is the next step" tone="info" icon="clipboard" />
        <SummaryTile label="Survey reports" value={surveys} meaning="COPE-style risk surveys in the queue" tone="accent" icon="shield" />
        <SummaryTile label="Resubmissions" value={resubmissions} meaning="Previously returned — check your earlier comments" tone="warning" icon="refresh" />
        <SummaryTile label="Returned, not back yet" value={all.filter((j) => j.status === "Returned for correction").length} meaning="With assessors for correction" tone="warning" icon="pencil" />
      </SummaryStrip>

      {/* ---- Pending review ------------------------------------------------ */}
      {queue.length === 0 ? (
        <EmptyState icon="checkCircle" title="Review queue is empty">
          Nothing is waiting on you. Submitted reports arrive here with their
          version, author and submission time.
        </EmptyState>
      ) : (
        <Panel title="Pending review" subtitle="Oldest submission first" flush>
          <ul>
            {queue.map(({ job, latest, previouslyReturned }) => (
              <QueueRow key={job.id} job={job} latest={latest} previouslyReturned={previouslyReturned} />
            ))}
          </ul>
        </Panel>
      )}

      {/* ---- Team pipeline ------------------------------------------------- */}
      <h2 id="team-pipeline" className="mb-1 mt-10 scroll-mt-4 text-base font-semibold text-foreground">
        Team pipeline
      </h2>
      <p className="mb-3 text-sm text-muted">
        Where each assessor’s work currently sits. Counts come straight from job
        status — there are no productivity or quality scores in this prototype.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {assessors.map((a) => {
          const theirs = all.filter((j) => j.assessor_id === a.id);
          const open = theirs.filter((j) => OPEN_STATUSES.has(j.status));
          return (
            <Panel
              key={a.id}
              title={a.name}
              subtitle={`${open.length} open · ${theirs.length} total assigned`}
              flush
            >
              <dl className="divide-y divide-border">
                {STAGES.map((stage) => {
                  const inStage = theirs.filter((j) => stage.statuses.includes(j.status));
                  return (
                    <div key={stage.label} className="flex items-start gap-3 px-4 py-2.5">
                      <dt className="w-40 shrink-0 text-sm text-muted">{stage.label}</dt>
                      <dd className="min-w-0 flex-1">
                        {inStage.length === 0 ? (
                          <span className="text-sm text-muted-light">None</span>
                        ) : (
                          <ul className="flex flex-wrap gap-1.5">
                            {inStage.map((j) => (
                              <li key={j.id}>
                                <Link
                                  href={`/jobs/${j.id}`}
                                  className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-1.5 py-0.5 text-xs transition-colors hover:border-foreground"
                                >
                                  <span className="font-mono">{j.job_number}</span>
                                  {j.job_type === "survey" && <Icon name="shield" size={11} title="Risk survey" className="text-status-survey" />}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </dd>
                      <dd className="w-6 shrink-0 text-right text-sm font-semibold tnum text-foreground">
                        {inStage.length || <span className="font-normal text-muted-light">0</span>}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </Panel>
          );
        })}
        {assessors.length === 0 && (
          <EmptyState icon="users" title="No assessors on record" />
        )}
      </div>
    </StaffShell>
  );
}

function QueueRow({
  job, latest, previouslyReturned,
}: { job: JobRow; latest?: ReportRow; previouslyReturned: boolean }) {
  const isSurvey = job.job_type === "survey";
  return (
    <li className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/jobs/${job.id}/report/final`} className="font-medium tnum text-foreground hover:underline">
            {job.job_number}
          </Link>
          <Badge tone="ink">v{latest?.version ?? 1}</Badge>
          <JobTypeBadge jobType={job.job_type} />
          {previouslyReturned && <Badge tone="warning" icon="refresh">Resubmission</Badge>}
          <PriorityBadge priority={job.priority} />
        </div>

        <p className="mt-1.5 text-sm text-foreground">
          {jobTypeLabel(job)}{isSurvey ? " — survey report" : ""}
        </p>
        <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
          <div className="flex gap-1">
            <dt className="text-muted-light">Client</dt>
            <dd>{job.client_name}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-muted-light">Prepared by</dt>
            <dd>{job.assessor_name ?? "—"}</dd>
          </div>
          {latest?.submitted_at && (
            <div className="flex gap-1">
              <dt className="text-muted-light">Submitted</dt>
              <dd>
                <span className="tnum">{formatDateTime(latest.submitted_at)}</span>
                <span className="text-muted-light"> · {formatRelative(latest.submitted_at)}</span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={job.status} />
        <LinkButton href={`/jobs/${job.id}/report/final`} variant="primary" size="sm" icon="eye">
          Review
        </LinkButton>
      </div>
    </li>
  );
}
