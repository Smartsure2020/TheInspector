# Next steps roadmap — The Inspector

Practical sequence from the demo-ready prototype (2026-07-06) onward. Phases
are ordered; later phases must not be started early "because we had time".
Each phase lists what NOT to build — treat those as binding.

Related: gates in [06-DEFERRED-GATES.md](06-DEFERRED-GATES.md), guardrails in
[08-SCOPE-GUARDRAILS.md](08-SCOPE-GUARDRAILS.md).

---

## Phase A — Immediate: management demo (2026-07-07)

**Objective:** show the working prototype, state limitations honestly, and get
three decisions: assessor workshop go-ahead, video-provider direction, pilot
intent.

**Tasks:** reset demo data; run smoke suite; run the demo per file 04; record
management's decisions in `phase0/10-decision-register.md` (fill the
Decision/Owner columns).

**Acceptance criteria:** demo completed; decisions (or explicit deferrals)
recorded in the decision register.

**Risks:** live-room demo needs two windows — rehearse the mock-start
fallback; questions about security should be answered "gated, planned, not
built" — don't promise dates.

**Do NOT build yet:** anything. This phase is zero code.

---

## Phase B — Assessor walkthrough & template validation

**Objective:** validate that the v0.1-1F templates match how real assessors
work; get sign-off or concrete corrections (the templates ARE the product).

**Tasks:** run the workshop per `phase0/03-assessor-workshop-guide.md` with
the claims/survey review sheets (`phase0/04…`/`05…`); walk the UX per
`phase0/06-assessor-ux-walkthrough.md`; capture per-template feedback; assign
template owners (decision D-07); record W1–W7 workshop outcomes.

**Acceptance criteria:** every active template has a named reviewer and a
verdict (signed off / changes listed); geyser+accidental v0.2 content
reconfirmed; fire physical-first policy reconfirmed.

**Risks:** assessor availability; feedback that expands templates into new
perils (park it — additions are a scope decision).

**Do NOT build yet:** template changes during the workshop. Collect first,
change after (Phase C). No template-builder UI regardless of feedback.

---

## Phase C — Fix feedback

**Objective:** apply workshop corrections and any demo feedback to templates,
report wording and small UX items.

**Tasks:** edit `prototype/src/lib/templates.ts` / `report.ts` per signed-off
feedback; bump template version strings (e.g. v0.2-workshop); reset + reseed;
run `qa:smoke` + the manual regression checklist; update `phase1/known-limitations.md`
and this handover pack where behaviour changed.

**Acceptance criteria:** all agreed changes applied and versioned; 22/22
smoke PASS; regression checklist PASS; build + tsc clean; docs updated.

**Risks:** scope creep disguised as "feedback" — anything that is a new
feature (recording, integrations, new peril, builder) goes to the decision
register, not the codebase.

**Do NOT build yet:** new features, new perils without an explicit decision,
provider code, auth.

---

## Phase D — Mobile live-room verification

**Objective:** verify the client journey and live room on real phones
(currently desktop↔desktop only — limitation L1).

**Tasks:** get HTTPS in front of the dev server per
`phase1/spike-manual-test-guide.md` (Cloudflare quick tunnel or preview
deployment — local certs are blocked by laptop policy); re-run device spike
SP1–SP10 on at least two phones (Android + iPhone); test cold client join →
waiting room → session → capture; document results in `phase1/`.

**Acceptance criteria:** cold phone join unaided; two-way AV
assessor(desktop)↔client(phone); capture loop works with phone camera
(incl. rear camera switch); results written up with device/OS/browser matrix.

**Risks:** P2P without TURN may fail on mobile carriers (CGNAT) — that
finding feeds Phase E rather than blocking here; tunnel URLs are ephemeral.

**Do NOT build yet:** provider adapters. If P2P fails on phones, record it as
evidence for the provider decision — don't quick-fix with a paid service.

---

## Phase E — Video provider / TURN decision

**Objective:** close limitation L2/L3 with an informed decision: managed
provider (LiveKit-class), self-hosted SFU/TURN, or P2P+TURN.

**Tasks:** paper comparison (cost, POPIA/data residency, recording posture,
free-tier testability); if LiveKit free tier is testable without paid
commitment, implement `livekit-adapter` per the stub's documented mapping —
**one adapter file, zero room changes**; verify on the Phase D device matrix;
present recommendation to management.

**Acceptance criteria:** decision recorded in the decision register; whatever
is chosen runs behind `SessionAdapter` with the room components untouched;
hostile-NAT case verified or explicitly accepted.

**Risks:** provider lock-in creeping outside the adapter; cost surprises.
Daily.co stays excluded (paid) unless management overrides.

**Do NOT build yet:** recording, provider-specific features (transcription,
composition), any provider secrets committed to the repo (`.env.local` only).

---

## Phase F — Minimum live-data safeguard gate (D-09)

**Objective:** define and get approved the minimum safeguards required before
ANY real-client data touches the system in shadow mode.

**Tasks:** draft the safeguard set (candidate list: real auth for staff,
tokenised+expiring client links, Postgres + object storage with backups,
encryption at rest, access logging, retention/deletion rule, consent wording
review, incident contact); review against `09-security-compliance.md`; get
explicit management/compliance approval; record in the decision register.

**Acceptance criteria:** a written, approved safeguard checklist exists; each
item mapped to a build task; nobody can claim ambiguity about what "minimum"
means.

**Risks:** under-scoping (POPIA exposure) or over-scoping (accidentally
pulling all of production hardening forward). This gate is the *minimum* for
shadow mode, not the full hardening list.

**Do NOT build yet:** the safeguards themselves — this phase is definition
and approval. No real data regardless of progress here.

---

## Phase G — Shadow-mode pilot

**Objective:** run ≥10 real claims **in shadow mode** (virtual assessment
alongside the existing physical process; outputs compared) per D-09/D-10.

**Tasks (after Phase F approval only):** implement the approved safeguard
checklist, including the **Postgres + object storage migration** (schema is
already portable); deploy to a controlled environment; onboard 2–3 volunteer
assessors (D-08); run the pilot; compare virtual vs physical outcomes; measure
D-10 success criteria (≥8/10 completed unaided, ≥8/10 reports accepted with
≤1 correction round, capture <3s, client join unaided ≥80%).

**Acceptance criteria:** D-10 metrics measured and reported; go/no-go
recommendation for production hardening.

**Risks:** pilot fatigue (volunteers over conscripts); comparing against the
physical report honestly; scope temptation mid-pilot ("can we just add…" — no).

**Do NOT build yet:** anything client-facing beyond the approved safeguards;
integrations; AI; WhatsApp; recording.

---

## Phase H — Production hardening

**Objective:** turn the validated prototype into a production system.

**Tasks (the parked Tier B list):** production auth/MFA/role permissions;
POPIA finalisation (consent lifecycle, retention, subject-access);
secure storage with signed URLs and download controls; enforced append-only
audit (hashing/integrity chain in evidence + event log); server-generated PDF
(letterhead, pagination, signature block); real deployment with backups and
monitoring; operator agreements; client-facing name (D-01 legal check);
template ownership/versioning governance in-product.

**Acceptance criteria:** security review passed; POPIA sign-off; the
`09-security-compliance.md` requirements implemented or explicitly waived in
writing.

**Risks:** biggest phase by effort — needs its own plan (see the planning
prompt in file 07). Don't let hardening start before pilot evidence justifies
it.

**Do NOT build yet (even here):** AI features, integrations with other Acorn
systems, WhatsApp — each remains its own decision.

---

## Phase I — Expansion

**Objective:** grow beyond the validated core, each item as its own decision.

**Candidates (unordered, all require decisions):** full commercial survey
depth (L7); more perils; recording (D-04 revisit); WhatsApp/notification
channels; integrations with insurer systems; template management UI (governed,
not a free builder); AI assistance (capture QA, draft narrative) — last, and
only with clear guardrails.

**Acceptance criteria:** per item, its own scope doc + decision-register
entry before code.

**Do NOT build:** anything in this list opportunistically during earlier
phases.
