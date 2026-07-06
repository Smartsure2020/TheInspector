// Report model (Chunk 1E, generalised in 1F). One builder feeds the report
// editor, the rendered report page and the submit snapshot, so all three
// always agree. Auto sections (particulars, limitations, evidence index,
// sign-off) are regenerated from the DB, never stored editable — the
// Limitations section is non-removable by construction.
//
// 1F: two report variants share the pipeline.
//  - Claims assessment report: summary, circumstances, findings, cause,
//    conclusion (+ auto particulars/limitations/evidence index).
//  - Survey report: risk description, COPE-style findings, recommendations
//    register, risk grading — NO cause-of-loss section; limitations use
//    virtual-survey wording and surface the physical-survey recommendation.
import "server-only";
import {
  getClient, getJob, getTemplate, listEvidence, listResponses, missingItems,
  templateItemByKey, JobRow,
} from "./data";
import { db } from "./db";
import { ClaimType, JobType, TemplateSection } from "./types";

// Narrative is keyed by section — claims and surveys use different keys.
export type Narrative = Record<string, string>;
export interface NarrativeSectionDef { key: string; title: string }

export const CLAIM_NARRATIVE_SECTIONS: NarrativeSectionDef[] = [
  { key: "summary", title: "Summary" },
  { key: "circumstances", title: "Circumstances of loss" },
  { key: "findings", title: "Assessment findings" },
  { key: "cause", title: "Cause of loss & comment" },
  { key: "conclusion", title: "Conclusion & recommendation" },
];

export const SURVEY_NARRATIVE_SECTIONS: NarrativeSectionDef[] = [
  { key: "riskDescription", title: "Risk description" },
  { key: "copeFindings", title: "COPE findings" },
  { key: "recommendations", title: "Recommendations register" },
  { key: "grading", title: "Risk grading & overall comment" },
];

export const narrativeSectionsFor = (jobType: JobType) =>
  jobType === "survey" ? SURVEY_NARRATIVE_SECTIONS : CLAIM_NARRATIVE_SECTIONS;

// Kept as the default export name used by older pages (claims layout).
export const NARRATIVE_SECTIONS = CLAIM_NARRATIVE_SECTIONS;

// Per-claim-type report wording (loss label + cause-of-loss prefill).
const CLAIM_WORDING: Partial<Record<ClaimType, { label: string; cause: string }>> = {
  geyser_water: {
    label: "geyser failure and resultant water damage",
    cause: "Based on the virtual inspection, the proximate cause of loss appears consistent with the reported geyser failure. [Assessor to confirm/expand.]",
  },
  accidental: {
    label: "accidental damage",
    cause: "Based on the virtual inspection, the damage appears consistent with the reported accidental event. [Assessor to confirm/expand.]",
  },
  storm: {
    label: "storm damage",
    cause:
      "Based on the virtual inspection, the damage pattern appears consistent with the reported storm event. " +
      "Weather corroboration: [record the source and finding — see the checklist weather item]. " +
      "Storm-attributable damage has been separated from maintenance-related deterioration item by item under Findings; maintenance items are not attributed to this event. " +
      "Where the roof or structure was not adequately viewable from a safe vantage point, a physical/drone inspection of that element is recommended (hybrid completion). [Assessor to confirm/expand.]",
  },
  theft: {
    label: "theft/burglary",
    cause:
      "Entry evidence and security-warranty compliance are recorded factually under Findings with photo references; this report records observations and inconsistencies without drawing conclusions on staging. " +
      "Where concern indicators accumulate, escalation to a specialist investigator is recommended rather than further probing on camera. [Assessor to confirm/expand.]",
  },
  general: {
    label: "the reported peril",
    cause:
      "Cause of loss finding: [state the identified peril and the evidence basis]. Policy-relevance comment: [peril match and any exclusions observed — the claims decision is not made in this report]. [Assessor to confirm/expand.]",
  },
};

// Dedicated general-bucket templates carry their own wording.
const TEMPLATE_WORDING: Record<string, { label: string; cause: string }> = {
  "tpl-surge": {
    label: "power surge damage",
    cause:
      "Based on the virtual inspection, the appliance failures appear consistent with the reported surge event (see event timing/load-shedding context under Findings). " +
      "The technician/electrician report should confirm the failure mode per appliance. [Assessor to confirm/expand.]",
  },
  "tpl-pipe": {
    label: "burst pipe and resultant water damage",
    cause:
      "Based on the virtual inspection, the proximate cause of loss appears consistent with the reported pipe failure. " +
      "Sudden failure vs gradual leakage and any maintenance contribution are addressed under Findings; damage attributed to gradual deterioration is noted separately from the sudden event. [Assessor to confirm/expand.]",
  },
};

export interface EvidenceIndexRow {
  fig: number; id: string; label: string; kind: string; capturedAt: string;
  section: string; item: string; featured: boolean; hasFile: boolean;
}

export interface ReportModel {
  jobType: JobType;
  docTitle: string;                 // "Virtual Assessment Report" | "Virtual Risk Survey Report"
  sections: NarrativeSectionDef[];  // narrative sections for this variant
  cover: {
    jobNumber: string; claimNumber: string; policyNumber: string;
    clientName: string; templateName: string; templateVersion: string;
    dateOfLoss: string; assessorName: string;
  };
  particulars: [string, string][];
  prefill: Narrative;               // suggested text from checklist data
  limitations: string[];            // AUTO — non-removable
  evidenceIndex: EvidenceIndexRow[];
  featured: { id: string; label: string; hasFile: boolean; hue: number | null }[];
  stats: { answered: number; total: number; concerns: number; missing: number; evidence: number };
}

const answerText = (raw: string | null): string => {
  if (!raw) return "";
  try {
    const v = JSON.parse(raw);
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return raw;
  }
};

export function buildReportModel(jobId: string): ReportModel | undefined {
  const job = getJob(jobId);
  if (!job) return undefined;
  const client = getClient(job.client_id);
  const tpl = getTemplate(job.template_id)!;
  const sections = tpl.sections;
  const responses = listResponses(jobId);
  const byKey = new Map(responses.map((r) => [r.item_key, r]));
  const evidence = listEvidence(jobId);
  const missing = missingItems(jobId);
  const isSurvey = job.job_type === "survey";

  // ---- stats ----
  let total = 0, answered = 0, concerns = 0;
  for (const s of sections) for (const i of s.items) {
    total++;
    const r = byKey.get(i.key);
    if (r?.answer || evidence.some((e) => e.item_key === i.key)) answered++;
    if (r?.concern_flag) concerns++;
  }

  // ---- per-section digest of answers/notes/concerns (findings / COPE) ----
  const findingsParts: string[] = [];
  for (const s of sections) {
    const lines: string[] = [];
    for (const i of s.items) {
      const r = byKey.get(i.key);
      const ans = answerText(r?.answer ?? null);
      if (!ans && !r?.note && !r?.concern_flag) continue;
      let line = `• ${i.prompt}: ${ans || "(see evidence)"}`;
      if (r?.note) line += ` — note: ${r.note}`;
      if (r?.concern_flag) line += r?.concern_note ? ` [CONCERN: ${r.concern_note}]` : " [CONCERN]";
      lines.push(line);
    }
    if (lines.length) findingsParts.push(`${s.title}:\n${lines.join("\n")}`);
  }

  // ---- limitations: AUTO, non-removable ----
  const limitations: string[] = [
    isSurvey
      ? "This was a virtual (video) risk survey; observations are limited to what could be shown on camera and to information supplied by the client. It is not a physical inspection and does not certify statutory compliance."
      : "This was a virtual (video) assessment; findings are based on what the client could show on camera and on evidence supplied by the client.",
  ];
  // Survey: the surveyability item drives the physical-survey recommendation.
  if (isSurvey) {
    const surveyable = answerText(
      [...byKey.entries()].find(([k]) => k.endsWith(".grading.surveyable"))?.[1]?.answer ?? null
    );
    if (surveyable === "No")
      limitations.push("The surveyor indicated this risk is NOT adequately surveyable virtually — a physical survey is recommended before terms are finalised.");
  }
  for (const m of missing) {
    const prompt = templateItemByKey(sections, m.item_key)?.item.prompt ?? m.item_key;
    limitations.push(`Outstanding: ${prompt} — flagged during the session (${m.missing_reason ?? "no reason recorded"}).`);
  }
  const unanswered = sections.flatMap((s) => s.items).filter((i) => {
    const r = byKey.get(i.key);
    const hasEvidence = evidence.some((e) => e.item_key === i.key);
    const isMissing = missing.some((m) => m.item_key === i.key);
    return !isMissing && !r?.answer && !(i.evidenceRequired ? hasEvidence : r?.answer || hasEvidence);
  });
  if (unanswered.length)
    limitations.push(`Not covered during the session (${unanswered.length} item${unanswered.length > 1 ? "s" : ""}): ${unanswered.slice(0, 6).map((i) => i.prompt).join("; ")}${unanswered.length > 6 ? "; …" : ""}.`);

  // ---- evidence index ----
  const evidenceIndex: EvidenceIndexRow[] = evidence.map((e, idx) => {
    const info = e.item_key ? templateItemByKey(sections, e.item_key) : undefined;
    return {
      fig: idx + 1, id: e.id, label: e.label,
      kind: e.kind === "highres_client_photo" ? "High-res photo" : e.kind === "client_upload" ? "Client upload" : "Frame capture",
      capturedAt: e.captured_at,
      section: info?.section.title ?? "Unfiled", item: info?.item.prompt ?? "—",
      featured: !!e.is_featured,
      hasFile: !!(e as unknown as { file_key: string | null }).file_key,
    };
  });

  const featured = evidence.filter((e) => e.is_featured).map((e) => ({
    id: e.id, label: e.label,
    hasFile: !!(e as unknown as { file_key: string | null }).file_key,
    hue: e.hue,
  }));

  // ---- narrative prefill (variant-specific) ----
  const answerByKeySuffix = (suffix: string) =>
    answerText([...byKey.entries()].find(([k]) => k.endsWith(suffix))?.[1]?.answer ?? null);

  let prefill: Narrative;
  if (isSurvey) {
    // Recommendations register: surveyor's register item + concern-flagged
    // observations as candidate entries.
    const registerText = answerByKeySuffix(".grading.recommendations");
    const concernLines = sections.flatMap((s) =>
      s.items
        .filter((i) => byKey.get(i.key)?.concern_flag)
        .map((i) => {
          const r = byKey.get(i.key)!;
          return `• [Requirement/Improvement — classify] ${s.title}: ${i.prompt}${r.concern_note ? ` — ${r.concern_note}` : ""} (timeline: immediate / 30 days / 90 days / next renewal)`;
        })
    );
    const grade = answerByKeySuffix(".grading.grade");
    const gradeComment = answerByKeySuffix(".grading.comment");
    const surveyable = answerByKeySuffix(".grading.surveyable");

    prefill = {
      riskDescription:
        `${job.description ?? "Risk surveyed virtually."} ` +
        `Virtual walk-through survey conducted on the ${tpl.name} checklist; ${answered} of ${total} items covered with ${evidence.length} evidence item${evidence.length === 1 ? "" : "s"} captured.`,
      copeFindings: findingsParts.join("\n\n") || "No survey observations were recorded during the session.",
      recommendations:
        [registerText, concernLines.length ? `Candidate entries from flagged observations:\n${concernLines.join("\n")}` : ""]
          .filter(Boolean).join("\n\n") ||
        "No recommendations recorded. [Surveyor to confirm: Requirements (conditions of cover) vs Improvements (advisory), each with a timeline.]",
      grading:
        `${grade ? `Risk grade: ${grade}.` : "Risk grade: [A–E — surveyor's judgement, not auto-computed]."}` +
        `${gradeComment ? ` ${gradeComment}` : " [Overall comment supporting the grade.]"}` +
        `${surveyable === "No" ? " This risk is not adequately surveyable virtually — a physical survey is recommended." : ""}`,
    };
  } else {
    const wording = TEMPLATE_WORDING[job.template_id] ?? CLAIM_WORDING[job.claim_type] ?? CLAIM_WORDING.general!;
    // Peril-adaptive wording for the general catch-all template.
    const peril = job.template_id === "tpl-general" ? answerByKeySuffix(".peril.type") : "";
    const typeLabel = peril ? `${peril.toLowerCase()} (general non-motor)` : wording.label;
    const discovery = answerByKeySuffix(".opening.discovery");
    const circumstances = [
      job.description,
      discovery && `Reported discovery: ${discovery}`,
      job.date_of_loss && `Date of loss: ${job.date_of_loss}.`,
    ].filter(Boolean).join(" ");

    prefill = {
      summary:
        `Virtual assessment of reported ${typeLabel} at the insured address. ` +
        `${answered} of ${total} checklist items were covered on camera with ${evidence.length} evidence item${evidence.length === 1 ? "" : "s"} captured` +
        `${concerns ? `; ${concerns} concern flag${concerns > 1 ? "s" : ""} raised for internal attention` : ""}` +
        `${missing.length ? `; ${missing.length} item${missing.length > 1 ? "s" : ""} outstanding (see Limitations)` : ""}.`,
      circumstances,
      findings: findingsParts.join("\n\n") || "No checklist findings were recorded during the session.",
      cause: peril
        ? `Cause of loss finding: damage reported under the selected peril "${peril}". [State the evidence basis and policy-relevance comment — peril match and exclusions observed — without making the claims decision.]`
        : wording.cause,
      conclusion:
        missing.length
          ? "Assessment is substantially complete; the outstanding items listed under Limitations should be obtained before final settlement recommendation. [Assessor recommendation.]"
          : "Assessment complete. [Assessor recommendation.]",
    };
  }

  const particulars: [string, string][] = isSurvey
    ? [
        ["Reference number", job.claim_number], ["Policy number", job.policy_number ?? "—"],
        ["Insured / client", client?.full_name ?? "—"], ["Contact", client ? `${client.phone} · ${client.email}` : "—"],
        ["Survey type", tpl.name], ["Checklist version", job.template_version],
        ["Survey job", job.job_number], ["Surveyor", job.assessor_name ?? "—"],
      ]
    : [
        ["Claim number", job.claim_number], ["Policy number", job.policy_number ?? "—"],
        ["Insured", client?.full_name ?? "—"], ["Contact", client ? `${client.phone} · ${client.email}` : "—"],
        ["Date of loss", job.date_of_loss ?? "—"], ["Claim type", tpl.name],
        ["Checklist version", job.template_version], ["Assessment job", job.job_number],
        ["Assessor", job.assessor_name ?? "—"],
      ];

  return {
    jobType: isSurvey ? "survey" : "assessment",
    docTitle: isSurvey ? "Virtual Risk Survey Report" : "Virtual Assessment Report",
    sections: narrativeSectionsFor(job.job_type),
    cover: {
      jobNumber: job.job_number, claimNumber: job.claim_number, policyNumber: job.policy_number ?? "—",
      clientName: client?.full_name ?? "—", templateName: tpl.name, templateVersion: job.template_version,
      dateOfLoss: job.date_of_loss ?? "—", assessorName: job.assessor_name ?? "—",
    },
    particulars,
    prefill, limitations, evidenceIndex, featured,
    stats: { answered, total, concerns, missing: missing.length, evidence: evidence.length },
  };
}

// ---- draft/version helpers ----
export interface ReportContent {
  narrative: Narrative;
  // snapshot of the auto sections at submit time (locked with the version)
  auto?: Pick<ReportModel, "particulars" | "limitations" | "evidenceIndex" | "stats" | "cover">;
}

export const parseContent = (raw: string | null): ReportContent | undefined => {
  if (!raw) return undefined;
  try { return JSON.parse(raw) as ReportContent; } catch { return undefined; }
};

/** Narrative the editor should start from: draft > latest returned version > prefill. */
export function initialNarrative(jobId: string, model: ReportModel): { narrative: Narrative; fromVersion?: number } {
  const rows = db().prepare("SELECT version, status, content FROM reports WHERE job_id=? ORDER BY version").all(jobId) as
    { version: number; status: string; content: string | null }[];
  const latest = rows.at(-1);
  if (latest) {
    const c = parseContent(latest.content);
    if (c?.narrative && (latest.status === "draft" || latest.status === "returned"))
      return { narrative: { ...model.prefill, ...c.narrative }, fromVersion: latest.version };
  }
  return { narrative: model.prefill };
}

export const jobLocked = (job: JobRow) => job.status === "Report completed" || job.status === "Cancelled";

export type { TemplateSection };
