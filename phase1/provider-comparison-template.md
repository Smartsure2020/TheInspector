# Video provider comparison — LiveKit vs Daily.co

**Evaluators:** _______________  
**Date range:** ___ to ___  
**Decision D-11 (2026-07-07):** evaluate both; pick one winner.

## Setup

| | LiveKit | Daily.co |
|---|---|---|
| Account type | Free Cloud / Self-hosted | Free tier |
| Dashboard URL | | |
| Env vars set | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `NEXT_PUBLIC_LIVEKIT_URL` | `DAILY_API_KEY` |
| SDK version | livekit-client ^2.x | @daily-co/daily-js |

## Selection

To switch provider during testing:
- URL param: `?adapter=livekit` or `?adapter=daily`
- Or set `NEXT_PUBLIC_VIDEO_ADAPTER=livekit|daily` in `.env.local`
- Default (no config): `p2p` — the existing free adapter

## Evaluation criteria

### 1. Connection quality

| Test | LiveKit | Daily.co | Notes |
|---|---|---|---|
| Time to first frame (desktop↔desktop) | | | |
| Time to first frame (desktop↔phone) | | | |
| Reconnection after network drop | | | |
| Behaviour on strict corporate NAT/CGNAT | | | |
| TURN relay: included? Working? | | | |

### 2. Capture quality

| Test | LiveKit | Daily.co | Notes |
|---|---|---|---|
| Frame capture JPEG resolution | | | |
| Frame capture file size | | | |
| High-res photo capture works? | | | |
| Text legibility on rating plate (SP8) | | | |

### 3. Mobile compatibility (run after G1 HTTPS setup)

| Device / Browser | LiveKit | Daily.co | Notes |
|---|---|---|---|
| Android Chrome (model: ___) | | | |
| iPhone Safari (model: ___) | | | |
| Rear camera switch | | | |
| Torch control | | | |
| Cold link join unaided | | | |

### 4. Data channel / messaging

| Test | LiveKit | Daily.co | Notes |
|---|---|---|---|
| Banner delivery latency | | | |
| Photo request/delivery flow | | | |
| Capture-taken flash | | | |
| Canned prompt delivery | | | |

### 5. Cost

| | LiveKit | Daily.co |
|---|---|---|
| Free tier limits | | |
| Per-minute cost at scale | | |
| Estimated monthly cost (50 sessions × 30 min) | | |
| TURN/relay included or extra? | | |

### 6. POPIA / data residency

| | LiveKit | Daily.co |
|---|---|---|
| Data processing regions available | | |
| Can media stay in ZA / af-south-1? | | |
| Recording: can it be disabled? | | |
| Data retention policy | | |
| GDPR/POPIA DPA available? | | |

### 7. Technical

| | LiveKit | Daily.co |
|---|---|---|
| Client SDK bundle size (gzipped) | | |
| Server SDK needed? | livekit-server-sdk (token minting) | REST API only |
| Self-hosting option? | Yes (open source SFU) | No |
| API stability / breaking changes history | | |

## Test procedure

1. Set `.env.local` with provider credentials
2. Start dev server: `npm run dev`
3. Open room: `/jobs/j5/room?adapter=livekit` (or `daily`)
4. Open client: `/c/demo-live?adapter=livekit` (or `daily`) in second window
5. Run through the checklist: capture frames, request high-res photo, send prompts
6. For mobile: use Cloudflare tunnel (see `phase1/mobile-verification-plan.md`)
7. Record results in this template

## Recommendation

**Winner:** _______________  
**Rationale (3–5 sentences):**

_______________

**Recorded in:** `phase0/10-decision-register.md` D-11 + G2 pass  
**Date decided:** ___
