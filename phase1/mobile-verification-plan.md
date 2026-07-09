# Mobile live-room verification plan (Gate G1)

**Status:** Plan only — tests NOT passed until a human runs them on real devices.  
**Gate:** G1 in `handover/06-DEFERRED-GATES.md`  
**Prerequisite:** HTTPS in front of the dev server (phones require secure context for getUserMedia).

---

## 1. HTTPS setup — Cloudflare Quick Tunnel

The work laptop policy blocks local TLS certificates. Use a Cloudflare Quick Tunnel (free, ephemeral, zero-config).

### Prerequisites
- Install `cloudflared`: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
- No account needed for quick tunnels

### Steps
```bash
# Terminal 1 — dev server
cd C:\Users\renault\Documents\AI\INSPECTOR\prototype
npm run reset:demo
npm run dev          # → http://localhost:3000

# Terminal 2 — tunnel
cloudflared tunnel --url http://localhost:3000
# Output: https://<random>.trycloudflare.com
```

The tunnel URL is ephemeral and changes each run. Share it with the test phone via SMS or QR code.

### Alternative: Preview deployment
If the tunnel is unreliable, deploy to Vercel preview (free tier):
```bash
npx vercel --yes
```
Note: Vercel uses serverless — the in-memory `/api/rtc` signaling won't work across function invocations. Use a provider adapter (`?adapter=livekit` or `?adapter=daily`) for Vercel testing, not P2P.

---

## 2. Device / browser matrix

Test at minimum:

| # | Device | OS | Browser | Priority |
|---|---|---|---|---|
| 1 | Android phone (mid-range+) | Android 12+ | Chrome | Required |
| 2 | iPhone | iOS 16+ | Safari | Required |
| 3 | Android phone | Android 12+ | Firefox | Nice-to-have |
| 4 | iPad | iPadOS 16+ | Safari | Nice-to-have |

Record: device model, OS version, browser version for each test.

---

## 3. Test cases (mapped from SP1–SP10)

All tests use FAKE seeded data only. The tunnel URL replaces `localhost:3000`.

### SP1 — Camera permission prompt
- **Route:** `https://<tunnel>/c/demo-storm/check`
- **Steps:** Open on phone, grant camera/mic permission
- **Pass:** Live camera preview appears; mic meter moves; no errors
- **Fail:** Permission denied, black screen, or browser error

### SP2 — Front camera default
- **Route:** Same as SP1
- **Steps:** Check which camera activates by default
- **Pass:** Front (selfie) camera active
- **Fail:** Rear camera or no camera

### SP3 — Rear camera switch
- **Route:** `https://<tunnel>/c/demo-live?adapter=<provider>/session` (or in-session)
- **Steps:** Tap the 🔄 flip button
- **Pass:** Camera switches to rear; preview updates; no crash
- **Fail:** Camera doesn't switch, preview freezes, or app errors

### SP4 — Torch control
- **Route:** Same as SP3
- **Steps:** Tap the 🔦 torch button (rear camera must be active)
- **Pass:** Torch toggles on/off, or graceful "torch not available" message
- **Fail:** App crashes or torch silently fails with no message

### SP5 — Cold client link join
- **Route:** `https://<tunnel>/c/demo-storm`
- **Steps:** Open link cold on phone (no prior visit). Walk: landing → consent → camera check → waiting room
- **Pass:** All four steps complete unaided; consent logged; camera check shows preview; waiting room loads
- **Fail:** Any step fails, requires instruction, or errors

### SP6 — Two-way AV (desktop ↔ phone)
- **Route:** Desktop: `/jobs/j5/room?adapter=<provider>` | Phone: `https://<tunnel>/c/demo-live?adapter=<provider>`
- **Steps:** Assessor on desktop, client on phone. Both see/hear each other.
- **Pass:** Bidirectional video and audio within 10 seconds of admission
- **Fail:** One-way or no media

### SP7 — Capture loop from phone camera
- **Route:** Same as SP6
- **Steps:** Assessor selects checklist item, presses Capture
- **Pass:** Frame captured from the phone's camera feed; appears in tray with correct label
- **Fail:** "No client video" error or blank/corrupt capture

### SP8 — High-res photo request
- **Route:** Same as SP6
- **Steps:** Assessor requests high-res photo; client takes photo with rear camera; reviews and sends
- **Pass:** Photo appears in assessor's tray marked HI-RES; text on a rating plate is legible
- **Fail:** Photo doesn't arrive, is low-res, or text is unreadable

### SP9 — Instruction banner on phone
- **Route:** Same as SP6
- **Steps:** Assessor selects a checklist item with a client instruction
- **Pass:** Banner appears on the client's phone screen within 2 seconds
- **Fail:** Banner missing, delayed >5s, or garbled

### SP10 — Reconnection on mobile network
- **Route:** Same as SP6
- **Steps:** Client on phone, connected. Toggle airplane mode for 5 seconds, then turn off.
- **Pass:** Connection recovers within 15 seconds; "reconnecting" state visible then resolves
- **Fail:** Connection permanently lost; requires page refresh to recover

---

## 4. Results recording template

| Test | Device | OS/Browser | Adapter | Result | Notes |
|---|---|---|---|---|---|
| SP1 | | | | PASS / FAIL | |
| SP2 | | | | PASS / FAIL | |
| SP3 | | | | PASS / FAIL | |
| SP4 | | | | PASS / FAIL | |
| SP5 | | | | PASS / FAIL | |
| SP6 | | | | PASS / FAIL | |
| SP7 | | | | PASS / FAIL | |
| SP8 | | | | PASS / FAIL | |
| SP9 | | | | PASS / FAIL | |
| SP10 | | | | PASS / FAIL | |

Repeat the table for each device × adapter combination tested.

---

## 5. Important warnings

- **Fake data only** — all tests use the seeded demo book. No real client data.
- **Tear down the tunnel** — close `cloudflared` after testing. The URL is public.
- **P2P may fail on mobile carriers** — CGNAT/strict NAT blocks P2P without TURN. If P2P fails, that's expected evidence for the provider decision (G2), not a bug to fix.
- **Provider adapters require credentials** — set `.env.local` before testing with `?adapter=livekit` or `?adapter=daily`.

---

## 6. Gate G1 pass criteria

G1 passes when:
- [ ] HTTPS route established (tunnel or deployment)
- [ ] SP1–SP10 run on ≥2 real phones (Android + iPhone)
- [ ] Cold link → waiting room → session → capture verified on phone
- [ ] Results written up with device/OS/browser matrix
- [ ] Findings recorded in this file and `phase0/10-decision-register.md`

G1 does NOT require all tests to pass — it requires them to be RUN and the results RECORDED honestly. Failures feed the provider decision (G2).
