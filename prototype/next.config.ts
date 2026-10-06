import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname) },
  serverExternalPackages: ["better-sqlite3"],
  // Server-action body cap. Kept under Vercel's ~4.5 MB request limit and above MAX_UPLOAD_BYTES
  // (src/lib/limits.ts). Direct-to-S3 upload is required before any real-client pilot.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
