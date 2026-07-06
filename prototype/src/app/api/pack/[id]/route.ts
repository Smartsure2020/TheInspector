// Evidence pack download (Chunk 1E). Store-only ZIP: all non-discarded
// evidence files named by section/item, plus index.csv (the evidence index).
// Deliberately NO hashing/integrity chain yet (Tier B hardening, excluded).
import { NextRequest } from "next/server";
import { getJob, listEvidence } from "@/lib/data";
import { buildReportModel } from "@/lib/report";
import { readUpload } from "@/lib/storage";
import { buildZip, csv, ZipEntry } from "@/lib/zip";

const safe = (s: string) => s.replace(/[^\w\d\- .]+/g, "_").replace(/_{2,}/g, "_").slice(0, 80);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  const model = buildReportModel(id);
  if (!job || !model) return new Response("Unknown job", { status: 404 });

  const evidence = listEvidence(id);
  const entries: ZipEntry[] = [];
  const indexRows: (string | number | boolean | null)[][] = [
    ["fig", "filename", "label", "kind", "section", "checklist_item", "captured_at", "featured", "note"],
  ];

  for (const row of model.evidenceIndex) {
    const e = evidence.find((x) => x.id === row.id)!;
    let filename = "";
    let note = "";
    if (e.file_key) {
      const bytes = readUpload(e.file_key);
      if (bytes) {
        const ext = e.file_key.split(".").pop() ?? "bin";
        filename = `${String(row.fig).padStart(2, "0")}-${safe(row.section)}-${safe(e.label)}.${ext}`;
        entries.push({ name: `evidence/${filename}`, data: bytes });
      } else {
        note = "file missing on disk";
      }
    } else {
      note = "placeholder tile (seeded demo item, no file)";
    }
    indexRows.push([row.fig, filename, e.label, row.kind, row.section, row.item, row.capturedAt, row.featured, note]);
  }

  // UTF-8 BOM so Excel/PowerShell read the labels' dashes correctly.
  entries.push({ name: "index.csv", data: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(csv(indexRows), "utf8")]) });
  entries.push({
    name: "README.txt",
    data: Buffer.from(
      `PROTOTYPE evidence pack — ${job.job_number} (${job.claim_number})\n` +
      `Generated ${new Date().toISOString()} — demo/anonymised data only, no real client data.\n` +
      `No integrity chain/hashing yet (production hardening item).\n`,
      "utf8"
    ),
  });

  const zip = buildZip(entries);
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${job.job_number}-evidence-pack.zip"`,
      "Content-Length": String(zip.length),
    },
  });
}
