import { Fragment } from "react";
import { StaffShell } from "@/components/Chrome";
import { ManagerReview } from "@/components/ManagerReview";
import { PrintButton } from "@/components/PrintButton";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, DataTable, EmptyState, InlineAlert, JobTypeBadge, LinkButton, LockedBadge,
  PageHeader, Panel, StatusBadge, Td, Th, Tr,
} from "@/components/ui/primitives";
import { getJob, listReports, userNameMap } from "@/lib/data";
import { buildReportModel, parseContent, ReportContent } from "@/lib/report";
import { formatDateTime, formatRelative, isLockedStatus } from "@/lib/format";
import { requireSession } from "@/lib/auth";
import { SessionProvider } from "@/lib/session-context";

export const dynamic = "force-dynamic";

const VERSION_TONE: Record<string, "success" | "danger" | "neutral" | "info"> = {
  approved: "success",
  returned: "danger",
  draft: "neutral",
  submitted: "info",
};

export default async function CompletedReport({ params }: { params: Promise<{ id: string }> }) {
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

  const reports = await listReports(id);
  const names = await userNameMap();
  const rn = (uid: string | null) => (uid ? names[uid] ?? uid : "—");
  for (const r of reports) {
    if (r.submitted_by) r.submitted_by = rn(r.submitted_by);
    if (r.reviewed_by) r.reviewed_by = rn(r.reviewed_by);
  }
  const latest = reports.filter((r) => r.status !== "draft").at(-1);
  const model = (await buildReportModel(id))!;
  const isSurvey = model.jobType === "survey";
  const locked = isLockedStatus(job.status);

  const content: ReportContent | undefined = latest ? parseContent(latest.content) : undefined;
  const narrative = { ...model.prefill, ...(content?.narrative ?? {}) };
  const auto = content?.auto ?? {
    cover: model.cover, particulars: model.particulars, limitations: model.limitations,
    evidenceIndex: model.evidenceIndex, stats: model.stats,
  };
  const isSnapshot = !!content?.auto;

  const figures = model.featured.length > 0 && (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {model.featured.map((e, i) => (
        <figure key={e.id} className="print-keep">
          {e.hasFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${e.id}`} alt={e.label} className="max-h-56 w-full rounded-sm border border-border object-cover" />
          ) : (
            <div
              className="h-40 rounded-sm border border-border"
              style={{ background: `linear-gradient(135deg, hsl(${e.hue ?? 200} 14% 68%), hsl(${e.hue ?? 200} 16% 38%))` }}
            />
          )}
          <figcaption className="mt-1.5 text-xs text-muted">
            <span className="font-semibold text-foreground">Figure {i + 1}</span> — {e.label}
          </figcaption>
        </figure>
      ))}
    </div>
  );

  const particularsBlock = (
    <dl className="grid gap-y-1.5 text-sm sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
      {auto.particulars.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-muted">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </Fragment>
      ))}
    </dl>
  );

  const limitationsBlock = (
    <ul className="ml-5 list-disc space-y-1.5 text-sm text-foreground">
      {auto.limitations.map((l, i) => <li key={i}>{l}</li>)}
    </ul>
  );

  const evidenceIndexBlock = (
    <DataTable caption="Evidence index" minWidth="38rem" className="mt-1 shadow-none">
      <thead>
        <tr>
          <Th width="3rem">Fig</Th>
          <Th>Label</Th>
          <Th className="hidden sm:table-cell">Source</Th>
          <Th className="hidden md:table-cell">Section</Th>
          <Th>Captured</Th>
          <Th align="right">In report</Th>
        </tr>
      </thead>
      <tbody>
        {auto.evidenceIndex.map((r) => (
          <Tr key={r.id}>
            <Td className="tnum font-semibold">{r.fig}</Td>
            <Td className="text-sm">{r.label}</Td>
            <Td className="hidden sm:table-cell text-sm text-muted">{r.kind}</Td>
            <Td className="hidden md:table-cell text-sm text-muted">{r.section}</Td>
            <Td className="text-sm text-muted tnum">{formatDateTime(r.capturedAt)}</Td>
            <Td align="right">{r.featured ? <Badge tone="accent" icon="starFilled">Figure</Badge> : <span className="text-sm text-muted-light">Index only</span>}</Td>
          </Tr>
        ))}
      </tbody>
    </DataTable>
  );

  const text = (key: string) => <p className="whitespace-pre-wrap leading-relaxed text-foreground">{narrative[key]}</p>;

  const blocks: { title: string; badge?: string; body: React.ReactNode }[] = isSurvey
    ? [
        { title: "Risk description", body: text("riskDescription") },
        { title: "Survey particulars", badge: "Generated", body: particularsBlock },
        { title: "COPE findings", body: <>{text("copeFindings")}{figures}</> },
        { title: "Recommendations register", body: text("recommendations") },
        { title: "Risk grading", body: text("grading") },
        { title: "Survey limitations", badge: "Generated — non-removable", body: limitationsBlock },
        { title: `Evidence index (${auto.evidenceIndex.length} items)`, badge: "Generated", body: evidenceIndexBlock },
      ]
    : [
        { title: "Summary", body: text("summary") },
        { title: "Claim particulars", badge: "Generated", body: particularsBlock },
        { title: "Circumstances of loss", body: text("circumstances") },
        { title: "Assessment findings", body: <>{text("findings")}{figures}</> },
        { title: "Cause of loss & comment", body: text("cause") },
        { title: "Limitations & outstanding items", badge: "Generated — non-removable", body: limitationsBlock },
        { title: "Conclusion & recommendation", body: text("conclusion") },
        { title: `Evidence index (${auto.evidenceIndex.length} items)`, badge: "Generated", body: evidenceIndexBlock },
      ];

  return (
    <StaffShell title={`Report — ${job.job_number}`} user={user}>
      <SessionProvider user={user}>
        <div className="mx-auto max-w-4xl">
          <div className="no-print">
            <PageHeader
              trail={[{ label: job.job_number, href: `/jobs/${id}` }, { label: "Report" }]}
              title={latest ? `Report v${latest.version}` : "Report preview"}
              lede={latest
                ? "The submitted version, exactly as the manager reviews it."
                : "Nothing has been submitted yet — this is a live preview built from the current record."}
              meta={
                <>
                  <StatusBadge status={job.status} />
                  <JobTypeBadge jobType={job.job_type} />
                  {latest && <Badge tone={VERSION_TONE[latest.status] ?? "neutral"} icon="document">{latest.status}</Badge>}
                  {locked && <LockedBadge status={job.status} />}
                </>
              }
              actions={
                <>
                  <PrintButton />
                  <a
                    href={`/api/pack/${id}`}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-background px-3.5 text-sm font-medium transition-colors hover:bg-surface"
                  >
                    <Icon name="download" size={15} />
                    Evidence pack (.zip)
                  </a>
                  <LinkButton href={`/jobs/${id}/report`} variant="secondary" icon="pencil">Builder</LinkButton>
                </>
              }
            />

            <div className="mb-5">
              <ManagerReview
                jobId={id}
                jobStatus={job.status}
                version={latest?.version}
                preparedBy={latest?.submitted_by ?? undefined}
              />
            </div>

            {!isSnapshot && (
              <InlineAlert tone="warning" className="mb-5" title="Live preview — not a submitted version">
                Generated sections update as the record changes. Content is frozen
                into a snapshot the moment the report is submitted.
              </InlineAlert>
            )}

            {locked && (
              <InlineAlert tone="locked" className="mb-5" title={`Locked — ${job.status}`}>
                {job.status === "Report completed"
                  ? "Manager approval locked this record. This version is the approved final report."
                  : "The job was cancelled; the report is retained read-only."}
              </InlineAlert>
            )}

            <InlineAlert tone="neutral" className="mb-5" title="About the PDF">
              “Print / save as PDF” uses your browser’s own print engine. There is
              no letterhead, no page-break control and no digital signature — a
              server-generated PDF is production work, not part of this prototype.
            </InlineAlert>
          </div>

          {/* ================= The document ================================ */}
          <article className="print-block rounded-lg border border-border bg-background p-6 shadow-1 sm:p-9 print:rounded-none print:border-0 print:p-0 print:shadow-none">
            {/* Cover */}
            <header className="border-b-2 border-foreground pb-6 text-center">
              <p className="eyebrow">Acorn — placeholder branding · prototype output only · demo data</p>
              {/* The page's single h1 is the record identity in the header above;
                  the document title sits under it, with sections one level down. */}
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{model.docTitle}</h2>
              <div className="mx-auto mt-3 h-px w-16 bg-border-strong" />
              <p className="mt-3 text-base text-foreground">
                <span className="font-mono">{auto.cover.claimNumber}</span> — {auto.cover.clientName}
              </p>
              <p className="mt-1 text-sm text-muted">
                {auto.cover.templateName} (checklist v{auto.cover.templateVersion}) · Job{" "}
                <span className="font-mono">{auto.cover.jobNumber}</span>
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {isSurvey
                  ? `Surveyor ${auto.cover.assessorName}`
                  : `Date of loss ${auto.cover.dateOfLoss} · Assessor ${auto.cover.assessorName}`}
              </p>
              {latest?.submitted_at && (
                <p className="mt-3 text-xs text-muted tnum">
                  v{latest.version} submitted {formatDateTime(latest.submitted_at)} by {latest.submitted_by}
                  {latest.reviewed_by ? ` · reviewed ${formatDateTime(latest.reviewed_at)} by ${latest.reviewed_by}` : ""}
                </p>
              )}
              <p className="mt-3 text-xs font-semibold text-proto">
                PROTOTYPE OUTPUT — pending assessor sign-off
              </p>
            </header>

            {blocks.map((b, i) => (
              <section key={b.title} className="mt-7 first:mt-6">
                <h3 className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-foreground pb-1.5">
                  <span className="text-base font-semibold text-foreground">
                    <span className="mr-1.5 tnum text-muted">{i + 1}.</span>
                    {b.title}
                  </span>
                  {b.badge && (
                    <span className="shrink-0 rounded-sm border border-border-strong bg-surface px-1.5 py-0.5 text-xs font-medium text-muted">
                      {b.badge}
                    </span>
                  )}
                </h3>
                <div className="text-sm">{b.body}</div>
              </section>
            ))}

            {/* Sign-off */}
            <footer className="mt-9 border-t-2 border-foreground pt-5">
              <dl className="grid gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-muted">{isSurvey ? "Surveyor" : "Assessor"}</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{auto.cover.assessorName}</dd>
                  <dd className="text-xs text-muted tnum">
                    {latest?.submitted_at ? `Submitted ${formatDateTime(latest.submitted_at)}` : "Not yet submitted"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted">Reviewed by</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{latest?.reviewed_by ?? "—"}</dd>
                  <dd className="text-xs text-muted tnum">
                    {latest?.status === "approved" ? `Approved ${formatDateTime(latest.reviewed_at)}`
                      : latest?.status === "returned" ? `Returned ${formatDateTime(latest.reviewed_at)}`
                      : "Pending review"}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-center text-xs text-muted">
                PROTOTYPE — placeholder branding · demo / anonymised data only · not a
                production document · no digital signature
              </p>
            </footer>
          </article>

          {/* ---- Version history ------------------------------------------ */}
          {reports.length > 0 && (
            <Panel
              title="Version history"
              subtitle={`${reports.length} version${reports.length === 1 ? "" : "s"}`}
              className="mt-6 no-print"
              flush
            >
              <ul className="divide-y divide-border">
                {reports.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tnum text-foreground">v{r.version}</span>
                      <Badge tone={VERSION_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                      {r.submitted_at && (
                        <span className="text-xs text-muted">
                          submitted <span className="tnum">{formatDateTime(r.submitted_at)}</span>
                          {" "}({formatRelative(r.submitted_at)}) by {r.submitted_by}
                        </span>
                      )}
                      {r.reviewed_by && (
                        <span className="text-xs text-muted">
                          · {r.status} by {r.reviewed_by} <span className="tnum">{formatDateTime(r.reviewed_at)}</span>
                        </span>
                      )}
                    </div>
                    {r.review_comments && (
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
      </SessionProvider>
    </StaffShell>
  );
}
