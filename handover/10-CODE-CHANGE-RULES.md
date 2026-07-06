# Code change rules — The Inspector prototype

Simple, binding rules for every future code change, however small. They exist
so a lower-capability model or a developer in a hurry cannot accidentally
break the demo, the scope decisions, or the honesty of the outputs.

## The change loop (always, in this order)

1. **Read first:** [08-SCOPE-GUARDRAILS.md](08-SCOPE-GUARDRAILS.md) and the
   relevant part of [02-CODEBASE-STRUCTURE.md](02-CODEBASE-STRUCTURE.md).
2. **Before testing anything:** stop the dev server → `npm run reset:demo` →
   `npm run dev`. Never judge behaviour on a dirty database.
3. **Make the smallest change that satisfies the task.** No drive-by
   refactors, renames, or formatting sweeps.
4. **After the change:** `npm run qa:smoke` (22/22 PASS required),
   `npx tsc --noEmit` clean, `npm run build` clean. For workflow-touching
   changes, also walk the affected section of
   `phase1/regression-checklist.md`.
5. **If behaviour changed:** update the handover docs, `phase1/demo-guide.md`
   and `phase1/known-limitations.md` **in the same commit**. If a smoke
   marker string changed, update `scripts/qa-smoke.mjs` to match and say so
   in the commit message.
6. **Leave the book pristine:** stop server → `npm run reset:demo` → done.

## Hard rules (never break these)

1. **Do not touch excluded scope.** No auth/MFA/permissions, no
   POPIA/storage/audit hardening, no AI, no integrations, no recording, no
   WhatsApp, no Daily.co/LiveKit implementation, no template builder — see
   file 08 for the full list and the approval paths.
2. **Keep fake data fake.** Everything in `fixtures.ts` and every demo record
   must remain obviously role-play. No real names, numbers, addresses,
   policies, claims, or documents — ever (phase0 D-09).
3. **Keep the PROTOTYPE banners.** The app must never look like a production
   system, to anyone, in any screenshot.
4. **Keep reports honest.** The auto Limitations section is non-removable by
   construction (`report.ts`) — never make it editable, optional, or
   softer-worded. Same for the survey "NOT adequately surveyable virtually"
   outcome.
5. **Do not remove limitations** — not from the reports, not from
   `phase1/known-limitations.md`, not from this pack. A limitation leaves the
   register only when the gate that resolves it has actually passed.
6. **Client-facing screens show client-facing information only.** Nothing
   under `/c/[token]/*` may expose internal data: staff notes, concern flags,
   other jobs, dashboards, assessor commentary, or internal statuses. The 1C
   audit (`phase1/1c-client-visibility-audit.md`) is the reference.
7. **Fire stays unbookable** — disabled in the picker AND rejected in
   `createJobAction` — without explicit recorded approval (policy T4). Any
   change here needs a management decision first.
8. **No provider-specific video code outside the adapter.** Room components
   import only the `SessionAdapter` interface (`src/lib/video/adapter.ts`).
   A new provider = one new adapter file. No provider types, SDK imports,
   keys, or URLs anywhere else. Secrets go in `.env.local` only, never the
   repo.
9. **Every mutation goes through `actions.ts` and logs an event** via
   `logEvent`. Never write to the DB from pages/components; never add an
   update/delete path for `event_log` rows.
10. **Respect the status machine.** Legal transitions live in `EDGES` in
    `data.ts`; `"Report completed"` has no outgoing edges — that IS the lock.
    Don't bypass `changeStatus`, don't add edges to work around a test.
11. **Template edits bump the template version string** and name the approver
    in the commit message (interim governance until G13).
12. **DB changes = schema.ts + reset/reseed**, keeping Postgres portability
    (TEXT uuids, ISO-8601 UTC, JSON-in-TEXT). No migration framework, no
    SQLite-only features.

## Commit hygiene

- One task per commit; message says what changed and why, naming the approver
  for template/report content changes.
- Never commit: `db/` artefacts, uploads, `.env.local`, secrets of any kind.
- If a commit changes behaviour but no doc, it's incomplete — see step 5.
