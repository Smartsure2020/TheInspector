import Link from "next/link";
import { Fragment } from "react";
import { StaffShell } from "@/components/Chrome";
import { ReportEditor } from "@/components/ReportEditor";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, EmptyState, InlineAlert, JobTypeBadge, LinkButton, PageHeader, Panel, StatusBadge,
} from "@/components/ui/primitives";
import { getJob, listReports, userNameMap } from "@/lib/data";
import { buildReportModel, initialNarrative } from "@/lib/report";
import { formatDateTime, formatRelative } from "@/lib/format";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VERSION_TONE: Record<string, "success" | "danger" | "neutral" | "info"> = {
  approved: "success",
  returned: "danger",
  draft: "neutral",
  submitted: "info",
};

export default async function ReportBuilder({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return (
      <StaffShell title="Report" user={user}>
        <EmptyState icon="search" title="We can’t find that job" />
      </StaffShell>
    );
  }

  const model = (await buildReportModel(id))!;
  const reports = await listReports(id);
  const names = await userNameMap();
  const rn = (uid: string | null) => (uid ? names[uid] ?? uid : "—");
  for (const r of reports) {
    if (r.submitted_by) r.submitted_by = rn(r.submitted_by);
    if (r.reviewed_by) r.reviewed_by = rn(r.reviewed_by);
  }
  const latest = reports.at(-1);
  const { narrative } = await initialNarrative(id, model);
  const isSurvey = model.jobType === "survey";

  const canSubmit = job.status === "Awaiting report" || job.status === "Returned for correction";
  const readOnly = job.status === "Report completed" || job.status === "Report submitted" || job.status === "Cancelled";
  const returnedComments =
    latest?.status === "returned" && latest.review_comments
      ? (Object.values(JSON.parse(latest.review_comments)) as string[]).join("\n")
      : undefined;

  return (
    <StaffShell title={`Report builder — ${job.job_number}`} user={user}>
      <PageHeader
        trail={[{ label: job.job_number, href: `/jobs/${id}` }, { label: "Report" }]}
        title="Report builder"
        lede={isSurvey
          ? "Write the survey narrative. Particulars, limitations, the evidence index and sign-off are generated from the record."
          : "Write the assessment narrative. Particulars, limitations, the evidence index and sign-off are generated from the record."}
        meta={
          <>
            <StatusBadge status={job.status} />
            <JobTypeBadge jobType={job.job_type} />
            {latest && <Badge tone={VERSION_TONE[latest.status] ?? "neutral"} icon="document">v{latest.version} · {latest.status}</Badge>}
          </>
        }
        actions={
          <>
            <LinkButton href={`/jobs/${id}/evidence`} variant="secondary" icon="images">Evidence</LinkButton>
            <LinkButton href={`/jobs/${id}/report/final`} variant="secondary" icon="eye">View report page</LinkButton>
          </>
        }
      />

      {/* ---- Status framing ------------------------------------------------ */}
      {!canSubmit && !readOnly && (
        <InlineAlert tone="warning" className="mb-5" title={`Submit unlocks at status “Awaiting report” — currently ${job.status}`}>
          You can draft the narrative now; it saves as a draft version. The submit
          button appears once the session has ended with evidence complete.
        </InlineAlert>
      )}
      {job.status === "Report submitted" && (
        <InlineAlert
          tone="info"
          className="mb-5"
          title={`Version ${latest?.version} is with the manager`}
          actions={<LinkButton href={`/jobs/${id}/report/final`} variant="secondary" size="sm" icon="eye">Open the submitted report</LinkButton>}
        >
          Editing reopens only if the manager returns it with comments.
        </InlineAlert>
      )}
      {job.status === "Report completed" && (
        <InlineAlert
          tone="success"
          className="mb-5"
          title="Approved and locked"
          actions={<LinkButton href={`/jobs/${id}/report/final`} variant="secondary" size="sm" icon="eye">Open the approved report</LinkButton>}
        >
          The manager approved this report, which locks the job. Nothing further
          can be edited here.
        </InlineAlert>
      )}
      {job.status === "Cancelled" && (
        <InlineAlert tone="locked" className="mb-5" title="This job was cancelled">
          The report is read-only.
        </InlineAlert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Editable narrative ---------------------------------------- */}
        <div className="min-w-0">
          <ReportEditor
            jobId={id}
            sections={model.sections.map((s) => ({ key: s.key, title: s.title }))}
            initial={{ ...narrative }}
            canSubmit={canSubmit}
            submitLabel={job.status === "Returned for correction" ? "Resubmit for review" : "Submit for review"}
            returnedComments={returnedComments}
            readOnly={readOnly}
          />

          {reports.length > 0 && (
            <Panel title="Version history" subtitle={`${reports.length} version${reports.length === 1 ? "" : "s"}`} className="mt-6" flush>
              <ul className="divide-y divide-border">
                {reports.map((r) => (
                  <li key={r.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tnum text-foreground">v{r.version}</span>
                      <Badge tone={VERSION_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                      {r.submitted_at && (
                        <span className="text-xs text-muted">
                          submitted <span className="tnum">{formatDateTime(r.submitted_at)}</span> by {r.submitted_by}
                        </span>
                      )}
                      {r.reviewed_by && <span className="text-xs text-muted">· reviewed by {r.reviewed_by}</span>}
                    </div>
                    {r.status === "returned" && r.review_comments && (
                      <p className="mt-1 text-sm text-status-error">
                        “{(Object.values(JSON.parse(r.review_comments)) as string[]).join(" ")}”
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* ---- Generated content (never editable) ------------------------ */}
        <div className="min-w-0 lg:sticky lg:top-2 lg:self-start">
          <section className="rounded-lg border border-border bg-background shadow-1">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon name="lock" size={15} className="text-muted" />
                Generated by the system
              </h2>
              <p className="mt-1 text-xs text-muted">
                Rebuilt from the job record every time the report is opened. Not
                editable here or anywhere else.
              </p>
            </div>

            <div className="p-4">
              {/* Cover */}
              <div className="border-b-2 border-foreground pb-4 text-center">
                <p className="eyebrow">Acorn — placeholder branding · prototype output only</p>
                <h3 className="mt-2 text-base font-semibold text-foreground">{model.docTitle}</h3>
                <p className="mt-1 font-mono text-xs text-muted">
                  {model.cover.claimNumber} · {model.cover.clientName}
                </p>
                <p className="font-mono text-xs text-muted-light">
                  {model.cover.templateName} v{model.cover.templateVersion} · {model.cover.jobNumber}
                </p>
              </div>

              <AutoSection title={isSurvey ? "Survey particulars" : "Claim particulars"}>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {model.particulars.map(([k, v]) => (
                    <Fragment key={k}>
                      <dt className="text-muted-light">{k}</dt>
                      <dd className="text-foreground">{v}</dd>
                    </Fragment>
                  ))}
                </dl>
              </AutoSection>

              <AutoSection
                title="Featured evidence → report figures"
                note={
                  <>
                    Chosen in the{" "}
                    <Link href={`/jobs/${id}/evidence`} className="text-accent underline">evidence gallery</Link>
                  </>
                }
              >
                {model.featured.length === 0 ? (
                  <p className="text-sm text-muted">
                    No figures selected yet — feature items in the{" "}
                    <Link href={`/jobs/${id}/evidence`} className="text-accent underline">gallery</Link>{" "}
                    and they appear here numbered.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {model.featured.map((e, i) => (
                      <figure key={e.id}>
                        {e.hasFile ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/files/${e.id}`} alt={e.label} className="h-20 w-full rounded-sm border border-border object-cover" />
                        ) : (
                          <div
                            className="h-20 rounded-sm border border-border"
                            style={{ background: `linear-gradient(135deg, hsl(${e.hue ?? 200} 14% 68%), hsl(${e.hue ?? 200} 16% 38%))` }}
                          />
                        )}
                        <figcaption className="mt-0.5 truncate text-xs text-muted">Fig {i + 1} — {e.label}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </AutoSection>

              <AutoSection
                title={isSurvey ? "Survey limitations" : "Limitations & outstanding items"}
                badge="Non-removable"
              >
                <ul className="ml-4 list-disc space-y-1 text-xs text-foreground">
                  {model.limitations.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Generated from what actually happened on the job. It cannot be
                  edited, softened or removed — that is deliberate.
                </p>
              </AutoSection>

              <AutoSection title="Evidence index" note={`${model.evidenceIndex.length} items`}>
                <p className="text-xs text-muted">
                  Every evidence item is indexed with its section, checklist item and
                  timestamp. The full table renders on the report page.
                </p>
              </AutoSection>

              <AutoSection title="Sign-off" last>
                <dl className="space-y-1 text-xs">
                  <div className="flex gap-2">
                    <dt className="text-muted-light">{isSurvey ? "Surveyor" : "Assessor"}</dt>
                    <dd className="text-foreground">{model.cover.assessorName}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-light">Reviewed by</dt>
                    <dd className="text-foreground">
                      {latest?.reviewed_by ?? <span className="text-muted">pending manager review</span>}
                    </dd>
                  </div>
                  {latest?.submitted_at && (
                    <div className="flex gap-2">
                      <dt className="text-muted-light">Submitted</dt>
                      <dd className="text-foreground tnum">
                        {formatDateTime(latest.submitted_at)} · {formatRelative(latest.submitted_at)}
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="mt-2 text-xs text-muted">
                  Prototype output — pending assessor sign-off. Not a production
                  document and not digitally signed.
                </p>
              </AutoSection>
            </div>
          </section>
        </div>
      </div>
    </StaffShell>
  );
}

function AutoSection({
  title, badge, note, children, last = false,
}: { title: string; badge?: string; note?: React.ReactNode; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? "pt-4" : "border-b border-border py-4"}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="flex items-center gap-1.5">
          {note && <span className="text-xs text-muted-light">{note}</span>}
          <span className="inline-flex items-center gap-1 rounded-sm border border-border-strong bg-surface px-1.5 py-0.5 text-xs font-medium text-muted">
            <Icon name="lock" size={10} />
            Auto{badge ? ` — ${badge}` : ""}
          </span>
        </span>
      </div>
      {children}
    </section>
  );
}
