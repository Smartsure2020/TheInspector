# The Inspector — workflow prototype (Phase 1)

**Codename only — not client-facing branding. Acorn only. Role-play / anonymised
data only; no real client data (phase0 D-09 safeguard gate).**

**Handover:** read [`../handover/00-HANDOVER-README.md`](../handover/00-HANDOVER-README.md)
(project status, code map, demo runbook, binding scope guardrails) before
changing anything here.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

The SQLite database self-creates and self-seeds at `db/inspector.db` on first
request. To reset to the pristine seeded demo book: stop the dev server, run
`npm run reset:demo`, start the dev server again (see `../phase1/demo-guide.md`).
Client uploads land in `db/uploads/` (gitignored).

## Entry points

- `/` — placeholder role picker (Admin / Assessor / Manager). No login exists in
  Phase 1 by design; this is mock access (AC9).
- Demo client links (long-dated seeds): `/c/demo-storm` (primary storm demo),
  `/c/demo-acc` (accidental), `/c/demo-theft` (theft), `/c/demo-survey`
  (residential survey), `/c/demo-live` (in-progress live-room job).
- `/c/demo-upload/upload` — demo missing-evidence upload page (job INS-2026-0006).
- `/spike/device.html`, `/spike/daily.html`, `/spike/livekit.html` — video-provider
  spike harnesses (see `../phase1/spike-report.md`). Phones need HTTPS —
  **no local certificates on this machine (work-laptop policy)**: use a Cloudflare
  quick tunnel or a preview deployment per `../phase1/spike-manual-test-guide.md`.

## Database note (important)

Prototype runs **SQLite** (no Postgres/Docker on the dev machine; keeps the demo
one-command). Schema mirrors `../phase1/05-data-model-and-statuses.md` and stays
Postgres-portable. **Postgres migration is required before real-client shadow mode
or production hardening** — treat it as a gate item with the D-09 live-data
safeguard gate.

## Scope guards (binding)

No production auth/MFA/permissions, no POPIA/storage/audit hardening, no AI,
no integrations, no video recording, no WhatsApp, no full template builder.
Surveys and multi-peril claim templates are ACTIVE as of Chunk 1F (v0.1-1F,
pending assessor workshop sign-off); fire remains reference-only /
physical-first and is not bookable as a virtual assessment.
Provider secrets/tokens never go in the repo — `.env.local` only (gitignored);
the spike harnesses take keys via on-page inputs at runtime.
