# Chunk 1D — Live room, provider-agnostic (implementation notes)

**Date:** 2026-07-06 · **Provider decision:** none (deliberately deferred).
Daily.co excluded (testing requires payment). LiveKit allowed later only if
testable without paid commitment.

## Architecture

The assessment room never talks to a video provider directly. Everything goes
through the `SessionAdapter` interface
([prototype/src/lib/video/adapter.ts](../prototype/src/lib/video/adapter.ts)):
`resolveRoom / joinRoom / leaveRoom / local & remote streams / switchCamera /
setMuted / captureRemoteFrame / sendMessage / connection-state, presence,
message and error callbacks`.

Active implementation: **P2PAdapter** — plain browser WebRTC
(`RTCPeerConnection`, Google public STUN) with signaling + app messages over
the app's own `/api/rtc/[room]` polling channel. Free, no account, no keys,
no provider.

Swap path: implement the interface once per provider; the room components do
not change. The LiveKit mapping is documented 1:1 in
[livekit-adapter.stub.ts](../prototype/src/lib/video/livekit-adapter.stub.ts)
(~1 day when unblocked, incl. re-running the SP1–SP10 gates through it).

Prototype test hooks (query params, harmless in demo use):
- `?media=fake` — animated canvas stream instead of camera (camera-less machines;
  includes a synthetic rating plate for legibility checks)
- `?loopback=1` — remote := local, no peer connection (single-browser demos)

## What works now (verified in browser 2026-07-06)

- Assessor room: live video, DB checklist, active item, capture (click / C /
  Space, suppressed while typing), optimistic tray thumbnails (~40 ms warm,
  ~370 ms cold to thumbnail; save continues in background), UNFILED captures,
  notes / concern flags / missing-with-reason, banner + canned prompts,
  admit-from-waiting-room, end-session summary → Awaiting evidence / Awaiting
  report.
- Client room: own camera, assessor thumbnail (placeholder until remote video),
  instruction banner, flip, torch with graceful iOS fallback copy, photo-taken
  flash, high-res photo request → capture → preview → upload → lands in the
  evidence gallery on the correct item, reconnect overlay, completion screen.
  No internal data renders client-side (checked).
- Persistence: sessions (start/join/end/reconnect count), checklist_responses
  (answer/note/concern/missing+reason), evidence_items (frame_capture /
  highres_client_photo, session-linked, UNFILED = NULL item_key), full event
  log (session_started/ended, evidence_captured, highres_photo_received,
  concern_flagged, item_flagged_missing, client_disconnected/reconnected).

## Still blocked on the provider decision (documented limitations)

1. **NAT traversal:** no TURN server — P2P calls across hostile NATs/CGNAT can
   fail to connect. Same-network and mild-NAT cases work. A provider (or a
   TURN service) removes this.
2. **Signaling durability:** `/api/rtc` is in-memory in the dev process —
   fine for the prototype, replaced by provider messaging at selection.
3. **Reconnection quality:** P2P rebuild-on-failure works but a provider's
   managed reconnect (SP8) will be faster/cleaner; re-test SP8 through the
   chosen adapter.
4. **Scale/quality management:** simulcast, bandwidth adaptation, recording
   hooks — provider territory, out of scope now anyway.
5. **Two-device mobile testing** of THIS room (the spike tested capability,
   not this UI) needs an HTTPS URL — same tunnel/deploy options as the spike
   guide; do it once a provider adapter exists or via the P2P adapter on one
   Wi-Fi network.
