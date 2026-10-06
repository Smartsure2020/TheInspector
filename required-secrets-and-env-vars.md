# Required secrets and environment variables — staging

Set these **only** in Vercel project env vars (Environment: Preview/Staging; mark secrets
"Sensitive"). Never commit them, never paste them into chat or docs. Verified against
`process.env` usage in `prototype/src` on 2026-10-06.

| Variable | Secret? | Build-time? | Purpose | Provided by | Status |
|---|---|---|---|---|---|
| `DB_PROVIDER` = `postgres` | no | no | Select Postgres runner | — | ready |
| `DATABASE_URL` | **yes** | no | `postgresql://USER:PASS@HOST:5432/DB?sslmode=require` (see F5 re: RDS CA) | You (RDS) | ⏳ |
| `STORAGE_PROVIDER` = `s3` | no | no | Select S3 storage | — | ready |
| `AWS_REGION` = `af-south-1` | no | no | S3 region (code default is also af-south-1) | — | ready (may be reserved on Vercel, F3) |
| `S3_BUCKET` | no | no | Bucket name, e.g. `inspector-staging-<suffix>` | You | ⏳ |
| AWS credentials | **yes** | no | Preferred: Vercel↔AWS OIDC role. Fallback: `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` (**needs small code change**, F3) | You | ⏳ |
| `NEXT_PUBLIC_VIDEO_ADAPTER` = `livekit` | no | **YES** | Staging default adapter (P2P stays the local/dev default) | — | set before build |
| `NEXT_PUBLIC_LIVEKIT_URL` = `wss://<project>.livekit.cloud` | no | **YES** | Client websocket URL | You (LiveKit) | ⏳ |
| `LIVEKIT_API_KEY` | **yes** | no | Server-side token minting | You (LiveKit) | ⏳ |
| `LIVEKIT_API_SECRET` | **yes** | no | Server-side token minting | You (LiveKit) | ⏳ |
| `DAILY_API_KEY` | **yes** | no | Only for Daily comparison runs | You (Daily) | optional |
| `SMS_PROVIDER` = `twilio` | no | no | Enable Twilio sending (default is console) | — | ready |
| `TWILIO_ACCOUNT_SID` | **yes** | no | Twilio account | You (Twilio) | ⏳ |
| `TWILIO_AUTH_TOKEN` | **yes** | no | Twilio auth | You (Twilio) | ⏳ |
| `TWILIO_FROM_NUMBER` | no | no | Sender number (E.164) | You (Twilio) | ⏳ |
| `NODE_ENV` | no | auto | `production` on Vercel; makes cookies `Secure`, disables `/api/dev/session` | Vercel | automatic |

**Corrections to `staging-env-vars-template.md`:** `SMS_API_KEY` is not read by the code (use the
three `TWILIO_*` vars); `LIVEKIT_URL` and `NEXT_PUBLIC_BASE_URL` are not read.

**Do not set on staging:** `/api/dev/session` is already disabled when `NODE_ENV=production`.

**Rotation:** treat every value above as rotatable; see `rollback-notes.md` for the revoke list.
