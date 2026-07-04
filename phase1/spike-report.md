# Video Provider Spike Report — Daily.co vs LiveKit Cloud

**Status: HARNESSES READY — ON-DEVICE RUNS NOT YET EXECUTED.**
**Chunk 1D remains blocked** until this report is completed on real devices and the
verdict below is approved (per the Phase 1 instruction).

## Why this is not yet complete

The spike per phase1/07 requires physical devices and provider accounts that only a
human tester can exercise: a real iPhone (Safari), a mid-range Android (Chrome),
real mobile-data/throttled-4G conditions, and free-tier accounts on Daily.co and
LiveKit Cloud. The harnesses, protocol and results matrix below are built and ready;
the on-device sessions must be run by a person with the phones in hand (~half a day
for both providers once accounts exist).

## Harnesses (built, throwaway)

Served by the prototype dev server (`npm run dev` in `prototype\`):

| Harness | URL | Tests |
|---------|-----|-------|
| Device capability | `/spike/device.html` | SP3 rear camera, SP4 torch, SP6 high-res still — provider-independent, needs no account |
| Daily.co | `/spike/daily.html` | SP1/SP2 join, SP5 remote-frame capture, SP7 latency, SP8 reconnect, SP9 (via room config) |
| LiveKit Cloud | `/spike/livekit.html` | Same tests, LiveKit SDK |

**HTTPS note:** phone browsers require a secure context for camera access. Options:
`next dev --experimental-https` (self-signed — accept the warning on the phone), or a
tunnel (`cloudflared tunnel --url http://localhost:3000` / ngrok) for a clean HTTPS
URL reachable on mobile data (which also enables the real-4G runs).

## Run protocol (tester checklist)

1. Create free accounts: Daily.co (create one room) and LiveKit Cloud (project +
   two tokens via the dashboard token tool).
2. Laptop + iPhone on the harness page → run SP1–SP9 per the matrix; repeat with
   Android; repeat the capture/latency tests on throttled 4G (Chrome DevTools
   network throttle on laptop; real mobile data on phones).
3. `/spike/device.html` on both phones for SP3/SP4/SP6 — screenshot the logs.
4. SP8: flight-mode the phone 30 s mid-call, restore, record behaviour from the log.
5. Paste results into the matrix, decide, sign.

## Results matrix (TO BE COMPLETED ON DEVICE)

| # | Test | Pass condition | Daily.co | LiveKit Cloud |
|---|------|----------------|----------|---------------|
| SP1 | iOS Safari join, no install | 2-way AV in <5 taps from link | ☐ | ☐ |
| SP2 | Android Chrome join, no install | Same | ☐ | ☐ |
| SP3 | Rear camera switch mid-call | <2 s, stream continues | ☐ (device.html + in-call) | ☐ |
| SP4 | Torch where supported | Android on-call toggle; iOS documented honestly | ☐ | ☐ |
| SP5 | Remote-track frame capture (assessor side) | JPEG produced; received resolution ≥720p on good network | ☐ | ☐ |
| SP6 | Client full-res photo + upload during call | ≥8MP still; audio continues; geyser plate legible at 1.5 m | ☐ | ☐ |
| SP7 | Capture-to-thumbnail latency | <1 s Wi-Fi / <1.5 s 4G | ☐ __ms | ☐ __ms |
| SP8 | Reconnect (30 s network kill) | Auto/one-tap rejoin; state survives | ☐ | ☐ |
| SP9 | Waiting-room / admit control | SDK supports admit gating | ☐ (Daily: knock/`enable_knocking`) | ☐ (LiveKit: token/permission pattern) |
| SP10 | Cost at pilot volume | Per-45-min 2-party session | ☐ verify current pricing | ☐ verify current pricing |

**Disqualifiers:** any FAIL on SP1, SP2, SP3, SP5, SP6 removes that provider.

## Documented expectations going in (desk knowledge — verify, do not trust)

- Both providers support browser join with no install on iOS Safari and Android
  Chrome; both expose remote `MediaStreamTrack`s that canvas capture can read
  (no DRM taint on WebRTC tracks).
- **Torch on iOS Safari is expected to fail or be unavailable** (`ImageCapture` API
  absent, `torch` constraint historically unsupported). The room spec already
  designs the fallback (phase1/04 §4.10); SP4 exists to document, not to gate.
- iOS Safari `ImageCapture.takePhoto()` is unavailable → the high-res path on iOS
  uses a max-resolution `getUserMedia` grab (the device.html harness measures what
  that actually yields per phone — this number decides whether SP6 passes on iOS).
- SP9: Daily has room "knocking"; LiveKit models admission via tokens/permissions —
  slightly more of our own logic. Both workable.
- Prior lean (phase1/07): Daily.co for prototype speed; LiveKit for control/self-host
  escape. **The matrix decides, not this paragraph.**

## Verdict (TO BE COMPLETED)

- Chosen provider: ______________
- Workarounds required: ______________
- Room-spec adjustments forced by findings: ______________
- Approved by: ______________ Date: ______
- On approval → Chunk 1D may begin.
