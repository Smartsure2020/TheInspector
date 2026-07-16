import { NextRequest } from "next/server";
import { getJob, listEvidence } from "@/lib/data";
import { buildReportModel } from "@/lib/report";
import { readUpload } from "@/lib/storage";
import { buildZip, csv, ZipEntry } from "@/lib/zip";
import { getSession } from "@/lib/auth";
import { logAccess } from "@/lib/access-log";

const safe = (s: string) => s.replace(/[^\w\d\- .]+/g, "_").replace(/_{2,}/g, "_").slice(0, 80);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const job = await getJob(id);
  const model = await buildReportModel(id);
  if (!job || !model) return new Response("Unknown job", { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAccess(user.id, "evidence_pack", id, "download", ip);

  const evidence = await listEvidence(id);
  const entries: ZipEntry[] = [];
  const indexRows: (string | number | boolean | null)[][] = [
    ["fig", "filename", "label", "kind", "section", "checklist_item", "captured_at", "featured", "sha256", "note"],
  ];

  for (const row of model.evidenceIndex) {
    const e = evidence.find((x) => x.id === row.id)!;
    let filename = "";
    let note = "";
    if (e.file_key) {
      const bytes = await readUpload(e.file_key);
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
    const sha = (e as unknown as { sha256?: string }).sha256 ?? "";
    indexRows.push([row.fig, filename, e.label, row.kind, row.section, row.item, row.capturedAt, row.featured, sha, note]);
  }

  entries.push({ name: "index.csv", data: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(csv(indexRows), "utf8")]) });
  entries.push({
    name: "README.txt",
    data: Buffer.from(
      `Evidence pack — ${job.job_number} (${job.claim_number})\n` +
      `Generated ${new Date().toISOString()}\n` +
      `SHA-256 hashes recorded at capture time; verify against index.csv.\n`,
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
