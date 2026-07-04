# 06 — Report Output & Evidence Pack (Phase 1 build)

Implements phase0 doc 09 (prototype report structure) exactly — the structure the
workshop validates. Generation: HTML template → headless Chromium → PDF, server-side,
at Generate/Approve time; the stored PDF is the artefact (never regenerated silently).

## 6.1 Claims assessment report (10 sections)

| # | Section | Source | Assessor-editable? |
|---|---------|--------|--------------------|
| 1 | Cover | Job + client + assessor fields; "PROTOTYPE" watermark; Acorn placeholder branding; codename never shown as product branding | No |
| 2 | Summary | Assessor writes (template gives a starter skeleton) | Yes |
| 3 | Claim particulars | Job fields verbatim | No (fix at source) |
| 4 | Circumstances | Pre-filled from opening-section checklist answers + notes | Yes |
| 5 | Findings | Per checklist section: answers + notes + featured photos with captions (`Fig n — label, source, time`); concern-flagged items rendered as factual observations, flag status not printed | Yes (narrative around the data) |
| 6 | Cause / comment | Assessor writes; prompt for evidence basis + confidence qualifier | Yes |
| 7 | Limitations & outstanding items | **Auto-generated, non-removable**: every skipped/missing item + reason, physical-trigger events, virtual-method statement | No (auto) + optional added note |
| 8 | Conclusion / recommendation | Assessor writes; structured picker (settle-consideration / further investigation / physical inspection / specialist) + free text | Yes |
| 9 | Evidence index | Auto table: Fig no · label · checklist item · source · date-time · (hash column reserved, empty) | No |
| 10 | Sign-off block | Assessor declaration + name/date; "Reviewed by" manager line filled at approval; version number | Auto |

Build notes:
- Pre-fill everything possible — the acceptance bar is **zero re-typing of checklist
  data** (S15 done-when).
- Section 5 photo layout: max 2 photos per row, caption under each; full-bleed room
  panoramas allowed one per section. Photos beyond "featured" go to the pack, not
  the report.
- Accidental-damage reports will be short (3–5 pages) — the template must not pad;
  empty optional sections collapse.
- Returned-for-correction: manager comments render inline per section in the builder,
  never in the PDF.

## 6.2 Evidence pack

Generated alongside the approved PDF (and on-demand for drafts, watermarked DRAFT):

**A. Downloadable image ZIP**
- Full-resolution images: `fig{n}_{section}_{item}_{yyyymmdd-hhmm}.jpg`
- `index.csv`: fig_no, label, checklist_item, source (frame capture / high-res client
  capture / client upload), captured_at
- Discarded items excluded; UNFILED-but-kept items appear under section `unfiled`.

**B. Evidence appendix PDF**
- Page 1: index table.
- Then one page per item: image large, caption block (label, checklist item, source,
  date-time).
- Exists because report recipients often won't open ZIPs (phase0 workshop question —
  build both, let the pilot show which survives).

**Explicitly deferred to production hardening:** SHA-256 integrity chain, manifest +
pack hash, consent-record summary in the pack, watermarking of approved outputs,
download logging. The `index.csv` column order leaves a `sha256` column empty at the
end so hardened packs stay format-compatible.

## 6.3 Definition of done

- ☐ A completed role-played geyser session generates report + both pack formats with
  one click each.
- ☐ Limitations section provably auto-lists every skipped/missing/triggered item
  from the session (test with a session that has all three).
- ☐ Fig numbers agree across report body, index, CSV and appendix.
- ☐ Manager approval stamps the sign-off block and locks the report version.
- ☐ A claims-side reviewer looks at one sample of each claim type and confirms
  "would accept into a file" (carries into the doc 09 acceptance criteria).
