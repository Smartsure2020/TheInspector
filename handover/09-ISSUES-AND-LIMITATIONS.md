# Known issues and limitations — consolidated (as of 2026-07-06)

Every entry is a **known, deliberate** state — deferred by scope decision or
pending a gated decision — not an oversight. The living source register is
`phase1/known-limitations.md` (L1–L14); this file consolidates it with dev
caveats for handover. Update BOTH when behaviour changes. Gate references
(G1–G13) point to [06-DEFERRED-GATES.md](06-DEFERRED-GATES.md).

## Platform / verification

1. **Mobile live room not verified (L1, gate G1).** The P2P room is verified
   desktop↔desktop only. Phones require HTTPS; work-laptop policy blocks
   local certificates, so phone testing needs a tunnel or preview deployment
   (`phase1/spike-manual-test-guide.md`). Deferred, **not cancelled** — the
   SP1–SP10 device spike must be re-run on phones before any pilot.

2. **P2P WebRTC only — no TURN relay, no SFU (L2, gate G2).** Google public
   STUN only. Same-network and most home networks connect; strict corporate
   NAT / CGNAT paths will fail. Reconnect logic is basic (page-refresh
   recovery). Accepted for the prototype; resolved by provider selection or a
   TURN deployment.

3. **Signaling is in-memory HTTP polling (`/api/rtc/[room]`).**
   Single dev-server process only: a server restart drops live rooms; ~900 ms
   polling; no durability. Replaced at provider selection; the
   `SessionAdapter` interface hides it from room components.

4. **No final video provider selected (L3, gate G2).** Daily.co excluded
   (paid); LiveKit is a documentation stub only (`livekit-adapter.stub.ts` —
   not implemented, not imported). Deliberate: rooms stay provider-agnostic
   until the decision.

5. **SQLite + local file storage, prototype only (L4, gate G5).**
   Single-writer, no backups, uploads on local disk (`prototype/db/uploads/`),
   no integrity chain (no sha256, no immutable audit store — reserved columns
   exist, empty). Schema is kept Postgres-portable; migration is a **hard
   gate** before real-client shadow mode.

6. **PDF = browser print-to-PDF (L5, gate G11).** No server-side rendering,
   no letterhead/pagination control, no digital signature.

## Content / scope

7. **All 1F templates are v0.1-1F demo content pending assessor workshop
   sign-off (L6, gate G3)** — storm, theft, general non-motor, power surge,
   burst pipe, both surveys. Geyser + accidental carry Phase 0 v0.2
   signed-off content. Say this in every demo.

8. **Commercial/property survey is deliberately limited depth (L7)** —
   flagged `v0.1-1F-limited` in the picker and on the job. Heavy industrial
   risks route to physical from the start (trigger T8). Full commercial
   template is post-prototype.

9. **Fire is reference-only / physical-first (L8, policy T4 — permanent).**
   Not bookable in the UI (disabled option) AND rejected server-side in
   `createJobAction`. The stored triage checklist documents scope for
   reviewers only. This is policy, not a gap.

10. **No template builder (L9).** Templates are code-seeded
    (`src/lib/templates.ts`); general non-motor is one flexible checklist
    with a peril selector, not a builder.

11. **No real client data (L10, gate G4 — hard).** All records are
    role-play/anonymised fakes; seeding real data is barred by phase0 D-09.

## Security / production hardening (all deferred by scope decision)

12. **No production auth/MFA/permissions (L11, gate G6).** Role picker is
    placeholder access (AC9); any visitor can act as any role. Evidence file
    endpoint (`/api/files/[id]`) is likewise unauthenticated.

13. **No POPIA / storage / audit hardening (L12, gates G7–G10).** Event log
    is append-only by convention, not enforcement; no retention policy, no
    encryption at rest, no download controls.

14. **No recording, no AI, no integrations, no WhatsApp (L13).** Excluded
    from Phase 1 scope; client-link sending is manual (paste-ready SMS/email
    text). Each needs its own future decision.

15. **Client link tokens are long-dated, unauthenticated links in the seed
    (L14).** Demo convenience; real (non-seed) links get a 2h-before →
    24h-after validity window but no OTP/verification until hardening.

## Known cosmetic items (QA 2026-07-06, accepted)

16. Job timeline renders raw event types (e.g. `report_submitted — v2`) for
    live events; seeded history rows render as prose. Deliberate
    audit-transparency choice for the prototype.

17. Seeded evidence items are coloured placeholder tiles **without image
    files**; evidence packs annotate them honestly in `index.csv`. A job with
    real uploads (e.g. after the demo upload step) shows actual files.

## Dev / build caveats

18. **Reset requires the server stopped** — on Windows the dev server holds
    the SQLite file open; `npm run reset:demo` fails with a lock error
    otherwise (the script says so and exits cleanly).

19. **First request after reset is slow** — schema creation + seeding happen
    on first DB access. Normal.

20. **SQLite WAL sidecars** (`inspector.db-wal`/`-shm`) appear at runtime;
    they are gitignored — don't commit or "clean up" mid-run.

21. **Smoke-suite markers are chunk-safe substrings** — Next.js splits
    server-rendered text into RSC payload chunks, so `qa-smoke.mjs` asserts
    short single-chunk markers. Don't lengthen them; client-bundle-only
    strings can't be asserted there (manual checklist covers those).

22. **Pre-1F databases are auto-recreated** — `db.ts` detects the old shape
    and rebuilds from seed. The DB file is a disposable dev artefact; there
    is no migration system (deliberate while all data is fake).

23. **Live-room demo mechanics** — "Admit client" needs a live client on the
    signaling channel; single-window demos use "Start session (mock)" on the
    job page. Test hooks: `?media=fake` (canvas camera), `?loopback=1`
    (no peer connection). Capture with no client video reports "No client
    video to capture yet" — expected.

24. **Build gate status** — `npx tsc --noEmit` and `npm run build` (21
    routes) clean as of 2026-07-06; `npm run qa:smoke` 22/22 PASS on the
    pristine book. Keep all three green.
