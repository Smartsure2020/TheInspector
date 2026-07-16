# Post-workshop template update plan (Phase C)

**Purpose:** How to turn workshop feedback into code changes safely. This plan
applies AFTER the workshop has run and feedback has been collected. Do NOT start
this until workshop feedback exists.

**Gate dependency:** G3 (Workshop must have run; feedback must be transcribed)
**Input:** Completed review workbooks + decision capture sheet from the workshop
**Output:** Updated templates, bumped versions, clean verification, updated docs

---

## Hard prerequisite

- [ ] Workshop has been run (date: _07/07/2026___)
- [ ] Review workbooks collected and photographed/scanned
- [ ] Feedback transcribed into a single document
- [ ] Decision capture sheet filled (D-06, D-07, D-08 recorded)
- [ ] Facilitator has confirmed: this is the COMPLETE feedback set

**If any box is unchecked, STOP. Phase C cannot start.**

---

## Step 1: Triage feedback (no code yet)

Classify every piece of feedback into one of four categories:

| Category | Action | Example |
|----------|--------|---------|
| **Correction** | Change existing item wording, order, or flags | "Rating plate prompt should say 'nameplate' not 'rating plate'" |
| **Addition** | Add a missing checklist item to an existing template | "Need to ask about geyser blanket/insulation" |
| **Removal** | Remove an item that doesn't belong | "Municipal confirmation not available for power surge — remove" |
| **Out of scope** | New peril, new feature, new template — goes to decision register | "We need a motor template" |

Rules:
- **Corrections, additions, and removals** proceed in this phase
- **Out of scope items** get recorded in `phase0/10-decision-register.md` as new decisions and are NOT built
- **If in doubt**, it's out of scope — park it

---

## Step 2: Plan the changes (still no code)

For each in-scope change, document:

| # | Template | Change type | Description | Approved by (workshop) |
|---|----------|-------------|-------------|----------------------|
| 1 | | Correction / Addition / Removal | | |
| 2 | | | | |
| ... | | | | |

Review this list with the template owner (D-07) or overall custodian before proceeding.

---

## Step 3: Make the changes

All template changes happen in ONE file: `prototype/src/lib/templates.ts`

For each template changed:
1. Edit the template content in `templates.ts`
2. **Bump the version string** (e.g., `v0.1-1F` → `v0.2-workshop`)
3. If report wording is affected, also edit `prototype/src/lib/report.ts`
4. Do NOT change any other files unless a bug is discovered

### Version convention

| Before | After |
|--------|-------|
| `v0.1-1F` | `v0.2-workshop` |
| `v0.2` (Phase 0 reviewed) | `v0.3-workshop` |
| `v0.1-1F-limited` | `v0.2-workshop-limited` |

---

## Step 4: Verify

Run the full verification loop:

```bash
cd prototype
npm run reset:demo      # Wipe and reseed with updated templates
npm run dev             # Start dev server
npm run qa:smoke        # 22/22 PASS required
npx tsc --noEmit        # Clean required
npm run build           # Clean required
```

Then manually check:
- [ ] Each changed template renders correctly in `/jobs/new` (template picker)
- [ ] Demo jobs using changed templates still work (check the demo path in `00-workshop-agenda.md`)
- [ ] Report builder for affected templates shows correct sections
- [ ] Evidence pack download still works (`/api/pack/j7`)

---

## Step 5: Commit

One commit per logical group (or one commit for all if changes are small).

Commit message format:
```
fix(templates): apply workshop feedback — [template name] v0.X-workshop

Changes approved by [approver name] at workshop [date].
[Brief list of what changed]
```

---

## Step 6: Update documentation

- [ ] Update `phase1/known-limitations.md` if any limitation was addressed
- [ ] Update `handover/01-PROJECT-SNAPSHOT.md` with new template versions
- [ ] Record in `phase0/10-decision-register.md`:
  - D-06 outcome (if quantum question was answered)
  - D-07 outcome (template owners)
  - D-08 outcome (pilot volunteers)
- [ ] File workshop evidence (scans, photos) in `phase1/workshop/evidence/`

---

## What NOT to do during Phase C

- Do NOT add new templates or perils (decision register, not code)
- Do NOT build a template-builder UI (regardless of feedback)
- Do NOT change the room, capture loop, or report engine (those are separate phases)
- Do NOT add auth, security, or any production hardening
- Do NOT use real client data to test the changes
- Do NOT change template structure (sections/items schema) without updating `schema.ts` and verifying the full suite
