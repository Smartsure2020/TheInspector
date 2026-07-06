# Known limitations register — Phase 1 prototype (post-1F, QA pass 2026-07-06)

Living register for management/internal review. Every entry is a **known,
deliberate** state — deferred by scope decision or pending a gated decision —
not an oversight. Update this file whenever a chunk lands.

## Platform / verification

| # | Limitation | Status / gate |
|---|---|---|
| L1 | **Mobile live-room verification deferred** — the P2P room is verified desktop↔desktop only. Phones require HTTPS; work-laptop policy blocks local certificates, so phone testing needs a tunnel or preview deployment (see `spike-manual-test-guide.md`). | Deferred, **not cancelled**. Re-run SP1–SP10 device spike on phones before any pilot. |
| L2 | **P2P WebRTC only — no TURN relay, no SFU.** Same-network and most home networks connect; strict corporate NAT/CGNAT paths will fail. Reconnect logic is basic (page-refresh recovery). | Accepted for prototype. Resolved by provider selection (below) or a TURN deployment. |
| L3 | **No video provider selected.** Daily.co excluded (paid); LiveKit not implemented. The room is built behind the `SessionAdapter` interface so a provider can be swapped in without touching workflow code. | Open decision — Phase 2 gate. Rooms stay provider-agnostic until then. |
| L4 | **SQLite + local file storage, prototype only.** Single-writer, no backups, uploads on local disk, no integrity chain (no sha256, no immutable audit store). Schema is kept Postgres-portable. | Postgres + object storage migration is a **hard gate** before real-client shadow mode (with D-09). |
| L5 | **PDF = browser print-to-PDF.** No server-side rendering, no letterhead/pagination control, no digital signature. | Deferred to production hardening. |

## Content / scope

| # | Limitation | Status / gate |
|---|---|---|
| L6 | **All 1F templates are v0.1-1F demo content pending assessor workshop sign-off** (storm, theft, general non-motor, power surge, burst pipe, both surveys). Geyser + accidental carry Phase 0 v0.2 signed-off content. | Assessor workshop scheduled as part of Phase 1 close-out. |
| L7 | **Commercial/property survey is deliberately limited depth** (flagged `v0.1-1F-limited` in the picker and on the job). Heavy industrial risks route to physical from the start (T8). | Accepted; full commercial template is post-prototype. |
| L8 | **Fire is reference-only / physical-first.** Not bookable in the UI (disabled option) and rejected server-side; the stored triage checklist documents scope for reviewers only. | Permanent policy (T4), not a gap. |
| L9 | **No full template builder.** Templates are code-seeded; the general non-motor template is one flexible checklist with a peril selector, not a builder. | Deferred by scope decision. |
| L10 | **No real-client data.** All records are role-play/anonymised; seeding real data is barred by the phase0 D-09 safeguard gate. | Hard gate until production hardening + POPIA work. |

## Security / production hardening (all deferred by scope decision)

| # | Limitation | Status / gate |
|---|---|---|
| L11 | **No production auth/MFA/permissions** — role picker is placeholder access (AC9); any visitor can act as any role. | Production hardening phase. |
| L12 | **No POPIA / storage / audit hardening** — event log is append-only by convention, not enforcement; no retention policy, no encryption at rest. | Production hardening phase. |
| L13 | **No recording, no AI, no integrations, no WhatsApp** — excluded from Phase 1 scope. Client-link sending is manual (paste-ready SMS/email text). | Later phases; each needs its own decision. |
| L14 | **Client link tokens are long-dated, unauthenticated links** in the seed (demo convenience); real links get a 2h-before → 24h-after validity window but no OTP/verification. | Production hardening phase. |

## Known cosmetic items (QA 2026-07-06, accepted)

- Job timeline renders raw event types (e.g. `report_submitted — v2`) for live
  events; seeded history rows render as prose. Deliberate audit-transparency
  choice for the prototype.
- Seeded evidence items are coloured placeholder tiles without image files;
  evidence packs annotate them honestly in `index.csv`.
