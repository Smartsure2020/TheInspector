# Chunk 1C — Client Visibility Audit

Rule (phase1/01 §2, phase0 doc 07): the client must NEVER see concern flags,
internal notes, checklist contents, policy concerns, claim-decision language,
quantum commentary, other jobs, or staff-only screens.

Audit performed against the code after the 1C build. Every client-facing route and
every value it renders:

| Route | Data rendered to the client | Verdict |
|-------|------------------------------|---------|
| `/c/[token]` (landing, all 5 link states) | Client's own name, assessor name, appointment time, **partial** claim ref (last 5 chars), generic prep list keyed off claim type, friendly state copy | ✅ Clean |
| `/c/[token]/consent` | Draft consent wording (static), typed name (client's own input) | ✅ Clean |
| `/c/[token]/check` | Client's own camera/mic streams, troubleshooting copy | ✅ Clean — nothing job-specific at all |
| `/c/[token]/waiting` | Client first name, assessor name | ✅ Clean |
| `/c/[token]/session` (1A mock) | Static placeholder UI, sample instruction banner text | ✅ Clean — no live data |
| `/c/[token]/upload` | Plain-language names of the client's own missing items + per-item done ticks | ✅ Clean — item labels are the template's `client-facing` phrasings or plain-name overrides; no answers, notes, flags, or reasons rendered |
| `/api/files/[id]` | Serves an uploaded file by evidence UUID | ⚠ Note below |

**Confirmed absent from all client routes:** concern flags, notes,
checklist answers/structure (upload page shows only the names of requested items,
which the client necessarily must see), policy/special conditions, status values,
quantum or decision language, links to staff routes, other jobs' data.

**Prototype-model notes (accepted, not violations):**
1. All routes are unauthenticated by design (placeholder access, AC9). Possession
   of a token is the client's credential; staff screens are reachable by URL to
   anyone using the prototype. This is the documented Phase 1 access model —
   production hardening (Tier B) adds real access control.
2. `/api/files/[id]` serves any evidence file to whoever knows its UUID (random,
   unguessable, but unauthenticated). Acceptable for fake-data prototype; replaced
   by signed URLs at hardening. Logged in the Tier B list.
3. The too-early landing state includes a small "Prototype preview: continue
   anyway" link so role-play sessions aren't blocked by the 2h window. Labelled
   as prototype; remove before any real-client use.

**Re-audit trigger:** any change to files under `src/app/c/` or `src/components/`
used by them (ClientBits, DeviceCheck, UploadItem, ClientShell) re-runs this
checklist — it is part of the 1J usability-test gate (phase1/09).
