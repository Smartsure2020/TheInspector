// S14 — Missing-evidence upload page (Chunk 1C: real uploads, link states,
// per-item complete/incomplete from the DB).
// VISIBILITY RULE: client-facing names only — never raw checklist keys, never
// internal evidence metadata, never the assessor's reason wording.
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getTemplate, missingItems, templateItemByKey, uploadsByItem } from "@/lib/data";
import { RequestNewLinkButton } from "@/components/ClientBits";
import { UploadItem } from "@/components/UploadItem";
import { Icon } from "@/components/ui/Icon";
import { ClientCard, ClientOutcome, ClientStepHeader } from "@/components/ui/client";
import { checkOtpVerified } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

/** Plain-language names and reasons for the items clients are asked to send. */
const plainNames: Record<string, { label: string; why: string }> = {
  "gey.docs.plumber": { label: "Plumber’s invoice", why: "A photo of the invoice, or the PDF the plumber emailed you." },
  "gey.unit.plate": { label: "Photo of the sticker on the geyser", why: "The silver sticker or plate with the make, size and serial number." },
  "sto.docs.quotes": { label: "Repair quotes", why: "Any quote you’ve been given for the repairs — photo or PDF." },
  "sto.docs.photos": { label: "Your own photos from the day of the storm", why: "Anything you took at the time, before repairs started." },
  "thf.saps.case": { label: "SAPS case number", why: "A photo of the SMS or the case document from the police." },
  "thf.ownership.proof": { label: "Receipts or valuations for the stolen items", why: "Anything showing what the items were and what they were worth." },
  "srg.docs.technician": { label: "Technician or electrician report", why: "The report on what failed — photo or PDF." },
  "pip.docs.plumber": { label: "Plumber’s invoice", why: "A photo of the invoice, or the PDF the plumber emailed you." },
};

export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await checkOtpVerified(token))) redirect(`/c/${token}/verify`);
  const info = await resolveToken(token);

  if (info.state === "invalid" || !info.job)
    return (
      <ClientShell>
        <ClientOutcome icon="linkOff" title="This link isn't recognised">
          <p>Please use the most recent link we sent you.</p>
          <p className="mt-3 text-sm">If it still doesn’t work, contact your claims coordinator.</p>
        </ClientOutcome>
      </ClientShell>
    );

  if (info.state === "revoked" || info.state === "expired")
    return (
      <ClientShell>
        <ClientOutcome
          icon="linkOff"
          title={info.state === "expired" ? "This upload link has expired" : "This link has been replaced"}
          actions={<RequestNewLinkButton token={token} />}
        >
          <p>No problem — request a fresh link below and your coordinator will send one.</p>
        </ClientOutcome>
      </ClientShell>
    );

  const tpl = (await getTemplate(info.job.template_id))!;
  const uploads = await uploadsByItem(info.job.id);
  const missing = await missingItems(info.job.id);
  const items = missing.map((m) => {
    const plain = plainNames[m.item_key];
    return {
      key: m.item_key,
      label: plain?.label ?? templateItemByKey(tpl.sections, m.item_key)?.item.prompt ?? "Requested item",
      why: plain?.why,
      done: (uploads.get(m.item_key) ?? 0) > 0,
    };
  });
  const outstanding = items.filter((i) => !i.done).length;
  const allDone = items.length > 0 && outstanding === 0;

  if (items.length === 0)
    return (
      <ClientShell>
        <ClientOutcome icon="checkCircle" tone="success" title="Nothing outstanding">
          <p>You’re all set — there’s nothing for you to send. Thank you!</p>
        </ClientOutcome>
      </ClientShell>
    );

  return (
    <ClientShell>
      <ClientStepHeader
        title={allDone ? "All done — thank you" : "A few things still needed"}
        lede={allDone
          ? "Everything you were asked for has come through."
          : "Send these when you have them. It takes a minute and there’s no app to install."}
      />

      {!allDone && (
        <ClientCard tone="accent" icon="upload" title={`${outstanding} of ${items.length} still to send`}>
          <p className="text-base leading-relaxed text-muted">
            Photos or PDFs, up to 15&nbsp;MB each. You can take a photo now or pick
            a file you already have — each one saves on its own, so you don’t have
            to do them all at once.
          </p>
        </ClientCard>
      )}

      <ul className="mt-4 space-y-3">
        {items.map((it, i) => (
          <UploadItem
            key={it.key}
            token={token}
            itemKey={it.key}
            label={it.label}
            why={it.why}
            index={i + 1}
            done={it.done}
          />
        ))}
      </ul>

      {allDone && (
        <p
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-status-success-line bg-status-success-bg p-4 text-base leading-relaxed text-status-success"
        >
          <Icon name="checkCircle" size={19} className="mt-0.5 shrink-0" />
          <span>
            Thank you — your assessor has everything they asked for and will take it
            from here. You can close this page.
          </span>
        </p>
      )}
    </ClientShell>
  );
}
