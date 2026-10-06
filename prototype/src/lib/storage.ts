// Storage interface (Chunk 1C). Dev = local disk under prototype/db/uploads
// (gitignored). Staging/prod = S3-compatible bucket via STORAGE_PROVIDER=s3.
import "server-only";
import fs from "fs";
import path from "path";

export type StorageProvider = "local" | "s3";
export const storageProvider: StorageProvider =
  process.env.STORAGE_PROVIDER === "s3" ? "s3" : "local";

// ---- local helpers ----

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
// Staging-safe limit shared with client components (see limits.ts for why it is not 15 MB).
export { MAX_UPLOAD_BYTES } from "./limits";

// ---- lazy S3 client (only loaded when STORAGE_PROVIDER=s3) ----

// Staging/prod config uses S3_-prefixed variables (Vercel reserves the AWS_* names):
//   S3_REGION (default af-south-1), S3_BUCKET (required),
//   S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY (least-privilege key; set both or neither).
// With neither key set the SDK's default credential chain is used (AWS_* env,
// shared profile, IAM/instance role) — for local runs and AWS-hosted deployments.
let _s3: import("@aws-sdk/client-s3").S3Client | undefined;
async function s3client() {
  if (_s3) return _s3;
  const { S3Client } = await import("@aws-sdk/client-s3");
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!!accessKeyId !== !!secretAccessKey)
    throw new Error("S3 credentials misconfigured: set both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY, or neither.");
  _s3 = new S3Client({
    region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "af-south-1",
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
  return _s3;
}

const bucket = () => {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("STORAGE_PROVIDER=s3 requires S3_BUCKET to be set.");
  return b;
};

// ---- public API (async for both providers) ----

export async function saveUpload(id: string, mime: string, bytes: Buffer): Promise<string> {
  const ext = extFromMime[mime] ?? "bin";
  const fileKey = `uploads/${id}.${ext}`;

  if (storageProvider === "s3") {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3client();
    await client.send(new PutObjectCommand({
      Bucket: bucket(),
      Key: fileKey,
      Body: bytes,
      ContentType: mime,
    }));
    return fileKey;
  }

  fs.writeFileSync(path.join(uploadDir(), `${id}.${ext}`), bytes);
  return fileKey;
}

export async function readUpload(fileKey: string): Promise<Buffer | undefined> {
  if (storageProvider === "s3") {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3client();
    try {
      const response = await client.send(new GetObjectCommand({
        Bucket: bucket(),
        Key: fileKey,
      }));
      return Buffer.from(await response.Body!.transformToByteArray());
    } catch {
      return undefined;
    }
  }

  const name = path.basename(fileKey);
  const p = path.join(uploadDir(), name);
  return fs.existsSync(p) ? fs.readFileSync(p) : undefined;
}

export async function getPresignedUrl(fileKey: string, expiresIn = 900): Promise<string> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = await s3client();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket(),
    Key: fileKey,
  }), { expiresIn });
}
