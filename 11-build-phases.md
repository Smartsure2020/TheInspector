# 11 — Build Phases

Each phase has a hard gate: its acceptance criteria must pass (with real users where
stated) before the next phase starts. "Not included" lists are binding — scope creep
is the main project risk.

---

## Phase 0 — Product framework (this pack) — ~2–3 weeks elapsed

**Objective:** agree exactly what is being built, for whom, and what v1 excludes.

**Activities/Features:** none built. Review of this pack; template validation
workshops with 2–3 working assessors and a surveyor; compliance review of consent/
retention approach; video-provider spike (doc 10.1); decisions in doc 12 taken.

**Deliverables:** approved version of docs 01–12; signed-off seed templates;
video-provider spike results (iOS Safari rear camera, torch, frame quality); named
pilot assessors; decided answers to doc 12 decision list.

**Acceptance criteria:** every open decision in doc 12 marked decided or explicitly
deferred with owner; at least two assessors have walked the geyser template against a
real historical claim file and signed it off.

**Not included:** any code beyond the video spike; visual design; naming/branding
finalisation (parallel track).

---

## Phase 1 — UX prototype — ~3–4 weeks

**Objective:** validate the live-assessment-room interaction and client join flow
before committing to build.

**Features (prototype-fidelity only):** clickable prototype (Figma or throwaway code)
of: client join → consent → device test → waiting room; live room (assessor layout
with checklist + capture loop, client mobile layout); evidence review; report preview.
A thin **live technical prototype** of the capture loop on the chosen video provider
(real video, real frame grab, fake persistence) — this is the one thing a Figma click-
through cannot validate.

**Deliverables:** prototype; recorded usability sessions — ≥3 assessors run a
role-played geyser assessment against a colleague on a phone; ≥3 non-technical
"clients" (real people, not staff) get through join→consent→test unaided; revised
S9b interaction spec.

**Acceptance criteria:** assessors complete the mock assessment without facilitator
help and rate the capture loop usable; test clients reach the waiting room unaided in
< 3 minutes from SMS; capture-to-thumbnail works on the live prototype on 4G.

**Not included:** persistence, auth, dashboards, reports, notifications — anything
beyond the flows named above.

---

## Phase 2 — MVP build — ~10–14 weeks

**Objective:** one real assessment end to end on production infrastructure.

**Features:** the full MVP list (doc 03.1): auth/roles, job creation, assignment,
scheduling, client links, consent, device test, live room with guided checklist +
labelled capture + notes + red flags, missing-evidence flags + follow-up upload link,
no-show handling, evidence gallery, report builder, manager review
(approve/return), PDF + evidence pack, audit trail, basic dashboards. Seed templates
loaded (geyser + general + one survey minimum at launch; rest by end of Phase 3).

**Deliverables:** production environment; pilot with 2–3 assessors running **real
claims in shadow mode** (virtual assessment alongside the existing process, outputs
compared); operations runbook; assessor quick-start training (30 min).

**Acceptance criteria:** ≥10 real assessments completed end to end in pilot; ≥8 of 10
produce a manager-approved report without engineering intervention; a manager can
trace any evidence item to its checklist item, session, consent and hash; no-show and
missing-evidence workflows each exercised at least once in reality; security review
passed (links expire, roles enforced, audit append-only, storage private).

**Not included:** everything in doc 03.2; template editing UI; automated reminders
(manual resend is fine); WhatsApp; charts.

---

## Phase 3 — Templates & reporting maturity — ~4–6 weeks

**Objective:** full template coverage and reports good enough to send to insurers
without manual rework.

**Features:** all six claim templates + both survey templates live and field-tested;
template refinements from pilot feedback (a lightweight admin template editor ONLY if
churn during pilot proves the need — JSON config remains the default); report layout
polish (branding, photo layout, recommendations register table); PDF watermarking;
survey report variant completed; report boilerplate library (standard limitation/
disclaimer paragraphs).

**Deliverables:** template pack v2 signed off by assessors AND a claims-side reviewer
(the report consumer); before/after report samples; updated training material.

**Acceptance criteria:** each template used on ≥3 real jobs with post-job assessor
review; reports accepted by receiving claims handlers without reformatting; missing-
evidence rate per template measured and trending down.

**Not included:** analytics beyond the per-template counts above; integrations;
client-facing changes.

---

## Phase 4 — Notifications & operational dashboards — ~4–6 weeks

**Objective:** the platform runs the pipeline proactively instead of relying on
admins' memories.

**Features:** automated reminders (24h/1h before appointment, client + assessor);
missing-evidence chase cadence with auto-escalation to admin; SLA/ageing alerts
(unscheduled > X days, review queue > Y days); WhatsApp channel via BSP (if approved —
biggest engagement win in SA); manager dashboards with real numbers (cycle times,
no-show rate, first-time-approval rate, missing-evidence rate by template/assessor);
CSV export.

**Deliverables:** notification matrix (event × recipient × channel) documented;
dashboard suite; alerting runbook.

**Acceptance criteria:** zero missed reminders over a 2-week observation window;
no-show rate measurably reduced vs pilot baseline; managers answer "where is every
job and what's stuck" from the dashboard alone.

**Not included:** BI tooling/warehouse; predictive anything; client portal.

---

## Phase 5 — Future enhancements (backlog, prioritise after Phase 4 data)

Candidates, deliberately unscheduled:
- **Optional session video recording** (per-job opt-in, consent v2, retention costs) —
  decide with real dispute experience in hand.
- **Assessor mobile app / PWA hardening** — offline notes, push notifications.
- **AI assistance** — auto-labelling suggestions, photo-quality warnings ("plate not
  legible — retake"), report narrative drafting from checklist data, transcription.
  Only after the evidence pipeline is trusted; AI output always assessor-reviewed.
- **Integrations** — inbound job creation API, outbound report delivery API/webhooks
  (design the internal API cleanly in Phase 2 so this is additive). Any connection to
  other Acorn systems happens here at the earliest, and only on explicit instruction.
- **Client self-scheduling** (pick-a-slot links) and multi-language client UI.
- **Recommendations compliance tracking** for surveys (re-survey cycle, requirement
  status chasing).
- **Panel/external assessor onboarding** — self-serve accounts, per-firm scoping,
  possibly white-labelling for broker partners (commercial decision).
- **Drone/guided-photo hybrid jobs** — mixed physical+virtual evidence files.
