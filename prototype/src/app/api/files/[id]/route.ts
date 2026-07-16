import { getEvidence } from "@/lib/data";
import { readUpload, storageProvider, getPresignedUrl } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { resolveToken } from "@/lib/data";
import { logAccess } from "@/lib/access-log";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getSession();
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  let actorId: string | null = null;
  if (user) {
    actorId = user.id;
  } else if (token) {
    const info = await resolveToken(token);
    if (!info.job || info.state === "revoked" || info.state === "invalid")
      return new Response("Unauthorized", { status: 401 });
    actorId = "client_link";
  } else {
    return new Response("Unauthorized", { status: 401 });
  }

  const ev = await getEvidence(id);
  if (!ev?.file_key) return new Response("Not found", { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAccess(actorId, "evidence_file", id, "download", ip);

  if (storageProvider === "s3") {
    const presigned = await getPresignedUrl(ev.file_key);
    return Response.redirect(presigned, 302);
  }

  const bytes = await readUpload(ev.file_key);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": ev.mime_type ?? "application/octet-stream",
      "Cache-Control": "private, max-age=60",
    },
  });
}
