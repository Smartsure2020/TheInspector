"use client";
// Camera/mic check (Chunk 1C) — now a short guided readiness test rather than a
// row of browser controls. Same mechanics: getUserMedia preview, front/rear
// switch, mic level meter, torch test with graceful fallback, and the same
// `device_check_passed` ping with the same payload when the client continues.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { clientPingAction } from "@/lib/actions";
import { Icon, IconName } from "@/components/ui/Icon";
import { ClientAction, ClientCard, ClientStepHeader } from "@/components/ui/client";

type CamState = "asking" | "ok" | "denied" | "nocamera";
type TorchState = "untested" | "on" | "unsupported";

function StepRow({
  n, title, state, detail, children,
}: {
  n: number;
  title: string;
  state: "waiting" | "pass" | "attention" | "skipped";
  detail?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const mark: Record<typeof state, { icon: IconName; cls: string; word: string }> = {
    waiting: { icon: "clock", cls: "border-border bg-surface text-muted", word: "not checked yet" },
    pass: { icon: "check", cls: "border-status-success-line bg-status-success-bg text-status-success", word: "working" },
    attention: { icon: "warning", cls: "border-status-warning-line bg-status-warning-bg text-status-warning", word: "needs attention" },
    skipped: { icon: "minus", cls: "border-border bg-surface text-muted-light", word: "skipped" },
  };
  const m = mark[state];
  return (
    <li className="flex gap-3 border-b border-border py-3 last:border-0">
      <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${m.cls}`}>
        <Icon name={m.icon} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-foreground">
          <span className="mr-1.5 text-muted tnum">{n}.</span>
          {title}
          <span className="sr-only"> — {m.word}</span>
        </p>
        {detail && <div className="mt-1 text-sm leading-relaxed text-muted">{detail}</div>}
        {children && <div className="mt-2.5">{children}</div>}
      </div>
    </li>
  );
}

export function DeviceCheck({ token }: { token: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<CamState>("asking");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [triedRear, setTriedRear] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micOk, setMicOk] = useState(false);
  const [torch, setTorch] = useState<TorchState>("untested");
  const [torchMsg, setTorchMsg] = useState("");
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let audioCtx: AudioContext | undefined;
    let raf = 0;
    (async () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: true,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCam("ok");
        if (facing === "environment") setTriedRear(true);

        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC && stream.getAudioTracks().length) {
          audioCtx = new AC();
          const src = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          const buf = new Uint8Array(analyser.frequencyBinCount);
          const loop = () => {
            analyser.getByteFrequencyData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i];
            const level = Math.min(100, Math.round((sum / buf.length) * 1.6));
            setMicLevel(level);
            if (level > 8) setMicOk(true);
            raf = requestAnimationFrame(loop);
          };
          loop();
        }
      } catch (e) {
        if (!cancelled) setCam(e instanceof DOMException && e.name === "NotFoundError" ? "nocamera" : "denied");
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      audioCtx?.close().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  const testTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
      setTorch("on");
      setTorchMsg("Torch is on — tap it again during the call whenever you need light.");
      setTimeout(() => {
        track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] }).catch(() => {});
      }, 2500);
    } catch {
      setTorch("unsupported");
      setTorchMsg("Your phone doesn’t let the browser control the torch. That’s completely normal — if a room is dark, just switch a light on.");
    }
  };

  const continueOn = async () => {
    setContinuing(true);
    if (cam === "ok") {
      await clientPingAction(token, "device_check_passed", {
        camera: true, rear_tried: triedRear, mic: micOk, torch,
      }).catch(() => {});
    }
    router.push(`/c/${token}/waiting`);
  };

  const allGood = cam === "ok" && micOk;

  return (
    <ClientShell>
      <ClientStepHeader
        step="Camera check"
        title="Quick camera check"
        lede="Three short checks so the call goes smoothly. It takes under a minute."
      />

      {/* ---- Live preview ------------------------------------------------- */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-room-bg">
        {cam === "ok" ? (
          <video ref={videoRef} autoPlay playsInline muted aria-label="Your camera preview" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Icon
              name={cam === "asking" ? "spinner" : cam === "nocamera" ? "videoOff" : "camera"}
              size={26}
              className={`text-on-dark-muted ${cam === "asking" ? "animate-spin" : ""}`}
            />
            <p className="text-base leading-relaxed text-on-dark">
              {cam === "asking" && "Asking for camera access — please tap “Allow” in the pop-up."}
              {cam === "denied" && "We can’t see your camera yet."}
              {cam === "nocamera" && "No camera was found on this device."}
            </p>
          </div>
        )}
        {cam === "ok" && (
          <p className="absolute left-2 top-2 rounded-sm bg-black/55 px-2 py-1 text-sm text-white">
            {facing === "user" ? "Front camera" : "Back camera"}
          </p>
        )}
      </div>

      {/* ---- Recovery guidance ------------------------------------------- */}
      {cam === "denied" && (
        <ClientCard tone="warning" className="mt-3" icon="camera" title="How to allow the camera">
          <ol className="space-y-1.5 text-base leading-relaxed text-foreground/85">
            <li>1. Look for a camera or lock icon in your browser’s address bar.</li>
            <li>2. Tap it and choose <strong>Allow</strong> for camera and microphone.</li>
            <li>3. Reload this page.</li>
          </ol>
          <p className="mt-2.5 text-base text-muted">
            If it still doesn’t work, don’t worry — you can carry on below and your
            assessor will phone you instead.
          </p>
        </ClientCard>
      )}
      {cam === "nocamera" && (
        <ClientCard tone="warning" className="mt-3" icon="videoOff" title="No camera on this device">
          <p className="text-base leading-relaxed text-foreground/85">
            Please open the same link on your phone — the assessment needs a camera
            you can carry around. You can also carry on below and your assessor
            will phone you.
          </p>
        </ClientCard>
      )}

      {/* ---- The checks --------------------------------------------------- */}
      <ClientCard title="Your checks" className="mt-3">
        <ol>
          <StepRow
            n={1}
            title="Camera"
            state={cam === "ok" ? "pass" : cam === "asking" ? "waiting" : "attention"}
            detail={cam === "ok" ? "We can see you." : cam === "asking" ? "Waiting for your permission." : "We can’t see your camera."}
          />

          <StepRow
            n={2}
            title="Back camera"
            state={triedRear ? "pass" : cam === "ok" ? "waiting" : "skipped"}
            detail="You’ll use the back camera to show the damage — worth checking it works."
          >
            <ClientAction
              tone="secondary"
              icon="cameraFlip"
              disabled={cam !== "ok"}
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            >
              {facing === "user" ? "Try my back camera" : "Back to front camera"}
            </ClientAction>
          </StepRow>

          <StepRow
            n={3}
            title="Microphone"
            state={micOk ? "pass" : cam === "ok" ? "waiting" : "skipped"}
            detail={micOk ? "We can hear you." : "Say hello — the bar should move."}
          >
            <div className="flex items-center gap-3">
              <Icon name="mic" size={18} className={micOk ? "text-status-success" : "text-muted"} />
              <div
                role="progressbar"
                aria-label="Microphone level"
                aria-valuenow={micLevel}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-100 ${micOk ? "bg-status-success" : "bg-muted"}`}
                  style={{ width: `${micLevel}%` }}
                />
              </div>
              {micOk && <Icon name="checkCircle" size={18} title="Microphone working" className="text-status-success" />}
            </div>
            {!micOk && cam === "ok" && (
              <p className="mt-1.5 text-sm text-muted">
                If the bar doesn’t move when you talk, check your phone isn’t on
                silent for the browser.
              </p>
            )}
          </StepRow>

          <StepRow
            n={4}
            title="Torch (optional)"
            state={torch === "on" ? "pass" : torch === "unsupported" ? "skipped" : cam === "ok" ? "waiting" : "skipped"}
            detail={facing !== "environment"
              ? "Switch to your back camera first — the torch only works with that one."
              : "Handy for dark cupboards and roof spaces."}
          >
            <ClientAction
              tone="secondary"
              icon="torch"
              disabled={cam !== "ok" || facing !== "environment"}
              onClick={testTorch}
            >
              Test the torch
            </ClientAction>
            {torchMsg && (
              <p className={`mt-1.5 text-sm leading-relaxed ${torch === "on" ? "text-status-success" : "text-muted"}`}>
                {torchMsg}
              </p>
            )}
          </StepRow>
        </ol>
      </ClientCard>

      {/* ---- Continue ----------------------------------------------------- */}
      <div className="mt-5 space-y-2">
        <ClientAction
          tone={cam === "ok" ? "primary" : "secondary"}
          icon={cam === "ok" ? "arrowRight" : "clock"}
          disabled={cam === "asking" || continuing}
          onClick={continueOn}
        >
          {continuing
            ? "One moment…"
            : cam === "ok"
              ? allGood ? "All good — continue" : "Continue"
              : "Continue anyway"}
        </ClientAction>
        {cam !== "ok" && cam !== "asking" && (
          <p className="text-center text-sm leading-relaxed text-muted">
            You can still continue. Your assessor will see that your camera didn’t
            work and will phone you to sort it out.
          </p>
        )}
        {cam === "ok" && !micOk && (
          <p className="text-center text-sm text-muted">
            We haven’t heard your microphone yet — you can carry on and talk on the
            call, or try saying hello first.
          </p>
        )}
      </div>
    </ClientShell>
  );
}
