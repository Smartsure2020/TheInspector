# 10 — Technical Architecture Options

Principle: **boring technology, few moving parts, managed services** — the product risk
is in workflow/UX, not infrastructure. Every choice below favours the simplest option
that meets the requirement, with the decision driver stated.

## 10.1 Video meeting integration — the biggest decision

Requirements: browser-based both sides (no installs), mobile-web solid on iOS Safari +
Android Chrome, rear-camera + torch support, ability to **grab frames from the remote
video track programmatically**, waiting-room control, reasonable per-minute cost, POPIA-
compatible processing terms.

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Managed WebRTC platform (Daily.co, LiveKit Cloud, 100ms, Vonage Video)** | SDKs handle devices/network/TURN; frame access from tracks; prebuilt + custom UI; usage-based pricing; days not months to integrate | Per-minute cost at scale; vendor dependency; data processing likely offshore (DPA + s72 handling needed) | **Recommended.** Shortlist Daily.co and LiveKit Cloud; run a 1-week spike on iOS Safari rear-camera/torch + frame capture quality before committing. |
| Zoom/Teams/Meet embedded | Familiar brands | No proper programmatic frame capture tied to our checklist; generic-meeting UX is exactly what we're told to avoid; weak control of client join flow | Reject. |
| Self-hosted WebRTC (mediasoup/Janus/self-hosted LiveKit) | Full control, data stays in our infra, cheap at scale | TURN infra, scaling, device-quirk maintenance — a permanent engineering tax | Not for MVP. Revisit only if volume makes managed pricing material or data-residency becomes a hard requirement. |

Abstraction rule: wrap the provider behind an internal `SessionService` interface so a
later swap (incl. to self-hosted LiveKit — same SDK surface) doesn't touch workflow code.

## 10.2 Screenshot / photo capture

- **Frame capture (primary)**: assessor-side grab of the remote video track to canvas →
  JPEG → upload. Ceiling is stream quality (~720p typical) — fine for context and most
  evidence.
- **High-res photo request (secondary, important)**: assessor triggers a prompt on the
  client device; client's browser captures a full-resolution still via the camera API
  and uploads it directly. Phone cameras are 12MP+; this is how rating plates, serial
  numbers and document pages become legible. Both paths land in the same evidence
  pipeline (hash, label, checklist link).
- Follow-up uploads: plain file input on the upload-link page; preserve EXIF.

## 10.3 File storage

- **S3-compatible object storage** — this is a solved problem. Preference order:
  **AWS S3 af-south-1 (Cape Town)** for SA data residency (simplifies POPIA story),
  else Azure Blob (SA regions exist) if Acorn has an Azure estate, else Cloudflare R2
  (cheapest egress, but no SA region — weaker residency story).
- Private buckets, versioning + object-lock (write-once) on evidence originals,
  lifecycle rules to enforce retention policy, thumbnails generated at ingest.

## 10.4 PDF generation

| Option | Notes |
|--------|-------|
| **HTML/CSS template → headless Chromium (Playwright/Puppeteer) server-side** | One template skillset (web), pixel-faithful to the report-builder preview, easy branding. **Recommended.** |
| PDF libraries (pdf-lib, PDFKit) | Fiddly layout for photo-heavy multi-page reports |
| Word-template pipelines (docx → pdf) | Only worth it if Acorn insists on editing templates in Word — adds a conversion service |

Generate at approval time, store the artefact (never regenerate on demand — the
approved bytes are the record).

## 10.5 Notifications

- **Email**: transactional provider (Amazon SES / Resend / Postmark). Trivial.
- **SMS**: SA aggregator with good delivery reporting (Clickatell, BulkSMS,
  SMSPortal). Delivery receipts stored (no-show evidence).
- **WhatsApp**: highest engagement channel in SA but requires Business API via a BSP,
  template pre-approval, and cost per conversation → **Phase 4**, not MVP.
- All sends recorded in `notifications` with rendered content (doc 07).

## 10.6 Authentication

- **Staff**: managed auth (Clerk / Auth0 / Supabase Auth / NextAuth+TOTP). Requirement
  set is small (email+password, MFA, reset, deactivate) — pick whatever pairs with the
  chosen stack; do not hand-roll MFA.
- **Clients**: no accounts. Possession-based tokenized links per doc 09.4. This is a
  deliberate product decision, not a shortcut.

## 10.7 Database

- **PostgreSQL, managed** (RDS af-south-1 / Azure Database / Neon / Supabase).
  Relational fits the model (doc 07); JSONB covers template structures and report
  content. No second datastore in MVP — queues/search/cache are premature.

## 10.8 Hosting / application stack

- **Application**: a single full-stack web app. A **Next.js (React + TypeScript)**
  monolith is a natural fit: one codebase for staff UI, client mobile-web pages, and
  API routes; SSR keeps the client join page light; huge ecosystem for the video SDKs
  shortlisted. (Any equivalent — Remix, SvelteKit, Rails + Hotwire — is acceptable;
  choose for team familiarity.)
- **Hosting options**: (a) Vercel + managed Postgres + S3 — fastest path, fine for MVP
  scale; (b) containers on AWS af-south-1 (App Runner/ECS) — better residency story,
  slightly more ops; (c) a VPS — cheapest but single point of failure and manual ops.
  **Recommendation: start (a) for prototype speed, plan (b) for production if
  residency review demands it.** PDF generation runs as a background job (queue can be
  in-Postgres, e.g. pg-boss — still no extra infra).
- **Environments**: dev / staging / prod from day one; seed data + template fixtures
  for demos and training.

## 10.9 What we are deliberately NOT introducing

Microservices, Kubernetes, event buses, GraphQL, a separate mobile codebase, a
dedicated search engine, Redis, or multi-region anything. One web app, one database,
one object store, one video provider, one email/SMS provider. Complexity must be
earned by scale that doesn't exist yet.
