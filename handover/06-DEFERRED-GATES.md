# Deferred gates — The Inspector

Every item below is a **deliberate deferral with a gate**, not an oversight.
A gate "passes" only when its conditions are met AND the pass is recorded
(decision register `phase0/10-decision-register.md` or a dated note in this
folder). Until a gate passes, the work behind it is **blocked** — do not
build it, do not partially build it, do not "prepare it in code".

---

## G1 — Mobile live-room verification

- **Why it matters:** real clients will join from phones; the room is only
  verified desktop↔desktop. Phone cameras, browsers (Safari/Chrome mobile),
  rear-camera switching and mobile networks are all unproven (limitation L1).
- **Trigger:** any plan to put a client (even a role-playing one) on a phone;
  prerequisite for the provider decision evidence and for any pilot.
- **Must be true to pass:** HTTPS route to the app (tunnel or deployment, per
  `phase1/spike-manual-test-guide.md`); device spike SP1–SP10 re-run on ≥2
  real phones; cold link → waiting room → session → capture verified;
  results written up.
- **Blocked until then:** any pilot, any claim that "clients can join from
  their phone" beyond "designed for, not yet verified".

## G2 — Final video provider / TURN decision

- **Why it matters:** P2P with no TURN fails on strict corporate NAT/CGNAT
  (L2); no provider is selected (L3); Daily.co is excluded (paid).
- **Trigger:** mobile verification results; management direction from the
  demo; any pilot planning.
- **Must be true to pass:** comparison done (cost, POPIA/data residency,
  testability); chosen option implemented **behind `SessionAdapter` only**;
  verified on the device matrix; decision recorded.
- **Blocked until then:** provider-specific code anywhere outside one adapter
  file; recording; any paid provider account.

## G3 — Assessor template sign-off

- **Why it matters:** the templates are the product. All 1F templates are
  v0.1 demo content; only geyser+accidental carry assessor-reviewed (Phase 0
  v0.2) content (L6).
- **Trigger:** management go-ahead for the workshop (Phase B).
- **Must be true to pass:** workshop run per `phase0/03-assessor-workshop-guide.md`;
  every active template signed off or corrected; template owners named (D-07).
- **Blocked until then:** presenting template content as validated; using
  templates with any real assessment (even shadow).

## G4 — Minimum live-data safeguards (phase0 D-09) — HARD GATE

- **Why it matters:** POPIA and basic duty of care. The prototype has no
  auth, no encryption, unauthenticated links, local unencrypted storage.
- **Trigger:** any proposal to touch real client data, including "just one
  test claim" and anonymised-but-reidentifiable data.
- **Must be true to pass:** a written minimum-safeguard checklist approved by
  management/compliance (Phase F), then **implemented and verified** —
  including G5.
- **Blocked until then:** real-client shadow testing; entering ANY real
  client name, phone number, address, policy or claim number into any
  environment; demoing with real claim documents.

## G5 — Postgres + object-storage migration

- **Why it matters:** SQLite is single-writer with no backups; uploads sit on
  a local disk (L4). Fine for fake data, unacceptable for real data.
- **Trigger:** approved shadow-mode pilot plan (part of the G4 safeguard set).
- **Must be true to pass:** schema ported (it is deliberately
  Postgres-portable — TEXT uuids → uuid, timestamps → timestamptz, JSON TEXT
  → jsonb); storage module swapped to an object store; backups configured;
  smoke + regression pass against the new stack.
- **Blocked until then:** shadow mode, production hardening, any deployment
  holding non-throwaway data.

## G6 — Production auth / MFA / permissions

- **Why it matters:** the role picker is placeholder access — any visitor can
  act as any role (L11). Fine only while everything is fake and local.
- **Trigger:** production hardening phase (after pilot evidence).
- **Must be true to pass:** real login + MFA for staff; role permissions
  enforced server-side; client links get verification (OTP or equivalent per
  the hardening design); placeholder role picker removed.
- **Blocked until then:** any internet-facing deployment that isn't a
  throwaway demo tunnel; any real data (also G4).

## G7 — Secure storage / signed URLs

- **Why it matters:** `/api/files/[id]` serves evidence unauthenticated;
  uploads are plain files on disk.
- **Trigger:** production hardening (design may be drafted during G4 work).
- **Must be true to pass:** object storage with signed, expiring URLs; access
  logging on evidence reads; encryption at rest.
- **Blocked until then:** storing anything sensitive; exposing the file
  endpoint beyond localhost/demo tunnels.

## G8 — Audit hardening

- **Why it matters:** the event log is append-only **by convention** only;
  evidence has no sha256/integrity chain (reserved columns exist, empty).
  Evidential weight of assessments depends on this.
- **Trigger:** production hardening; insurer/legal review of evidential
  requirements.
- **Must be true to pass:** enforced append-only audit store; content hashing
  on evidence at capture/upload; original-metadata retention.
- **Blocked until then:** representing packs/reports as tamper-evident.

## G9 — Retention / download controls

- **Why it matters:** POPIA requires defined retention and controlled
  disclosure; today anyone can download any pack.
- **Trigger:** production hardening + POPIA finalisation.
- **Must be true to pass:** retention schedule agreed and enforced; download
  audit + access control on packs/reports/files.
- **Blocked until then:** real data (via G4); retention promises to anyone.

## G10 — POPIA finalisation

- **Why it matters:** lawful processing of client personal information —
  consent lifecycle, subject access, cross-border storage, operator
  agreements. Documented in `09-security-compliance.md` but not implemented.
- **Trigger:** production hardening; prerequisite pieces surface earlier in
  the G4 minimum set.
- **Must be true to pass:** compliance review sign-off of the implemented
  system (not just documents).
- **Blocked until then:** production use of any kind.

## G11 — Server-generated PDF

- **Why it matters:** browser print-to-PDF has no letterhead/pagination
  control and no signature block (L5); insurers will expect a controlled
  document.
- **Trigger:** production hardening (or an explicit management ask backed by
  a decision — it is NOT needed for demos or the workshop).
- **Must be true to pass:** server-side rendering (headless-Chromium class)
  producing the same report model output, versioned with the report.
- **Blocked until then:** promising letterhead-quality PDFs.

## G12 — Real deployment

- **Why it matters:** everything runs on one dev laptop; the signaling
  channel is in-memory single-process; there are no backups.
- **Trigger:** pilot needs (temporary controlled deployment under G4/G5) or
  production hardening (permanent).
- **Must be true to pass:** environment plan (hosting, TLS, secrets, backups,
  monitoring) appropriate to the data it will hold; for anything beyond fake
  data, G4–G7 first.
- **Blocked until then:** any always-on public URL. Ephemeral HTTPS tunnels
  for device testing (G1) are the one allowed exception — fake data only.

## G13 — Template ownership & versioning governance

- **Why it matters:** templates change how claims are assessed; changes need
  named owners and versioned sign-off (D-07), or the audit story collapses.
- **Trigger:** the assessor workshop (owners named there); enforced
  in-product during hardening.
- **Must be true to pass:** one named owner per claim type + an overall
  custodian; every template change versioned and attributable.
- **Blocked until then:** treating template edits as casual copy changes
  (interim rule: version-bump in `templates.ts` + note in the commit).

---

**If a task seems to require crossing a gate:** stop, document what you would
have done, and surface it as a decision — see the "belongs now or later" test
in [08-SCOPE-GUARDRAILS.md](08-SCOPE-GUARDRAILS.md).
