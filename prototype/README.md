# The Inspector — workflow prototype (Phase 1)

**Codename only — not client-facing branding. Acorn only. Role-play / anonymised
data only; no real client data (phase0 D-09 safeguard gate).**

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

The SQLite database self-creates and self-seeds at `db/inspector.db` on first
request. Delete `db/inspector.db*` to reset to seed data. Client uploads land in
`db/uploads/` (gitignored).

## Entry points

- `/` — placeholder role picker (Admin / Assessor / Manager). No login exists in
  Phase 1 by design; this is mock access (AC9).
- `/c/demo-geyser`, `/c/demo-acc` — demo client links (long-dated seeds).
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

No production auth/MFA/permissions, no POPIA/storage/audit hardening, no surveys,
no fire claims, no AI, no integrations, no video recording, no WhatsApp. Chunk 1D
(live room) is blocked until the SP1–SP10 device spike verdict is approved.
Provider secrets/tokens never go in the repo — `.env.local` only (gitignored);
the spike harnesses take keys via on-page inputs at runtime.
