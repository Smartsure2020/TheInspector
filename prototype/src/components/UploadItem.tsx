"use client";
// Real per-item uploader (Chunk 1C): camera/gallery/file via <input type=file>,
// posts to uploadEvidenceAction. MIME and size restrictions are enforced by
// `storage.ts` and are unchanged — they are simply stated up front now.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadEvidenceAction } from "@/lib/actions";
import { Icon } from "@/components/ui/Icon";
import { LiveRegion } from "@/components/ui/Overlay";
import { clientButtonClass } from "@/components/ui/client";
import { MAX_UPLOAD_BYTES, uploadTooLargeMessage } from "@/lib/limits";

export function UploadItem({
  token, itemKey, label, why, index, done,
}: {
  token: string;
  itemKey: string;
  label: string;
  /** Client-facing reason this is needed. Never the raw checklist key. */
  why?: string;
  index: number;
  done: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [justDone, setJustDone] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const complete = done || justDone;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setErr("");
    // Checked here because production hides server-action error text from the browser.
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileName("");
      setErr(uploadTooLargeMessage("file"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFileName(file.name);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      try {
        await uploadEvidenceAction(token, itemKey, fd);
        setJustDone(true);
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "That didn’t upload. Please check your signal and try again.");
      }
    });
  };

  return (
    <li
      className={`rounded-lg border p-4 ${
        complete ? "border-status-success-line bg-status-success-bg" : "border-border bg-background"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tnum ${
            complete
              ? "border-status-success-line bg-background text-status-success"
              : "border-border-strong bg-surface text-muted"
          }`}
        >
          {complete ? <Icon name="check" size={15} /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium leading-snug text-foreground">{label}</p>
          {why && !complete && <p className="mt-1 text-sm leading-relaxed text-muted">{why}</p>}

          {complete ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-base font-medium text-status-success">
              <Icon name="checkCircle" size={17} />
              Received — thank you
            </p>
          ) : (
            <div className="mt-3">
              <input
                ref={fileRef}
                id={`file-${itemKey}`}
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={pending}
                className={clientButtonClass("primary")}
                onClick={() => fileRef.current?.click()}
              >
                <Icon name={pending ? "spinner" : "camera"} size={18} className={pending ? "animate-spin" : ""} />
                {pending ? "Uploading…" : "Take a photo or choose a file"}
              </button>

              {pending && fileName && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <Icon name="upload" size={14} />
                  Sending <span className="truncate font-medium">{fileName}</span>
                </p>
              )}

              {err && (
                <p role="alert" className="mt-2 flex items-start gap-2 rounded-md border border-status-error-line bg-status-error-bg px-3 py-2 text-sm font-medium text-status-error">
                  <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {err}
                    <span className="mt-1 block font-normal">
                      Nothing was lost — you can try the same file again.
                    </span>
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <LiveRegion message={justDone ? `${label}: received` : err} assertive={!!err} />
    </li>
  );
}
