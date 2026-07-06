"use client";
// S12 assessor view — REAL live room (Chunk 1D/1E/1F), provider-agnostic.
// Depends only on SessionAdapter; the P2P adapter is injected here and can be
// swapped for LiveKit/Daily later without touching this component.
//
// HARD REQUIREMENT (phase1/04): select checklist item → one click / hotkey →
// auto-labelled evidence thumbnail → NO modal → assessor stays in the video.
// Optimistic local thumbnails; upload continues in the background.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrototypeBanner } from "@/components/Chrome";
import { TemplateSection } from "@/lib/types";
import { Presence, RoomMessage, SessionAdapter, ConnectionState } from "@/lib/video/adapter";
import { P2PAdapter } from "@/lib/video/p2p-adapter";
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
const CANNED: { kind: "closer" | "further" | "slower" | "light" | "steady"; label: string }[] = [
  { kind: "closer", label: "Closer" }, { kind: "further", label: "Step back" },
  { kind: "slower", label: "Slower" }, { kind: "light", label: "More light" }, { kind: "steady", label: "Hold steady" },
];

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
  const [active, setActive] = useState<string | undefined>();
  const [responses, setResponses] = useState<Record<string, ResponseState>>(props.initialResponses);
  const [counts, setCounts] = useState<Record<string, number>>(props.initialCounts);
  const [tray, setTray] = useState<TrayItem[]>([]);
  const [flash, setFlash] = useState(false);
  const [banner, setBanner] = useState("");
  const [photoPending, setPhotoPending] = useState<string | null>(null); // itemKey awaiting high-res
  const [showSummary, setShowSummary] = useState(false);
  const [lastCaptureMs, setLastCaptureMs] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [muted, setMuted] = useState(false);
  const [started] = useState(() => Date.now());
  const [clock, setClock] = useState("00:00");

  const itemsByKey = useMemo(() => {
    const m = new Map<string, { section: TemplateSection; item: TemplateSection["items"][number] }>();
    for (const s of sections) for (const i of s.items) m.set(i.key, { section: s, item: i });
    return m;
  }, [sections]);
  const activeInfo = active ? itemsByKey.get(active) : undefined;

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3500); };

  // ---- adapter lifecycle ----
  useEffect(() => {
    const adapter = new P2PAdapter();
    adapterRef.current = adapter;
    let prevConn: ConnectionState = "idle";
    (async () => {
      await adapter.resolveRoom(`job-${jobId}`);
      await adapter.joinRoom("assessor", {
        onLocalStream: (s) => { if (localVideoRef.current) localVideoRef.current.srcObject = s; },
        onRemoteStream: (s) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = s; },
        onConnectionState: (s) => {
          setConn(s);
          if (prevConn === "connected" && s === "reconnecting") void sessionNetworkEventAction(jobId, "client_disconnected");
          if (prevConn === "reconnecting" && s === "connected") void sessionNetworkEventAction(jobId, "client_reconnected");
          prevConn = s;
        },
        onPresence: setPresence,
        onMessage: (m: RoomMessage) => {
          if (m.type === "photo_delivered") {
            setPhotoPending(null);
            setCounts((c) => ({ ...c, [m.itemKey]: (c[m.itemKey] ?? 0) + 1 }));
            const trayItem: TrayItem = { key: ++trayKey, url: `/api/files/${m.evidenceId}`, label: `HIGH-RES – ${itemsByKey.get(m.itemKey)?.item.prompt.slice(0, 28) ?? m.itemKey}`, itemKey: m.itemKey, status: "saved", kind: "highres", evidenceId: m.evidenceId };
            setTray((t) => [trayItem, ...t].slice(0, 40));
            say("High-res photo received — click it in the tray to check legibility");
          }
        },
        onError: (e) => say(e),
      });
    })();
    return () => { void adapter.leaveRoom(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - started) / 1000);
      setClock(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, [started]);

  // ---- capture loop (the hard requirement) ----
  const capture = useCallback(async () => {
    const adapter = adapterRef.current;
    const video = remoteVideoRef.current;
    if (!adapter || !video || !video.srcObject) { say("No client video to capture yet"); return; }
    const t0 = performance.now();
    const info = active ? itemsByKey.get(active) : undefined;
    const now = new Date().toTimeString().slice(0, 8);
    const label = info ? `${info.section.title} – ${info.item.prompt.slice(0, 40)} – ${now}` : `UNFILED – ${now}`;

    // Fast path: draw the playing <video> element to canvas (no re-attach).
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) { say("Capture failed"); return; }

    // Optimistic thumbnail — instant, before any network.
    const url = URL.createObjectURL(blob);
    const key = ++trayKey;
    const ms = Math.round(performance.now() - t0);
    setLastCaptureMs(ms);
    const trayItem: TrayItem = { key, url, label, itemKey: active ?? null, status: "saving", ms, kind: "frame" };
    setTray((t) => [trayItem, ...t].slice(0, 40));
    setFlash(true); setTimeout(() => setFlash(false), 120);
    if (active) setCounts((c) => ({ ...c, [active]: (c[active] ?? 0) + 1 }));
    adapter.sendMessage("client", { type: "capture_taken" });

    // Background save.
    const fd = new FormData();
    fd.set("file", new File([blob], "capture.jpg", { type: "image/jpeg" }));
    saveCaptureAction(jobId, active ?? null, label, fd)
      .then(({ id }) => setTray((t) => t.map((x) => (x.key === key ? { ...x, status: "saved", evidenceId: id } : x))))
      .catch(() => setTray((t) => t.map((x) => (x.key === key ? { ...x, status: "failed" } : x))));
  }, [active, itemsByKey, jobId]);

  // Hotkeys: C and Space capture; suppressed while typing (phase1/04 §4.4).
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

  const selectItem = (itemKey: string) => {
    setActive(itemKey);
    const info = itemsByKey.get(itemKey);
    if (info?.item.clientInstruction) pushBanner(info.item.clientInstruction);
  };
  const pushBanner = (text: string) => {
    setBanner(text);
    adapterRef.current?.sendMessage("client", { type: "banner", text });
  };
  const requestPhoto = () => {
    if (!activeInfo) return;
    setPhotoPending(activeInfo.item.key);
    adapterRef.current?.sendMessage("client", {
      type: "photo_request",
      itemKey: activeInfo.item.key,
      instruction: activeInfo.item.clientInstruction ?? `Please photograph: ${activeInfo.item.prompt}`,
    });
    setTimeout(() => setPhotoPending((p) => (p === activeInfo.item.key ? null : p)), 90000);
  };

  const admit = async () => {
    const { sessionId } = await admitClientAction(jobId);
    void sessionId;
    setAdmitted(true);
    adapterRef.current?.sendMessage("waiting", { type: "banner", text: "__ADMIT__" });
  };

  // ---- summary stats ----
  const stats = useMemo(() => {
    let required = 0, done = 0, missing: string[] = [], concerns = 0;
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

  const endSession = async (outcome: "Awaiting evidence" | "Awaiting report") => {
    adapterRef.current?.sendMessage("client", { type: "session_ended" });
    await endSessionAction(jobId, outcome);
    router.push(`/jobs/${jobId}/evidence`);
  };

  const connBadge = { idle: "…", connecting: "connecting", connected: "● live", reconnecting: "reconnecting…", ended: "ended" }[conn];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <PrototypeBanner />
      <header className="px-4 py-2 flex items-center gap-3 text-slate-300 text-sm">
        <Link href={`/jobs/${jobId}`} className="hover:text-white">← {props.jobNumber}</Link>
        <span>{props.clientName}</span>
        <span className="text-xs bg-slate-700 rounded px-2 py-0.5">Session {clock}</span>
        <span className={`text-xs rounded px-2 py-0.5 ${conn === "connected" ? "bg-emerald-800 text-emerald-200" : "bg-slate-700"}`}>{connBadge}</span>
        {lastCaptureMs !== null && <span className="text-xs text-slate-500">last capture {lastCaptureMs} ms</span>}
        <span className="ml-auto text-xs text-slate-500">Adapter: P2P (provider-agnostic — no video provider selected)</span>
      </header>

      <div className="flex-1 grid grid-cols-[3fr_2fr] gap-2 px-2 pb-2 min-h-0">
        {/* Client video zone */}
        <div className={`relative rounded-xl bg-slate-800 overflow-hidden transition ${flash ? "ring-4 ring-white" : ""}`}>
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
          {!admitted && (
            <div className="absolute inset-0 bg-slate-900/85 flex flex-col items-center justify-center text-center p-6">
              <div className="text-5xl mb-3">{presence.waiting ? "🟢" : "⏳"}</div>
              <p className="text-slate-200 font-medium">
                {presence.waiting ? `${props.clientName} is in the waiting room` : "Waiting for the client to arrive…"}
              </p>
              <p className="text-slate-400 text-xs mt-2">Readiness shows on your dashboard; this panel updates live.</p>
              <button
                onClick={admit}
                disabled={!presence.waiting && !presence.client}
                className="mt-5 bg-emerald-600 disabled:opacity-40 hover:bg-emerald-500 text-white rounded-xl px-6 py-3 font-semibold"
              >
                Admit client & start session
              </button>
              {props.jobStatus !== "Scheduled" && props.jobStatus !== "In progress" && (
                <p className="text-amber-400 text-xs mt-3">Note: job status is {props.jobStatus} — admitting will not change it.</p>
              )}
            </div>
          )}
          {admitted && conn !== "connected" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/90 text-amber-950 text-xs font-semibold rounded-full px-3 py-1">
              {conn === "reconnecting" ? "Client connection lost — reconnecting…" : "Waiting for client video…"}
            </div>
          )}
          {banner && (
            <div className="absolute top-3 right-3 bg-blue-900/80 text-blue-100 text-xs rounded-lg px-3 py-1.5 max-w-[45%]">
              Client sees: “{banner}”
            </div>
          )}
          {/* Local self-view */}
          <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-3 right-3 w-28 h-20 object-cover rounded-lg border border-slate-600 bg-black" />

          {/* Controls */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 items-center">
            <button onClick={() => void capture()} className="bg-white text-slate-900 rounded-full px-5 py-2.5 text-sm font-bold shadow hover:bg-slate-100" title="Hotkeys: C or Space">
              ● Capture
            </button>
            <button
              disabled={!activeInfo || !!photoPending}
              onClick={requestPhoto}
              className="bg-violet-600 disabled:opacity-40 text-white rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-violet-500"
              title={activeInfo ? `Request high-res photo for: ${activeInfo.item.prompt}` : "Select a checklist item first"}
            >
              {photoPending ? "Waiting for photo…" : "Request photo"}
            </button>
            <button onClick={() => adapterRef.current?.sendMessage("client", { type: "prompt", kind: "flip" })} className="bg-slate-700 text-slate-200 rounded-full px-3 py-2.5 text-xs hover:bg-slate-600">Flip prompt</button>
            <button onClick={() => adapterRef.current?.sendMessage("client", { type: "prompt", kind: "torch" })} className="bg-slate-700 text-slate-200 rounded-full px-3 py-2.5 text-xs hover:bg-slate-600">Torch prompt</button>
            <button onClick={() => { setMuted(!muted); adapterRef.current?.setMuted(!muted); }} className={`rounded-full px-3 py-2.5 text-xs ${muted ? "bg-rose-700 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}>{muted ? "Unmute" : "Mute"}</button>
            <button onClick={() => setShowSummary(true)} className="bg-rose-700 text-white rounded-full px-4 py-2.5 text-xs hover:bg-rose-600">End</button>
          </div>
          {/* Canned prompts */}
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {CANNED.map((c) => (
              <button key={c.kind} onClick={() => adapterRef.current?.sendMessage("client", { type: "prompt", kind: c.kind })}
                className="bg-slate-800/80 text-slate-300 text-[10px] rounded px-2 py-1 hover:bg-slate-700 text-left">
                {c.label}
              </button>
            ))}
          </div>
          {toast && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-950/90 text-slate-100 text-xs rounded-lg px-4 py-2">{toast}</div>}
        </div>

        {/* Checklist panel */}
        <div className="rounded-xl bg-slate-100 overflow-y-auto p-3">
          <div className="text-xs text-slate-500 mb-1">{props.templateName} v{props.templateVersion} — tap an item, then Capture (C / Space)</div>
          <Progress stats={stats} />
          {sections.map((s) => (
            <div key={s.key} className="mb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">{s.title}</h3>
              <ul className="mt-1 space-y-1">
                {s.items.map((i) => (
                  <ChecklistItem
                    key={i.key}
                    item={i}
                    isActive={active === i.key}
                    r={responses[i.key] ?? {}}
                    count={counts[i.key] ?? 0}
                    onSelect={() => selectItem(i.key)}
                    onAnswer={(v) => setAnswer(i.key, v)}
                    onNote={(v) => setNote(i.key, v)}
                    onConcern={() => toggleConcern(i.key)}
                    onMissing={(flag, reason) => setMissing(i.key, flag, reason)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Capture tray */}
      <div className="h-24 bg-slate-800 px-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-slate-500 text-xs whitespace-nowrap">Tray ({tray.length})</span>
        {tray.slice(0, 10).map((c) => (
          <a key={c.key} href={c.evidenceId ? `/api/files/${c.evidenceId}` : c.url} target="_blank" className="flex-shrink-0 relative" title={`${c.label} — open full size`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.url} alt={c.label} className={`h-16 w-24 object-cover rounded-md ${c.kind === "highres" ? "ring-2 ring-violet-400" : ""}`} />
            <span className={`absolute top-0.5 right-0.5 text-[8px] rounded px-1 ${c.status === "saved" ? "bg-emerald-500 text-white" : c.status === "failed" ? "bg-rose-600 text-white" : "bg-slate-600 text-slate-200"}`}>
              {c.status === "saved" ? "✓" : c.status === "failed" ? "!" : "…"}
            </span>
            <div className="text-[9px] text-slate-400 w-24 truncate">{c.label}</div>
          </a>
        ))}
        {tray.length === 0 && <span className="text-slate-600 text-xs">— select an item and press Capture / C / Space —</span>}
      </div>

      {/* End-session summary (the one permitted full-screen moment) */}
      {showSummary && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h2 className="text-lg font-bold text-slate-800">End session — summary</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm mt-4 text-slate-600">
              <dt>Items complete</dt><dd className="font-semibold">{stats.done} / {stats.required}</dd>
              <dt>Flagged missing</dt><dd className={`font-semibold ${stats.missing.length ? "text-amber-600" : ""}`}>{stats.missing.length}</dd>
              <dt>Concern flags</dt><dd className="font-semibold">{stats.concerns}</dd>
              <dt>Captures this session</dt><dd className="font-semibold">{stats.captures}</dd>
            </dl>
            {stats.missing.length > 0 && (
              <ul className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2 space-y-0.5">
                {stats.missing.map((k) => <li key={k}>• {itemsByKey.get(k)?.item.prompt ?? k}</li>)}
              </ul>
            )}
            <p className="text-xs text-slate-400 mt-3">Remember to tell the client what happens next before ending.</p>
            <div className="flex flex-col gap-2 mt-4">
              <button onClick={() => void endSession("Awaiting evidence")} disabled={stats.missing.length === 0}
                className="bg-amber-500 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold">
                End — items outstanding → Awaiting evidence
              </button>
              <button onClick={() => void endSession("Awaiting report")}
                className="bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                End — evidence complete → Awaiting report
              </button>
              <button onClick={() => setShowSummary(false)} className="text-slate-500 text-sm py-1">Back to session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Progress({ stats }: { stats: { done: number; required: number } }) {
  const pct = stats.required ? Math.round((stats.done / stats.required) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5">{stats.done}/{stats.required} items complete</div>
    </div>
  );
}

function ChecklistItem(props: {
  item: TemplateSection["items"][number];
  isActive: boolean;
  r: ResponseState;
  count: number;
  onSelect: () => void;
  onAnswer: (v: unknown) => void;
  onNote: (v: string) => void;
  onConcern: () => void;
  onMissing: (flag: boolean, reason?: string) => void;
}) {
  const { item: i, isActive, r, count } = props;
  const [noteOpen, setNoteOpen] = useState(false);
  const [missingOpen, setMissingOpen] = useState(false);

  return (
    <li className={`rounded-lg border ${isActive ? "border-blue-500 bg-blue-50" : r.missing ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <button onClick={props.onSelect} className="w-full text-left text-xs px-2 py-1.5 text-slate-700">
        {i.prompt}
        <span className="float-right flex gap-1 items-center">
          {i.highRes && <span className="text-violet-500 text-[9px] font-semibold">HI-RES</span>}
          {r.concernFlag && <span title="Concern flag">🚩</span>}
          {count > 0 && <span className="rounded-full px-1.5 bg-emerald-100 text-emerald-700">{count}</span>}
        </span>
      </button>
      {isActive && (
        <div className="px-2 pb-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          {i.answerType === "yes_no" && (
            <div className="flex gap-1.5">
              {["Yes", "No"].map((v) => (
                <button key={v} onClick={() => props.onAnswer(v)}
                  className={`text-xs rounded-lg px-3 py-1 border ${r.answer === v ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 text-slate-600"}`}>{v}</button>
              ))}
            </div>
          )}
          {i.answerType === "choice" && (
            <div className="flex gap-1.5 flex-wrap">
              {(i.options ?? []).map((v) => (
                <button key={v} onClick={() => props.onAnswer(v)}
                  className={`text-xs rounded-lg px-2 py-1 border ${r.answer === v ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 text-slate-600"}`}>{v}</button>
              ))}
            </div>
          )}
          {(i.answerType === "text" || i.answerType === "number") && (
            <input
              defaultValue={(r.answer as string) ?? ""}
              onBlur={(e) => props.onAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="Answer…"
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5"
            />
          )}
          <div className="flex gap-2 items-center text-[10px]">
            <button onClick={() => setNoteOpen(!noteOpen)} className="text-slate-500 hover:text-slate-800">📝 {r.note ? "Note ✓" : "Note"}</button>
            <button onClick={props.onConcern} className={r.concernFlag ? "text-rose-600 font-semibold" : "text-slate-500 hover:text-rose-600"} title="Concern flag (staff-only)">
              🚩 {r.concernFlag ? "Concern flagged" : "Concern"}
            </button>
            {!r.missing ? (
              !missingOpen ? (
                <button onClick={() => setMissingOpen(true)} className="text-amber-600">Can&apos;t capture now…</button>
              ) : (
                <span className="flex gap-1 items-center">
                  {MISSING_REASONS.map((reason) => (
                    <button key={reason} onClick={() => { props.onMissing(true, reason); setMissingOpen(false); }}
                      className="bg-amber-100 text-amber-800 rounded px-1.5 py-0.5">{reason}</button>
                  ))}
                </span>
              )
            ) : (
              <button onClick={() => props.onMissing(false)} className="text-amber-700 font-medium">
                MISSING ({r.missingReason}) — undo
              </button>
            )}
          </div>
          {noteOpen && (
            <textarea
              defaultValue={r.note ?? ""}
              onBlur={(e) => props.onNote(e.target.value)}
              rows={2}
              placeholder="Note (staff-only, flows to the report)…"
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5"
            />
          )}
        </div>
      )}
    </li>
  );
}
