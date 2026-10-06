# Required secrets and environment variables — staging

Set these **only** in Vercel project env vars (Environment: Preview/Staging; mark secrets
"Sensitive"). Never commit them, never paste them into chat or docs. Verified against
`process.env` usage in `prototype/src` at commit `cff877d` (2026-10-06).

## Required

| Variable | Secret? | Build-time? | Purpose | Provided by | Status |
|---|---|---|---|---|---|
| `DB_PROVIDER` = `postgres` | no | no | Select Postgres runner | — | ready |
| `DATABASE_URL` | **yes** | no | `postgresql://USER:PASS@HOST:5432/DB` — no `sslmode` needed (it is stripped; TLS is controlled by `PG_SSL_*`). URL-encode special characters in the password. | You (RDS) | ⏳ |
| `PG_SSL_CA` | no (public cert) | no | PEM of the CA to trust: the **AWS RDS regional bundle for af-south-1** (small; Vercel env vars are limited to 64 KB total, so do **not** use the global bundle). Escaped `\n` sequences accepted. | You (download from AWS) | ⏳ |
| `STORAGE_PROVIDER` = `s3` | no | no | Select S3 storage | — | ready |
| `S3_REGION` = `af-south-1` | no | no | Bucket region (falls back to `AWS_REGION`, then `af-south-1`) | — | ready |
| `S3_BUCKET` | no | no | Bucket name. **Required** in s3 mode (no default any more). | You | ⏳ |
| `S3_ACCESS_KEY_ID` | **yes** | no | Least-privilege staging key (policy in `manual-cloud-setup-checklist.md`). Set **both** keys or neither. | You (IAM) | ⏳ |
| `S3_SECRET_ACCESS_KEY` | **yes** | no | As above | You (IAM) | ⏳ |
| `NEXT_PUBLIC_VIDEO_ADAPTER` = `livekit` | no | **YES** | Staging default adapter (P2P stays the local/dev fallback; P2P signaling is in-memory and cannot work across serverless instances) | — | set before build |
| `NEXT_PUBLIC_LIVEKIT_URL` = `wss://<project>.livekit.cloud` | no | **YES** | Client websocket URL | You (LiveKit) | ⏳ |
| `LIVEKIT_API_KEY` | **yes** | no | Server-side token minting (now behind auth — F1 fixed) | You (LiveKit) | ⏳ |
| `LIVEKIT_API_SECRET` | **yes** | no | As above | You (LiveKit) | ⏳ |
| `SMS_PROVIDER` = `twilio` | no | no | Enable Twilio sending (default is console) | — | ready |
| `TWILIO_ACCOUNT_SID` | **yes** | no | Twilio account | You (Twilio) | ⏳ |
| `TWILIO_AUTH_TOKEN` | **yes** | no | Twilio auth | You (Twilio) | ⏳ |
| `TWILIO_FROM_NUMBER` | no | no | Sender number (E.164) | You (Twilio) | ⏳ |
| `NODE_ENV` | no | auto | `production` on Vercel; cookies `Secure`; disables `/api/dev/session` | Vercel | automatic |

## Optional / tuning

| Variable | Default | Purpose |
|---|---|---|
| `PG_POOL_MAX` | 3 on Vercel, 10 elsewhere | Max connections **per serverless instance** (keep small; RDS has a connection ceiling) |
| `PG_SSL_MODE` | `verify` (non-localhost) / `disable` (localhost) | `verify` = TLS + certificate check (needs `PG_SSL_CA` for RDS); `no-verify` = TLS without checking the server certificate (weaker; staging stop-gap only); `disable` = plain |
| `DAILY_API_KEY` | — | Only for Daily comparison runs (also behind auth now) |

## Notes

- `AWS_*` variables are **no longer read by the app** for S3 except as the SDK's default-chain
  fallback when neither `S3_ACCESS_KEY_ID` nor `S3_SECRET_ACCESS_KEY` is set (local runs / AWS-hosted).
- Upload size is a code constant (3.5 MB, `lib/limits.ts`), not an env var — see F2 in the report.
- Not read by the code (ignore if you see them in older notes): `SMS_API_KEY`, `LIVEKIT_URL`, `NEXT_PUBLIC_BASE_URL`.
- Rotation/revocation list: `rollback-notes.md`.
