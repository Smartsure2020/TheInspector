// SessionAdapter — the provider-agnostic contract for the live assessment room
// (Chunk 1D). The room components depend ONLY on this interface; swapping to
// LiveKit / Daily.co / any WebRTC provider later means writing one adapter file,
// not touching the room. See livekit-adapter.stub.ts for the LiveKit mapping.
//
// NO video provider is selected in Phase 1 (decision deferred; Daily.co testing
// is paid — excluded by instruction). The active implementation is P2PAdapter:
// plain browser WebRTC with in-app signaling — free, provider-independent.

export type PeerRole = "assessor" | "client";

export type ConnectionState =
  | "idle"          // not joined
  | "connecting"    // joining / negotiating
  | "connected"     // media flowing
  | "reconnecting"  // transient loss, attempting recovery
  | "ended";        // left / closed

// App-level messages travel over the adapter's data channel (provider messaging
// later; HTTP signaling channel in the P2P prototype). Video-independent, so the
// banner/photo-request flows survive degraded video.
export type RoomMessage =
  | { type: "banner"; text: string }
  | { type: "prompt"; kind: "flip" | "torch" | "closer" | "further" | "slower" | "light" | "steady" }
  | { type: "capture_taken" }                                   // client courtesy flash
  | { type: "photo_request"; itemKey: string; instruction: string }
  | { type: "photo_cancel" }
  | { type: "photo_delivered"; evidenceId: string; itemKey: string }
  | { type: "session_ended" }
  | { type: "bye" };

export interface Presence {
  assessor: boolean; // seen in the last few seconds
  client: boolean;
  waiting: boolean;  // client sitting in the waiting room
}

export interface AdapterEvents {
  onLocalStream?: (s: MediaStream) => void;
  onRemoteStream?: (s: MediaStream | null) => void;
  onConnectionState?: (s: ConnectionState) => void;
  onPresence?: (p: Presence) => void;
  onMessage?: (m: RoomMessage) => void;
  onError?: (msg: string) => void;
}

export interface SessionAdapter {
  /** Resolve/prepare the room for a job. P2P: no-op (room key = job id). Providers: create/fetch room. */
  resolveRoom(roomKey: string): Promise<void>;
  /** Join with local media. */
  joinRoom(role: PeerRole, events: AdapterEvents): Promise<void>;
  leaveRoom(): Promise<void>;

  getLocalStream(): MediaStream | null;
  getRemoteStream(): MediaStream | null;

  /** Client-side: switch front/rear camera. Returns the facing now active. */
  switchCamera(): Promise<"user" | "environment">;
  setMuted(muted: boolean): void;

  /** Grab a JPEG frame from the REMOTE video (assessor side). Null if no remote. */
  captureRemoteFrame(quality?: number): Promise<Blob | null>;

  /** Fire-and-forget app message to the other peer (or waiting-room peer). */
  sendMessage(to: PeerRole | "waiting", message: RoomMessage): void;

  readonly connectionState: ConnectionState;
}
