"use client";
// S12 client view — the live room, provider-agnostic.
//
// VISIBILITY RULE: nothing internal ever renders here — the client sees their own
// camera, the assessor's thumbnail/name, the current instruction, connection
// state, three controls, and the high-res photo flow. No checklist, no notes, no
// concern flags, no evidence labels, no job or report status.
//
// UX pass: the assessor's instruction is now the most legible thing on screen,
// the controls carry real labels and icons instead of emoji, leaving asks for
// confirmation in an accessible dialog rather than window.confirm, and every
// state (sending, sent, failed, reconnecting, ended) says what to do next.
import { useEffect, useRef, useState } from "react";
import { ClientShell, PrototypeBanner } from "@/components/Chrome";
import { Icon, IconName } from "@/components/ui/Icon";
import { ConfirmDialog, LiveRegion } from "@/components/ui/Overlay";
import { ClientOutcome } from "@/components/ui/client";
import { promptText } from "@/lib/prompts";
import { ConnectionState, RoomMessage, SessionAdapter } from "@/lib/video/adapter";
import { createAdapter } from "@/lib/video/create-adapter";
import { captureHighResPhoto, tryTorch } from "@/lib/video/media";
import { uploadEvidenceAction } from "@/lib/actions";

/** Big, high-contrast control for use one-handed, outdoors, on a phone. */
function RoomControl({
  icon, label, tone = "neutral", onClick, disabled, pressed,
}: {
  icon: IconName;
  label: string;
  tone?: "neutral" | "active" | "danger";
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  const skin = {
    neutral: "border-room-line-strong bg-room-panel-2 text-on-dark",
    active: "border-status-warning bg-status-warning text-white",
    danger: "border-conn-disconnected bg-conn-disconnected text-white",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`flex min-h-[3.5rem] min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${skin}`}
    >
      <Icon name={icon} size={22} />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

export function ClientRoom({ token, jobId, assessorName }: { token: string; jobId: string; assessorName: string }) {
  const adapterRef = useRef<SessionAdapter | null>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [conn, setConn] = useState<ConnectionState>("idle");
  const [banner, setBanner] = useState("");
  const [flash, setFlash] = useState(false);
  const [torchMsg, setTorchMsg] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [photoReq, setPhotoReq] = useState<{ itemKey: string; instruction: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [ended, setEnded] = useState(false);
  const [leftEarly, setLeftEarly] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [hasRemote, setHasRemote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const adapter = await createAdapter();
      if (cancelled) { void adapter.leaveRoom(); return; }
      adapterRef.current = adapter;
      await adapter.resolveRoom(`job-${jobId}`);
      await adapter.joinRoom("client", {
        onLocalStream: (s) => { if (localRef.current) localRef.current.srcObject = s; },
        onRemoteStream: (s) => { setHasRemote(!!s); if (remoteRef.current) remoteRef.current.srcObject = s; },
        onConnectionState: setConn,
        onMessage: (m: RoomMessage) => {
          if (m.type === "banner" && m.text !== "__ADMIT__") setBanner(m.text);
          if (m.type === "prompt") setBanner(promptText(m.kind) ?? "");
          if (m.type === "capture_taken") { setFlash(true); setTimeout(() => setFlash(false), 1100); }
          if (m.type === "photo_request") { setPhotoReq({ itemKey: m.itemKey, instruction: m.instruction }); setPhotoError(""); }
          if (m.type === "photo_cancel") { setPhotoReq(null); setPhotoPreview(null); }
          if (m.type === "session_ended") { setEnded(true); void adapter.leaveRoom(); }
        },
      });
    })();
    return () => { cancelled = true; void adapterRef.current?.leaveRoom(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const flip = async () => {
    await adapterRef.current?.switchCamera();
    setTorchOn(false);
  };

  const torch = async () => {
    const next = !torchOn;
    const ok = await tryTorch(adapterRef.current?.getLocalStream() ?? null, next);
    if (ok) { setTorchOn(next); setTorchMsg(next ? "Torch on" : ""); }
    else setTorchMsg("Your phone doesn’t let the browser switch the torch on — that’s OK, please put a light on instead.");
    if (!ok) setTimeout(() => setTorchMsg(""), 6000);
  };

  const takePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const blob = await captureHighResPhoto("environment");
      if (blob) setPhotoPreview({ blob, url: URL.createObjectURL(blob) });
      else setPhotoError("We couldn’t take the photo. Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const usePhoto = async () => {
    if (!photoPreview || !photoReq) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const fd = new FormData();
      fd.set("file", new File([photoPreview.blob], "highres.jpg", { type: "image/jpeg" }));
      const result = await uploadEvidenceAction(token, photoReq.itemKey, fd, "highres_client_photo");
      adapterRef.current?.sendMessage("assessor", { type: "photo_delivered", evidenceId: result!.id, itemKey: photoReq.itemKey });
      setPhotoReq(null);
      setPhotoPreview(null);
      setBanner("Photo sent — thank you!");
    } catch {
      setPhotoError("The photo didn’t send. Check your signal and try again — nothing has been lost.");
    } finally {
      setPhotoBusy(false);
    }
  };

  // ---- Session finished -------------------------------------------------
  if (ended || leftEarly)
    return (
      <ClientShell>
        <ClientOutcome
          icon={leftEarly ? "info" : "checkCircle"}
          tone={leftEarly ? "neutral" : "success"}
          title={leftEarly ? "You’ve left the assessment" : "Thank you — your assessment is complete"}
        >
          {leftEarly ? (
            <p>
              If you left by mistake, reopen the link from your SMS to rejoin. If
              it no longer works, {assessorName} or the claims team will contact you
              to arrange another time.
            </p>
          ) : (
            <p>
              {assessorName} has what they need for now. If anything else is
              required, we’ll send you a simple upload link. The claims team will be
              in touch about next steps — you can close this page.
            </p>
          )}
        </ClientOutcome>
      </ClientShell>
    );

  // ---- High-resolution photo request (single-task state) ----------------
  if (photoReq)
    return (
      <div className="on-room flex min-h-dvh flex-col bg-room-bg">
        <PrototypeBanner client />
        <div className="border-b border-room-line bg-room-panel px-4 py-3 safe-x">
          <p className="flex items-center gap-2 text-sm font-medium text-on-dark-muted">
            <Icon name="photoRequest" size={15} />
            {assessorName} has asked for a clear photo
          </p>
          <p className="mt-1.5 text-lg font-semibold leading-snug text-on-dark">{photoReq.instruction}</p>
          {!photoPreview && (
            <p className="mt-1.5 text-sm text-on-dark-muted">
              Get close enough that the detail is easy to read, then tap the button
              below.
            </p>
          )}
        </div>

        <div className="relative flex-1">
          {photoPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoPreview.url} alt="The photo you just took" className="absolute inset-0 h-full w-full object-contain" />
          ) : (
            <video ref={localRef} autoPlay playsInline muted aria-label="Your camera" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {photoPreview && (
            <p className="absolute inset-x-3 top-3 rounded-md bg-room-bg/85 px-3 py-2 text-center text-sm text-on-dark">
              Can you read the detail clearly? If not, retake it.
            </p>
          )}
        </div>

        <div className="border-t border-room-line bg-room-panel p-4 safe-b safe-x">
          {photoError && (
            <p role="alert" className="mb-3 flex items-start gap-2 rounded-md border border-conn-disconnected/50 bg-conn-disconnected/15 px-3 py-2 text-sm text-conn-disconnected">
              <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
              {photoError}
            </p>
          )}
          {photoPreview ? (
            <div className="flex gap-3">
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => { setPhotoPreview(null); setPhotoError(""); }}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-room-line-strong px-4 text-base font-semibold text-on-dark disabled:opacity-40"
              >
                <Icon name="refresh" size={18} />
                Retake
              </button>
              <button
                type="button"
                disabled={photoBusy}
                onClick={usePhoto}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 text-base font-semibold text-accent-on disabled:opacity-50"
              >
                <Icon name={photoBusy ? "spinner" : "upload"} size={18} className={photoBusy ? "animate-spin" : ""} />
                {photoBusy ? "Sending…" : "Send this photo"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={photoBusy}
              onClick={takePhoto}
              className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-md border border-on-dark bg-on-dark px-4 text-base font-semibold text-room-bg disabled:opacity-50"
            >
              <Icon name={photoBusy ? "spinner" : "camera"} size={22} className={photoBusy ? "animate-spin" : ""} />
              {photoBusy ? "Opening your camera…" : "Take the photo"}
            </button>
          )}
          <LiveRegion message={photoBusy ? "Sending your photo" : photoError} assertive={!!photoError} />
        </div>
      </div>
    );

  // ---- Live session ------------------------------------------------------
  return (
    <div className="on-room flex min-h-dvh flex-col bg-room-bg">
      <PrototypeBanner client />

      <div className="relative flex-1">
        <video ref={localRef} autoPlay playsInline muted aria-label="Your camera" className="absolute inset-0 h-full w-full object-cover" />

        {/* The assessor's instruction is the most legible element on screen. */}
        {banner && (
          <div className="absolute inset-x-0 top-0 safe-t safe-x">
            <p className="mx-auto max-w-md rounded-b-lg bg-room-bg/90 px-4 py-4 text-center text-xl font-semibold leading-snug text-on-dark shadow-2">
              {banner}
            </p>
          </div>
        )}

        {/* Assessor thumbnail */}
        <div className="absolute right-3 top-28 h-28 w-20 overflow-hidden rounded-md border border-room-line-strong bg-room-panel">
          <video ref={remoteRef} autoPlay playsInline className={`h-full w-full object-cover ${hasRemote ? "" : "hidden"}`} />
          {!hasRemote && (
            <span className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-xs text-on-dark-muted">
              <Icon name="user" size={16} />
              {assessorName}
            </span>
          )}
        </div>

        {conn === "reconnecting" && (
          <div className="absolute inset-x-4 top-1/3 rounded-lg border border-room-line-strong bg-room-bg/95 p-4 text-center">
            <Icon name="wifiOff" size={22} className="mx-auto text-conn-reconnecting" />
            <p className="mt-2 text-lg font-semibold text-on-dark">Connection interrupted</p>
            <p className="mt-1.5 text-base leading-relaxed text-on-dark-muted">
              Please stay on this page — we’re trying to reconnect you. If it
              doesn’t come back, {assessorName} will phone you.
            </p>
          </div>
        )}

        {flash && (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 text-center">
            <span className="inline-flex items-center gap-2 rounded-md bg-on-dark px-4 py-2.5 text-base font-semibold text-room-bg">
              <Icon name="camera" size={18} />
              Photo taken
            </span>
          </div>
        )}

        {torchMsg && (
          <p className="absolute inset-x-4 bottom-4 rounded-md border border-room-line-strong bg-room-bg/95 px-3 py-2.5 text-center text-base leading-relaxed text-on-dark">
            {torchMsg}
          </p>
        )}
      </div>

      <div className="border-t border-room-line bg-room-panel p-3 safe-b safe-x">
        <div className="flex gap-2">
          <RoomControl icon="cameraFlip" label="Flip camera" onClick={flip} />
          <RoomControl icon="torch" label={torchOn ? "Torch on" : "Torch"} tone={torchOn ? "active" : "neutral"} pressed={torchOn} onClick={torch} />
          <RoomControl icon="leave" label="Leave" tone="danger" onClick={() => setConfirmLeave(true)} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => {
          void adapterRef.current?.leaveRoom();
          setLeftEarly(true);
        }}
        title="Leave the assessment?"
        consequence={`This disconnects you from ${assessorName}. You'd need to reopen the link from your SMS to rejoin, or wait for the claims team to contact you.`}
        confirmLabel="Yes, leave"
        confirmVariant="danger"
        cancelLabel="Stay on the call"
      />

      <LiveRegion
        message={
          conn === "reconnecting" ? "Connection interrupted. Stay on this page while we reconnect you."
          : flash ? "The assessor has taken a photo"
          : ""
        }
      />
    </div>
  );
}
