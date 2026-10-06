import Link from "next/link";
import { StaffShell } from "@/components/Chrome";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, DataTable, EmptyState, JobTypeBadge, LinkButton, PageHeader, PriorityBadge,
  StatusBadge, SummaryStrip, SummaryTile, Td, Th, Tr,
} from "@/components/ui/primitives";
import { jobTypeLabel, listJobs } from "@/lib/data";
import { formatDateTime, STATUS_MEANING } from "@/lib/format";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUSES = [
  "New", "Assigned", "Scheduled", "In progress", "Awaiting evidence", "Awaiting report",
  "Report submitted", "Returned for correction", "Report completed", "Cancelled", "No-show",
];

const CLOSED = new Set(["Report completed", "Cancelled"]);

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireRole("admin");
  const { status } = await searchParams;
  const all = await listJobs();
  const filtered = status ? all.filter((j) => j.status === status) : all;
  const count = (s: string) => all.filter((j) => j.status === s).length;
  const activeCount = all.filter((j) => !CLOSED.has(j.status)).length;

  return (
    <StaffShell title="Assessment & survey pipeline" user={user} section="/admin">
      <PageHeader
        title="Assessment & survey pipeline"
        lede="The whole demo book. Start with the exceptions below — each one links to the jobs behind it."
        meta={
          <>
            <Badge tone="neutral" icon="list">{all.length} jobs in the book</Badge>
            <Badge tone="accent" icon="dot">{activeCount} still active</Badge>
          </>
        }
        actions={
          <>
            <LinkButton href="/admin/users" variant="secondary" icon="users">Manage users</LinkButton>
            <LinkButton href="/jobs/new" variant="primary" icon="plus">New job</LinkButton>
          </>
        }
      />

      {/* ---- Exceptions: real counts, operational meaning, direct route ---- */}
      <h2 className="sr-only">Exceptions needing attention</h2>
      <SummaryStrip className="mb-8">
        <SummaryTile
          label="Unassigned"
          value={count("New")}
          meaning="Needs an assessor before it can be booked"
          href="/admin?status=New"
          tone="danger"
          icon="user"
        />
        <SummaryTile
          label="No-shows"
          value={count("No-show")}
          meaning="Client did not attend — rebook or close"
          href="/admin?status=No-show"
          tone="danger"
          icon="alert"
        />
        <SummaryTile
          label="Awaiting evidence"
          value={count("Awaiting evidence")}
          meaning="Waiting on client uploads to finish the file"
          href="/admin?status=Awaiting+evidence"
          tone="warning"
          icon="images"
        />
        <SummaryTile
          label="In manager review"
          value={count("Report submitted")}
          meaning="Reports sitting in the review queue"
          href="/admin?status=Report+submitted"
          tone="info"
          icon="clipboard"
        />
      </SummaryStrip>

      {/* ---- Filter toolbar (scales past eleven statuses) ------------------ */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <form method="get" action="/admin" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-muted">
              Filter by status
            </label>
            <select id="status-filter" name="status" defaultValue={status ?? ""} className="min-w-[15rem]">
              <option value="">All statuses ({all.length})</option>
              {STATUSES.filter((s) => count(s) > 0).map((s) => (
                <option key={s} value={s}>{s} ({count(s)})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong bg-background px-3.5 text-sm font-medium transition-colors hover:bg-surface">
            <Icon name="filter" size={15} />
            Apply
          </button>
          {status && (
            <Link href="/admin" className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground">
              <Icon name="close" size={14} />
              Clear
            </Link>
          )}
        </form>

        <p className="text-sm text-muted" aria-live="polite">
          {status
            ? <>Showing <strong className="tnum text-foreground">{filtered.length}</strong> {status} · <span className="text-muted-light">{STATUS_MEANING[status]}</span></>
            : <>Showing all <strong className="tnum text-foreground">{all.length}</strong> jobs</>}
        </p>
      </div>

      {/* ---- The job book -------------------------------------------------- */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={`No jobs with status “${status}”`}
          actions={<LinkButton href="/admin" variant="secondary" icon="list">Show all jobs</LinkButton>}
        >
          Nothing in the book is currently at this status. Clear the filter to see
          the rest of the pipeline.
        </EmptyState>
      ) : (
        <DataTable caption="All assessment and survey jobs" minWidth="52rem">
          <thead>
            <tr>
              <Th>Job</Th>
              <Th className="hidden md:table-cell">Client</Th>
              <Th>Type</Th>
              <Th className="hidden lg:table-cell">Assessor</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Appointment</Th>
              <Th align="right"><span className="sr-only">Open</span></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <Tr key={j.id}>
                <Td>
                  <Link href={`/jobs/${j.id}`} className="font-medium tnum text-foreground hover:underline">
                    {j.job_number}
                  </Link>
                  <div className="mt-0.5 font-mono text-xs text-muted">{j.claim_number}</div>
                  {/* Client folds into the primary cell on small screens. */}
                  <div className="mt-0.5 text-xs text-muted md:hidden">{j.client_name}</div>
                </Td>
                <Td className="hidden md:table-cell">{j.client_name}</Td>
                <Td>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm">{jobTypeLabel(j)}</span>
                    <span className="flex flex-wrap gap-1">
                      <JobTypeBadge jobType={j.job_type} />
                      <PriorityBadge priority={j.priority} />
                    </span>
                  </div>
                </Td>
                <Td className="hidden lg:table-cell">
                  {j.assessor_name ?? <span className="text-status-error">Unassigned</span>}
                </Td>
                <Td><StatusBadge status={j.status} /></Td>
                <Td className="hidden sm:table-cell text-sm text-muted tnum">
                  {j.scheduled_start ? formatDateTime(j.scheduled_start) : "Not booked"}
                </Td>
                <Td align="right">
                  <Link
                    href={`/jobs/${j.id}`}
                    aria-label={`Open job ${j.job_number}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
                  >
                    Open <Icon name="chevronRight" size={13} />
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </StaffShell>
  );
}
