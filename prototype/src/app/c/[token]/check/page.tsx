"use client";
// S10 — Camera/mic check. 1A shows the stepper concept with a REAL camera preview
// where permitted (plain getUserMedia, provider-agnostic — full flow hardens in 1C).
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClientShell } from "@/components/Chrome";

export default function DeviceCheck() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "denied">("idle");
  const [facing, setFacing] = useState<"user" | "environment">("user");

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setStatus("ok");
      })
      .catch(() => setStatus("denied"));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [facing]);

  return (
    <ClientShell>
      <div className="mt-6">
        <h1 className="text-xl font-bold text-slate-800">Quick camera check</h1>
        <div className="bg-black rounded-2xl overflow-hidden mt-4 aspect-[3/4] relative">
          {status === "ok" ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-sm text-slate-300">
              {status === "denied"
                ? "We can't see your camera. Please allow camera access in the pop-up, or your assessor will phone you instead."
                : "Asking for camera access…"}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 bg-white border border-slate-300 rounded-xl py-3 text-sm font-medium" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}>
            🔄 Switch camera
          </button>
          <button className="flex-1 bg-white border border-slate-300 rounded-xl py-3 text-sm font-medium" onClick={() => alert("Torch test runs on supported devices (spike SP4; wired in 1C).")}>
            🔦 Test torch
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Can you see yourself? Try switching to the back camera too.</p>
        <button className="mt-4 w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold" onClick={() => router.push(`/c/${token}/waiting`)}>
          Looks good — continue
        </button>
      </div>
    </ClientShell>
  );
}
