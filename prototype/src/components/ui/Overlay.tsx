"use client";
// Accessible overlay primitives: Modal, ConfirmDialog, Drawer, LiveRegion.
//
// These replace every native `confirm()` in the app. Contract for all of them:
//   role="dialog" aria-modal, labelled title, focus moved in on open, focus
//   returned to the opener on close, Escape closes (unless `blockEscape`),
//   backdrop click closes (unless `blockEscape`), body scroll locked, focus
//   trapped inside, pending state that cannot be double-submitted.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, ButtonVariant, IconButton, InlineAlert } from "./primitives";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function useOverlayBehaviour(open: boolean, onClose: () => void, blockEscape: boolean) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the overlay (first control, else the panel itself).
    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
      target.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !blockEscape) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      openerRef.current?.focus?.();
    };
  }, [open, onClose, blockEscape]);

  return panelRef;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  open, onClose, title, description, children, footer, size = "md", blockEscape = false, className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Set while an action is in flight so the user cannot dismiss mid-write. */
  blockEscape?: boolean;
  className?: string;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useOverlayBehaviour(open, onClose, blockEscape);
  if (!open) return null;

  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 anim-in"
        style={{ background: "var(--overlay)" }}
        onClick={blockEscape ? undefined : onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`on-light anim-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-lg sm:rounded-lg border border-border-strong bg-background text-foreground shadow-2 ${width} ${className}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p id={descId} className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} disabled={blockEscape} size="sm" />
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface/60 px-5 py-3.5 safe-b sm:pb-3.5">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfirmDialog — the shared pattern for every consequential action
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  open, onClose, onConfirm, title, consequence, confirmLabel, confirmVariant = "primary", busyLabel, children, cancelLabel = "Cancel",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  /** What will actually happen. Always spelled out — never "Are you sure?". */
  consequence: React.ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  busyLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (open) { setBusy(false); setErr(""); } }, [open]);

  const confirm = useCallback(async () => {
    if (busy) return;                 // no duplicate submission
    setBusy(true);
    setErr("");
    try {
      await onConfirm();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That didn’t go through. Nothing has been changed — please try again.");
      setBusy(false);
    }
  }, [busy, onConfirm]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={consequence}
      size="sm"
      blockEscape={busy}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
          <Button variant={confirmVariant} onClick={confirm} busy={busy} busyLabel={busyLabel ?? "Working"} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {err && <InlineAlert tone="danger" role="alert" className="mt-3">{err}</InlineAlert>}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Drawer — contextual work that must not replace the current page
// ---------------------------------------------------------------------------

export function Drawer({
  open, onClose, title, description, side = "left", children, footer, className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  side?: "left" | "right";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useOverlayBehaviour(open, onClose, false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 anim-in" style={{ background: "var(--overlay)" }} onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute inset-y-0 flex w-full flex-col bg-background shadow-2 border-border-strong ${
          side === "left" ? "anim-drawer left-0 max-w-[19rem] border-r" : "anim-drawer-right right-0 max-w-[24rem] border-l"
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 safe-t">
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          <IconButton icon="close" label="Close menu" onClick={onClose} size="sm" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
        {footer && <div className="border-t border-border p-3 safe-b">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LiveRegion — announce meaningful state changes without constant chatter
// ---------------------------------------------------------------------------

export function LiveRegion({
  message, assertive = false, className = "sr-only",
}: { message: string; assertive?: boolean; className?: string }) {
  return (
    <div
      role="status"
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
      className={className}
    >
      {message}
    </div>
  );
}
