# Phase 5 — Staging Environment Readiness Checklist

Complete this checklist after the internal shadow pilot succeeds. All items must be checked before deploying to a staging environment where real client data may enter.

---

## Infrastructure

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| S1 | Hosting platform selected (e.g. Vercel, Railway, self-hosted) | | | |
| S2 | Postgres database provisioned (DB_PROVIDER=postgres) | | | |
| S3 | Event log immutability RULES verified on Postgres | | | |
| S4 | S3-compatible storage bucket provisioned (STORAGE_PROVIDER=s3) | | | |
| S5 | HTTPS / TLS configured with valid certificate | | | |
| S6 | Domain or subdomain assigned | | | |
| S7 | Environment variables configured (no secrets in code) | | | |
| S8 | Database backup schedule configured (daily minimum) | | | |
| S9 | Backup restore tested at least once | | | |
| S10 | Monitoring / error tracking (Sentry or equivalent) | | | |

## Authentication & Security

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| S11 | SMS provider configured (SMS_PROVIDER=twilio) | | | |
| S12 | OTP delivery tested with real phone numbers | | | |
| S13 | All seed/demo data purged from staging DB | | | |
| S14 | Staff accounts provisioned with real emails and strong passwords | | | |
| S15 | Dev-only API routes disabled or removed (api/dev/*) | | | |
| S16 | NODE_ENV=production set | | | |
| S17 | Cookie secure flag active (production mode) | | | |
| S18 | Security review / pen-test scheduled or completed | | | |

## Legal & Compliance

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| S19 | POPIA consent wording approved by legal | | | |
| S20 | Consent withdrawal mechanism implemented | | | |
| S21 | Retention policy defined per claim type | | | |
| S22 | Retention enforcement automated (purge scheduler) | | | |
| S23 | Data processing agreement in place | | | |
| S24 | Privacy notice URL configured | | | |

## Operations

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| S25 | Incident response procedure documented | | | |
| S26 | Access log review schedule defined (daily for first 2 weeks) | | | |
| S27 | Escalation contacts identified | | | |
| S28 | Rollback procedure documented | | | |
| S29 | Staff training completed (admin, assessor, manager) | | | |
| S30 | Client-facing SMS wording approved | | | |

## Validation

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| S31 | Smoke tests pass on staging (npm run qa:smoke) | | | |
| S32 | End-to-end dry run completed on staging | | | |
| S33 | Evidence hash verification tested on staging | | | |
| S34 | Pack download and CSV hash column verified on staging | | | |
| S35 | Video provider selected and tested on mobile (LiveKit or Daily.co) | | | |

---

## Sign-off

| Role | Name | Date | Approved? |
|------|------|------|-----------|
| Project lead | | | |
| Technical lead | | | |
| Legal / compliance | | | |
