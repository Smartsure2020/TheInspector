> **Superseded 2026-10-06:** use `required-secrets-and-env-vars.md`. This template lists `SMS_API_KEY` and `LIVEKIT_URL`, which the code does not read.

# Staging Environment Variables Template

Copy to `.env.local` (or your hosting platform's env config) for staging deployment.

```bash
# ---- Database (Postgres) ----
DB_PROVIDER=postgres
DATABASE_URL=postgresql://inspector:PASSWORD@db-host:5432/inspector_staging?sslmode=require

# ---- Object Storage (S3-compatible) ----
STORAGE_PROVIDER=s3
AWS_REGION=af-south-1
S3_BUCKET=inspector-uploads-staging
# AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY set via IAM role or env

# ---- Video Provider ----
# Options: p2p (local/dev fallback), livekit, daily
# P2P is the default; set one of the below for staging
NEXT_PUBLIC_VIDEO_ADAPTER=p2p

# LiveKit (if selected)
# NEXT_PUBLIC_VIDEO_ADAPTER=livekit
# LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
# NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
# LIVEKIT_API_KEY=APIxxxxxxx
# LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Daily.co (if selected)
# NEXT_PUBLIC_VIDEO_ADAPTER=daily
# DAILY_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# ---- SMS (OTP delivery) ----
# SMS_PROVIDER=console          # default: logs to console
# SMS_API_KEY=                   # for production SMS gateway

# ---- Application ----
NODE_ENV=production
# NEXT_PUBLIC_BASE_URL=https://staging.inspector.example.com
```

## Notes

- `DB_PROVIDER=postgres` activates the PgRunner in `lib/db.ts`. The same DDL runs on both SQLite and Postgres.
- `STORAGE_PROVIDER=s3` activates S3 uploads in `lib/storage.ts`. Presigned URLs (15-min expiry) are returned for file downloads.
- Postgres event_log immutability rules (`no_update_event_log`, `no_delete_event_log`) are applied automatically by `schema-hardening.ts` when `DB_PROVIDER=postgres`.
- Video adapter is selected at runtime via `NEXT_PUBLIC_VIDEO_ADAPTER`. P2P remains the local/dev fallback. Provider recommendation deferred until real mobile testing.
- `SMS_PROVIDER=console` (default) logs OTP codes to server stdout -- suitable for staging/demo. No real SMS sent.
