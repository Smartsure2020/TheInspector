# Provider & mobile test pack — device verification + provider evaluation

**Purpose:** Everything needed to run mobile live-room verification (Gate G1) and
the video provider comparison (Gate G2). These two activities share a testing
session — run them together.

**Gates:** G1 (Mobile live-room verification), G2 (Video provider decision)
**Decision fed:** D-11 (Video provider direction)
**Prerequisite:** Workshop (G3) is NOT required before this — G1/G2 can run in parallel.

---

## Prerequisites — confirm before testing

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Prototype runs clean | | `npm run reset:demo` → `npm run qa:smoke` → 22/22 |
| 2 | `cloudflared` installed (or Render deployment ready) | | See Option A/B below |
| 3 | Android phone (mid-range+, Android 12+, Chrome) | | Model: _______________ |
| 4 | iPhone (iOS 16+, Safari) | | Model: _______________ |
| 5 | LiveKit Cloud account + credentials | | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` in `.env.local` |
| 6 | Daily.co account + credentials | | `DAILY_API_KEY` in `.env.local` |
| 7 | Evidence folder created | | `phase1/spike-evidence/` |
| 8 | This document printed (tester's copy) | | |

---

## HTTPS setup — pick ONE option

### Option A: Cloudflare Quick Tunnel (fastest, no deploy)

```
Terminal 1:  cd prototype && npm run dev
Terminal 2:  cloudflared tunnel --url http://localhost:3000
```

Gives you `https://<random>.trycloudflare.com` — share to phones via SMS or QR.
URL changes each run. **Tear down after testing** (Ctrl+C).

### Option B: Render deployment (persistent URL)

See `phase1/spike-manual-test-guide.md` Option A for full instructions.
Key: use Render/Railway (NOT Vercel — SQLite needs persistent disk).
No env secrets needed — the app has none by design.
**Tear down after testing** (Suspend or Delete the service).

### What NOT to do

- Do NOT run `next dev --experimental-https` (banned — work laptop policy)
- Do NOT install certificates on this machine
- Do NOT use Vercel for P2P testing (serverless breaks in-memory signaling)

---

## Test session plan

Run in this order. Total time: ~2–3 hours.

### Round 1: P2P adapter (baseline)

No provider credentials needed. Tests the built-in WebRTC adapter.

| Step | What | Details |
|------|------|---------|
| 1 | HTTPS URL live | Tunnel or deployment running |
| 2 | SP1–SP4 per phone | Open `{BASE}/c/demo-storm/check` on each phone. Camera, mic, rear switch, torch. |
| 3 | SP5: Cold client join | `{BASE}/c/demo-storm` on phone (cold, no prior visit). Landing → consent → check → waiting. |
| 4 | SP6: Two-way AV | Desktop: `/jobs/j5/room` · Phone: `{BASE}/c/demo-live/session`. Both see/hear each other? |
| 5 | SP7: Capture from phone | Assessor captures frames from the phone's camera feed. Appears in tray? |
| 6 | SP8: High-res photo | Request high-res; client takes photo with rear camera; text legible at 100% zoom? |
| 7 | SP9: Instruction banner | Assessor selects checklist item; banner appears on phone <2s? |
| 8 | SP10: Reconnect | Phone airplane mode 30s → restore. Recovers <60s? |

**Expected:** P2P will likely fail on mobile carrier (CGNAT/strict NAT). That's
evidence for the provider decision, not a bug. Record the failure honestly.

### Round 2: LiveKit adapter

Set `.env.local`:
```
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

Restart dev server. Add `?adapter=livekit` to all URLs. Repeat SP1–SP10.

### Round 3: Daily.co adapter

Set `.env.local`:
```
DAILY_API_KEY=your_key
```

Restart dev server. Add `?adapter=daily` to all URLs. Repeat SP1–SP10.

---

## Results recording

### Per-device, per-adapter results

Copy this table for each combination (e.g., "iPhone Safari + LiveKit"):

**Device:** _______________ **OS/Browser:** _______________ **Adapter:** _______________

| Test | Result | Time/metric | Notes |
|------|--------|-------------|-------|
| SP1: Camera permission | PASS / FAIL | | |
| SP2: Front camera default | PASS / FAIL | | |
| SP3: Rear camera switch | PASS / FAIL | Switch time: ___s | |
| SP4: Torch | PASS / FAIL / N/A | | iOS fallback expected |
| SP5: Cold client join | PASS / FAIL | Taps to join: ___ | |
| SP6: Two-way AV | PASS / FAIL | Time to first frame: ___s | |
| SP7: Capture from phone | PASS / FAIL | Resolution: ___×___ | |
| SP8: High-res photo | PASS / FAIL | Text legible? Y/N | |
| SP9: Instruction banner | PASS / FAIL | Delivery time: ___s | |
| SP10: Reconnect | PASS / FAIL | Recovery time: ___s | |

### Provider comparison summary

Fill `phase1/provider-comparison-template.md` with results from all three rounds.

---

## Pass/fail criteria

| Test | Pass | Hard gate? |
|------|------|-----------|
| SP1 | iPhone Safari: 2-way AV ≤5 taps from URL | **HARD** |
| SP2 | Android Chrome: same | **HARD** |
| SP3 | Rear camera switch <2s, stream continues | **HARD** |
| SP4 | Android torch ON; iOS fallback copy shown | Soft |
| SP5 | JPEG captured; stream ≥~720p on Wi-Fi | **HARD** |
| SP6 | Sticker text legible at 100% zoom from 1.5m, both phones | **HARD** |
| SP7 | Capture-to-thumbnail <1s Wi-Fi / <1.5s mobile data | Hard if >3s |
| SP8 | Call recovers ≤60s | **HARD** |
| SP9 | Feasible in SDK | Soft |
| SP10 | Recorded for both providers | Info only |

**Any HARD failure on a provider disqualifies that provider.**
**HARD failure on ALL providers = "blocked" — escalate before proceeding.**

---

## Evidence to capture (minimum)

Per phone × provider:
- Screenshot: in-call showing two-way video
- Screenshot: device.html log (camera capabilities)
- Screenshot: laptop capture log showing ms timings
- Screenshot: reconnect log

Per phone (once):
- Screenshot: consent screen
- Screenshot: camera check screen
- Screenshot: waiting room
- Screenshot: upload "Received" confirmation
- Screenshot: staff gallery showing the upload
- Screenshot: legibility zoom (rating plate / sticker text)

Save all to `phase1/spike-evidence/` named `SPn-{device}-{provider}.png`.

---

## After testing

1. **Fill** the provider comparison template (`phase1/provider-comparison-template.md`)
2. **Write** a recommendation: which provider wins and why (reference SP rows)
3. **Record** in `phase0/10-decision-register.md` under D-11 and note G1/G2 pass/fail
4. **Tear down** the HTTPS tunnel or Render deployment
5. **Delete** any private GitHub repo created only for deployment
6. Hand the recommendation to management for final provider decision

---

## Rules (binding)

- **Fake data only.** All tests use seeded demo data. No real client data.
- **No provider recommendation without real-device evidence.** Paper comparisons inform; phone tests decide.
- **Results must be honest.** Record failures as failures. P2P failing on mobile is expected and useful.
- **Tear down after testing.** Tunnel URLs are public. Render deployments are public. Neither should persist.
- **No code changes during testing.** If you find a bug, record it; fix it later.
