"use client";
// P2PAdapter — the Phase 1 SessionAdapter implementation (Chunk 1D).
// Plain browser WebRTC (RTCPeerConnection) with signaling over the app's own
// /api/rtc channel. Free, no provider, no account, no keys. Works two-device on
// the same network (Google public STUN; no TURN, so hostile NATs may fail —
// documented limitation until a provider is chosen).
//
// Test hooks (prototype only):
//   ?media=fake   — canvas stream instead of camera (camera-less machines)
//   ?loopback=1   — remote stream := local stream, no RTCPeerConnection at all
//                   (single-browser demos + automated capture-loop verification)
import {
  AdapterEvents, ConnectionState, PeerRole, RoomMessage, SessionAdapter,
} from "./adapter";
import { Facing, getLocalMedia, grabFrame } from "./media";

const POLL_MS = 900;
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

type Signal =
  | { kind: "offer"; sdp: string }
  | { kind: "answer"; sdp: string }
  | { kind: "ice"; candidate: RTCIceCandidateInit };

export class P2PAdapter implements SessionAdapter {
  private roomKey = "";
  private role: PeerRole = "assessor";
  private events: AdapterEvents = {};
  private pc: RTCPeerConnection | null = null;
  private local: MediaStream | null = null;
  private remote: MediaStream | null = null;
  private facing: Facing = "user";
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private state: ConnectionState = "idle";
  private negotiating = false;
  private lastPeerSeen = 0;
  private loopback = false;

  get connectionState() { return this.state; }

  async resolveRoom(roomKey: string) {
    this.roomKey = roomKey; // P2P: room key IS the channel key; nothing to create
  }

  async joinRoom(role: PeerRole, events: AdapterEvents) {
    this.role = role;
    this.events = events;
    this.loopback = new URLSearchParams(window.location.search).get("loopback") === "1";
    this.setState("connecting");
    this.facing = role === "client" ? "environment" : "user";
    this.local = await getLocalMedia(this.facing);
    events.onLocalStream?.(this.local);

    if (this.loopback) {
      this.remote = this.local;
      events.onRemoteStream?.(this.remote);
      this.setState("connected");
    }
    this.startPolling();
  }

  async leaveRoom() {
    this.sendMessage(this.other(), { type: "bye" });
    this.stopPolling();
    this.pc?.close();
    this.pc = null;
    this.local?.getTracks().forEach((t) => t.stop());
    this.local = null;
    this.remote = null;
    this.setState("ended");
  }

  getLocalStream() { return this.local; }
  getRemoteStream() { return this.remote; }

  async switchCamera(): Promise<Facing> {
    this.facing = this.facing === "user" ? "environment" : "user";
    const next = await getLocalMedia(this.facing);
    const newTrack = next.getVideoTracks()[0];
    const sender = this.pc?.getSenders().find((s) => s.track?.kind === "video");
    if (sender && newTrack) await sender.replaceTrack(newTrack);
    // Keep audio from the old stream where present; swap video track locally.
    const old = this.local;
    const audio = old?.getAudioTracks() ?? [];
    this.local = new MediaStream([newTrack, ...audio]);
    old?.getVideoTracks().forEach((t) => t.stop());
    this.events.onLocalStream?.(this.local);
    if (this.loopback) {
      this.remote = this.local;
      this.events.onRemoteStream?.(this.remote);
    }
    return this.facing;
  }

  setMuted(muted: boolean) {
    this.local?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }

  async captureRemoteFrame(quality = 0.85): Promise<Blob | null> {
    if (!this.remote) return null;
    return grabFrame(this.remote, quality);
  }

  sendMessage(to: PeerRole | "waiting", message: RoomMessage) {
    void this.post(to, "app", message);
  }

  // ---- internals -----------------------------------------------------------

  private other(): PeerRole { return this.role === "assessor" ? "client" : "assessor"; }

  private setState(s: ConnectionState) {
    if (this.state === s) return;
    this.state = s;
    this.events.onConnectionState?.(s);
  }

  private async post(to: string, type: string, payload: unknown) {
    try {
      await fetch(`/api/rtc/${encodeURIComponent(this.roomKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: this.role, to, type, payload }),
      });
    } catch {
      /* poll loop reports connectivity */
    }
  }

  private startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => void this.poll(), POLL_MS);
    void this.poll();
  }
  private stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  private async poll() {
    let data: { messages: { from: string; type: string; payload: unknown }[]; presence: { assessor: boolean; client: boolean; waiting: boolean } };
    try {
      const res = await fetch(`/api/rtc/${encodeURIComponent(this.roomKey)}?peer=${this.role}`, { cache: "no-store" });
      data = await res.json();
    } catch {
      this.events.onError?.("Signal channel unreachable");
      return;
    }
    this.events.onPresence?.(data.presence);

    for (const m of data.messages) {
      if (m.type === "app") this.events.onMessage?.(m.payload as RoomMessage);
      else if (m.type === "signal" && !this.loopback) await this.onSignal(m.payload as Signal);
    }

    if (this.loopback) return;

    // Presence-driven negotiation: the ASSESSOR is always the offerer.
    const peerHere = this.role === "assessor" ? data.presence.client : data.presence.assessor;
    if (peerHere) this.lastPeerSeen = Date.now();

    if (this.role === "assessor" && peerHere && !this.pc && !this.negotiating) {
      await this.makeOffer();
    }
    // Reconnect: connection lost but the peer is still around → rebuild.
    if (this.pc && (this.pc.connectionState === "failed" || this.pc.connectionState === "disconnected")) {
      this.setState("reconnecting");
      if (this.role === "assessor" && peerHere && !this.negotiating) {
        this.pc.close();
        this.pc = null;
        this.remote = null;
        this.events.onRemoteStream?.(null);
        await this.makeOffer();
      }
    }
    // Peer gone entirely (left / long drop).
    if (this.pc && !peerHere && Date.now() - this.lastPeerSeen > 15000 && this.state === "connected") {
      this.setState("reconnecting");
    }
  }

  private newPc(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.local?.getTracks().forEach((t) => pc.addTrack(t, this.local!));
    pc.onicecandidate = (e) => {
      if (e.candidate) void this.post(this.other(), "signal", { kind: "ice", candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      this.remote = e.streams[0] ?? new MediaStream([e.track]);
      this.events.onRemoteStream?.(this.remote);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") this.setState("connected");
      else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.setState("reconnecting");
    };
    return pc;
  }

  private async makeOffer() {
    this.negotiating = true;
    try {
      this.pc = this.newPc();
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      await this.post(this.other(), "signal", { kind: "offer", sdp: offer.sdp! });
    } finally {
      this.negotiating = false;
    }
  }

  private async onSignal(sig: Signal) {
    if (sig.kind === "offer") {
      // Fresh offer replaces any existing connection (assessor-driven rebuilds).
      this.pc?.close();
      this.pc = this.newPc();
      await this.pc.setRemoteDescription({ type: "offer", sdp: sig.sdp });
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      await this.post(this.other(), "signal", { kind: "answer", sdp: answer.sdp! });
    } else if (sig.kind === "answer") {
      if (this.pc && this.pc.signalingState === "have-local-offer")
        await this.pc.setRemoteDescription({ type: "answer", sdp: sig.sdp });
    } else if (sig.kind === "ice") {
      try { await this.pc?.addIceCandidate(sig.candidate); } catch { /* stale candidate */ }
    }
  }
}
