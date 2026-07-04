# 09 — Security, Privacy & Compliance

The Inspector processes personal information of insureds under South African law
(POPIA) and produces evidence that may be tested in disputes. Security and privacy are
product features here, not IT hygiene.

## 9.1 Consent

- **Explicit, informed, logged**: before any session, the client sees plain-language
  consent covering: purpose (claim assessment / risk survey), what is captured
  (screenshots/photos, answers, notes — state clearly whether continuous video is
  recorded; MVP: it is not), who sees it (Acorn, the insurer, service providers),
  retention period, and rights (access, correction, complaint to the Information
  Regulator).
- Consent record stores: exact text version shown, typed name, timestamp, IP,
  user agent. Kept beyond evidence retention as proof of lawful processing.
- Decline path must be real: session ends politely, assessor notified, job routed to
  alternative process (physical assessment) — declining consent cannot silently
  prejudice the client.
- In-session courtesy: client sees a visible indicator when a capture is taken.
- Third parties on camera: assessor's opening script confirms who is present; consent
  text covers incidental appearance of household members.

## 9.2 POPIA specifics

- **Lawful basis**: consent + performance-of-contract (claim fulfilment) — get formal
  input from Acorn's compliance function on the notice wording before Phase 2.
- **Data minimisation**: capture only what the assessment needs. Concretely:
  - No ID numbers stored unless a confirmed requirement emerges (identity is confirmed
    on camera, recorded as a boolean + note).
  - Guide assessors (template design + training) to avoid capturing unrelated personal
    material — e.g. frame the geyser, not the family photos on the wall; documents
    captured should be claim-relevant pages only.
- **Purpose limitation**: evidence usable for the claim/survey and related disputes
  only; the consent text must not over-reach.
- **Operators**: video provider, storage, SMS/email providers are POPIA "operators" —
  operator agreements/DPAs required; prefer providers with data residency options
  (AWS af-south-1 Cape Town exists — see doc 10).
- **Cross-border transfer**: if any provider processes outside SA, POPIA s72 conditions
  apply — document the transfer basis per provider.
- **Data subject rights**: build for export ("give me my data" = report + evidence
  items about the subject) and deletion requests (balanced against legitimate
  retention for claims defence — legal input needed on retention override wording).
- **Breach readiness**: audit logs + access logs make scope determination possible;
  document the notification runbook (Information Regulator + affected subjects).

## 9.3 Secure evidence storage & integrity

- Object storage private by default; access only via short-lived signed URLs issued to
  authenticated, authorised users. No public buckets, no guessable paths.
- Encryption in transit (TLS everywhere) and at rest (provider-managed keys acceptable
  for MVP).
- **Integrity**: SHA-256 at ingest, stored in DB and printed in evidence indexes;
  originals immutable — edits (relabel) touch metadata only, never pixels;
  soft-delete only, with reason, audited.
- Server-side timestamps are authoritative; client device time recorded as secondary.

## 9.4 Expiring client links

- Single-purpose tokens (join vs upload), random ≥128-bit, stored hashed.
- Join links: valid from ~1h before the appointment until session end + grace; upload
  links: default 7 days.
- Reissue revokes the predecessor; open/use events logged (also evidentially useful —
  "client opened the link twice and did not join").
- Links carry no personal data in the URL; the landing page reveals minimal info
  (first name, partial claim ref) before consent.

## 9.5 Role-based access

- Assessors see only their assigned jobs. Admins see all jobs but not audit
  configuration. Managers see all jobs + audit trails + reopen powers.
- Downloads of reports/packs are permission-gated and logged (who, when, which
  version).
- Staff auth: MFA mandatory (they handle personal data from anywhere); session
  timeout; immediate deactivation path for departing staff/panel assessors.
- Clients authenticate by possession of the link only — acceptable given single-use,
  expiry, and minimal pre-consent disclosure; re-verify identity verbally on camera.

## 9.6 Audit trail

- Append-only, no update/delete grants even for admins (enforced at DB level).
- Covers the full chain: creation → link issue/open → consent → session → every
  capture/edit/discard → responses → report versions → approval → downloads →
  reopens.
- Time-synced server clock (NTP); events carry actor, IP, and context diff.

## 9.7 Evidence retention

- Policy decision needed (doc 12): proposal — active retention for the claims
  prescription horizon (≥ 3 years from closure; insurers commonly keep claim files
  5–7 years), then automated deletion/anonymisation, with legal-hold override per job.
- Retention clock starts at job closure; consent records and audit skeletons outlive
  content deletion (proof of process without the personal content).
- Cancelled jobs: shorter retention (e.g. 12 months) — decision needed.

## 9.8 Download controls

- Reports/packs downloadable only by authorised roles; every download audited.
- Email-out of reports goes via the system (logged recipient, timestamp) rather than
  ad-hoc attachments where possible.
- Watermarking (recipient + date on PDF) is cheap and worth doing in Phase 3.
- No bulk-export endpoints in MVP (exfiltration surface); per-job only.

## 9.9 Avoiding unnecessary personal information capture

Summary of concrete commitments baked into the design:
- Clients have no accounts → no credentials, no profile accumulation.
- Client record: name, phone, email, language. Nothing else without a defined need.
- Checklist-driven capture inherently scopes what gets photographed.
- No continuous video recording in MVP → radically less incidental data captured.
- Template review (Phase 0/3) includes a privacy pass: every evidence item must
  justify its purpose.
