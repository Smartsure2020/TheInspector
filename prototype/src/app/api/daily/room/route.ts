import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Daily.co not configured — set DAILY_API_KEY in .env.local" },
      { status: 503 }
    );
  }

  const name = req.nextUrl.searchParams.get("name");
  const identity = req.nextUrl.searchParams.get("identity");
  if (!name || !identity) {
    return NextResponse.json({ error: "name and identity are required" }, { status: 400 });
  }

  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);

  try {
    // Create or get existing room
    let roomUrl: string;
    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600,
          enable_chat: false,
          enable_knocking: false,
          max_participants: 3,
        },
      }),
    });

    if (createRes.ok) {
      const room = await createRes.json();
      roomUrl = room.url;
    } else if (createRes.status === 400) {
      // Room may already exist
      const getRes = await fetch(`https://api.daily.co/v1/rooms/${safeName}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!getRes.ok) {
        return NextResponse.json({ error: "Failed to get existing room" }, { status: 500 });
      }
      const room = await getRes.json();
      roomUrl = room.url;
    } else {
      const text = await createRes.text();
      return NextResponse.json({ error: `Room creation failed: ${text}` }, { status: 500 });
    }

    // Create meeting token
    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: safeName,
          user_name: identity,
          exp: Math.floor(Date.now() / 1000) + 3600,
          is_owner: identity === "assessor",
        },
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return NextResponse.json({ error: `Token creation failed: ${text}` }, { status: 500 });
    }

    const { token } = await tokenRes.json();
    return NextResponse.json({ url: roomUrl, token });
  } catch (e) {
    return NextResponse.json(
      { error: `Daily API error: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
