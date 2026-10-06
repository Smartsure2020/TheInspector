"use client";
// Evidence curation controls. Same single mutation path (`updateEvidenceAction`)
// for relabel / refile / feature; the action still refuses writes on locked jobs.
import { useEffect, useRef, useState, useTransition } from "react";
import { updateEvidenceAction } from "@/lib/actions";
import { PhotoTile } from "@/components/Chrome";
import { Icon } from "@/components/ui/Icon";
import { Badge, EvidenceKindBadge, InlineAlert } from "@/components/ui/primitives";
import { LiveRegion } from "@/components/ui/Overlay";
import { formatDateTime } from "@/lib/format";

export interface ItemOption { key: string; label: string; group: string }

export function EvidenceCard(props: {
  jobId: string;
  evidence: {
    id: string; label: string; kind: string; captured_at: string;
    is_featured: number; item_key: string | null; hue: number | null;
    file_key: string | null; mime_type: string | null;
  };
  itemOptions: ItemOption[];
  /** Human location of this item on the checklist, resolved server-side. */
  filedTo?: { section: string; prompt: string; highRes?: boolean };
  locked: boolean;
}) {
  const { jobId, evidence: e, itemOptions, filedTo, locked } = props;
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState("");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const run = (patch: { label?: string; itemKey?: string | null; featured?: boolean }, what: string) =>
    start(async () => {
      setErr("");
      try {
        await updateEvidenceAction(jobId, e.id, patch);
        setSaved(what);
        clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(""), 2500);
      } catch (x) {
        setErr(x instanceof Error ? x.message : "That change didn’t save. Nothing was altered — try again.");
      }
    });

  const isPdf = e.mime_type === "application/pdf";
  const unfiled = !e.item_key;

  // Group the refile options by section so a long checklist stays navigable.
  const groups = [...new Set(itemOptions.map((o) => o.group))];

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-lg border bg-background shadow-1 transition-opacity ${pending ? "opacity-60" : ""} ${
        e.is_featured ? "border-accent ring-1 ring-accent/30" : unfiled ? "border-status-warning-line" : "border-border"
      }`}
    >
      {/* ---- Preview (no controls layered over the image) ----------------- */}
      <a
        href={`/api/files/${e.id}`}
        target="_blank"
        className="group relative block"
        aria-label={`Open “${e.label}” full size in a new tab`}
      >
        {e.file_key ? (
          isPdf ? (
            <span className="flex h-36 w-full items-center justify-center gap-2 bg-surface text-sm text-muted">
              <Icon name="document" size={20} />
              PDF — open
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${e.id}`} alt={e.label} className="h-36 w-full object-cover" />
          )
        ) : (
          <PhotoTile hue={e.hue ?? 200} />
        )}
        <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-sm bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Icon name="external" size={11} />
          Full size
        </span>
      </a>

      {/* ---- Identity ---------------------------------------------------- */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
        {editing ? (
          <div>
            <label htmlFor={`label-${e.id}`} className="mb-1 block text-xs font-medium text-foreground">
              Evidence label (appears in the report and evidence pack)
            </label>
            <input
              id={`label-${e.id}`}
              autoFocus
              defaultValue={e.label}
              onBlur={(x) => {
                setEditing(false);
                const v = x.target.value.trim();
                if (v && v !== e.label) run({ label: v }, "Label updated");
              }}
              onKeyDown={(x) => {
                if (x.key === "Enter") (x.target as HTMLInputElement).blur();
                if (x.key === "Escape") setEditing(false);
              }}
              className="w-full text-sm"
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={locked}
            onClick={() => setEditing(true)}
            title={locked ? "Locked after approval — labels can’t change" : "Click to rename this evidence item"}
            className="group text-left text-sm leading-snug text-foreground disabled:text-muted"
          >
            <span className="line-clamp-2">{e.label}</span>
            {!locked && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Icon name="pencil" size={11} />
                Rename
              </span>
            )}
          </button>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <EvidenceKindBadge kind={e.kind} />
          {e.is_featured ? <Badge tone="accent" icon="starFilled">Report figure</Badge> : null}
          {filedTo?.highRes && <Badge tone="info" icon="hires">High-res item</Badge>}
        </div>

        <p className="text-xs text-muted">
          {unfiled ? (
            <span className="font-medium text-status-warning">Not filed against a checklist item</span>
          ) : (
            <>
              <span className="text-muted-light">{filedTo?.section ?? "Checklist"}</span>
              {filedTo?.prompt ? <> · {filedTo.prompt}</> : null}
            </>
          )}
        </p>
        <p className="text-xs text-muted-light tnum">{formatDateTime(e.captured_at)}</p>

        {/* ---- Actions: their own region, below the content ------------- */}
        <div className="mt-auto space-y-2 border-t border-border pt-2">
          {locked ? (
            <p className="flex items-center gap-1.5 text-xs text-status-locked">
              <Icon name="lock" size={12} />
              Read-only — the record is locked
            </p>
          ) : (
            <>
              <button
                type="button"
                disabled={pending}
                aria-pressed={!!e.is_featured}
                onClick={() => run({ featured: !e.is_featured }, e.is_featured ? "Removed from report figures" : "Added to report figures")}
                className={`inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                  e.is_featured
                    ? "border-accent bg-accent text-accent-on hover:bg-accent-hover"
                    : "border-border-strong bg-background text-foreground hover:bg-surface"
                }`}
              >
                <Icon name={e.is_featured ? "starFilled" : "star"} size={13} />
                {e.is_featured ? "Featured as a report figure" : "Feature as a report figure"}
              </button>

              <div>
                <label htmlFor={`file-${e.id}`} className="mb-1 block text-xs text-muted">
                  Filed against
                </label>
                <select
                  id={`file-${e.id}`}
                  disabled={pending}
                  value={e.item_key ?? ""}
                  onChange={(x) => run({ itemKey: x.target.value || null }, x.target.value ? "Refiled" : "Moved to unfiled")}
                  className="w-full text-xs"
                >
                  <option value="">— Unfiled —</option>
                  {groups.map((g) => (
                    <optgroup key={g} label={g}>
                      {itemOptions.filter((o) => o.group === g).map((o) => (
                        <option key={o.key} value={o.key}>{o.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </>
          )}

          {pending && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Icon name="spinner" size={12} className="animate-spin" />
              Saving…
            </p>
          )}
          {saved && !pending && (
            <p className="flex items-center gap-1.5 text-xs text-status-success">
              <Icon name="checkCircle" size={12} />
              {saved}
            </p>
          )}
          {err && <InlineAlert tone="danger" role="alert">{err}</InlineAlert>}
          <LiveRegion message={saved || err} />
        </div>
      </div>
    </article>
  );
}
