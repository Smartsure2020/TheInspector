"use client";
// Job-level status actions.
//
// Behaviour is unchanged: the same four server actions (`assignAction`,
// `noShowAction`, `cancelAction`, `transitionAction`) against the same status
// machine. What changed is that every consequential action now states its
// consequence in a shared accessible confirmation dialog instead of an inline
// select, and destructive actions no longer look like routine ones.
import { useState, useTransition } from "react";
import { assignAction, cancelAction, noShowAction, transitionAction } from "@/lib/actions";
import { JobStatus } from "@/lib/types";
import { Button, InlineAlert, LinkButton } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/Overlay";
import { Icon } from "@/components/ui/Icon";

const NO_SHOW_REASONS = ["did not join", "joined but failed tech check", "cancelled late", "wrong contact details", "other"];
const CANCEL_REASONS = ["claim withdrawn", "settled without assessment", "duplicate job", "client non-cooperation", "other"];

type Dialog =
  | { kind: "none" }
  | { kind: "no_show" }
  | { kind: "cancel" }
  | { kind: "start_mock" }
  | { kind: "end"; outcome: "Awaiting evidence" | "Awaiting report" }
  | { kind: "resolve" };

export function JobActions({
  jobId, jobNumber, clientName, status, assessors, hasAssessor, hasMissingItems, hasActiveLink,
}: {
  jobId: string;
  jobNumber: string;
  clientName: string;
  status: JobStatus;
  assessors: { id: string; name: string }[];
  hasAssessor: boolean;
  hasMissingItems: boolean;
  hasActiveLink: boolean;
}) {
  const [pending, start] = useTransition();
  const [assessorId, setAssessorId] = useState(assessors[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });

  const close = () => { setDialog({ kind: "none" }); setReason(""); };

  const run = (fn: () => Promise<void>) =>
    new Promise<void>((resolve, reject) => {
      setErr("");
      start(async () => {
        try { await fn(); close(); resolve(); }
        catch (e) { reject(e instanceof Error ? e : new Error("Action failed")); }
      });
    });

  const terminal = status === "Report completed" || status === "Cancelled";

  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-muted">Actions</span>

        {status === "New" && (
          <>
            <label htmlFor="assign-assessor" className="sr-only">Choose an assessor to assign</label>
            <select
              id="assign-assessor"
              className="h-9 max-w-[16rem]"
              value={assessorId}
              onChange={(e) => setAssessorId(e.target.value)}
              disabled={assessors.length === 0}
            >
              {assessors.length === 0
                ? <option value="">No mandated assessor available</option>
                : assessors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <Button
              variant="primary"
              icon="user"
              busy={pending}
              busyLabel="Assigning"
              disabled={!assessorId}
              onClick={() => void run(() => assignAction(jobId, assessorId)).catch((e) => setErr(e.message))}
            >
              Assign assessor
            </Button>
          </>
        )}

        {(status === "Assigned" || status === "No-show") && (
          <LinkButton href={`/jobs/${jobId}/schedule`} variant="primary" icon="calendar">
            {status === "No-show" ? "Rebook — new attempt" : "Book appointment"}
          </LinkButton>
        )}

        {status === "Scheduled" && (
          <>
            <LinkButton href={`/jobs/${jobId}/room`} variant="accent" icon="video">Open live room</LinkButton>
            <LinkButton href={`/jobs/${jobId}/schedule`} variant="secondary" icon="calendar">Reschedule</LinkButton>
            <Button variant="secondary" icon="admit" onClick={() => setDialog({ kind: "start_mock" })}>
              Start session (demo)
            </Button>
            <Button variant="danger" icon="alert" onClick={() => { setReason(NO_SHOW_REASONS[0]); setDialog({ kind: "no_show" }); }}>
              Mark no-show
            </Button>
          </>
        )}

        {status === "In progress" && (
          <>
            <LinkButton href={`/jobs/${jobId}/room`} variant="accent" icon="video">Back to the live room</LinkButton>
            <Button variant="warning" icon="images" onClick={() => setDialog({ kind: "end", outcome: "Awaiting evidence" })}>
              End — items outstanding
            </Button>
            <Button variant="primary" icon="check" onClick={() => setDialog({ kind: "end", outcome: "Awaiting report" })}>
              End — evidence complete
            </Button>
          </>
        )}

        {status === "Awaiting evidence" && (
          <>
            <LinkButton href={`/jobs/${jobId}/evidence`} variant="primary" icon="images">Review evidence</LinkButton>
            <Button variant="secondary" icon="check" onClick={() => setDialog({ kind: "resolve" })}>
              All items resolved
            </Button>
          </>
        )}

        {status === "Awaiting report" && (
          <LinkButton href={`/jobs/${jobId}/report`} variant="primary" icon="document">Open report builder</LinkButton>
        )}

        {status === "Returned for correction" && (
          <LinkButton href={`/jobs/${jobId}/report`} variant="primary" icon="pencil">
            Revise report — manager comments waiting
          </LinkButton>
        )}

        {status === "Report submitted" && (
          <LinkButton href={`/jobs/${jobId}/report/final`} variant="primary" icon="eye">
            Open report in review
          </LinkButton>
        )}

        {status === "Report completed" && (
          <LinkButton href={`/jobs/${jobId}/report/final`} variant="primary" icon="eye">View approved report</LinkButton>
        )}

        {/* Cancel sits apart from routine actions and is styled as destructive. */}
        {!terminal && (
          <Button
            variant="danger"
            icon="minus"
            className="ml-auto"
            onClick={() => { setReason(CANCEL_REASONS[0]); setDialog({ kind: "cancel" }); }}
          >
            Cancel job
          </Button>
        )}

        {terminal && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted">
            <Icon name="lock" size={14} />
            {status === "Report completed"
              ? "Approved and locked — no further transitions exist."
              : "Cancelled — no further transitions exist."}
          </span>
        )}
      </div>

      {!hasAssessor && status !== "New" && (
        <InlineAlert tone="warning" className="mt-3">
          No assessor is recorded on this job. Assign one before the appointment.
        </InlineAlert>
      )}

      {err && <InlineAlert tone="danger" role="alert" className="mt-3" title="That action didn’t go through">{err}</InlineAlert>}

      {/* ---- Confirmations ------------------------------------------------- */}
      <ConfirmDialog
        open={dialog.kind === "no_show"}
        onClose={close}
        onConfirm={() => run(() => noShowAction(jobId, reason))}
        title={`Mark ${jobNumber} as a no-show?`}
        consequence={`The job moves to No-show and ${clientName}’s appointment is closed off. ${hasActiveLink ? "Their current link stops working. " : ""}You can rebook it afterwards as a new attempt.`}
        confirmLabel="Mark no-show"
        confirmVariant="danger"
        busyLabel="Recording"
      >
        <ReasonPicker id="no-show-reason" label="Reason (recorded on the job history)" options={NO_SHOW_REASONS} value={reason} onChange={setReason} />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog.kind === "cancel"}
        onClose={close}
        onConfirm={() => run(() => cancelAction(jobId, reason))}
        title={`Cancel ${jobNumber}?`}
        consequence="Cancelling closes the job permanently — there is no transition out of Cancelled. Any active client link stops working, and evidence becomes read-only."
        confirmLabel="Cancel this job"
        confirmVariant="danger"
        busyLabel="Cancelling"
        cancelLabel="Keep the job open"
      >
        <ReasonPicker id="cancel-reason" label="Reason (recorded on the job history)" options={CANCEL_REASONS} value={reason} onChange={setReason} />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog.kind === "start_mock"}
        onClose={close}
        onConfirm={() => run(() => transitionAction(jobId, "In progress"))}
        title="Start the session without a live client?"
        consequence="This is the single-window demo path: the job moves to In progress without anyone being admitted. In a real session you admit the client from the live room instead."
        confirmLabel="Start demo session"
        confirmVariant="accent"
        busyLabel="Starting"
      />

      <ConfirmDialog
        open={dialog.kind === "end" && dialog.outcome === "Awaiting evidence"}
        onClose={close}
        onConfirm={() => run(() => transitionAction(jobId, "Awaiting evidence"))}
        title="End the session with items outstanding?"
        consequence="The job moves to Awaiting evidence. The client can upload the outstanding items on their link, and the report waits until they are resolved."
        confirmLabel="End — items outstanding"
        confirmVariant="warning"
        busyLabel="Ending"
      />

      <ConfirmDialog
        open={dialog.kind === "end" && dialog.outcome === "Awaiting report"}
        onClose={close}
        onConfirm={() => run(() => transitionAction(jobId, "Awaiting report"))}
        title="End the session with evidence complete?"
        consequence="The job moves to Awaiting report and the report becomes writable. Nothing further is requested from the client."
        confirmLabel="End — evidence complete"
        confirmVariant="primary"
        busyLabel="Ending"
      >
        {hasMissingItems && (
          <InlineAlert tone="warning" title="Items are still flagged as missing">
            Ending as “evidence complete” leaves those items unresolved on the
            record, and the report will list them under limitations.
          </InlineAlert>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog.kind === "resolve"}
        onClose={close}
        onConfirm={() => run(() => transitionAction(jobId, "Awaiting report"))}
        title="Move to Awaiting report?"
        consequence="Confirms that outstanding evidence has been dealt with. The report becomes writable and the client is no longer expected to upload anything."
        confirmLabel="Move to Awaiting report"
        confirmVariant="primary"
        busyLabel="Updating"
      >
        {hasMissingItems && (
          <InlineAlert tone="warning" title="Some items are still flagged as missing">
            They will appear in the report’s limitations section. Resolve or
            re-file them in the evidence gallery first if that is not intended.
          </InlineAlert>
        )}
      </ConfirmDialog>
    </div>
  );
}

function ReasonPicker({
  id, label, options, value, onChange,
}: { id: string; label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <select id={id} className="w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
}
