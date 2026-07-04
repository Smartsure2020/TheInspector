# 09 — Phase 1 Acceptance Criteria

Phase 1 passes only when **all** of the following are demonstrated and evidenced
(timings recorded, sessions observed, artefacts saved). These mirror phase0
doc 10 D-10 and the exit expectations, adapted to the two selected claim types.

| # | Criterion | How it is measured |
|---|-----------|--------------------|
| AC1 | **Three assessors each complete a role-played geyser/water assessment without facilitator help** | Observed sessions (chunk 1J): 15-min intro allowed, then zero facilitator interventions from job-open to report-submit. Colleague plays the insured on a real phone |
| AC2 | **Three assessors each complete a role-played accidental-damage assessment without facilitator help** | Same protocol; accidental session target ≤20 minutes end to end |
| AC3 | **Capture loop feels instant and stays under 3 seconds** | Instrumented: capture-to-thumbnail <1 s (Wi-Fi) / <1.5 s (4G profile); perceived loop (select item → thumbnail confirmed) <3 s; assessors asked directly "did capture ever make you pause the conversation?" — must be No ×3 |
| AC4 | **Client can join from a phone unaided** | 3 cold testers (non-technical, not staff): SMS-style link → waiting room, unaided, <3 minutes, on iOS Safari and Android Chrome between them |
| AC5 | **High-res photo request produces a legible rating plate / serial number photo** | In role-played sessions: geyser plate from ~1.5 m and an appliance serial sticker — text readable at 100% zoom in the gallery, on both test phones |
| AC6 | **Missing evidence upload works** | At least one role-play flags ≥2 items missing → upload link → client uploads from phone → items land tagged correctly → job transitions Awaiting evidence → Awaiting report |
| AC7 | **PDF report and evidence pack are generated** | One-click generation per doc 06; Limitations auto-lists all skipped/missing/triggered items; fig numbers consistent across report, CSV, appendix; one claims-side reviewer confirms "would accept into a file" for one sample of each claim type |
| AC8 | **Manager can approve or return the report** | Full cycle demonstrated: submit → return with comments → revise → resubmit → approve → locked version + final artefacts downloadable |
| AC9 | **No production login/security scope has been added** | Code/scope review: role picker only; no auth libraries, MFA, permission engine, hashing chain, or retention logic present; Tier B impulse log exists instead |

## Additional gates (from the flows, not negotiable even though unnumbered)

- No-show/reschedule (F6) and cancel (F7) each exercised once during 1J without error.
- Client-view visibility audit passed: from a client device, no route/response exposes
  checklist contents, notes, concern flags, or internal screens.
- Drop/reconnect: client network killed and restored mid-role-play with zero data loss.
- W7 answered: observed capture behaviour (checklist-first vs tray-first) written up
  with a recommendation for Phase 2.

## Failure handling

Any AC failing → fix and re-run **that** test; AC1–AC3 failures stop the phase (they
are the product thesis). The phase does not pass on "close enough" for AC3 — if the
loop is slow, the tool loses to WhatsApp and nothing else matters.

## Evidence bundle for sign-off

`phase1/acceptance-evidence/` folder: timing logs, observer notes per session, tester
join recordings/notes, sample reports + packs (one per claim type), the reviewer's
acceptance note, and the scope-review statement for AC9.
