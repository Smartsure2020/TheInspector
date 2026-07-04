// Seed data — Chunk 1A. All client records are obviously fake role-play data.
// NO real-client data may be added to this file (phase0 D-09 safeguard gate).
import {
  ChecklistTemplate,
  ClientRecord,
  DemoUser,
  EvidenceItem,
  Job,
} from "./types";

export const users: DemoUser[] = [
  { id: "u-lerato", name: "Lerato Demo", role: "admin", title: "Claims Coordinator" },
  { id: "u-sipho", name: "Sipho Demo", role: "assessor", title: "Senior Assessor" },
  { id: "u-anje", name: "Anje Demo", role: "assessor", title: "Assessor" },
  { id: "u-craig", name: "Craig Demo", role: "manager", title: "Assessing Services Manager" },
];

export const clients: ClientRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: `cl-${i + 1}`,
  name: `Test Insured ${String(i + 1).padStart(2, "0")}`,
  phone: `082 555 01${String(i + 1).padStart(2, "0")}`,
  email: `test.insured${i + 1}@example.invalid`,
  language: "English",
}));

// --- Templates -------------------------------------------------------------
// Geyser + accidental are the ACTIVE templates, seeded from the Phase 0 v0.2
// signed-off review sheets (phase0/04, sheets 1 and 5). The other four exist as
// reference stubs only and are never wired into flows (phase1/01 scope rule).

const opening = (prefix: string) => ({
  key: `${prefix}.opening`,
  title: "Opening",
  items: [
    { key: `${prefix}.opening.identity`, prompt: "Confirm identity of person on camera and relationship to policyholder", answerType: "yes_no" as const, evidenceRequired: false, allowSkip: false, concernCapable: true },
    { key: `${prefix}.opening.address`, prompt: "Loss address matches risk address (anchor shot where practical)", answerType: "yes_no" as const, evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show the street or gate from a window so we can confirm the address" },
    { key: `${prefix}.opening.discovery`, prompt: "Date of loss and how it was discovered", answerType: "text" as const, evidenceRequired: false, allowSkip: false, concernCapable: true },
    { key: `${prefix}.opening.mitigation`, prompt: "Emergency mitigation done? By whom? Invoices kept?", answerType: "text" as const, evidenceRequired: false, allowSkip: true, concernCapable: false },
    { key: `${prefix}.opening.prior`, prompt: "Prior claims or unrepaired prior damage?", answerType: "yes_no" as const, evidenceRequired: false, allowSkip: false, concernCapable: true },
  ],
});

const closing = (prefix: string) => ({
  key: `${prefix}.closing`,
  title: "Closing",
  items: [
    { key: `${prefix}.closing.panorama`, prompt: "Panoramic context shot of each affected area", answerType: "evidence_only" as const, evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please turn slowly so we can see the whole room" },
    { key: `${prefix}.closing.allshown`, prompt: "Client confirms all claimed damage has been shown", answerType: "yes_no" as const, evidenceRequired: false, allowSkip: false, concernCapable: true },
  ],
});

export const templates: ChecklistTemplate[] = [
  {
    id: "tpl-geyser",
    name: "Geyser / Water Damage",
    claimType: "geyser_water",
    version: "0.2",
    referenceOnly: false,
    sections: [
      opening("gey"),
      {
        key: "gey.unit",
        title: "Geyser unit",
        items: [
          { key: "gey.unit.wide", prompt: "Geyser wide shot showing location", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please show the geyser and the space around it" },
          { key: "gey.unit.plate", prompt: "Rating plate close-up — make, serial, capacity, manufacture date", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Photograph the sticker/plate on the geyser — hold steady, fill the screen" },
          { key: "gey.unit.failure", prompt: "Point of failure if visible (burst seam, element flange, fitting)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show where the water came from" },
          { key: "gey.unit.tray", prompt: "Drip tray and overflow pipe — presence, routing, condition", answerType: "yes_no", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show underneath the geyser" },
          { key: "gey.unit.valves", prompt: "Pressure control / safety valve and vacuum breakers", answerType: "yes_no", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the pipes and valves next to the geyser" },
          { key: "gey.unit.age", prompt: "Age of geyser and evidence source (plate / invoice / estimate)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true },
          { key: "gey.unit.mode", prompt: "Sudden burst or gradual leak? How long was water present?", answerType: "choice", options: ["Sudden burst", "Gradual leak", "Unclear"], evidenceRequired: false, allowSkip: false, concernCapable: true },
        ],
      },
      {
        key: "gey.damage",
        title: "Resultant damage",
        items: [
          { key: "gey.damage.ceiling", prompt: "Ceiling boards, cornices — stains, sagging, collapse", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please point the camera at the ceiling damage" },
          { key: "gey.damage.walls", prompt: "Walls and paintwork water damage", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the wall damage up close, then step back" },
          { key: "gey.damage.floors", prompt: "Floor coverings affected", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the floor damage" },
          { key: "gey.damage.contents", prompt: "Each affected contents item, one by one", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show each damaged item one at a time" },
          { key: "gey.damage.consistent", prompt: "Resultant damage consistent with failure mode and timeline?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
        ],
      },
      {
        key: "gey.docs",
        title: "Documents",
        items: [
          { key: "gey.docs.plumber", prompt: "Plumber's report and invoice", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: false, clientInstruction: "Hold the plumber's invoice up to the camera, or we'll send an upload link" },
          { key: "gey.docs.quotes", prompt: "Quotes for resultant damage repairs", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false },
          { key: "gey.docs.contents", prompt: "Contents replacement quotes / proof", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false },
        ],
      },
      closing("gey"),
    ],
  },
  {
    id: "tpl-accidental",
    name: "Accidental Damage",
    claimType: "accidental",
    version: "0.2",
    referenceOnly: false,
    sections: [
      opening("acc"),
      {
        key: "acc.item",
        title: "Damaged item",
        items: [
          { key: "acc.item.overall", prompt: "Damaged item — overall shots", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please show the whole item" },
          { key: "acc.item.closeup", prompt: "Damage close-ups from multiple angles", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please show the damage up close from a few angles" },
          { key: "acc.item.serial", prompt: "Serial / model plate", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Photograph the serial number sticker — hold steady, fill the screen" },
          { key: "acc.item.functional", prompt: "Item partially functional? (powers on, screen state)", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: false, clientInstruction: "Please switch the item on so we can see what it does" },
          { key: "acc.item.mechanism", prompt: "Damage physically consistent with described mechanism?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
        ],
      },
      {
        key: "acc.scene",
        title: "Incident location",
        items: [
          { key: "acc.scene.walkthrough", prompt: "Client walks through what happened at the location", answerType: "text", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show us where it happened and talk us through it" },
          { key: "acc.scene.related", prompt: "Related damage (surface it fell onto, liquid residue)", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true },
        ],
      },
      {
        key: "acc.docs",
        title: "Documents",
        items: [
          { key: "acc.docs.quote", prompt: "Repair quote or BER letter", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false },
          { key: "acc.docs.proof", prompt: "Purchase proof (receipt, statement, packaging with serial)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true },
        ],
      },
      closing("acc"),
    ],
  },
  // Reference-only stubs — visible in the template list, never wired into flows.
  ...(["storm", "theft", "fire", "general"] as const).map((t) => ({
    id: `tpl-${t}`,
    name: `${t[0].toUpperCase()}${t.slice(1)} (reference only)`,
    claimType: t,
    version: "0.2-ref",
    referenceOnly: true,
    sections: [],
  })),
];

// --- Jobs (cover every status) ----------------------------------------------
const ev = (at: string, actor: string, text: string) => ({ at, actor, text });

export const jobs: Job[] = [
  {
    id: "j1", jobNumber: "INS-2026-0001", claimType: "geyser_water", templateId: "tpl-geyser",
    clientId: "cl-1", status: "New", priority: "Normal",
    claimNumber: "CLM-88101", policyNumber: "POL-4410", dateOfLoss: "2026-06-28",
    description: "Geyser burst in roof, water through main bedroom ceiling.",
    specialConditions: "Verify geyser age — policy excludes units older than 10 years for unit replacement.",
    attempt: 0,
    events: [ev("2026-07-01 08:40", "Lerato Demo", "Job created")],
  },
  {
    id: "j2", jobNumber: "INS-2026-0002", claimType: "accidental", templateId: "tpl-accidental",
    clientId: "cl-2", assessorId: "u-anje", status: "Assigned", priority: "Normal",
    claimNumber: "CLM-88102", policyNumber: "POL-3120", dateOfLoss: "2026-06-30",
    description: "65\" TV knocked off wall unit while moving furniture.",
    attempt: 0,
    events: [ev("2026-07-01 09:12", "Lerato Demo", "Job created"), ev("2026-07-01 09:15", "Lerato Demo", "Assigned to Anje Demo")],
  },
  {
    id: "j3", jobNumber: "INS-2026-0003", claimType: "geyser_water", templateId: "tpl-geyser",
    clientId: "cl-3", assessorId: "u-sipho", status: "Scheduled", priority: "High",
    claimNumber: "CLM-88103", policyNumber: "POL-9917", dateOfLoss: "2026-07-01",
    description: "Burst geyser, kitchen and passage ceilings affected. DEMO JOB for walkthroughs.",
    attempt: 1, token: "demo-geyser", scheduledStart: "2026-07-04 14:00", durationMin: 45,
    events: [ev("2026-07-02 10:01", "Lerato Demo", "Job created"), ev("2026-07-02 10:03", "Lerato Demo", "Assigned to Sipho Demo"), ev("2026-07-02 10:20", "Sipho Demo", "Appointment scheduled 2026-07-04 14:00, client link generated")],
  },
  {
    id: "j4", jobNumber: "INS-2026-0004", claimType: "accidental", templateId: "tpl-accidental",
    clientId: "cl-4", assessorId: "u-anje", status: "Scheduled", priority: "Normal",
    claimNumber: "CLM-88104", policyNumber: "POL-2288", dateOfLoss: "2026-07-02",
    description: "Cellphone dropped in driveway, screen shattered. DEMO JOB.",
    attempt: 1, token: "demo-acc", scheduledStart: "2026-07-04 15:30", durationMin: 20,
    events: [ev("2026-07-02 11:00", "Lerato Demo", "Job created"), ev("2026-07-02 11:02", "Lerato Demo", "Assigned to Anje Demo"), ev("2026-07-02 11:30", "Anje Demo", "Appointment scheduled 2026-07-04 15:30, client link generated")],
  },
  {
    id: "j5", jobNumber: "INS-2026-0005", claimType: "geyser_water", templateId: "tpl-geyser",
    clientId: "cl-5", assessorId: "u-sipho", status: "In progress", priority: "Normal",
    claimNumber: "CLM-88105", policyNumber: "POL-5551", dateOfLoss: "2026-06-25",
    description: "Slow leak dispute — element flange failure, lounge ceiling.",
    attempt: 1, token: "demo-live", scheduledStart: "2026-07-04 09:00", durationMin: 45,
    events: [ev("2026-07-03 08:00", "Lerato Demo", "Job created"), ev("2026-07-04 09:02", "Sipho Demo", "Session started — client admitted")],
  },
  {
    id: "j6", jobNumber: "INS-2026-0006", claimType: "geyser_water", templateId: "tpl-geyser",
    clientId: "cl-6", assessorId: "u-sipho", status: "Awaiting evidence", priority: "Normal",
    claimNumber: "CLM-88106", policyNumber: "POL-7703", dateOfLoss: "2026-06-20",
    description: "Geyser burst; plumber invoice and plate photo outstanding.",
    attempt: 1, missingItemKeys: ["gey.docs.plumber", "gey.unit.plate"],
    events: [ev("2026-07-02 14:45", "Sipho Demo", "Session ended — 2 items flagged missing"), ev("2026-07-02 14:50", "Sipho Demo", "Upload request created for client")],
  },
  {
    id: "j7", jobNumber: "INS-2026-0007", claimType: "accidental", templateId: "tpl-accidental",
    clientId: "cl-7", assessorId: "u-anje", status: "Awaiting report", priority: "Normal",
    claimNumber: "CLM-88107", policyNumber: "POL-1199", dateOfLoss: "2026-06-29",
    description: "Laptop knocked off desk by pet; hinge and screen damage.",
    attempt: 1,
    events: [ev("2026-07-03 11:20", "Anje Demo", "Session ended — evidence complete")],
  },
  {
    id: "j8", jobNumber: "INS-2026-0008", claimType: "geyser_water", templateId: "tpl-geyser",
    clientId: "cl-8", assessorId: "u-sipho", status: "Report submitted", priority: "Normal",
    claimNumber: "CLM-88108", policyNumber: "POL-6062", dateOfLoss: "2026-06-18",
    description: "Geyser burst with three rooms affected; report in review queue.",
    attempt: 1,
    events: [ev("2026-07-03 16:05", "Sipho Demo", "Report v1 submitted for review")],
  },
  {
    id: "j9", jobNumber: "INS-2026-0009", claimType: "accidental", templateId: "tpl-accidental",
    clientId: "cl-9", assessorId: "u-anje", status: "Returned for correction", priority: "Normal",
    claimNumber: "CLM-88109", policyNumber: "POL-8814", dateOfLoss: "2026-06-27",
    description: "Glass hob cracked by dropped pot.",
    attempt: 1,
    events: [ev("2026-07-03 09:40", "Craig Demo", "Report v1 returned — cause section needs the mechanism basis stated")],
  },
  {
    id: "j10", jobNumber: "INS-2026-0010", claimType: "geyser_water", templateId: "tpl-geyser",
    clientId: "cl-10", assessorId: "u-sipho", status: "Report completed", priority: "Normal",
    claimNumber: "CLM-88110", policyNumber: "POL-2020", dateOfLoss: "2026-06-15",
    description: "Straightforward burst geyser; approved report v2.",
    attempt: 1, outcome: "completed",
    events: [ev("2026-07-02 15:30", "Craig Demo", "Report v2 approved — PDF and evidence pack generated")],
  },
  {
    id: "j11", jobNumber: "INS-2026-0011", claimType: "accidental", templateId: "tpl-accidental",
    clientId: "cl-11", status: "Cancelled", priority: "Normal",
    claimNumber: "CLM-88111", policyNumber: "POL-4141", dateOfLoss: "2026-06-26",
    description: "Damaged tablet — claim withdrawn by insured.",
    attempt: 0, outcome: "cancelled",
    events: [ev("2026-07-01 13:10", "Lerato Demo", "Job cancelled — claim withdrawn")],
  },
  {
    id: "j12", jobNumber: "INS-2026-0012", claimType: "geyser_water", templateId: "tpl-geyser",
    clientId: "cl-12", assessorId: "u-anje", status: "No-show", priority: "Normal",
    claimNumber: "CLM-88112", policyNumber: "POL-9090", dateOfLoss: "2026-06-24",
    description: "Client did not join attempt 1; reschedule pending.",
    attempt: 1,
    events: [ev("2026-07-03 10:20", "Anje Demo", "Marked no-show — client did not join within grace period")],
  },
];

// --- Sample evidence (for gallery / report screens) --------------------------
export const evidence: EvidenceItem[] = [
  { id: "e1", jobId: "j6", itemKey: "gey.unit.wide", kind: "frame_capture", label: "Geyser unit – wide shot – 14:03:12", capturedAt: "2026-07-02 14:03", featured: true, hue: 205 },
  { id: "e2", jobId: "j6", itemKey: "gey.unit.tray", kind: "frame_capture", label: "Geyser unit – drip tray – 14:05:47", capturedAt: "2026-07-02 14:05", hue: 160 },
  { id: "e3", jobId: "j6", itemKey: "gey.damage.ceiling", kind: "frame_capture", label: "Resultant damage – ceiling – 14:11:02", capturedAt: "2026-07-02 14:11", featured: true, hue: 25 },
  { id: "e4", jobId: "j6", itemKey: "gey.damage.contents", kind: "frame_capture", label: "Resultant damage – contents – 14:15:33", capturedAt: "2026-07-02 14:15", hue: 280 },
  { id: "e5", jobId: "j6", kind: "frame_capture", label: "UNFILED – 14:18:20", capturedAt: "2026-07-02 14:18", hue: 45 },
  { id: "e6", jobId: "j6", itemKey: "gey.closing.panorama", kind: "frame_capture", label: "Closing – panorama – 14:31:54", capturedAt: "2026-07-02 14:31", featured: true, hue: 130 },
  { id: "e7", jobId: "j10", itemKey: "gey.unit.plate", kind: "highres_client_photo", label: "Geyser unit – rating plate (high-res) – 10:22:08", capturedAt: "2026-07-01 10:22", featured: true, hue: 330 },
  { id: "e8", jobId: "j10", itemKey: "gey.damage.ceiling", kind: "frame_capture", label: "Resultant damage – ceiling – 10:26:41", capturedAt: "2026-07-01 10:26", featured: true, hue: 15 },
  { id: "e9", jobId: "j10", itemKey: "gey.docs.plumber", kind: "client_upload", label: "Documents – plumber invoice (upload) – 16:40:12", capturedAt: "2026-07-01 16:40", hue: 95 },
];

// --- Lookups ------------------------------------------------------------------
export const clientById = (id: string) => clients.find((c) => c.id === id);
export const userById = (id?: string) => users.find((u) => u.id === id);
export const templateById = (id: string) => templates.find((t) => t.id === id);
export const jobById = (id: string) => jobs.find((j) => j.id === id);
export const jobByToken = (token: string) => jobs.find((j) => j.token === token);
export const evidenceForJob = (jobId: string) => evidence.filter((e) => e.jobId === jobId);
export const itemByKey = (tpl: ChecklistTemplate, key: string) => {
  for (const s of tpl.sections) for (const i of s.items) if (i.key === key) return i;
  return undefined;
};
