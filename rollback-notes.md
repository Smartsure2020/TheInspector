# Rollback notes — staging

Staging holds fake data only, so rollback is about recovering a working state quickly and
cleanly revoking access — not preserving data.

## Code / deploy

- Stable checkpoint: git tag **`inspector-current-stable`** (`9a648f9` on `main`, pushed 2026-10-06; code state `beb6cff`).
- Vercel: promote the previous deployment (Deployments → ⋯ → Promote/Instant Rollback), or
  redeploy the tag. Preview URLs of earlier deployments stay available until deleted.
- Revert to local-only: unset `DB_PROVIDER`, `STORAGE_PROVIDER`, `NEXT_PUBLIC_VIDEO_ADAPTER`
  (defaults are SQLite, local disk, P2P) — the app still runs locally with `npm run dev`.

## Database

- Before any schema-affecting deploy: take an RDS manual snapshot.
- Staging data is fake: simplest recovery is **drop and recreate** the database; the app
  re-applies DDL and re-seeds on first request.
- Event-log immutability rules (Postgres) block UPDATE/DELETE; to reset, drop and recreate the
  database (or a superuser drops the rules) — do not try to delete rows.

## Storage

- Bucket versioning is on; deleted/overwritten objects are recoverable. Staging objects can be
  emptied freely (fake data). `evidence_items.file_key` rows must be reset together with the DB.

## Kill switch / secret revocation (do these if anything leaks or misbehaves)

1. Vercel: pause/delete the staging deployment or disable the project.
2. LiveKit: rotate API key/secret (stops token minting immediately — see F1).
3. Twilio: rotate auth token / suspend the number.
4. AWS: deactivate the access key (or remove the OIDC trust); restrict the RDS security group to nothing.
5. Rotate the RDS password.
6. Clear Vercel env vars.

## Teardown order (end of staging)

Vercel project → LiveKit project → Twilio number → S3 bucket (empty first) → RDS (take final snapshot only if wanted) → IAM user/role.

## What cannot be rolled back

Anything sent to a real phone via Twilio. Use only staff-owned numbers on staging.
