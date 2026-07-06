// Repeatable QA/demo smoke suite (Phase 1 QA pass). Run against a RUNNING dev
// server with a freshly reset database (npm run reset:demo, then npm run dev):
//
//   npm run qa:smoke
//
// Checks every demo-critical route returns 200 and carries its marker wording.
// This is a render-level regression net for the pristine seeded book — deep
// interaction flows (capture loop, review cycle, locking) stay on the manual
// regression checklist (../phase1/regression-checklist.md).
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

// [route, [must-contain strings], description]
const CHECKS = [
  ["/", ["Admin / Coordinator", "Assessor / Surveyor", "Manager / Reviewer", "demo-storm"], "role picker + demo links"],
  ["/admin", ["INS-2026-0001", "SRV-2026-0014", "Burst Pipe", "Residential Risk Survey"], "admin pipeline shows multi-peril + survey book"],
  ["/assessor", ["Assessor dashboard"], "assessor dashboard renders"],
  ["/manager", ["Review queue", "survey report"], "manager queue renders incl. survey variant"],
  // NOTE markers match the server-rendered HTML/flight payload. Next.js splits
  // JSX text into chunks (e.g. " (v","0.1-1F"), so markers must be single-chunk
  // substrings; UI-only strings from client bundles (picker tag text) can't be
  // asserted here and are covered by the manual checklist instead.
  ["/jobs/new", ["not bookable", "is_limited", "Storm Damage", "Residential Risk Survey"], "template picker: fire disabled server-side, limited flag delivered"],
  ["/jobs/j3", ["INS-2026-0003", "Storm Damage", "0.1-1F"], "primary storm demo job"],
  ["/jobs/j3/schedule", ["Reschedule"], "schedule page"],
  ["/jobs/j5/room", ["Power Surge", "P2P (provider-agnostic"], "live room + provider-agnostic adapter"],
  ["/jobs/j6/evidence", ["Evidence gallery"], "evidence gallery"],
  ["/jobs/j7/report", ["Report builder", "LIMITATIONS", "maintenance"], "storm report builder + limitations"],
  ["/jobs/j8/report/final", ["Virtual Assessment Report", "Power Surge"], "submitted surge report"],
  ["/jobs/j10/report/final", ["approved", "Report completed"], "approved + locked geyser report"],
  ["/jobs/j13/report", ["COPE", "Recommendations register", "Risk grading", "SURVEY LIMITATIONS"], "survey report builder (no cause-of-loss)"],
  ["/jobs/j16/report/final", ["Virtual Risk Survey Report", "NOT adequately surveyable"], "survey report: physical-survey limitation"],
  ["/jobs/j15", ["0.1-1F-limited"], "commercial survey flagged limited"],
  ["/c/demo-storm", ["do NOT climb", "storm", "early"], "storm client link: early state + safety wording"],
  ["/c/demo-acc", ["damaged item"], "accidental client link"],
  ["/c/demo-theft", ["SAPS"], "theft client link"],
  ["/c/demo-survey", ["risk survey"], "survey client link"],
  ["/c/demo-upload/upload", ["Upload these when you have them", "no app needed"], "missing-evidence upload page"],
  ["/c/not-a-real-token", ["isn't recognised"], "invalid link state"],
  ["/api/pack/j7", null, "evidence pack endpoint (zip)"],
];

let pass = 0, fail = 0;
for (const [path, markers, desc] of CHECKS) {
  const url = BASE + path;
  try {
    const res = await fetch(url);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    if (markers) {
      const text = await res.text();
      const missing = markers.filter((m) => !text.toLowerCase().includes(m.toLowerCase()));
      if (missing.length) throw new Error(`missing marker(s): ${missing.join(" | ")}`);
    } else {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (!(buf[0] === 0x50 && buf[1] === 0x4b)) throw new Error("not a ZIP (no PK header)");
    }
    console.log(`PASS  ${path}  — ${desc}`);
    pass++;
  } catch (err) {
    console.error(`FAIL  ${path}  — ${desc}: ${err.message}`);
    fail++;
  }
}

console.log(`\n${pass} passed, ${fail} failed (of ${CHECKS.length}).`);
if (fail) {
  console.log("Note: this suite expects the pristine seeded book — run `npm run reset:demo` (server stopped) and restart the server first.");
  process.exit(1);
}
