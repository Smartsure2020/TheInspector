"use client";
// S12 assessor view — the live assessment workstation. Provider-agnostic:
// depends only on `SessionAdapter`, so LiveKit/Daily can be swapped in later
// without touching this file.
//
// HARD REQUIREMENTS (phase1/04) — unchanged by the UX pass:
//   select checklist item → ONE click or hotkey (C / Space) → auto-labelled
//   evidence thumbnail appears immediately → NO modal → the assessor never
//   leaves the video. Upload continues in the background; save state is visible.
//
// What the UX pass changed: a deliberate three-zone workstation layout, the
// capture control is now unmistakably the primary control and always states
// what the next capture will be filed against, connection and save states are
// stated in words as well as colour, guidance prompts are one labelled toolbar
// showing what the client is currently reading, and the end-session summary is
// a real dialog with focus management.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrototypeBanner } from "@/components/Chrome";
import { Icon, IconName } from "@/components/ui/Icon";
import { Modal, LiveRegion } from "@/components/ui/Overlay";
import { TemplateSection } from "@/lib/types";
import { GUIDANCE, promptLabel } from "@/lib/prompts";
import { formatClock } from "@/lib/format";
import { Presence, RoomMessage, SessionAdapter, ConnectionState } from "@/lib/video/adapter";
import { createAdapter, getAdapterType } from "@/lib/video/create-adapter";
import {
  admitClientAction, endSessionAction, saveCaptureAction, saveResponseAction, sessionNetworkEventAction,
} from "@/lib/actions";

interface ResponseState {
  answer?: unknown; note?: string; concernFlag?: boolean; concernNote?: string;
  missing?: boolean; missingReason?: string;
}
interface TrayItem {
  key: number; url: string; label: string; itemKey: string | null;
  status: "saving" | "saved" | "failed"; ms?: number; kind: "frame" | "highres";
  evidenceId?: string;
}
let trayKey = 0;

const MISSING_REASONS = ["not available", "client can't access", "will upload later", "other"];

// ---------------------------------------------------------------------------
// Connection state — words + icon, never a bare coloured dot
// ---------------------------------------------------------------------------

const CONN: Record<ConnectionState, { label: string; detail: string; icon: IconName; className: string }> = {
  idle: { label: "Not connected", detail: "Waiting to join the room", icon: "wifiOff", className: "border-room-line-strong bg-room-panel-2 text-on-dark-muted" },
  connecting: { label: "Connecting", detail: "Negotiating the video link", icon: "spinner", className: "border-conn-connecting/50 bg-conn-connecting/15 text-conn-connecting" },
  connected: { label: "Live", detail: "Client video is flowing", icon: "wifi", className: "border-conn-connected/50 bg-conn-connected/15 text-conn-connected" },
  reconnecting: { label: "Reconnecting", detail: "Connection dropped — trying to recover", icon: "refresh", className: "border-conn-reconnecting/50 bg-conn-reconnecting/20 text-conn-reconnecting" },
  ended: { label: "Ended", detail: "The session has closed", icon: "wifiOff", className: "border-room-line-strong bg-room-panel-2 text-on-dark-muted" },
};

function ConnectionBadge({ conn }: { conn: ConnectionState }) {
  const c = CONN[conn];
  return (
    <span
      title={c.detail}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${c.className}`}
    >
      <Icon name={c.icon} size={13} className={conn === "connecting" ? "animate-spin" : ""} />
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------

export function AssessorRoom(props: {
  jobId: string; jobNumber: string; clientName: string;
  templateName: string; templateVersion: string; sections: TemplateSection[];
  initialResponses: Record<string, ResponseState>;
  initialCounts: Record<string, number>;
  hasActiveSession: boolean;
  jobStatus: string;
}) {
  const { jobId, sections } = props;
  const router = useRouter();
  const adapterRef = useRef<SessionAdapter | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [conn, setConn] = useState<ConnectionState>("idle");
  const [presence, setPresence] = useState<Presence>({ assessor: true, client: false, waiting: false });
  const [admitted, setAdmitted] = useState(props.hasActiveSession);
  const [admitting, setAdmitting] = useState(false);
  const [hasClientVideo, setHasClientVideo] = useState(false);
  const [active, setActive] = useState<string | undefined>();
  const [responses, setResponses] = useState<Record<string, ResponseState>>(props.initialResponses);
  const [counts, setCounts] = useState<Record<string, number>>(props.initialCounts);
  const [tray, setTray] = useState<TrayItem[]>([]);
  const [flash, setFlash] = useState(false);
  const [banner, setBanner] = useState("");
  const [activePrompt, setActivePrompt] = useState<string>("");
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [photoPending, setPhotoPending] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [ending, setEnding] = useState(false);
  const [lastCaptureMs, setLastCaptureMs] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [announce, setAnnounce] = useState("");
  const [muted, setMuted] = useState(false);
  const [started] = useState(() => Date.now());
  const [clock, setClock] = useState("00:00");

  const itemsByKey = useMemo(() => {
    const m = new Map<string, { section: TemplateSection; item: TemplateSection["items"][number] }>();
    for (const s of sections) for (const i of s.items) m.set(i.key, { section: s, item: i });
    return m;
  }, [sections]);
  const activeInfo = active ? itemsByKey.get(active) : undefined;

  const say = (t: string) => { setToast(t); setAnnounce(t); setTimeout(() => setToast(""), 3500); };

  // ---- adapter lifecycle ----
  useEffect(() => {
    let cancelled = false;
    let prevConn: ConnectionState = "idle";
    (async () => {
      const adapter = await createAdapter();
      if (cancelled) { void adapter.leaveRoom(); return; }
      adapterRef.current = adapter;
      await adapter.resolveRoom(`job-${jobId}`);
      await adapter.joinRoom("assessor", {
        onLocalStream: (s) => { if (localVideoRef.current) localVideoRef.current.srcObject = s; },
        onRemoteStream: (s) => {
          setHasClientVideo(!!s);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = s;
        },
        onConnectionState: (s) => {
          setConn(s);
          setAnnounce(`${CONN[s].label} — ${CONN[s].detail}`);
          if (prevConn === "connected" && s === "reconnecting") void sessionNetworkEventAction(jobId, "client_disconnected");
          if (prevConn === "reconnecting" && s === "connected") void sessionNetworkEventAction(jobId, "client_reconnected");
          prevConn = s;
        },
        onPresence: setPresence,
        onMessage: (m: RoomMessage) => {
          if (m.type === "photo_delivered") {
            setPhotoPending(null);
            setCounts((c) => ({ ...c, [m.itemKey]: (c[m.itemKey] ?? 0) + 1 }));
            const trayItem: TrayItem = {
              key: ++trayKey,
              url: `/api/files/${m.evidenceId}`,
              label: `HIGH-RES – ${itemsByKey.get(m.itemKey)?.item.prompt.slice(0, 28) ?? m.itemKey}`,
              itemKey: m.itemKey, status: "saved", kind: "highres", evidenceId: m.evidenceId,
            };
            setTray((t) => [trayItem, ...t].slice(0, 40));
            say("High-res photo received — open it in the tray to check legibility");
          }
        },
        onError: (e) => say(e),
      });
    })();
    return () => { cancelled = true; void adapterRef.current?.leaveRoom(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(t);
  }, [started]);

  // ---- capture loop (the hard requirement — one click, no modal) ----
  const capture = useCallback(async () => {
    const adapter = adapterRef.current;
    const video = remoteVideoRef.current;
    if (!adapter || !video || !video.srcObject) { say("No client video to capture yet"); return; }
    const t0 = performance.now();
    const info = active ? itemsByKey.get(active) : undefined;
    const now = new Date().toTimeString().slice(0, 8);
    const label = info ? `${info.section.title} – ${info.item.prompt.slice(0, 40)} – ${now}` : `UNFILED – ${now}`;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) { say("Capture failed — nothing was saved. Try again."); return; }

    const url = URL.createObjectURL(blob);
    const key = ++trayKey;
    const ms = Math.round(performance.now() - t0);
    setLastCaptureMs(ms);
    const trayItem: TrayItem = { key, url, label, itemKey: active ?? null, status: "saving", kind: "frame" , ms };
    setTray((t) => [trayItem, ...t].slice(0, 40));
    setFlash(true); setTimeout(() => setFlash(false), 260);
    setAnnounce(info ? `Captured for ${info.item.prompt.slice(0, 40)} — saving` : "Captured as unfiled — saving");
    if (active) setCounts((c) => ({ ...c, [active]: (c[active] ?? 0) + 1 }));
    adapter.sendMessage("client", { type: "capture_taken" });

    const fd = new FormData();
    fd.set("file", new File([blob], "capture.jpg", { type: "image/jpeg" }));
    saveCaptureAction(jobId, active ?? null, label, fd)
      .then(({ id }) => {
        setTray((t) => t.map((x) => (x.key === key ? { ...x, status: "saved", evidenceId: id } : x)));
        setAnnounce("Capture saved");
      })
      .catch(() => {
        setTray((t) => t.map((x) => (x.key === key ? { ...x, status: "failed" } : x)));
        setAnnounce("A capture failed to save. It is marked in the tray — capture it again.");
      });
  }, [active, itemsByKey, jobId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return;
      if (e.key.toLowerCase() === "c" || e.key === " ") {
        e.preventDefault();
        void capture();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [capture]);

  // ---- checklist state helpers (optimistic local + background persist) ----
  const patchLocal = (itemKey: string, p: Partial<ResponseState>) =>
    setResponses((r) => ({ ...r, [itemKey]: { ...r[itemKey], ...p } }));

  const setAnswer = (itemKey: string, answer: unknown) => {
    patchLocal(itemKey, { answer });
    void saveResponseAction(jobId, itemKey, { answer });
  };
  const setNote = (itemKey: string, note: string) => {
    patchLocal(itemKey, { note });
    void saveResponseAction(jobId, itemKey, { note });
  };
  const toggleConcern = (itemKey: string) => {
    const next = !responses[itemKey]?.concernFlag;
    patchLocal(itemKey, { concernFlag: next });
    void saveResponseAction(jobId, itemKey, { concernFlag: next, concernNote: responses[itemKey]?.concernNote });
  };
  const setMissing = (itemKey: string, flag: boolean, reason?: string) => {
    patchLocal(itemKey, { missing: flag, missingReason: reason });
    void saveResponseAction(jobId, itemKey, { missing: { flag, reason } });
  };

  const pushBanner = (text: string, promptName = "") => {
    setBanner(text);
    setActivePrompt(promptName);
    adapterRef.current?.sendMessage("client", { type: "banner", text });
  };
  const selectItem = (itemKey: string) => {
    setActive(itemKey);
    const info = itemsByKey.get(itemKey);
    if (info?.item.clientInstruction) pushBanner(info.item.clientInstruction, "Checklist instruction");
  };
  const sendPrompt = (kind: string) => {
    adapterRef.current?.sendMessage("client", { type: "prompt", kind: kind as never });
    setActivePrompt(promptLabel(kind) ?? kind);
    setBanner(GUIDANCE.find((g) => g.kind === kind)?.clientText ?? "");
    setGuidanceOpen(false);
  };
  const requestPhoto = () => {
    if (!activeInfo) return;
    setPhotoPending(activeInfo.item.key);
    adapterRef.current?.sendMessage("client", {
      type: "photo_request",
      itemKey: activeInfo.item.key,
      instruction: activeInfo.item.clientInstruction ?? `Please photograph: ${activeInfo.item.prompt}`,
    });
    setAnnounce("High-resolution photo requested from the client");
    setTimeout(() => setPhotoPending((p) => (p === activeInfo.item.key ? null : p)), 90000);
  };

  const admit = async () => {
    setAdmitting(true);
    try {
      const { sessionId } = await admitClientAction(jobId);
      void sessionId;
      setAdmitted(true);
      adapterRef.current?.sendMessage("waiting", { type: "banner", text: "__ADMIT__" });
      setAnnounce(`${props.clientName} has been admitted — the session has started`);
    } catch (e) {
      say(e instanceof Error ? e.message : "Could not admit the client");
    } finally {
      setAdmitting(false);
    }
  };

  // ---- summary stats ----
  const stats = useMemo(() => {
    let required = 0, done = 0;
    const missing: string[] = [];
    let concerns = 0;
    for (const s of sections) for (const i of s.items) {
      const r = responses[i.key];
      const evid = counts[i.key] ?? 0;
      const needsEvidence = i.evidenceRequired;
      const answered = r?.answer !== undefined && r?.answer !== null;
      required++;
      if (r?.missing) missing.push(i.key);
      else if ((needsEvidence ? evid > 0 : true) && (i.answerType === "evidence_only" ? evid > 0 : answered)) done++;
      if (r?.concernFlag) concerns++;
    }
    return { required, done, missing, concerns, captures: tray.length };
  }, [sections, responses, counts, tray.length]);

  const savingCount = tray.filter((t) => t.status === "saving").length;
  const failedCount = tray.filter((t) => t.status === "failed").length;

  const endSession = async (outcome: "Awaiting evidence" | "Awaiting report") => {
    setEnding(true);
    try {
      adapterRef.current?.sendMessage("client", { type: "session_ended" });
      await endSessionAction(jobId, outcome);
      router.push(`/jobs/${jobId}/evidence`);
    } catch (e) {
      setEnding(false);
      say(e instanceof Error ? e.message : "Could not end the session");
    }
  };

  const captureTarget = activeInfo
    ? `${activeInfo.section.title} — ${activeInfo.item.prompt}`
    : null;

  return (
    <div className="on-room flex h-dvh flex-col bg-room-bg text-on-dark">
      <PrototypeBanner />

      {/* ================= Session status region ========================== */}
      <header className="shrink-0 border-b border-room-line bg-room-panel px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-room-line-strong px-2 py-1 text-xs font-medium text-on-dark-muted transition-colors hover:bg-room-panel-2 hover:text-on-dark"
          >
            <Icon name="chevronLeft" size={13} />
            <span className="tnum">{props.jobNumber}</span>
          </Link>

          <span className="text-sm font-medium text-on-dark">{props.clientName}</span>

          <span
            className="inline-flex items-center gap-1.5 rounded-md border border-room-line-strong px-2 py-1 text-xs text-on-dark-muted"
            title="Time since you opened this room"
          >
            <Icon name="clock" size={13} />
            <span className="tnum">{clock}</span>
          </span>

          <ConnectionBadge conn={conn} />

          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
            admitted
              ? "border-conn-connected/40 bg-conn-connected/10 text-conn-connected"
              : presence.waiting
                ? "border-conn-connecting/50 bg-conn-connecting/15 text-conn-connecting"
                : "border-room-line-strong text-on-dark-muted"
          }`}>
            <Icon name={admitted ? "user" : presence.waiting ? "admit" : "clock"} size={13} />
            {admitted ? "Client admitted" : presence.waiting ? "Client in waiting room" : "Client not arrived"}
          </span>

          {/* Progress / evidence counters */}
          <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-dark-muted">
            <span title="Checklist items complete">
              <Icon name="check" size={12} className="mr-1 inline align-[-2px]" />
              <span className="tnum text-on-dark">{stats.done}/{stats.required}</span> complete
            </span>
            <span className={stats.missing.length ? "text-conn-reconnecting" : undefined} title="Items flagged as missing">
              <Icon name="warning" size={12} className="mr-1 inline align-[-2px]" />
              <span className="tnum">{stats.missing.length}</span> missing
            </span>
            <span className={stats.concerns ? "text-conn-disconnected" : undefined} title="Concern flags (staff-only)">
              <Icon name="flag" size={12} className="mr-1 inline align-[-2px]" />
              <span className="tnum">{stats.concerns}</span> concerns
            </span>
            <span title="Captures made in this session">
              <Icon name="image" size={12} className="mr-1 inline align-[-2px]" />
              <span className="tnum">{tray.length}</span> captures
            </span>
            <span className="hidden xl:inline text-on-dark-muted/60" title="Active video adapter">
              {getAdapterType().toUpperCase()}
            </span>
          </span>
        </div>
      </header>

      {/* ================= Primary zone + workflow panel ================== */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.9fr)] xl:grid-cols-[minmax(0,2fr)_minmax(23rem,0.8fr)]">
        {/* ---------------- Video stage --------------------------------- */}
        <div className="relative flex min-h-0 flex-col bg-room-stage">
          <div className={`relative min-h-0 flex-1 overflow-hidden ${flash ? "anim-flash" : ""}`}>
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-contain" />

            {/* Waiting / admission overlay */}
            {!admitted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-room-bg/95 p-6 text-center">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
                  presence.waiting ? "border-conn-connected/50 bg-conn-connected/15 text-conn-connected" : "border-room-line-strong text-on-dark-muted"
                }`}>
                  <Icon name={presence.waiting ? "admit" : "clock"} size={24} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-on-dark">
                  {presence.waiting
                    ? `${props.clientName} is in the waiting room`
                    : `Waiting for ${props.clientName} to arrive`}
                </h2>
                <p className="mt-2 max-w-md text-sm text-on-dark-muted">
                  {presence.waiting
                    ? "They can see a holding screen. Admitting them starts the session and logs it against the job."
                    : "This panel updates live as the client opens their link, accepts consent and passes the device check."}
                </p>
                <button
                  type="button"
                  onClick={() => void admit()}
                  disabled={(!presence.waiting && !presence.client) || admitting}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-md border border-accent bg-accent px-5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name={admitting ? "spinner" : "admit"} size={16} className={admitting ? "animate-spin" : ""} />
                  {admitting ? "Admitting…" : "Admit client & start session"}
                </button>
                {!presence.waiting && !presence.client && (
                  <p className="mt-2 text-xs text-on-dark-muted/80">
                    Admitting becomes available once the client reaches the waiting room.
                  </p>
                )}
                {props.jobStatus !== "Scheduled" && props.jobStatus !== "In progress" && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-conn-reconnecting/40 bg-conn-reconnecting/10 px-2.5 py-1.5 text-xs text-conn-reconnecting">
                    <Icon name="warning" size={13} />
                    This job is “{props.jobStatus}”, not Scheduled — check you have the right job.
                  </p>
                )}
              </div>
            )}

            {/* Connection state over live video */}
            {admitted && conn !== "connected" && (
              <div className="absolute inset-x-0 top-3 flex justify-center px-3">
                <p className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${CONN[conn].className}`}>
                  <Icon name={CONN[conn].icon} size={15} className={conn === "connecting" ? "animate-spin" : ""} />
                  <span className="font-medium">{CONN[conn].label}</span>
                  <span className="opacity-80">— {conn === "reconnecting" ? "the client’s connection dropped; captures are paused" : "no client video yet"}</span>
                </p>
              </div>
            )}
            {admitted && conn === "connected" && !hasClientVideo && (
              <div className="absolute inset-x-0 top-3 flex justify-center px-3">
                <p className="inline-flex items-center gap-2 rounded-md border border-conn-reconnecting/50 bg-conn-reconnecting/15 px-3 py-1.5 text-sm text-conn-reconnecting">
                  <Icon name="videoOff" size={15} />
                  Client camera unavailable — ask them to allow camera access
                </p>
              </div>
            )}

            {/* What the client is currently reading */}
            {banner && (
              <div className="absolute right-3 top-3 max-w-[22rem] rounded-md border border-room-line-strong bg-room-bg/85 px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs font-medium text-on-dark-muted">
                  <Icon name="eye" size={12} />
                  Client is reading{activePrompt ? ` · ${activePrompt}` : ""}
                </p>
                <p className="mt-1 text-sm text-on-dark">“{banner}”</p>
              </div>
            )}

            {/* Self view */}
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              aria-label="Your own camera"
              className="absolute bottom-3 right-3 h-20 w-28 rounded-sm border border-room-line-strong bg-room-bg object-cover"
            />

            {toast && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
                <p className="rounded-md border border-room-line-strong bg-room-bg/95 px-3 py-2 text-sm text-on-dark shadow-2">{toast}</p>
              </div>
            )}
          </div>

          {/* ---------------- Capture bar (the primary control) ---------- */}
          <div className="shrink-0 border-t border-room-line bg-room-panel px-3 py-2.5">
            {/* Capture target — states plainly what the next capture is filed against */}
            {!hasClientVideo ? (
              <p className="mb-2 flex items-start gap-1.5 text-xs text-conn-reconnecting">
                <Icon name="videoOff" size={13} className="mt-0.5" />
                <span>
                  No client video yet — there is nothing to capture. Capture becomes
                  available the moment the client’s camera reaches you.
                </span>
              </p>
            ) : (
              <p className={`mb-2 flex items-start gap-1.5 text-xs ${captureTarget ? "text-on-dark-muted" : "text-conn-reconnecting"}`}>
                <Icon name={captureTarget ? "capture" : "warning"} size={13} className="mt-0.5" />
                {captureTarget
                  ? <span>Capturing for: <span className="font-medium text-on-dark">{captureTarget}</span></span>
                  : <span>No checklist item selected — the next capture will be saved as <strong>unfiled</strong> and must be filed later.</span>}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void capture()}
                disabled={!hasClientVideo}
                title={hasClientVideo ? "Capture the current client frame (C or Space)" : "There is no client video to capture yet"}
                className="inline-flex h-12 items-center gap-2.5 rounded-md border border-on-dark bg-on-dark px-5 text-base font-semibold text-room-bg transition-colors hover:bg-white disabled:cursor-not-allowed disabled:border-room-line-strong disabled:bg-room-panel-2 disabled:text-on-dark-muted"
              >
                <Icon name="capture" size={20} />
                Capture
                <kbd className="ml-1 rounded-sm border border-current/30 px-1.5 py-0.5 text-xs font-medium opacity-70">C</kbd>
              </button>

              <button
                type="button"
                disabled={!activeInfo || !!photoPending}
                onClick={requestPhoto}
                title={activeInfo
                  ? `Ask the client to take a high-resolution photo of: ${activeInfo.item.prompt}`
                  : "Select a checklist item first — the request is filed against it"}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-room-line-strong bg-room-panel-2 px-3.5 text-sm font-medium text-on-dark transition-colors hover:bg-room-line disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name={photoPending ? "spinner" : "photoRequest"} size={16} className={photoPending ? "animate-spin" : ""} />
                {photoPending ? "Waiting for their photo…" : "Request high-res photo"}
              </button>

              {/* Guidance toolbar — compact, labelled, shows what is active */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGuidanceOpen((o) => !o)}
                  aria-expanded={guidanceOpen}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-room-line-strong bg-room-panel-2 px-3.5 text-sm font-medium text-on-dark transition-colors hover:bg-room-line"
                >
                  <Icon name="note" size={16} />
                  Guide the client
                  <Icon name="chevronDown" size={13} />
                </button>
                {guidanceOpen && (
                  <div
                    role="group"
                    aria-label="Client guidance prompts"
                    className="anim-sheet absolute bottom-full left-0 z-20 mb-2 w-64 rounded-md border border-room-line-strong bg-room-panel p-2 shadow-2"
                  >
                    <p className="px-1 pb-1.5 text-xs font-medium text-on-dark-muted">Framing</p>
                    <div className="grid grid-cols-2 gap-1">
                      {GUIDANCE.filter((g) => g.group === "framing").map((g) => (
                        <button
                          key={g.kind}
                          type="button"
                          onClick={() => sendPrompt(g.kind)}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-room-line px-2 py-1.5 text-left text-xs text-on-dark transition-colors hover:bg-room-panel-2"
                        >
                          <Icon name={g.icon} size={13} />
                          {g.staffLabel}
                        </button>
                      ))}
                    </div>
                    <p className="px-1 pb-1.5 pt-2.5 text-xs font-medium text-on-dark-muted">Their device</p>
                    <div className="grid grid-cols-2 gap-1">
                      {GUIDANCE.filter((g) => g.group === "device").map((g) => (
                        <button
                          key={g.kind}
                          type="button"
                          onClick={() => sendPrompt(g.kind)}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-room-line px-2 py-1.5 text-left text-xs text-on-dark transition-colors hover:bg-room-panel-2"
                        >
                          <Icon name={g.icon} size={13} />
                          {g.staffLabel}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => { pushBanner(""); setGuidanceOpen(false); }}
                      className="mt-2 w-full rounded-sm px-2 py-1.5 text-xs text-on-dark-muted transition-colors hover:bg-room-panel-2 hover:text-on-dark"
                    >
                      Clear the client’s instruction
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setMuted(!muted); adapterRef.current?.setMuted(!muted); }}
                aria-pressed={muted}
                className={`inline-flex h-10 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors ${
                  muted
                    ? "border-conn-disconnected/60 bg-conn-disconnected/15 text-conn-disconnected"
                    : "border-room-line-strong bg-room-panel-2 text-on-dark hover:bg-room-line"
                }`}
              >
                <Icon name="mic" size={16} />
                {muted ? "Your mic is muted" : "Mute my mic"}
              </button>

              {/* Save state — visible, in words */}
              <span className="ml-auto flex items-center gap-3 text-xs">
                {savingCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-conn-connecting">
                    <Icon name="spinner" size={13} className="animate-spin" />
                    Saving {savingCount}
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-conn-disconnected">
                    <Icon name="alert" size={13} />
                    {failedCount} failed to save
                  </span>
                )}
                {savingCount === 0 && failedCount === 0 && tray.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-conn-connected">
                    <Icon name="checkCircle" size={13} />
                    All captures saved
                  </span>
                )}
                {lastCaptureMs !== null && (
                  <span className="hidden text-on-dark-muted/70 tnum xl:inline" title="Time to grab the last frame">
                    {lastCaptureMs} ms
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowSummary(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-conn-disconnected/60 bg-conn-disconnected/15 px-3.5 text-sm font-medium text-conn-disconnected transition-colors hover:bg-conn-disconnected/25"
                >
                  <Icon name="end" size={16} />
                  End session
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* ---------------- Checklist workflow panel -------------------- */}
        <div className="flex min-h-0 flex-col border-t border-room-line bg-room-panel lg:border-l lg:border-t-0">
          <div className="shrink-0 border-b border-room-line px-3 py-2.5">
            <p className="text-sm font-medium text-on-dark">{props.templateName}</p>
            <p className="mt-0.5 text-xs text-on-dark-muted">
              <span className="font-mono">v{props.templateVersion}</span> · select an item, then press Capture (C or Space)
            </p>
            <div className="mt-2.5">
              <div
                role="progressbar"
                aria-valuenow={stats.done}
                aria-valuemin={0}
                aria-valuemax={stats.required}
                aria-label="Checklist items complete"
                aria-valuetext={`${stats.done} of ${stats.required} items complete`}
                className="h-1.5 w-full overflow-hidden rounded-full bg-room-line"
              >
                <div className="h-full rounded-full bg-conn-connected transition-[width] duration-300" style={{ width: `${stats.required ? Math.round((stats.done / stats.required) * 100) : 0}%` }} />
              </div>
              <p className="mt-1 text-xs text-on-dark-muted tnum">{stats.done} of {stats.required} items complete</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {sections.map((s) => (
              <section key={s.key} className="mb-3">
                <h3 className="sticky top-0 z-10 -mx-2 mb-1 bg-room-panel px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-dark-muted">
                  {s.title}
                </h3>
                <ul className="space-y-1">
                  {s.items.map((i) => (
                    <ChecklistItem
                      key={i.key}
                      item={i}
                      sectionTitle={s.title}
                      isActive={active === i.key}
                      r={responses[i.key] ?? {}}
                      count={counts[i.key] ?? 0}
                      photoPending={photoPending === i.key}
                      onSelect={() => selectItem(i.key)}
                      onAnswer={(v) => setAnswer(i.key, v)}
                      onNote={(v) => setNote(i.key, v)}
                      onConcern={() => toggleConcern(i.key)}
                      onMissing={(flag, reason) => setMissing(i.key, flag, reason)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* ================= Evidence tray ================================= */}
      <div className="shrink-0 border-t border-room-line bg-room-panel">
        <div className="flex items-center gap-2 px-3 pt-1.5">
          <h2 className="text-xs font-semibold text-on-dark">
            Evidence tray <span className="tnum font-normal text-on-dark-muted">({tray.length} this session)</span>
          </h2>
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-conn-disconnected">
              <Icon name="alert" size={12} />
              {failedCount} need recapturing
            </span>
          )}
          <Link
            href={`/jobs/${jobId}/evidence`}
            target="_blank"
            className="ml-auto inline-flex items-center gap-1 text-xs text-on-dark-muted transition-colors hover:text-on-dark"
          >
            Full gallery
            <Icon name="external" size={12} />
          </Link>
        </div>

        <div className="scroll-x flex items-start gap-2 px-3 pb-2 pt-1.5">
          {tray.length === 0 && (
            <p className="py-3 text-xs text-on-dark-muted">
              Nothing captured yet. Select a checklist item on the right, then press
              Capture (or C / Space) — the thumbnail appears here immediately.
            </p>
          )}
          {tray.slice(0, 12).map((c) => {
            const state =
              c.status === "saved" ? { label: "Saved", icon: "checkCircle" as IconName, cls: "text-conn-connected" }
              : c.status === "failed" ? { label: "Not saved", icon: "alert" as IconName, cls: "text-conn-disconnected" }
              : { label: "Saving…", icon: "spinner" as IconName, cls: "text-conn-connecting" };
            const filedTo = c.itemKey ? itemsByKey.get(c.itemKey)?.item.prompt : null;
            return (
              <a
                key={c.key}
                href={c.evidenceId ? `/api/files/${c.evidenceId}` : c.url}
                target="_blank"
                className="w-32 shrink-0 rounded-sm border border-room-line bg-room-panel-2 p-1 transition-colors hover:border-room-line-strong"
                title={`${c.label} — open full size`}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.url}
                    alt={c.label}
                    className={`h-16 w-full rounded-sm object-cover ${c.status === "failed" ? "opacity-50" : ""} ${c.kind === "highres" ? "outline outline-2 outline-offset-[-2px] outline-status-info" : ""}`}
                  />
                  <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-sm bg-room-bg/85 px-1 py-0.5 text-xs text-on-dark">
                    <Icon name={c.kind === "highres" ? "hires" : "capture"} size={10} />
                    {c.kind === "highres" ? "Hi-res" : "Frame"}
                  </span>
                </div>
                <p className={`mt-1 flex items-center gap-1 text-xs ${state.cls}`}>
                  <Icon name={state.icon} size={11} className={c.status === "saving" ? "animate-spin" : ""} />
                  {state.label}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-on-dark-muted">
                  {filedTo ?? "Unfiled — file it in the gallery"}
                </p>
              </a>
            );
          })}
        </div>
      </div>

      {/* ================= End-session review ============================ */}
      <Modal
        open={showSummary}
        onClose={() => setShowSummary(false)}
        title="End session — review before you close"
        description="Choose the outcome that matches what actually happened. Both options end the video call for the client."
        size="lg"
        blockEscape={ending}
        footer={
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={() => void endSession("Awaiting evidence")}
              disabled={stats.missing.length === 0 || ending}
              title={stats.missing.length === 0 ? "Nothing is flagged as missing, so there is nothing for the client to upload" : undefined}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-status-warning-line bg-status-warning-bg px-4 text-sm font-medium text-status-warning transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="images" size={16} />
              End — items outstanding → Awaiting evidence
            </button>
            <button
              type="button"
              onClick={() => void endSession("Awaiting report")}
              disabled={ending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-foreground bg-foreground px-4 text-sm font-medium text-on-dark transition-colors hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="document" size={16} />
              End — evidence complete → Awaiting report
            </button>
            <button
              type="button"
              onClick={() => setShowSummary(false)}
              disabled={ending}
              className="h-9 w-full rounded-md text-sm text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-40"
            >
              Back to the session
            </button>
          </div>
        }
      >
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {[
            { term: "Items complete", value: `${stats.done} / ${stats.required}`, tone: "" },
            { term: "Flagged missing", value: String(stats.missing.length), tone: stats.missing.length ? "text-status-warning" : "" },
            { term: "Concern flags", value: String(stats.concerns), tone: stats.concerns ? "text-status-error" : "" },
            { term: "Captures", value: String(stats.captures), tone: "" },
          ].map((s) => (
            <div key={s.term}>
              <dt className="text-xs text-muted">{s.term}</dt>
              <dd className={`mt-0.5 text-2xl font-semibold tnum leading-none text-foreground ${s.tone}`}>{s.value}</dd>
            </div>
          ))}
        </dl>

        {savingCount > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-md border border-status-info-line bg-status-info-bg px-3 py-2 text-sm text-status-info">
            <Icon name="spinner" size={15} className="animate-spin" />
            {savingCount} capture{savingCount === 1 ? "" : "s"} still uploading — give it a moment before you end.
          </p>
        )}
        {failedCount > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-md border border-status-error-line bg-status-error-bg px-3 py-2 text-sm text-status-error">
            <Icon name="alert" size={15} className="mt-0.5" />
            {failedCount} capture{failedCount === 1 ? "" : "s"} did not save. They are not on the job — recapture them before ending if you still can.
          </p>
        )}

        {stats.missing.length > 0 ? (
          <div className="mt-4 rounded-md border border-status-warning-line bg-status-warning-bg p-3">
            <p className="text-sm font-semibold text-status-warning">
              {stats.missing.length} item{stats.missing.length === 1 ? "" : "s"} the client still needs to provide
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-foreground">
              {stats.missing.map((k) => (
                <li key={k} className="flex gap-2">
                  <Icon name="dot" size={9} className="mt-1.5 text-status-warning" />
                  <span>
                    {itemsByKey.get(k)?.item.prompt ?? k}
                    {responses[k]?.missingReason && <span className="text-muted"> — {responses[k].missingReason}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-status-warning">
              Choosing “Awaiting evidence” lets the client upload these on their link.
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted">
            Nothing is flagged as missing, so “Awaiting evidence” is unavailable —
            there would be nothing for the client to upload.
          </p>
        )}

        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <Icon name="info" size={15} className="mt-0.5 shrink-0" />
          Tell the client what happens next before you end — they only see a
          “thank you, we have what we need” screen afterwards.
        </p>
      </Modal>

      <LiveRegion message={announce} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist item
// ---------------------------------------------------------------------------

function ChecklistItem(props: {
  item: TemplateSection["items"][number];
  sectionTitle: string;
  isActive: boolean;
  r: ResponseState;
  count: number;
  photoPending: boolean;
  onSelect: () => void;
  onAnswer: (v: unknown) => void;
  onNote: (v: string) => void;
  onConcern: () => void;
  onMissing: (flag: boolean, reason?: string) => void;
}) {
  const { item: i, isActive, r, count } = props;
  const [noteOpen, setNoteOpen] = useState(!!r.note);
  const [missingOpen, setMissingOpen] = useState(false);

  const answered = r.answer !== undefined && r.answer !== null && r.answer !== "";
  const chip = "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs";

  return (
    <li
      className={`rounded-md border transition-colors ${
        isActive
          ? "border-accent bg-accent/15 shadow-[inset_3px_0_0_0_var(--accent)]"
          : r.missing
            ? "border-conn-reconnecting/50 bg-conn-reconnecting/10"
            : "border-room-line bg-room-panel-2 hover:border-room-line-strong"
      }`}
    >
      <button
        type="button"
        onClick={props.onSelect}
        aria-pressed={isActive}
        className="w-full px-2.5 py-2 text-left"
      >
        {isActive && (
          <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-accent-line">
            <Icon name="capture" size={11} />
            Active capture target
          </span>
        )}
        <span className="block text-sm leading-snug text-on-dark">{i.prompt}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1">
          {i.evidenceRequired && (
            <span className={`${chip} ${count > 0 ? "border-conn-connected/50 text-conn-connected" : "border-room-line-strong text-on-dark-muted"}`}>
              <Icon name="camera" size={11} />
              {count > 0 ? `${count} photo${count === 1 ? "" : "s"}` : "Photo required"}
            </span>
          )}
          {!i.evidenceRequired && count > 0 && (
            <span className={`${chip} border-conn-connected/50 text-conn-connected`}>
              <Icon name="image" size={11} />
              {count}
            </span>
          )}
          {i.highRes && (
            <span className={`${chip} border-status-info/60 text-status-info`}>
              <Icon name="hires" size={11} />
              High-res
            </span>
          )}
          {answered && (
            <span className={`${chip} border-conn-connected/50 text-conn-connected`}>
              <Icon name="check" size={11} />
              Answered
            </span>
          )}
          {r.note && (
            <span className={`${chip} border-room-line-strong text-on-dark-muted`}>
              <Icon name="note" size={11} />
              Note
            </span>
          )}
          {r.concernFlag && (
            <span className={`${chip} border-conn-disconnected/60 text-conn-disconnected`}>
              <Icon name="flag" size={11} />
              Concern
            </span>
          )}
          {r.missing && (
            <span className={`${chip} border-conn-reconnecting/60 text-conn-reconnecting`}>
              <Icon name="warning" size={11} />
              Missing — {r.missingReason}
            </span>
          )}
          {props.photoPending && (
            <span className={`${chip} border-status-info/60 text-status-info`}>
              <Icon name="spinner" size={11} className="animate-spin" />
              Photo requested
            </span>
          )}
        </span>
      </button>

      {isActive && (
        <div className="space-y-2 border-t border-accent/25 px-2.5 py-2">
          {i.clientInstruction && (
            <p className="flex items-start gap-1.5 rounded-sm bg-room-bg/40 px-2 py-1.5 text-xs text-on-dark-muted">
              <Icon name="eye" size={12} className="mt-0.5 shrink-0" />
              Client instruction: “{i.clientInstruction}”
            </p>
          )}

          {i.answerType === "yes_no" && (
            <div role="group" aria-label={`Answer: ${i.prompt}`} className="flex gap-1.5">
              {["Yes", "No"].map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={r.answer === v}
                  onClick={() => props.onAnswer(v)}
                  className={`h-8 min-w-[4rem] rounded-md border px-3 text-sm font-medium transition-colors ${
                    r.answer === v
                      ? "border-on-dark bg-on-dark text-room-bg"
                      : "border-room-line-strong text-on-dark hover:bg-room-panel-2"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {i.answerType === "choice" && (
            <div role="group" aria-label={`Answer: ${i.prompt}`} className="flex flex-wrap gap-1.5">
              {(i.options ?? []).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={r.answer === v}
                  onClick={() => props.onAnswer(v)}
                  className={`h-8 rounded-md border px-2.5 text-sm transition-colors ${
                    r.answer === v
                      ? "border-on-dark bg-on-dark font-medium text-room-bg"
                      : "border-room-line-strong text-on-dark hover:bg-room-panel-2"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {(i.answerType === "text" || i.answerType === "number") && (
            <div>
              <label htmlFor={`answer-${i.key}`} className="mb-1 block text-xs text-on-dark-muted">
                {i.answerType === "number" ? "Value" : "Answer"} — saves when you move away
              </label>
              <input
                id={`answer-${i.key}`}
                type={i.answerType === "number" ? "number" : "text"}
                defaultValue={(r.answer as string) ?? ""}
                onBlur={(e) => props.onAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                className="w-full"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNoteOpen((o) => !o)}
              aria-expanded={noteOpen}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
                r.note ? "border-on-dark/50 bg-room-bg/50 text-on-dark" : "border-room-line-strong text-on-dark-muted hover:text-on-dark"
              }`}
            >
              <Icon name="note" size={13} />
              {r.note ? "Edit note" : "Add note"}
            </button>

            {i.concernCapable !== false && (
              <button
                type="button"
                onClick={props.onConcern}
                aria-pressed={!!r.concernFlag}
                title="Concern flags are staff-only and never shown to the client"
                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
                  r.concernFlag
                    ? "border-conn-disconnected/60 bg-conn-disconnected/20 text-conn-disconnected"
                    : "border-room-line-strong text-on-dark-muted hover:text-conn-disconnected"
                }`}
              >
                <Icon name="flag" size={13} />
                {r.concernFlag ? "Concern flagged" : "Flag concern"}
              </button>
            )}

            {!r.missing ? (
              !missingOpen ? (
                <button
                  type="button"
                  onClick={() => setMissingOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-conn-reconnecting/50 px-2.5 text-xs text-conn-reconnecting transition-colors hover:bg-conn-reconnecting/15"
                >
                  <Icon name="warning" size={13} />
                  Can’t capture this
                </button>
              ) : (
                <div role="group" aria-label="Why can this not be captured?" className="flex w-full flex-wrap items-center gap-1.5 rounded-md border border-conn-reconnecting/40 bg-conn-reconnecting/10 p-1.5">
                  <span className="px-1 text-xs text-conn-reconnecting">Reason:</span>
                  {MISSING_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => { props.onMissing(true, reason); setMissingOpen(false); }}
                      className="h-7 rounded-sm border border-conn-reconnecting/50 px-2 text-xs text-conn-reconnecting transition-colors hover:bg-conn-reconnecting/20"
                    >
                      {reason}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMissingOpen(false)}
                    className="ml-auto h-7 rounded-sm px-2 text-xs text-on-dark-muted hover:text-on-dark"
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => props.onMissing(false)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-conn-reconnecting/60 bg-conn-reconnecting/20 px-2.5 text-xs text-conn-reconnecting transition-colors hover:bg-conn-reconnecting/30"
              >
                <Icon name="refresh" size={13} />
                Missing ({r.missingReason}) — undo
              </button>
            )}
          </div>

          {noteOpen && (
            <div>
              <label htmlFor={`note-${i.key}`} className="mb-1 block text-xs text-on-dark-muted">
                Staff note — flows into the report, never shown to the client
              </label>
              <textarea
                id={`note-${i.key}`}
                defaultValue={r.note ?? ""}
                onBlur={(e) => props.onNote(e.target.value)}
                rows={2}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
