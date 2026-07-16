import "server-only";
import { createHash, randomBytes } from "crypto";

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function randomOtp(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}
