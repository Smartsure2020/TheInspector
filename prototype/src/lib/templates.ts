// Checklist template library — Chunk 1F (multi-assessment & survey activation).
// Content is seeded from the planning docs: 04-claim-templates.md (claims),
// 05-survey-templates.md (surveys) and phase0/08-physical-trigger-matrix.md
// (physical/hybrid/escalation trigger wording). Geyser + accidental carry over
// unchanged from the Phase 0 v0.2 signed-off review sheets.
// ALL templates are demo content pending assessor workshop sign-off.
import { ChecklistTemplate, TemplateItem, TemplateSection } from "./types";

// --- shared spines -----------------------------------------------------------

const opening = (prefix: string): TemplateSection => ({
  key: `${prefix}.opening`,
  title: "Opening",
  items: [
    { key: `${prefix}.opening.identity`, prompt: "Confirm identity of person on camera and relationship to policyholder", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
    { key: `${prefix}.opening.address`, prompt: "Loss address matches risk address (anchor shot where practical)", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show the street or gate from a window so we can confirm the address" },
    { key: `${prefix}.opening.discovery`, prompt: "Date of loss and how it was discovered", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true },
    { key: `${prefix}.opening.mitigation`, prompt: "Emergency mitigation done? By whom? Invoices kept?", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: false },
    { key: `${prefix}.opening.prior`, prompt: "Prior claims or unrepaired prior damage?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
  ],
});

const closing = (prefix: string): TemplateSection => ({
  key: `${prefix}.closing`,
  title: "Closing",
  items: [
    { key: `${prefix}.closing.panorama`, prompt: "Panoramic context shot of each affected area", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please turn slowly so we can see the whole room" },
    { key: `${prefix}.closing.allshown`, prompt: "Client confirms all claimed damage has been shown", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
  ],
});

const surveyOpening = (prefix: string): TemplateSection => ({
  key: `${prefix}.opening`,
  title: "Opening",
  items: [
    { key: `${prefix}.opening.identity`, prompt: "Confirm identity of person on camera and authority over the property", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
    { key: `${prefix}.opening.address`, prompt: "Property matches the risk address (street/gate anchor shot)", answerType: "yes_no", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the street or gate entrance so we can confirm the address" },
    { key: `${prefix}.opening.orientation`, prompt: "Brief orientation: property layout, structures on site, what we will walk through", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: false },
  ],
});

const surveyClosing = (prefix: string): TemplateSection => ({
  key: `${prefix}.closing`,
  title: "Closing",
  items: [
    { key: `${prefix}.closing.panorama`, prompt: "Panoramic context shots of the main areas surveyed", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please turn slowly so we can see the whole area" },
    { key: `${prefix}.closing.allshown`, prompt: "Client confirms all requested areas were shown; nothing withheld", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
  ],
});

// A–E grading + recommendations tail shared by both surveys (05-survey §5.1/8).
const surveyGrading = (prefix: string): TemplateSection => ({
  key: `${prefix}.grading`,
  title: "Recommendations & grading",
  items: [
    { key: `${prefix}.grading.recommendations`, prompt: "Convert adverse observations to recommendations — Requirement (condition of cover) vs Improvement (advisory), with timeline (immediate / 30 days / 90 days / next renewal)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true },
    { key: `${prefix}.grading.grade`, prompt: "Risk grade (surveyor's judgement — NOT auto-computed)", answerType: "choice", options: ["A — Excellent", "B — Good", "C — Acceptable", "D — Poor", "E — Unacceptable"], evidenceRequired: false, allowSkip: false, concernCapable: false },
    { key: `${prefix}.grading.comment`, prompt: "Overall comment supporting the grade; items requiring underwriter referral", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true },
    { key: `${prefix}.grading.surveyable`, prompt: "Is this risk adequately surveyable virtually? (No → physical survey recommendation goes in the report)", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true },
  ],
});

const item = (i: TemplateItem) => i; // readability helper for long lists

// --- claims templates --------------------------------------------------------

const geyser: ChecklistTemplate = {
  id: "tpl-geyser",
  name: "Geyser / Water Damage",
  claimType: "geyser_water",
  jobType: "assessment",
  version: "0.2",
  referenceOnly: false,
  sections: [
    opening("gey"),
    {
      key: "gey.unit",
      title: "Geyser unit",
      items: [
        item({ key: "gey.unit.wide", prompt: "Geyser wide shot showing location", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please show the geyser and the space around it" }),
        item({ key: "gey.unit.plate", prompt: "Rating plate close-up — make, serial, capacity, manufacture date", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Photograph the sticker/plate on the geyser — hold steady, fill the screen" }),
        item({ key: "gey.unit.failure", prompt: "Point of failure if visible (burst seam, element flange, fitting)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show where the water came from" }),
        item({ key: "gey.unit.tray", prompt: "Drip tray and overflow pipe — presence, routing, condition", answerType: "yes_no", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show underneath the geyser" }),
        item({ key: "gey.unit.valves", prompt: "Pressure control / safety valve and vacuum breakers", answerType: "yes_no", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the pipes and valves next to the geyser" }),
        item({ key: "gey.unit.age", prompt: "Age of geyser and evidence source (plate / invoice / estimate)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "gey.unit.mode", prompt: "Sudden burst or gradual leak? How long was water present?", answerType: "choice", options: ["Sudden burst", "Gradual leak", "Unclear"], evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "gey.damage",
      title: "Resultant damage",
      items: [
        item({ key: "gey.damage.ceiling", prompt: "Ceiling boards, cornices — stains, sagging, collapse", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please point the camera at the ceiling damage" }),
        item({ key: "gey.damage.walls", prompt: "Walls and paintwork water damage", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the wall damage up close, then step back" }),
        item({ key: "gey.damage.floors", prompt: "Floor coverings affected", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the floor damage" }),
        item({ key: "gey.damage.contents", prompt: "Each affected contents item, one by one", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show each damaged item one at a time" }),
        item({ key: "gey.damage.consistent", prompt: "Resultant damage consistent with failure mode and timeline?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "gey.docs",
      title: "Documents",
      items: [
        item({ key: "gey.docs.plumber", prompt: "Plumber's report and invoice", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: false, clientInstruction: "Hold the plumber's invoice up to the camera, or we'll send an upload link" }),
        item({ key: "gey.docs.quotes", prompt: "Quotes for resultant damage repairs", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false }),
        item({ key: "gey.docs.contents", prompt: "Contents replacement quotes / proof", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    closing("gey"),
  ],
};

const accidental: ChecklistTemplate = {
  id: "tpl-accidental",
  name: "Accidental Damage",
  claimType: "accidental",
  jobType: "assessment",
  version: "0.2",
  referenceOnly: false,
  sections: [
    opening("acc"),
    {
      key: "acc.item",
      title: "Damaged item",
      items: [
        item({ key: "acc.item.overall", prompt: "Damaged item — overall shots", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please show the whole item" }),
        item({ key: "acc.item.closeup", prompt: "Damage close-ups from multiple angles", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please show the damage up close from a few angles" }),
        item({ key: "acc.item.serial", prompt: "Serial / model plate", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Photograph the serial number sticker — hold steady, fill the screen" }),
        item({ key: "acc.item.functional", prompt: "Item partially functional? (powers on, screen state)", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: false, clientInstruction: "Please switch the item on so we can see what it does" }),
        item({ key: "acc.item.mechanism", prompt: "Damage physically consistent with described mechanism?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "acc.scene",
      title: "Incident location",
      items: [
        item({ key: "acc.scene.walkthrough", prompt: "Client walks through what happened at the location", answerType: "text", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show us where it happened and talk us through it" }),
        item({ key: "acc.scene.related", prompt: "Related damage (surface it fell onto, liquid residue)", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "acc.docs",
      title: "Documents",
      items: [
        item({ key: "acc.docs.quote", prompt: "Repair quote or BER letter", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false }),
        item({ key: "acc.docs.proof", prompt: "Purchase proof (receipt, statement, packaging with serial)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true }),
      ],
    },
    closing("acc"),
  ],
};

// Storm — 04-claim-templates §4.2. Roof is SAFE VANTAGE ONLY (trigger T3):
// never instruct the client onto a roof or ladder.
const storm: ChecklistTemplate = {
  id: "tpl-storm",
  name: "Storm Damage",
  claimType: "storm",
  jobType: "assessment",
  version: "0.1-1F",
  referenceOnly: false,
  sections: [
    opening("sto"),
    {
      key: "sto.exterior",
      title: "Exterior elevations",
      items: [
        item({ key: "sto.exterior.elevations", prompt: "Exterior elevations — wide shots of every affected side", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please walk around the outside and show each side of the building from a distance" }),
        item({ key: "sto.exterior.trees", prompt: "Fallen trees/branches and what they struck", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false, clientInstruction: "Please show the fallen tree or branches and what they landed on" }),
        item({ key: "sto.exterior.temprepairs", prompt: "Temporary repairs (tarpaulins etc.) — reasonable and invoiced?", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    {
      key: "sto.roof",
      title: "Roof (safe vantage only)",
      items: [
        item({ key: "sto.roof.view", prompt: "Roof damage as viewable from ground / window / safe vantage — NEVER ask the client onto a roof or ladder (standing safety rule, T3)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "From the ground or a window only — please do NOT climb anywhere — show us the roof as best you can" }),
        item({ key: "sto.roof.elements", prompt: "Displaced/broken tiles or sheeting, flashing, ridge capping (as visible)", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please zoom in on the damaged part of the roof from where you are standing" }),
        item({ key: "sto.roof.adequate", prompt: "Roof adequately viewable from safe vantage? If No and roof is material to quantum → HYBRID: recommend physical/drone inspection of the roof (T3)", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "sto.gutters",
      title: "Gutters & downpipes",
      items: [
        item({ key: "sto.gutters.damage", prompt: "Gutter and downpipe damage claimed", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the gutters and downpipes along the damaged side" }),
        item({ key: "sto.gutters.condition", prompt: "Pre-existing condition — rust, sagging, blockage? (maintenance vs storm separation)", answerType: "yes_no", evidenceRequired: true, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "sto.internal",
      title: "Internal water ingress",
      items: [
        item({ key: "sto.internal.ceilings", prompt: "Ingress points — ceilings, around windows/doors", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show where the water came in — ceiling and window areas" }),
        item({ key: "sto.internal.walls", prompt: "Wall and cornice water damage inside", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false, clientInstruction: "Please show the wall damage up close, then step back" }),
        item({ key: "sto.internal.longstanding", prompt: "Old stains, bubbling paint or mould indicating long-standing ingress?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "sto.site",
      title: "Fences, walls & outbuildings",
      items: [
        item({ key: "sto.site.fences", prompt: "Fences and boundary walls claimed", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false, clientInstruction: "Please walk along the damaged fence or wall and show both sides" }),
        item({ key: "sto.site.outbuildings", prompt: "Carports, outbuildings, paving, pool equipment claimed", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    {
      key: "sto.contents",
      title: "Contents (where applicable)",
      items: [
        item({ key: "sto.contents.items", prompt: "Affected contents, item by item", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show each damaged item one at a time" }),
      ],
    },
    {
      key: "sto.cause",
      title: "Storm event & maintenance separation",
      items: [
        item({ key: "sto.cause.weather", prompt: "Date/time of storm vs known weather activity — record corroboration source and finding (goes in the report)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "sto.cause.pattern", prompt: "Damage pattern consistent with wind/hail/rain of the reported event?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "sto.cause.maintenance", prompt: "Pre-storm maintenance state of the damaged elements", answerType: "choice", options: ["Well maintained", "Average", "Poor — deferred maintenance"], evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "sto.cause.single", prompt: "Single event, or accumulation of prior damage?", answerType: "choice", options: ["Single event", "Accumulated damage", "Unclear"], evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "sto.docs",
      title: "Documents",
      items: [
        item({ key: "sto.docs.quotes", prompt: "Repair quotes (roof, ceilings, painting, fencing)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false }),
        item({ key: "sto.docs.emergency", prompt: "Invoices for emergency/temporary repairs", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false }),
        item({ key: "sto.docs.photos", prompt: "Client's own photos from the time of the event (request originals via upload link)", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    closing("sto"),
  ],
};

// Theft / burglary — 04-claim-templates §4.3. Concern wording stays NEUTRAL:
// record observations factually; never allege staging; accumulating concerns →
// STOP→ESCALATE to investigator (T5), client never hears trigger language.
const theft: ChecklistTemplate = {
  id: "tpl-theft",
  name: "Theft / Burglary",
  claimType: "theft",
  jobType: "assessment",
  version: "0.1-1F",
  referenceOnly: false,
  sections: [
    opening("thf"),
    {
      key: "thf.entry",
      title: "Point of entry",
      items: [
        item({ key: "thf.entry.point", prompt: "Point of entry — close-up AND context shots (door/lock/window/burglar bars)", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please show where they got in — up close first, then step back" }),
        item({ key: "thf.entry.marks", prompt: "Tool marks; broken glass position (inside vs outside)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the marks on the door or frame, and where the glass fell" }),
        item({ key: "thf.entry.forcible", prompt: "Forcible and violent entry evident, consistent with policy requirements?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "thf.other",
      title: "Other entry points",
      items: [
        item({ key: "thf.other.points", prompt: "All other potential entry points — confirm secured/undamaged", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please walk past the other doors and windows so we can see they are intact" }),
      ],
    },
    {
      key: "thf.security",
      title: "Security measures",
      items: [
        item({ key: "thf.security.physical", prompt: "Burglar bars, security gates, beams, electric fence, CCTV as fitted", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the security features — gates, bars, cameras" }),
        item({ key: "thf.security.alarm", prompt: "Alarm panel/keypad close-up; armed status; alarm company signage/contract", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the alarm keypad and any alarm company sticker or sign" }),
        item({ key: "thf.security.monitored", prompt: "Alarm armed and monitored at the time? Armed response attended? (request alarm company event report)", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "thf.security.warranties", prompt: "Each policy security warranty: requirement → observed status → evidence reference", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "thf.saps",
      title: "SAPS & records",
      items: [
        item({ key: "thf.saps.case", prompt: "SAPS case number, station, date reported (number on camera or via upload)", answerType: "text", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Please hold the SAPS case number or SMS up to the camera" }),
        item({ key: "thf.saps.timeline", prompt: "Who was home / where was the insured; timeline of discovery", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "thf.items",
      title: "Item locations",
      items: [
        item({ key: "thf.items.locations", prompt: "Locations items were taken from (empty TV bracket, jewellery drawer, safe)", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please show each spot where something was taken from" }),
        item({ key: "thf.items.safe", prompt: "Safe (if jewellery/firearms claimed) — type, mounting, damage; specified items stored per policy?", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show the safe, how it is mounted, and any damage to it" }),
        item({ key: "thf.items.remaining", prompt: "Remaining similar items (lifestyle consistency)", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
        item({ key: "thf.items.interior", prompt: "General interior condition (ransacking vs targeted removal) — record factually", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please give us a slow look around the rooms that were disturbed" }),
      ],
    },
    {
      key: "thf.ownership",
      title: "Proof of ownership",
      items: [
        item({ key: "thf.ownership.proof", prompt: "Per significant item: receipts, statements, photos in situ, valuation certificates", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Hold receipts or valuations up to the camera, or we'll send an upload link" }),
        item({ key: "thf.ownership.serials", prompt: "Serial numbers for electronics (known / partially known / unknown)", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "thf.assessment",
      title: "Assessment (neutral wording)",
      items: [
        item({ key: "thf.assessment.consistent", prompt: "Account consistent with physical evidence? Record observations and inconsistencies factually — never state or imply 'staged'", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "thf.assessment.escalate", prompt: "Concern pattern accumulating? → wrap up courteously and escalate to investigator (STOP→ESCALATE, T5); do NOT probe further on camera", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    closing("thf"),
  ],
};

// General non-motor catch-all — 04-claim-templates §4.6. Peril selector first;
// then complete only the cause section matching the peril (others stay
// skippable). Not a template builder — one flexible checklist.
const general: ChecklistTemplate = {
  id: "tpl-general",
  name: "General Non-Motor (peril selector)",
  claimType: "general",
  jobType: "assessment",
  version: "0.1-1F",
  referenceOnly: false,
  sections: [
    opening("gen"),
    {
      key: "gen.peril",
      title: "Peril selection",
      items: [
        item({ key: "gen.peril.type", prompt: "Select the peril — cause-specific prompts below follow the selection", answerType: "choice", options: ["Power surge", "Burst pipe / water (non-geyser)", "Impact damage", "Glass", "Malicious damage", "Other building damage", "Other contents damage"], evidenceRequired: false, allowSkip: false, concernCapable: false }),
        item({ key: "gen.peril.insured", prompt: "What actually caused the loss, and is it an insured peril? (policy-relevance note, not the claims decision)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "gen.damage",
      title: "Damage overview",
      items: [
        item({ key: "gen.damage.context", prompt: "Context shots of the property/affected area", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please step back and show the whole area first" }),
        item({ key: "gen.damage.closeups", prompt: "Close-ups of all claimed damage/items, one by one", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please show each damaged item or area up close" }),
        item({ key: "gen.damage.preexisting", prompt: "Pre-existing condition / maintenance contribution?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "gen.damage.accumulated", prompt: "Accumulated damage claimed as a single event?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "gen.surge",
      title: "If power surge (skip otherwise)",
      items: [
        item({ key: "gen.surge.db", prompt: "DB board — wide and close-up; surge protection present?", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please open the electrical board and show the switches up close" }),
        item({ key: "gen.surge.appliances", prompt: "All affected appliances + rating/serial plates", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show each affected appliance and photograph its serial sticker" }),
        item({ key: "gen.surge.timing", prompt: "Event timing — load-shedding schedule / utility fault context", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "gen.pipe",
      title: "If burst pipe / water (skip otherwise)",
      items: [
        item({ key: "gen.pipe.section", prompt: "The failed pipe section and access point", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the pipe that failed and where the plumber got to it" }),
        item({ key: "gen.pipe.path", prompt: "Water path from source to claimed damage", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please walk us from the pipe to each damaged area" }),
        item({ key: "gen.pipe.mode", prompt: "Sudden burst or gradual leak? How long was water present?", answerType: "choice", options: ["Sudden burst", "Gradual leak", "Unclear"], evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "gen.impact",
      title: "If impact / glass / malicious (skip otherwise)",
      items: [
        item({ key: "gen.impact.object", prompt: "Impact: the impacting object/vehicle evidence; third-party details (driver/insurer, SAPS accident ref)", answerType: "text", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show what hit the building and any damage to it" }),
        item({ key: "gen.impact.glass", prompt: "Glass: broken pane(s) in context + close-up; glass position", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the broken glass — the whole window, then up close" }),
        item({ key: "gen.impact.malicious", prompt: "Malicious damage: scene as found; SAPS case reference", answerType: "text", evidenceRequired: true, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "gen.docs",
      title: "Documents",
      items: [
        item({ key: "gen.docs.cause", prompt: "Cause-supporting documents (electrician / plumber / technician report as applicable)", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: false }),
        item({ key: "gen.docs.quotes", prompt: "Repair/replacement quotes", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false }),
        item({ key: "gen.docs.ownership", prompt: "Proof of ownership for claimed items", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    closing("gen"),
  ],
};

// Power surge — dedicated active template (spec 1F item 5: simple enough to
// stand alone; also remains a peril under General non-motor).
const surge: ChecklistTemplate = {
  id: "tpl-surge",
  name: "Power Surge",
  claimType: "general",
  jobType: "assessment",
  version: "0.1-1F",
  referenceOnly: false,
  sections: [
    opening("srg"),
    {
      key: "srg.db",
      title: "DB board & protection",
      items: [
        item({ key: "srg.db.board", prompt: "DB board — wide shot and close-up of breakers/labels", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please open the electrical board and show the switches up close" }),
        item({ key: "srg.db.protection", prompt: "Surge protection installed? (device visible on the board)", answerType: "yes_no", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show whether there is a surge protector module on the board" }),
        item({ key: "srg.db.earthleakage", prompt: "Earth leakage present and functional (test button state)?", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    {
      key: "srg.event",
      title: "Event & timing",
      items: [
        item({ key: "srg.event.timing", prompt: "Event timing — date/time; load-shedding stage/restoration context if relevant", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "srg.event.circuit", prompt: "Other items on the same circuit — affected or unaffected? (consistency check)", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: true }),
        item({ key: "srg.event.area", prompt: "Neighbours affected / municipal or Eskom fault reference known?", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    {
      key: "srg.items",
      title: "Affected appliances",
      items: [
        item({ key: "srg.items.each", prompt: "Each affected appliance, one by one", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please show each affected appliance one at a time" }),
        item({ key: "srg.items.plates", prompt: "Serial/model plates for each appliance", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: true, clientInstruction: "Photograph the serial sticker on each appliance — hold steady, fill the screen" }),
        item({ key: "srg.items.behaviour", prompt: "Power-on behaviour (dead / partial / tripping)", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: false, clientInstruction: "Please try switching it on so we can see what it does" }),
      ],
    },
    {
      key: "srg.docs",
      title: "Documents",
      items: [
        item({ key: "srg.docs.technician", prompt: "Technician / electrician report on cause of failure", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: false, clientInstruction: "Hold the technician's report up to the camera, or we'll send an upload link" }),
        item({ key: "srg.docs.repair", prompt: "Repair quotes or BER (beyond economic repair) reports", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false }),
        item({ key: "srg.docs.ownership", prompt: "Proof of ownership for high-value items", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    closing("srg"),
  ],
};

// Burst pipe / non-geyser water damage — dedicated active template
// (spec 1F item 6; sudden-vs-gradual is the core dispute, as with geysers).
const burstPipe: ChecklistTemplate = {
  id: "tpl-pipe",
  name: "Burst Pipe / Water Damage (non-geyser)",
  claimType: "general",
  jobType: "assessment",
  version: "0.1-1F",
  referenceOnly: false,
  sections: [
    opening("pip"),
    {
      key: "pip.source",
      title: "Pipe & access point",
      items: [
        item({ key: "pip.source.section", prompt: "Failed pipe section/fitting and the access point (opened wall, under sink, ceiling void)", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please show the pipe that failed and where it was opened up" }),
        item({ key: "pip.source.material", prompt: "Pipe material and apparent condition (corrosion, previous repairs)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "pip.source.mode", prompt: "Sudden burst or gradual leak? How long was water present before action?", answerType: "choice", options: ["Sudden burst", "Gradual leak", "Unclear"], evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "pip.source.maintenance", prompt: "Maintenance concerns contributing (long-term corrosion, known leak left unrepaired)?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "pip.path",
      title: "Water path & resultant damage",
      items: [
        item({ key: "pip.path.route", prompt: "Water path from the pipe to each claimed damage area", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please walk us from the pipe to each damaged area" }),
        item({ key: "pip.path.building", prompt: "Ceilings, walls, floor coverings affected", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false, clientInstruction: "Please show the damaged ceilings, walls and floors" }),
        item({ key: "pip.path.contents", prompt: "Affected contents, item by item", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show each damaged item one at a time" }),
        item({ key: "pip.path.consistent", prompt: "Resultant damage consistent with the failure mode and timeline?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "pip.docs",
      title: "Documents",
      items: [
        item({ key: "pip.docs.plumber", prompt: "Plumber's report and invoice", answerType: "evidence_only", evidenceRequired: true, highRes: true, allowSkip: true, concernCapable: false, clientInstruction: "Hold the plumber's invoice up to the camera, or we'll send an upload link" }),
        item({ key: "pip.docs.quotes", prompt: "Quotes for resultant damage repairs", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: false }),
      ],
    },
    closing("pip"),
  ],
};

// Fire — PHYSICAL-FIRST. Virtual is triage only (trigger T4: anything beyond a
// minor contained fire → STOP→PHYSICAL forensic). referenceOnly keeps it
// non-bookable; the structure documents the triage scope for reviewers.
const fire: ChecklistTemplate = {
  id: "tpl-fire",
  name: "Fire — physical-first (virtual triage only, not bookable)",
  claimType: "fire",
  jobType: "assessment",
  version: "0.1-1F-triage",
  referenceOnly: true,
  sections: [
    {
      key: "fire.scope",
      title: "Scope — read first",
      items: [
        item({ key: "fire.scope.rule", prompt: "A virtual assessment CANNOT determine fire cause. This checklist is triage BEFORE a physical/forensic assessment (T4) — extent, habitability and mitigation only. Confirm the client understands someone will come out in person.", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: false }),
      ],
    },
    {
      key: "fire.triage",
      title: "Virtual triage (safe distance only)",
      items: [
        item({ key: "fire.triage.exterior", prompt: "Exterior context of the property and affected structure — from a safe distance (T7)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "From outside only — please do not enter damaged areas — show us the building" }),
        item({ key: "fire.triage.extent", prompt: "Extent triage room by room as safely visible: structural vs contents vs smoke-only", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: true }),
        item({ key: "fire.triage.habitability", prompt: "Habitability — alternative accommodation trigger?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: false }),
        item({ key: "fire.triage.mitigation", prompt: "Property secured / mitigation needs (boarding up, utilities off)", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: false }),
        item({ key: "fire.triage.brigade", prompt: "Fire brigade attended? Report number if available", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
  ],
};

// --- survey templates --------------------------------------------------------
// 05-survey-templates: COPE + Maintenance/Security/Fire, recommendations
// register, A–E grading (surveyor judgement, never auto-computed).

const residentialSurvey: ChecklistTemplate = {
  id: "tpl-survey-res",
  name: "Residential Risk Survey",
  claimType: "survey_residential",
  jobType: "survey",
  version: "0.1-1F",
  referenceOnly: false,
  sections: [
    surveyOpening("svr"),
    {
      key: "svr.construction",
      title: "Construction",
      items: [
        item({ key: "svr.construction.elevations", prompt: "All elevations — wide shots", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please walk around the house and show each side from a distance" }),
        item({ key: "svr.construction.roof", prompt: "Roof covering as visible (tile / sheet / thatch / slate / concrete)", answerType: "choice", options: ["Tile", "Sheet", "Thatch", "Slate", "Concrete", "Mixed/Other"], evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "From the ground, please show the roof" }),
        item({ key: "svr.construction.walls", prompt: "Wall construction", answerType: "choice", options: ["Brick/Block", "Timber", "Steel", "Mixed", "Other"], evidenceRequired: true, allowSkip: false, concernCapable: true }),
        item({ key: "svr.construction.age", prompt: "Approximate age; additions/alterations and whether approved", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svr.construction.thatch", prompt: "Thatch/lapa/timber elements — distance from dwelling, lightning protection, fire retardant treatment", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show the lapa or thatch structure and how far it is from the house" }),
        item({ key: "svr.construction.outbuildings", prompt: "Outbuildings and separation from the main dwelling", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    {
      key: "svr.occupancy",
      title: "Occupancy",
      items: [
        item({ key: "svr.occupancy.type", prompt: "Occupancy", answerType: "choice", options: ["Owner-occupied", "Tenanted", "Holiday home", "Other"], evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svr.occupancy.unoccupied", prompt: "Periods unoccupied longer than 30/60 days?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svr.occupancy.business", prompt: "Business use from home (stock, clients visiting, equipment)?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svr.occupancy.letting", prompt: "Subletting / short-term letting (Airbnb)?", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "svr.protection",
      title: "Protection (fire & water)",
      items: [
        item({ key: "svr.protection.geyser", prompt: "Geyser installation — drip tray, valves (same standard as the claims template)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the geyser and the pipes and tray around it" }),
        item({ key: "svr.protection.db", prompt: "Electrical DB board — labelling, condition, earth leakage present", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: true, clientInstruction: "Please open the electrical board and show the switches up close" }),
        item({ key: "svr.protection.gas", prompt: "Gas installations — bottle location/size, certificate of conformity held", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show where the gas bottles are and the pipe into the house" }),
        item({ key: "svr.protection.solar", prompt: "Solar/inverter/battery — location, ventilation, installer certificate", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true, clientInstruction: "Please show the inverter and batteries and the space around them" }),
        item({ key: "svr.protection.fireplace", prompt: "Fireplace/braai/flue condition", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false }),
        item({ key: "svr.protection.equipment", prompt: "Fire extinguisher / fire blanket / smoke detectors present?", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    {
      key: "svr.exposure",
      title: "Exposure",
      items: [
        item({ key: "svr.exposure.street", prompt: "Street view from the gate; property level vs road (stormwater)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the street from your gate, both directions" }),
        item({ key: "svr.exposure.neighbours", prompt: "Neighbouring properties / boundaries context", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: false }),
        item({ key: "svr.exposure.flood", prompt: "Flood history of property/street; proximity to rivers, dams", answerType: "yes_no", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svr.exposure.veld", prompt: "Veld/bush interface (wildfire), large trees over structures, retaining walls", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "svr.maintenance",
      title: "Maintenance",
      items: [
        item({ key: "svr.maintenance.gutters", prompt: "Gutters/fascias, visible waterproofing state (deferred maintenance becomes 'storm damage' claims)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show along the roof edge — gutters and fascia boards" }),
        item({ key: "svr.maintenance.walls", prompt: "Boundary walls — cracks/lean; paving; pool area", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
        item({ key: "svr.maintenance.damp", prompt: "Known damp problems; roof last inspected/waterproofed", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: true }),
        item({ key: "svr.maintenance.pool", prompt: "Pool fence/net in place (liability)?", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    {
      key: "svr.security",
      title: "Security",
      items: [
        item({ key: "svr.security.perimeter", prompt: "Perimeter — walls, fencing, electric fence (+ energizer certificate), gates/motors", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the boundary wall or fence and the gate" }),
        item({ key: "svr.security.doors", prompt: "External doors/locks, burglar bars, security gates", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the front and back doors and the burglar bars" }),
        item({ key: "svr.security.alarm", prompt: "Alarm panel — monitored? armed response contract? zones linked; beams/CCTV", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the alarm keypad" }),
        item({ key: "svr.security.safe", prompt: "Safe — type, mounting; SABS category for firearms; jewellery per policy", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
        item({ key: "svr.security.warranties", prompt: "Policy security warranties vs reality — gap per warranty (the single most valuable survey output)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "svr.firerisk",
      title: "Fire risk summary",
      items: [
        item({ key: "svr.firerisk.ignition", prompt: "Ignition sources summary (thatch, fireplaces, gas, electrical, inverters)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svr.firerisk.detection", prompt: "Detection and suppression available (detectors, extinguishers, hose/pool proximity)", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    surveyGrading("svr"),
    surveyClosing("svr"),
  ],
};

// Commercial — LIMITED/prototype depth (spec 1F item 8): bookable, but flagged;
// heavy industrial routes to physical from the start (T8).
const commercialSurvey: ChecklistTemplate = {
  id: "tpl-survey-com",
  name: "Commercial / Property Risk Survey",
  claimType: "survey_commercial",
  jobType: "survey",
  version: "0.1-1F-limited",
  referenceOnly: false,
  limited: true,
  sections: [
    surveyOpening("svc"),
    {
      key: "svc.construction",
      title: "Construction",
      items: [
        item({ key: "svc.construction.elevations", prompt: "All elevations; roof structure/covering from accessible vantage", answerType: "evidence_only", evidenceRequired: true, allowSkip: false, concernCapable: false, clientInstruction: "Please walk the outside of the building and show each side" }),
        item({ key: "svc.construction.class", prompt: "Construction class of walls/roof/floors; sandwich/insulated panels (identify core material if possible)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svc.construction.separation", prompt: "Divisions/tenancies within the building; fire walls/separations between units", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "svc.occupancy",
      title: "Occupancy & process",
      items: [
        item({ key: "svc.occupancy.activities", prompt: "Exact business activities on premises; all tenants and their activities (multi-tenant)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svc.occupancy.storage", prompt: "Storage walk-through — commodity types, stacking height, aisle spacing", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please walk us through the storage areas" }),
        item({ key: "svc.occupancy.hazardous", prompt: "Combustible/hazardous materials & processes (flammable liquids, gas, welding, spraying, charging stations)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
      ],
    },
    {
      key: "svc.protection",
      title: "Protection",
      items: [
        item({ key: "svc.protection.extinguishers", prompt: "Extinguishers/hose reels — count, service dates on labels (SANS 1475)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show a fire extinguisher up close so we can read the service label" }),
        item({ key: "svc.protection.detection", prompt: "Fire detection panel / sprinkler control valves — coverage, monitored where, faults", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
        item({ key: "svc.protection.exits", prompt: "Emergency exits and signage — unobstructed?", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the emergency exits" }),
        item({ key: "svc.protection.electrical", prompt: "DB boards, generators/inverter rooms, fuel storage; electrical certificate of compliance held", answerType: "evidence_only", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "svc.exposure",
      title: "Exposure",
      items: [
        item({ key: "svc.exposure.neighbours", prompt: "Neighbouring buildings/activities per boundary with separation distances; shared walls/roof voids", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show what is next door on each side" }),
        item({ key: "svc.exposure.flood", prompt: "Flood/stormwater history; location context (SASRIA exposure noted, not underwritten here)", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "svc.housekeeping",
      title: "Maintenance & housekeeping",
      items: [
        item({ key: "svc.housekeeping.general", prompt: "Housekeeping in work and storage areas; waste/skips relative to building (strongest predictor of fire severity)", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the yard and where the waste skips stand" }),
        item({ key: "svc.housekeeping.hotwork", prompt: "Smoking policy; hot-work permit system in place?", answerType: "yes_no", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "svc.security",
      title: "Security",
      items: [
        item({ key: "svc.security.perimeter", prompt: "Perimeter, access control, guarding, alarm/CCTV coverage", answerType: "evidence_only", evidenceRequired: true, allowSkip: true, concernCapable: true, clientInstruction: "Please show the entrance and any guard post or cameras" }),
        item({ key: "svc.security.stock", prompt: "Cash handling and high-value stock storage vs policy warranties; key control", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: true }),
      ],
    },
    {
      key: "svc.firerisk",
      title: "Fire risk summary",
      items: [
        item({ key: "svc.firerisk.eml", prompt: "Fire load vs protection adequacy; single biggest fire scenario (qualitative EML narrative)", answerType: "text", evidenceRequired: false, allowSkip: false, concernCapable: true }),
        item({ key: "svc.firerisk.bi", prompt: "Business interruption vulnerability (single premises? key machine? restock lead times?)", answerType: "text", evidenceRequired: false, allowSkip: true, concernCapable: false }),
      ],
    },
    surveyGrading("svc"),
    surveyClosing("svc"),
  ],
};

export const templates: ChecklistTemplate[] = [
  geyser,
  accidental,
  storm,
  theft,
  general,
  surge,
  burstPipe,
  fire,
  residentialSurvey,
  commercialSurvey,
];
