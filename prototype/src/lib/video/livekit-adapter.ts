// LiveKit adapter — implements SessionAdapter using livekit-client.
// Requires LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL in .env.local
// (server-side only) and NEXT_PUBLIC_LIVEKIT_URL for the client connection.
// If credentials are missing, resolveRoom throws a clear error.
import type {
  SessionAdapter,
  PeerRole,
  AdapterEvents,
  ConnectionState,
  RoomMessage,
  Presence,
} from "./adapter";
import { grabFrameFromElement, getLocalMedia, wantsFakeMedia, makeFakeStream } from "./media";

let lkModule: typeof import("livekit-client") | null = null;
async function getLK() {
  if (!lkModule) lkModule = await import("livekit-client");
  return lkModule;
}

export class LiveKitAdapter implements SessionAdapter {
  private room: InstanceType<typeof import("livekit-client").Room> | null = null;
  private events: AdapterEvents = {};
  private role: PeerRole = "assessor";
  private remoteStream: MediaStream | null = null;
  private localStream: MediaStream | null = null;
  private remoteVideoEl: HTMLVideoElement | null = null;
  private _connectionState: ConnectionState = "idle";
  private presence: Presence = { assessor: false, client: false, waiting: false };
  private token = "";
  private wssUrl = "";

  get connectionState() {
    return this._connectionState;
  }

  private setConn(s: ConnectionState) {
    this._connectionState = s;
    this.events.onConnectionState?.(s);
  }

  async resolveRoom(roomKey: string, clientToken?: string): Promise<void> {
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!wsUrl) {
      throw new Error(
        "LiveKit not configured: set NEXT_PUBLIC_LIVEKIT_URL, LIVEKIT_API_KEY, " +
          "LIVEKIT_API_SECRET, and LIVEKIT_URL in .env.local"
      );
    }
    this.wssUrl = wsUrl;
    const res = await fetch(
      `/api/livekit/token?room=${encodeURIComponent(roomKey)}${clientToken ? `&ct=${encodeURIComponent(clientToken)}` : ""}`
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LiveKit token request failed: ${text}`);
    }
    const data = await res.json();
    this.token = data.token;
  }

  async joinRoom(role: PeerRole, events: AdapterEvents): Promise<void> {
    this.role = role;
    this.events = events;
    this.setConn("connecting");

    const lk = await getLK();
    const room = new lk.Room({
      adaptiveStream: true,
      dynacast: true,
    });
    this.room = room;

    room.on(lk.RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === "video") {
        const el = track.attach() as HTMLVideoElement;
        this.remoteVideoEl = el;
        this.remoteStream = el.srcObject as MediaStream;
        events.onRemoteStream?.(this.remoteStream);
      }
    });

    room.on(lk.RoomEvent.TrackUnsubscribed, (track) => {
      if (track.kind === "video") {
        track.detach();
        this.remoteStream = null;
        this.remoteVideoEl = null;
        events.onRemoteStream?.(null);
      }
    });

    room.on(lk.RoomEvent.Reconnecting, () => this.setConn("reconnecting"));
    room.on(lk.RoomEvent.Reconnected, () => this.setConn("connected"));
    room.on(lk.RoomEvent.Disconnected, () => this.setConn("ended"));
    room.on(lk.RoomEvent.Connected, () => this.setConn("connected"));

    room.on(lk.RoomEvent.ParticipantConnected, () => this.updatePresence());
    room.on(lk.RoomEvent.ParticipantDisconnected, () => this.updatePresence());

    room.on(lk.RoomEvent.DataReceived, (payload: Uint8Array) => {
      try {
        const msg: RoomMessage = JSON.parse(new TextDecoder().decode(payload));
        events.onMessage?.(msg);
      } catch { /* ignore non-JSON data */ }
    });

    // The token must come from resolveRoom (server-authorized). No unauthenticated fallback.
    if (!this.token) throw new Error("LiveKit token missing: resolveRoom must succeed before joinRoom");

    await room.connect(this.wssUrl, this.token);

    if (wantsFakeMedia()) {
      const fake = makeFakeStream(role);
      const videoTrack = fake.getVideoTracks()[0];
      const audioTrack = fake.getAudioTracks()[0];
      if (videoTrack) {
        const localVideo = new lk.LocalVideoTrack(videoTrack);
        await room.localParticipant.publishTrack(localVideo);
      }
      if (audioTrack) {
        const localAudio = new lk.LocalAudioTrack(audioTrack);
        await room.localParticipant.publishTrack(localAudio);
      }
      this.localStream = fake;
    } else {
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);
      const camPub = room.localParticipant.getTrackPublication(lk.Track.Source.Camera);
      const micPub = room.localParticipant.getTrackPublication(lk.Track.Source.Microphone);
      const ms = new MediaStream();
      if (camPub?.track?.mediaStreamTrack) ms.addTrack(camPub.track.mediaStreamTrack);
      if (micPub?.track?.mediaStreamTrack) ms.addTrack(micPub.track.mediaStreamTrack);
      this.localStream = ms;
    }

    events.onLocalStream?.(this.localStream!);
    this.updatePresence();
  }

  private updatePresence() {
    const parts = Array.from(this.room?.remoteParticipants.values() ?? []);
    const identities = new Set(parts.map((p) => p.identity));
    identities.add(this.role);
    this.presence = {
      assessor: identities.has("assessor"),
      client: identities.has("client"),
      waiting: identities.has("waiting"),
    };
    this.events.onPresence?.(this.presence);
  }

  async leaveRoom(): Promise<void> {
    this.room?.disconnect();
    this.room = null;
    this.setConn("ended");
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  async switchCamera(): Promise<"user" | "environment"> {
    if (!this.room) return "user";
    const lk = await getLK();
    const camPub = this.room.localParticipant.getTrackPublication(lk.Track.Source.Camera);
    if (camPub?.track) {
      const current = camPub.track.mediaStreamTrack.getSettings().facingMode;
      const next: "user" | "environment" = current === "environment" ? "user" : "environment";
      const stream = await getLocalMedia(next);
      const newTrack = stream.getVideoTracks()[0];
      if (newTrack) {
        await camPub.track.replaceTrack(newTrack);
        if (this.localStream) {
          const old = this.localStream.getVideoTracks()[0];
          if (old) this.localStream.removeTrack(old);
          this.localStream.addTrack(newTrack);
          this.events.onLocalStream?.(this.localStream);
        }
      }
      return next;
    }
    return "user";
  }

  setMuted(muted: boolean): void {
    this.room?.localParticipant.setMicrophoneEnabled(!muted);
  }

  async captureRemoteFrame(quality?: number): Promise<Blob | null> {
    if (!this.remoteVideoEl) return null;
    return grabFrameFromElement(this.remoteVideoEl, quality);
  }

  sendMessage(to: PeerRole | "waiting", message: RoomMessage): void {
    if (!this.room) return;
    const envelope = { to, ...message };
    const data = new TextEncoder().encode(JSON.stringify(envelope));
    this.room.localParticipant.publishData(data, { reliable: true });
  }
}
