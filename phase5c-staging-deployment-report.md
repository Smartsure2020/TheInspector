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
| F15 | `otp_challenges.link_token` stores the **raw** link token, undoing the link-token hashing elsewhere. | Medium | Open — needs a migration (store `sha256(token)`); not in approved scope. |
| F16 | Client server actions that take a link `token` (e.g. `uploadEvidenceAction`, readiness pings) check the link only — **not** OTP verification. Pages are gated; direct action calls are not. | Medium–High | Open — recommend extending the `isOtpVerified` check to these actions. Needs your OK. |
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
