# Phase 5C — Staging Deployment Report

**Date:** 2026-10-06 · **Status:** PAUSED at manual provisioning (cloud accounts/approvals needed)
**Scope:** fake/internal data only · staff-only staging dry run · no real clients · no new features

## 1. Decision

| Question | Answer |
|---|---|
| Staff-only staging pilot | **NOT YET — conditional GO.** Becomes GO only after §6 blockers are fixed, staging is provisioned, and the checks in §5 pass on the real stack. |
| Real client data | **NO-GO** (unchanged; G4 not approved) |
| Staging default video | LiveKit — **staging default only; provider decision NOT final** |
| Daily.co | Available for comparison |
| P2P | Local/dev fallback only |

## 2. Access audit (what this environment can and cannot do)

| Capability | Status | Consequence |
|---|---|---|
| Git push to `Smartsure2020/TheInspector` (via `gh`) | **Yes** — done: `main` @ `9a648f9` and tag `inspector-current-stable` pushed | — |
| Vercel CLI | Installed; logged in as personal team "Juan-Paul's projects" (no project linked) | Can deploy, but see §6-F6 (plan/ToS/cost) — **not done, needs approval** |
| AWS CLI / credentials / env | **None** (CLI not installed, no `~/.aws`, no `AWS_*` env) | **Cannot** create RDS, S3, IAM. Manual checklist provided |
| Twilio account/credentials | **None** | Cannot configure SMS. Manual checklist provided |
| LiveKit Cloud credentials | **None** | Cannot configure. Manual checklist provided |
| Daily.co key | None | Comparison deferred |
| Account creation / entering credentials | **Not permitted for me** by policy | Accounts and secrets must be created by you |
| Docker Desktop | Installed (I started the daemon) | Used for free local Postgres validation (below) |
| psql / cloudflared | Not installed | Not needed; used `docker exec psql` |
| Paid resources created | **None** | — |
| Secrets committed | **None** | — |
| Production settings changed | **None** | — |

## 3. What was done in this phase

1. Pushed stable checkpoint (commit + tag).
2. Audited env/config handling across the codebase (see §6).
3. **Validated the Postgres path for the first time, locally, free:** throwaway
   `postgres:16-alpine` in Docker, production build with `DB_PROVIDER=postgres`.
   Results in `staging-evidence-chain-results.md`: DDL ran (15 tables), seed loaded,
   staff login + RBAC redirect worked, a real capture was hashed and matched the
   stored file, pack `index.csv` carried the hash, `access_log` row written, and the
   event-log immutability rules blocked UPDATE and DELETE (0 rows affected).
   Container, password file and server were removed afterwards.
4. Wrote: `required-secrets-and-env-vars.md`, `manual-cloud-setup-checklist.md`,
   `rollback-notes.md`, `staging-provider-verification-results.md` (NOT RUN),
   `staging-evidence-chain-results.md`; updated `CURRENT-STATE.md` and the decision register.

## 4. What was NOT done (and why)

| Task | State | Reason |
|---|---|---|
| Staging Postgres (RDS af-south-1) | Not done | No AWS access; region is opt-in; cost approval needed |
| S3 bucket + IAM | Not done | No AWS access |
| HTTPS | Not done | Provided automatically by Vercel on deploy; nothing to do until deploy |
| Twilio staging SMS | Not done | No account. **Code already supports Twilio** (`SMS_PROVIDER=twilio`) |
| LiveKit staging credentials | Not done | No account |
| Vercel deploy | Not done | Plan/ToS/cost approval + prerequisites (§6) |
| Staff login/RBAC/OTP on staging | Not run | No staging. Passed locally on Postgres (login, RBAC); OTP passed in 5A on SQLite |
| S3 file/pack checks | Not run | No S3 |
| Staging evidence chain | Not run | No staging. Passed locally on Postgres + local disk |

## 5. Verification matrix

| Check | Local SQLite | Local Postgres | Staging |
|---|---|---|---|
| Staff login | ✅ | ✅ | ⏳ |
| RBAC (assessor→/admin denied) | ✅ | ✅ | ⏳ |
| Client OTP | ✅ (5A) | not re-run | ⏳ |
| Capture → SHA-256 → matches file | ✅ | ✅ | ⏳ |
| Pack `index.csv` carries hash | ✅ | ✅ | ⏳ |
| `access_log` on pack download | ✅ | ✅ | ⏳ |
| event_log immutable | ❌ (by convention only) | ✅ | ⏳ |
| S3 write / presigned read | — | — | ⏳ |
| Client-upload hash path | not run | not run | ⏳ |
| LiveKit two-party session | — | — | ⏳ |

## 6. Findings that must be handled before/at deployment

| # | Finding | Severity | Proposed handling |
|---|---|---|---|
| F1 | **[FIXED in `cff877d`]** **Video token routes are unauthenticated.** Middleware matcher excludes `/api/`; `/api/livekit/token`, `/api/daily/room`, `/api/rtc/*` check nothing. Anyone with the URL could mint tokens against your LiveKit credentials and join any room. | **High — blocker** | Require a staff session OR a valid client link session on these routes (small defect fix, no new feature). **Needs your OK to change code.** |
| F2 | **[MITIGATED in `cff877d` — direct-to-S3 still required]** **Photo uploads vs size limits.** No `serverActions.bodySizeLimit` is set (Next default 1 MB) and Vercel caps function request bodies at ~4.5 MB; uploads are allowed up to 15 MB. High-res client photos will fail. Frame captures (~100–300 KB) should be fine. | High for hi-res/client uploads | Short term: raise the Next limit and cap hi-res at <4.5 MB on staging. Proper fix: direct-to-S3 presigned upload (this is where Uppy fits; a new capability, so a decision). Verify on staging. |
| F3 | **[FIXED in `cff877d`]** **AWS credentials on Vercel.** The template says "IAM role or env". Vercel has no instance role, and I believe `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` are reserved names there (verify). | Medium | Use Vercel↔AWS OIDC role (preferred) or `S3_`-prefixed key vars with a ~3-line code change to pass explicit credentials to `S3Client`. |
| F4 | **Vercel → RDS networking.** Vercel functions have no fixed IPs on standard plans, so RDS would need a public endpoint (TLS + strong password) — poor posture. Acceptable for fake-data staging only; **not acceptable for production.** | Medium (staging) / High (prod) | Accept for staging with compensating controls, and treat "where production runs" (AWS-hosted app next to a private DB vs Vercel) as an open G12 decision. |
| F5 | **[FIXED in `cff877d`]** **pg connection handling.** `new pg.Pool({connectionString})` — default pool of 10 per serverless instance can exhaust RDS connections; `sslmode=require` semantics in current `pg` may demand the RDS CA bundle. | Medium | Set small `max` (e.g. 3), and configure SSL with the AWS RDS CA or `uselibpqcompat=true`. Verify at provisioning. |
| F6 | **Vercel plan / cost / ToS.** Hobby is non-commercial; company staging likely needs Pro (per-seat, paid). Cape Town (`cpt1`) function region should be set for latency/residency; availability by plan to be verified. | Needs approval | Your call: approve Vercel Pro (or alternative host) before I deploy. |
| F7 | **Deployment Protection vs phone testing.** Protected previews are right (guardrail: no public always-on URL) but block unauthenticated phones. | Low | Use a protection-bypass token or Pro password protection for device tests; fake data only. |
| F8 | `NEXT_PUBLIC_VIDEO_ADAPTER` / `NEXT_PUBLIC_LIVEKIT_URL` are **inlined at build time**. | Low | Set them before the build; changing needs a redeploy. |
| F9 | Event-log immutability on Postgres is implemented with RULES, which the table owner can drop, and the app connects as owner. | Medium for prod | Use a separate migration role and a restricted app role (no DDL) before G8 closes. |
| F10 | `staging-env-vars-template.md` lists `SMS_API_KEY`; the code reads `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER`. `LIVEKIT_URL` is never read (only `NEXT_PUBLIC_LIVEKIT_URL`). | Low | Corrected in `required-secrets-and-env-vars.md`. |
| F11 | `qa:smoke` creates sessions directly in SQLite, so it cannot run against Postgres/staging; `/api/dev/session` is disabled in production. | Low | Staging checks are done through real login; a Postgres-capable smoke runner is future work. |
| F12 | In console-SMS mode OTP codes go to server logs (Vercel function logs). OK for fake-data staging. Twilio trial accounts only send to verified numbers and prepend a trial notice. | Low | Prefer Twilio for staging once the account exists. |
| F13 | LiveKit Cloud media routing region for South Africa is unverified (POPIA residency question for the provider decision). | Open | Record in the provider comparison; not a staging blocker on fake data. |

## 7. Next actions (in order)

**You (manual — see `manual-cloud-setup-checklist.md`):**
1. Approve/decline: Vercel plan (F6), RDS + S3 spend, Twilio and LiveKit accounts.
2. Enable af-south-1 in the AWS account; create RDS Postgres, S3 bucket, IAM/OIDC access.
3. Create Twilio and LiveKit Cloud accounts. Put secrets into Vercel env vars only
   (never chat, never git) — names in `required-secrets-and-env-vars.md`.

**Me (once you approve):**
1. Fix F1 (token-route auth), F3 (explicit S3 credentials), F5 (pool/SSL), raise upload limit (F2). All small, no new features.
2. Link Vercel project (`prototype/` root, region `cpt1`), deploy protected preview.
3. Run §5 staging column; fill `staging-evidence-chain-results.md` and `staging-provider-verification-results.md`; update this report's decision.

## 8. Gate status

See `CURRENT-STATE.md`. Mobile/device (G1 in repo numbering) and provider decision (G2) are
**provisionally recalled as passed, evidence not located, formal retest required** before any
real-client pilot or final provider decision. Template sign-off (G3 in repo numbering) is
**not formally passed** until filed.

---

## 9. Update — approved code fixes (commit `cff877d`, 2026-10-06)

Approved by Juan-Paul: F1, F3, F5, and F2 **partially**. Still **no deploy, no paid resources, no secrets**.

| # | Status | What changed |
|---|---|---|
| F1 | **Fixed** | `/api/livekit/token`, `/api/daily/room`, `/api/rtc/*` authorize first via `lib/video-access.ts`: staff = assessor assigned to exactly that job; client = link for exactly that job, valid join state, OTP-verified. Role/identity are decided server-side (request `identity` ignored); LiveKit token TTL 2 h; auth precedes config checks (no 503 info leak). Adapters pass the client link token; the unauthenticated LiveKit fallback fetch was removed. |
| F3 | **Fixed** | S3 uses `S3_REGION`, `S3_BUCKET` (required), `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` (both or neither; else default AWS chain). |
| F5 | **Fixed** | `PG_POOL_MAX` (3 on Vercel), `PG_SSL_MODE` (`verify` default for remote hosts / `no-verify` / `disable`), `PG_SSL_CA`; `sslmode` params in `DATABASE_URL` are stripped so they cannot override. |
| F2 | **Mitigated only — not solved** | Staging-safe limit **3.5 MB** (`lib/limits.ts`) under `serverActions.bodySizeLimit: 4mb` and Vercel's ~4.5 MB cap. Checked in the browser with clear copy (production hides server-action error text, so a server-only message would be silent). **Direct-to-S3 (presigned) upload is REQUIRED before any real-client pilot.** Minimal presigned upload first; Uppy later as UX/resumable enhancement. 15 MB high-res photos still cannot be sent on Vercel. |

### New findings from this work

| # | Finding | Severity | Status |
|---|---|---|---|
| F14 | **OTP bypass.** `checkOtpVerified` accepted any non-empty cookie named `inspector.otp.<token>`; anyone with a link could skip SMS verification by setting it. | High | **Fixed** (value validated against a really-verified challenge, timing-safe, 8 h; cookie path widened to `/` so it also reaches `/api/*`). Existing client sessions re-verify once. |
| F15 | `otp_challenges.link_token` stored the **raw** link token, undoing the link-token hashing elsewhere. | Medium | **Fixed in `d22d82d`** — see §10. |
| F16 | Client server actions that take a link `token` (e.g. `uploadEvidenceAction`, readiness pings) checked the link only — **not** OTP verification. Pages were gated; direct action calls were not. | Medium–High | **Fixed in `d22d82d`** — see §10. |
| F17 | Video-route auth does 2–4 small DB lookups per call (the P2P channel polls ~1/s). Fine for staging. P2P in-memory signaling cannot work across serverless instances (reinforces LiveKit as staging default). | Low | Noted |

### Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npm run build` | Clean |
| `npm run qa:smoke` (production mode, fresh fake-data book, default env) | **33/33 pass** (27 + 6 new video-route 401/403 checks) |
| Local authorization matrix, 36 cases: LiveKit / Daily / rtc × no-auth, assigned and unassigned assessor, admin, manager, wrong job, unknown room, forged OTP cookie, valid OTP, peer and identity spoofing, upload-purpose link, page OTP gate | **36/36 pass** (dummy local provider keys, never committed) |
| Real OTP flow in browser → cookie reaches `/api` → client token mints; spoofed peer 403 | Pass |
| Real staff live room (P2P loopback) as assigned assessor: 14 signaling polls all 200; capture saved with SHA-256 | Pass |
| Secrets in diff / tracked files | None found |

### Remaining manual provisioning (nothing created)

See `manual-cloud-setup-checklist.md`. Needs your approvals/accounts: Vercel plan (or alternative host), AWS af-south-1 (enable region, RDS Postgres, S3 bucket, IAM user + key, regional RDS CA bundle), Twilio, LiveKit Cloud. Then: link Vercel project, set env vars per `required-secrets-and-env-vars.md`, deploy a protected preview, run the staging checks.

> **Gate numbering note:** repo IDs are canonical — G1 mobile verification, G2 provider decision, G3 template sign-off (`handover/06-DEFERRED-GATES.md`). Earlier discussion used workshop / mobile / provider as G1 / G2 / G3. Statuses are recorded by activity in `CURRENT-STATE.md`.

---

## 10. Update — F15 and F16 fixed (commit `d22d82d`, 2026-10-06)

Still **no deploy, no cloud resources, no secrets**. Fake/internal data only.

### F15 — OTP link tokens hashed at rest

| Item | Result |
|---|---|
| Storage | `otp_challenges.link_token_hash = sha256(token)`; the raw `link_token` column no longer exists on fresh databases. All lookups use the hash. |
| Migration (idempotent, SQLite + Postgres) | add `link_token_hash` → backfill `sha256(raw)` → **overwrite** the raw values → drop old index and column → compact (`VACUUM` / `VACUUM FULL`) so the old bytes are physically gone. Guarded by a column-existence check, safe to re-run. |
| Cookie | Name is `inspector.otp.<first 16 hex of sha256(token)>`; value is derived from hashes only. The raw token is no longer in the cookie name (the cookie is sent on every path since the F1 fix). |
| Logs | No raw token or OTP-link value is logged anywhere (checked server logs during the runs). |
| Extra tightening | `sendOtpAction`/`verifyOtpAction` refuse revoked/expired/invalid links — an old link can no longer trigger an SMS. |

### F16 — client server actions gated on link + OTP

New `checkClientAccess()` (`lib/client-access.ts`): the link must resolve to a real job, be in an allowed state (not revoked/expired/cancelled), have an allowed purpose, and the OTP cookie must validate against a verified challenge **for that exact link**.

| Action | Gate | On failure |
|---|---|---|
| `uploadEvidenceAction` | state must be `valid` (it previously also accepted **expired** links) + OTP | returns `{error, needsOtp?}`; UI shows the message, sends client to `/verify` if OTP missing |
| `consentAction`, `consentDeclineAction`, `cannotAttendAction` | join link, `valid`/`too_early` + OTP | redirect to `/verify` (OTP) or landing (link) |
| `clientPingAction` | join link, `valid`/`too_early` + OTP | silent no-op, nothing written |
| `requestNewLinkAction` | token must resolve to a job; **no OTP/active-state** | **Deliberate exception**: an expired/revoked-link client must be able to ask for a new link. Writes one audit event only. |

### Verification

| Check | Result |
|---|---|
| Secret scan (diff + tracked files) | Clean |
| `npx tsc --noEmit` | Clean |
| `npm run build` | Clean |
| `npm run qa:smoke` (production, default env, fresh book) | **33/33** |
| Authorization matrix (video routes), re-run for the new storage/cookie scheme + legacy-format cookie | **37/37** |
| Migration on **SQLite** from an old-schema DB with raw tokens | 7/7: column dropped, hashes = sha256(raw), rows kept, old index gone, **raw tokens absent from DB + WAL bytes**, none in server log |
| Migration on **Postgres 16** (Docker, throwaway) from an old-schema table | hash backfilled and matches, rows kept, raw token absent from table text and server log, new index present |
| Real OTP flow → client upload | Pass (stored with SHA-256) |
| Upload with OTP invalidated server-side (page already loaded) | Refused, nothing written, client sent to `/verify` |
| Upload with link **expired** / **revoked** mid-session | Refused ("This link is no longer active…"), nothing written |
| Oversize (4 MB) / wrong type | Refused with clear copy, nothing written |
| Recovery after restoring OTP/link | Upload works again |
| Consent action with OTP invalidated (page already loaded) | Refused, redirected to `/verify`, **0** `consent_accepted` events |
| Same consent action with valid OTP (control) | Advances to `/check`, 1 event |

Test-process notes (for honesty): two of my own test attempts were flawed and were redone — one targeted the wrong table when "expiring" the link, one clicked a disabled button. Neither reflected a product defect; the corrected runs above are the evidence.

### New / residual findings

| # | Finding | Severity | Status |
|---|---|---|---|
| F18 | **[DESIGN DECISION — see §11]** `appointments.link_token` and `client_upload_requests.link_token` still store the **raw** token in plaintext (a comment in `schema.ts` says "hashed at hardening"). Staff need to copy/send the link, so removing it is a design change (show-once link + regenerate), not a column drop. Lookups already use the hash. | Medium | **Open — needs a decision** before any real-client pilot |
| F19 | **[FIXED in `6007ec2` — see §11]** OTP issuance had no cooldown or per-link/IP rate limit: after a challenge's 3 attempts are used, the next `/verify` visit issues a new code. A holder of a link can trigger repeated SMS to the client (cost/spam) and make repeated 3-guess attempts. 6-digit space makes brute force slow but not impossible over time. | Medium | **Open** — recommend per-link resend cooldown + lockout before any real-client pilot |
| F20 | Link tokens still appear in URL paths (`/c/<token>`) by design; reverse-proxy/Vercel access logs will contain them. Treat logs as sensitive; consider short-lived tokens or POST-based exchange later. | Low–Medium | Noted |

### Remaining blockers before a staging deploy

1. **Approvals/accounts (yours):** Vercel plan or alternative host; AWS af-south-1 RDS/S3 spend + IAM key + regional RDS CA; Twilio; LiveKit Cloud — see `manual-cloud-setup-checklist.md`. **Nothing was created.**
2. Decide on F18/F19 timing (recommended before real-client pilot, not required for staff-only fake-data staging).
3. Direct-to-S3 upload remains **required before any real-client pilot** (F2).
4. Formal mobile/provider re-test (G1/G2) and workshop/template evidence (G3) still outstanding.
5. After provisioning: deploy a protected preview and run the staging checks in `staging-evidence-chain-results.md` / `staging-provider-verification-results.md`.

---

## 11. Update — F19 fixed (commit `6007ec2`, 2026-10-06); F18/F20 recorded

Still **no deploy, no cloud resources, no secrets**. Fake/internal data only.

### F19 — OTP send limits

| Control | Value (default → env override) |
|---|---|
| Cooldown between sends, per link | 60 s → `OTP_RESEND_COOLDOWN_SECONDS` |
| Max sends per rolling hour, per link | 5 → `OTP_MAX_SENDS_PER_HOUR` |
| Verification attempts per code | 3 (unchanged) |
| Worst case for someone holding a link | 5 SMS and 15 guesses per hour (of 1,000,000 codes) |

How it behaves:
- `/verify` sends the **first** code only. Refreshing never re-sends while a usable code exists. Every send counts (one `otp_challenges` row = one SMS).
- Explicit **"Send me a new code"** button with a live countdown. The server is authoritative: forged requests replayed directly at the server action get the same `cooldown` / `limit` answer.
- Client-facing copy for cooldown, hourly limit ("new codes are paused for your security… try again in about N minutes, or contact your claims coordinator"), no attempts left, and send failure.
- A failed SMS send no longer crashes the page; it counts toward the limits and shows a friendly message.
- **Audit events** (never contain codes or phone numbers): `otp_sent`, `otp_rate_limited {reason, retry_after_s}`, `otp_attempts_exhausted`, `otp_send_failed`. Rate-limit events are deduplicated to once per job+reason per 10 minutes because the event log is append-only and must not be floodable.
- Adjacent one-line fix: `randomOtp()` used `Math.random()` (predictable); it now uses `crypto.randomInt` (F21, fixed).

### Verification

| Check | Result |
|---|---|
| Secret scan | Clean |
| `npx tsc --noEmit` / `npm run build` | Clean / Clean |
| `npm run qa:smoke` (production, default env) | **33/33** |
| Authorization matrix (re-run, OTP-related) | **37/37** |
| First visit | 1 SMS, `otp_sent` audited, button shows live countdown |
| Page refreshes | 0 extra SMS |
| Forged server-action replay inside cooldown | `{"state":"cooldown","retryAfterSeconds":4}`, 1 audit event |
| Hourly cap (3 with test limits): 5 forged replays | all `limit`, still 3 SMS rows, **1** audit event (dedupe works) |
| 3 wrong codes | friendly counting messages; `otp_attempts_exhausted` audited once |
| Limited page after exhausting the code | "paused for your security" copy, **no resend button**, no new SMS on reload |
| Normal client on another link | 1 SMS → verified → client page (unaffected) |
| Defaults | confirmed 60 s on a default-env server |
| Audit rows containing 6-digit codes / phone numbers | 0 |
| Not exercised | the Twilio failure path (`otp_send_failed`) — needs a real Twilio account; code path is small but untested live |

Test-process note: my first "bypass the countdown" attempt did nothing because React ignores clicks on a button whose `disabled` prop is true; I replaced it with a direct replay of the real server-action request, which is the stronger test.

### New findings from this work

| # | Finding | Severity | Status |
|---|---|---|---|
| F21 | OTP codes were generated with `Math.random()`. | Medium | **Fixed** (`6007ec2`) |
| F22 | **[Required before real-client pilot — preferred: send only after the client taps "Text me a code"]** Link-preview/security scanners that follow `/c/<token>` → `/verify` can trigger the first SMS (page render sends it). The new limits bound this to 1 send per cooldown and 5 per hour per link, but it can still spend an SMS and set a cooldown before the real client arrives. | Low–Medium | Open — option: send the first code only on an explicit user action ("Text me a code"). Decide before real-client pilot. |
| F23 | **[Concurrency hardening required before production/real-client use; not a staging blocker]** Rate-limit checks are read-then-insert, so two simultaneous requests could both pass and send two SMS (still bounded: the next request sees both rows). | Low | Noted |
| F24 | **[FIXED in `f41c58c` — see §13]** `data.ts` parses stored UTC timestamps without a `Z` (e.g. link expiry), so on a server whose timezone is not UTC (this laptop is UTC+2) link expiry/early-window checks are skewed by the offset. Vercel runs in UTC so staging is unaffected; the new OTP code uses explicit UTC. | Low (staging) | Open — fix before relying on local-time hosts |

### F18 — recorded as a pre-real-client-pilot design decision (not started)

- **Current model:** raw link tokens are stored in `appointments` and `client_upload_requests` so staff can copy/paste the link into an SMS. Lookups already use the hash.
- **Likely future model:** **show-once link + regenerate/revoke** — the link is displayed (or sent) once at creation; only the hash is stored; staff regenerate (which revokes the old link) instead of re-reading it.
- **Not required for fake-data, staff-only staging.** Needs a decision, a UX change on the staff job page, and a migration before any real-client pilot.

### F20 — operational risk (documented, not a staging blocker)

- Link tokens appear in URL paths (`/c/<token>`). Treat as sensitive: staging server/CDN logs, screenshots, screen recordings, browser history, chat messages and error reports can all contain a live link.
- For staging: use fake data only, do not paste links into shared channels, and expire/regenerate demo links after test sessions. Revisit with F18 (short-lived or exchange-based tokens).

### Remaining blockers

1. **Approvals/accounts (yours):** Vercel plan or alternative host; AWS af-south-1 (RDS, S3, IAM key, regional RDS CA); Twilio; LiveKit Cloud — `manual-cloud-setup-checklist.md`. Nothing was created. The OTP limits above bound Twilio spend and abuse once the account exists.
2. **Before any real-client pilot:** F18 design decision; F22 decision; direct-to-S3 upload (F2); formal mobile/provider re-test (G1/G2) and workshop/template evidence (G3).
3. Then: deploy protected preview and run the staging checks.

---

## 12. Position after `f119f16` (recorded 2026-10-06)

F19 and F21 closed. Twilio abuse risk reduced, not production-final. Staff-only fake-data staging may proceed after manual provisioning; **real-client pilot remains NO-GO**. F22 (required before real-client pilot), F23 (before production), F24 (before next pilot rehearsal), F18 and direct-to-S3 upload are recorded and **not started**. Deployment is paused until accounts and spend are approved. See `CURRENT-STATE.md` → "Current position".

---

## 13. Update — F24 fixed (commit `f41c58c`, 2026-10-06)

Scope kept tight: time **calculations** only. No F18, F22, direct-to-S3, deploy, cloud resources or secrets.

### What the bug really was

The database stores two different kinds of timestamp in the same text shape (`YYYY-MM-DD HH:MM[:SS]`):

| Kind | Examples | Meaning |
|---|---|---|
| **UTC instants** (written by `nowIso()`) | `created_at`, `occurred_at`, `verified_at`, `captured_at`, OTP/session expiry | exact moments in UTC |
| **Wall-clock business time** (typed by staff in the schedule form) | `appointments.scheduled_start`, `link_expires_at` (start + 24 h), upload-request `expires_at` | South African time, no zone stored |

Every parser used `new Date(s.replace(" ", "T"))` — "the server's local timezone" — which is correct for wall-clock values only on a SAST server and for UTC instants only on a UTC server. The same stored `2026-10-07 09:00` meant 07:00Z on this laptop and 09:00Z on Vercel: link expiry and the 2-hour early-join window moved by two hours depending on where the app ran.

### Fix

New `src/lib/time.ts` (pure, client-safe): `parseUtcStamp` / `utcStampFromMs` for instants; `parseWallStamp` / `wallStampFromMs` / `wallParts` for wall-clock business time. SAST is a fixed **+02:00** (no DST), so the offset is exact. Applied to:

- `resolveToken` link expiry and early-join window (`data.ts`)
- `scheduleAction` expiry (start + 24 h, no server-local getters); an invalid date/time is now rejected instead of silently storing `NaN-NaN-NaN`
- schedule-form defaults (were server-local, i.e. UTC on Vercel; now SAST)
- client countdown (`ClientBits`, now correct on any device timezone)
- `formatRelative` ("x minutes ago") parses UTC instants
- OTP helpers reuse the shared functions

**Not changed:** stored values/schema, and the *display* of stored digits.

### Verification

| Check | Result |
|---|---|
| Secret scan | Clean |
| `npx tsc --noEmit` / `npm run build` | Clean / Clean |
| `npm run qa:smoke` (production, default env) | **33/33** |
| New `npm run qa:time` (17 checks: UTC vs wall parsing, 24 h expiry incl. month/year rollover, form defaults, invalid input) | Identical and correct under **UTC, Africa/Johannesburg, America/New_York, Pacific/Auckland** |
| Demonstration of the original bug | Old parse of `2026-10-07 09:00`: 09:00Z under TZ=UTC vs 07:00Z under TZ=SAST; new parse: 07:00Z in both |
| Real servers started under TZ=UTC, SAST and New York; `demo-live` set relative to now | Identical decisions: starts in 1 h → valid; in 3 h → too_early; **119 min → valid, 121 min → too_early**; expires in 1 min → valid; expired 1 min ago → expired |
| Schedule-form default on a UTC server | Shows SAST (now + 30 min), not UTC |
| Booking through the UI on a UTC server (start 2026-12-31 22:00) | Stored expiry 2027-01-01 22:00 |

### New findings

| # | Finding | Severity | Status |
|---|---|---|---|
| F25 | **Display of UTC instants.** Event/created/submitted times are shown as their stored UTC digits (two hours behind South African time), and "Today/Yesterday" bucketing uses the server's clock. Wall-clock values (scheduled times) display correctly. Converting UTC instants for display is a product decision because seeded demo values are literal wall-clock strings and would shift. Also: evidence labels embed the assessor's browser-local time while `captured_at` is UTC. | Low | Open — decide before pilot rehearsal |
| F26 | Seeded demo links have a fixed `link_expires_at` of **2026-12-31 23:59** (wall-clock). After that date the `demo-*` links become "expired", and demos/`qa:smoke` checks that rely on them need the fixtures updated. | Low | Open — note for after 2026-12-31 |

### Status

Staff-only fake-data staging: still pending manual provisioning. Real-client pilot: **NO-GO**. Deployment paused; no cloud resources; no secrets.
