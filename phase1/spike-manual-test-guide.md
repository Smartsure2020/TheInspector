# Device Spike — Manual Testing Guide (no local certificates)

**Status:** COMPLETE (manual run, 2026-07-06) — device capability verified on
Android, iPhone and laptop; results sufficient to continue the prototype.
Daily.co provider testing DEFERRED (requires payment — excluded by instruction);
LiveKit untested (only if free testing is possible). **No provider selected** —
Chunk 1D proceeds on the provider-agnostic adapter (see
`prototype/src/lib/video/adapter.ts` and `phase1/chunk1d-live-room-notes.md`).
**Laptop policy:** no certificate generation/installation on the work laptop —
both options below terminate HTTPS elsewhere. `--experimental-https` is banned.
**Rules (binding):** SP1–SP10 may only be filled from real-device evidence ·
no provider recommendation until the matrix is complete · Chunk 1D stays blocked ·
fake/demo data only, no real-client data, no new scope.

**Time budget:** ~30 min setup + ~90 min testing (both providers, both phones).

---

## 0. Prerequisites (once, ~20 min)

1. **Phones:** a real iPhone (Safari) and a mid-range Android (Chrome). Charge them.
2. **Daily.co:** free account at dashboard.daily.co → Rooms → Create room →
   copy the room URL (`https://YOURDOMAIN.daily.co/YOURROOM`). 
3. **LiveKit Cloud:** free account at cloud.livekit.io → create project → note the
   `wss://….livekit.cloud`  URL → Settings → Keys → generate **two access tokens**
   for the same room name (dashboard token tool), one per device.
   Keep both tokens in a note on your phone/paper — **never commit them or put
   them in `.env` files; the harness pages take them as on-page inputs only.**
   4. **Evidence folder:** create `phase1\spike-evidence\` — all screenshots go here,
   named `SPn-{device}-{provider}.png` (e.g. `SP3-iphone-daily.png`).

---

## 1. Getting an HTTPS URL for the phones — pick ONE option

### Option A — Public HTTPS preview deployment (works on any network)

Deploy the prototype to a free host with a persistent Node process.
**Use Render.com (or Railway) — NOT Vercel** (serverless filesystems break the
SQLite prototype; Render's ephemeral disk is fine because the DB self-seeds with
fake data on every boot).

1. Push the repo to a **private** GitHub repository (it contains no secrets —
   verify: `git grep -i "api_key\|secret\|token=" -- prototype/src` returns nothing).
2. Render → New → Web Service → connect the private repo.
   - Root directory: `prototype`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Instance type: Free. **Instances: 1** (SQLite requires a single instance).
3. **Environment variables: NONE required.** The app has no secrets by design.
   Do NOT add Daily/LiveKit keys as env vars — they are pasted into the harness
   pages at runtime and never stored.
4. Wait for deploy → you get `https://<name>.onrender.com`. That is `{BASE}`.
5. Safety notes: demo data only (seeded fake records); the URL is unlisted but
   public — don't circulate it; the PROTOTYPE banner must be visible on every page.
6. **Teardown after testing (required):** Render dashboard → the service →
   Settings → Suspend (or Delete). Confirm the URL returns an error afterwards.
   Delete the private GitHub repo if it was created only for this.

### Option B — HTTPS tunnel to the local dev server (fastest; no deploy)

No account, no admin rights, no certificates:

1. On the laptop: `cd prototype` → `npm run dev` (plain HTTP on :3000 — fine,
   the tunnel provides HTTPS).
2. Download the single-file Cloudflare Tunnel binary (no install):
   https://github.com/cloudflare/cloudflared/releases/latest →
   `cloudflared-windows-amd64.exe` → save to Downloads.
3. Run: `cloudflared-windows-amd64.exe tunnel --url http://localhost:3000` 
4. It prints a URL like `https://random-words.trycloudflare.com`. That is `{BASE}`.
   (URL changes each run — rerun = re-send to phones.) (https://capture-zoo-colon-gnome.trycloudflare.com  )
5. Phones: open `{BASE}` in Safari/Chrome over **mobile data** (that's the real
   4G test) and also once on Wi-Fi.
6. Alternative: ngrok (`ngrok http 3000`) — needs a free account + authtoken.
7. **If the company network blocks tunnelling:** tether the laptop to a phone
   hotspot (takes the corporate network out of the path) and rerun step 3;
   if that's not allowed either, use Option A.
8. Teardown: Ctrl+C the tunnel; nothing persists.

---

## 2. Test run — exact URLs and what to record

Do the full sequence on the **iPhone first**, then repeat on the **Android**.
Laptop Chrome plays the assessor side for SP5/SP7.

### 2.1 Device capability — open `{BASE}/spike/device.html` on the phone

| Step | Do | Record (screenshot the on-page log) |
|------|----|-------------------------------------|
| SP3a | Tap **Front cam** then **Rear cam (SP3)** | Both start? Resolution logged? Switch < 2 s? |
| SP4 | Rear cam on → **Torch ON** | Torch lights (look at the phone) OR the FAIL line. iOS failure is EXPECTED — record it honestly |
| SP6a | **High-res still (SP6)** | Logged resolution + capture ms. iPhone will use the canvas fallback — the resolution number it logs is the SP6 iOS ceiling; judge legibility in 2.4 |

### 2.2 Daily.co — open `{BASE}/spike/daily.html` on BOTH laptop and phone

1. Paste the Daily room URL on both → **Join** on both.
2. Record per device: taps from link → two-way AV (SP1 iPhone / SP2 Android);
   camera permission prompt behaviour.
3. Phone: switch to rear camera mid-call using the phone's own camera controls in
   2.1's flow — for in-call switch, rejoin `{BASE}/c/demo-geyser` later covers it;
   here confirm video continues after device rotation/lock-unlock.
4. Laptop: point the phone at a geyser/appliance sticker → **Capture remote frame
   (SP5/SP7)** ×5 → record the logged resolution and grab-to-thumbnail ms
   (pass < 1000 ms Wi-Fi / < 1500 ms mobile data).
5. SP8: phone into flight mode 30 s → restore → record what the log shows and
   whether the call recovers (auto or one tap; total seconds).
6. SP9: note whether the room was created with knocking/waiting-room enabled and
   whether admit control appears feasible (Daily room setting `enable_knocking`).
7. SP10: note Daily's current per-participant-minute price from their pricing page.

### 2.3 LiveKit Cloud — open `{BASE}/spike/livekit.html` on BOTH devices

Same script as 2.2 using the wss URL + one token per device.
SP9 for LiveKit = tokens/permissions pattern (note effort vs Daily's knocking).
SP10 = LiveKit Cloud pricing page numbers.

### 2.4 Client journey — open `{BASE}/c/demo-geyser` on each phone

- Landing shows appointment, assessor, partial claim ref `…88103`, prep list →
  screenshot.
- Continue → consent (type name, agree) → camera check:
  - camera preview appears (permission prompt count?),
  - **Try your back camera** works (SP3 in-app confirmation),
  - mic bar moves when you speak,
  - **Test torch**: Android expect ON; iPhone expect the graceful fallback copy —
    record which appeared,
  - continue → waiting room.
- **Visibility check:** on every screen confirm NO internal data (no checklist
  contents, notes, flags, statuses, policy/decision language). Screenshot each
  screen. Any leak = stop, it's a defect.

### 2.5 Upload — open `{BASE}/c/demo-upload/upload` on each phone

- Both missing items listed in plain language.
- **Take photo or choose file** → use the camera → photograph any sticker/label
  from ~1.5 m.
- Item flips to "✓ Received". Laptop: `{BASE}/jobs/j6/evidence` → the upload
  appears under Documents as a real image → zoom to 100%: **is the sticker text
  legible?** (this is the SP6 acceptance in practice). Screenshot both sides.

---

## 3. Pass/fail criteria and hard gates

| # | Test | Pass | Gate |
|---|------|------|------|
| SP1 | iPhone Safari join, no install | 2-way AV ≤ 5 taps from URL | **HARD** |
| SP2 | Android Chrome join, no install | Same | **HARD** |
| SP3 | Rear camera switching | < 2 s, stream continues, no re-prompt | **HARD** |
| SP4 | Torch | Android in-call ON; iOS: fallback copy shown and workable | Soft — fallback acceptable |
| SP5 | Remote frame capture | JPEG produced; received stream ≥ ~720p on Wi-Fi | **HARD** |
| SP6 | High-res photo + upload | Sticker legible at 100% zoom from 1.5 m, on BOTH phones | **HARD** |
| SP7 | Capture-to-thumbnail | < 1 s Wi-Fi / < 1.5 s mobile data | Hard if grossly missed (> 3 s) |
| SP8 | Reconnect after 30 s drop | Call recovers ≤ 60 s, auto or one tap | **HARD** |
| SP9 | Waiting-room/admit control | Feasible in SDK (either pattern) | Soft — design adapts |
| SP10 | Cost | Recorded for both | Info only |

**Hard blockers:** any HARD row failing on a provider disqualifies that provider;
failing on BOTH providers = spike verdict "blocked" → escalate before 1D.

## 4. Evidence required (minimum set in `phase1\spike-evidence\`)

Per phone × provider: join screenshot in-call · device.html log screenshot ·
laptop capture log showing ms timings · reconnect log screenshot.
Per phone: consent screen · camera check · waiting room · upload "✓ Received" ·
staff gallery showing the upload · the legibility zoom screenshot.

## 5. Verdict (complete ONLY after the matrix is filled)

Transcribe results into `spike-report.md` (SP1–SP10 matrix), then:

- **Recommended provider for Phase 1:** Daily.co / LiveKit Cloud / **BLOCKED** — ______
- Reasons (reference SP rows): ______________________________________________
- Workarounds/fallbacks required: ___________________________________________
- Room-spec (phase1/04) adjustments forced: _________________________________
- Tester name + date: ____________ Approved by: ____________
- **Go / No-go for Chunk 1D:** ______

Until this section is signed, Chunk 1D does not start.
