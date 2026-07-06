# Codebase structure — The Inspector prototype

The runnable prototype lives entirely in [`prototype/`](../prototype/).
Everything else in the repo is planning documentation (`phase0/`, `phase1/`,
root docs `01–12`) and this handover pack.

**Stack:** Next.js 16 (App Router, React 19, TypeScript, Tailwind 4) +
better-sqlite3. No ORM, no external services, no env secrets required to run.

## Top-level repo map

```
INSPECTOR/
├── README.md               Blueprint index + binding scope correction
├── 01–12 …*.md             Long-term blueprint (reference; scope-corrected)
├── phase0/                 SCOPE AUTHORITY — validation pack, decision register
├── phase1/                 Implementation plan + QA artefacts (demo guide,
│                           known limitations, regression checklist, QA report,
│                           video spike report/manual test guide)
├── handover/               THIS PACK
└── prototype/              The runnable Next.js app
```

## Prototype map

```
prototype/
├── package.json            Scripts: dev / build / start / reset:demo / qa:smoke
├── db/                     RUNTIME ARTEFACTS (gitignored): inspector.db (+wal/shm),
│                           uploads/ (client-uploaded evidence files)
├── scripts/
│   ├── reset-demo.mjs      Deletes db files + uploads → pristine reseed on next request
│   └── qa-smoke.mjs        22 render-level checks against a running dev server
├── public/spike/           Standalone HTML harnesses from the video spike
│   ├── device.html         getUserMedia device checks (SP1–SP10)
│   ├── daily.html          Daily.co harness (UNUSED — provider excluded, paid)
│   └── livekit.html        LiveKit harness (untested — needs account/keys at runtime)
└── src/
    ├── app/                Routes (see below)
    ├── components/         Client components
    └── lib/                Data layer, domain logic, templates, video adapters
```

## `src/lib` — the heart of the app

| File | What it does |
|---|---|
| `db.ts` | SQLite singleton. Creates `db/inspector.db`, runs `SCHEMA_SQL`, seeds on first access (so `npm run dev` is one-command). Detects pre-1F database shape and recreates it (dev DB is disposable). |
| `schema.ts` | `SCHEMA_SQL` — tables: `users`, `clients`, `checklist_templates`, `jobs`, `appointments`, `event_log`, `evidence`, `checklist_responses`, `sessions`, `reports` (report versions). Mirrors `phase1/05-data-model-and-statuses.md`. Kept **Postgres-portable**: TEXT uuid PKs, ISO-8601 UTC timestamps, JSON in TEXT. Reserved hardening columns (sha256 etc.) exist but stay empty. |
| `types.ts` | Shared TypeScript types: `Role`, `JobType` (assessment/survey), `JobStatus` (11 statuses), `ClaimType`, template/checklist shapes. |
| `templates.ts` | **The template library** (688 lines). All checklist templates as code: shared opening/closing spines + per-peril sections, client instructions, evidence-required and HI-RES flags, concern capability, physical/hybrid trigger wording. Content sourced from root docs 04/05 and `phase0/08-physical-trigger-matrix.md`. Editing a template = edit here, then reset + reseed. |
| `fixtures.ts` | Seed data: 4 demo users, fake clients, the 18-job demo book (ids `j1`…`j18`, numbers `INS-2026-0001`…/`SRV-2026-…`), seeded evidence tiles and checklist responses, demo link tokens. **NO real client data may ever be added (D-09).** |
| `seed.ts` | Writes fixtures into the DB in one transaction (called from `db.ts` on first access). |
| `data.ts` | Read layer + **guarded status machine** (`EDGES` map — `changeStatus` rejects illegal transitions; `"Report completed"` has no outgoing edges = the lock) + **event logging** (`logEvent` — append-only by convention; no update/delete exposed). |
| `actions.ts` | **All server actions** (mutations). Actor is resolved from the placeholder-role cookie (mock access, AC9). Job lifecycle: `createJobAction` (rejects reference-only templates → fire not bookable server-side), `assignAction`, `scheduleAction` (link generation + revocation on reschedule), `noShowAction`, `cancelAction`, `transitionAction`. Reports: `saveReportDraftAction`, `submitReportAction`, `reviewReportAction` (manager-only; approve locks). Evidence: `updateEvidenceAction` (rejects on locked jobs), `saveCaptureAction`, `uploadEvidenceAction`. Client-side: `consentAction`/`consentDeclineAction`/`cannotAttendAction`, `clientPingAction` (readiness dots), `requestNewLinkAction`. Session: `admitClientAction`, `endSessionAction`, `sessionNetworkEventAction`, `saveResponseAction`. |
| `report.ts` | **Report generation.** One `buildReportModel` feeds the editor, the rendered page and the submit snapshot so they always agree. Claims variant (summary/circumstances/findings/cause/conclusion, peril-adaptive wording) and survey variant (risk description/COPE findings/recommendations register/A–E grading, no cause section). Auto sections — particulars, **non-removable Limitations**, evidence index, sign-off — are regenerated from the DB, never stored editable. |
| `storage.ts` | Upload storage behind one module: local disk at `prototype/db/uploads/` (gitignored). Allowed MIMEs (jpeg/png/webp/heic/pdf), 15 MB cap. Production swaps this file for S3 + signed URLs without touching callers. |
| `zip.ts` | Dependency-free store-only ZIP writer (local headers + central directory + CRC-32) for the evidence pack. Deliberately no hashing/integrity chain. |
| `role.tsx` | Client-side placeholder role context: demo user persisted in localStorage + a plain cookie (`inspector.demoUser`) so server actions can attribute events. **No authentication — by design.** |
| `video/adapter.ts` | **`SessionAdapter` — the provider-agnostic contract.** Room components depend ONLY on this interface: resolveRoom/joinRoom/leave, remote stream, connection state, presence, `RoomMessage` data channel (banners, prompts, photo requests), camera switch, mute, `captureRemoteFrame`. |
| `video/p2p-adapter.ts` | The active implementation: plain RTCPeerConnection, Google public STUN, **no TURN**, signaling over `/api/rtc`. Test hooks: `?media=fake` (canvas stream for camera-less machines), `?loopback=1` (single-browser demo, no peer connection). |
| `video/media.ts` | Provider-agnostic local media helpers: getUserMedia wrapper, camera facing switch, `grabFrame` (canvas capture), fake-stream generator. |
| `video/livekit-adapter.stub.ts` | Documentation-only stub: 1:1 mapping from `SessionAdapter` to livekit-client so a future swap is mechanical. **Not implemented, not imported.** |

## `src/app` — routes

### Staff routes (placeholder roles)

| Route | Purpose |
|---|---|
| `/` (`page.tsx`) | Role picker (Lerato/Sipho/Anje/Craig) + demo client links. Entry point. |
| `/admin` | Admin/coordinator pipeline — full 18-job book. |
| `/assessor` | Assessor dashboard — "Today" cards with client-readiness dots, grouped queues. |
| `/manager` | Manager review queue (claims + survey reports) + team pipeline. |
| `/jobs/new` | Job creation with governed template picker (fire disabled, commercial survey flagged limited). |
| `/jobs/[id]` | Job detail: status, template, client link + paste-ready SMS, event timeline, actions (assign/mock-start/transitions). |
| `/jobs/[id]/schedule` | Booking/rescheduling; link generation and revocation. |
| `/jobs/[id]/room` | **The live room** (renders `AssessorRoom`). |
| `/jobs/[id]/evidence` | Evidence gallery (grouping, relabel/refile/feature, locked state). |
| `/jobs/[id]/report` | Report builder (`ReportEditor` + `ManagerReview`). |
| `/jobs/[id]/report/final` | Rendered report (print-to-PDF target) + evidence-pack download. |

### Client link routes (`/c/[token]`) — where client links are resolved

Token → appointment lookup happens in these pages via `data.ts`
(`link_token` on `appointments`, with validity window + revocation checks;
demo tokens are long-dated seeds).

| Route | Purpose |
|---|---|
| `/c/[token]` | Landing: early ("you're a little early" + peril-specific prep list incl. storm do-NOT-climb safety wording) / active / invalid states. |
| `/c/[token]/consent` | Consent capture (name + tick), decline and can't-attend paths; logs `consent_accepted`. |
| `/c/[token]/check` | Camera/mic check (`DeviceCheck`), graceful no-camera fallback. |
| `/c/[token]/waiting` | Waiting room (`WaitingLive`) — pings readiness, waits for admit. |
| `/c/[token]/session` | Client side of the live room (`ClientRoom`). |
| `/c/[token]/upload` | Missing-evidence upload page — outstanding items, photo/PDF upload resolves items live. |

### API routes

| Route | Purpose |
|---|---|
| `/api/files/[id]` | Serves uploaded evidence files by evidence id (unauthenticated — placeholder model; production = signed URLs). |
| `/api/pack/[id]` | **Evidence pack ZIP** — builds `index.csv` from the report model, adds evidence files named `fig-section-label`, README. |
| `/api/rtc/[room]` | **In-memory signaling channel** for the P2P adapter: presence + per-peer message queues, polled every ~900 ms. Single-process only; replaced by the provider at selection time. |

## `src/components`

| Component | Role |
|---|---|
| `Chrome.tsx`, `RolePicker.tsx` | App frame, PROTOTYPE banner, acting-user header; role selection. |
| `CreateJobForm.tsx` | Template picker with live section/evidence preview, fire greyed out. |
| `JobActions.tsx` | Job-detail actions (assign, mock start, transitions, cancel/no-show). |
| `AssessorRoom.tsx` | Assessor live room: adapter wiring, checklist panel, item→banner push, capture button/hotkeys (C/Space), HI-RES request, guidance chips, can't-capture flow, capture tray, end-session summary, admit control. |
| `ClientRoom.tsx`, `WaitingLive.tsx`, `DeviceCheck.tsx`, `ClientBits.tsx` | Client-side session/waiting/device-check UI + readiness pings. |
| `EvidenceTools.tsx`, `UploadItem.tsx`, `MockUploader.tsx` | Gallery curation controls; client upload widgets. |
| `ReportEditor.tsx`, `ManagerReview.tsx`, `PrintButton.tsx` | Narrative editing + auto-section preview; return/approve UI; print-to-PDF. |
| `CopyButton.tsx` | Copy-to-clipboard for links/SMS text. |

## Data flow (end to end)

```
Role picker (/)  ── sets localStorage + cookie ──►  server actions attribute actor

Admin creates job (/jobs/new → createJobAction)
  └─► jobs row + timeline event ─► schedule (scheduleAction)
        └─► appointments row + link_token + paste-ready SMS

Client opens /c/<token>
  ├─ consentAction / clientPingAction ──► event_log ──► readiness dots (/assessor)
  └─ waiting room ◄── admitClientAction (sessions row) ── assessor room

Live room (/jobs/id/room, AssessorRoom)
  ├─ video: SessionAdapter (P2PAdapter) ◄── signaling /api/rtc/[room]
  ├─ checklist answers: saveResponseAction ──► checklist_responses
  └─ captures: grabFrame → saveCaptureAction ──► evidence + db/uploads/
        └─ endSessionAction ──► Awaiting evidence | Awaiting report

Missing evidence: flagged items ─► /c/<token>/upload → uploadEvidenceAction
  ──► resolves item, evidence row + file, timeline event

Report: buildReportModel(report.ts) reads jobs/responses/evidence
  ├─ ReportEditor (draft narrative) → saveReportDraftAction / submitReportAction (reports vN)
  ├─ ManagerReview → reviewReportAction (return with comments | approve → LOCK)
  └─ /jobs/id/report/final = same model rendered; PrintButton = browser PDF

Evidence pack: /api/pack/[id] = report model + storage files → zip.ts
```

## Where to find things (quick answers)

- **Templates live in:** `src/lib/templates.ts` (code-seeded; reseed after edits)
- **Reports are generated in:** `src/lib/report.ts` (rendered by `/jobs/[id]/report*` pages)
- **Evidence is stored in:** DB rows in `evidence` table; files on disk at `prototype/db/uploads/` via `src/lib/storage.ts`; served by `/api/files/[id]`
- **Client links are resolved in:** `/c/[token]/*` pages via `data.ts` (appointments.link_token)
- **Session/live-room code lives in:** `src/components/AssessorRoom.tsx` + `ClientRoom.tsx`, `src/lib/video/*`, `/api/rtc/[room]`
- **Event logging happens in:** `src/lib/data.ts` (`logEvent`), called by every action in `actions.ts`; displayed as the job timeline
- **Reset/demo scripts live in:** `prototype/scripts/` (`reset-demo.mjs`, `qa-smoke.mjs`)
- **The status machine lives in:** `src/lib/data.ts` (`EDGES` + `changeStatus`)
- **The scope guards live in:** `prototype/README.md` (binding) + this pack's file 08

## Conventions to preserve

- Server-only modules import `"server-only"`; mutations only via `actions.ts`.
- Every mutation logs an event; the event log has no update/delete path.
- All ids are TEXT uuids; timestamps are ISO-8601 UTC strings.
- The DB file is disposable — schema changes are handled by reset + reseed,
  not migrations (fine while all data is fake).
- No secrets in the repo; `.env.local` only (currently none needed).
- Room components never import a concrete adapter's provider types — only
  `SessionAdapter`.
