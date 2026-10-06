"use client";
// Manager decision surface. Same single action (`reviewReportAction`) and the
// same role guard; approve still locks the job, return still requires comments.
// The UX pass makes each consequence explicit and stops approve/return reading
// as two equal buttons.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewReportAction } from "@/lib/actions";
import { useSession } from "@/lib/session-context";
import { Icon } from "@/components/ui/Icon";
import { Button, InlineAlert } from "@/components/ui/primitives";
import { ConfirmDialog, Modal } from "@/components/ui/Overlay";

export function ManagerReview({
  jobId, jobStatus, version, preparedBy,
}: { jobId: string; jobStatus: string; version?: number; preparedBy?: string }) {
  const user = useSession();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [comments, setComments] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [err, setErr] = useState("");

  if (jobStatus !== "Report submitted") return null;

  if (user.role !== "manager") {
    return (
      <InlineAlert tone="info" title={`Version ${version ?? "?"} is with the manager for review`}>
        Only a manager can approve or return a report. You can read the version
        below and its evidence index.
      </InlineAlert>
    );
  }

  const run = (verdict: "approve" | "return") =>
    new Promise<void>((resolve, reject) => {
      setErr("");
      start(async () => {
        try {
          await reviewReportAction(jobId, verdict, comments);
          setApproveOpen(false);
          setReturnOpen(false);
          router.refresh();
          resolve();
        } catch (x) {
          const message = x instanceof Error ? x.message : "The review didn’t go through.";
          setErr(message);
          reject(new Error(message));
        }
      });
    });

  return (
    <section className="rounded-lg border-2 border-foreground bg-background p-4 shadow-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Icon name="shield" size={17} />
            Your review — version {version ?? "?"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {preparedBy ? <>Prepared by {preparedBy}. </> : null}
            Approving marks the report completed and <strong>locks the job</strong>.
            Returning it sends it back with your comments.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="accent" size="lg" icon="checkCircle" onClick={() => setApproveOpen(true)} disabled={pending}>
          Approve &amp; lock
        </Button>
        <Button variant="secondary" icon="refresh" onClick={() => setReturnOpen(true)} disabled={pending}>
          Return for correction…
        </Button>
      </div>

      {err && (
        <InlineAlert tone="danger" role="alert" className="mt-3" title="The review didn’t go through">
          {err}
        </InlineAlert>
      )}

      {/* ---- Approve: consequence-first ---------------------------------- */}
      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => run("approve")}
        title={`Approve version ${version ?? "?"} and lock the job?`}
        consequence="This is not a routine save. The job moves to Report completed, which has no onward transitions — the record locks permanently."
        confirmLabel="Approve & lock"
        confirmVariant="accent"
        busyLabel="Approving"
        cancelLabel="Not yet"
      >
        <ul className="space-y-1.5 text-sm text-foreground">
          {[
            "This version becomes the approved final report.",
            "Report narrative editing stops for the assessor.",
            "Evidence labels, filing and figures can no longer change.",
            "The evidence pack and print output stay available, read-only.",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <Icon name="dot" size={9} className="mt-1.5 shrink-0 text-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <label htmlFor="approve-comments" className="mb-1 block text-sm font-medium text-foreground">
            Comments <span className="font-normal text-muted-light">(optional — recorded against the version)</span>
          </label>
          <textarea
            id="approve-comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full text-sm"
            placeholder="Anything worth recording on the file"
          />
        </div>
      </ConfirmDialog>

      {/* ---- Return: decide first, then write the comments -------------- */}
      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title={`Return version ${version ?? "?"} for correction`}
        description="The job moves back to Returned for correction and the assessor can edit again. Your comments are what they see, so be specific."
        blockEscape={pending}
        footer={
          <>
            <Button variant="quiet" onClick={() => setReturnOpen(false)} disabled={pending}>Cancel</Button>
            <Button
              variant="primary"
              icon="refresh"
              disabled={!comments.trim() || pending}
              busy={pending}
              busyLabel="Returning"
              title={comments.trim() ? undefined : "Comments are required to return a report"}
              onClick={() => { void run("return").catch(() => {}); }}
            >
              Return with comments
            </Button>
          </>
        }
      >
        <label htmlFor="return-comments" className="mb-1 block text-sm font-medium text-foreground">
          What must the assessor correct? <span className="text-status-error" aria-hidden>*</span>
        </label>
        <textarea
          id="return-comments"
          data-autofocus
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={5}
          required
          aria-describedby="return-comments-hint"
          className="w-full text-sm"
          placeholder="e.g. The cause section needs to address the pre-existing gutter corrosion separately from the storm damage."
        />
        <p id="return-comments-hint" className="mt-1.5 text-xs text-muted">
          Required. Comments are stored on this version and shown at the top of the
          assessor’s report builder.
        </p>
        {err && (
          <InlineAlert tone="danger" role="alert" className="mt-3">{err}</InlineAlert>
        )}
      </Modal>
    </section>
  );
}
