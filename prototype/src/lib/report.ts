// Report model (Chunk 1E — post-assessment polish). One builder feeds the
// report editor, the rendered report page and the submit snapshot, so all
// three always agree. Auto sections (particulars, limitations, evidence index,
// sign-off) are regenerated from the DB, never stored editable — the
// Limitations section is non-removable by construction.
import "server-only";
import {
  getClient, getJob, getTemplate, listEvidence, listResponses, missingItems,
  templateItemByKey, JobRow,
} from "./data";
import { db } from "./db";
import { TemplateSection } from "./types";

export interface Narrative {
  summary: string;
  circumstances: string;
  findings: string;
  cause: string;
  conclusion: string;
}
export const NARRATIVE_SECTIONS: { key: keyof Narrative; title: string }[] = [
  { key: "summary", title: "Summary" },
  { key: "circumstances", title: "Circumstances of loss" },
  { key: "findings", title: "Assessment findings" },
  { key: "cause", title: "Cause of loss & comment" },
  { key: "conclusion", title: "Conclusion & recommendation" },
];

export interface EvidenceIndexRow {
  fig: number; id: string; label: string; kind: string; capturedAt: string;
  section: string; item: string; featured: boolean; hasFile: boolean;
}

export interface ReportModel {
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

  // ---- stats ----
  let total = 0, answered = 0, concerns = 0;
  for (const s of sections) for (const i of s.items) {
    total++;
    const r = byKey.get(i.key);
    if (r?.answer || evidence.some((e) => e.item_key === i.key)) answered++;
    if (r?.concern_flag) concerns++;
  }

  // ---- findings prefill: per-section digest of answers/notes/concerns ----
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

  // ---- circumstances prefill ----
  const prefix = job.claim_type === "geyser_water" ? "gey" : "acc";
  const discovery = answerText(byKey.get(`${prefix}.opening.discovery`)?.answer ?? null);
  const circumstances = [
    job.description,
    discovery && `Reported discovery: ${discovery}`,
    job.date_of_loss && `Date of loss: ${job.date_of_loss}.`,
  ].filter(Boolean).join(" ");

  // ---- limitations: AUTO, non-removable ----
  const limitations: string[] = [
    "This was a virtual (video) assessment; findings are based on what the client could show on camera and on evidence supplied by the client.",
  ];
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

  const typeLabel = job.claim_type === "geyser_water" ? "geyser failure and resultant water damage" : "accidental damage";
  const prefill: Narrative = {
    summary:
      `Virtual assessment of reported ${typeLabel} at the insured address. ` +
      `${answered} of ${total} checklist items were covered on camera with ${evidence.length} evidence item${evidence.length === 1 ? "" : "s"} captured` +
      `${concerns ? `; ${concerns} concern flag${concerns > 1 ? "s" : ""} raised for internal attention` : ""}` +
      `${missing.length ? `; ${missing.length} item${missing.length > 1 ? "s" : ""} outstanding (see Limitations)` : ""}.`,
    circumstances,
    findings: findingsParts.join("\n\n") || "No checklist findings were recorded during the session.",
    cause:
      job.claim_type === "geyser_water"
        ? "Based on the virtual inspection, the proximate cause of loss appears consistent with the reported geyser failure. [Assessor to confirm/expand.]"
        : "Based on the virtual inspection, the damage appears consistent with the reported accidental event. [Assessor to confirm/expand.]",
    conclusion:
      missing.length
        ? "Assessment is substantially complete; the outstanding items listed under Limitations should be obtained before final settlement recommendation. [Assessor recommendation.]"
        : "Assessment complete. [Assessor recommendation.]",
  };

  return {
    cover: {
      jobNumber: job.job_number, claimNumber: job.claim_number, policyNumber: job.policy_number ?? "—",
      clientName: client?.full_name ?? "—", templateName: tpl.name, templateVersion: job.template_version,
      dateOfLoss: job.date_of_loss ?? "—", assessorName: job.assessor_name ?? "—",
    },
    particulars: [
      ["Claim number", job.claim_number], ["Policy number", job.policy_number ?? "—"],
      ["Insured", client?.full_name ?? "—"], ["Contact", client ? `${client.phone} · ${client.email}` : "—"],
      ["Date of loss", job.date_of_loss ?? "—"], ["Claim type", tpl.name],
      ["Checklist version", job.template_version], ["Assessment job", job.job_number],
      ["Assessor", job.assessor_name ?? "—"],
    ],
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
