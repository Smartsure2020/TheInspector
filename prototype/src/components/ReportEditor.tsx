"use client";
// Report narrative editor. Same two actions (`saveReportDraftAction` on blur,
// `submitReportAction` on submit) — what changed is that the save state is now
// trustworthy: saving / saved with a time / failed with a retry, announced to
// screen readers, plus an explicit unsaved-changes indicator.
import { useEffect, useRef, useState, useTransition } from "react";
import { saveReportDraftAction, submitReportAction } from "@/lib/actions";
import { Icon } from "@/components/ui/Icon";
import { Button, InlineAlert } from "@/components/ui/primitives";
import { ConfirmDialog, LiveRegion } from "@/components/ui/Overlay";

interface SectionDef { key: string; title: string }

/** Sections that carry the substance and deserve room to write. */
const TALL = new Set(["findings", "copeFindings", "recommendations"]);

type SaveState =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "failed"; message: string };

export function ReportEditor(props: {
  jobId: string;
  sections: SectionDef[];
  initial: Record<string, string>;
  canSubmit: boolean;
  submitLabel: string;
  returnedComments?: string;
  readOnly: boolean;
}) {
  const { jobId, sections, initial, canSubmit, readOnly } = props;
  const narrative = useRef<Record<string, string>>({ ...initial });
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [submitErr, setSubmitErr] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();

  // Warn before losing an unsaved edit (e.g. closing the tab mid-sentence).
  useEffect(() => {
    if (save.kind !== "dirty") return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [save.kind]);

  const persist = () =>
    start(async () => {
      setSave({ kind: "saving" });
      try {
        await saveReportDraftAction(jobId, narrative.current);
        const now = new Date();
        setSave({ kind: "saved", at: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` });
      } catch (x) {
        setSave({ kind: "failed", message: x instanceof Error ? x.message : "The draft didn’t save." });
      }
    });

  const submit = () =>
    new Promise<void>((resolve, reject) => {
      setSubmitErr("");
      start(async () => {
        try { await submitReportAction(jobId, narrative.current); resolve(); }
        catch (x) {
          const digest = (x as { digest?: string })?.digest ?? "";
          // A successful submit redirects to the report page.
          if (digest.startsWith("NEXT_REDIRECT") || (x instanceof Error && x.message.includes("NEXT_REDIRECT"))) throw x;
          const message = x instanceof Error ? x.message : "Submit failed";
          setSubmitErr(message);
          reject(new Error(message));
        }
      });
    });

  const saveIndicator = (() => {
    switch (save.kind) {
      case "saving": return { icon: "spinner" as const, spin: true, cls: "text-muted", text: "Saving draft…" };
      case "saved": return { icon: "checkCircle" as const, spin: false, cls: "text-status-success", text: `Draft saved at ${save.at}` };
      case "dirty": return { icon: "pencil" as const, spin: false, cls: "text-status-warning", text: "Unsaved changes — they save when you click out of the box" };
      case "failed": return { icon: "alert" as const, spin: false, cls: "text-status-error", text: save.message };
      default: return { icon: "info" as const, spin: false, cls: "text-muted", text: "Each section saves on its own when you click out of it" };
    }
  })();

  return (
    <div className="space-y-4">
      {props.returnedComments && (
        <section className="rounded-lg border border-status-warning-line bg-status-warning-bg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-status-warning">
            <Icon name="refresh" size={16} />
            Returned by your manager — what to correct
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{props.returnedComments}</p>
          <p className="mt-2.5 text-xs text-status-warning">
            Edit the sections below, then resubmit. Your earlier version is kept in
            the version history.
          </p>
        </section>
      )}

      {readOnly && (
        <InlineAlert tone="locked" title="This narrative is read-only">
          The report is with the manager or already approved. Editing reopens only
          if it is returned for correction.
        </InlineAlert>
      )}

      <div>
        <h2 className="text-base font-semibold text-foreground">Your narrative</h2>
        <p className="mt-0.5 text-sm text-muted">
          These sections are yours to write — prefilled from the checklist as a
          starting point. Particulars, limitations, the evidence index and sign-off
          are generated from the record and are not editable.
        </p>
      </div>

      {sections.map((s, i) => (
        <section key={s.key} className="rounded-lg border border-border bg-background shadow-1">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <h3 className="text-sm font-semibold text-foreground">
              <span className="mr-1.5 tnum text-muted">{i + 1}.</span>
              {s.title}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-sm border border-accent-line bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
              <Icon name="pencil" size={11} />
              Editable
            </span>
          </div>
          <div className="p-3">
            <label htmlFor={`narrative-${s.key}`} className="sr-only">{s.title}</label>
            <textarea
              id={`narrative-${s.key}`}
              defaultValue={initial[s.key] ?? ""}
              readOnly={readOnly}
              rows={TALL.has(s.key) ? 10 : 4}
              onChange={(e) => {
                narrative.current[s.key] = e.target.value;
                if (!readOnly) setSave({ kind: "dirty" });
              }}
              onBlur={() => { if (!readOnly && save.kind === "dirty") persist(); }}
              className={`w-full text-sm leading-relaxed ${readOnly ? "bg-surface text-muted" : ""}`}
            />
          </div>
        </section>
      ))}

      {/* ---- Save + submit ------------------------------------------------ */}
      <div className="rounded-lg border border-border bg-background p-4 shadow-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className={`flex items-center gap-1.5 text-sm ${saveIndicator.cls}`}>
            <Icon name={saveIndicator.icon} size={15} className={saveIndicator.spin ? "animate-spin" : ""} />
            {saveIndicator.text}
          </p>
          {save.kind === "failed" && (
            <Button variant="secondary" size="sm" icon="refresh" onClick={persist} busy={pending} busyLabel="Retrying">
              Retry save
            </Button>
          )}

          {canSubmit && !readOnly && (
            <Button
              variant="primary"
              icon="upload"
              className="ml-auto"
              disabled={pending}
              onClick={() => setConfirmOpen(true)}
            >
              {props.submitLabel}
            </Button>
          )}
        </div>

        {canSubmit && !readOnly && (
          <p className="mt-2 text-xs text-muted">
            Submitting sends this version to your manager for review — it does not
            complete the job. They can approve it or return it with comments.
          </p>
        )}

        {submitErr && (
          <InlineAlert tone="danger" role="alert" className="mt-3" title="The report wasn’t submitted">
            {submitErr}
          </InlineAlert>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Send this version for manager review?"
        consequence="A new report version is snapshotted and the job moves to Report submitted. You can’t edit it again unless the manager returns it."
        confirmLabel={props.submitLabel}
        confirmVariant="primary"
        busyLabel="Submitting"
      >
        {save.kind === "dirty" && (
          <InlineAlert tone="warning" title="You have unsaved text">
            Click out of the box you were typing in first, so the latest wording is
            included in the submitted version.
          </InlineAlert>
        )}
      </ConfirmDialog>

      <LiveRegion
        message={
          save.kind === "saved" ? `Draft saved at ${save.at}`
          : save.kind === "failed" ? `Draft did not save. ${save.message}`
          : ""
        }
      />
    </div>
  );
}
