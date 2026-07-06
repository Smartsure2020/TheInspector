# Current git state — recorded 2026-07-06

## Branch

- Current branch: **`main`** (tracks `origin/main`)
- No other local branches; no tags exist yet.

## Latest commit (the demo-ready state)

```
ed27a1906f27adfc55525a40ca1a4c2d43825c8b
ed27a19  2026-07-06 20:36:21 +0200
Phase 1 QA/demo readiness pass: reset script, smoke suite, demo guide,
limitations register, regression checklist
```

## Important commits and what they contain

| Hash | What it contains |
|---|---|
| `ed27a19` | **QA/demo readiness pass** — `reset-demo.mjs`, `qa-smoke.mjs` (22 checks), `phase1/demo-guide.md`, `phase1/known-limitations.md` (L1–L14), `phase1/regression-checklist.md`, corrected `prototype/README.md`. The demo-ready state. |
| `de8148b` | **Chunk 1F** — multi-assessment + survey template activation: storm/theft/power surge/burst pipe/general non-motor claims, residential + limited commercial surveys, survey report variant, 18-job demo book, fire kept reference-only. |
| `8fbaf27` | **Chunk 1E** — post-assessment: evidence curation gallery, real report cycle (draft/submit/return/resubmit/approve+lock, versions), evidence pack ZIP (`zip.ts`, `/api/pack`). |
| `78d32f1` | **Chunk 1D** — provider-agnostic live room: `SessionAdapter` interface, P2P WebRTC adapter, `/api/rtc` signaling, capture loop, LiveKit stub (docs only). |
| `18a7e34` | Video spike paused — no-certificate manual test guide (tunnel/deploy HTTPS path for phones). |
| `c0c9597` | **Chunk 1C** — client pre-join polish, link states, real missing-evidence uploads (`storage.ts`, `/api/files`). |
| `92086fa` | Gitignore SQLite WAL sidecar files. |
| `62d3e46` | **Chunk 1B** — database-backed workflow: schema, seed, status machine, event log, server actions, scheduling/links. |
| `0a42912` | **Chunk 1A baseline** — planning packs (root docs, phase0, phase1) + static UX shell + spike harnesses. |

## Working tree status (at handover time)

Clean except for this handover pack, which is new and untracked:

```
?? handover/
```

No modified tracked files. No staged changes. (`prototype/db/*` and
`db/uploads/` are runtime artefacts and gitignored — they never appear here.)

## Recommended tag for the demo-ready state

**`phase1-demo-ready`** — annotated tag.

Recommended sequence: commit the handover pack (and the two README pointer
lines) first, so the tagged state includes its own handover documentation,
then tag:

```bash
cd C:\Users\renault\Documents\AI\INSPECTOR
git add handover/ README.md prototype/README.md
git commit -m "Handover pack: docs, guardrails, demo script, roadmap (no code changes)"
git tag -a phase1-demo-ready -m "Phase 1 prototype demo-ready: 1A-1F complete, QA pass 2026-07-06, 22/22 smoke PASS, seeded fake book"
git push origin main phase1-demo-ready
```

If you specifically want the tag to point at the pre-handover QA state
instead, tag the commit directly: `git tag -a phase1-demo-ready -m "..." ed27a19`.

Do **not** rewrite history, force-push, or amend `ed27a19` — the demo runs on
this state tomorrow morning.
