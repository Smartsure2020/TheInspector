// Seed data — Chunk 1A, repositioned in 1F. All client records are obviously
// fake role-play data. NO real-client data may be added to this file (phase0
// D-09 safeguard gate).
//
// 1F demo positioning: management must NOT land on a geyser-first experience.
// The book of demo jobs now spans accidental, storm, theft, power surge, burst
// pipe, general non-motor and risk surveys. Geyser stays available (awaiting-
// evidence + completed-report jobs) but is no longer the hero demo.
import {
  ClientRecord,
  DemoUser,
  EvidenceItem,
  Job,
} from "./types";
import { templates } from "./templates";

export { templates };

export const users: DemoUser[] = [
  { id: "u-lerato", name: "Lerato Demo", role: "admin", title: "Claims Coordinator" },
  { id: "u-sipho", name: "Sipho Demo", role: "assessor", title: "Senior Assessor" },
  { id: "u-anje", name: "Anje Demo", role: "assessor", title: "Assessor / Surveyor" },
  { id: "u-craig", name: "Craig Demo", role: "manager", title: "Assessing Services Manager" },
];

export const clients: ClientRecord[] = Array.from({ length: 18 }, (_, i) => ({
  id: `cl-${i + 1}`,
  name: `Test Insured ${String(i + 1).padStart(2, "0")}`,
  phone: `082 555 01${String(i + 1).padStart(2, "0")}`,
  email: `test.insured${i + 1}@example.invalid`,
  language: "English",
}));

// --- Jobs (cover every status; multi-peril + survey book) --------------------
const ev = (at: string, actor: string, text: string) => ({ at, actor, text });

export const jobs: Job[] = [
  {
    id: "j1", jobNumber: "INS-2026-0001", claimType: "storm", templateId: "tpl-storm",
    clientId: "cl-1", status: "New", priority: "Normal",
    claimNumber: "CLM-88101", policyNumber: "POL-4410", dateOfLoss: "2026-06-30",
    description: "Severe thunderstorm — roof sheets lifted, water through lounge ceiling, boundary fence panels down.",
    specialConditions: "Corroborate the storm event against weather records for the area; separate maintenance items explicitly.",
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
    id: "j3", jobNumber: "INS-2026-0003", claimType: "storm", templateId: "tpl-storm",
    clientId: "cl-3", assessorId: "u-sipho", status: "Scheduled", priority: "High",
    claimNumber: "CLM-88103", policyNumber: "POL-9917", dateOfLoss: "2026-07-01",
    description: "Storm damage to roof, gutters and boundary wall; two ceilings with ingress stains. PRIMARY DEMO JOB for walkthroughs.",
    attempt: 1, token: "demo-storm", scheduledStart: "2026-07-08 14:00", durationMin: 60,
    events: [ev("2026-07-02 10:01", "Lerato Demo", "Job created"), ev("2026-07-02 10:03", "Lerato Demo", "Assigned to Sipho Demo"), ev("2026-07-02 10:20", "Sipho Demo", "Appointment scheduled 2026-07-08 14:00, client link generated")],
  },
  {
    id: "j4", jobNumber: "INS-2026-0004", claimType: "accidental", templateId: "tpl-accidental",
    clientId: "cl-4", assessorId: "u-anje", status: "Scheduled", priority: "Normal",
    claimNumber: "CLM-88104", policyNumber: "POL-2288", dateOfLoss: "2026-07-02",
    description: "Cellphone dropped in driveway, screen shattered. DEMO JOB.",
    attempt: 1, token: "demo-acc", scheduledStart: "2026-07-08 15:30", durationMin: 20,
    events: [ev("2026-07-02 11:00", "Lerato Demo", "Job created"), ev("2026-07-02 11:02", "Lerato Demo", "Assigned to Anje Demo"), ev("2026-07-02 11:30", "Anje Demo", "Appointment scheduled 2026-07-08 15:30, client link generated")],
  },
  {
    id: "j5", jobNumber: "INS-2026-0005", claimType: "general", templateId: "tpl-surge",
    clientId: "cl-5", assessorId: "u-sipho", status: "In progress", priority: "Normal",
    claimNumber: "CLM-88105", policyNumber: "POL-5551", dateOfLoss: "2026-07-01",
    description: "Power surge at load-shedding restoration — TV, decoder and inverter damaged. LIVE-ROOM DEMO JOB.",
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
    id: "j7", jobNumber: "INS-2026-0007", claimType: "storm", templateId: "tpl-storm",
    clientId: "cl-7", assessorId: "u-anje", status: "Awaiting report", priority: "Normal",
    claimNumber: "CLM-88107", policyNumber: "POL-1199", dateOfLoss: "2026-06-30",
    description: "Hail storm — carport sheeting punctured, gutters displaced, two ceilings stained; session complete.",
    attempt: 1,
    events: [ev("2026-07-03 11:20", "Anje Demo", "Session ended — evidence complete")],
  },
  {
    id: "j8", jobNumber: "INS-2026-0008", claimType: "general", templateId: "tpl-surge",
    clientId: "cl-8", assessorId: "u-sipho", status: "Report submitted", priority: "Normal",
    claimNumber: "CLM-88108", policyNumber: "POL-6062", dateOfLoss: "2026-07-01",
    description: "Power surge — fridge, oven and Wi-Fi equipment damaged; report in review queue.",
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
    id: "j12", jobNumber: "INS-2026-0012", claimType: "theft", templateId: "tpl-theft",
    clientId: "cl-12", assessorId: "u-anje", status: "No-show", priority: "Normal",
    claimNumber: "CLM-88112", policyNumber: "POL-9090", dateOfLoss: "2026-06-24",
    description: "Burglary via kitchen window — electronics taken; client did not join attempt 1, reschedule pending.",
    attempt: 1,
    events: [ev("2026-07-03 10:20", "Anje Demo", "Marked no-show — client did not join within grace period")],
  },
  {
    id: "j13", jobNumber: "SRV-2026-0013", jobType: "survey", claimType: "survey_residential", templateId: "tpl-survey-res",
    clientId: "cl-13", assessorId: "u-anje", status: "Awaiting report", priority: "Normal",
    claimNumber: "REF-77001", policyNumber: "POL-7401", dateOfLoss: "2026-07-02",
    description: "Residential risk survey at underwriting's request — new thatch lapa and solar installation to be noted.",
    attempt: 1,
    events: [ev("2026-07-02 09:00", "Lerato Demo", "Survey job created"), ev("2026-07-03 15:40", "Anje Demo", "Survey session ended — walk-through complete")],
  },
  {
    id: "j14", jobNumber: "SRV-2026-0014", jobType: "survey", claimType: "survey_residential", templateId: "tpl-survey-res",
    clientId: "cl-14", assessorId: "u-anje", status: "Scheduled", priority: "Normal",
    claimNumber: "REF-77002", policyNumber: "POL-7402", dateOfLoss: "2026-07-06",
    description: "Residential risk survey — renewal condition. SURVEY DEMO JOB for walkthroughs.",
    attempt: 1, token: "demo-survey", scheduledStart: "2026-07-08 10:00", durationMin: 90,
    events: [ev("2026-07-03 09:10", "Lerato Demo", "Survey job created"), ev("2026-07-03 09:30", "Anje Demo", "Appointment scheduled 2026-07-08 10:00, client link generated")],
  },
  {
    id: "j15", jobNumber: "SRV-2026-0015", jobType: "survey", claimType: "survey_commercial", templateId: "tpl-survey-com",
    clientId: "cl-15", assessorId: "u-sipho", status: "Assigned", priority: "Normal",
    claimNumber: "REF-77003", policyNumber: "POL-7403", dateOfLoss: "2026-07-10",
    description: "Commercial property survey — retail unit with storage yard (prototype-limited template).",
    attempt: 0,
    events: [ev("2026-07-03 11:00", "Lerato Demo", "Survey job created"), ev("2026-07-03 11:05", "Lerato Demo", "Assigned to Sipho Demo")],
  },
  {
    id: "j16", jobNumber: "SRV-2026-0016", jobType: "survey", claimType: "survey_residential", templateId: "tpl-survey-res",
    clientId: "cl-16", assessorId: "u-sipho", status: "Report submitted", priority: "Normal",
    claimNumber: "REF-77004", policyNumber: "POL-7404", dateOfLoss: "2026-07-01",
    description: "Residential risk survey — survey report in review queue (physical survey recommended for roof/outbuildings).",
    attempt: 1,
    events: [ev("2026-07-04 10:15", "Sipho Demo", "Survey report v1 submitted for review")],
  },
  {
    id: "j17", jobNumber: "INS-2026-0017", claimType: "theft", templateId: "tpl-theft",
    clientId: "cl-17", assessorId: "u-sipho", status: "Scheduled", priority: "High",
    claimNumber: "CLM-88117", policyNumber: "POL-6644", dateOfLoss: "2026-07-03",
    description: "Burglary — entry via forced security gate; jewellery and electronics taken. DEMO JOB.",
    attempt: 1, token: "demo-theft", scheduledStart: "2026-07-08 11:30", durationMin: 60,
    events: [ev("2026-07-04 08:20", "Lerato Demo", "Job created"), ev("2026-07-04 08:25", "Lerato Demo", "Assigned to Sipho Demo"), ev("2026-07-04 08:40", "Sipho Demo", "Appointment scheduled 2026-07-08 11:30, client link generated")],
  },
  {
    id: "j18", jobNumber: "INS-2026-0018", claimType: "general", templateId: "tpl-pipe",
    clientId: "cl-18", status: "New", priority: "Normal",
    claimNumber: "CLM-88118", policyNumber: "POL-3377", dateOfLoss: "2026-07-04",
    description: "Burst pipe in bathroom wall — cupboards, flooring and passage carpet damaged.",
    attempt: 0,
    events: [ev("2026-07-04 09:35", "Lerato Demo", "Job created")],
  },
];

// --- Sample evidence (for gallery / report screens) --------------------------
export const evidence: EvidenceItem[] = [
  // j6 — geyser, awaiting evidence
  { id: "e1", jobId: "j6", itemKey: "gey.unit.wide", kind: "frame_capture", label: "Geyser unit – wide shot – 14:03:12", capturedAt: "2026-07-02 14:03", featured: true, hue: 205 },
  { id: "e2", jobId: "j6", itemKey: "gey.unit.tray", kind: "frame_capture", label: "Geyser unit – drip tray – 14:05:47", capturedAt: "2026-07-02 14:05", hue: 160 },
  { id: "e3", jobId: "j6", itemKey: "gey.damage.ceiling", kind: "frame_capture", label: "Resultant damage – ceiling – 14:11:02", capturedAt: "2026-07-02 14:11", featured: true, hue: 25 },
  { id: "e4", jobId: "j6", itemKey: "gey.damage.contents", kind: "frame_capture", label: "Resultant damage – contents – 14:15:33", capturedAt: "2026-07-02 14:15", hue: 280 },
  { id: "e5", jobId: "j6", kind: "frame_capture", label: "UNFILED – 14:18:20", capturedAt: "2026-07-02 14:18", hue: 45 },
  { id: "e6", jobId: "j6", itemKey: "gey.closing.panorama", kind: "frame_capture", label: "Closing – panorama – 14:31:54", capturedAt: "2026-07-02 14:31", featured: true, hue: 130 },
  // j10 — geyser, completed
  { id: "e7", jobId: "j10", itemKey: "gey.unit.plate", kind: "highres_client_photo", label: "Geyser unit – rating plate (high-res) – 10:22:08", capturedAt: "2026-07-01 10:22", featured: true, hue: 330 },
  { id: "e8", jobId: "j10", itemKey: "gey.damage.ceiling", kind: "frame_capture", label: "Resultant damage – ceiling – 10:26:41", capturedAt: "2026-07-01 10:26", featured: true, hue: 15 },
  { id: "e9", jobId: "j10", itemKey: "gey.docs.plumber", kind: "client_upload", label: "Documents – plumber invoice (upload) – 16:40:12", capturedAt: "2026-07-01 16:40", hue: 95 },
  // j7 — storm, awaiting report
  { id: "e10", jobId: "j7", itemKey: "sto.roof.view", kind: "frame_capture", label: "Roof (safe vantage) – from garden – 10:12:04", capturedAt: "2026-07-03 10:12", featured: true, hue: 210 },
  { id: "e11", jobId: "j7", itemKey: "sto.gutters.condition", kind: "frame_capture", label: "Gutters – pre-existing rust, north elevation – 10:15:21", capturedAt: "2026-07-03 10:15", hue: 30 },
  { id: "e12", jobId: "j7", itemKey: "sto.internal.ceilings", kind: "frame_capture", label: "Internal ingress – lounge ceiling – 10:22:48", capturedAt: "2026-07-03 10:22", featured: true, hue: 15 },
  { id: "e13", jobId: "j7", itemKey: "sto.site.outbuildings", kind: "frame_capture", label: "Carport – punctured sheeting – 10:31:10", capturedAt: "2026-07-03 10:31", hue: 120 },
  { id: "e14", jobId: "j7", itemKey: "sto.docs.quotes", kind: "client_upload", label: "Documents – roofing quote (upload) – 15:02:33", capturedAt: "2026-07-03 15:02", hue: 95 },
  // j8 — power surge, report submitted
  { id: "e15", jobId: "j8", itemKey: "srg.db.board", kind: "frame_capture", label: "DB board – wide + breakers – 09:41:12", capturedAt: "2026-07-02 09:41", featured: true, hue: 260 },
  { id: "e16", jobId: "j8", itemKey: "srg.items.each", kind: "frame_capture", label: "Affected appliances – fridge – 09:48:37", capturedAt: "2026-07-02 09:48", hue: 200 },
  { id: "e17", jobId: "j8", itemKey: "srg.docs.technician", kind: "client_upload", label: "Documents – technician report (upload) – 13:20:55", capturedAt: "2026-07-02 13:20", featured: true, hue: 90 },
  // j13 — residential survey, awaiting report
  { id: "e18", jobId: "j13", itemKey: "svr.construction.elevations", kind: "frame_capture", label: "Construction – north elevation – 14:05:19", capturedAt: "2026-07-03 14:05", featured: true, hue: 145 },
  { id: "e19", jobId: "j13", itemKey: "svr.protection.db", kind: "frame_capture", label: "Protection – DB board – 14:22:41", capturedAt: "2026-07-03 14:22", featured: true, hue: 265 },
  { id: "e20", jobId: "j13", itemKey: "svr.protection.solar", kind: "frame_capture", label: "Protection – inverter cupboard – 14:26:03", capturedAt: "2026-07-03 14:26", featured: true, hue: 45 },
  { id: "e21", jobId: "j13", itemKey: "svr.security.alarm", kind: "frame_capture", label: "Security – alarm panel – 14:39:27", capturedAt: "2026-07-03 14:39", hue: 330 },
  { id: "e22", jobId: "j13", itemKey: "svr.exposure.street", kind: "frame_capture", label: "Exposure – street from gate – 14:44:55", capturedAt: "2026-07-03 14:44", hue: 190 },
  // j16 — residential survey, report submitted
  { id: "e23", jobId: "j16", itemKey: "svr.construction.elevations", kind: "frame_capture", label: "Construction – front elevation – 09:12:31", capturedAt: "2026-07-04 09:12", featured: true, hue: 155 },
  { id: "e24", jobId: "j16", itemKey: "svr.maintenance.gutters", kind: "frame_capture", label: "Maintenance – gutters/fascias – 09:25:14", capturedAt: "2026-07-04 09:25", hue: 35 },
];

// --- Seeded checklist responses ----------------------------------------------
// Give the report-generation demos real content: answers, notes and concern
// flags flow into findings/cause/recommendations prefills.
export interface SeedResponse {
  jobId: string;
  itemKey: string;
  answer?: string;
  note?: string;
  concernFlag?: boolean;
  concernNote?: string;
  state?: "answered" | "missing";
  missingReason?: string;
}

export const seedResponses: SeedResponse[] = [
  // j6 — geyser missing items (drives Awaiting evidence + upload page)
  { jobId: "j6", itemKey: "gey.docs.plumber", state: "missing", missingReason: "will upload later" },
  { jobId: "j6", itemKey: "gey.unit.plate", state: "missing", missingReason: "will upload later" },
  // j7 — storm (report generation demo)
  { jobId: "j7", itemKey: "sto.opening.discovery", answer: "Severe thunderstorm on 2026-06-30 ±17:30; damage discovered the next morning." },
  { jobId: "j7", itemKey: "sto.cause.weather", answer: "SAWS severe thunderstorm warning plus local station data confirm a convective storm over the suburb on 2026-06-30 — event corroborated." },
  { jobId: "j7", itemKey: "sto.cause.pattern", answer: "Yes" },
  { jobId: "j7", itemKey: "sto.cause.maintenance", answer: "Average", concernFlag: true, concernNote: "North-elevation gutters show pre-existing rust — separated from storm-attributable damage." },
  { jobId: "j7", itemKey: "sto.cause.single", answer: "Single event" },
  { jobId: "j7", itemKey: "sto.roof.adequate", answer: "Yes" },
  { jobId: "j7", itemKey: "sto.internal.longstanding", answer: "No" },
  // j8 — power surge (submitted report demo)
  { jobId: "j8", itemKey: "srg.opening.discovery", answer: "Surge at load-shedding restoration on 2026-07-01 18:32; fridge, oven and Wi-Fi equipment failed immediately after." },
  { jobId: "j8", itemKey: "srg.db.protection", answer: "No", concernFlag: true, concernNote: "No surge protection module on the DB — advisory note for the insurer." },
  { jobId: "j8", itemKey: "srg.event.timing", answer: "Stage 4 restoration window 18:30; neighbours report the same event." },
  { jobId: "j8", itemKey: "srg.items.behaviour", answer: "No" },
  // j13 — residential survey (survey report generation demo)
  { jobId: "j13", itemKey: "svr.construction.roof", answer: "Tile" },
  { jobId: "j13", itemKey: "svr.construction.walls", answer: "Brick/Block" },
  { jobId: "j13", itemKey: "svr.construction.thatch", concernFlag: true, concernNote: "Thatch lapa ±4 m from the dwelling; no lightning protection observed." },
  { jobId: "j13", itemKey: "svr.occupancy.type", answer: "Owner-occupied" },
  { jobId: "j13", itemKey: "svr.protection.solar", concernFlag: true, concernNote: "Inverter and batteries in an unventilated passage cupboard — Requirement: relocate/ventilate within 30 days." },
  { jobId: "j13", itemKey: "svr.security.warranties", answer: "Alarm warranty met (monitored, armed response active). Electric fence certificate of compliance outstanding." },
  { jobId: "j13", itemKey: "svr.grading.recommendations", answer: "1. Requirement (30 days): ventilate or relocate the inverter/battery installation.\n2. Improvement (next renewal): lightning protection for the thatch lapa.\n3. Improvement (90 days): provide electric fence certificate of compliance." },
  { jobId: "j13", itemKey: "svr.grading.grade", answer: "B — Good" },
  { jobId: "j13", itemKey: "svr.grading.comment", answer: "Well-maintained dwelling with good security; recommendations relate to the thatch lapa and the inverter installation." },
  { jobId: "j13", itemKey: "svr.grading.surveyable", answer: "Yes" },
  // j16 — residential survey (submitted; physical survey recommended)
  { jobId: "j16", itemKey: "svr.grading.grade", answer: "C — Acceptable" },
  { jobId: "j16", itemKey: "svr.grading.surveyable", answer: "No", concernFlag: true, concernNote: "Roof and rear outbuildings could not be adequately shown on camera." },
  { jobId: "j16", itemKey: "svr.grading.recommendations", answer: "1. Requirement (30 days): repair perimeter electric fence and provide certificate of compliance.\n2. Improvement (90 days): service fire extinguisher and mount at kitchen exit." },
  { jobId: "j16", itemKey: "svr.grading.comment", answer: "Acceptable risk subject to requirements; virtual vantage was insufficient for the roof — physical survey recommended." },
];

// --- Lookups ------------------------------------------------------------------
export const clientById = (id: string) => clients.find((c) => c.id === id);
export const userById = (id?: string) => users.find((u) => u.id === id);
export const templateById = (id: string) => templates.find((t) => t.id === id);
export const jobById = (id: string) => jobs.find((j) => j.id === id);
export const jobByToken = (token: string) => jobs.find((j) => j.token === token);
export const evidenceForJob = (jobId: string) => evidence.filter((e) => e.jobId === jobId);
