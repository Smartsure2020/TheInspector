# Pre-pilot safeguard checklist

**Purpose:** Everything that must be true before ANY real client data enters
the system. This is the Gate G4 checklist. It is deliberately minimal — it
does NOT require full production hardening, only the minimum safeguards for
shadow-mode piloting.

**Gate:** G4 (Minimum live-data safeguards)
**Decision:** D-09 (Pilot claim volume & mode)
**Status:** NOT APPROVED — management/compliance sign-off required

---

## What "shadow mode" means

- Virtual assessment runs ALONGSIDE the existing physical process
- The physical process remains the system of record for every shadowed claim
- Prototype output is comparison material, NOT the official assessment
- If the prototype fails mid-assessment, the physical process continues unaffected

---

## Safeguard checklist

Each item must be implemented AND verified before real-client data is permitted.

### Data & storage

| # | Safeguard | Gate | Status | Verified by |
|---|-----------|------|--------|-------------|
| S1 | **Postgres database** (not SQLite) for all pilot data | G5 | Code complete (dual-provider ready) — needs deployment | |
| S2 | **Object storage** (S3/equivalent) for evidence files, not local disk | G5 | Code complete (dual-provider ready) — needs deployment | |
| S3 | **Backups configured** — automated daily, tested restore | G5 | Not started | |
| S4 | **Encryption at rest** — database and object storage | G7 | Not started | |
| S5 | **Retention/deletion rule** — what happens to pilot data when pilot ends | G9 | Not defined | |

### Access control

| # | Safeguard | Gate | Status | Verified by |
|---|-----------|------|--------|-------------|
| S6 | **Staff authentication** — real login replaces role picker for pilot environment | G6 | Not started | |
| S7 | **Limited named access** — only named pilot participants can access pilot data | G6 | Not started | |
| S8 | **Client link verification** — OTP or equivalent on client assessment links | G6 | Not started | |
| S9 | **Access logging** — who accessed what evidence/report and when | G7 | Not started | |

### Legal & consent

| # | Safeguard | Gate | Status | Verified by |
|---|-----------|------|--------|-------------|
| S10 | **Consent wording** — legal-reviewed text shown to real clients (not the placeholder) | G10 | Not started | |
| S11 | **"Not system of record" confirmation** — written acknowledgment that prototype output is comparison material only | D-09 | Not started | |
| S12 | **POPIA minimum** — lawful basis for processing identified; data flows documented | G10 | Not started | |

### Operational

| # | Safeguard | Gate | Status | Verified by |
|---|-----------|------|--------|-------------|
| S13 | **Controlled deployment** — known hosting, not a developer laptop or ad-hoc tunnel | G12 | Not started | |
| S14 | **Incident contact** — named person to contact if something goes wrong with pilot data | — | Not defined | |
| S15 | **Pilot scope limit** — documented maximum number of claims, claim types, and duration | D-09 | Proposed (≥10 claims, shadow mode) — not formally approved | |

---

## Approval workflow

1. This checklist is reviewed by management and/or compliance
2. Each safeguard is marked as required / waived-with-rationale / not-applicable
3. The approved checklist is signed and dated
4. Implementation begins (Phase G)
5. Each safeguard is implemented, tested, and verified by a named person
6. Only after ALL required safeguards are verified: real-client shadow testing may begin

**Approved by:** _______________ **Date:** _______________
**Compliance review:** _______________ **Date:** _______________

---

## What this checklist does NOT cover

These are deferred to full production hardening (Phase H) and are NOT required
for shadow-mode piloting:

- Full POPIA implementation (consent lifecycle, subject access, cross-border)
- MFA for all users (minimum: basic auth for named pilot staff)
- Enforced append-only audit (convention-based audit is acceptable for shadow)
- Content hashing / integrity chain on evidence
- Server-generated PDF with letterhead
- Template versioning governance in-product
- Public deployment / always-on URL (pilot uses a controlled, limited environment)
- Operator agreements
- Client-facing product naming (D-01)

---

## Current state (as of 2026-07-13)

| Area | State |
|------|-------|
| Database | Dual-provider code complete (SQLite default, Postgres via `DB_PROVIDER=postgres`). No Postgres instance provisioned. |
| Object storage | Dual-provider code complete (local default, S3 via `STORAGE_PROVIDER=s3`). No S3 bucket provisioned. |
| Auth | Placeholder role picker only. No auth library installed. |
| Consent | Placeholder wording in prototype. Not legal-reviewed. |
| Deployment | Runs on developer laptop only. No hosted environment. |
| Backups | None (SQLite file, local disk). |
| Access logging | Event log captures actions but no evidence-access logging. |

**Bottom line:** The code infrastructure for S1 and S2 is ready. Everything else
requires human decisions, provisioning, and implementation before real-client data
is permitted.

---

## Rules (binding)

- **No real client data until this checklist is approved AND all required safeguards are verified.**
- **No shortcuts.** "Just one test claim" is still real client data.
- **Anonymised-but-reidentifiable data counts as real data** for this checklist.
- **Role-played assessments with fake data do NOT require this checklist** — they can proceed freely.
- **This checklist is the MINIMUM.** It does not replace full production hardening.
