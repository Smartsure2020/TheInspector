# Staging provider verification results

**Status: NOT RUN.** No LiveKit/Daily credentials or staging deployment exist yet.

## Position (do not overstate)

- Staging default: **LiveKit** — staging default only.
- Provider decision: **not formally final.**
- Daily.co: available for comparison.
- P2P: local/dev fallback only.
- Earlier mobile/provider testing (Chrome, Firefox, iPhone) is **believed** to have passed but the
  filed evidence has not been located. This run is the formal re-test required before any
  real-client pilot, final provider decision, or G2/G3 closure (repo gate numbering).
  It does not block technical staging, which is staff-only and fake-data only.

## Preconditions

- [ ] F1 fixed (video token routes require auth) before real LiveKit credentials go on the internet
- [ ] Staging deployed over HTTPS (Vercel) with Deployment Protection (use bypass token for phones)
- [ ] LiveKit credentials set; `NEXT_PUBLIC_VIDEO_ADAPTER=livekit` set **before build**
- [ ] Test devices (staff-owned): iPhone/Safari, Android/Chrome, desktop Chrome, desktop Firefox

## Device / provider matrix (fill in during the run)

| Device / browser | LiveKit join | 2-way AV | Rear-cam switch | Capture <3 s | Hi-res photo | Notes |
|---|---|---|---|---|---|---|
| Desktop Chrome | ⏳ | ⏳ | n/a | ⏳ | ⏳ | |
| Desktop Firefox | ⏳ | ⏳ | n/a | ⏳ | ⏳ | |
| iPhone Safari | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Android Chrome | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Phone on mobile data (CGNAT) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | TURN/relay behaviour |

Daily.co comparison (optional, same matrix): ⏳

## Also record for the provider decision

- Cost at pilot volume · media region/data-residency for South Africa (F13) · TURN included ·
  self-host option · SDK weight/stability · failure behaviour on bad networks.
- Save screenshots/logs beside this file (e.g. `phase1/spike-evidence/staging/`) — **file the evidence this time.**
