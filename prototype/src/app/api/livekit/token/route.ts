import { NextRequest, NextResponse } from "next/server";
import { authorizeVideoAccess, denyResponse } from "@/lib/video-access";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  if (!room) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  // Authorize FIRST (before revealing config state or minting anything). Identity and
  // role come from the server, never from the request: staff must be the assigned
  // assessor for this job; clients must hold a valid, OTP-verified link for this job.
  const access = await authorizeVideoAccess(req, room, { liveOnly: true });
  if (!access.ok) return denyResponse(access);

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit not configured — set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env.local" },
      { status: 503 }
    );
  }

  try {
    const { AccessToken } = await import("livekit-server-sdk");
    const at = new AccessToken(apiKey, apiSecret, { identity: access.role, ttl: "2h" });
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json(
      { error: `Token generation failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
