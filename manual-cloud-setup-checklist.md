# Manual cloud setup checklist — staging (fake data only)

None of this can be done from the current environment (no AWS/Twilio/LiveKit access; I may not
create accounts or handle credentials). Do each step yourself, tick it, and tell me when done.
**Cost approval is needed before steps marked 💲.** Never paste secrets into chat or git.

## A. Approvals (decide first)

- [ ] 💲 Vercel plan for company staging (Hobby is non-commercial; Pro is per-seat). Or choose another host.
- [ ] 💲 AWS spend for a small RDS Postgres instance + S3 in af-south-1.
- [ ] 💲/free LiveKit Cloud project (free tier exists; confirm limits), Twilio account (trial is free but restricted).
- [ ] Accept for **staging only**: RDS with a public endpoint (Vercel has no fixed IPs) — TLS required, strong random password, fake data. Not acceptable for production (F4).

## B. AWS (region **af-south-1, Cape Town**)

- [ ] Enable the region: af-south-1 is an **opt-in** region (Billing/Account → AWS Regions → Enable). Takes minutes.
- [ ] 💲 RDS PostgreSQL (v16), small burstable instance, single-AZ for staging, storage encrypted, automated backups ≥ 7 days, deletion protection on.
  - [ ] Database `inspector_staging`; app user with a long random password.
  - [ ] Public access: yes (staging only), security group inbound 5432 limited as tightly as practical, TLS enforced (`rds.force_ssl=1`).
  - [ ] Note the endpoint; build `DATABASE_URL` yourself and store it in Vercel only.
- [ ] S3 bucket `inspector-staging-<suffix>` in af-south-1:
  - [ ] Block **all** public access; default encryption on (SSE-S3 or KMS); versioning on.
  - [ ] No CORS needed (access is server-mediated; downloads are 15-min presigned redirects).
  - [ ] Lifecycle rule to expire staging objects after e.g. 30 days.
- [ ] Access for the app (preferred first):
  - [ ] **Option 1:** IAM role trusted by Vercel OIDC, least privilege (below).
  - [ ] **Option 2:** IAM user with an access key limited to the policy below; store as `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` in Vercel (needs the small code change, F3).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::inspector-staging-<suffix>/*" },
    { "Effect": "Allow", "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::inspector-staging-<suffix>" }
  ]
}
```

## C. LiveKit Cloud (staging default only — not a final provider decision)

- [ ] Create a project; note region/routing options (record whether any African/South African region exists — POPIA question F13).
- [ ] Copy URL (`wss://…livekit.cloud`), API key, API secret → Vercel env vars (`NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`).
- [ ] Optional: Daily.co key for comparison runs (`DAILY_API_KEY`).

## D. Twilio (staging SMS)

- [ ] Create account. Trial accounts only message **verified** numbers: verify staff test phones.
- [ ] Enable geographic permission for South Africa (+27).
- [ ] Get a sender number (or messaging service) that can reach +27 numbers; note any SA sender restrictions.
- [ ] Set `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in Vercel.
- [ ] Do **not** use Twilio "test credentials" for end-to-end OTP: they never deliver a message.

## E. Vercel

- [ ] Create/link project from `Smartsure2020/TheInspector`, **root directory `prototype`**, framework Next.js.
- [ ] Function region: `cpt1` (Cape Town) if available on the chosen plan.
- [ ] Deployment Protection ON (Vercel Authentication) — the staging URL must not be public. Create a protection-bypass token only if phone tests need it.
- [ ] Add env vars from `required-secrets-and-env-vars.md` (mark secrets Sensitive; set `NEXT_PUBLIC_*` **before** the first build).
- [ ] HTTPS: automatic on `*.vercel.app`; no custom domain needed for staging.

## F. Hand back to me

When A–E are ticked, tell me: the Vercel project name, that env vars are set (not their values),
and that RDS/S3 exist. I will then (with your OK) apply F1/F3/F5/F2 fixes, deploy, and run the
staging checks.
