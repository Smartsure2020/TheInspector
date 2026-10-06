// S8 — Client landing page with link-state handling (Chunk 1C).
// States: valid | too_early | expired | revoked | invalid (+ upload links route on).
// VISIBILITY RULE: no internal data, ever (phase1/01 rule 2) — no job status, no
// staff notes, no concern flags, no assessor commentary, no other jobs.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { resolveToken, getClient } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import {
  CannotAttendButton, ClientPing, Countdown, RequestNewLinkButton,
} from "@/components/ClientBits";
import {
  ClientBullets, ClientCard, ClientLinkAction, ClientOutcome, ClientStepHeader,
} from "@/components/ui/client";
import { Icon } from "@/components/ui/Icon";
import { checkOtpVerified } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

function LinkProblem({
  title, body, whatNow, token, offerNewLink,
}: { title: string; body: string; whatNow: string; token: string; offerNewLink: boolean }) {
  return (
    <ClientShell>
      <ClientOutcome
        icon="linkOff"
        title={title}
        actions={offerNewLink ? <RequestNewLinkButton token={token} /> : undefined}
      >
        <p>{body}</p>
        <p className="mt-3 text-sm">{whatNow}</p>
      </ClientOutcome>
    </ClientShell>
  );
}

export default async function ClientLanding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = await resolveToken(token);

  if (info.purpose === "upload" && info.state === "valid") redirect(`/c/${token}/upload`);

  if ((info.state === "valid" || info.state === "too_early") && !(await checkOtpVerified(token)))
    redirect(`/c/${token}/verify`);

  if (info.state === "invalid")
    return (
      <LinkProblem
        token={token}
        offerNewLink={false}
        title="This link isn't recognised"
        body="It may have been typed in by hand, or shortened by a messaging app."
        whatNow="Please tap the most recent link in your SMS or email. If it still doesn't work, contact your claims coordinator."
      />
    );
  if (info.state === "revoked")
    return (
      <LinkProblem
        token={token}
        offerNewLink
        title="This link has been replaced"
        body="Your appointment was rebooked, so this older link no longer works."
        whatNow="Use the newest link we sent you — or ask for a fresh one below and your coordinator will send it."
      />
    );
  if (info.state === "expired")
    return (
      <LinkProblem
        token={token}
        offerNewLink
        title="This link has expired"
        body="No problem — these links only work around your appointment time."
        whatNow="Request a new one below and your coordinator will sort it out."
      />
    );

  const job = info.job!;
  const client = await getClient(job.client_id);
  const claimRef = job.claim_number.length > 5 ? `…${job.claim_number.slice(-5)}` : job.claim_number;
  const isSurvey = job.job_type === "survey";
  const assessor = job.assessor_name ?? "Your assessor";

  const prepByType: Record<string, string[]> = {
    geyser_water: ["Access to the geyser (cupboard or roof access point)", "Your plumber's invoice, if you have it", "The rooms with water damage"],
    accidental: ["The damaged item", "Its receipt or box, if you have it"],
    storm: ["A safe view of the damage — please do NOT climb on the roof or a ladder", "Access to the rooms where water came in", "Any photos you took at the time, and repair quotes if you have them"],
    theft: ["Your SAPS case number, if you have it", "Access to where they got in", "Receipts or photos of the stolen items, if you have them"],
    general: ["The damaged items or area", "Any electrician, plumber or technician report you have", "Receipts or quotes, if you have them"],
    survey_residential: ["About an hour to walk around your property with your phone", "Access to the electrical board, geyser and alarm panel", "Your gate or street entrance for an outside view"],
    survey_commercial: ["About an hour to walk through the premises with your phone", "Access to fire equipment, electrical boards and storage areas", "Someone who knows the building and its tenants"],
  };
  const prep = prepByType[job.claim_type] ?? prepByType.general;
  /** Storm keeps its explicit do-NOT-climb safety wording, called out separately. */
  const isStorm = job.claim_type === "storm";

  const prepCard = (
    <ClientCard title="Please have ready" icon="clipboard" tone="plain">
      <ClientBullets items={prep} />
      {isStorm && (
        <p className="mt-3 flex gap-2 rounded-md border border-status-warning-line bg-status-warning-bg p-3 text-base font-medium text-status-warning">
          <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
          <span>
            Please stay safe: do <strong>not</strong> climb onto the roof, onto a
            ladder, or anywhere unsafe to show us the damage. Filming from the
            ground or a window is enough.
          </span>
        </p>
      )}
    </ClientCard>
  );

  if (info.state === "too_early")
    return (
      <ClientShell>
        <ClientPing token={token} kind="link_opened" />
        <ClientStepHeader
          title="You’re a little early"
          lede={
            <>
              Hello <strong className="text-foreground">{client?.full_name}</strong> — your{" "}
              {isSurvey ? "video risk survey" : "video assessment"} with {assessor} starts in{" "}
              <Countdown target={info.scheduledStart!} />.
            </>
          }
        />

        <ClientCard tone="accent" icon="calendar" title="Your appointment">
          <p className="text-lg font-semibold text-foreground tnum">
            {formatDateTime(info.scheduledStart, { long: true })}
          </p>
          <p className="mt-1 text-base text-muted">
            Come back to this same link at that time — you don’t need to do
            anything until then.
          </p>
        </ClientCard>

        <div className="mt-4 space-y-4">
          {prepCard}
          <CannotAttendButton token={token} />
          <p className="text-center">
            <Link href={`/c/${token}/consent`} className="text-sm text-muted-light underline">
              Prototype preview: continue anyway
            </Link>
          </p>
        </div>
      </ClientShell>
    );

  return (
    <ClientShell>
      <ClientPing token={token} kind="link_opened" />
      <ClientStepHeader
        title={isSurvey ? "Your video risk survey" : "Your video assessment"}
        lede={
          <>
            Hello <strong className="text-foreground">{client?.full_name}</strong>. This takes
            place on your phone — no app to install, nothing to download.
          </>
        }
      />

      <ClientCard tone="accent" icon="video" title="What happens now">
        <p className="text-base text-muted">
          <strong className="text-foreground">{assessor}</strong> will meet you on video at
        </p>
        <p className="mt-1 text-xl font-semibold text-foreground tnum">
          {formatDateTime(info.scheduledStart, { long: true })}
        </p>
        <ol className="mt-3 space-y-1.5 text-base text-muted">
          <li>1. You’ll confirm you’re happy to go ahead.</li>
          <li>2. We’ll do a quick camera and microphone check.</li>
          <li>3. You’ll wait a moment, then {assessor} lets you in.</li>
        </ol>
        <p className="mt-3 text-sm text-muted-light">Reference: {claimRef}</p>
      </ClientCard>

      <div className="mt-4 space-y-4">
        {prepCard}

        <ClientLinkAction href={`/c/${token}/consent`} icon="arrowRight">
          I’m ready — continue
        </ClientLinkAction>

        <CannotAttendButton token={token} />
      </div>
    </ClientShell>
  );
}
