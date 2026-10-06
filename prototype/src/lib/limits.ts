// Upload size limits shared by server and client code (no imports on purpose —
// this file is safe to import from "use client" components).
//
// STAGING-SAFE LIMIT (Phase 5C): uploads currently travel through a Next.js server
// action, which on Vercel is capped at ~4.5 MB per request body. The limit below
// sits under that cap (and under `serverActions.bodySizeLimit` in next.config.ts)
// so an oversize file is refused up front with a clear message instead of failing
// silently at the platform edge. It is NOT a fix for 15 MB high-res photos:
// direct-to-S3 (presigned) upload is REQUIRED before any real-client pilot.
export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "3.5 MB";

export const uploadTooLargeMessage = (what = "file") =>
  `That ${what} is too large to send (limit ${MAX_UPLOAD_LABEL}). ` +
  `Please retake it at a lower resolution or choose a smaller file. Nothing has been lost.`;
