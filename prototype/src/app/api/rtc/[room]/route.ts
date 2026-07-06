// In-app signaling + messaging channel for the P2P adapter (Chunk 1D).
// Presence + per-peer message queues, in-memory (single dev-server process).
// PROTOTYPE ONLY: a managed provider (or a durable channel) replaces this at
// provider selection; the adapter interface hides it from the room components.
import { NextRequest } from "next/server";

interface Envelope { from: string; to: string; type: string; payload?: unknown; at: number }
interface Room {
  queues: Map<string, Envelope[]>;
  lastSeen: Map<string, number>;
}

declare global {
  // eslint-disable-next-line no-var
  var __rtcRooms: Map<string, Room> | undefined;
}
const rooms = () => (globalThis.__rtcRooms ??= new Map());

const FRESH_MS = 8000;

function room(key: string): Room {
  let r = rooms().get(key);
  if (!r) {
    r = { queues: new Map(), lastSeen: new Map() };
    rooms().set(key, r);
  }
  return r;
}

const presence = (r: Room) => {
  const now = Date.now();
  const fresh = (p: string) => now - (r.lastSeen.get(p) ?? 0) < FRESH_MS;
  return { assessor: fresh("assessor"), client: fresh("client"), waiting: fresh("waiting") };
};

// GET /api/rtc/{room}?peer=assessor — heartbeat + drain this peer's queue.
export async function GET(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: key } = await params;
  const peer = req.nextUrl.searchParams.get("peer") ?? "unknown";
  const r = room(key);
  r.lastSeen.set(peer, Date.now());
  const q = r.queues.get(peer) ?? [];
  r.queues.set(peer, []);
  return Response.json({ messages: q, presence: presence(r) });
}

// POST /api/rtc/{room}  body: {from, to, type, payload}
export async function POST(req: NextRequest, { params }: { params: Promise<{ room: string }> }) {
  const { room: key } = await params;
  const body = (await req.json()) as Envelope;
  const r = room(key);
  r.lastSeen.set(body.from, Date.now());
  const q = r.queues.get(body.to) ?? [];
  q.push({ ...body, at: Date.now() });
  if (q.length > 200) q.splice(0, q.length - 200); // bound memory
  r.queues.set(body.to, q);
  return Response.json({ ok: true, presence: presence(r) });
}
