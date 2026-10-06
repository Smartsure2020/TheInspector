import { StaffShell } from "@/components/Chrome";
import { EvidenceCard, ItemOption } from "@/components/EvidenceTools";
import { Icon } from "@/components/ui/Icon";
import {
  Badge, EmptyState, InlineAlert, LinkButton, LockedBadge, PageHeader, Panel,
  ProgressBar, SummaryStrip, SummaryTile,
} from "@/components/ui/primitives";
import { getJob, getTemplate, listEvidence, missingItems, templateItemByKey } from "@/lib/data";
import { isLockedStatus } from "@/lib/format";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EvidenceGallery({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return (
      <StaffShell title="Evidence" user={user}>
        <EmptyState icon="search" title="We can’t find that job" />
      </StaffShell>
    );
  }

  const tpl = (await getTemplate(job.template_id))!;
  const items = await listEvidence(id);
  const unfiled = items.filter((e) => !e.item_key);
  const missing = await missingItems(id);
  const locked = isLockedStatus(job.status);
  const featuredCount = items.filter((e) => e.is_featured).length;
  const hiResCount = items.filter((e) => e.kind === "highres_client_photo").length;
  const uploadCount = items.filter((e) => e.kind === "client_upload").length;

  const itemOptions: ItemOption[] = tpl.sections.flatMap((s) =>
    s.items.map((i) => ({ key: i.key, label: i.prompt.slice(0, 60), group: s.title })),
  );

  /** Resolve where each filed item sits, so cards can say it in words. */
  const filedTo = (key: string | null) => {
    if (!key) return undefined;
    const found = templateItemByKey(tpl.sections, key);
    return found
      ? { section: found.section.title, prompt: found.item.prompt, highRes: found.item.highRes }
      : { section: "Unknown section", prompt: key };
  };

  const requiredItems = tpl.sections.flatMap((s) => s.items).filter((i) => i.evidenceRequired);
  const covered = requiredItems.filter((i) => items.some((e) => e.item_key === i.key)).length;

  return (
    <StaffShell title={`Evidence — ${job.job_number}`} user={user}>
      <PageHeader
        trail={[{ label: job.job_number, href: `/jobs/${id}` }, { label: "Evidence" }]}
        title="Evidence gallery"
        lede="Everything captured or uploaded for this job. Filing decides where evidence appears in the report; featuring decides which items become figures."
        meta={
          <>
            <Badge tone="neutral" icon="images">{items.length} items</Badge>
            <Badge tone="accent" icon="starFilled">{featuredCount} featured as figures</Badge>
            {locked && <LockedBadge status={job.status} />}
          </>
        }
        actions={
          <>
            <LinkButton href={`/jobs/${id}`} variant="secondary" icon="chevronLeft">Back to job</LinkButton>
            <LinkButton href={`/jobs/${id}/report`} variant="primary" icon="document">Report builder</LinkButton>
          </>
        }
      />

      {locked && (
        <InlineAlert tone="locked" className="mb-5" title={`Locked — ${job.status}`}>
          {job.status === "Report completed"
            ? "The manager approved the report, which locked this record. Evidence stays readable but labels, filing and figures can no longer change."
            : "The job was cancelled. Evidence stays readable but can no longer be changed."}
        </InlineAlert>
      )}

      <SummaryStrip className="mb-6">
        <SummaryTile label="Unfiled captures" value={unfiled.length} meaning="File these against a checklist item" href="#unfiled" tone="warning" icon="alert" />
        <SummaryTile label="Missing items" value={missing.length} meaning="Still outstanding from the client" href="#missing" tone="warning" icon="images" />
        <SummaryTile label="High-res photos" value={hiResCount} meaning="Client-taken detail shots" tone="info" icon="hires" />
        <SummaryTile label="Client uploads" value={uploadCount} meaning="Documents and photos sent afterwards" tone="accent" icon="upload" />
      </SummaryStrip>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          {/* ---- Work queue: unfiled first ------------------------------- */}
          {unfiled.length > 0 && (
            <section id="unfiled" className="mb-8 scroll-mt-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  <Icon name="alert" size={16} className="mr-1.5 inline align-[-3px] text-status-warning" />
                  Unfiled captures
                  <span className="ml-1.5 tnum font-normal text-muted">({unfiled.length})</span>
                </h2>
              </div>
              <InlineAlert tone="warning" className="mb-3" title="File these before the report is submitted">
                Unfiled evidence still appears in the evidence index, but it is not
                attached to a checklist item — so it cannot become a report figure
                in the right place. Use “Filed against” on each card.
              </InlineAlert>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {unfiled.map((e) => (
                  <EvidenceCard key={e.id} jobId={id} evidence={e} itemOptions={itemOptions} locked={locked} />
                ))}
              </div>
            </section>
          )}

          {/* ---- Filed evidence, by checklist section ------------------- */}
          {tpl.sections.map((s) => {
            const inSection = items.filter((e) => e.item_key && s.items.some((i) => i.key === e.item_key));
            if (inSection.length === 0) return null;
            return (
              <section key={s.key} className="mb-8">
                <h2 className="mb-3 text-base font-semibold text-foreground">
                  {s.title}
                  <span className="ml-1.5 tnum font-normal text-muted">({inSection.length})</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {inSection.map((e) => (
                    <EvidenceCard
                      key={e.id}
                      jobId={id}
                      evidence={e}
                      itemOptions={itemOptions}
                      filedTo={filedTo(e.item_key)}
                      locked={locked}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {items.length === 0 && (
            <EmptyState
              icon="images"
              title="No evidence on this job yet"
              actions={<LinkButton href={`/jobs/${id}/room`} variant="secondary" icon="video">Open the live room</LinkButton>}
            >
              Captures land here live from the assessment room, and client uploads
              appear as soon as they are sent.
            </EmptyState>
          )}
        </div>

        {/* ---- Side rail ------------------------------------------------- */}
        <aside className="space-y-4 lg:sticky lg:top-2 lg:self-start">
          <Panel title="Required-photo coverage">
            <ProgressBar
              value={covered}
              max={requiredItems.length}
              label="items with at least one photo"
            />
            <p className="mt-2 text-xs text-muted">
              Counts checklist items that the template marks as needing evidence.
            </p>
          </Panel>

          <Panel
            title={<span id="missing" className="scroll-mt-4">Missing evidence</span>}
            subtitle={missing.length ? `${missing.length} outstanding` : undefined}
            tone={missing.length ? "warning" : undefined}
          >
            {missing.length ? (
              <>
                <ul className="space-y-2">
                  {missing.map((m) => (
                    <li key={m.item_key} className="rounded-md border border-status-warning-line bg-status-warning-bg px-2.5 py-2">
                      <p className="text-sm text-foreground">
                        {templateItemByKey(tpl.sections, m.item_key)?.item.prompt ?? m.item_key}
                      </p>
                      {m.missing_reason && (
                        <p className="mt-0.5 text-xs text-status-warning">Reason: {m.missing_reason}</p>
                      )}
                    </li>
                  ))}
                </ul>
                {job.link_token && (
                  <LinkButton href={`/c/${job.link_token}/upload`} variant="secondary" size="sm" className="mt-3 w-full" icon="eye">
                    Preview the client upload page
                  </LinkButton>
                )}
                <p className="mt-2 text-xs text-muted">
                  Uploads arriving against these items clear them automatically and
                  appear above tagged as client uploads.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Nothing is flagged as missing on this job.</p>
            )}
          </Panel>

          <Panel title="Report and pack">
            <p className="text-sm text-muted">
              Featured items become numbered figures in the report. Everything
              else still appears in the evidence index.
            </p>
            <div className="mt-3 space-y-2">
              <LinkButton href={`/jobs/${id}/report`} variant="primary" className="w-full" icon="document">
                Open report builder
              </LinkButton>
              <a
                href={`/api/pack/${id}`}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-background px-3.5 text-sm font-medium transition-colors hover:bg-surface"
              >
                <Icon name="download" size={15} />
                Download evidence pack (.zip)
              </a>
            </div>
            <p className="mt-2 text-xs text-muted">
              The pack contains an index CSV plus the files. Seeded demo items have
              no image file and are annotated honestly in the index.
            </p>
          </Panel>
        </aside>
      </div>
    </StaffShell>
  );
}
