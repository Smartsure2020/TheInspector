# 08 — Report Outputs

Three artefacts per completed job: the **report PDF** (assessment or survey layout),
the **evidence pack**, and (internally) the **audit extract**. All generated
server-side from stored data at approval time and stored immutably.

## 8.1 Assessment report (claims)

Branded, professional, typically 6–15 pages.

1. **Cover page** — Acorn branding, "Virtual Assessment Report", claim number, insured
   name, risk address, date of loss, date of assessment, assessor name & credentials,
   report version + approval date.
2. **Executive summary** — half page: peril, what was assessed, key finding,
   recommendation. Written for the claims handler who reads nothing else.
3. **Appointment & method** — how the assessment was conducted (virtual, platform,
   date/time, who participated, consent confirmed), attempts history if relevant
   (no-shows matter to the file).
4. **Claim & policy particulars** — claim/policy references, cover context as
   provided, special conditions the assessor was instructed to verify.
5. **Circumstances of loss** — the insured's account as given in session.
6. **Assessment findings** — the core. Per checklist section: observations, embedded
   key photos (captioned: label + timestamp + "Fig. n"), answers to structured
   questions. Red-flagged items presented factually.
7. **Cause of loss** — assessor's finding with evidence basis and confidence
   qualifier; wear-and-tear/maintenance attributions itemised separately.
8. **Quantum observations** — damage schedule: item/area, observed condition,
   supporting quote/invoice reference, assessor comment on reasonableness. (The
   Inspector records observations; reserve/settlement figures remain the claims
   team's domain unless Acorn decides otherwise — open question, doc 12.)
9. **Policy considerations** — factual compliance observations against warranties/
   conditions (e.g. "alarm observed unarmed per client statement"); explicitly NOT a
   coverage decision. Standard disclaimer.
10. **Limitations & outstanding evidence** — auto-generated from skipped/missing
    checklist items and virtual-method limitations; what could not be verified and why.
11. **Conclusion & recommendations** — settle-consideration / further investigation /
    physical inspection recommended / specialist referral, with reasons.
12. **Evidence index** — table: fig no., label, checklist reference, captured/uploaded,
    timestamp, SHA-256 (short). Cross-references the evidence pack.
13. **Declaration & sign-off** — assessor declaration of accuracy; reviewed/approved
    by (manager, date). System-generated integrity line: report id, version, hash.

## 8.2 Survey report

1. **Cover page** — "Virtual Risk Survey Report", insured, risk address, survey date,
   surveyor, policy/underwriting reference.
2. **Executive summary** — risk description in three sentences, grade, top 3
   recommendations.
3. **Survey method & limitations** — virtual method statement; standing limitation
   paragraph (roof interiors, concealed areas, measurements are indicative); whether
   a physical survey is recommended.
4. **Risk description** — construction, occupancy, situation narrative with context
   photos.
5. **Section findings** — Construction / Occupancy / Protection / Exposure /
   Maintenance / Security / Fire risk: observations + photos + structured answers per
   the template (doc 05).
6. **Recommendations register** — table: ref, recommendation, category
   (Requirement/Improvement), risk addressed, timeline, photo ref. This table is the
   deliverable underwriters consume — it must be clean and copy-pastable.
7. **Risk grading** — grade A–E with justification paragraph referencing section
   findings.
8. **Evidence index, declaration & sign-off** — as per assessment report.

## 8.3 Evidence pack

Purpose: the standalone, dispute-ready bundle. Two formats generated together:

- **ZIP archive**: full-resolution images named
  `{fig-no}_{section}_{item}_{timestamp}.jpg`, plus `index.csv` (fig no., label,
  checklist ref, source [frame capture/client upload], captured_at, sha256) and
  `manifest.json` (job ref, session refs, consent record summary, pack generation
  timestamp, pack-level hash).
- **Appendix PDF**: one page per evidence item (image, full caption, metadata block) —
  for recipients who won't open a ZIP. Prefaced by the index table.

Integrity chain: each item's SHA-256 recorded at ingest → listed in index → pack hash
covers the index → pack hash recorded in the audit log and printed in the report
sign-off block. Anyone can verify nothing was altered after capture.

## 8.4 Audit extract (internal)

On demand (manager/admin): chronological PDF of the job's audit trail — link issued/
opened, consent, session times, every capture/edit/status change, report versions,
downloads. Used for disputes, complaints (FAIS/ombud), and internal QA. Not part of
the standard client-facing outputs.
