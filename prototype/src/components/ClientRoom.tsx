"use client";
// S12 client view — REAL live room (Chunk 1D/1F), provider-agnostic.
// VISIBILITY RULE: nothing internal ever renders here — own camera, assessor
// thumbnail, instruction banner, simple controls, that's all.
import { useEffect, useRef, useState } from "react";
import { PrototypeBanner } from "@/components/Chrome";
import { ConnectionState, RoomMessage } from "@/lib/video/adapter";
import { P2PAdapter } from "@/lib/video/p2p-adapter";
import { captureHighResPhoto, tryTorch } from "@/lib/video/media";
import { uploadEvidenceAction } from "@/lib/actions";

const PROMPT_TEXT: Record<string, string> = {
  flip: "Please switch to your back camera (🔄 button below)",
  torch: "Please switch your torch on (🔦 button below)",
  closer: "Please move a little closer",
  further: "Please step back a little",
  slower: "Please move the camera more slowly",
  light: "Could you put a light on, or open a curtain?",
  steady: "Please hold the camera steady for a moment",
};

export function ClientRoom({ token, jobId, assessorName }: { token: string; jobId: string; assessorName: string }) {
  const adapterRef = useRef<P2PAdapter | null>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [conn, setConn] = useState<ConnectionState>("idle");
  const [banner, setBanner] = useState("");
  const [flash, setFlash] = useState(false);
  const [torchMsg, setTorchMsg] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [photoReq, setPhotoReq] = useState<{ itemKey: string; instruction: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [ended, setEnded] = useState(false);
  const [hasRemote, setHasRemote] = useState(false);

  useEffect(() => {
    const adapter = new P2PAdapter();
    adapterRef.current = adapter;
    (async () => {
      await adapter.resolveRoom(`job-${jobId}`);
      await adapter.joinRoom("client", {
        onLocalStream: (s) => { if (localRef.current) localRef.current.srcObject = s; },
        onRemoteStream: (s) => { setHasRemote(!!s); if (remoteRef.current) remoteRef.current.srcObject = s; },
        onConnectionState: setConn,
        onMessage: (m: RoomMessage) => {
          if (m.type === "banner" && m.text !== "__ADMIT__") setBanner(m.text);
          if (m.type === "prompt") setBanner(PROMPT_TEXT[m.kind] ?? "");
          if (m.type === "capture_taken") { setFlash(true); setTimeout(() => setFlash(false), 900); }
          if (m.type === "photo_request") setPhotoReq({ itemKey: m.itemKey, instruction: m.instruction });
          if (m.type === "photo_cancel") { setPhotoReq(null); setPhotoPreview(null); }
          if (m.type === "session_ended") { setEnded(true); void adapter.leaveRoom(); }
        },
      });
    })();
    return () => { void adapter.leaveRoom(); };
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
    else setTorchMsg("The torch can't be switched on from the browser on this phone — that's OK, please put a light on instead.");
    if (!ok) setTimeout(() => setTorchMsg(""), 5000);
  };

  const takePhoto = async () => {
    setPhotoBusy(true);
    try {
      const blob = await captureHighResPhoto("environment");
      if (blob) setPhotoPreview({ blob, url: URL.createObjectURL(blob) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const usePhoto = async () => {
    if (!photoPreview || !photoReq) return;
    setPhotoBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", new File([photoPreview.blob], "highres.jpg", { type: "image/jpeg" }));
      const result = await uploadEvidenceAction(token, photoReq.itemKey, fd, "highres_client_photo");
      adapterRef.current?.sendMessage("assessor", { type: "photo_delivered", evidenceId: result!.id, itemKey: photoReq.itemKey });
      setPhotoReq(null);
      setPhotoPreview(null);
      setBanner("Photo sent — thank you!");
    } catch {
      setBanner("The photo didn't send — please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  if (ended)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <PrototypeBanner client />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-slate-800">Thank you — your assessment is complete</h1>
            <p className="text-sm text-slate-600 mt-3 max-w-sm">
              {assessorName} has what they need for now. If anything else is required,
              we&apos;ll send you a simple upload link. The claims team will be in touch
              about next steps. You can close this page.
            </p>
          </div>
        </div>
      </div>
    );

  // High-res photo request takes over the screen (one clear task at a time).
  if (photoReq)
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <PrototypeBanner client />
        <div className="bg-violet-700 text-white text-sm rounded-b-2xl px-4 py-3 text-center">📸 {photoReq.instruction}</div>
        <div className="flex-1 relative">
          {photoPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoPreview.url} alt="Your photo" className="absolute inset-0 w-full h-full object-contain" />
          ) : (
            <video ref={localRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        <div className="bg-slate-900 p-4 flex gap-3 justify-center items-center">
          {photoPreview ? (
            <>
              <button disabled={photoBusy} onClick={() => setPhotoPreview(null)} className="bg-slate-700 text-white rounded-xl px-5 py-3 text-sm font-semibold">Retake</button>
              <button disabled={photoBusy} onClick={usePhoto} className="bg-emerald-600 disabled:opacity-50 text-white rounded-xl px-6 py-3 text-sm font-bold">
                {photoBusy ? "Sending…" : "Use photo ✓"}
              </button>
            </>
          ) : (
            <button disabled={photoBusy} onClick={takePhoto} className="bg-white text-slate-900 rounded-full w-16 h-16 text-2xl font-bold shadow disabled:opacity-50" title="Take photo">
              {photoBusy ? "…" : "📷"}
            </button>
          )}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <PrototypeBanner client />
      <div className="flex-1 relative">
        <video ref={localRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        {banner && (
          <div className="absolute top-3 left-3 right-3 bg-blue-600/90 text-white text-sm rounded-xl px-4 py-3 text-center">{banner}</div>
        )}
        {/* Assessor thumbnail (placeholder until remote video arrives) */}
        <div className="absolute right-3 top-16 w-20 h-28 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden flex items-center justify-center">
          <video ref={remoteRef} autoPlay playsInline className={`w-full h-full object-cover ${hasRemote ? "" : "hidden"}`} />
          {!hasRemote && <span className="text-[9px] text-slate-400 text-center px-1">{assessorName}</span>}
        </div>
        {conn === "reconnecting" && (
          <div className="absolute inset-x-6 top-1/3 bg-slate-900/90 text-slate-100 text-sm rounded-2xl px-4 py-4 text-center">
            Connection lost — reconnecting you…<br />
            <span className="text-xs text-slate-400">Stay on this page; it recovers by itself.</span>
          </div>
        )}
        {flash && (
          <div className="absolute inset-x-0 top-1/3 text-center pointer-events-none">
            <span className="bg-white/90 text-slate-900 text-sm font-semibold rounded-full px-4 py-2">📸 Photo taken ✓</span>
          </div>
        )}
        {torchMsg && (
          <div className="absolute bottom-24 inset-x-6 bg-slate-900/90 text-slate-100 text-xs rounded-xl px-3 py-2 text-center">{torchMsg}</div>
        )}
      </div>
      <div className="bg-slate-900 p-4 flex gap-3 justify-center">
        <button onClick={flip} className="bg-slate-700 text-white rounded-full w-14 h-14 text-xl" title="Flip camera">🔄</button>
        <button onClick={torch} className={`rounded-full w-14 h-14 text-xl ${torchOn ? "bg-amber-400" : "bg-slate-700 text-white"}`} title="Torch">🔦</button>
        <button
          onClick={() => { if (confirm("Leave the assessment?")) { void adapterRef.current?.leaveRoom(); setEnded(true); } }}
          className="bg-rose-800 text-white rounded-full w-14 h-14 text-xl" title="Leave"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
