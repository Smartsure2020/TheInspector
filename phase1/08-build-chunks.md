# 08 — Build Chunks Within Phase 1

Ten chunks, each small enough to demo. Rule: **every chunk ends with something
clickable** and its exit check passed before the next starts (1D's spike dependency
is the only hard sequencing constraint; 1A–1C can overlap with the spike).

Suggested stack (consistent with blueprint doc 10, final call at 1A kickoff):
Next.js + TypeScript monolith, Postgres, Prisma (or equivalent), one Storage
interface (local disk dev / S3-compatible shared env), headless-Chromium PDF.

| Chunk | Scope | Exit check |
|-------|-------|-----------|
| **1A — Static UX shell & mock data** | App skeleton, role-picker entry (S1), navigation frame for all 16 screens with mock data, seed fixtures: demo users, 6 templates (2 active from phase0 v0.2, 4 reference-only), ~10 sample jobs across all statuses. PROTOTYPE banner everywhere. | Walk every screen with mock data; role switch works; reviewers can click the whole journey as a dumb shell. **Video spike (doc 07) starts in parallel now.** |
| **1B — Jobs, dashboards, statuses** | Real DB: jobs/clients/templates/event_log tables; create job (S5), job detail (S6) with event timeline, admin/assessor/manager dashboard lists (S2–S4 shells), scheduling (S7) with link generation + paste-ready message, status engine with legal-transition enforcement, cancel flow (F7), no-show/reschedule flow (F6). | Create → assign → schedule → cancel/no-show/reschedule all drive correct statuses + timeline events; link opens a stub client page. |
| **1C — Client link & pre-join flow** | Client landing (S8), consent placeholder (S9) with logging, camera/mic check (S10) using plain getUserMedia (provider-agnostic), waiting room (S11) stub, link expiry/invalid states, "I can't make it" flag. | Phone test: cold link → waiting room unaided; consent event in timeline; expired link shows the polite path. |
| **1D — Live room spike → room skeleton** | Consume spike verdict; integrate chosen provider behind `SessionService`; two-way AV assessor↔client; admit-from-waiting-room; drop/reconnect handling (doc 04 §4.11); session start/end + events. No checklist yet. | Assessor admits client from a real phone; kill/restore client network → rejoin with state; session rows + events recorded. |
| **1E — Checklist & capture loop** | Checklist panel with geyser + accidental templates; answers, notes, concern flags, missing flags, instruction banner push, canned prompts, flip/torch prompts; frame capture with optimistic thumbnail, auto-label, capture tray with inline relabel/discard; hotkeys; end-session summary. | **The hard requirement measured and passed** (doc 04 §4.12 checklist, all items except high-res). This chunk gets the most time and the most testing. |
| **1F — High-res photo request** | Request→client capture view→preview→upload→auto-return loop (doc 04 §4.5); legibility-confirm popover on assessor side; cancel/timeout paths. | Legible geyser rating-plate photo from 1.5 m on both test phones; audio continuity per spike SP6 findings. |
| **1G — Evidence gallery & missing-upload flow** | Gallery (S13): grid, filing UNFILED, relabel/refile/discard/feature/order; missing panel; upload request creation; client upload page (S14); uploads landing tagged + flagged; resolve flow → status transitions. | 30-capture triage <5 min; upload round-trip lands on the right item; Awaiting evidence → Awaiting report transition fires when last item resolves. |
| **1H — Report & evidence pack** | Report builder (S15) with pre-fill, live preview, auto Limitations; PDF generation; ZIP + appendix PDF pack; completed report page (S16); draft watermarks. | Doc 06 §6.3 definition of done, all boxes. |
| **1I — Manager review flow** | Review queue (S4 full), side-by-side review view, per-section comments, approve (lock + finalise artefacts) / return; returned-mode in builder; reopen with reason; version list. | Submit → return → revise → resubmit → approve full cycle works; approved report uneditable in UI; every action in the timeline. |
| **1J — Usability test & fixes** | Structured tests per doc 09: 3 assessors × geyser + 3 × accidental role-plays; 3 cold-client phone joins; fix list triaged (blockers fixed, rest logged); W7 checklist-first vs tray-first question answered with observed data; F6/F7 exercised once each for real. | All doc 09 acceptance criteria pass, evidenced (timings recorded, sessions observed, fix log kept). |

## Sequencing notes

- Spike runs during 1A–1B; verdict due before 1D starts. If the spike slips, 1C can
  absorb the wait — never start 1D on an unverified provider.
- 1E is the highest-risk chunk; if the capture loop misses its numbers, stop and fix
  before 1F — nothing downstream matters if the loop is slow.
- Templates are fixtures: any template change during 1E–1J is a fixture edit + reseed,
  no migrations, no builder UI (scope guard).
- Throughout: no auth beyond the role picker; every "we should add login" impulse is
  logged to the Tier B list, not built.
