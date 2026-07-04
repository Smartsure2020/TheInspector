# 10 — Phase 1 Risks & Constraints

| # | Risk | Why it matters in Phase 1 | Mitigation |
|---|------|---------------------------|-----------|
| P1-R1 | **WebRTC complexity** — device permutations, TURN/firewall traversal, echo/quality issues | The room is 60% of Phase 1 effort; naive WebRTC work can eat the schedule | Managed provider only (no raw WebRTC); spike before build (doc 07); `SessionService` abstraction; 1D limited to skeleton before features pile on |
| P1-R2 | **iOS Safari limitations** — camera permission quirks, background-tab suspensions, getUserMedia edge cases, screen-lock during calls | iPhone + Safari is a top client path and the least forgiving | Spike SP1/SP3/SP6 are disqualifiers; keep-awake handling in client UI; test on a real iPhone every chunk from 1C onward, not just at 1J |
| P1-R3 | **Torch support inconsistency** — iOS Safari torch control is unreliable/absent; Android varies by device | Geyser cupboards and roof cavities are dark; the template assumes light | Designed fallback (doc 04 §4.10): torch button hides when unsupported, assessor prompt degrades to "ask for more light"; high-res photo with device flash as alternative; note in assessor training |
| P1-R4 | **Poor client signal** — 4G dead spots exactly where geysers live (roof cavities, cupboards) | Mid-session quality drops will happen in every pilot | Reconnect design (doc 04 §4.11); optimistic local thumbnails so captures don't depend on instant upload; audio-first degradation; missing-item flag + upload link as the universal fallback; test on throttled profile throughout |
| P1-R5 | **Assessor adoption** — if the tool is slower than WhatsApp+Word, it dies regardless of features | The whole thesis | Capture-loop speed as a stop-the-line criterion (AC3); assessors in usability from 1E, not just 1J; W7 behaviour question answered with observation, not opinion; fix list triaged by "does this slow the assessor down?" first |
| P1-R6 | **Report usefulness** — a technically generated report that claims handlers won't accept | Phase 1 produces the first artefacts real consumers judge | Structure locked to the workshop-validated phase0 doc 09; a claims-side reviewer sign-off inside AC7; zero-retyping rule keeps content = session truth |
| P1-R7 | **Scope creep** — login "just quickly", surveys, storm template, dashboards, WhatsApp | Every past correction has been about this | Binding constraint list in doc 00; AC9 makes absence of security scope an acceptance criterion; Tier B impulse log gives creep a place to go that isn't the codebase |
| P1-R8 | **Real-client data leakage into the prototype** — someone pilots on a live claim early | Prohibited until the live-data safeguard gate (phase0 D-09) is approved; a breach would poison trust in the whole project | Role-play + anonymised historical data only; PROTOTYPE banner on every screen; seed client records obviously fake (names like "Test Insured 03"); 1J test protocol states it explicitly; safeguard gate remains a management decision outside Phase 1 |

## Standing constraints (restated once, apply to every chunk)

1. No production authentication, MFA, permissions, POPIA/storage/audit hardening,
   retention rules, or operator agreements — placeholder roles and mock access only.
2. No surveys; no fire claims; geyser/water + accidental damage only.
3. No AI, integrations, full video recording, template-builder UI, WhatsApp Business,
   or advanced dashboards.
4. "The Inspector" is a codename — never rendered as client-facing product branding
   (client pages show Acorn placeholder branding).
5. Acorn only; standalone; no references to or integration with any other Acorn
   system.
6. Nothing may be built in a way that makes production hardening harder
   (doc 05 compatibility rules).

## Escalation rule

If any risk materialises in a way that threatens AC1–AC3 (the thesis criteria), stop
feature work, fix the loop/room, and only then continue. Schedule slips are
acceptable in Phase 1; a slow capture loop is not.
