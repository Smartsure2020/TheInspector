# Management demo script — tomorrow morning (2026-07-07)

**Prep (10 min before):** stop server → `npm run reset:demo` → `npm run dev` →
open `http://localhost:3000` → optionally `npm run qa:smoke` (22/22 PASS).
Have a **second browser window** ready for the client-link views. Full
mechanics in [03-HOW-TO-RUN-AND-DEMO.md](03-HOW-TO-RUN-AND-DEMO.md).

**Do NOT lead with geyser.** The book is positioned multi-peril + surveys;
geyser appears only as a supporting example (step 6).

---

## Opening explanation (2 minutes, before touching the screen)

> "What you're about to see is a working prototype of The Inspector — that's a
> codename, not a product name. It's a virtual assessment and risk-survey
> platform: instead of driving to a property, the assessor sends the client a
> link. The client needs nothing but their phone — no app, no account. The
> assessor runs a guided, peril-specific checklist over live video, captures
> labelled evidence as they go, and the system writes the first draft of the
> report itself. A manager then reviews and approves it, and we can hand an
> insurer a complete evidence pack.
>
> Two things to keep in mind. First: this is not a video-calling tool — the
> video is just transport. The product is the structured, auditable evidence
> workflow. Second: everything you'll see is running on fake, role-played
> data. There is deliberately no login, no real client information, and no
> security hardening yet — those are planned, gated steps, not oversights.
> The checklists themselves are draft content pending sign-off by our own
> assessors — that workshop is the next step after today."

---

## Demo sequence

### 1. Storm assessment — the headline flow (~10 min)

**Click:** `/` → point out the three roles and demo links → enter as
**Lerato Demo (Admin)** → open the pipeline → open **INS-2026-0003 (Storm)**.

**Say:** "Here's a scheduled storm claim. Template, schedule, the client link
with a ready-to-paste SMS, and a full timeline of everything that's happened."

**Click:** second window → `/c/demo-storm`. Show the "you're a little early"
state and the storm prep list — point at **"do NOT climb on the roof or a
ladder"**. Walk consent → camera check → waiting room. Back in window one,
switch to **Sipho Demo (Assessor)** and show the readiness dots lighting up.

**They should notice:** the client did all of that from one link, unaided;
consent was logged; staff saw readiness in real time.

Then the live room: open **INS-2026-0005 (Power Surge) → Room** as Sipho
(with `/c/demo-live` in the second window for real video). Tap a checklist
item → instruction banner appears on the client side → capture a frame →
it lands tagged to that item. Show HI-RES on the serial-plate item, the
guidance chips, "Can't capture now…", and End session with outcome choice.

**They should notice:** the checklist drives the session — the assessor can't
forget anything, and every capture is labelled evidence, not loose photos.

### 2. Residential survey — same engine, different product (~5 min)

**Click:** open **SRV-2026-0013** → Report builder (as Anje).

**Say:** "Same engine, but this is a risk survey, not a claim. Look at the
report: risk description, COPE findings, a recommendations register split
into Requirements versus Improvements with timelines, and an A-to-E risk
grade. And notice there's no cause-of-loss section — it knows it's a survey."

**Click:** open **SRV-2026-0016**'s submitted report.

**They should notice:** the auto limitation — "**NOT adequately surveyable
virtually — a physical survey is recommended**". The system is honest about
its own limits; it recommends a physical visit rather than pretending.

### 3. General non-motor breadth — power surge / glass (~4 min)

**Click:** `/jobs/new` as Lerato. Open the template dropdown.

**Say:** "This is the governed catalogue: storm, theft, power surge, burst
pipe, geyser, accidental, general non-motor, and the surveys — each with its
own checklist and evidence requirements. Fire is greyed out on purpose: fire
is physical-first, always — and the server enforces that too. The commercial
survey is flagged as limited-depth for now."

**Click:** show a General Non-Motor report (peril = Glass) or the Power Surge
report (j8) — the summary and cause wording adapt to the selected peril.

**They should notice:** breadth without a free-for-all — governed templates,
policy enforced in UI and server.

### 4. Accidental damage — the everyday case (~3 min)

**Click:** open an accidental job (or `/c/demo-acc` briefly for the
client-side prep wording).

**Say:** "Accidental damage is the highest-volume everyday claim; this
template's content came out of the Phase 0 review with our assessors, so it's
the most mature checklist alongside geyser."

### 5. Evidence pack and manager review — the trust story (~6 min)

**Click:** open **INS-2026-0007 (Storm)** report builder as Anje. Show the
prefilled narrative (weather corroboration, maintenance separation with the
concern flag), featured figures, the **non-removable Limitations** section and
evidence index. Submit. Switch to **Craig Demo (Manager)**: return it with a
comment → back as Anje, show the comment banner, edit, resubmit (v2) → as
Craig, **Approve — lock & complete**. Show the locked job (read-only builder,
locked gallery). Then on any completed job, click **Evidence pack (.zip)** and
open it: files named by section/item, `index.csv`, README.

**They should notice:** the report wrote itself from session data; limitations
can't be quietly deleted; four-eyes review with version history and a hard
lock; and a ready-to-send insurer artefact at the end.

### 6. Geyser — supporting example only (~2 min)

**Click:** **INS-2026-0006** → second window `/c/demo-upload/upload` → upload
a photo/PDF → the flagged item resolves live and appears in the gallery.

**Say:** "Geyser was our Phase 0 starting point — here it shows the
missing-evidence loop: if a document is missing after the session, the client
gets a simple upload page and the claim doesn't stall."

---

## Limitations to state honestly (say these unprompted)

- All templates beyond geyser/accidental are **v0.1 draft content pending our
  assessors' sign-off** — the workshop is the very next step.
- **No video provider has been selected yet** — deliberate. The room runs on a
  free, provider-independent WebRTC layer behind a swap-in interface. Some
  strict corporate networks won't connect until we add a relay or pick a
  provider.
- **Phones haven't been verified in the live room yet** — a laptop-policy
  HTTPS constraint, deferred not cancelled; desktop-to-desktop is verified.
- Prototype internals: local database and file storage, print-to-PDF, no
  login. All flagged for the hardening phase — nothing here touches real
  client data, and it can't until safeguards are approved.

## Decisions we need from management

1. **Green-light the assessor workshop** to validate/sign off the templates
   (the templates are the product).
2. **Video provider direction** — approve a small evaluation (LiveKit
   free-tier or similar) and/or a TURN relay so we can verify phones and
   hostile networks. Daily.co is excluded on cost.
3. **Naming** — "The Inspector" is codename-only; a client-facing name and
   legal check are needed before anything client-visible (D-01).
4. **Pilot intent** — confirm the shadow-mode pilot concept (≥10 claims,
   virtual alongside the existing process) so we can plan the live-data
   safeguard gate and Postgres migration behind it (D-09/D-10).
5. **Budget/priority** for the production-hardening phase (auth, POPIA,
   storage, deployment) once the pilot plan is confirmed.

## Closing statement

> "So: one working engine, eight claim perils and two survey types, a client
> journey that needs nothing but a link, reports that draft themselves, a
> four-eyes review with a hard lock, and an insurer-ready evidence pack — all
> on honest, fake data. What we need from this room is the go-ahead for the
> assessor workshop, a direction on the video provider, and confirmation of
> the shadow-mode pilot. With those three, the next phase is validation with
> real assessors — still zero exposure of real client data until the
> safeguards you approve are in place."
