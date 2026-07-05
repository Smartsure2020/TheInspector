// Serves uploaded evidence files by evidence id (Chunk 1C).
// PROTOTYPE: unauthenticated like every other route (placeholder access model).
// Production hardening replaces this with signed URLs + access logging (Tier B).
import { getEvidence } from "@/lib/data";
import { readUpload } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ev = getEvidence(id);
  if (!ev?.file_key) return new Response("Not found", { status: 404 });
  const bytes = readUpload(ev.file_key);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": ev.mime_type ?? "application/octet-stream",
      "Cache-Control": "private, max-age=60",
    },
  });
}
