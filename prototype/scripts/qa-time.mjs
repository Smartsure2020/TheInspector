// Timezone-independence check for stored-timestamp handling (F24):
//   npm run qa:time
// Re-runs the same assertions under several process timezones (UTC, SAST, US Eastern, Auckland);
// every result must be identical, because nothing may depend on the server's local timezone.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ZONES = ["UTC", "Africa/Johannesburg", "America/New_York", "Pacific/Auckland"];

if (process.argv[2] === "--child") {
  const { parseUtcStamp, parseWallStamp, utcStampFromMs, wallStampFromMs, wallParts } = await import("../src/lib/time.ts");
  const iso = (ms) => new Date(ms).toISOString();
  const results = {
    // UTC instants (written by nowIso)
    utc_seconds: iso(parseUtcStamp("2026-10-06 08:23:01")),
    utc_minutes: iso(parseUtcStamp("2026-10-06 08:23")),
    utc_T_form: iso(parseUtcStamp("2026-10-06T08:23:01")),
    // Wall-clock business time (SAST, UTC+2)
    wall_morning: iso(parseWallStamp("2026-10-07 09:00")),
    wall_midnight: iso(parseWallStamp("2026-10-07 00:30")),
    wall_with_seconds: iso(parseWallStamp("2026-10-07 09:00:30")),
    // 24 h link expiry derived from a wall start, incl. month/year rollover
    expiry_plain: wallStampFromMs(parseWallStamp("2026-10-07 09:00") + 24 * 3600_000),
    expiry_month_end: wallStampFromMs(parseWallStamp("2026-10-31 23:30") + 24 * 3600_000),
    expiry_year_end: wallStampFromMs(parseWallStamp("2026-12-31 22:00") + 24 * 3600_000),
    // wall <-> instant round trips
    roundtrip_wall: wallStampFromMs(parseWallStamp("2026-03-01 00:05")),
    roundtrip_utc: utcStampFromMs(parseUtcStamp("2026-03-01 00:05:09")),
    // form defaults: 05:15Z is 07:15 SAST; 23:10Z is 01:10 SAST next day
    parts_morning: JSON.stringify(wallParts(Date.UTC(2026, 9, 6, 5, 15))),
    parts_next_day: JSON.stringify(wallParts(Date.UTC(2026, 9, 6, 23, 10))),
    // invalid input must be NaN, never a guessed date
    bad_empty: String(parseWallStamp("")),
    bad_null: String(parseUtcStamp(null)),
    bad_text: String(parseWallStamp("tomorrow 9am")),
    bad_date_only: String(parseWallStamp("2026-10-07")),
  };
  console.log(JSON.stringify(results));
  process.exit(0);
}

const expected = {
  utc_seconds: "2026-10-06T08:23:01.000Z",
  utc_minutes: "2026-10-06T08:23:00.000Z",
  utc_T_form: "2026-10-06T08:23:01.000Z",
  wall_morning: "2026-10-07T07:00:00.000Z",
  wall_midnight: "2026-10-06T22:30:00.000Z",
  wall_with_seconds: "2026-10-07T07:00:30.000Z",
  expiry_plain: "2026-10-08 09:00",
  expiry_month_end: "2026-11-01 23:30",
  expiry_year_end: "2027-01-01 22:00",
  roundtrip_wall: "2026-03-01 00:05",
  roundtrip_utc: "2026-03-01 00:05:09",
  parts_morning: JSON.stringify({ date: "2026-10-06", time: "07:15" }),
  parts_next_day: JSON.stringify({ date: "2026-10-07", time: "01:10" }),
  bad_empty: "NaN",
  bad_null: "NaN",
  bad_text: "NaN",
  bad_date_only: "NaN",
};

const self = fileURLToPath(import.meta.url);
let failed = 0;
for (const tz of ZONES) {
  const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", self, "--child"], {
    env: { ...process.env, TZ: tz }, encoding: "utf8",
  });
  if (r.status !== 0) { console.log(`FAIL  TZ=${tz}: child error\n${r.stderr}`); failed++; continue; }
  const got = JSON.parse(r.stdout.trim().split("\n").pop());
  const bad = Object.keys(expected).filter((k) => got[k] !== expected[k]);
  if (bad.length) {
    failed++;
    console.log(`FAIL  TZ=${tz}`);
    for (const k of bad) console.log(`        ${k}: got ${got[k]}  want ${expected[k]}`);
  } else console.log(`PASS  TZ=${tz.padEnd(20)} ${Object.keys(expected).length} checks`);
}
console.log(failed ? `\n${failed} timezone(s) failed` : `\nAll ${ZONES.length} timezones identical and correct.`);
process.exit(failed ? 1 : 0);
