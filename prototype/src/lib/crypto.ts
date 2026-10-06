import "server-only";
import { createHash, randomBytes, randomInt } from "crypto";

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function randomOtp(): string {
  // CSPRNG (Math.random is predictable and must not be used for security codes)
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
