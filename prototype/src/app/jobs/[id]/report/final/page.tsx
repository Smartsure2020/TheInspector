// S16 — Rendered report page (Chunk 1E, variants in 1F): full document from
// the latest version's snapshot (live model preview if nothing submitted yet),
// version history, manager review actions, evidence pack + print downloads.
// Two variants share the pipeline: claims assessment report and survey report
// (no cause-of-loss; COPE findings, recommendations register, risk grading).
// PROTOTYPE OUTPUT ONLY — placeholder branding, print = browser print.
import Link from "next/link";
import { Fragment } from "react";
import { StaffShell, StatusChip } from "@/components/Chrome";
import { ManagerReview } from "@/components/ManagerReview";
import { PrintButton } from "@/components/PrintButton";
import { getJob, listReports } from "@/lib/data";
import { buildReportModel, parseContent, ReportContent } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function CompletedReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return <StaffShell title="Report"><p className="text-sm text-slate-500">Unknown job.</p></StaffShell>;
  const reports = listReports(id);
  const latest = reports.filter((r) => r.status !== "draft").at(-1);
  const model = buildReportModel(id)!;
  const isSurvey = model.jobType === "survey";

  // Submitted/approved versions render their locked snapshot; otherwise live preview.
  const content: ReportContent | undefined = latest ? parseContent(latest.content) : undefined;
  const narrative = { ...model.prefill, ...(content?.narrative ?? {}) };
  const auto = content?.auto ?? { cover: model.cover, particulars: model.particulars, limitations: model.limitations, evidenceIndex: model.evidenceIndex, stats: model.stats };
  const isSnapshot = !!content?.auto;

  const figures = model.featured.length > 0 && (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {model.featured.map((e, i) => (
        <figure key={e.id}>
          {e.hasFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${e.id}`} alt={e.label} className="w-full max-h-56 object-cover rounded-md border border-slate-200" />
          ) : (
            <div className="h-40 rounded-md" style={{ background: `linear-gradient(135deg, hsl(${e.hue ?? 200} 45% 55%), hsl(${e.hue ?? 200} 45% 30%))` }} />
          )}
          <figcaption className="text-[10px] text-slate-500 mt-1">Figure {i + 1} — {e.label}</figcaption>
        </figure>
      ))}
    </div>
  );

  const particularsBlock = (
    <dl className="grid grid-cols-[180px_1fr] gap-y-1 text-xs">
      {auto.particulars.map(([k, v]) => (<Fragment key={k}><dt className="text-slate-400">{k}</dt><dd className="text-slate-700">{v}</dd></Fragment>))}
    </dl>
  );
  const limitationsBlock = (
    <ul className="list-disc ml-5 space-y-1 text-xs">
      {auto.limitations.map((l, i) => <li key={i}>{l}</li>)}
    </ul>
  );
  const evidenceIndexBlock = (
    <table className="w-full text-[10px] text-slate-600">
      <thead>
        <tr className="text-left text-slate-400 border-b border-slate-200">
          <th className="py-1 pr-2">Fig</th><th className="pr-2">Label</th><th className="pr-2">Kind</th>
          <th className="pr-2">Section</th><th className="pr-2">Captured</th><th>In report</th>
        </tr>
      </thead>
      <tbody>
        {auto.evidenceIndex.map((r) => (
          <tr key={r.id} className="border-b border-slate-50">
            <td className="py-1 pr-2">{r.fig}</td><td className="pr-2">{r.label}</td><td className="pr-2">{r.kind}</td>
            <td className="pr-2">{r.section}</td><td className="pr-2">{r.capturedAt.slice(0, 16)}</td><td>{r.featured ? "★" : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const text = (key: string) => <p className="whitespace-pre-wrap">{narrative[key]}</p>;

  // Ordered document blocks per variant. Survey reports have NO cause-of-loss
  // section (phase 05-survey §5.4); limitations carry virtual-survey wording.
  const blocks: { title: string; badge?: string; body: React.ReactNode }[] = isSurvey
    ? [
        { title: "Risk description", body: text("riskDescription") },
        { title: "Survey particulars", body: particularsBlock },
        { title: "COPE findings", body: <>{text("copeFindings")}{figures}</> },
        { title: "Recommendations register", body: text("recommendations") },
        { title: "Risk grading", body: text("grading") },
        { title: "Survey limitations", badge: "AUTO — non-removable", body: limitationsBlock },
        { title: `Evidence index (${auto.evidenceIndex.length} items)`, body: evidenceIndexBlock },
      ]
    : [
        { title: "Summary", body: text("summary") },
        { title: "Claim particulars", body: particularsBlock },
        { title: "Circumstances of loss", body: text("circumstances") },
        { title: "Assessment findings", body: <>{text("findings")}{figures}</> },
        { title: "Cause of loss & comment", body: text("cause") },
        { title: "Limitations & outstanding items", badge: "AUTO — non-removable", body: limitationsBlock },
        { title: "Conclusion & recommendation", body: text("conclusion") },
        { title: `Evidence index (${auto.evidenceIndex.length} items)`, body: evidenceIndexBlock },
      ];

  return (
    <StaffShell title={`Report — ${job.job_number}`}>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-4 print:hidden">
          <h1 className="text-xl font-semibold text-slate-800">
            {latest ? `Report v${latest.version} (${latest.status})` : "Report preview (nothing submitted yet)"}
          </h1>
          <StatusChip status={job.status} />
          <span className="ml-auto flex gap-2">
            <PrintButton />
            <a href={`/api/pack/${id}`} className="bg-white border border-slate-300 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
              Evidence pack (.zip)
            </a>
            <Link href={`/jobs/${id}/report`} className="bg-white border border-slate-300 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
              Builder
            </Link>
          </span>
        </div>

        <div className="mb-4 print:hidden">
          <ManagerReview jobId={id} jobStatus={job.status} version={latest?.version} />
        </div>

        {/* ---- The document ---- */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-8 text-sm print:border-0 print:shadow-none">
          {/* Cover */}
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
            <div className="text-[10px] tracking-widest text-slate-400">ACORN — PLACEHOLDER BRANDING · PROTOTYPE OUTPUT ONLY · DEMO DATA</div>
            <h2 className="text-2xl font-bold text-slate-800 mt-2">{model.docTitle}</h2>
            <p className="text-sm text-slate-600 mt-2">{auto.cover.claimNumber} — {auto.cover.clientName}</p>
            <p className="text-xs text-slate-500 mt-1">{auto.cover.templateName} (checklist v{auto.cover.templateVersion}) · Job {auto.cover.jobNumber}</p>
            <p className="text-xs text-slate-500">
              {isSurvey ? `Surveyor ${auto.cover.assessorName}` : `Date of loss ${auto.cover.dateOfLoss} · Assessor ${auto.cover.assessorName}`}
            </p>
            {latest?.submitted_at && <p className="text-[10px] text-slate-400 mt-2">v{latest.version} submitted {latest.submitted_at} by {latest.submitted_by}{latest.reviewed_by ? ` · reviewed ${latest.reviewed_at} by ${latest.reviewed_by}` : ""}</p>}
            {!isSnapshot && <p className="text-[10px] text-amber-600 mt-2">LIVE PREVIEW — content locks when the report is submitted</p>}
          </div>

          {blocks.map((b, i) => (
            <ReportSection key={b.title} title={`${i + 1}. ${b.title}`} badge={b.badge}>{b.body}</ReportSection>
          ))}

          {/* Sign-off */}
          <div className="border-t-2 border-slate-800 pt-4 mt-6 grid grid-cols-2 gap-6 text-xs text-slate-600">
            <div>
              <p className="font-semibold">{isSurvey ? "Surveyor" : "Assessor"}</p>
              <p>{auto.cover.assessorName}</p>
              <p className="text-slate-400">{latest?.submitted_at ? `Submitted ${latest.submitted_at}` : "Not yet submitted"}</p>
            </div>
            <div>
              <p className="font-semibold">Reviewed by</p>
              <p>{latest?.reviewed_by ?? "—"}</p>
              <p className="text-slate-400">{latest?.status === "approved" ? `Approved ${latest.reviewed_at}` : latest?.status === "returned" ? `Returned ${latest.reviewed_at}` : "Pending review"}</p>
            </div>
          </div>
          <p className="text-[9px] text-slate-300 mt-4 text-center">PROTOTYPE — placeholder branding · demo/anonymised data only · not a production document</p>
        </div>

        {/* Version history */}
        {reports.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4 print:hidden">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Version history</h2>
            {reports.map((r) => (
              <div key={r.id} className="text-xs text-slate-600 flex flex-wrap gap-2 py-1 border-b border-slate-50 last:border-0">
                <span className="font-medium">v{r.version}</span>
                <span className={`rounded-full px-2 ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "returned" ? "bg-rose-100 text-rose-800" : r.status === "draft" ? "bg-slate-100 text-slate-500" : "bg-violet-100 text-violet-800"}`}>{r.status}</span>
                {r.submitted_at && <span>submitted {r.submitted_at} by {r.submitted_by}</span>}
                {r.reviewed_by && <span>· {r.status} by {r.reviewed_by} {r.reviewed_at}</span>}
                {r.review_comments && <span className="text-rose-600">· “{(Object.values(JSON.parse(r.review_comments)) as string[]).join(" ")}”</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffShell>
  );
}

function ReportSection({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1 mb-2">
        {title}
        {badge && <span className="ml-2 text-[9px] font-normal bg-slate-800 text-white rounded px-1.5 py-0.5 align-middle">{badge}</span>}
      </h3>
      <div className="text-xs text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}
