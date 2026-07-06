// LiveKitAdapter — STUB ONLY (not implemented, not imported anywhere).
// Documents the 1:1 mapping from SessionAdapter to livekit-client so the swap is
// mechanical once a provider decision is made and free-tier testing is confirmed.
// Per instruction: no provider lock-in in Phase 1; Daily.co excluded (paid
// testing); LiveKit only if testable without paid commitment.
//
// Mapping (livekit-client ^2):
//   resolveRoom(key)        -> server mints access token for room=key (needs
//                              LIVEKIT_API_KEY/SECRET in .env.local — server-side
//                              only, never client-exposed, never committed)
//   joinRoom(role, events)  -> room = new Room(); room.connect(wssUrl, token);
//                              room.localParticipant.setCameraEnabled(true) etc.
//   onRemoteStream          -> RoomEvent.TrackSubscribed (video) -> track.attach()
//   onConnectionState       -> RoomEvent.Reconnecting / Reconnected / Disconnected
//   onPresence              -> RoomEvent.ParticipantConnected / Disconnected
//   sendMessage/onMessage   -> localParticipant.publishData / RoomEvent.DataReceived
//   switchCamera            -> room.switchActiveDevice("videoinput", deviceId) or
//                              createLocalVideoTrack({facingMode}) + replace
//   setMuted                -> localParticipant.setMicrophoneEnabled(!muted)
//   captureRemoteFrame      -> canvas grab from the subscribed track's element
//                              (same grabFrame helper as P2P)
//   leaveRoom               -> room.disconnect()
//   waiting-room/admit      -> token permissions or metadata + publishData
//
// Estimated effort when unblocked: ~1 day incl. on-device retest of the
// SP1–SP10 hard gates through the adapter.
export {};
