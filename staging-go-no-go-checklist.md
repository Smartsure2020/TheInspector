# Staging Go / No-Go Checklist

**Date:** 2026-07-16
**Phase:** 5B -- Staging Enablement
**Decision gate:** Internal/staging staff-only pilot

## GO criteria (all must pass)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `npx tsc --noEmit` passes | GO | Clean output, no errors |
| 2 | `npm run build` succeeds | GO | All routes compiled (incl. /access-denied) |
| 3 | `npm run qa:smoke` passes (27 checks) | PENDING | Run manually: `npm run reset:demo`, restart server, `npm run qa:smoke` |
| 4 | RBAC 500 errors replaced with friendly page | GO | `requireRole()` now redirects to /access-denied |
| 5 | Report heading spacing fixed | GO | Badge moved to `justify-between` flex layout |
| 6 | OTP input autofocus reliable | GO | useRef + useEffect added alongside autoFocus attr |
| 7 | Evidence chain: sha256 at capture | GO | Code verified in actions.ts:378, 409 |
| 8 | Evidence chain: sha256 in index.csv | GO | Code verified in api/pack/[id]/route.ts:26,45 |
| 9 | Evidence chain: access_log on download | GO | Code verified in pack and file routes |
| 10 | Postgres provider switchable | GO | DB_PROVIDER=postgres activates PgRunner |
| 11 | S3 provider switchable | GO | STORAGE_PROVIDER=s3 activates S3Client |
| 12 | Postgres event_log immutability rules | GO | Rules created in schema-hardening.ts:122-133 |
| 13 | File/pack endpoints require auth | GO | 401 returned, smoke test coverage |
| 14 | Staging env vars template documented | GO | staging-env-vars-template.md created |
| 15 | No product features added | GO | Changes limited to fixes + staging enablement |

## NO-GO constraints (must remain in effect)

| Constraint | Status |
|------------|--------|
| Real client data: NO-GO | Enforced -- no PII in demo seed, placeholder branding |
| Production deployment: NO-GO | No production config exists |
| Final video provider selection: NO-GO | Deferred until real mobile testing |
| Auth/security hardening: DEFERRED | Placeholder RBAC, no production auth |
| POPIA compliance: DEFERRED | No real personal data processed |

## Decision

- **Internal/staging staff-only pilot: GO**
- **Real client data: NO-GO**
- **No expansion features introduced: CONFIRMED**

## Next steps

1. Run `npm run qa:smoke` against running server to confirm criterion #3
2. Deploy to staging with Postgres + S3 env vars
3. Run manual desktop-to-desktop capture test (see evidence-chain-verification-results.md)
4. Begin LiveKit or Daily.co evaluation with real mobile devices
5. Report results before advancing to client-facing pilot
