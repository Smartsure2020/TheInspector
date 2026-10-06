// Daily.co adapter — implements SessionAdapter using @daily-co/daily-js.
// Requires DAILY_API_KEY in .env.local (server-side only).
// If credentials are missing, resolveRoom throws a clear error.
import type {
  SessionAdapter,
  PeerRole,
  AdapterEvents,
  ConnectionState,
  RoomMessage,
  Presence,
} from "./adapter";
import { grabFrame, wantsFakeMedia, makeFakeStream } from "./media";

let dailyModule: typeof import("@daily-co/daily-js") | null = null;
async function getDaily() {
  if (!dailyModule) dailyModule = await import("@daily-co/daily-js");
  return dailyModule;
}

export class DailyAdapter implements SessionAdapter {
  private call: ReturnType<typeof import("@daily-co/daily-js").default.createCallObject> | null = null;
  private events: AdapterEvents = {};
  private role: PeerRole = "assessor";
  private roomUrl = "";
  private meetingToken = "";
  private remoteStream: MediaStream | null = null;
  private localStream: MediaStream | null = null;
  private _connectionState: ConnectionState = "idle";
  private presence: Presence = { assessor: false, client: false, waiting: false };
  private facing: "user" | "environment" = "user";

  get connectionState() {
    return this._connectionState;
  }

  private setConn(s: ConnectionState) {
    this._connectionState = s;
    this.events.onConnectionState?.(s);
  }

  async resolveRoom(roomKey: string, clientToken?: string): Promise<void> {
    const res = await fetch(
      `/api/daily/room?name=${encodeURIComponent(roomKey)}${clientToken ? `&ct=${encodeURIComponent(clientToken)}` : ""}`
    );
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 503) {
        throw new Error(
          "Daily.co not configured: set DAILY_API_KEY in .env.local"
        );
      }
      throw new Error(`Daily room request failed: ${text}`);
    }
    const data = await res.json();
    this.roomUrl = data.url;
    this.meetingToken = data.token;
  }

  async joinRoom(role: PeerRole, events: AdapterEvents): Promise<void> {
    this.role = role;
    this.events = events;
    this.setConn("connecting");

    const Daily = await getDaily();
    const call = Daily.default.createCallObject({
      audioSource: !wantsFakeMedia(),
      videoSource: !wantsFakeMedia(),
    });
    this.call = call;

    call.on("track-started", (ev) => {
      if (!ev) return;
      const participant = ev.participant;
      const track = ev.track;
      if (!participant || participant.local || !track || track.kind !== "video") return;
      const ms = new MediaStream([track]);
      this.remoteStream = ms;
      events.onRemoteStream?.(ms);
    });

    call.on("track-stopped", (ev) => {
      if (!ev) return;
      const participant = ev.participant;
      const track = ev.track;
      if (!participant || participant.local || !track || track.kind !== "video") return;
      this.remoteStream = null;
      events.onRemoteStream?.(null);
    });

    call.on("joined-meeting", () => {
      this.setConn("connected");
      this.refreshPresence();
    });

    call.on("participant-joined", () => this.refreshPresence());
    call.on("participant-left", () => this.refreshPresence());

    call.on("network-connection", (ev) => {
      if (!ev) return;
      const event = ev.event;
      if (event === "interrupted") this.setConn("reconnecting");
      if (event === "connected") this.setConn("connected");
    });

    call.on("left-meeting", () => this.setConn("ended"));
    call.on("error", (ev) => events.onError?.((ev as { errorMsg?: string })?.errorMsg ?? "Daily error"));

    call.on("app-message", (ev) => {
      if (!ev) return;
      try {
        const msg = ev.data as { to?: string } & RoomMessage;
        if (msg.to && msg.to !== role && msg.to !== "waiting") return;
        events.onMessage?.(msg as RoomMessage);
      } catch { /* ignore */ }
    });

    await call.join({
      url: this.roomUrl,
      token: this.meetingToken || undefined,
      userName: role,
    });

    if (wantsFakeMedia()) {
      const fake = makeFakeStream(role);
      await call.startCustomTrack({ track: fake.getVideoTracks()[0], trackName: "video" });
      this.localStream = fake;
    } else {
      const parts = call.participants();
      const local = parts?.local;
      if (local?.tracks?.video?.persistentTrack) {
        const ms = new MediaStream();
        ms.addTrack(local.tracks.video.persistentTrack);
        if (local.tracks?.audio?.persistentTrack) ms.addTrack(local.tracks.audio.persistentTrack);
        this.localStream = ms;
      }
    }

    if (this.localStream) events.onLocalStream?.(this.localStream);
    this.refreshPresence();
  }

  private refreshPresence() {
    if (!this.call) return;
    const parts = this.call.participants();
    if (!parts) return;
    const identities = new Set<string>();
    identities.add(this.role);
    for (const [key, p] of Object.entries(parts)) {
      if (key === "local") continue;
      if (p.user_name) identities.add(p.user_name);
    }
    this.presence = {
      assessor: identities.has("assessor"),
      client: identities.has("client"),
      waiting: identities.has("waiting"),
    };
    this.events.onPresence?.(this.presence);
  }

  async leaveRoom(): Promise<void> {
    await this.call?.leave();
    this.call?.destroy();
    this.call = null;
    this.setConn("ended");
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  async switchCamera(): Promise<"user" | "environment"> {
    if (!this.call) return "user";
    await this.call.cycleCamera({ preferDifferentFacingMode: true });
    this.facing = this.facing === "user" ? "environment" : "user";
    const parts = this.call.participants();
    const local = parts?.local;
    if (local?.tracks?.video?.persistentTrack) {
      const ms = new MediaStream([local.tracks.video.persistentTrack]);
      if (local.tracks?.audio?.persistentTrack) ms.addTrack(local.tracks.audio.persistentTrack);
      this.localStream = ms;
      this.events.onLocalStream?.(ms);
    }
    return this.facing;
  }

  setMuted(muted: boolean): void {
    this.call?.setLocalAudio(!muted);
  }

  async captureRemoteFrame(quality?: number): Promise<Blob | null> {
    if (!this.remoteStream) return null;
    return grabFrame(this.remoteStream, quality);
  }

  sendMessage(_to: PeerRole | "waiting", message: RoomMessage): void {
    if (!this.call) return;
    const envelope = { to: _to, ...message };
    this.call.sendAppMessage(envelope, "*");
  }
}
