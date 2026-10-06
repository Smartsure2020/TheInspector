# CURRENT STATE — The Inspector

**As of:** 2026-10-06 · **Git:** `main`, tag `inspector-current-stable`
**This file is the single source of truth.** Where any other document (handover
pack 01–12, `phase1/known-limitations.md`, `phase1/validation/current-blockers-and-decisions.md`)
disagrees with it, this file wins until those documents are updated.

> "The Inspector" is an internal codename only (D-01). Legal/trademark check
> required before any client-facing use.

## Headline

Feature-complete prototype with a real (but un-deployed) security layer.
**Real client data: NO-GO.** **Staging: not deployed.** Internal staff-only pilot
on fake data: GO (per `staging-go-no-go-checklist.md`).

## Current position (recorded 2026-10-06, after `f119f16`)

| Item | Status |
|---|---|
| F19 (OTP resend cooldown + hourly cap) | **Closed** (`6007ec2`) |
| F21 (OTP codes from a CSPRNG) | **Closed** (`6007ec2`) |
| Twilio abuse/spend risk | **Reduced, not production-final.** Per-link limits (60 s cooldown, 5/hour, 3 attempts) bound it, but there is no per-phone or per-IP limit yet, and F22 (auto-send on page render) and F23 (concurrency race) remain. |
| Staff-only, fake-data staging | **May proceed after manual provisioning** (accounts and spend still need your approval; nothing is provisioned or deployed). |
| Real-client pilot | **NO-GO** |

Required before any real-client pilot / production (not started; each needs explicit approval):

| # | Item | Requirement |
|---|---|---|
| F22 | First SMS sent on verify-page render | **Required before real-client pilot.** Preferred behaviour: do **not** auto-send on page render; send only after the client taps **"Text me a code"**. |
| F23 | OTP rate-limit check is read-then-insert (concurrency race) | **Concurrency hardening required before production / real-client use.** Not a blocker for fake-data staging. |
| F24 | UTC timestamps parsed without `Z` in `data.ts` (skew on non-UTC hosts) | Small correctness fix; **recommend before the next pilot rehearsal.** Vercel runs in UTC, so staging is not blocked. |
| F18 | Raw, staff-copyable link tokens stored | Design decision (likely show-once link + regenerate/revoke) before real-client pilot. Not started. |
| F2 | Uploads capped at 3.5 MB | Direct-to-S3 upload required before real-client pilot. Not started. |
| G1/G2/G3 | Mobile/provider re-test; workshop/template evidence | Required before real-client pilot / final provider decision. |

Deployment and manual provisioning remain **paused** until accounts and spend are approved.

## Mobile / provider testing — note

Mobile/provider testing is believed to have been performed previously across Chrome, Firefox and iPhone, with passing results, but the filed evidence has not yet been located. This does not block technical staging setup because staging remains staff-only and fake-data only. The formal mobile/provider test pack must be rerun or recovered before any real-client pilot, final provider decision, or G2/G3 gate closure.

**Current position**

- Staging default video: **LiveKit** (staging default only)
- Provider decision: **not formally final**
- Daily.co: available for comparison
- P2P: local/dev fallback only

## Phase 5C — technical staging (2026-10-06): PAUSED at manual provisioning

Stable checkpoint pushed (`main` @ `9a648f9`, tag `inspector-current-stable`). No cloud resources
created, no spend, no secrets committed. AWS/Twilio/LiveKit access is not available from the
build environment, so provisioning is a manual step (`manual-cloud-setup-checklist.md`).
The Postgres path was proven locally for the first time (`staging-evidence-chain-results.md`).
Findings F1–F17 are in `phase5c-staging-deployment-report.md`. **Approved code fixes landed in `cff877d`:** video/signaling routes now authorize (F1), the OTP-cookie bypass is closed (F14), S3 uses `S3_*` vars (F3), Postgres pool/SSL are explicit (F5), and uploads have a staging-safe 3.5 MB limit (F2 — **mitigation only; direct-to-S3 upload is required before any real-client pilot**). **`d22d82d` then fixed F15** (OTP link tokens hashed at rest, with an idempotent SQLite/Postgres migration) **and F16** (all client server actions now require an active link and OTP for that exact link; verified in a real browser). **`6007ec2` then fixed F19** (OTP resend cooldown 60 s, max 5 sends/hour per link, audited, with clear client copy; OTP codes now use a CSPRNG). Residual: raw link tokens remain in `appointments`/`client_upload_requests` (F18 — pre-real-client-pilot design decision: likely show-once link + regenerate/revoke), and link-preview bots can trigger the first SMS (F22).
Staff-only staging pilot: **GO only if staging checks pass** (not yet run). Real client data: **NO-GO**.

## Verified on 2026-10-06 (this stabilisation pass)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean (after clearing a corrupt, gitignored `.next` cache) |
| `npm run build` | Clean, all routes compile |
| `npm run qa:smoke` (production mode, freshly reset fake-data book) | **27/27 pass** (stabilisation pass); **33/33** after the Phase 5C fixes (`cff877d`; re-confirmed after `d22d82d` and `6007ec2`) |
| Evidence chain, end to end (fake media, SQLite + local disk) | **Pass** — see below |

**Evidence chain run (job j5, assessor session, `?media=fake&loopback=1`):**
frame capture → `evidence_items.sha256` stored → hash recomputed from the stored
file on disk and matched → evidence pack downloaded → `index.csv` carries the same
hash → `access_log` row written (`evidence_pack`/`j5`/`download`, user, IP).
Not yet exercised: client-upload path, S3 storage, Postgres.

## What exists (built)

- Full claims + survey workflow, 8 perils (fire reference-only/physical-first),
  residential + commercial (limited) surveys, report builder, four-eyes manager
  review with hard lock, evidence pack ZIP.
- **Real staff authentication:** email + bcrypt password, hashed session tokens,
  8-hour sessions, server-side revocation on sign-out.
- **RBAC:** enforced server-side (`requireRole` → `/access-denied`); admin,
  assessor, manager separated. User-management admin UI with template mandates (D-07).
- **Client OTP:** 6-digit SMS code (console in dev), hashed, 10-min expiry,
  max 3 attempts. Client link tokens stored hashed.
- **Evidence integrity (partial):** SHA-256 at capture/upload, original metadata,
  actor IDs on every event, `access_log` for file and pack downloads,
  authenticated file/pack endpoints (401 otherwise), upload MIME allow-list and
  15 MB cap.
- **Dual-provider DB + storage:** `DB_PROVIDER=sqlite|postgres`,
  `STORAGE_PROVIDER=local|s3` (15-min presigned URLs). Postgres event-log
  immutability rules in `schema-hardening.ts`.
- **Video:** `SessionAdapter` with P2P (default), LiveKit and Daily.co adapters,
  chosen via `NEXT_PUBLIC_VIDEO_ADAPTER`.
- UX refresh across staff and client pages (shared `components/ui/`).

## What is NOT done / NOT proven

- **Staging is not deployed.** Postgres, S3 and any TURN relay have never run in
  real infrastructure; they are built and build-verified only.
- **Signaling is in-memory, single process** (blocker B4). A restart drops live rooms.
- **Uploads are capped at 3.5 MB** (Vercel body limit); high-res/15 MB photos need direct-to-S3 upload — required before any real-client pilot.
- Open before any real-client pilot: **F18** (raw link tokens still stored in `appointments`/`client_upload_requests` — design decision, likely show-once link + regenerate/revoke; not required for fake-data staff-only staging), **F22** (first SMS sent on page render). **F20** is a documented operational risk: URL-path tokens are sensitive — treat staging logs, screenshots and browser history as sensitive. F15/F16 fixed (`d22d82d`), F19/F21 fixed (`6007ec2`).
- **No MFA** (the login page and user admin say so explicitly). No password policy,
  no forgot-password flow.
- **SQLite has no DB-level event-log immutability** (Postgres does, unproven live).
- **No malware scanning** of client uploads.
- No retention/deletion enforcement, no POPIA finalisation, no operator
  agreements, no server-generated PDF (browser print-to-PDF only), no backups,
  no monitoring.
- Client-upload hash path and S3/Postgres paths not exercised end to end.
- SMS delivery is console-only; no SMS provider is wired.

## Gate status (honest version)

"Recorded" = a decision exists in `phase0/10-decision-register.md`.
"Evidenced" = the supporting artefact is actually in the repo.

| Gate | Recorded? | Evidenced in repo? | Treat as |
|---|---|---|---|
| G1 Mobile live-room verification | Register says testing completed 2026-07-13 | **No** — device matrix/results not in repo; 5A report (07-16) lists mobile as unverified; only 3 old Daily.co spike screenshots exist | **Provisionally recalled as passed (Chrome/Firefox/iPhone); evidence not located; formal retest required** before real-client pilot. Not formally passed. |
| G2 Video provider decision | Register says LiveKit selected | **No** — `provider-comparison-template.md` and `provider-mobile-test-pack.md` are unfilled | **Provisionally recalled as passed; evidence not located; formal retest required** before final provider decision / real-client pilot. LiveKit = staging default only. Not formally passed. |
| G3 Template sign-off (workshop) | Register says signed off as-is at the 2026-07-07 workshop | **No** — `workshop/01-review-workbook.md` is blank; no sign-off record | **Not formally passed** until filed |

> **Numbering:** this repo's gate IDs (G1 mobile, G2 provider, G3 templates — `handover/06-DEFERRED-GATES.md`)
> differ from the order used in the 2026-10-06 instruction (workshop / mobile / provider). Statuses above
> are recorded by *activity*, using the repo's IDs, to avoid renumbering every existing document.
> Confirm or tell me to renumber.
| G4 Live-data safeguards | No | n/a | **Not approved** — hard gate for any real client data |
| G5 Postgres + S3 | n/a | Code complete | **Built, not proven in live infra** |
| G6 Auth / RBAC | Approved 2026-07-13 | Yes (login, RBAC, OTP) | **Partially done** — MFA, password policy outstanding |
| G7 Secure storage | Approved | Auth'd endpoints + presigned URLs in code | **Partial** — encryption at rest, live S3 unproven |
| G8 Audit hardening | Approved | SHA-256 + access_log + PG rules | **Partial** — SQLite not immutable; pack not tamper-evident |
| G9 Retention | Approved | No | **Not started** |
| G10 POPIA | Approved | No | **Not started** |
| G11 Server PDF | Approved | No | **Not started** |
| G12 Real deployment | Approved | No | **Not started** |
| G13 Template governance | Via user-mandate UI (D-07) | Partial (mandates in admin UI) | **Partial** |

## Known documentation drift

- `handover/` and most of `phase1/` still describe a role-picker prototype with
  no auth. Superseded by this file.
- `phase1/validation/current-blockers-and-decisions.md` (07-13) says the workshop has
  not run and hardening is unapproved; the decision register says otherwise.
  Needs reconciling by whoever attended/approved (see register evidence note).
- Staff demo password is set in `prototype/src/lib/seed.ts` (`DEV_PASSWORD`);
  an earlier doc quoted a different one (fixed).
- Local demo credentials are fake and for the seeded book only.

## Next (stabilisation order)

1. ~~Commit + tag current state~~ — done.
2. ~~27/27 smoke in production mode~~ — done.
3. ~~Evidence-chain verification with a real capture~~ — done (SQLite/local).
4. Manual provisioning per `manual-cloud-setup-checklist.md` (approvals first).
5. ~~Fix F1/F3/F5 + safe upload limit~~ — done (`cff877d`). Deploy protected
   staging (needs approvals + provisioning); run `staging-evidence-chain-results.md` and `staging-provider-verification-results.md`.
6. File or re-run the mobile/provider/workshop evidence (G1–G3) before any real-client pilot.
7. Then, in this order: ClamAV upload scanning → Uppy (also answers F2 properly) → Metabase → Archify docs.
