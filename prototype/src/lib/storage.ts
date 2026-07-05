// Storage interface (Chunk 1C). Prototype = local disk under prototype/db/uploads
// (gitignored). This stays behind one module so the production port (S3-compatible
// bucket + signed URLs, Tier B hardening) swaps implementations, not callers.
import "server-only";
import fs from "fs";
import path from "path";

const uploadDir = () => {
  const dir = path.join(process.cwd(), "db", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const extFromMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

export const ALLOWED_UPLOAD_MIMES = Object.keys(extFromMime);
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function saveUpload(id: string, mime: string, bytes: Buffer): string {
  const ext = extFromMime[mime] ?? "bin";
  const fileKey = `uploads/${id}.${ext}`;
  fs.writeFileSync(path.join(uploadDir(), `${id}.${ext}`), bytes);
  return fileKey;
}

export function readUpload(fileKey: string): Buffer | undefined {
  const name = path.basename(fileKey); // no path traversal
  const p = path.join(uploadDir(), name);
  return fs.existsSync(p) ? fs.readFileSync(p) : undefined;
}
