// Prototype types — Chunk 1A (mock data only; DB arrives in 1B per phase1/05).
// Shapes intentionally mirror phase1/05-data-model-and-statuses.md so 1B is a
// lift, not a rewrite. Chunk 1F widens the platform: multiple claim types plus
// survey job types — The Inspector is a template-driven assessment/survey
// engine, not a geyser tool.

export type Role = "admin" | "assessor" | "manager";

// Assessments handle claims; surveys are risk surveys (COPE-style reports).
export type JobType = "assessment" | "survey";

export type JobStatus =
  | "New"
  | "Assigned"
  | "Scheduled"
  | "In progress"
  | "Awaiting evidence"
  | "Awaiting report"
  | "Report submitted"
  | "Returned for correction"
  | "Report completed"
  | "Cancelled"
  | "No-show";

export type ClaimType =
  | "geyser_water"
  | "accidental"
  | "storm"
  | "theft"
  | "fire"
  | "general"
  | "survey_residential"
  | "survey_commercial";

export type AnswerType =
  | "yes_no"
  | "choice"
  | "text"
  | "number"
  | "evidence_only";

export interface TemplateItem {
  key: string;
  prompt: string;
  answerType: AnswerType;
  options?: string[];
  evidenceRequired: boolean;
  highRes?: boolean; // rating plates, serials, documents
  allowSkip: boolean;
  concernCapable: boolean;
  clientInstruction?: string;
}

export interface TemplateSection {
  key: string;
  title: string;
  items: TemplateItem[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  claimType: ClaimType;
  jobType: JobType;
  version: string;
  referenceOnly: boolean; // not bookable (fire = physical-first triage reference)
  limited?: boolean; // bookable but flagged as limited/prototype depth
  sections: TemplateSection[];
}

export interface DemoUser {
  id: string;
  name: string;
  role: Role;
  title: string;
}

export interface ClientRecord {
  id: string;
  name: string; // obviously-fake names only (no real-client data in Phase 1)
  phone: string;
  email: string;
  language: string;
}

export interface JobEvent {
  at: string;
  actor: string;
  text: string;
}

export type EvidenceKind =
  | "frame_capture"
  | "highres_client_photo"
  | "client_upload";

export interface EvidenceItem {
  id: string;
  jobId: string;
  itemKey?: string; // undefined = UNFILED
  kind: EvidenceKind;
  label: string;
  capturedAt: string;
  featured?: boolean;
  hue: number; // placeholder tile colour (no image files in 1A)
}

export interface Job {
  id: string;
  jobNumber: string;
  jobType?: JobType; // defaults to "assessment"
  claimType: ClaimType;
  templateId: string;
  clientId: string;
  assessorId?: string;
  status: JobStatus;
  priority: "Normal" | "High";
  claimNumber: string;
  policyNumber: string;
  dateOfLoss: string;
  description: string;
  specialConditions?: string;
  attempt: number;
  token?: string; // client link token (mock)
  scheduledStart?: string;
  durationMin?: number;
  missingItemKeys?: string[];
  outcome?: string;
  events: JobEvent[];
}
