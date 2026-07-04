# 07 — Mandatory Video-Provider Spike

**Purpose:** de-risk the live room before building it. The spike is throwaway code
(explicitly exempt from "no code" only as permitted by phase0 doc 11 — it is the one
sanctioned technical task). **No live-room production build (chunk 1D+) starts until
the spike verdict is written.**

**Candidates:** Daily.co and LiveKit Cloud — both tested against the same script.
Timebox: 4 working days total (2 per provider), 1 day write-up.

## 7.1 Test devices (minimum)

- iPhone (recent iOS, Safari — no app install permitted)
- Mid-range Android (Chrome)
- Assessor laptop (Chrome, 1366×768)
- Network conditions: office Wi-Fi AND throttled ~4G profile (and one real mobile-
  data run per phone).

## 7.2 Test script (identical per provider)

| # | Test | Pass condition |
|---|------|----------------|
| SP1 | iOS Safari join via plain URL, no install, camera+mic permitted | In-call two-way AV in <5 taps from link |
| SP2 | Android Chrome join, same | Same |
| SP3 | Rear camera switching, client-initiated, mid-call | Switch <2 s, stream continues, no permission re-prompt |
| SP4 | Torch control where device supports it | Torch toggles during call on Android; document iOS behaviour honestly (iOS Safari torch support is historically poor — fallback path required regardless) |
| SP5 | Programmatic frame capture from the **remote** video track on the assessor side (canvas grab) | JPEG produced; measure real resolution received (need ≥720p on good network); overlay/DRM issues: none |
| SP6 | Client-side full-resolution photo capture + upload during the call | ≥8MP still captured while call audio continues; document whether client video pauses and how recovery behaves; legible geyser-plate photo from 1.5 m |
| SP7 | Capture-to-thumbnail latency (SP5 grab → rendered thumbnail, optimistic local render) | <1 s on Wi-Fi, <1.5 s on 4G profile |
| SP8 | Reconnect handling: kill client network 30 s mid-call, restore | Auto-rejoin or one-tap rejoin to same room; assessor-side state survives; document reconnect time |
| SP9 | Waiting-room / admit control | Assessor-side admit gating achievable in the SDK |
| SP10 | Cost check | Estimated per-45-min-session cost at pilot volumes, both providers |

## 7.3 Scoring & recommendation method

Each SP scored pass / pass-with-workaround / fail per provider. **Any fail on SP1,
SP2, SP3, SP5 or SP6 disqualifies the provider** (these carry the product thesis).
SP4 torch is expected to be partial everywhere — the room spec (doc 04 §4.10)
already designs the fallback.

**Prior expectation (to be confirmed, not assumed):** Daily.co is the likely Phase 1
pick — its prebuilt device handling and iOS Safari track record fit a prototype
timeline, and its call object exposes remote tracks for canvas capture. LiveKit
Cloud is the stronger long-term platform (self-host escape hatch, richer SDK) and
wins if Daily fails any disqualifier or if frame access proves awkward. The spike
report must state: chosen provider, per-SP results table, workarounds required, and
the abstraction seam (`SessionService` interface — join/leave/admit/tracks/
requestPhoto events) so the provider stays swappable.

## 7.4 Spike deliverable

`phase1/spike-report.md` containing: results matrix (both providers), device notes,
latency measurements, cost table, the recommendation, and a list of room-spec
adjustments forced by findings (e.g. torch fallback wording, photo-capture video-
pause handling). Chunk 1D consumes this directly.
