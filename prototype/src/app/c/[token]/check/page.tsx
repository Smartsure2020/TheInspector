// S10 — Camera/mic check (polished, Chunk 1C). Server wrapper guards link state;
// the interactive check is client-side (plain getUserMedia, provider-agnostic).
import { redirect } from "next/navigation";
import { resolveToken } from "@/lib/data";
import { DeviceCheck } from "@/components/DeviceCheck";

export const dynamic = "force-dynamic";

export default async function CheckPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = resolveToken(token);
  if (info.state === "invalid" || info.state === "revoked" || info.state === "expired") redirect(`/c/${token}`);
  return <DeviceCheck token={token} />;
}
