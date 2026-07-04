# 09 — Prototype Report Output Validation

Simplified structures for the **workflow prototype**. The full production report
specification remains in blueprint doc 08 — this is the cut-down version the prototype
must generate well, used in the workshop (Part 4) to test credibility with assessors
and report consumers.

> **Survey report: optional/deferred** with the survey workflow itself (D-03). If
> surveys enter the prototype, lift the survey structure from blueprint doc 08.2
> unchanged.

## 9.1 Prototype claims assessment report (target: 5–8 pages)

**1. Cover page**
Acorn placeholder branding · "Virtual Assessment Report — PROTOTYPE" watermark until
production · claim number · insured name · risk address · date of loss · date of
assessment · assessor name.

**2. Summary (max half page)**
Peril · what was assessed and how (virtual, date, participants) · key finding ·
recommendation. Written so a claims handler who reads nothing else can act.

**3. Claim particulars**
Claim/policy references, claim type, date of loss, loss description as instructed.

**4. Circumstances of loss**
The insured's account as given in session (from checklist answers + notes).

**5. Assessment findings** — the body
Per checklist section: structured answers, assessor observations, and embedded
featured photos with captions (`Fig 3 — Geyser rating plate, high-res client capture,
14:22`). Items carrying a concern flag appear here as factual observations (the
internal flag status itself is not printed in the prototype report — decide for
production, D-06 note).

**6. Cause of loss**
Explicit finding + evidence basis + confidence qualifier ("based on the rating plate
observed (Fig 3) and the burst seam shown (Fig 5)…").

**7. Limitations & outstanding items** *(auto-generated, non-removable)*
Every skipped/missing checklist item with reason · virtual-method limitation
statement · any physical-assessment triggers fired (from doc 08) and the resulting
recommendation.

**8. Conclusion & recommendation**
Settle-consideration / further investigation / physical inspection / specialist
referral — with reasons. Quantum figures included **only if** D-06 decides so.

**9. Evidence index**
Table: Fig no. · label · checklist item · source (frame capture / high-res client
capture / client upload) · date-time. *(Hashes and integrity chain: production
hardening — column reserved, empty in prototype.)*

**10. Sign-off block**
Assessor declaration + name/date · "Reviewed by" line for the Manager–Reviewer
placeholder role · report version number.

### Workshop validation questions (attach answers to this doc)
- Would you sign it? What's missing first? ______________________________________
- Would the receiving claims handler accept it without reformatting? ☐ Yes ☐ No — what bounces: ______________________________________
- Section order right? Anything to merge/split? _________________________________
- Photos in findings vs all-in-appendix — preference? ___________________________

## 9.2 Prototype evidence pack

Kept deliberately simple:

- **ZIP archive** containing:
  - Full-resolution images named `fig{n}_{section}_{item}_{yyyymmdd-hhmm}.jpg`
  - `index.csv`: fig no., label, checklist item, source, captured-at
- **Evidence appendix PDF** (for recipients who won't open a ZIP): index table page,
  then one page per evidence item — image large, caption block beneath (label,
  checklist item, source, date-time).

Deferred to production hardening (blueprint docs 08.3, 09.3): SHA-256 integrity
chain, manifest with pack hash, consent record summary, watermarking, download
logging.

### Workshop validation questions
- ZIP, appendix PDF, or both? What do insurers actually open? ___________________
- Naming convention readable enough for a claims file? __________________________
- What must the index show that it doesn't? _____________________________________

## 9.3 Acceptance bar for the prototype outputs

The prototype report/pack passes Phase 0–1 validation when:
1. Two assessors say they would sign it (with named fixes applied).
2. One actual report consumer (claims handler / manager) confirms they would accept
   it into a real claim file without reformatting.
3. The Limitations section correctly auto-lists every skipped/missing/triggered item
   from a test session — nothing silently disappears.
