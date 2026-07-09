import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit not configured — set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env.local" },
      { status: 503 }
    );
  }

  const room = req.nextUrl.searchParams.get("room");
  const identity = req.nextUrl.searchParams.get("identity");
  if (!room || !identity) {
    return NextResponse.json({ error: "room and identity are required" }, { status: 400 });
  }

  try {
    const { AccessToken } = await import("livekit-server-sdk");
    const at = new AccessToken(apiKey, apiSecret, { identity });
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
