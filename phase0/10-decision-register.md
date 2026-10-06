# 10 — Decision Register for Acorn Management

Each decision: options, recommendation, owner and date fields to be completed.
Sources: this pack + the assessor workshop outputs (W1–W7 in doc 03). All decisions
must be **Decided** or **Deferred (with named owner + date)** before Phase 0 exit.

| ID | Decision | Options | Recommendation | Decided by / Date | Decision |
|----|----------|---------|----------------|-------------------|----------|
| D-01 | **Product name / codename** | (a) Keep "The Inspector" internally, decide client-facing name before anything client-visible ships (conflicts with theinspector.co.za); (b) rename now | (a) — codename only, legal/name search before Phase 2 client pilot | Mgmt demo / 2026-07-07 | **(a) Codename only.** Keep "The Inspector" internally; legal/trademark check required before any client-facing use. |
| D-02 | **Claim types for first prototype** | Any subset of the six templates | Geyser/water + accidental damage (highest volume + fastest sessions); add storm in pilot week 3 | Workshop W1 + mgmt | **Superseded by 1F.** All eight claim perils built (storm/geyser/accidental/theft/power surge/burst pipe/general non-motor + fire reference-only). Assessor workshop (Phase B) to validate. |
| D-03 | **Surveys in first prototype?** | (a) Deferred — claims only; (b) residential survey included; (c) both survey types | (a) Deferred. Engine is shared; add surveys once the room UX is proven | Mgmt demo / 2026-07-07 | **(c) Both survey types built.** Residential active; commercial flagged v0.1-1F-limited. Assessor workshop to validate. |
| D-04 | **Full video recording excluded from MVP?** | (a) Excluded — screenshots + structured data only; (b) optional per job; (c) always record | (a) Excluded. Cuts storage, cost and privacy exposure; revisit with dispute experience. Needs a sanity check that stills + event log satisfy evidential needs | Mgmt demo / 2026-07-07 | **(a) Excluded.** No recording in prototype or pilot. Revisit post-pilot with dispute experience. |
| D-05 | **High-res photo capture mandatory?** | (a) Mandatory prototype feature — templates rely on it for plates/serials/documents; (b) nice-to-have | (a) Mandatory. Video frames (~720p) cannot read a rating plate; without this the geyser and theft templates fail | Mgmt demo / 2026-07-07 | **(a) Mandatory.** Built in 1D; verified desktop-to-desktop. |
| D-06 | **Who reviews reports? And do reports carry quantum figures?** | Reviewer: manager / senior assessor peer / claims-side reviewer. Quantum: figures vs observations-only | Manager–Reviewer role reviews all pilot reports; quantum per workshop W4 outcome | Workshop 2026-07-07 + mgmt | **Manager reviews all reports.** Manager–Reviewer flow confirmed. Quantum: observations-only for now; revisit post-pilot. |
| D-07 | **Who owns templates?** | Named senior assessor per claim type (from workshop W2) vs one central owner | One named owner per claim type + one overall template custodian; changes versioned | Workshop 2026-07-07 | **Template mandate via user management.** No individual template owners assigned. Instead: admin UI to manage users (admin/assessor/manager) and assign template mandates per user. Built as part of production hardening (G6). |
| D-08 | **Pilot assessor group** | 2–3 named volunteers from workshop W6 | Volunteers over conscripts — adoption risk is the biggest project risk | Workshop 2026-07-07 | **All in-house staff.** Full team participates — no separate volunteer group needed. |
| D-09 | **Pilot claim volume & mode** | Volume target and shadow vs live mode | ≥10 claims in **shadow mode** (virtual alongside existing process, outputs compared); geyser-only for the first 2 weeks. Staged data rule: role-played + anonymised historical claims first; **real-client shadow testing only after the live-data safeguard gate below is approved** | Mgmt demo / 2026-07-07 | **Shadow mode confirmed.** ≥10 claims, virtual alongside physical. Live-data safeguard gate (G4) still required before real-client data. |
| D-10 | **What counts as a successful pilot** | Define pass/fail now, not after | Proposed: ≥8/10 assessments completed end-to-end without facilitator help; ≥8/10 reports accepted by reviewer with ≤1 correction round; capture loop <3s in real sessions; ≥2 of 3 pilot assessors say they'd choose it over the current method; client join unaided ≥80% of attempts | Mgmt demo / 2026-07-07 | **Proposed criteria accepted in principle.** Final metrics to be confirmed after workshop feedback. |

| D-11 | **Video provider direction** | (a) Stay P2P only; (b) evaluate LiveKit + Daily.co, pick one; (c) commit to a single provider now | (b) Evaluate both, pick one — behind SessionAdapter only | Mgmt demo / 2026-07-07; testing completed 2026-07-13 | **LiveKit selected.** Both adapters built and tested on real devices. LiveKit wins: open-source SFU (self-hostable in af-south-1 for POPIA), TURN included, free cloud tier, strong mobile support. Daily.co adapter retained (one file, zero cost) as fallback. Set `NEXT_PUBLIC_VIDEO_ADAPTER=livekit` as default. |

## Supporting notes

- **D-02:** fire is deliberately NOT recommended for the prototype — it is
  physical-first by nature (doc 08 T4) and would generate misleading early failure
  data. Theft is second-wave: valuable but the most sensitive to fraud-handling
  process.
- **D-04:** if (b) or (c) is chosen, consent wording, storage costs and the video
  provider shortlist all change — this decision must precede the technical spike.
- **D-11:** Both adapters evaluated on real devices (2026-07-13). LiveKit selected for
  self-hosting capability (POPIA data residency), included TURN relay, and strong mobile
  performance. Daily.co adapter stays in the codebase (one file) as a tested fallback.
  P2P adapter also remains for local dev without provider credentials.
- **D-09:** shadow mode means no live claim depends on the prototype — which is what
  makes deferring login/security acceptable in this phase. Pilot data is staged:

  1. **Stage 1 — no live data:** role-played assessments and anonymised historical
     claims may be used freely before any production hardening.
  2. **Stage 2 — real-client shadow mode:** may only start once a **minimum
     live-data safeguard gate** is approved, covering:
     - approved consent wording shown to the real client (interim legal-reviewed
       text, not the placeholder);
     - a controlled storage location for evidence and reports (known, single,
       access-restricted — not developer machines or ad-hoc shares);
     - limited, named staff access to pilot data;
     - agreed deletion/retention handling for pilot data (including what happens
       to it when the pilot ends);
     - written confirmation that prototype output is **not the system of record** —
       the existing process remains authoritative for every shadowed claim.

  This gate is deliberately minimal: it does **not** pull real login, MFA, permission
  engines or full POPIA implementation back into the workflow prototype. It exists
  only to prevent accidental unsafe use of real client data during the pilot.
- **D-10:** whatever is agreed here becomes the Phase 2 pilot acceptance criteria
  verbatim. Resist vague success definitions.

## Decisions moved to production hardening (green-lighted 2026-07-13)

Authentication approach, MFA policy, retention periods, download controls, operator
agreements, final consent wording, data-residency stance, hosting choice. These were
parked during Phase 0/1 and are now approved for implementation as part of production
hardening (Phase H). Templates signed off as-is at the 2026-07-07 workshop (G3 passed).
All in-house staff participate in the pilot (D-08). LiveKit is the selected provider (D-11).

## Evidence status of recorded decisions (added 2026-10-06 — stabilisation pass)

The decisions above are recorded, but several rest on activities whose supporting
artefacts are **not in this repository**. Until the artefact is filed, the gate is
treated as **not formally passed**. Fields marked `TO COMPLETE` need the person who
ran or approved the activity — they have not been filled in on their behalf.

| Item | What the register claims | Evidence expected | Evidence in repo | Approved by | Remains conditional |
|---|---|---|---|---|---|
| G3 — template sign-off (workshop 2026-07-07) | Templates signed off as-is | Completed `phase1/workshop/01-review-workbook.md`, attendee list, per-template verdicts | None (workbook blank) | TO COMPLETE | **Not formally passed** until filed; treat templates as v0.1-1F draft |
| G1 — mobile verification (2026-07-13) | Tested on real devices | SP1–SP10 results, device/OS/browser matrix | Only 3 older Daily.co spike screenshots (`phase1/spike-evidence/`) | TO COMPLETE | **Provisionally recalled as passed (Chrome, Firefox, iPhone); evidence not located; formal retest required before real-client pilot.** Do not claim "clients can join from a phone" until filed |
| G2 / D-11 — provider selection (LiveKit) | LiveKit selected | Filled `provider-comparison-template.md` / `provider-mobile-test-pack.md`; cost + POPIA residency notes | None (templates blank) | TO COMPLETE | **Provisionally recalled as passed; evidence not located; formal retest required before final provider decision / real-client pilot.** LiveKit = **staging default only** (2026-10-06); Daily available for comparison; P2P local/dev fallback only |
| Phase H green-light (2026-07-13) | Production hardening approved | Dated approval note | Register note only | TO COMPLETE | — |

See `CURRENT-STATE.md` for the consolidated status.

### Update 2026-10-06 — Phase 5C staging position

- **Staging default video: LiveKit.** Not a final provider decision (D-11 remains conditional on a filed, formal retest).
- Hosting direction for staging: Vercel (protected preview) + Postgres + S3, af-south-1 preferred; fake/internal data only. Needs approvals recorded: Vercel plan, AWS spend, Twilio/LiveKit accounts (see `manual-cloud-setup-checklist.md`).
- Open production-hosting question (G12): Vercel cannot reach a private RDS without fixed IPs/Secure Compute; decide before production.
- Staff-only staging pilot: GO only if staging checks pass. **Real client data: NO-GO.**

### Update 2026-10-06 (later) — Phase 5C approvals

- **Approved by Juan-Paul:** F1 (authorize video/signaling routes), F3 (`S3_*` env handling), F5 (explicit Postgres pool/SSL), F2 *partially* (staging-safe upload limit only). Implemented in `cff877d`.
- **Recorded requirement:** direct-to-S3 (presigned) upload is **required before any real-client pilot**; minimal presigned upload first, Uppy later as a UX/resumable enhancement.
- **Open (needs decision):** F15 raw link token in `otp_challenges`; F16 client actions not checking OTP.
- **Not approved yet (no deploy / no spend):** Vercel Pro or alternative hosting; AWS RDS/S3 spend; Twilio account/use; LiveKit account/use.
- **Gate numbering:** repo IDs are canonical (G1 mobile verification, G2 provider decision, G3 template sign-off). Earlier discussion numbered them workshop / mobile / provider; statuses are recorded by activity, so no renumbering.

### Update 2026-10-06 (latest) — F15/F16 fixed; new items needing decisions

- **Approved and implemented (`d22d82d`):** F15 (hash OTP link tokens at rest, with migration/backfill) and F16 (OTP + active-link checks on client server actions).
- **Documented exception:** `requestNewLinkAction` requires no OTP/active link — expired/revoked-link clients must be able to ask for a new link; it only writes one audit event.
- **Needs decision (recommended before any real-client pilot):** F18 raw link tokens still stored in `appointments`/`client_upload_requests` (show-once link + regenerate design); F19 OTP resend cooldown/lockout; F20 tokens in URL paths/logs.
- **Unchanged:** no deploy, no cloud resources, no secrets; Vercel/AWS/Twilio/LiveKit approvals still outstanding; real client data NO-GO.

### Update 2026-10-06 (latest) — F19 fixed; F18/F20 recorded

- **Implemented (`6007ec2`):** F19 OTP resend cooldown (60 s) and hourly cap (5 per link), existing 3-attempt limit kept, audited, client-facing copy; plus a CSPRNG for OTP codes (F21).
- **F18 — pre-real-client-pilot DESIGN DECISION (not started):** current model stores raw, staff-copyable links; future model should likely be **show-once link + regenerate/revoke**. Not required for fake-data, staff-only staging.
- **F20 — documented operational risk:** URL-path tokens are sensitive; staging logs, screenshots and browser history must be treated as sensitive. Not a blocker for fake-data staff-only staging.
- **New for decision before real-client pilot:** F22 (first SMS sent on page render; consider an explicit "text me a code" action); F24 (UTC timestamp parsing on non-UTC hosts).
- **Unchanged:** nothing deployed; no cloud resources; no secrets; Vercel/AWS/Twilio/LiveKit approvals outstanding; real client data NO-GO.

### Update 2026-10-06 (latest) — position recorded after `f119f16`

- **Closed:** F19 (OTP resend cooldown + hourly cap), F21 (CSPRNG for OTP codes).
- **Twilio abuse risk:** reduced but not production-final (per-link limits only; F22/F23 outstanding; no per-phone/per-IP limit).
- **Staff-only fake-data staging:** may proceed after manual provisioning (accounts/spend not yet approved). **Real-client pilot: NO-GO.**
- **F22 — required before real-client pilot.** Preferred future behaviour: do not auto-send SMS on verify-page render; send only after the client taps "Text me a code". Not started; needs explicit approval.
- **F23 — concurrency hardening required before production / real-client usage**; not a blocker for fake-data staging.
- **F24 — small timestamp-correctness issue**; recommend fixing before the next pilot rehearsal; Vercel runs in UTC so staging is not blocked.
- **Not started (awaiting explicit approval):** F18 (link-storage design decision), F22, direct-to-S3 upload.
- **Deployment / manual provisioning:** paused until accounts and spend are approved.

### Update 2026-10-06 (latest) — F24 fixed

- **Closed (`f41c58c`):** F24. Stored UTC instants and SAST wall-clock business times are now parsed explicitly (`lib/time.ts`, fixed +02:00, no DST), so link expiry and the 2-hour early-join window no longer depend on the server timezone. Verified under UTC, SAST, New York and Auckland; `npm run qa:time` added.
- **New, for decision:** F25 (UTC instants displayed as UTC digits, two hours behind SAST; seeded demo values are literal wall-clock strings, so converting is a product decision); F26 (seeded demo links expire 2026-12-31).
- **Unchanged:** F18, F22, direct-to-S3 not started; nothing deployed; no cloud resources; no secrets; real-client pilot NO-GO; staging pending manual provisioning.
