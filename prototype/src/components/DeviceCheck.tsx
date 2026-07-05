"use client";
// Camera/mic check (Chunk 1C): preview, front/rear switch, mic level meter,
// torch test with graceful fallback, plain troubleshooting copy.
// Logs device_check_passed (with results) when the client continues.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientShell } from "@/components/Chrome";
import { clientPingAction } from "@/lib/actions";

type CamState = "asking" | "ok" | "denied" | "nocamera";
type TorchState = "untested" | "on" | "unsupported";

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

  // Camera + mic stream (restarts on facing switch).
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

        // Simple mic level meter.
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
      setTorchMsg("Torch is on — tap again during the call whenever you need light.");
      setTimeout(() => {
        track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] }).catch(() => {});
      }, 2500);
    } catch {
      setTorch("unsupported");
      setTorchMsg("The torch can't be switched on from the browser on this phone — that's OK. If a room is dark, just put a light on.");
    }
  };

  const continueOn = async () => {
    // Only a real pass lights the staff "camera check passed" indicator;
    // continue-anyway still proceeds but leaves the dot grey (accurate signal).
    if (cam === "ok") {
      await clientPingAction(token, "device_check_passed", {
        camera: true, rear_tried: triedRear, mic: micOk, torch,
      }).catch(() => {});
    }
    router.push(`/c/${token}/waiting`);
  };

  return (
    <ClientShell>
      <div className="mt-6">
        <h1 className="text-xl font-bold text-slate-800">Quick camera check</h1>
        <p className="text-sm text-slate-500 mt-1">Three quick things — takes under a minute.</p>

        <div className="bg-black rounded-2xl overflow-hidden mt-4 aspect-[3/4] relative">
          {cam === "ok" ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-sm text-slate-300">
              {cam === "asking" && "Asking for camera access — please tap Allow in the pop-up…"}
              {cam === "denied" && "We can't see your camera. Look for the camera icon in your browser's address bar and choose Allow, then reload this page. If it still doesn't work, don't worry — your assessor will phone you."}
              {cam === "nocamera" && "No camera was found on this device. Please open the link on your phone instead."}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button className="flex-1 bg-white border border-slate-300 rounded-xl py-3 text-sm font-medium disabled:opacity-40" disabled={cam !== "ok"}
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}>
            🔄 {facing === "user" ? "Try your back camera" : "Back to front camera"}
          </button>
          <button className="flex-1 bg-white border border-slate-300 rounded-xl py-3 text-sm font-medium disabled:opacity-40"
            disabled={cam !== "ok" || facing !== "environment"}
            title={facing !== "environment" ? "Switch to the back camera first" : ""}
            onClick={testTorch}>
            🔦 Test torch
          </button>
        </div>
        {facing === "user" && cam === "ok" && (
          <p className="text-[11px] text-slate-400 mt-1">Tip: the torch only works with the back camera.</p>
        )}
        {torchMsg && <p className={`text-xs mt-2 ${torch === "on" ? "text-emerald-700" : "text-slate-500"}`}>{torchMsg}</p>}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700">🎤 Say hello:</span>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${micOk ? "bg-emerald-500" : "bg-blue-400"}`} style={{ width: `${micLevel}%` }} />
            </div>
            {micOk && <span className="text-emerald-600 text-sm font-semibold">✓</span>}
          </div>
          {!micOk && cam === "ok" && <p className="text-[11px] text-slate-400 mt-1.5">If the bar doesn&apos;t move when you talk, check your phone isn&apos;t on silent/muted for the browser.</p>}
        </div>

        <button
          className="mt-4 w-full bg-blue-600 disabled:bg-slate-300 text-white rounded-xl py-3.5 font-semibold"
          disabled={cam === "asking"}
          onClick={continueOn}
        >
          {cam === "ok" ? "Looks good — continue" : "Continue anyway — my assessor can phone me"}
        </button>
      </div>
    </ClientShell>
  );
}
